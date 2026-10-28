import { useEffect, useState } from "react";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { NotFoundPage } from "./NotFoundPage";
import { buildBreadcrumbSchema, buildTouristTripSchema, JsonLd } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import {
  fetchLiveCatalogItemBySlug,
  resolveCatalogMediaUrl,
  TRIP_TYPE_LABEL,
  type PublicCatalogItem,
} from "../services/catalog";

/**
 * Dynamic detail page for live catalog trips (published through the Catalog
 * CMS). Static packages keep their hand-crafted SSG page; anything the desk
 * publishes afterwards renders here automatically. Includes JSON-LD
 * (TouristTrip + Offer) and dynamic meta so AI/search engines can parse the
 * runtime content.
 */

interface LivePackageDetailPageProps {
  slug: string;
  initialItem?: PublicCatalogItem;
}

export function LivePackageDetailPage({ slug, initialItem }: LivePackageDetailPageProps) {
  const [item, setItem] = useState<PublicCatalogItem | null>(initialItem ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(initialItem ? "ready" : "loading");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!initialItem) setStatus("loading");
    fetchLiveCatalogItemBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        setItem(data);
        setStatus("ready");
      })
      .catch(() => {
        if (isMounted) setStatus("missing");
      });
    return () => {
      isMounted = false;
    };
  }, [slug, initialItem]);

  // Dynamic SEO for runtime catalog items.
  useEffect(() => {
    if (status !== "ready" || !item) return;
    document.title = `${item.title} — Private Tour & Fares | Agra SK Baghel Tour and Travels`;
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const [, key, val] = selector.match(/\[(name|property)="([^"]+)"\]/) ?? [];
        if (key && val) el.setAttribute(key, val);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', "content", item.shortDescription);
    setMeta('meta[property="og:title"]', "content", `${item.title} | Agra SK Baghel Tour and Travels`);
    setMeta('meta[property="og:description"]', "content", item.shortDescription);
    if (item.coverImage?.url) {
      setMeta('meta[property="og:image"]', "content", resolveCatalogMediaUrl(item.coverImage.url));
    }
  }, [status, item]);

  if (status === "missing") {
    return <NotFoundPage />;
  }

  if (status === "loading" || !item) {
    return (
      <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-xl bg-surface-container" />
          <div className="h-6 w-2/3 rounded bg-surface-container" />
          <div className="h-4 w-1/2 rounded bg-surface-container" />
        </div>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour and Travels, I am interested in the ${item.title}${item.availability === "unavailable" ? " (custom availability enquiry)" : item.startingPriceInr != null && item.startingPriceInr > 0 ? ` (from ₹${item.startingPriceInr.toLocaleString("en-IN")})` : " (custom quote enquiry)"}.`,
  )}`;
  const totalFare = item.startingPriceInr != null && item.startingPriceInr > 0 ? item.startingPriceInr : 0;
  const advanceFare = Math.round(totalFare * 0.28);
  const balanceFare = totalFare - advanceFare;
  const galleryImages = (item.gallery || []).filter((g) => g && g.mediaType === "image");
  const stops = Array.isArray(item.stops) ? item.stops : [];
  const active = galleryImages[Math.min(activeImage, Math.max(0, galleryImages.length - 1))];
  const heroSrc = active ? resolveCatalogMediaUrl(active.url) : null;

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/packages/${item.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildTouristTripSchema({
        id: `${canonicalUrl}#trip`,
        name: item.title,
        description: item.shortDescription,
        image: item.coverImage ? resolveCatalogMediaUrl(item.coverImage.url) : undefined,
        touristType: [item.tripType ? TRIP_TYPE_LABEL[item.tripType] : "Private tour"],
        itinerary: stops.map((stop) => ({ name: stop, description: `Stop on ${item.title}` })),
        ...(item.availability === "unavailable" || item.startingPriceInr == null || item.startingPriceInr <= 0
          ? {}
          : { offers: { price: item.startingPriceInr, priceCurrency: "INR", availability: item.availability === "limited" ? "LimitedAvailability" as const : "InStock" as const } }),
      }),
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Tour Packages", url: "/en/packages/" },
        { name: item.title, url: canonicalUrl },
      ]),
    ],
    dateModified: item.updatedAt || item.publishedAt || undefined,
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={jsonLd} />

      {/* Hero */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-lg">
        <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm mb-space-lg" aria-label="Breadcrumb">
          <a className="hover:text-primary transition-colors" href="/">Home</a>
          <span className="material-symbols-outlined text-icon-14" aria-hidden="true">chevron_right</span>
          <a className="hover:text-primary transition-colors" href="/en/packages/">Tour Packages</a>
          <span className="material-symbols-outlined text-icon-14" aria-hidden="true">chevron_right</span>
          <span className="text-primary font-semibold">{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
          <div className="lg:col-span-7">
            {heroSrc ? (
              <figure className="rounded-2xl overflow-hidden border border-border-warm shadow-sm bg-surface-container">
                <img
                  src={heroSrc}
                  alt={active?.altText || item.title}
                  className="w-full aspect-[16/10] object-cover"
                  loading="eager"
                  decoding="async"
                />
                {active?.caption && (
                  <figcaption className="px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-lowest">
                    {active.caption}
                  </figcaption>
                )}
              </figure>
            ) : (
              <div className="rounded-2xl aspect-[16/10] bg-sandstone-wash flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-icon-48" aria-hidden="true">tour</span>
              </div>
            )}

            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1" aria-label="Photo gallery">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View photo: ${img.altText}`}
                    aria-current={idx === activeImage}
                    className={`shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activeImage ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveCatalogMediaUrl(img.url)}
                      alt={img.altText}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider font-bold">
                {item.type === "package" ? "Tour package" : item.type === "tour" ? "Sightseeing tour" : item.type}
              </span>
              {item.tripType && (
                <span className="px-2.5 py-1 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                  {TRIP_TYPE_LABEL[item.tripType]}
                </span>
              )}
              {item.availability === "limited" && (
                <span className="px-2.5 py-1 rounded bg-terracotta-deep text-white font-label-caps text-label-caps uppercase tracking-wider font-bold">
                  {item.seatsLeft !== null ? `Only ${item.seatsLeft} left` : "Limited seats"}
                </span>
              )}
              {item.availability === "unavailable" && (
                <span className="px-2.5 py-1 rounded bg-ink-charcoal text-ivory-surface font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                  On request
                </span>
              )}
            </div>

            <h1 className="font-headline-hero text-headline-hero text-on-surface leading-tight">{item.title}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">{item.shortDescription}</p>
            {item.availability === "unavailable" && (
              <p className="rounded-xl border border-border-warm bg-sandstone-wash px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">
                This exact trip is currently unavailable. Explore current alternatives or ask the travel desk for a custom itinerary.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: "Duration", value: item.durationText, icon: "schedule" },
                item.distanceKm !== null && item.distanceKm !== undefined
                  ? { label: "Distance", value: `~${item.distanceKm} km`, icon: "route" }
                  : null,
                { label: "Route", value: item.routeSummary, icon: "pin_drop" },
                { label: "Last reviewed", value: (item.updatedAt || item.publishedAt) ? new Date(item.updatedAt || item.publishedAt || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Live", icon: "verified" },
              ]
                .filter(Boolean)
                .map((meta) => (
                  <div key={(meta as { label: string }).label} className="bg-surface-container-lowest rounded-xl border border-border-warm/60 p-3">
                    <dt className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                      <span className="material-symbols-outlined text-icon-14 text-primary" aria-hidden="true">
                        {(meta as { icon: string }).icon}
                      </span>
                      {(meta as { label: string }).label}
                    </dt>
                    <dd className="font-title-sm text-sm font-semibold text-on-surface mt-1 leading-snug">
                      {(meta as { value: string }).value}
                    </dd>
                  </div>
                ))}
            </dl>

            <div className="bg-surface-container-lowest rounded-xl border border-border-warm p-4 flex items-end justify-between gap-3">
              <div>
                <span className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                  {item.availability === "unavailable" ? "Availability" : "Starting from"}
                </span>
                {item.availability === "unavailable" ? (
                  <span className="font-title-md text-xl font-bold text-on-surface">Currently unavailable</span>
                ) : item.startingPriceInr != null && item.startingPriceInr > 0 ? (
                  <span className="font-title-md text-2xl font-bold text-on-surface">
                    ₹{item.startingPriceInr.toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="font-title-md text-xl font-bold text-on-surface">Price on Request</span>
                )}
                {item.startingPriceInr != null && item.startingPriceInr > 0 && (
                  <span className="block font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Pay ₹{advanceFare.toLocaleString("en-IN")} now (28% advance). Balance ₹{balanceFare.toLocaleString("en-IN")} at drop-off.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {item.availability === "unavailable" || (item as any).status === "archived" ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-surface-container-high text-on-surface-variant font-label-lg text-sm font-semibold cursor-not-allowed opacity-75"
                >
                  <span className="material-symbols-outlined text-icon-18" aria-hidden="true">block</span>
                  <span>Currently Unavailable</span>
                </button>
              ) : (
                <a
                  href={`/book.html?package=${encodeURIComponent(item.slug)}&step=1`}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-terracotta-deep text-white font-label-lg text-sm font-semibold hover:bg-terracotta-sunlit transition-colors"
                >
                  <span>Book Now</span>
                  <span className="material-symbols-outlined text-icon-18" aria-hidden="true">arrow_forward</span>
                </a>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ffffff" }}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-success-jade text-white font-label-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp enquiry</span>
              </a>
              <a
                href={`tel:${contact.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-on-primary font-label-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-icon-18" aria-hidden="true">call</span>
                {contact.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Description + stops */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface">About this trip</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {stops.length > 0 && (
            <div className="lg:col-span-5 flex flex-col gap-space-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Stops on this trip</h2>
              <ol className="relative pl-6 space-y-3 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-warm">
                {stops.map((stop, idx) => (
                  <li key={stop} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface group-hover:scale-125 transition-transform" />
                    <div className="bg-surface-container-low p-3 rounded-xl border border-border-warm/60">
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-terracotta-sandstone font-bold">
                        Stop {String(idx + 1).padStart(2, "0")}
                      </span>
                      <p className="font-title-sm text-sm font-semibold text-on-surface mt-0.5">{stop}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LivePackageDetailPage;
