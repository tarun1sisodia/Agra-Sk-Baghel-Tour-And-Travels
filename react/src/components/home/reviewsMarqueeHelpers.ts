export interface Review {
  name: string;
  place: string;
  rating: number;
  quote: string;
  role?: string;
  is_verified?: boolean;
}

/**
 * Maps raw backend API review response to the UI card review shape.
 * Crucially passes the actual `is_verified` boolean from the server response
 * and never infers it from booking IDs, social links, or approval status.
 */
export function mapApiReviewToCardReview(r: any): Review {
  return {
    name: r.display_name,
    place: r.tour_name || r.route_text || "Agra & Outstation",
    rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
    quote: r.review_text,
    role: r.social_platform && r.social_url ? r.social_platform : undefined,
    is_verified: Boolean(r.is_verified),
  };
}
