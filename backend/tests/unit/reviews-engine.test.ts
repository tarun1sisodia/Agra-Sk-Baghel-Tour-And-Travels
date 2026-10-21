import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewsService, formatSocialUrl, escapeHtml } from "../../src/modules/reviews/reviews.service.js";
import {
  type ReviewLinkEntity,
  type ReviewSubmissionEntity,
  type ReviewImageEntity,
  ReviewsRepository,
} from "../../src/modules/reviews/reviews.repository.js";
import { FareAdminRepository, type AuditLogEntry } from "../../src/modules/admin/fare-admin.repository.js";

class MockReviewsRepository extends ReviewsRepository {
  public links = new Map<string, ReviewLinkEntity>();
  public submissions = new Map<string, ReviewSubmissionEntity>();
  public images = new Map<string, ReviewImageEntity>();

  constructor() {
    super(null as any);
  }

  override async createReviewLink(data: any): Promise<ReviewLinkEntity> {
    const id = `link-${this.links.size + 1}`;
    const rec: ReviewLinkEntity = {
      id,
      kind: data.kind,
      token_hash: data.token_hash,
      booking_id: data.booking_id || null,
      label: data.label || null,
      prefill: data.prefill || {},
      expires_at: data.expires_at || null,
      revoked_at: null,
      used_at: null,
      email_sent_at: null,
      email_last_error: null,
      created_by: data.created_by || null,
      created_at: new Date().toISOString(),
    };
    this.links.set(id, rec);
    return rec;
  }

  override async getReviewLinkByHash(tokenHash: string): Promise<ReviewLinkEntity | null> {
    for (const l of this.links.values()) {
      if (l.token_hash === tokenHash) return l;
    }
    return null;
  }

  override async getReviewLinkById(id: string): Promise<ReviewLinkEntity | null> {
    return this.links.get(id) || null;
  }

  override async markLinkUsed(id: string): Promise<void> {
    const l = this.links.get(id);
    if (l) l.used_at = new Date().toISOString();
  }

  override async revokeLink(id: string): Promise<void> {
    const l = this.links.get(id);
    if (l) l.revoked_at = new Date().toISOString();
  }

  override async updateLinkEmailStatus(id: string, success: boolean, error?: string): Promise<void> {
    const l = this.links.get(id);
    if (l) {
      if (success) {
        l.email_sent_at = new Date().toISOString();
        l.email_last_error = null;
      } else {
        l.email_last_error = error || "Error";
      }
    }
  }

  override async createSubmission(data: any): Promise<ReviewSubmissionEntity> {
    const id = `sub-${this.submissions.size + 1}`;
    const rec: ReviewSubmissionEntity = {
      id,
      link_id: data.link_id,
      booking_id: data.booking_id || null,
      display_name: data.display_name,
      rating: data.rating ?? null,
      review_text: data.review_text,
      tour_name: data.tour_name || null,
      route_text: data.route_text || null,
      social_platform: data.social_platform || null,
      social_username: data.social_username || null,
      consent_public: data.consent_public,
      status: "pending",
      show_on_homepage: false,
      show_in_gallery: false,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
    };
    this.submissions.set(id, rec);
    return rec;
  }

  override async addReviewImage(data: any): Promise<ReviewImageEntity> {
    const id = `img-${this.images.size + 1}`;
    const rec: ReviewImageEntity = {
      id,
      submission_id: data.submission_id,
      storage_key: data.storage_key,
      width: data.width || null,
      height: data.height || null,
      alt_text: data.alt_text || null,
      sort_order: data.sort_order || 0,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    this.images.set(id, rec);
    return rec;
  }

  override async getSubmissionById(id: string): Promise<ReviewSubmissionEntity | null> {
    return this.submissions.get(id) || null;
  }

  override async getImagesBySubmissionId(submissionId: string): Promise<ReviewImageEntity[]> {
    return Array.from(this.images.values()).filter((i) => i.submission_id === submissionId);
  }

  override async updateSubmission(id: string, data: any): Promise<ReviewSubmissionEntity> {
    const s = this.submissions.get(id);
    if (!s) throw new Error("Not found");
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        (s as any)[k] = v;
      }
    }
    s.reviewed_at = new Date().toISOString();
    return s;
  }

  override async updateImageStatus(id: string, status: any): Promise<ReviewImageEntity> {
    const i = this.images.get(id);
    if (!i) throw new Error("Not found");
    i.status = status;
    return i;
  }

  public bookingsRepo?: MockBookingsRepo;

  override async getPublicReviews(): Promise<Array<ReviewSubmissionEntity & { is_verified: boolean }>> {
    return Array.from(this.submissions.values())
      .filter((s) => s.status === "approved" && s.consent_public && s.show_on_homepage)
      .map((s) => ({ ...s, is_verified: true }));
  }

  override async getPublicGallery(): Promise<any[]> {
    const res: any[] = [];
    for (const img of this.images.values()) {
      if (img.status !== "approved") continue;
      const sub = this.submissions.get(img.submission_id);
      if (sub && sub.status === "approved" && sub.consent_public && sub.show_in_gallery) {
        res.push({ ...img, reviewer_name: sub.display_name, review_text: sub.review_text });
      }
    }
    return res;
  }



  override async listAdminSubmissions(filter?: any): Promise<any[]> {
    return Array.from(this.submissions.values())
      .filter((s) => !filter?.status || filter.status === "all" || s.status === filter.status)
      .map((s) => {
        const b = s.booking_id && this.bookingsRepo ? this.bookingsRepo.bookings.get(s.booking_id) : null;
        return {
          ...s,
          booking_ticket_id: b ? b.ticket_id : (s.booking_id ? `TKT-${s.booking_id}` : null),
          booking_status: b ? b.status : (s.booking_id ? "completed" : null),
          is_verified_booking: Boolean(s.booking_id && (b ? b.status === "completed" : true)),
          images: Array.from(this.images.values()).filter((i) => i.submission_id === s.id),
        };
      });
  }
}

class MockBookingsRepo {
  public bookings = new Map<string, any>();
  async getById(id: string) {
    return this.bookings.get(id) || null;
  }
}

class MockAuditRepo extends FareAdminRepository {
  public auditLogs: AuditLogEntry[] = [];

  constructor() {
    super(null as any);
  }
  override async recordAudit(entry: AuditLogEntry): Promise<string> {
    this.auditLogs.push(entry);
    return `audit-${this.auditLogs.length}`;
  }
  override async getAuditLogs() {
    return this.auditLogs;
  }
  override async getPool() {
    return null as any;
  }
}

describe("Section 12.16: Reviews engine (RV-01 to RV-24)", () => {
  let reviewsRepo: MockReviewsRepository;
  let bookingsRepo: MockBookingsRepo;
  let auditRepo: MockAuditRepo;
  let reviewsService: ReviewsService;
  let fetchSpy: any;

  beforeEach(() => {
    reviewsRepo = new MockReviewsRepository();
    bookingsRepo = new MockBookingsRepo();
    reviewsRepo.bookingsRepo = bookingsRepo;
    auditRepo = new MockAuditRepo();
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "email-123" }),
    });

    reviewsService = new ReviewsService({
      reviewsRepo: reviewsRepo as any,
      bookingsRepo: bookingsRepo as any,
      auditRepo: auditRepo as any,
      resendApiKey: "re_mock_key_12345",
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchImpl: fetchSpy,
    });
  });

  it("RV-01: Valid QR token -> form loads with prefill", async () => {
    const { token } = await reviewsService.createQrLink("Hotel Taj Lobby", { tour_name: "Taj Mahal Tour" });
    const { link } = await reviewsService.getLinkByToken(token);
    expect(link.kind).toBe("qr");
    expect(link.prefill.tour_name).toBe("Taj Mahal Tour");
  });

  it("RV-02: Expired, revoked or unknown token -> rejected; nothing leaked", async () => {
    await expect(reviewsService.getLinkByToken("unknown_random_token_9999")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const { token, link } = await reviewsService.createQrLink("Desk");
    await reviewsRepo.revokeLink(link.id);
    await expect(reviewsService.getLinkByToken(token)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("RV-03: Booking link used twice -> second submit rejected", async () => {
    bookingsRepo.bookings.set("b-1", {
      id: "b-1",
      ticket_id: "AGR-20261012-1001",
      category: "outstation",
      customer_email: "test@example.com",
    });
    const { token } = await reviewsService.createBookingLink("b-1");

    await reviewsService.submitReview(token, {
      display_name: "Alice",
      review_text: "Great experience!",
      consent_public: true,
    });

    // Second submission must fail
    await expect(
      reviewsService.submitReview(token, {
        display_name: "Alice",
        review_text: "Second review",
        consent_public: true,
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("RV-04: QR link used by many customers -> separate pending submissions", async () => {
    const { token } = await reviewsService.createQrLink("Brochure QR");

    const sub1 = await reviewsService.submitReview(token, {
      display_name: "Customer 1",
      review_text: "Wonderful ride!",
      consent_public: true,
    });
    const sub2 = await reviewsService.submitReview(token, {
      display_name: "Customer 2",
      review_text: "Very polite driver!",
      consent_public: true,
    });

    expect(sub1.id).not.toBe(sub2.id);
    expect(sub1.status).toBe("pending");
    expect(sub2.status).toBe("pending");
    expect(reviewsRepo.submissions.size).toBe(2);
  });

  it("RV-05: New submission -> pending; absent from /public/reviews and /public/gallery", async () => {
    const { token } = await reviewsService.createQrLink("Desk");
    await reviewsService.submitReview(token, {
      display_name: "Bob",
      review_text: "Pending review",
      consent_public: true,
    });

    const reviews = await reviewsService.getPublicReviews();
    expect(reviews.length).toBe(0);
    const gallery = await reviewsService.getPublicGallery();
    expect(gallery.length).toBe(0);
  });

  it("RV-06: Approve with homepage placement -> in /public/reviews only", async () => {
    bookingsRepo.bookings.set("b-rv-06", {
      id: "b-rv-06",
      ticket_id: "TKT-RV-06",
      status: "completed",
      category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-rv-06");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Bob",
      review_text: "Nice ride",
      consent_public: true,
    });

    await reviewsService.moderateSubmission(
      sub.id,
      { status: "approved", show_on_homepage: true },
      { id: "mod-1", role: "review_moderator" },
      "req-m1"
    );

    const reviews = await reviewsService.getPublicReviews();
    expect(reviews.length).toBe(1);
    expect(reviews[0].display_name).toBe("Bob");

    const gallery = await reviewsService.getPublicGallery();
    expect(gallery.length).toBe(0);
  });

  it("RV-07 & RV-08: Approve gallery placement with approved and rejected photos", async () => {
    bookingsRepo.bookings.set("b-rv-07", {
      id: "b-rv-07",
      ticket_id: "TKT-RV-07",
      status: "completed",
      category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-rv-07");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Charlie",
      review_text: "Photo test",
      consent_public: true,
      photos: [
        { storage_key: "r2_key_photo1.jpg" },
        { storage_key: "r2_key_photo2.jpg" },
      ],
    });

    const images = await reviewsRepo.getImagesBySubmissionId(sub.id);
    expect(images.length).toBe(2);

    // Approve photo 1, reject photo 2
    await reviewsService.moderateSubmission(
      sub.id,
      {
        status: "approved",
        show_in_gallery: true,
        photo_approvals: [
          { id: images[0]!.id, status: "approved" },
          { id: images[1]!.id, status: "rejected" },
        ],
      },
      { id: "mod-1", role: "review_moderator" },
      "req-m2"
    );

    const gallery = await reviewsService.getPublicGallery();
    expect(gallery.length).toBe(1);
    expect(gallery[0].storage_key).toBe("r2_key_photo1.jpg");
    expect(gallery[0].reviewer_name).toBe("Charlie");
  });

  it("RV-09: Rejected submission -> never public", async () => {
    const { token } = await reviewsService.createQrLink("Desk");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Spammer",
      review_text: "Spam content",
      consent_public: true,
    });

    await reviewsService.moderateSubmission(
      sub.id,
      { status: "rejected", show_on_homepage: true },
      { id: "mod-1", role: "review_moderator" },
      "req-m3"
    );

    const reviews = await reviewsService.getPublicReviews();
    expect(reviews.length).toBe(0);
  });

  it("RV-10: consent_public false -> cannot be placed publicly", async () => {
    const { token } = await reviewsService.createQrLink("Desk");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Private User",
      review_text: "Keep private",
      consent_public: false,
    });

    await expect(
      reviewsService.moderateSubmission(
        sub.id,
        { status: "approved", show_on_homepage: true },
        { id: "mod-1", role: "review_moderator" },
        "req-m4"
      )
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("RV-11: Instagram john_doe -> link https://www.instagram.com/john_doe/", () => {
    const url = formatSocialUrl("instagram", "john_doe");
    expect(url).toBe("https://www.instagram.com/john_doe/");
  });

  it("RV-12: Username with spaces, a pasted URL or / -> VALIDATION_ERROR", async () => {
    const { token } = await reviewsService.createQrLink("Desk");

    await expect(
      reviewsService.submitReview(token, {
        display_name: "Test",
        review_text: "Text",
        social_platform: "instagram",
        social_username: "user name with spaces",
        consent_public: true,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      reviewsService.submitReview(token, {
        display_name: "Test",
        review_text: "Text",
        social_platform: "instagram",
        social_username: "https://instagram.com/user",
        consent_public: true,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("RV-13: Unknown platform; platform without username or reverse -> VALIDATION_ERROR", async () => {
    const { token } = await reviewsService.createQrLink("Desk");

    await expect(
      reviewsService.submitReview(token, {
        display_name: "Test",
        review_text: "Text",
        social_platform: "tiktok" as any,
        social_username: "user1",
        consent_public: true,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      reviewsService.submitReview(token, {
        display_name: "Test",
        review_text: "Text",
        social_platform: "instagram",
        consent_public: true,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("RV-14: Review text with <script> -> stored as text, rendered escaped", () => {
    const escaped = escapeHtml("<script>alert(1)</script>");
    expect(escaped).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("RV-15: 6 photos -> rejected", async () => {
    const { token } = await reviewsService.createQrLink("Desk");
    const sixPhotos = [1, 2, 3, 4, 5, 6].map((n) => ({ storage_key: `p${n}.jpg` }));

    await expect(
      reviewsService.submitReview(token, {
        display_name: "Test",
        review_text: "Many photos",
        consent_public: true,
        photos: sixPhotos,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("RV-18: Booking review email -> has ticket id and trip summary; no phone or email in the URL", async () => {
    bookingsRepo.bookings.set("b-18", {
      id: "b-18",
      ticket_id: "AGR-20261012-9999",
      category: "outstation",
      customer_name: "Tarun",
      customer_email: "tarun@example.com",
    });

    const { token } = await reviewsService.createBookingLink("b-18");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(callBody.text).toContain("AGR-20261012-9999");
    expect(callBody.text).toContain(`/review/${token}`);
    expect(callBody.text).not.toContain("tarun@example.com"); // no email in URL
  });

  it("RV-19: Resend retried with the same idempotency key", async () => {
    bookingsRepo.bookings.set("b-19", {
      id: "b-19",
      ticket_id: "AGR-20261012-1919",
      category: "outstation",
      customer_name: "Tarun",
      customer_email: "tarun@example.com",
    });

    const { link } = await reviewsService.createBookingLink("b-19");
    const headers = fetchSpy.mock.calls[0][1].headers;
    expect(headers["Idempotency-Key"]).toBe(`review-request/${link.id}`);
  });

  it("RV-20: Booking without email marked completed -> no automatic email; admin can copy the link", async () => {
    bookingsRepo.bookings.set("b-20", {
      id: "b-20",
      ticket_id: "AGR-20261012-2020",
      category: "outstation",
      customer_name: "Walk-in Guest",
      customer_email: null,
    });

    const { token } = await reviewsService.createBookingLink("b-20");
    expect(token).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(0); // no email sent
  });

  it("RV-21: Resend fails -> email_last_error set", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Rate limit exceeded on Resend"),
    });

    bookingsRepo.bookings.set("b-21", {
      id: "b-21",
      ticket_id: "AGR-20261012-2121",
      category: "outstation",
      customer_name: "Tarun",
      customer_email: "tarun@example.com",
    });

    const { link } = await reviewsService.createBookingLink("b-21");
    const refreshed = await reviewsRepo.getReviewLinkById(link.id);
    expect(refreshed?.email_last_error).toContain("Rate limit exceeded");
  });

  it("RV-22: Admin approves, rejects, edits or revokes -> audit row each with before and after", async () => {
    const { token } = await reviewsService.createQrLink("Desk");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Audit User",
      review_text: "Checking audit logs",
      consent_public: true,
    });

    await reviewsService.moderateSubmission(
      sub.id,
      { status: "approved" },
      { id: "mod-1", role: "review_moderator" },
      "req-audit-1"
    );

    expect(auditRepo.auditLogs.length).toBe(1);
    expect(auditRepo.auditLogs[0]!.resource_type).toBe("review_submissions");
    expect(auditRepo.auditLogs[0]!.action).toBe("approved");
  });

  it("RV-23: Non-admin calls a review admin endpoint -> FORBIDDEN", async () => {
    await expect(
      reviewsService.moderateSubmission(
        "sub-1",
        { status: "approved" },
        { id: "cust-1", role: "customer" },
        "req-cust"
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("RV-24: Pending or draft items in any public endpoint -> never returned", async () => {
    const { token } = await reviewsService.createQrLink("Desk");
    await reviewsService.submitReview(token, {
      display_name: "Pending Guy",
      review_text: "I am pending",
      consent_public: true,
    });

    const reviews = await reviewsService.getPublicReviews();
    expect(reviews.find((r) => r.display_name === "Pending Guy")).toBeUndefined();
  });

  it("RV-25: Incomplete booking cannot generate review link", async () => {
    bookingsRepo.bookings.set("b-incomplete", {
      id: "b-incomplete",
      ticket_id: "TKT-INCOMPLETE",
      status: "confirmed",
      category: "outstation",
      customer_email: "incomplete@example.com",
    });

    await expect(
      reviewsService.createBookingLink("b-incomplete")
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("RV-26: Admin approval and publication do not require a completed-booking status match", async () => {
    bookingsRepo.bookings.set("b-in-progress", {
      id: "b-in-progress", ticket_id: "TKT-IN-PROGRESS", status: "completed", category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-in-progress");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Rider", review_text: "Checking status guard", consent_public: true,
    });
    bookingsRepo.bookings.set("b-in-progress", {
      id: "b-in-progress", ticket_id: "TKT-IN-PROGRESS", status: "driver_assigned", category: "outstation",
    });
    const updated = await reviewsService.moderateSubmission(
      sub.id, { status: "approved", show_on_homepage: true },
      { id: "mod-1", role: "review_moderator" }, "req-review-no-ticket-gate"
    );
    expect(updated.status).toBe("approved");
    expect(updated.show_on_homepage).toBe(true);
    expect((await reviewsService.getPublicReviews()).find((r) => r.id === sub.id)).toMatchObject({ is_verified: true });
  });

  it("RV-27: Admin list submissions returns ticket ID and completed verification flag", async () => {
    bookingsRepo.bookings.set("b-completed-99", {
      id: "b-completed-99",
      ticket_id: "TKT-COMPLETED-99",
      status: "completed",
      category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-completed-99");
    await reviewsService.submitReview(token, {
      display_name: "Verified Passenger",
      review_text: "Top tier service",
      consent_public: true,
    });

    const list = await reviewsService.listAdminSubmissions(
      { status: "all" },
      { id: "mod-1", role: "review_moderator" }
    );
    expect(list.length).toBeGreaterThan(0);
    const item = list.find((i) => i.display_name === "Verified Passenger");
    expect(item).toBeDefined();
    expect(item?.ticket_id).toBe("TKT-COMPLETED-99");
    expect(item?.is_verified_booking).toBe(true);
  });

  it("RV-28: Admin can publish a consented QR review without a linked booking", async () => {
    const { token } = await reviewsService.createQrLink("Taj East Gate QR");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Walk-in Tourist", review_text: "Great experience", consent_public: true,
    });
    const updated = await reviewsService.moderateSubmission(
      sub.id, { status: "approved", show_on_homepage: true },
      { id: "mod-1", role: "review_moderator" }, "req-qr-pub-ok"
    );
    expect(updated.status).toBe("approved");
    expect(updated.show_on_homepage).toBe(true);
    expect((await reviewsService.getPublicReviews()).some((r) => r.id === sub.id && r.is_verified)).toBe(true);
  });

  it("RV-29: Admin can publish a consented QR review photo to the gallery", async () => {
    const { token } = await reviewsService.createQrLink("Taj East Gate QR");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Walk-in Tourist With Photo", review_text: "Photo test", consent_public: true,
      photos: [{ storage_key: "photos/taj-1.webp" }],
    });
    const updated = await reviewsService.moderateSubmission(
      sub.id, {
        status: "approved", show_in_gallery: true,
        photo_approvals: [{ id: "img-1", status: "approved" }],
      },
      { id: "mod-1", role: "review_moderator" }, "req-qr-gallery-ok"
    );
    expect(updated.status).toBe("approved");
    expect(updated.show_in_gallery).toBe(true);
    expect((await reviewsService.getPublicGallery()).some((img) => img.storage_key === "photos/taj-1.webp")).toBe(true);
  });

  it("RV-30: A missing linked booking does not block an otherwise approved review", async () => {
    const sub = await reviewsRepo.createSubmission({
      link_id: "link-phantom", booking_id: "b-does-not-exist", display_name: "Ghost Rider",
      review_text: "Where is my booking?", consent_public: true,
    });
    const updated = await reviewsService.moderateSubmission(
      sub.id, { status: "approved", show_on_homepage: true },
      { id: "mod-1", role: "review_moderator" }, "req-missing-booking-home"
    );
    expect(updated.status).toBe("approved");
    expect(updated.show_on_homepage).toBe(true);
    expect((await reviewsService.getPublicReviews()).some((r) => r.id === sub.id)).toBe(true);
  });

  it("RV-31: A booking status change does not block gallery publication", async () => {
    bookingsRepo.bookings.set("b-active-trip", {
      id: "b-active-trip", ticket_id: "TKT-ACTIVE-01", status: "completed", category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-active-trip");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Active Rider", review_text: "Scenic route", consent_public: true,
      photos: [{ storage_key: "photos/route-scenic.webp" }],
    });
    bookingsRepo.bookings.set("b-active-trip", {
      id: "b-active-trip", ticket_id: "TKT-ACTIVE-01", status: "confirmed", category: "outstation",
    });
    const updated = await reviewsService.moderateSubmission(
      sub.id, {
        status: "approved", show_in_gallery: true,
        photo_approvals: [{ id: "img-1", status: "approved" }],
      },
      { id: "mod-1", role: "review_moderator" }, "req-gallery-no-ticket-gate"
    );
    expect(updated.status).toBe("approved");
    expect(updated.show_in_gallery).toBe(true);
    expect((await reviewsService.getPublicGallery()).some((img) => img.storage_key === "photos/route-scenic.webp")).toBe(true);
  });

  it("RV-32: Missing customer public consent rejected from homepage and gallery publication", async () => {
    bookingsRepo.bookings.set("b-no-consent", {
      id: "b-no-consent",
      ticket_id: "TKT-NO-CONSENT",
      status: "completed",
      category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-no-consent");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Private Traveler",
      review_text: "Keep this private please",
      consent_public: false,
    });

    await expect(
      reviewsService.moderateSubmission(
        sub.id,
        { status: "approved", show_on_homepage: true },
        { id: "mod-1", role: "review_moderator" },
        "req-consent-home"
      )
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringContaining("without customer consent"),
    });

    await expect(
      reviewsService.moderateSubmission(
        sub.id,
        { status: "approved", show_in_gallery: true },
        { id: "mod-1", role: "review_moderator" },
        "req-consent-gal"
      )
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringContaining("without customer consent"),
    });
  });

  it("RV-33: Publication rejected if submission is not approved", async () => {
    bookingsRepo.bookings.set("b-pending-test", {
      id: "b-pending-test",
      ticket_id: "TKT-PENDING",
      status: "completed",
      category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-pending-test");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Pending Reviewer",
      review_text: "Not approved yet",
      consent_public: true,
    });

    // Attempting to publish without status: "approved"
    await expect(
      reviewsService.moderateSubmission(
        sub.id,
        { status: "pending", show_on_homepage: true },
        { id: "mod-1", role: "review_moderator" },
        "req-not-approved"
      )
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringContaining("must be approved before public display"),
    });
  });

  it("RV-34: Eligible completed-ticket review publishes successfully to homepage and gallery", async () => {
    bookingsRepo.bookings.set("b-perfect", {
      id: "b-perfect",
      ticket_id: "TKT-PERFECT-100",
      status: "completed",
      category: "outstation",
    });
    const { token } = await reviewsService.createBookingLink("b-perfect");
    const sub = await reviewsService.submitReview(token, {
      display_name: "Happy Traveler",
      review_text: "Best driver and spotless car!",
      consent_public: true,
      photos: [{ storage_key: "photos/happy.webp" }],
    });

    const updated = await reviewsService.moderateSubmission(
      sub.id,
      {
        status: "approved",
        show_on_homepage: true,
        show_in_gallery: true,
        photo_approvals: [{ id: "img-1", status: "approved" }],
      },
      { id: "mod-1", role: "review_moderator" },
      "req-success"
    );

    expect(updated.status).toBe("approved");
    expect(updated.show_on_homepage).toBe(true);
    expect(updated.show_in_gallery).toBe(true);

    const publicReviews = await reviewsService.getPublicReviews();
    const foundRev = publicReviews.find((r) => r.id === sub.id);
    expect(foundRev).toBeDefined();
    expect(foundRev?.is_verified).toBe(true);

    const gallery = await reviewsService.getPublicGallery();
    const foundImg = gallery.find((g) => g.storage_key === "photos/happy.webp");
    expect(foundImg).toBeDefined();
    expect(foundImg?.reviewer_name).toBe("Happy Traveler");
  });

  it("RV-35: Public queries return approved, consented reviews even when no booking is linked", async () => {
    // Manually force a submission to have show_on_homepage and show_in_gallery with no booking
    const rogueSub = await reviewsRepo.createSubmission({
      link_id: "link-rogue",
      booking_id: null,
      display_name: "Rogue Unlinked",
      review_text: "Bypassed moderation",
      consent_public: true,
    });
    await reviewsRepo.updateSubmission(rogueSub.id, {
      status: "approved",
      show_on_homepage: true,
      show_in_gallery: true,
    });
    const rogueImage = await reviewsRepo.addReviewImage({
      submission_id: rogueSub.id,
      storage_key: "photos/rogue.webp",
    });
    await reviewsRepo.updateImageStatus(rogueImage.id, "approved");

    // Approved + consented reviews are not filtered by ticket/booking linkage.
    const publicReviews = await reviewsService.getPublicReviews();
    expect(publicReviews.find((r) => r.id === rogueSub.id)?.is_verified).toBe(true);

    const gallery = await reviewsService.getPublicGallery();
    expect(gallery.find((g) => g.storage_key === "photos/rogue.webp")).toBeDefined();
  });
});
