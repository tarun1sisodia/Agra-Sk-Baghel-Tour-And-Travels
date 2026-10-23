export interface PublishedReviewSnapshotItem {
  name: string;
  place: string;
  rating: number;
  quote: string;
  role?: string;
  is_verified: boolean;
}

/** Accept the public API's { success, reviews } envelope and older data wrappers. */
export function normalizePublicReviewSnapshot(payload: unknown): PublishedReviewSnapshotItem[] {
  const envelope = payload as any;
  const data = envelope?.data;
  const items: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(envelope?.reviews)
      ? envelope.reviews
      : Array.isArray(data?.reviews)
        ? data.reviews
        : Array.isArray(data)
          ? data
          : [];

  return items.slice(0, 30)
    .map((review: any) => ({
      name: review.display_name || review.name,
      place: review.tour_name || review.route_text || review.place || "Agra & Outstation",
      rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
      quote: review.review_text || review.quote || "",
      role: review.social_platform && review.social_url ? review.social_platform : review.role,
      is_verified: Boolean(review.is_verified ?? true),
    }))
    .filter((review: PublishedReviewSnapshotItem) => Boolean(review.name && review.quote));
}
