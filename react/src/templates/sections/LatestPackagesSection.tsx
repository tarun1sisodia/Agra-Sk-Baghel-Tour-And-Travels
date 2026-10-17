import React, { useMemo } from "react";
import generatedPublishedTourPackages from "../../data/generated-published-tour-packages.json";
import { resolveCatalogMediaUrl } from "../../services/catalog";
import { resolveTierKey } from "../../contracts/vehicle-tiers";

export interface LatestTourPackageItem {
  id: string;
  slug: string;
  packageCode?: string;
  package_code?: string;
  name: string;
  source?: string;
  destination?: string;
  durationText?: string;
  duration_text?: string;
  days?: number;
  nights?: number;
  startingPriceInr?: number;
  starting_price_inr?: number;
  fleetPrices?: Record<string, number>;
  fleet_prices?: Record<string, number>;
  inclusionsHighlight?: string | null;
  inclusions_highlight?: string | null;
  gallery?: Array<{ url: string; caption?: string }>;
  image?: string;
  status?: string;
  createdAt?: string;
}

export interface LatestPackagesSectionProps {
  packages?: LatestTourPackageItem[];
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

export function LatestPackagesSection({
  packages: propPackages,
  title = "Recently Added Signature Tour Packages",
  subtitle = "Newly crafted heritage expeditions and private chauffeured circuits updated in our booking desk.",
  maxItems = 3,
}: LatestPackagesSectionProps) {
  const packagesToDisplay = useMemo(() => {
    const source = propPackages || (generatedPublishedTourPackages as LatestTourPackageItem[]);
    if (!Array.isArray(source) || source.length === 0) return [];

    return source
      .filter((p) => Boolean(p && p.slug && p.name))
      .slice(0, maxItems);
  }, [propPackages, maxItems]);

  if (packagesToDisplay.length === 0) return null;

  return (
    <section className="w-full bg-sandstone-wash/40 py-space-xl border-b border-border-warm/40">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-white text-label-caps font-bold uppercase tracking-wider text-xs">
                <span className="material-symbols-outlined text-icon-14">fiber_new</span>
                NEW PACKAGES
              </span>
              <span className="text-body-sm text-secondary font-medium">Verified Itineraries</span>
            </div>
            <h2 className="font-headline-lg text-headline-md lg:text-headline-lg text-ink-charcoal font-serif mt-1">
              {title}
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl">
              {subtitle}
            </p>
          </div>
          <a
            href="/packages/"
            className="inline-flex items-center gap-1 text-primary hover:text-terracotta-deep font-semibold text-body-sm transition-colors"
          >
            <span>View All Packages</span>
            <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {packagesToDisplay.map((p) => {
            const duration = p.durationText || p.duration_text || (p.days ? `${p.days} Days / ${p.nights ?? p.days - 1} Nights` : "Full Day Sightseeing");
            const highlight = p.inclusionsHighlight || p.inclusions_highlight || "Private sanitized AC cab, dedicated chauffeur, and curated sightseeing.";
            const fleetPrices = p.fleetPrices || p.fleet_prices || {};
            const sedanResolved = resolveTierKey(fleetPrices, "sedan");
            const fpValues = Object.values(fleetPrices).filter((v) => typeof v === "number" && v > 0) as number[];
            const minFleetPrice = fpValues.length > 0 ? Math.min(...fpValues) : 0;
            const startingFare = Number(p.startingPriceInr || p.starting_price_inr || sedanResolved.value || minFleetPrice || 0);
            const token = startingFare > 0 ? Math.round(startingFare * 0.28) : 0;
            const packageUrl = `/packages/${p.slug}/`;
            const bookUrl = `/book.html?category=tour_package&product=${encodeURIComponent(p.slug)}&from=${encodeURIComponent(p.source || "Agra")}&to=${encodeURIComponent(p.destination || p.name)}`;
            const rawImg = p.gallery?.[0]?.url || p.image || "/assets/packages/taj-dawn.webp";
            const imageUrl = resolveCatalogMediaUrl(rawImg);

            return (
              <div
                key={p.slug}
                className="rounded-xl bg-surface-container-lowest border border-border-warm shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Package Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                  <img
                    src={imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/assets/packages/taj-dawn.webp";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-ink-charcoal/80 backdrop-blur-md text-ivory-surface text-label-caps font-bold uppercase tracking-wider text-xs">
                      {duration}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-ivory-surface">
                    <span className="text-xs text-gold-accent font-semibold tracking-wider uppercase">Private Charter</span>
                  </div>
                </div>

                <div className="p-space-lg flex flex-col justify-between flex-1">
                  <div className="flex flex-col gap-space-sm">
                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif group-hover:text-primary transition-colors line-clamp-1">
                      {p.name}
                    </h3>

                    <p className="text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                      {highlight}
                    </p>

                    <div className="flex flex-col pt-2 border-t border-border-warm/30">
                      <span className="text-xs uppercase text-secondary font-semibold">Starting Tour Fare</span>
                      {startingFare > 0 ? (
                        <>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-headline-md text-headline-sm text-terracotta-sandstone font-serif font-bold">
                              ₹{startingFare.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs text-on-surface-variant">All-Inclusive</span>
                          </div>
                          <span className="text-xs text-secondary">
                            Lock with only ₹{token.toLocaleString("en-IN")} (28% advance deposit)
                          </span>
                        </>
                      ) : (
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-headline-md text-headline-sm text-secondary font-serif font-bold">
                            On request
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-space-md pt-space-xs border-t border-border-warm/40">
                    <a
                      href={packageUrl}
                      className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded text-label-md font-semibold text-ink-charcoal bg-sandstone-wash/60 hover:bg-sandstone-wash transition-colors text-center"
                    >
                      <span>Explore</span>
                    </a>
                    <a
                      href={bookUrl}
                      className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded text-label-md font-semibold text-white bg-terracotta-deep hover:bg-terracotta-sunlit transition-all text-center shadow-xs"
                    >
                      <span>Reserve</span>
                      <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
