/**
 * @file cards.tsx — Reusable cards with full animation & hover micro-interactions suite.
 * @usage Renders MonumentCard, RouteCard, and TourCard with lift, photo develop, and caption unfurl.
 */

import React from "react";
import { NewBadge } from "./badges";

export interface MonumentCardContract {
  slug: string;
  name: string;
  thumbnail?: string | null;
  thumbnailAlt?: string | null;
  visitingHours?: string | null;
  isNew?: boolean;
}

/**
 * Editorial Monument Card featuring the signature Mughal arch motif,
 * lift hover elevation, photo develop filter, and caption unfurl.
 */
export function MonumentCard({ monument }: { monument: MonumentCardContract }) {
  return (
    <a href={`/en/monuments/${monument.slug}/`} className="group block focus-visible:outline-hidden">
      <div
        className="lift arch relative aspect-[3/4] overflow-hidden border-4 border-linen
                   shadow-[0_20px_45px_-24px_rgb(23_19_16/0.4)]
                   transition-colors duration-500 group-hover:border-saffron/70"
      >
        {monument.thumbnail ? (
          <img
            src={monument.thumbnail}
            alt={monument.thumbnailAlt ?? monument.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-all duration-700
                       saturate-[0.88] group-hover:scale-[1.07] group-hover:saturate-100"
          />
        ) : (
          <div className="h-full w-full bg-sand" />
        )}
        <div
          className="absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t
                     from-ink/80 via-ink/40 to-transparent p-5 pt-16 transition-transform
                     duration-500 group-hover:translate-y-0"
        >
          <div className="mb-2 flex gap-2">{monument.isNew && <NewBadge />}</div>
          <p className="font-display text-xl text-ivory">{monument.name}</p>
          <p
            className="caption-unfurl text-[11px] font-semibold uppercase
                       tracking-[0.18em] text-ivory/90 mt-1"
          >
            Explore the guide →
          </p>
        </div>
      </div>
      <p
        className="mt-3 line-clamp-1 text-center text-[12px] font-semibold text-smoke
                   transition-colors duration-300 group-hover:text-ink"
      >
        {monument.visitingHours ?? "Open daily"}
      </p>
    </a>
  );
}
