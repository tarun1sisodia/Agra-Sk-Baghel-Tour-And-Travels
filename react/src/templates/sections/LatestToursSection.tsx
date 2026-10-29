import React, { useMemo } from "react";
import generatedPublishedLocalPackages from "../../data/generated-published-local-packages.json";


export interface LatestLocalPackageItem {
  id: string;
  slug: string;
  packageCode?: string;
  name: string;
  durationHours: number;
  duration_hours?: number;
  includedKm: number;
  included_km?: number;
  covers: string;
  fleetPrices?: Record<string, number>;
  fleet_prices?: Record<string, number>;
  status?: string;
}

export interface LatestToursSectionProps {
  tours?: LatestLocalPackageItem[];
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

export function LatestToursSection({
  tours: propTours,
  title = "Agra Local Sightseeing Packages",
  subtitle = "Dedicated vehicle custody for 4 to 12 hours with unhurried monument visits and verified commercial chauffeurs.",
  maxItems = 3,
}: LatestToursSectionProps) {
  const toursToDisplay = useMemo(() => {
    const source = propTours || (generatedPublishedLocalPackages as LatestLocalPackageItem[]);
    if (!Array.isArray(source) || source.length === 0) return [];

    return source
      .filter((t) => Boolean(t && t.slug && t.name))
      .slice(0, maxItems);
  }, [propTours, maxItems]);

  if (toursToDisplay.length === 0) return null;

  return (
    <section className="w-full bg-sandstone-wash/40 py-space-xl border-b border-border-warm/40">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-white text-label-caps font-bold uppercase tracking-wider text-xs">
                <span className="material-symbols-outlined text-icon-14">tour</span>
                LOCAL TOURS
              </span>
              <span className="text-body-sm text-secondary font-medium">Hourly City Custody</span>
            </div>
            <h2 className="font-headline-lg text-headline-md lg:text-headline-lg text-ink-charcoal font-serif mt-1">
              {title}
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl">
              {subtitle}
            </p>
          </div>
          <a
            href="/en/packages/"
            className="inline-flex items-center gap-1 text-primary hover:text-terracotta-deep font-semibold text-body-sm transition-colors"
          >
            <span>Explore City Tours</span>
            <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {toursToDisplay.map((t) => {
            const hours = t.durationHours || t.duration_hours || 8;
            const km = t.includedKm || t.included_km || 80;
            const fleetPrices = t.fleetPrices || t.fleet_prices || {};
            const validRates = Object.values(fleetPrices).filter((v) => typeof v === "number" && v > 0);
            const startingFare = Number(fleetPrices.sedan || (validRates.length > 0 ? Math.min(...validRates) : 0));
            const token = startingFare > 0 ? Math.round(startingFare * 0.28) : 0;
            const tourUrl = `/en/local-packages/${t.slug}/`;
            const bookUrl = `/book.html?category=local_package&product=${encodeURIComponent(t.slug)}&from=Agra&to=${encodeURIComponent(t.name)}`;

            return (
              <div
                key={t.slug}
                className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary text-label-caps font-bold uppercase tracking-wider text-xs">
                      {hours} HOURS • {km} KM
                    </span>
                    <span className="text-xs text-success-jade font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-jade animate-pulse" />
                      AC Taxi Custody
                    </span>
                  </div>

                  <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif group-hover:text-primary transition-colors">
                    {t.name}
                  </h3>

                  <div className="flex flex-col gap-1 py-1 border-y border-border-warm/30">
                    <span className="text-xs text-secondary font-semibold uppercase">Monuments Included:</span>
                    <p className="text-body-sm text-ink-charcoal font-medium line-clamp-2">
                      {t.covers}
                    </p>
                  </div>

                  <div className="flex flex-col pt-1">
                    <span className="text-xs uppercase text-secondary font-semibold">Starting Sedan Tariff</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-headline-md text-headline-sm text-terracotta-sandstone font-serif font-bold">
                        ₹{startingFare.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-on-surface-variant">All-Inclusive</span>
                    </div>
                    <span className="text-xs text-secondary">
                      Lock with only ₹{token.toLocaleString("en-IN")} (28% deposit)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-space-md pt-space-xs border-t border-border-warm/40">
                  <a
                    href={tourUrl}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded text-label-md font-semibold text-ink-charcoal bg-sandstone-wash/60 hover:bg-sandstone-wash transition-colors text-center"
                  >
                    <span>Tour Plan</span>
                  </a>
                  <a
                    href={bookUrl}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded text-label-md font-semibold text-white bg-terracotta-deep hover:bg-terracotta-sunlit transition-all text-center shadow-xs"
                  >
                    <span>Book Taxi</span>
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
