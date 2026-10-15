import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapAdminReview } from "./reviewMapper.ts";

describe("Admin Review Mapper — Safety & Invariant Guarantees", () => {
  it("defaults missing or unknown public consent to false", () => {
    const rawNoConsent = {
      id: "rev-101",
      display_name: "Test Customer",
      ticket_id: "TKT-202610-001",
      review_text: "Great experience",
      status: "approved",
      // consent_public omitted
    };

    const mapped = mapAdminReview(rawNoConsent);
    assert.equal(mapped.consentPublic, false, "Missing consent_public must strictly map to false");
    assert.equal(mapped.showOnHomepage, false);
  });

  it("never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket'", () => {
    const rawNoTicket = {
      id: "rev-102",
      booking_id: "7b43a912-8f1e-4512-bc78-98fbc1234567",
      display_name: "Walk-in Guest",
      review_text: "Quick tour",
      // ticket_id omitted
    };

    const mapped = mapAdminReview(rawNoTicket);
    assert.equal(
      mapped.ticketId,
      "No Ticket",
      "Must not synthesize TKT-7b43a912 from booking UUID; must return 'No Ticket'"
    );
    assert.notEqual(mapped.ticketId, "TKT-7b43a912");
  });

  it("preserves genuine ticket_id or booking_ticket_id when present", () => {
    const rawWithTicket = {
      id: "rev-103",
      ticket_id: "TKT-202610-777",
      display_name: "Suresh Patel",
      rating: 5,
      review_text: "Smooth Agra tour",
      status: "approved",
      consent_public: true,
      show_on_homepage: true,
      show_in_gallery: true,
      is_verified_booking: true,
    };

    const mapped = mapAdminReview(rawWithTicket);
    assert.equal(mapped.ticketId, "TKT-202610-777");
    assert.equal(mapped.consentPublic, true);
    assert.equal(mapped.showOnHomepage, true);
    assert.equal(mapped.showInGallery, true);
    assert.equal(mapped.verifiedBooking, true);
  });
});
