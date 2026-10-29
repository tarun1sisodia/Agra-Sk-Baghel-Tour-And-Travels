import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Info,
  Navigation,
  Phone,
  RotateCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  fetchPublishedProduct,
  CleanFareApiError,
} from "../services/cleanFareApi";
import type { PublishedProductDetail, CategoryCode } from "../contracts/fare-system";
import { WhatsAppIcon } from "../components/icons";
import { contact } from "../data/contact";

interface ProductDetailPageProps {
  category: CategoryCode;
  code: string;
}

const CATEGORY_TITLES: Record<CategoryCode, string> = {
  outstation: "Intercity Outstation Taxi",
  local_package: "Local Sightseeing Package",
  transfer: "Private Airport & Station Transfer",
  tour_package: "Curated Guided Tour Package",
};

export function ProductDetailPage({ category, code }: ProductDetailPageProps) {
  const [product, setProduct] = useState<PublishedProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setIs404(false);

    fetchPublishedProduct(category, code)
      .then((data) => {
        if (isMounted) setProduct(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof CleanFareApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
          setIs404(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load product details.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category, code]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg">
        <div className="text-center">
          <h1 className="sr-only">{CATEGORY_TITLES[category] || "Cab Service"}</h1>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-ink-soft">
            Loading service specification…
          </p>
        </div>
      </div>
    );
  }

  if (is404 || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-gold-text">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
          Service Not Found
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-soft">
          The requested {CATEGORY_TITLES[category] || "service"} code &ldquo;{code}&rdquo; is not available in our active directory.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/"
            className="rounded-sm bg-ink px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gold-text"
          >
            Return Home
          </a>
          <a
            href="/en/services/"
            className="rounded-sm border border-hairline px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Browse Services
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-error" />
        <h2 className="mt-4 font-display text-xl font-bold text-ink">Unable to Load Service</h2>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-xs font-semibold text-white"
        >
          <RotateCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const isArchived = product.status === "archived";
  const bookingUrl = `/book?category=${product.category}&product=${product.code}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello SK Baghel Travels, I am interested in ${product.name} (${product.code}). Please assist with availability and booking.`
  )}`;

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Requirement A: Archived Page Banner */}
      {isArchived && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-4 text-amber-900 dark:text-amber-200">
          <div className="mx-auto flex max-w-6xl items-start gap-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold text-sm">Currently Unavailable for Online Reservation</span>
              <p className="mt-0.5 opacity-90">
                This service page remains indexed and accessible for reference, but new online self-service reservations are temporarily suspended. You can explore our related active options below or speak directly to our 24/7 concierge desk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative border-b border-hairline bg-surface-2/60 px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-soft">
            <a href="/" className="hover:text-gold-text">Home</a>
            <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
            <span className="capitalize">{CATEGORY_TITLES[product.category]}</span>
            <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
            <span className="font-medium text-ink truncate max-w-xs">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-pill bg-gold-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-gold-text uppercase tracking-wider">
                  {CATEGORY_TITLES[product.category]}
                </span>
                {isArchived ? (
                  <span className="rounded-pill bg-amber-500/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    Currently Unavailable
                  </span>
                ) : (
                  <span className="rounded-pill bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Published & Instant Bookable
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
                {product.name}
              </h1>

              {product.description && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
                  {product.description}
                </p>
              )}

              {/* Spec Chips */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
                {product.distance_km && (
                  <div className="flex items-center gap-1.5 rounded-sm border border-hairline bg-surface px-3 py-1.5">
                    <Navigation className="h-4 w-4 text-gold" />
                    <span><strong>{product.distance_km} km</strong> highway corridor</span>
                  </div>
                )}
                {product.duration_minutes && (
                  <div className="flex items-center gap-1.5 rounded-sm border border-hairline bg-surface px-3 py-1.5">
                    <Clock className="h-4 w-4 text-gold" />
                    <span>
                      Approx. <strong>{Math.floor(product.duration_minutes / 60)}h {product.duration_minutes % 60}m</strong>
                    </span>
                  </div>
                )}
                {product.duration_hours && (
                  <div className="flex items-center gap-1.5 rounded-sm border border-hairline bg-surface px-3 py-1.5">
                    <Clock className="h-4 w-4 text-gold" />
                    <span><strong>{product.duration_hours} Hours</strong> included</span>
                  </div>
                )}
                {product.included_km && (
                  <div className="flex items-center gap-1.5 rounded-sm border border-hairline bg-surface px-3 py-1.5">
                    <Navigation className="h-4 w-4 text-gold" />
                    <span><strong>{product.included_km} km</strong> sightseeing allowance</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price & Booking Callout Dock */}
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-hairline bg-surface p-6 shadow-sm">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                  Authoritative Pricing
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  {product.starting_price_inr ? (
                    <>
                      <span className="text-xs text-ink-soft">Starting from</span>
                      <span className="font-display text-3xl font-extrabold text-gold-text">
                        ₹{product.starting_price_inr.toLocaleString("en-IN")}
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-xl font-bold text-ink">
                      Quote on Selection
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Includes driver allowance, commercial permits & taxes. 28% advance to confirm.
                </p>

                <div className="mt-5 space-y-2.5">
                  {isArchived ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full cursor-not-allowed rounded-sm bg-ink/30 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Currently Unavailable
                    </button>
                  ) : (
                    <a
                      href={bookingUrl}
                      className="block w-full rounded-sm bg-primary py-3 text-center text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] hover:bg-gold-text"
                    >
                      Configure & Book Now
                    </a>
                  )}

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-sm border border-emerald-600/30 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    <WhatsAppIcon className="h-4 w-4 fill-current" />
                    <span>WhatsApp Concierge</span>
                  </a>
                </div>

                <div className="mt-4 border-t border-hairline pt-3 text-[11px] text-ink-faint">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                    <span>Zero tourist trap guarantee • Clean AC fleet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-10">
            {/* Image Gallery */}
            {product.gallery && product.gallery.length > 0 && (
              <div>
                <h2 className="mb-4 font-display text-xl font-bold text-ink">Service Showcase</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.gallery.map((img, i) => (
                    <div key={i} className="overflow-hidden rounded-md border border-hairline aspect-video bg-surface-2">
                      <img
                        src={img}
                        alt={`${product.name} photo ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            {(product.inclusions.length > 0 || product.exclusions.length > 0) && (
              <div className="rounded-xl border border-hairline bg-surface p-6">
                <h2 className="font-display text-xl font-bold text-ink">Package Accounting & Terms</h2>
                <p className="mt-1 text-xs text-ink-soft">
                  Complete transparent breakdown of included amenities and on-demand actuals.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Inclusions */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check className="h-4 w-4" /> Transparent Inclusions
                    </h3>
                    <ul className="space-y-2 text-xs text-ink">
                      {product.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exclusions */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-faint">
                      <X className="h-4 w-4" /> Guest Exclusions (On Actuals)
                    </h3>
                    <ul className="space-y-2 text-xs text-ink-soft">
                      {product.exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tour Itinerary / Highlights */}
            {product.highlights && (
              <div>
                <h2 className="mb-3 font-display text-xl font-bold text-ink">Experience Highlights</h2>
                <div className="prose prose-sm max-w-none text-ink-soft leading-relaxed">
                  <p>{product.highlights}</p>
                </div>
              </div>
            )}

            {product.notes && (
              <div className="rounded-lg border border-gold-border bg-gold-soft/30 p-4 text-xs text-ink">
                <div className="flex items-center gap-2 font-semibold text-gold-text">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Important Operational Note</span>
                </div>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{product.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar / Related Services (Requirement A) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Related Active Services */}
            <div className="rounded-xl border border-hairline bg-surface p-5">
              <h3 className="font-display text-base font-bold text-ink">
                {isArchived ? "Recommended Active Services" : "Related Corridors & Packages"}
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                {isArchived
                  ? "Explore similar routes available for instant reservation:"
                  : "Discover complementary journeys in northern India:"}
              </p>

              <div className="mt-4 space-y-3">
                {product.related_products && product.related_products.length > 0 ? (
                  product.related_products.map((rp) => (
                    <a
                      key={rp.id}
                      href={
                        rp.category === "outstation"
                          ? `/en/${rp.code}/`
                          : rp.category === "local_package"
                          ? `/en/local-packages/${rp.code}/`
                          : rp.category === "transfer"
                          ? `/en/transfers/${rp.code}/`
                          : `/en/packages/${rp.code}/`
                      }
                      className="group block rounded-md border border-hairline p-3 transition-colors hover:border-gold-border hover:bg-gold-wash/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-ink group-hover:text-gold-text">
                          {rp.name}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-gold-text" />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-soft">
                        <span className="capitalize">{rp.category.replace(/_/g, " ")}</span>
                        {rp.starting_price_inr && (
                          <span className="font-semibold text-gold-text">
                            From ₹{rp.starting_price_inr.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-xs text-ink-soft">
                    <p>Looking for a custom itinerary?</p>
                    <a
                      href="/en/contact/"
                      className="mt-2 inline-block font-semibold text-gold-text hover:underline"
                    >
                      Speak with our concierge desk →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 24/7 Telephone Assistance */}
            <div className="rounded-xl border border-hairline bg-surface-2/60 p-5 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-gold">
                <Phone className="h-4 w-4" />
              </span>
              <p className="mt-3 font-display text-sm font-semibold text-ink">Have a Custom Request?</p>
              <p className="mt-1 text-xs text-ink-soft">
                Our operations coordinators are available 24 hours a day for bespoke routes and multi-city itineraries.
              </p>
              <a
                href={`tel:${contact.phone}`}
                className="mt-3 block font-display text-base font-bold text-gold-text hover:underline"
              >
                {contact.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductDetailPage;
