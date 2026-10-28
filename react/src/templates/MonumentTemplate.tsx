import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTouristTripSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";
import { GroupedVehicleSection } from "../components/fleet/GroupedVehicleSection";
import localPackagesData from "../data/generated-published-local-packages.json";

export interface DossierMonumentItem {
  id: string;
  slug?: string;
  monumentCode?: string;
  name: string;
  visitingHours: string;
  closedNote: string;
  metaTitle?: string;
  metaDescription?: string;
  historicalContext?: string | null;
  visitorGuide?: string | null;
  architectureHighlights?: string[];
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

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
  const matchedPkg = (localPackagesData as any[]).find(
    (p) => p.slug === matchedPackageCode || p.packageCode === matchedPackageCode
  );
  const fleetPrices: Record<string, number> = matchedPkg?.fleetPrices || {};
  const validRates = Object.values(fleetPrices).filter((v) => typeof v === "number" && v > 0);
  const startingFare = Number(fleetPrices.sedan || (validRates.length > 0 ? Math.min(...validRates) : 0));
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);

  const bookingUrl = `/book.html?category=local_package&product=${encodeURIComponent(matchedPackageCode)}&from=Agra&to=${encodeURIComponent(item.name)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    startingFare > 0
      ? `Hello Agra SK Baghel Tour & Travels, I want to book a cab transfer or guided tour for "${item.name}" from ₹${startingFare.toLocaleString("en-IN")}.`
      : `Hello Agra SK Baghel Tour & Travels, I want to book a cab transfer or guided tour for "${item.name}".`
  )}`;

  // Default images if none provided in item
  const galleryImages = item.images && item.images.length > 0 ? item.images : [
    "/assets/places/gallery/taj-mahal-01.jpg",
    "/assets/places/gallery/agra-fort-01.jpg",
    "/assets/places/gallery/mehtab-bagh-01.jpg",
  ];

  const faqs = [
    {
      q: `What are the visiting hours and entry rules for ${item.name}?`,
      a: `${item.name} is open from ${item.visitingHours}. ${item.closedNote}. For dawn or sunrise visits, we recommend reaching the entry plaza 30–45 minutes prior to gate opening to pass through security checkpoints smoothly.`,
    },
    {
      q: `Is ${item.name} closed on any day of the week?`,
      a: `Operational status: ${item.closedNote}. Note that the Taj Mahal is strictly closed every Friday for congregational prayers, whereas other Agra monuments (Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah, Sikandra, and Mehtab Bagh) remain open all 7 days of the week.`,
    },
    {
      q: `How can travelers purchase monument entry tickets?`,
      a: `Tickets can be purchased digitally through the official Archaeological Survey of India (ASI) ticketing portal (asi.payumoney.com) or by scanning on-site contactless QR codes at the entry plaza. Our chauffeur will guide you directly to the correct line and parking zone.`,
    },
    {
      q: `Where does the taxi or cab drop visitors at ${item.name}?`,
      a: `Under Agra Archaeological Protection regulations, commercial motorized cabs drop guests at designated parking plazas (such as Shilpgram at Taj East Gate or Agra Fort parking). Pollution-free battery-operated golf carts transfer visitors the remaining distance to the main gates.`,
    },
    {
      q: `Are licensed government tour guides available at ${item.name}?`,
      a: `Yes! We coordinate with Ministry of Tourism and ASI-approved licensed guides speaking English, French, Spanish, German, and Italian at standardized government rates. We advise avoiding unauthorized touts near parking lots.`,
    },
    {
      q: `What items are restricted or prohibited inside ${item.name}?`,
      a: `Food items, chewing gum, smoking devices, lighters, tripods, large backpacks, and sharp objects are strictly prohibited inside the monument. Mobile phones and small handheld digital cameras are permitted. Secure locker facilities are available at ticket gates.`,
    },
    {
      q: `What footwear rules are enforced inside ${item.name}?`,
      a: `To preserve centuries-old marble and sandstone plinths, visitors must either remove shoes or wear disposable shoe covers (provided complimentary or for a nominal fee at security booths before stepping onto the main plinth).`,
    },
    {
      q: `How does private cab booking to ${item.name} work?`,
      a: `Book online with a 28% advance deposit (₹${tokenAdvance.toLocaleString("en-IN")}) and pay the 72% balance upon completion. Your dedicated chauffeur will pick you up from your hotel or Agra Cantt Railway Station and remain on standby until your monument tour finishes.`,
    },
    {
      q: `What is the cancellation policy for monument transfers?`,
      a: `Enjoy 100% peace of mind with our 24-Hour Free Cancellation guarantee. If your schedule changes and you cancel at least 24 hours prior to departure, your entire 28% deposit is refunded promptly without penalty.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/monuments/${monumentSlug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Monuments", url: "/en/monuments/" },
    { name: item.name, url: canonicalUrl },
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
            <a className="hover:text-primary transition-colors" href="/en/monuments/">Monuments</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">{item.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider">
            <span className="material-symbols-outlined text-icon-14">account_balance</span>
            Mughal Heritage Wonder
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
                {item.historicalContext || `Experience the architectural mastery and historical majesty of ${item.name}. Private air-conditioned transfers, doorstep hotel pickup in Agra, and verified government heritage guide assistance.`}
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
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">
                      {startingFare > 0 ? `₹${startingFare}` : "Transparent"}
                    </span>
                    <span className="text-label-md text-secondary">
                      {startingFare > 0 ? "Cab Tour From" : "Direct Cab Booking"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Booking Bar */}
              <div className="bg-sandstone-wash/80 p-space-lg rounded-xl border border-border-warm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase">
                    {startingFare > 0 ? "Sightseeing Tour Package" : "Dedicated Monument Transfer"}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {startingFare > 0 ? (
                      <>
                        <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">
                          ₹{startingFare.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
                      </>
                    ) : (
                      <span className="font-headline-md text-headline-md text-ink-charcoal font-serif font-semibold">
                        Sightseeing Package
                      </span>
                    )}
                  </div>
                  <span className="text-body-sm text-secondary">
                    {startingFare > 0
                      ? `Lock with only ₹${tokenAdvance.toLocaleString("en-IN")} (28% advance deposit)`
                      : "Verified chauffeurs, clean AC fleet, all parking & monument logistics included"}
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
                  alt={`${item.name} architectural view in Agra`}
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

      {/* Section 2: Architectural Legacy & Historical Narrative */}
      <section className="w-full bg-surface-container-lowest py-space-2xl border-t border-border-warm/40">
        <div className="max-w-5xl mx-auto px-margin-mobile lg:px-margin flex flex-col gap-space-lg">
          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest">
              Heritage Dossier
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif">
              Architectural Legacy & History of {item.name}
            </h2>
          </div>

          <div className="prose prose-lg max-w-none text-on-surface-variant font-body-md leading-relaxed space-y-4">
            <p>{item.historicalContext}</p>
          </div>

          {/* Architectural Highlights Grid */}
          {item.architectureHighlights && item.architectureHighlights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {item.architectureHighlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low border border-border-warm/50"
                >
                  <span className="material-symbols-outlined text-primary text-icon-20 mt-0.5 shrink-0">
                    check_circle
                  </span>
                  <span className="font-body-md text-on-surface text-sm leading-normal">
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Visitor Guidelines & Logistics */}
      <section className="w-full bg-surface py-space-2xl border-t border-border-warm/30">
        <div className="max-w-5xl mx-auto px-margin-mobile lg:px-margin flex flex-col gap-space-lg">
          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest">
              Visitor Information
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif">
              Visiting Guidelines, Entry Tickets & Hours
            </h2>
          </div>

          {item.visitorGuide && (
            <div className="p-space-lg rounded-xl bg-sandstone-wash/40 border border-border-warm/60 text-on-surface-variant font-body-md leading-relaxed">
              <p>{item.visitorGuide}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-icon-20">qr_code_scanner</span>
              </div>
              <h3 className="font-title-md text-sm font-semibold text-ink-charcoal">Electronic Ticketing</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Scan ASI QR codes on-site or book in advance at asi.payumoney.com to bypass physical ticket lines.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-icon-20">footprint</span>
              </div>
              <h3 className="font-title-md text-sm font-semibold text-ink-charcoal">Shoe Covers Required</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Wear disposable covers or remove footwear prior to walking on historic marble and red sandstone plinths.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-icon-20">electric_car</span>
              </div>
              <h3 className="font-title-md text-sm font-semibold text-ink-charcoal">Eco Golf Carts</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Zero-emission electric shuttles transport visitors the last 500 meters from parking plazas to entry gates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-icon-20">lock</span>
              </div>
              <h3 className="font-title-md text-sm font-semibold text-ink-charcoal">Cloakroom Lockers</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Large bags, tripods, and tobacco items must be deposited in secure government lockers near the ticket booth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Chauffeur Transfer & Waiting Service */}
      <section className="w-full bg-surface-container-low py-space-2xl border-t border-border-warm/30">
        <div className="max-w-5xl mx-auto px-margin-mobile lg:px-margin flex flex-col gap-space-lg">
          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest">
              Chauffeur Transportation
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif">
              Doorstep Cab Transfers & Dedicated Waiting Guarantee
            </h2>
            <p className="text-on-surface-variant text-sm max-w-3xl leading-relaxed">
              Visiting Agra's monuments should be stress-free and luxurious. Our verified chauffeurs provide private air-conditioned transportation with dedicated waiting throughout your monument tour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-warm/60 flex flex-col gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">hotel</span>
              <h3 className="font-title-md text-base font-semibold text-ink-charcoal">Doorstep Hotel Pickup</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                We meet you at your hotel lobby, home residence, or Agra Cantt Railway Station with punctuality guaranteed.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-warm/60 flex flex-col gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">timelapse</span>
              <h3 className="font-title-md text-base font-semibold text-ink-charcoal">Driver Waiting Guarantee</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Take all the time you need to explore and photograph. Your vehicle and chauffeur remain on standby at the parking bay.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-warm/60 flex flex-col gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
              <h3 className="font-title-md text-base font-semibold text-ink-charcoal">Zero Tourist Traps</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                We strictly uphold a zero-commission policy: no forced souvenir shops, emporiums, or unauthorized tout detours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Dedicated Transport Fleet Options */}
      <section className="w-full bg-surface py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <GroupedVehicleSection
            rates={fleetPrices}
            category="local_package"
            productSlug={matchedPackageCode}
            pickup="Agra"
            drop={item.name}
            title={`Fleet Options & Rates for ${item.name}`}
            subtitle="Doorstep hotel pickup in Agra, dedicated chauffeur waiting at authorized parking plazas, and comfortable drop-off."
            updatedAt={item.updatedAt}
          />
        </div>
      </section>

      {/* Section 6: Monument FAQs */}
      <section className="w-full bg-surface-container-low py-space-3xl">
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
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                open
                className="group rounded-xl border border-border-warm/60 bg-surface-container-lowest overflow-hidden transition-all shadow-sm"
              >
                <summary className="w-full px-space-lg py-space-md text-left flex items-center justify-between gap-space-md hover:bg-sandstone-wash/30 transition-colors cursor-pointer select-none list-none">
                  <span className="font-title-md text-ink-charcoal font-serif">{faq.q}</span>
                  <span className="material-symbols-outlined text-icon-20 text-terracotta-sandstone transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-space-lg pb-space-md pt-space-xs border-t border-border-warm/20 text-body-md text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default MonumentTemplate;
