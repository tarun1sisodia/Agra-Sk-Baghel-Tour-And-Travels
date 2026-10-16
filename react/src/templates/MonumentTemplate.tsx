import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTouristTripSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";
import { VEHICLE_TIERS, type VehicleTier } from "../contracts/vehicle-tiers";

export interface DossierMonumentItem {
  id: string;
  slug?: string;
  monumentCode?: string;
  name: string;
  visitingHours: string;
  closedNote: string;
  historicalContext?: string | null;
  sortOrder?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type MonumentItem = DossierMonumentItem;

export interface MonumentTemplateProps {
  language?: SupportedLanguage;
  item: DossierMonumentItem;
}

const CANONICAL_FLEET_SPECS: Record<VehicleTier, { name: string; seats: string; bags: string; ac: string; fare: number }> = {
  sedan: { name: "Sedan (Dzire / Etios)", seats: "4 Passengers", bags: "2 Bags", ac: "Dual Climate AC", fare: 800 },
  ertiga: { name: "Ertiga MPV", seats: "6 Passengers", bags: "3 Bags", ac: "Roof-Mounted AC", fare: 1050 },
  "innova-crysta": { name: "Toyota Innova Crysta", seats: "6-7 Passengers", bags: "4 Bags", ac: "VIP Climate Cabin", fare: 1400 },
  "tempo-traveller": { name: "Tempo Traveller", seats: "12–16 Passengers", bags: "Luggage Bay", ac: "Individual AC Vents", fare: 2400 },
  urbania: { name: "Force Urbania Luxury Van", seats: "10–17 Passengers", bags: "Full Luggage Bay", ac: "Monocoque Luxury AC", fare: 3800 },
};

function formatFareDate(dateStr?: string | null): string {
  if (!dateStr) return "October 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "October 2026";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "October 2026";
  }
}

export function MonumentTemplate({ item }: MonumentTemplateProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const startingFare = 800;
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);
  const monumentSlug = item.slug ?? item.monumentCode ?? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const MONUMENT_TO_PACKAGE_MAP: Record<string, string> = {
    "taj-mahal": "taj-mahal-sightseeing",
    "agra-fort": "agra-fort-taj-tour",
    "agra-red-fort": "agra-fort-taj-tour",
    "fatehpur-sikri": "fatehpur-sikri-tour",
    "itmad-ud-daulah": "baby-taj-mehtab-bagh",
    "itmad-ud-daulah-baby-taj": "baby-taj-mehtab-bagh",
    "baby-taj": "baby-taj-mehtab-bagh",
    "mehtab-bagh": "baby-taj-mehtab-bagh",
    "sikandra": "agra-standard-sightseeing",
    "sikandra-akbar-tomb": "agra-standard-sightseeing",
    "aram-bagh": "agra-standard-sightseeing",
    "aram-bagh-ram-bagh": "agra-standard-sightseeing",
  };
  const matchedPackageCode = MONUMENT_TO_PACKAGE_MAP[monumentSlug] || "agra-standard-sightseeing";

  const bookingUrl = `/book.html?category=local_package&product=${encodeURIComponent(matchedPackageCode)}&from=Agra&to=${encodeURIComponent(item.name)}&car=sedan`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour & Travels, I want to book a cab transfer or guided tour for "${item.name}".`
  )}`;

  // Default images if none provided in item
  const galleryImages = item.images && item.images.length > 0 ? item.images : [
    "/assets/places/gallery/taj-mahal-01.jpg",
    "/assets/places/gallery/agra-fort-01.jpg",
    "/assets/places/gallery/mehtab-bagh-01.jpg",
  ];

  const faqs = [
    {
      q: `What are the visiting hours for ${item.name}?`,
      a: `${item.name} is open from ${item.visitingHours}. ${item.closedNote}. For sunrise viewing, visitors are advised to reach the ticket barrier 30–45 minutes prior to gate opening.`,
    },
    {
      q: `Is ${item.name} closed on any day of the week?`,
      a: `Operational status: ${item.closedNote}. Please note that the Taj Mahal is closed on Fridays for congregational prayers, whereas other Agra monuments (Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah) remain open all 7 days.`,
    },
    {
      q: `How can we book monument entry tickets?`,
      a: `Tickets can be purchased electronically on the official Archaeological Survey of India (ASI) ticketing portal (asi.payumoney.com) or via on-site contactless QR kiosks at the entry plaza. Your chauffeur will guide you directly to the correct line.`,
    },
    {
      q: `Where does the taxi or cab drop visitors at ${item.name}?`,
      a: `Due to Agra Archaeological Protection regulations, commercial motorized vehicles drop passengers at designated parking plazas (such as Taj East Gate or West Gate parking). Battery-operated electric golf carts and shuttles transport visitors the remaining 500 meters to the main gate.`,
    },
    {
      q: `Are official tour guides available at ${item.name}?`,
      a: `Yes! We coordinate with Ministry of Tourism and ASI-licensed historians speaking English, French, Spanish, German, and Italian at government-approved rates. Beware of unauthorized touts near parking bays.`,
    },
    {
      q: `What items are prohibited inside ${item.name}?`,
      a: `Eating items, chewing gum, smoking devices, matchboxes, tripods, large backpacks, and sharp objects are strictly prohibited inside central Mughal monument sanctums. Cell phones and small handheld digital cameras are permitted. Locker rooms are available at security checkpoints.`,
    },
    {
      q: `What shoe protocol is required inside ${item.name}?`,
      a: `To protect ancient marble and red sandstone floors, visitors must either remove footwear or wear disposable shoe covers (provided complimentary or for a nominal fee at the main plinth security booth).`,
    },
    {
      q: `How does cab booking to ${item.name} work?`,
      a: `You can book a dedicated point-to-point transfer or full-day sightseeing charter online with a 28% deposit (₹${tokenAdvance.toLocaleString("en-IN")}). Your chauffeur will meet you at your hotel lobby or Agra Cantt station and wait until your visit concludes.`,
    },
    {
      q: `What is the cancellation policy for monument transfers?`,
      a: `Enjoy full flexibility with our 24-Hour Free Cancellation guarantee. If your schedule changes and you cancel 24 hours prior to pickup, 100% of your deposit is refunded without deduction.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/monuments/${monumentSlug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Monuments", url: "/packages/" },
    { name: item.name, url: `/monuments/${monumentSlug}/` },
  ]);

  const faqSchema = buildFaqSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));

  const tripSchema = buildTouristTripSchema({
    name: `${item.name} Heritage Visit & Cab Transfer`,
    description: `Visiting hours, heritage guidelines, and dedicated AC taxi transfers to ${item.name} in Agra. Starting ₹${startingFare}.`,
    touristType: ["Cultural Heritage Sightseeing", "Monument Exploration"],
    offers: {
      price: startingFare,
      priceCurrency: "INR",
      availability: "InStock",
    },
  });

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={buildGraphSchema(breadcrumbSchema, faqSchema, tripSchema)} />

      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/packages/">Heritage Guides</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">{item.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider">
            <span className="material-symbols-outlined text-icon-14">account_balance</span>
            UNESCO World Heritage Site
          </span>
        </div>
      </div>

      {/* Hero Monument Showcase */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            {/* Left Column: Monument Specs */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-widest w-fit">
                <span className="material-symbols-outlined text-icon-14">schedule</span>
                {item.visitingHours} • {item.closedNote}
              </span>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {item.name}
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                {item.historicalContext || `Experience the breathtaking architectural mastery of ${item.name}. Private air-conditioned transfers, doorstep hotel pickup, and verified government heritage guide coordination.`}
              </p>

              {/* Protocol Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">schedule</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.visitingHours}</span>
                    <span className="text-label-md text-secondary">Visiting Hours</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">event_busy</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.closedNote}</span>
                    <span className="text-label-md text-secondary">Weekly Closure</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">verified</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">₹{startingFare}</span>
                    <span className="text-label-md text-secondary">Cab Transfer From</span>
                  </div>
                </div>
              </div>

              {/* Direct Booking Bar */}
              <div className="bg-sandstone-wash/80 p-space-lg rounded-xl border border-border-warm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase">Dedicated Transfer (Sedan)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">
                      ₹{startingFare.toLocaleString("en-IN")}
                    </span>
                    <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
                  </div>
                  <span className="text-body-sm text-secondary">
                    Lock with only ₹{tokenAdvance.toLocaleString("en-IN")} (28% advance deposit)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm">
                  <a
                    className="inline-flex items-center justify-center gap-space-xs bg-terracotta-deep text-white px-6 py-3.5 rounded text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all duration-200"
                    href={bookingUrl}
                  >
                    <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                    <span>Book Taxi to {item.name.split(" ")[0]}</span>
                  </a>
                  <a
                    className="inline-flex items-center justify-center gap-space-xs bg-black text-white hover:bg-neutral-900 border border-white/10 px-5 py-3.5 rounded text-label-lg font-label-lg shadow-sm transition-all duration-200 active:scale-[0.98]"
                    style={{ color: "#ffffff" }}
                    href={whatsappUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
                    <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Multi-Image Heritage Showcase */}
            <div className="lg:col-span-5 relative flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-surface-container border border-border-warm/60 h-[380px]">
                <img
                  className="w-full h-full object-cover transition-all duration-500"
                  src={galleryImages[selectedImageIndex] || galleryImages[0]}
                  alt={`${item.name} architectural view`}
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/places/gallery/taj-mahal-01.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-ivory-surface flex items-center justify-between">
                  <span className="font-title-md text-title-md font-serif">{item.name}</span>
                  <span className="bg-primary/90 text-ivory-surface px-3 py-1 rounded text-label-caps uppercase">
                    Historic Monument
                  </span>
                </div>
              </div>

              {/* Thumbnails strip */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx ? "border-primary ring-2 ring-primary/40 scale-102" : "border-border-warm opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`${item.name} thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Dedicated Transport Fleet Options */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Corridor Transport Options
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Dedicated Taxi Rates to {item.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Doorstep hotel pickup in Agra, dedicated chauffeur waiting at authorized parking plazas, and comfortable drop-off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {VEHICLE_TIERS.map((tier) => {
              const spec = CANONICAL_FLEET_SPECS[tier];
              const token = Math.round(spec.fare * 0.28);

              return (
                <div
                  key={tier}
                  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-border-warm/60 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-md uppercase tracking-wider font-semibold">
                        {tier.replace("-", " ")}
                      </span>
                      <span className="text-body-sm text-secondary font-medium">{spec.seats.split(" ")[0]} Seats</span>
                    </div>

                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif mt-1">{spec.name}</h3>

                    <div className="flex flex-col gap-1 py-space-xs border-y border-border-warm/30 text-body-sm text-on-surface-variant">
                      <div className="flex items-center justify-between">
                        <span>Luggage:</span>
                        <span className="font-medium text-ink-charcoal">{spec.bags}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Climate:</span>
                        <span className="font-medium text-success-jade">{spec.ac}</span>
                      </div>
                    </div>

                    <div className="flex flex-col pt-1">
                      <span className="text-label-md font-label-caps text-secondary uppercase">All-Inclusive Fare</span>
                      <span className="font-headline-md text-headline-md text-terracotta-sandstone font-serif font-semibold">
                        ₹{spec.fare.toLocaleString("en-IN")}
                      </span>
                      <span className="text-label-md text-secondary">
                        ₹{token.toLocaleString("en-IN")} token to lock (28%)
                      </span>
                    </div>
                  </div>

                  <a
                    className="mt-space-md w-full inline-flex items-center justify-center gap-1 bg-terracotta-deep text-white py-2.5 rounded text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center"
                    href={`/book.html?category=local_package&product=${encodeURIComponent(matchedPackageCode)}&from=Agra&to=${encodeURIComponent(item.name)}&car=${tier}&step=1`}
                  >
                    <span>Select {tier === "innova-crysta" ? "Innova" : tier.split("-")[0]}</span>
                    <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Monument FAQs */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Visitor Information
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Frequently Asked Questions for {item.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ticketing guidelines, security regulations, and parking procedures for your visit.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border-warm/60 bg-surface-container-lowest overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-space-lg py-space-md text-left flex items-center justify-between gap-space-md hover:bg-sandstone-wash/30 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-ink-charcoal font-serif">{faq.q}</span>
                    <span className={`material-symbols-outlined text-icon-20 text-terracotta-sandstone transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-space-lg pb-space-md pt-space-xs border-t border-border-warm/20 text-body-md text-on-surface-variant leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
