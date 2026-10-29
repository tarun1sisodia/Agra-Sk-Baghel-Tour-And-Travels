import { useEffect, useState } from "react";
import { contact } from "../../data/contact";
import { WhatsAppIcon } from "../icons";
import {
  fetchPublishedCatalog,
  resolveCatalogMediaUrl,
  TRIP_TYPE_LABEL,
  type PublicCatalogItem,
  type PublicCatalogType,
} from "../../services/catalog";

/**
 * Live catalog grid — trips published by the operations desk through the
 * Catalog CMS. Because the backend is the single source of trips, anything
 * the desk publishes appears here automatically (and vanishes when archived).
 * Renders nothing while the API is unreachable so the static SSG catalogue
 * remains the graceful fallback.
 */

interface LiveCatalogSectionProps {
  /** Which catalog verticals to surface. Defaults to the trip verticals. */
  types?: PublicCatalogType[];
  eyebrow?: string;
  title?: string;
  description?: string;
}

const AVAILABILITY_BADGE: Record<PublicCatalogItem["availability"], { label: string; className: string } | null> = {
  available: null,
  limited: {
    label: "Limited seats",
    className: "bg-terracotta-deep text-on-primary font-bold",
  },
  unavailable: {
    label: "On request",
    className: "bg-ink-charcoal text-ivory-surface font-semibold",
  },
};

export function LiveCatalogSection({
  types = ["package", "tour", "route", "ride"],
  eyebrow = "Live from our Agra desk",
  title = "Newly Published Trips",
  description = "Fresh itineraries, seasonal circuits and transfer routes published by our operations team — updated the moment they go live.",
}: LiveCatalogSectionProps) {
  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all(types.map((type) => fetchPublishedCatalog({ type }).catch(() => [] as PublicCatalogItem[])))
      .then((results) => {
        if (!isMounted) return;
        const merged = new Map<string, PublicCatalogItem>();
        for (const list of results) {
          for (const item of list) merged.set(item.slug, item);
        }
        const list = [...merged.values()];
        setItems(list);
        setVisible(list.length > 0);
      })
      .catch(() => {
        if (isMounted) setVisible(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(",")]);

  if (!visible) return null;

  return (
    <section
      id="live-catalog"
      className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full"
      aria-label="Newly published trips"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-6">
        <div className="max-w-2xl">
          <span className="font-label-caps text-body-sm text-primary uppercase font-bold tracking-widest">
            {eyebrow}
          </span>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">{title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">{description}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sandstone-wash w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-success-jade animate-pulse" aria-hidden="true" />
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-terracotta-sandstone font-semibold">
            {items.length} live {items.length === 1 ? "trip" : "trips"}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {items.map((item) => {
          const detailUrl = `/en/packages/${item.slug}/`;
          const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
            `Hello Agra SK Baghel Tour and Travels, I am interested in the ${item.title}.`,
          )}`;
          const availability = AVAILABILITY_BADGE[item.availability];
          const cover = item.coverImage;

          return (
            <article
              key={item.id}
              className="flex flex-col bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden border border-border-warm"
            >
              <div className="relative h-44 sm:h-48 bg-surface-container overflow-hidden group">
                {cover ? (
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={cover.url ? item.title : ""}
                    src={resolveCatalogMediaUrl(cover.url)}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sandstone-wash" aria-hidden="true">
                    <span className="material-symbols-outlined text-primary text-icon-32">tour</span>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-label-caps font-label-caps uppercase tracking-wider shadow-xs font-bold">
                    {item.type === "package"
                      ? "Tour package"
                      : item.type === "tour"
                        ? "Sightseeing tour"
                        : item.type === "route"
                          ? "Outstation route"
                          : item.type === "ride"
                            ? "Transfer"
                            : item.type}
                  </span>
                  {item.tripType && (
                    <span className="px-2 py-0.5 rounded bg-ink-charcoal/90 text-ivory-surface text-label-caps font-label-caps uppercase tracking-wider backdrop-blur-sm font-semibold">
                      {TRIP_TYPE_LABEL[item.tripType]}
                    </span>
                  )}
                  {availability && (
                    <span
                      className={`px-2 py-0.5 rounded text-label-caps font-label-caps uppercase tracking-wider shadow-xs ${availability.className}`}
                    >
                      {item.availability === "limited" && item.seatsLeft !== null
                        ? `Only ${item.seatsLeft} left`
                        : availability.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col flex-1 p-4">
                <h3 className="font-title-md text-headline-sm font-bold text-ink-charcoal leading-snug">{item.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                  {item.shortDescription}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-on-surface-variant font-body-sm text-body-sm">
                  {item.durationText && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-14" aria-hidden="true">schedule</span>
                      {item.durationText}
                    </span>
                  )}
                  {item.distanceKm !== null && item.distanceKm !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-14" aria-hidden="true">route</span>
                      ~{item.distanceKm} km
                    </span>
                  )}
                  {item.stops.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-14" aria-hidden="true">pin_drop</span>
                      {item.stops.length} stop{item.stops.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {item.stops.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5" aria-label="Trip stops">
                    {item.stops.slice(0, 4).map((stop) => (
                      <span
                        key={stop}
                        className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-body-sm font-medium"
                      >
                        {stop}
                      </span>
                    ))}
                    {item.stops.length > 4 && (
                      <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-body-sm font-medium">
                        +{item.stops.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-end justify-between gap-3">
                  <div>
                    <span className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                      {item.startingPriceInr != null && item.startingPriceInr > 0 ? "Starting from" : "Tariff"}
                    </span>
                    <span className="font-title-md text-lg font-bold text-ink-charcoal">
                      {item.startingPriceInr != null && item.startingPriceInr > 0
                        ? `₹${item.startingPriceInr.toLocaleString("en-IN")}`
                        : "On request"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Enquire about ${item.title} on WhatsApp`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-success-jade/10 text-success-jade hover:bg-success-jade/20 transition-colors"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                    <a
                      href={detailUrl}
                      className="inline-flex items-center gap-1 px-3.5 h-9 rounded-lg bg-primary text-on-primary font-label-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      View details
                      <span className="material-symbols-outlined text-icon-14" aria-hidden="true">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
