import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapApiReviewToCardReview } from "../src/components/home/reviewsMarqueeHelpers.ts";

describe("ReviewsMarquee — is_verified mapper & badge preservation", () => {
  it("preserves is_verified: true when server indicates verified review", () => {
    const rawApiItem = {
      id: "rev-1",
      display_name: "Aarav Sharma",
      tour_name: "Agra to Jaipur Tour",
      rating: 5,
      review_text: "Excellent service and safe driver.",
      is_verified: true,
      booking_id: "book-123",
      status: "approved",
    };

    const mapped = mapApiReviewToCardReview(rawApiItem);
    assert.equal(mapped.name, "Aarav Sharma");
    assert.equal(mapped.is_verified, true, "is_verified: true must be preserved");
  });

  it("preserves is_verified: false when server review is unverified", () => {
    const rawApiItem = {
      id: "rev-2",
      display_name: "Priya Singh",
      tour_name: "Taj Mahal Sightseeing",
      rating: 5,
      review_text: "Very polite driver.",
      is_verified: false,
      booking_id: "book-456",
      status: "approved",
    };

    const mapped = mapApiReviewToCardReview(rawApiItem);
    assert.equal(mapped.is_verified, false, "is_verified: false must be preserved");
  });

  it("never infers verification from booking_id, status, or social media links", () => {
    // Review has a booking_id, is approved, and has Instagram link, but is_verified is missing/falsy
    const unverifiedWithBookingAndSocial = {
      id: "rev-3",
      display_name: "Vikram Mehta",
      tour_name: "Agra Outstation",
      rating: 4,
      review_text: "Good journey.",
      booking_id: "book-789",
      status: "approved",
      social_platform: "Instagram",
      social_url: "https://instagram.com/vikram",
      is_verified: undefined,
    };

    const mapped = mapApiReviewToCardReview(unverifiedWithBookingAndSocial);
    assert.equal(mapped.is_verified, false, "Must never infer verification from booking IDs or social accounts");
    assert.equal(mapped.role, "Instagram");
  });

  it("safely handles null/missing fields and clamps ratings to 1..5 range", () => {
    const edgeCaseItem = {
      display_name: "Rohan",
      rating: 10,
      review_text: "Top notch",
    };

    const mapped = mapApiReviewToCardReview(edgeCaseItem);
    assert.equal(mapped.rating, 5, "Rating > 5 should be clamped to 5");
    assert.equal(mapped.place, "Agra & Outstation");
    assert.equal(mapped.is_verified, false);
  });
});
