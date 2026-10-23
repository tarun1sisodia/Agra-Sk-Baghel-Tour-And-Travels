export interface PublishedReviewSnapshotItem {
  name: string;
  place: string;
  rating: number;
  quote: string;
  role?: string;
  is_verified: boolean;
}

export const MIN_REVIEWS_FOR_HOMEPAGE_MARQUEE = 10;

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

  const seen = new Set<string>();
  const normalized = items
    .map((review: any) => ({
      id: review.id == null ? undefined : String(review.id),
      name: review.display_name || review.name,
      place: review.tour_name || review.route_text || review.place || "Agra & Outstation",
      rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
      quote: review.review_text || review.quote || "",
      role: review.social_platform && review.social_url ? review.social_platform : review.role,
      is_verified: Boolean(review.is_verified ?? true),
    }))
    .filter((review: any) => {
      if (!review.name || !review.quote) return false;
      const identity = review.id || `${String(review.name).trim().toLowerCase()}\u0000${String(review.quote).trim().toLowerCase()}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .slice(0, 30)
    .map(({ id: _id, ...review }: any) => review as PublishedReviewSnapshotItem);
  // The marquee repeats its source cards for a seamless loop. Below ten,
  // leave the snapshot empty rather than amplify a handful of reviews.
  return normalized.length >= MIN_REVIEWS_FOR_HOMEPAGE_MARQUEE ? normalized : [];
}
