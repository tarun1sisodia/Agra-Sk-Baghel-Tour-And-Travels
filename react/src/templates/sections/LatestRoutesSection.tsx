import React, { useMemo } from "react";
import generatedPublishedRoutes from "../../data/generated-published-routes.json";
import { resolveTierKey } from "../../contracts/vehicle-tiers";

export interface LatestRouteItem {
  id?: string;
  slug: string;
  sourceCity?: string;
  source_city?: string;
  destinationCity?: string | null;
  destination_city?: string | null;
  distanceKm?: number | null;
  distance_km?: number | null;
  durationText?: string | null;
  duration_text?: string | null;
  faresInr?: Record<string, number>;
  fares_inr?: Record<string, number>;
  tripType?: string;
  trip_type?: string;
  isPublished?: boolean;
  published_at?: string;
  createdAt?: string;
}

export interface LatestRoutesSectionProps {
  routes?: LatestRouteItem[];
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

export function LatestRoutesSection({
  routes: propRoutes,
  title = "Recently Added Highway Corridors",
  subtitle = "Direct outstation routes recently updated in our live dispatch catalog with guaranteed fares.",
  maxItems = 3,
}: LatestRoutesSectionProps) {
  const routesToDisplay = useMemo(() => {
    const source = propRoutes || (generatedPublishedRoutes as LatestRouteItem[]);
    if (!Array.isArray(source) || source.length === 0) return [];

    return source
      .filter((r) => Boolean(r && r.slug && (r.sourceCity || r.source_city)))
      .slice(0, maxItems);
  }, [propRoutes, maxItems]);

  if (routesToDisplay.length === 0) return null;

  return (
    <section className="w-full bg-sandstone-wash/40 py-space-xl border-b border-border-warm/40">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-white text-label-caps font-bold uppercase tracking-wider text-xs">
                <span className="material-symbols-outlined text-icon-14">fiber_new</span>
                NEW ROUTES
              </span>
              <span className="text-body-sm text-secondary font-medium">Live Database Updates</span>
            </div>
            <h2 className="font-headline-lg text-headline-md lg:text-headline-lg text-ink-charcoal font-serif mt-1">
              {title}
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl">
              {subtitle}
            </p>
          </div>
          <a
            href="/en/routes/"
            className="inline-flex items-center gap-1 text-primary hover:text-terracotta-deep font-semibold text-body-sm transition-colors"
          >
            <span>View All Routes</span>
            <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {routesToDisplay.map((r) => {
            const origin = r.sourceCity || r.source_city || "Agra";
            const dest = r.destinationCity || r.destination_city || "Delhi";
            const distance = r.distanceKm ?? r.distance_km ?? 0;
            const duration = r.durationText || r.duration_text || "3h 30m";
            const fares = r.faresInr || r.fares_inr || {};
            const sedanResolved = resolveTierKey(fares, "sedan");
            const startingFare = Number(sedanResolved.value || 0);
            const token = startingFare > 0 ? Math.round(startingFare * 0.25) : 0;
            const routeUrl = `/routes/${r.slug}/`;
            const bookUrl = `/book?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}&vehicle=sedan&route=${encodeURIComponent(r.slug)}`;

            return (
              <div
                key={r.slug}
                className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary text-label-caps font-bold uppercase tracking-wider text-xs">
                      CORRIDOR
                    </span>
                    <span className="text-xs text-success-jade font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-jade animate-pulse" />
                      Active Dispatch
                    </span>
                  </div>

                  <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif group-hover:text-primary transition-colors">
                    {origin} → {dest}
                  </h3>

                  <div className="flex items-center gap-4 text-body-sm text-secondary py-1 border-y border-border-warm/30">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16 text-terracotta-sandstone">straighten</span>
                      {distance} km
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16 text-terracotta-sandstone">schedule</span>
                      {duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16 text-terracotta-sandstone">verified</span>
                      Tolls Inc.
                    </span>
                  </div>

                  <div className="flex flex-col pt-1">
                    <span className="text-xs uppercase text-secondary font-semibold">Starting Sedan Fare</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      {startingFare > 0 ? (
                        <>
                          <span className="font-headline-md text-headline-sm text-terracotta-sandstone font-serif font-bold">
                            ₹{startingFare.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-on-surface-variant">All-Inclusive</span>
                        </>
                      ) : (
                        <span className="font-headline-md text-headline-sm text-terracotta-sandstone font-serif font-bold">
                          Live Quote
                        </span>
                      )}
                    </div>
                    {startingFare > 0 && token > 0 ? (
                      <span className="text-xs text-secondary">
                        Lock with only ₹{token.toLocaleString("en-IN")} (advance deposit)
                      </span>
                    ) : (
                      <span className="text-xs text-secondary">
                        Instant calculation on booking
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-space-md pt-space-xs border-t border-border-warm/40">
                  <a
                    href={routeUrl}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded text-label-md font-semibold text-ink-charcoal bg-sandstone-wash/60 hover:bg-sandstone-wash transition-colors text-center"
                  >
                    <span>View Details</span>
                  </a>
                  <a
                    href={bookUrl}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded text-label-md font-semibold text-white bg-terracotta-deep hover:bg-terracotta-sunlit transition-all text-center shadow-xs"
                  >
                    <span>Book Route</span>
                    <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
