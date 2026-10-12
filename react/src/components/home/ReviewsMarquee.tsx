/**
 * ReviewsMarquee — Dual-Track Infinite Marquee Reviews Showcase
 * 
 * Conforms to FRONTEND_RULES.md (Mughal Terracotta & Sandstone Design Tokens)
 * - Dual opposing smooth marquee tracks (Row 1 left, Row 2 right)
 * - Pause on hover interaction
 * - Edge gradient fade masks for seamless visual transition
 * - Verified traveler badges & 5-star gold ratings
 * - Pure Tailwind CSS & theme tokens, 100% accessible
 */

import React, { useEffect, useState } from "react";
import { reviews as fallbackReviews, type Review } from "../../data/catalogue";
import { fetchPublicReviews } from "../../services/api";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const initials = getInitials(review.name);

  return (
    <article
      className="w-[310px] sm:w-[350px] shrink-0 bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-xs hover:shadow-md transition-all border border-border-warm/60 flex flex-col justify-between select-none"
      role="article"
    >
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div>
              <h3 className="font-title-md text-title-lg font-bold text-on-surface leading-tight">
                {review.name}
              </h3>
              <span className="font-label-caps text-label-caps text-on-surface-variant block mt-0.5">
                {review.role || review.place}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-label-caps uppercase font-bold flex items-center gap-0.5 shrink-0">
            <span className="material-symbols-outlined text-icon-11">verified</span>
            Verified
          </span>
        </div>

        <p className="font-body-md text-title-md italic text-on-surface-variant leading-relaxed line-clamp-3">
          &ldquo;{review.quote}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-warm/40">
        <div
          className="flex text-gold-accent gap-0.5"
          role="img"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="material-symbols-outlined text-icon-14"
              aria-hidden="true"
            >
              star
            </span>
          ))}
        </div>
        <span className="font-label-caps text-label-caps text-on-surface-variant/80 font-medium">
          {review.place}
        </span>
      </div>
    </article>
  );
}

export function ReviewsMarquee() {
  const [reviewsList, setReviewsList] = useState<readonly Review[]>(fallbackReviews);

  useEffect(() => {
    let active = true;
    fetchPublicReviews().then((live) => {
      if (!active || !live || live.length === 0) return;
      const mapped: Review[] = live.slice(0, 30).map((r) => ({
        name: r.display_name,
        place: r.tour_name || r.route_text || "Agra & Outstation",
        rating: Math.min(5, Math.max(1, r.rating || 5)),
        quote: r.review_text,
        role: r.social_platform && r.social_url ? r.social_platform : undefined,
      }));
      if (mapped.length >= 2) {
        setReviewsList(mapped);
      }
    }).catch(() => {
      // Graceful fallback to static reviews
    });
    return () => {
      active = false;
    };
  }, []);

  const mid = Math.ceil(reviewsList.length / 2);
  const row1 = reviewsList.slice(0, mid);
  const row2 = reviewsList.slice(mid);

  return (
    <section
      className="w-full py-space-2xl sm:py-space-3xl bg-surface-container-low overflow-hidden relative"
      aria-label="Verified Customer Reviews"
      id="reviews"
    >
      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-surface-container-low to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-surface-container-low to-transparent z-10" />

      <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin mb-space-lg text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-accent/15 text-gold-bronze font-label-caps text-label-lg mb-2 font-bold">
          <span className="material-symbols-outlined text-icon-15">hotel_class</span>
          OUR TRAVELER REVIEWS
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          3,800+ Expeditions. <br className="hidden sm:inline" />
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
         
        </div>
      </div>

      {/* Marquee Tracks Container */}
      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* Row 1 — Scrolls Left */}
        <div className="flex overflow-hidden group">
          <div className="flex gap-3 sm:gap-4 animate-marquee group-hover:[animation-play-state:paused]">
            {row1.map((rev, idx) => (
              <ReviewCard key={`r1-a-${idx}`} review={rev} />
            ))}
            {row1.map((rev, idx) => (
              <ReviewCard key={`r1-b-${idx}`} review={rev} />
            ))}
          </div>
          <div
            className="flex gap-3 sm:gap-4 animate-marquee group-hover:[animation-play-state:paused]"
            aria-hidden="true"
          >
            {row1.map((rev, idx) => (
              <ReviewCard key={`r1-c-${idx}`} review={rev} />
            ))}
            {row1.map((rev, idx) => (
              <ReviewCard key={`r1-d-${idx}`} review={rev} />
            ))}
          </div>
        </div>

        {/* Row 2 — Scrolls Right */}
        <div className="flex overflow-hidden group">
          <div
            className="flex gap-3 sm:gap-4 animate-marquee group-hover:[animation-play-state:paused]"
            style={{ animationDirection: "reverse" }}
          >
            {row2.map((rev, idx) => (
              <ReviewCard key={`r2-a-${idx}`} review={rev} />
            ))}
            {row2.map((rev, idx) => (
              <ReviewCard key={`r2-b-${idx}`} review={rev} />
            ))}
          </div>
          <div
            className="flex gap-3 sm:gap-4 animate-marquee group-hover:[animation-play-state:paused]"
            style={{ animationDirection: "reverse" }}
            aria-hidden="true"
          >
            {row2.map((rev, idx) => (
              <ReviewCard key={`r2-c-${idx}`} review={rev} />
            ))}
            {row2.map((rev, idx) => (
              <ReviewCard key={`r2-d-${idx}`} review={rev} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
