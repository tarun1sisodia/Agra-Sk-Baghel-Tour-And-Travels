import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePublicReviewSnapshot } from "./review-snapshot.ts";

describe("normalizePublicReviewSnapshot", () => {
  it("reads reviews from the public API's { success, reviews } response", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: `review-${i}`,
      display_name: i === 0 ? "A Traveler" : `Traveler ${i}`,
      tour_name: "Agra day tour",
      rating: 5,
      review_text: i === 0 ? "Wonderful trip." : `Wonderful trip ${i}.`,
      is_verified: true,
    }));
    const reviews = normalizePublicReviewSnapshot({
      success: true,
      reviews: rows,
    });
    assert.deepEqual(reviews[0], {
      name: "A Traveler",
      place: "Agra day tour",
      rating: 5,
      quote: "Wonderful trip.",
      role: undefined,
      is_verified: true,
    });
    assert.equal(reviews.length, 10);
  });

  it("continues to accept the older data-array response and filters unusable rows", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      name: `Reviewer ${i}`,
      quote: `Good service ${i}`,
      rating: 7,
    }));
    const reviews = normalizePublicReviewSnapshot({
      data: [...rows, { name: "", quote: "Missing name" }],
    });
    assert.equal(reviews.length, 10);
    assert.equal(reviews[0].rating, 5);
    assert.equal(reviews[0].is_verified, true);
  });

  it("does not publish a partial marquee snapshot below ten reviews", () => {
    const reviews = Array.from({ length: 9 }, (_, i) => ({
      id: `review-${i}`,
      display_name: `Reviewer ${i}`,
      review_text: `Experience ${i}`,
    }));
    assert.deepEqual(normalizePublicReviewSnapshot({ success: true, reviews }), []);
  });

  it("publishes the complete list when ten approved homepage reviews are available", () => {
    const reviews = Array.from({ length: 10 }, (_, i) => ({
      id: `review-${i}`,
      display_name: `Reviewer ${i}`,
      review_text: `Experience ${i}`,
    }));
    assert.equal(normalizePublicReviewSnapshot({ success: true, reviews }).length, 10);
  });

  it("does not count repeated copies of the same review toward the threshold", () => {
    const oneReview = { id: "review-1", display_name: "Reviewer", review_text: "One experience" };
    assert.deepEqual(
      normalizePublicReviewSnapshot({ success: true, reviews: Array.from({ length: 12 }, () => oneReview) }),
      [],
    );
  });
});
