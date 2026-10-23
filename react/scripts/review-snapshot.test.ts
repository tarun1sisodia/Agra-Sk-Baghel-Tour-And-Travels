import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePublicReviewSnapshot } from "./review-snapshot.ts";

describe("normalizePublicReviewSnapshot", () => {
  it("reads reviews from the public API's { success, reviews } response", () => {
    const reviews = normalizePublicReviewSnapshot({
      success: true,
      reviews: [{
        display_name: "A Traveler",
        tour_name: "Agra day tour",
        rating: 5,
        review_text: "Wonderful trip.",
        is_verified: true,
      }],
    });
    assert.deepEqual(reviews, [{
      name: "A Traveler",
      place: "Agra day tour",
      rating: 5,
      quote: "Wonderful trip.",
      role: undefined,
      is_verified: true,
    }]);
  });

  it("continues to accept the older data-array response and filters unusable rows", () => {
    const reviews = normalizePublicReviewSnapshot({
      data: [
        { name: "Reviewer", quote: "Good service", rating: 7 },
        { name: "", quote: "Missing name" },
      ],
    });
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].rating, 5);
    assert.equal(reviews[0].is_verified, true);
  });
});
