import type { Review } from "./types";

/**
 * Maps server review response to admin Review interface.
 * Rules:
 * - Public consent: missing/unknown/null MUST map strictly to false.
 * - Ticket ID: MUST use bookings.ticket_id or booking_ticket_id, never synthesize a fake TKT-UUID.
 *   If no ticket ID is present, returns "No Ticket".
 */
export function mapAdminReview(r: any): Review {
  return {
    id: String(r.id),
    customerName: r.display_name || r.displayName || r.customerName || "Customer",
    ticketId: r.ticket_id || r.booking_ticket_id || "No Ticket",
    route: r.tour_name || r.route_text || r.route || "General Trip",
    rating: Number(r.rating) || 0,
    text: r.review_text || r.reviewText || r.text || "",
    status: (r.status === "pending_review" ? "pending" : r.status) || "pending",
    showOnHomepage: Boolean(r.show_on_homepage ?? r.showOnHomepage),
    showInGallery: Boolean(r.show_in_gallery ?? r.showInGallery),
    consentPublic: Boolean(r.consent_public ?? r.consentPublic ?? false),
    bookingStatus: r.booking_status || r.bookingStatus || null,
    verifiedBooking: Boolean(r.is_verified_booking ?? r.verifiedBooking),
    socialPlatform: r.social_platform || r.socialPlatform || null,
    socialUsername: r.social_username || r.socialUsername || null,
    socialUrl: r.social_url || r.socialUrl || null,
    rejectionReason: r.rejection_reason || r.rejectionReason || null,
    submittedAt: r.created_at || r.createdAt || r.submittedAt || new Date().toISOString(),
    reviewedBy: r.reviewed_by || r.reviewedBy || null,
    reviewedAt: r.reviewed_at || r.reviewedAt || null,
    images: Array.isArray(r.images) ? r.images : [],
  };
}
