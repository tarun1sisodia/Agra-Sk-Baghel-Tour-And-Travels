import crypto from "node:crypto";
import { AppError } from "../../shared/errors.js";
import type { ReviewsRepository, ReviewLinkEntity, ReviewSubmissionEntity } from "./reviews.repository.js";
import type { BookingsRepository } from "../bookings/bookings.repository.js";
import type { FareAdminRepository } from "../admin/fare-admin.repository.js";
import type { UserRole } from "../../types/domain.js";
import type { MediaStorage } from "../catalog/media.storage.js";
import { reviewObjectPath } from "../catalog/media.storage.js";

export function formatSocialUrl(platform?: string | null, username?: string | null): string | null {
  if (!platform || !username) return null;
  const u = encodeURIComponent(username.trim());
  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${u}/`;
    case "facebook":
      return `https://www.facebook.com/${u}/`;
    case "youtube":
      return `https://www.youtube.com/@${u}`;
    case "x":
      return `https://x.com/${u}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${u}/`;
    default:
      return null;
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface ReviewsServiceDeps {
  reviewsRepo: ReviewsRepository;
  bookingsRepo: BookingsRepository;
  auditRepo?: FareAdminRepository;
  resendApiKey?: string;
  emailFrom?: string;
  customerSiteUrl?: string;
  fetchImpl?: typeof fetch;
  mediaStorage?: MediaStorage | null;
}

export class ReviewsService {
  private fetchImpl: typeof fetch;

  constructor(private deps: ReviewsServiceDeps) {
    this.fetchImpl = deps.fetchImpl ?? fetch;
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async uploadPhoto(token: string, input: { dataBase64: string; mimeType: string }): Promise<{ storage_key: string; mime_type: string }> {
    const { link } = await this.getLinkByToken(token);
    if (!this.deps.mediaStorage) {
      throw new AppError("UNAVAILABLE", "Photo storage is not configured.", 503);
    }
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (!allowed.has(input.mimeType)) throw new AppError("VALIDATION_ERROR", "Unsupported image type.", 400);
    const buffer = Buffer.from(input.dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new AppError("VALIDATION_ERROR", "Image must be between 1 byte and 5 MB.", 400);
    const imageId = crypto.randomUUID();
    const key = reviewObjectPath(link.token_hash, imageId, input.mimeType);
    await this.deps.mediaStorage.upload({ path: key, buffer, mimeType: input.mimeType });
    return { storage_key: key, mime_type: input.mimeType };
  }

  // ===== Link Generation =====
  async createQrLink(label?: string, prefill: Record<string, any> = {}, createdBy?: string): Promise<{ token: string; link: ReviewLinkEntity }> {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const link = await this.deps.reviewsRepo.createReviewLink({
      kind: "qr",
      token_hash: tokenHash,
      label: label ?? null,
      prefill,
      expires_at: expiresAt,
      created_by: createdBy ?? null,
    });

    return { token, link };
  }

  async createBookingLink(bookingId: string, createdBy?: string): Promise<{ token: string; link: ReviewLinkEntity }> {
    const booking = await this.deps.bookingsRepo.getById(bookingId);
    if (!booking) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }
    if (booking.status && booking.status !== "completed") {
      throw new AppError("INVALID_STATE", "Review links can only be generated for completed bookings", 400);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const link = await this.deps.reviewsRepo.createReviewLink({
      kind: "booking",
      token_hash: tokenHash,
      booking_id: bookingId,
      label: `Booking ${booking.ticket_id}`,
      expires_at: expiresAt,
      created_by: createdBy ?? null,
    });

    // RV-18, RV-20: If booking has email, send request
    if (booking.customer_email && this.deps.resendApiKey) {
      await this.sendReviewEmail(link.id, booking, token);
    }

    return { token, link };
  }

  async sendReviewEmail(linkId: string, booking: any, token: string): Promise<boolean> {
    try {
      const reviewUrl = `${(this.deps.customerSiteUrl && this.deps.customerSiteUrl !== "https://agraskbagheltourandtravels.com" ? this.deps.customerSiteUrl : "https://skbagheltravels-customer.coccoder999.workers.dev").replace(/\/+$/, "")}/review/${encodeURIComponent(token)}`;
      const tripSummary = `${booking.category} trip (Ticket ${booking.ticket_id})`;

      let fromAddress = this.deps.emailFrom || "bookings@agraskbagheltourandtravels.com";
      const emailMatch = fromAddress.match(/<([^>]+)>/);
      const cleanEmail = (emailMatch?.[1] || fromAddress).trim();
      const senderDomain = cleanEmail.split("@")[1]?.toLowerCase() || "";
      const freemailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com"];
      if (freemailDomains.includes(senderDomain)) {
        console.warn(
          `[reviews] EMAIL_FROM uses freemail domain (@${senderDomain}) which Resend rejects with 403. Falling back to 'onboarding@resend.dev'.`
        );
        fromAddress = "onboarding@resend.dev";
      }

      const res = await this.fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.deps.resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `review-request/${linkId}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [booking.customer_email],
          subject: `How was your trip with Agra SK Baghel Tour & Travels? (Ticket ${booking.ticket_id})`,
          text: `Dear ${booking.customer_name},\n\nThank you for travelling with us for your ${tripSummary}.\nPlease share your feedback here: ${reviewUrl}\n\nWarm regards,\nAgra SK Baghel Tour & Travels`,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        await this.deps.reviewsRepo.updateLinkEmailStatus(linkId, false, errText);
        return false;
      }

      await this.deps.reviewsRepo.updateLinkEmailStatus(linkId, true);
      return true;
    } catch (err: any) {
      await this.deps.reviewsRepo.updateLinkEmailStatus(linkId, false, err.message);
      return false;
    }
  }

  // ===== Review Form & Submission =====
  async getLinkByToken(token: string): Promise<{ link: ReviewLinkEntity; trip_summary?: any }> {
    const tokenHash = this.hashToken(token);
    const link = await this.deps.reviewsRepo.getReviewLinkByHash(tokenHash);

    // RV-02: Expired, revoked, or unknown
    if (!link) {
      throw new AppError("NOT_FOUND", "Review link not found or invalid", 404);
    }
    if (link.revoked_at) {
      throw new AppError("NOT_FOUND", "Review link has been revoked", 404);
    }
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      throw new AppError("NOT_FOUND", "Review link has expired", 404);
    }
    if (link.kind === "booking" && link.used_at) {
      throw new AppError("VALIDATION_ERROR", "Booking review link has already been used", 400);
    }

    let tripSummary: any = undefined;
    if (link.booking_id) {
      const b = await this.deps.bookingsRepo.getById(link.booking_id);
      if (b) {
        // RV-18: never phone or email in the summary
        tripSummary = {
          ticket_id: b.ticket_id,
          category: b.category,
          pickup_at: b.pickup_at,
          vehicle_model_id: b.vehicle_model_id,
        };
      }
    }

    return { link, trip_summary: tripSummary };
  }

  async submitReview(
    token: string,
    data: {
      display_name: string;
      rating?: number;
      review_text: string;
      tour_name?: string;
      route_text?: string;
      social_platform?: "instagram" | "facebook" | "youtube" | "x" | "linkedin";
      social_username?: string;
      consent_public: boolean;
      photos?: Array<{ storage_key: string; width?: number; height?: number; alt_text?: string }>;
    }
  ): Promise<ReviewSubmissionEntity> {
    const { link } = await this.getLinkByToken(token);

    // RV-03: Booking link used twice -> second submit rejected
    if (link.kind === "booking" && link.used_at) {
      throw new AppError("VALIDATION_ERROR", "This booking review link has already been used", 400);
    }

    // RV-12, RV-13: Validate social platform and username
    if (data.social_platform && !data.social_username) {
      throw new AppError("VALIDATION_ERROR", "Username is required when social platform is selected", 400);
    }
    if (!data.social_platform && data.social_username) {
      throw new AppError("VALIDATION_ERROR", "Social platform is required when username is provided", 400);
    }
    if (data.social_platform && data.social_username) {
      const allowedPlatforms = ["instagram", "facebook", "youtube", "x", "linkedin"];
      if (!allowedPlatforms.includes(data.social_platform)) {
        throw new AppError("VALIDATION_ERROR", "Invalid social platform", 400);
      }
      // RV-12: Username with spaces, a pasted URL or / is rejected
      const username = data.social_username.trim();
      if (!/^[a-zA-Z0-9._-]+$/.test(username) || username.includes("/") || username.includes("http")) {
        throw new AppError("VALIDATION_ERROR", "Invalid social username format", 400);
      }
    }

    // RV-15: At most 5 photos
    if (data.photos && data.photos.length > 5) {
      throw new AppError("VALIDATION_ERROR", "At most 5 photos allowed", 400);
    }

    // RV-14: Escaped text
    const escapedText = escapeHtml(data.review_text);

    // Create submission as 'pending' (RV-05)
    const submission = await this.deps.reviewsRepo.createSubmission({
      link_id: link.id,
      booking_id: link.booking_id,
      display_name: data.display_name.trim(),
      rating: data.rating ?? null,
      review_text: escapedText,
      tour_name: data.tour_name?.trim() || null,
      route_text: data.route_text?.trim() || null,
      social_platform: data.social_platform || null,
      social_username: data.social_username?.trim() || null,
      consent_public: Boolean(data.consent_public),
    });

    if (data.photos && data.photos.length > 0) {
      const tokenHashPrefix = `reviews/${link.token_hash}/`;
      for (const [i, photo] of data.photos.entries()) {
        if (this.deps.mediaStorage && (!photo.storage_key.startsWith(tokenHashPrefix) || photo.storage_key.includes(".."))) {
          throw new AppError("VALIDATION_ERROR", "Review photos must be uploaded through the review photo endpoint.", 400);
        }
        await this.deps.reviewsRepo.addReviewImage({
          submission_id: submission.id,
          storage_key: photo.storage_key,
          width: photo.width,
          height: photo.height,
          alt_text: photo.alt_text,
          sort_order: i + 1,
        });
      }
    }

    // If booking link, mark used (RV-03)
    if (link.kind === "booking") {
      await this.deps.reviewsRepo.markLinkUsed(link.id);
    }

    return submission;
  }

  // ===== Moderation =====
  async moderateSubmission(
    id: string,
    action: {
      status?: "pending" | "approved" | "rejected";
      show_on_homepage?: boolean;
      show_in_gallery?: boolean;
      review_text?: string;
      display_name?: string;
      rejection_reason?: string;
      photo_approvals?: Array<{ id: string; status: "approved" | "rejected" }>;
    },
    actor: { id: string; role: UserRole },
    requestId: string
  ): Promise<ReviewSubmissionEntity> {
    // RV-23: Non-admin -> FORBIDDEN
    if (actor.role !== "super_admin" && actor.role !== "review_moderator") {
      throw new AppError("FORBIDDEN", "Review moderator role required", 403);
    }

    const before = await this.deps.reviewsRepo.getSubmissionById(id);
    if (!before) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }

    const effectiveStatus = action.status ?? before.status;
    const requestedHomepage = action.show_on_homepage !== undefined ? action.show_on_homepage : before.show_on_homepage;
    const requestedGallery = action.show_in_gallery !== undefined ? action.show_in_gallery : before.show_in_gallery;
    const isRejecting = action.status === "rejected";

    // Public display requires approval and explicit customer consent.
    // A ticket/booking match is contextual metadata, not an approval or badge requirement.
    if (!isRejecting && (requestedHomepage || requestedGallery)) {
      if (effectiveStatus !== "approved") {
        throw new AppError("VALIDATION_ERROR", "Review must be approved before public display", 400);
      }
      if (!before.consent_public) {
        throw new AppError("VALIDATION_ERROR", "Review cannot be placed publicly without customer consent", 400);
      }
    }

    const showOnHomepage = isRejecting ? false : (action.show_on_homepage ?? before.show_on_homepage);
    const showInGallery = isRejecting ? false : (action.show_in_gallery ?? before.show_in_gallery);

    const updated = await this.deps.reviewsRepo.updateSubmission(id, {
      status: action.status,
      show_on_homepage: showOnHomepage,
      show_in_gallery: showInGallery,
      review_text: action.review_text ? escapeHtml(action.review_text) : undefined,
      display_name: action.display_name?.trim(),
      reviewed_by: actor.id,
      rejection_reason: action.rejection_reason,
    });

    if (action.photo_approvals) {
      for (const p of action.photo_approvals) {
        await this.deps.reviewsRepo.updateImageStatus(p.id, p.status);
      }
    }

    // RV-22: Audit logging
    if (this.deps.auditRepo) {
      await this.deps.auditRepo.recordAudit({
        actor_id: actor.id,
        actor_role: actor.role,
        resource_type: "review_submissions",
        resource_id: id,
        action: action.status || "update",
        before_state: before,
        after_state: updated,
        request_id: requestId,
      });
    }

    // Outbox: enqueue site_publish_events for automated customer site rebuilding
    const wasPublishedOnHomepage = before.status === "approved" && before.consent_public && before.show_on_homepage;
    const isNowPublishedOnHomepage = updated.status === "approved" && updated.consent_public && updated.show_on_homepage;

    if (!wasPublishedOnHomepage && isNowPublishedOnHomepage) {
      await this.deps.reviewsRepo.enqueuePublishEvent(id, "published").catch(() => {});
    } else if (wasPublishedOnHomepage && !isNowPublishedOnHomepage) {
      await this.deps.reviewsRepo.enqueuePublishEvent(id, "archived").catch(() => {});
    } else if (wasPublishedOnHomepage && isNowPublishedOnHomepage) {
      const textChanged = action.review_text !== undefined && action.review_text !== before.review_text;
      const nameChanged = action.display_name !== undefined && action.display_name !== before.display_name;
      if (textChanged || nameChanged) {
        await this.deps.reviewsRepo.enqueuePublishEvent(id, "updated").catch(() => {});
      }
    }

    return updated;
  }

  // ===== Admin Listings =====
  async listAdminSubmissions(
    filter: { status?: string; limit?: number; offset?: number } = {},
    actor: { id: string; role: UserRole }
  ) {
    if (actor.role !== "super_admin" && actor.role !== "review_moderator") {
      throw new AppError("FORBIDDEN", "Review moderator role required", 403);
    }
    const rows = await this.deps.reviewsRepo.listAdminSubmissions(filter);
    return rows.map((r) => ({
      id: r.id,
      link_id: r.link_id,
      booking_id: r.booking_id,
      ticket_id: r.booking_ticket_id || null,
      booking_status: r.booking_status || null,
      is_verified_booking: Boolean(r.is_verified_booking),
      display_name: r.display_name,
      rating: r.rating,
      review_text: r.review_text,
      tour_name: r.tour_name,
      route_text: r.route_text,
      social_platform: r.social_platform,
      social_username: r.social_username,
      social_url: formatSocialUrl(r.social_platform, r.social_username),
      consent_public: r.consent_public,
      status: r.status,
      show_on_homepage: r.show_on_homepage,
      show_in_gallery: r.show_in_gallery,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at,
      images: (r.images || []).map((img) => ({
        id: img.id,
        storage_key: img.storage_key,
        url: `/api/v1/public/review-media/${encodeURIComponent(img.id)}`,
        status: img.status,
        alt_text: img.alt_text,
      })),
    }));
  }

  // ===== Public Listings =====
  async getPublicReviews(): Promise<any[]> {
    // RV-05, RV-06, RV-09, RV-24: Approved, consented, show_on_homepage only
    const rows = await this.deps.reviewsRepo.getPublicReviews();
    return rows.map((r: any) => ({
      id: r.id,
      display_name: r.display_name,
      rating: r.rating,
      review_text: r.review_text,
      tour_name: r.tour_name,
      route_text: r.route_text,
      social_url: formatSocialUrl(r.social_platform, r.social_username),
      social_platform: r.social_platform,
      is_verified: Boolean(r.is_verified),
      created_at: r.created_at,
    }));
  }

  async getReviewImageById(id: string) {
    return this.deps.reviewsRepo.getReviewImageById(id);
  }

  async getPublicGallery(): Promise<any[]> {
    // RV-07, RV-08, RV-24: Approved photos with approved, consented submissions only
    const rows = await this.deps.reviewsRepo.getPublicGallery();
    return rows.map((img) => ({
      id: img.id,
      storage_key: img.storage_key,
      url: `/api/v1/public/review-media/${encodeURIComponent(img.id)}`,
      width: img.width,
      height: img.height,
      alt_text: img.alt_text,
      reviewer_name: img.reviewer_name,
      review_text: img.review_text,
    }));
  }
}
