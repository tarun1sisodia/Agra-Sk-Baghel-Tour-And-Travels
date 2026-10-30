import { useEffect, useMemo, useState } from "react";
import type { SupportedLanguage } from "../config";
import {
  PrimaryButton,
  WhatsAppButton,
  EDITORIAL_TYPOGRAPHY,
  EDITORIAL_BUTTONS,
} from "../components/layout/EditorialPageTemplate";
import { fetchLiveFleet, type PublicFleetVehicle } from "../services/catalog";
import { useScrollReveal } from "../utils/scrollReveal";

export interface ServicesPageProps {
  language?: SupportedLanguage;
}

interface ServiceCategory {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  tag: string;
  description: string;
  image: string;
  highlights: string[];
  vehicleTypes?: string;
  idealFor: string;
  tariffSummary?: string;
  bookingUrl: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  inquiryText: string;
}

const CANONICAL_CATEGORIES: Omit<ServiceCategory, "vehicleTypes" | "tariffSummary">[] = [
  {
    id: "outstation",
    number: "01",
    name: "Outstation & Intercity Corridors",
    subtitle: "EXPRESSWAY ONE-WAY & MULTI-DAY ROUND TRIPS",
    tag: "POINT-TO-POINT & ROUND TRIP",
    description:
      "Swift, private, access-controlled expressway transit connecting Agra to New Delhi, IGI Airport, Jaipur, Mathura, Gwalior, and Lucknow. Choose between direct point-to-point one-way drops with zero empty return charges, or reserve a dedicated chauffeur for multi-day touring with transparent garage logbooks.",
    image: "/assets/destinations/jaipur-hawa-mahal.webp",
    highlights: [
      "Yamuna & Agra-Lucknow expressway tolls included for one-way drops",
      "Round-trip multi-day touring with dedicated chauffeur & 300 km/day billing",
      "Doorstep pickup anywhere in Agra city & direct drop to Delhi NCR terminals",
      "All-India commercial tourist permits with flight delay arrival tracking",
    ],
    idealFor: "Executive business passengers, interstate family travel, and Golden Triangle circuits.",
    bookingUrl: "/book?category=outstation",
    secondaryUrl: "/routes",
    secondaryLabel: "Explore Outstation Routes",
    inquiryText: "Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about Outstation Chauffeur Services.",
  },
  {
    id: "local-sightseeing",
    number: "02",
    name: "Local Heritage & City Sightseeing",
    subtitle: "DISCOVER AGRA MONUMENTS AT YOUR PACE",
    tag: "HALF-DAY & FULL-DAY SLOTS",
    description:
      "Explore the architectural crown jewels of the Mughal Empire in relaxed, air-conditioned luxury. Our polite, experienced chauffeurs navigate monument gates, parking areas, and tourist congestion while you experience Agra's UNESCO world heritage sites at your own rhythm.",
    image: "/assets/packages/agra-fort.webp",
    highlights: [
      "Covers Taj Mahal, Agra Fort, Itimad-ud-Daulah (Baby Taj), and Mehtab Bagh",
      "Flexible 8-hour / 80 km or 12-hour / 120 km sightseeing packages",
      "Dedicated AC vehicle and chauffeur on standby at every monument gate",
      "Zero commission shopping halts; 100% guest-focused heritage itinerary",
    ],
    idealFor: "Heritage lovers, families, photographers, and independent voyagers.",
    bookingUrl: "/book?category=local",
    secondaryUrl: "/packages",
    secondaryLabel: "View Tour Packages",
    inquiryText: "Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about Agra Local Sightseeing Cabs.",
  },
  {
    id: "transfers",
    number: "03",
    name: "Airport & Railway Station Transit",
    subtitle: "ARRIVE WITHOUT THE STRESS",
    tag: "PUNCTUAL PLATFORM & TERMINAL PICKUPS",
    description:
      "Guaranteed punctual transit between terminals and your doorstep. Whether arriving on the Gatimaan Express at Agra Cantt or catching an international departure from Delhi IGI Airport Terminal 1, 2, or 3, your private chauffeur is at the curb 15 minutes prior to scheduled arrival.",
    image: "/assets/fleet/ertiga.webp",
    highlights: [
      "Personalized arrival signboard greeting at platform and airport exits",
      "Live train and flight status tracking for delay protection",
      "Luggage handling assistance and direct curbside drop-off",
      "Direct transit via Yamuna Expressway for Delhi IGI flights",
    ],
    idealFor: "International flight passengers, executive arrivals at Agra Cantt station.",
    bookingUrl: "/book?category=transfer",
    secondaryUrl: "/book",
    secondaryLabel: "Book Fast Transfer",
    inquiryText: "Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about Airport / Station Transfers.",
  },
  {
    id: "tour-packages",
    number: "04",
    name: "Curated Heritage & Multi-Day Circuits",
    subtitle: "JOURNEYS WORTH REMEMBERING",
    tag: "HANDCRAFTED PRIVATE ITINERARIES",
    description:
      "All-inclusive private touring circuits crafted to maximize monument access and eliminate travel fatigue. From early dawn VIP entry at the Taj Mahal to the sacred evening aarti of Mathura-Vrindavan and the royal forts of Rajasthan.",
    image: "/assets/packages/taj-dawn.webp",
    highlights: [
      "VIP Sunrise Taj Mahal Guided Tour with early dawn monument entry",
      "Mathura & Vrindavan Darshan covering Krishna Janmabhoomi & Prem Mandir",
      "Same-Day Agra by Gatimaan Superfast Express with private AC cab",
      "Golden Triangle 3-Day Circuit (Delhi – Agra – Jaipur)",
    ],
    idealFor: "First-time international visitors, families, and curated luxury holidays.",
    bookingUrl: "/book?category=tour",
    secondaryUrl: "/packages",
    secondaryLabel: "Explore Handcrafted Tours",
    inquiryText: "Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about Handcrafted Tour Packages.",
  },
];

export function ServicesPage({ language = "en" }: ServicesPageProps) {
  const [liveFleet, setLiveFleet] = useState<PublicFleetVehicle[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchLiveFleet()
      .then((fleet) => {
        if (active && fleet.length > 0) {
          setLiveFleet(fleet);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo<ServiceCategory[]>(() => {
    const activeVehicles = liveFleet.filter((v) => v.active);
    const sedan = activeVehicles.find((v) => v.id === "sedan" || v.tier === "sedan");
    const activeSummary =
      activeVehicles.length > 0
        ? activeVehicles.map((v) => v.name).join(", ")
        : "Executive Sedan, Ertiga MPV, Innova Crysta, Tempo Traveller";

    return CANONICAL_CATEGORIES.map((cat) => {
      let tariffSummary = "Published Package Rates · Server-Authoritative Fares";
      let vehicleTypes = activeSummary;

      if (cat.id === "outstation") {
        tariffSummary =
          sedan && sedan.perKm > 0
            ? `Starting ₹${sedan.perKm}/km for Round-Trip · Verified Point-to-Point Fares`
            : "Verified Point-to-Point Outstation Fares · Tolls Included";
      } else if (cat.id === "local-sightseeing") {
        tariffSummary = "Published 8 Hr & 12 Hr Packages · Zero Surge Guarantee";
        const localVehicles = activeVehicles.filter((v) => ["sedan", "ertiga", "innova", "tempo"].includes(v.tier || v.id));
        if (localVehicles.length > 0) {
          vehicleTypes = localVehicles.map((v) => v.name).join(", ");
        }
      } else if (cat.id === "transfers") {
        tariffSummary = "Fixed Platform & Terminal Transfers · Zero Parking Extras";
        const transferVehicles = activeVehicles.filter((v) => ["sedan", "ertiga", "innova"].includes(v.tier || v.id));
        if (transferVehicles.length > 0) {
          vehicleTypes = transferVehicles.map((v) => v.name).join(", ");
        }
      } else if (cat.id === "tour-packages") {
        tariffSummary = "All-Inclusive Circuits · Licensed Guides & Chauffeur";
      }

      return {
        ...cat,
        vehicleTypes,
        tariffSummary,
      };
    });
  }, [liveFleet]);

  useScrollReveal([categories]);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* ── 1. HERO & BREADCRUMBS ── */}
      <section className="relative w-full bg-surface-container-low texture overflow-hidden border-b border-border-warm/60">
        <div className="relative max-w-[1280px] mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-2xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs mb-space-lg text-on-surface-variant font-label-caps text-xs reveal">
            <a className="hover:text-primary transition-colors sweep inline-block" href="/">
              Home
            </a>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span className="text-primary font-bold">Services</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-end reveal">
            <div className="lg:col-span-8 flex flex-col">
              <span className={EDITORIAL_TYPOGRAPHY.eyebrow}>Concierge Transit Portfolio</span>
              <h1 className={`${EDITORIAL_TYPOGRAPHY.heroH1} hero-line max-w-3xl mt-1.5`}>
                Every journey in North India,{" "}
                <span className={EDITORIAL_TYPOGRAPHY.heroAccent}>thoughtfully chauffeured.</span>
              </h1>
            </div>
            <div className="lg:col-span-4 flex flex-col pb-1">
              <p className={`${EDITORIAL_TYPOGRAPHY.lead} mb-space-lg`}>
                From fast one-way expressway drops to multi-day touring circuits, our fleet delivers
                transparent billing, courteous drivers, and round-the-clock local dispatch support.
              </p>
              <div className="flex flex-wrap items-center gap-space-sm">
                <PrimaryButton href="/book">
                  Book Cab Online
                </PrimaryButton>
                <WhatsAppButton
                  inquiryText="Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about cab bookings."
                  label="WhatsApp Desk"
                />
              </div>
            </div>
          </div>

          {/* Quick Directory Jump Strip (The 4 Canonical Categories) */}
          <div className="mt-space-lg pt-space-md reveal" style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
            <p className={EDITORIAL_TYPOGRAPHY.eyebrow}>
              Quick Category Jump
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-space-xs mt-1.5 row-scroll">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-label-caps text-body-sm transition-all font-bold lift border border-border-warm/50"
                  href={`#${cat.id}`}
                >
                  <span className="text-primary mr-1.5">{cat.number}</span>
                  {cat.name.split("&")[0].trim()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. THE 4 CANONICAL CATEGORY EDITORIAL SECTIONS ── */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-space-xl flex flex-col gap-8 sm:gap-12">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto reveal">
          <span className={EDITORIAL_TYPOGRAPHY.eyebrow}>
            Authoritative Product Portfolio
          </span>
          <h2 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} hero-line mt-1`}>
            Handcrafted transportation designed for modern voyagers.
          </h2>
          <p className={`${EDITORIAL_TYPOGRAPHY.body} mt-1.5`}>
            Every service is backed by our Taj Ganj dispatch operations, strict vehicle cleanliness inspections, and verified
            server-authoritative pricing.
          </p>
        </div>

        {categories.map((cat, idx) => {
          const isExpanded = expandedCardId === cat.id;

          return (
            <article
              key={cat.id}
              id={cat.id}
              style={{ "--reveal-delay": `${(idx % 2) * 120}ms` } as React.CSSProperties}
              className="scroll-mt-24 group relative rounded-2xl overflow-hidden border border-border-warm/70 bg-ink-charcoal text-ivory-surface shadow-md lift reveal focus-within:ring-2 focus-within:ring-primary/60"
            >
              {/* Full-Bleed Atmospheric Image & Backdrop */}
              <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[560px] flex flex-col justify-between overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-focus-within:scale-105"
                />
                {/* Deep Luxury Editorial Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight via-ink-midnight/80 to-ink-midnight/40" />
                <div className="absolute inset-0 bg-radial-[at_top_right] from-transparent via-black/20 to-black/60 pointer-events-none" />

                {/* Top Banner: Category Number, Subtitle & Prominent TOP Title */}
                <div className="relative z-10 p-5 sm:p-6 lg:p-8 flex flex-col gap-2.5 border-b border-white/10 backdrop-blur-xs bg-ink-midnight/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-price-display text-2xl sm:text-3xl text-primary-fixed-dim font-bold">
                        {cat.number}
                      </span>
                      <div className="h-4 w-px bg-white/20" />
                      <span className="font-label-caps text-terracotta-sunlit uppercase font-bold tracking-widest text-xs">
                        {cat.subtitle}
                      </span>
                    </div>
                    <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-black/40 border border-gold-accent/40 text-gold-accent font-label-caps text-label-md font-bold tracking-wider backdrop-blur-md">
                      {cat.tag}
                    </span>
                  </div>

                  <h3 className="font-headline-hero text-2xl sm:text-3xl lg:text-4xl text-ivory-surface font-semibold leading-tight mt-0.5">
                    {cat.name}
                  </h3>

                  {/* Accessible Mobile Tap Interaction Toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedCardId(isExpanded ? null : cat.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`details-${cat.id}`}
                    className="sm:hidden self-start mt-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gold-accent text-xs font-bold font-label-caps flex items-center gap-1.5 transition-colors hover:bg-white/20 active:scale-95"
                  >
                    <span>{isExpanded ? "Hide Details" : "Tap for Details & Booking"}</span>
                    <span className="material-symbols-outlined text-icon-14">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>

                {/* Detailed Information: Intentional Reveal on Scroll & Hover/Focus on Desktop; Tap on Mobile */}
                <div
                  id={`details-${cat.id}`}
                  className={`relative z-10 p-5 sm:p-6 lg:p-8 flex flex-col justify-end bg-gradient-to-t from-ink-midnight via-ink-midnight/95 to-transparent pt-6 sm:pt-10 transition-all duration-300 ${
                    isExpanded ? "block" : "hidden sm:block sm:opacity-95 group-hover:opacity-100 group-focus-within:opacity-100"
                  }`}
                >
                  <div className="max-w-4xl">
                    <p className="font-body-md text-ivory-surface/85 text-sm sm:text-base leading-relaxed mb-4 max-w-3xl">
                      {cat.description}
                    </p>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-4 py-3 border-y border-white/15">
                      {cat.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-start gap-2 text-ivory-surface/90 text-xs sm:text-sm">
                          <span className="material-symbols-outlined text-success-jade text-icon-16 shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fleet & Suitability Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs text-ivory-surface/75">
                      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                        <strong className="block text-gold-accent font-label-caps uppercase text-label-caps tracking-wider mb-1">
                          Active Fleet Options
                        </strong>
                        <span className="text-ivory-surface/90">{cat.vehicleTypes}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                        <strong className="block text-gold-accent font-label-caps uppercase text-label-caps tracking-wider mb-1">
                          Best Suited For
                        </strong>
                        <span className="text-ivory-surface/90">{cat.idealFor}</span>
                      </div>
                    </div>

                    {/* Action Dock: Tariff Pill + Dual Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-terracotta-sunlit text-icon-18">
                          verified
                        </span>
                        <span className="font-label-caps text-ivory-surface/80 text-xs tracking-wider">
                          {cat.tariffSummary}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <PrimaryButton href={cat.bookingUrl} size="md">
                          Reserve Service
                        </PrimaryButton>
                        {cat.secondaryUrl && (
                          <a
                            href={cat.secondaryUrl}
                            className={EDITORIAL_BUTTONS.secondary}
                          >
                            {cat.secondaryLabel || "View Details"}
                          </a>
                        )}
                        <WhatsAppButton
                          size="md"
                          inquiryText={cat.inquiryText}
                          label="WhatsApp Consultation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── 3. WHY CHOOSE US (4 ASSURANCES) ── */}
      <section className="w-full bg-surface-container-low texture py-8 sm:py-space-xl border-t border-border-warm/60 rule">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-space-lg reveal">
            <span className={EDITORIAL_TYPOGRAPHY.eyebrow}>
              The 4 Uncompromising Standards
            </span>
            <h2 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} hero-line mt-1`}>
              Why Discerning Travelers Choose Agra SK Baghel Tour and Travels
            </h2>
            <p className={`${EDITORIAL_TYPOGRAPHY.body} mt-1.5`}>
              Over two decades serving Agra and North India with zero complaints and unmatched reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: "timer",
                title: "Punctuality Guarantee",
                desc: "Chauffeurs arrive at your pickup location 15 minutes before scheduled departure. If any delay occurs, our standby backup fleet in Taj Ganj deploys immediately.",
              },
              {
                icon: "payments",
                title: "Upfront Inclusive Pricing",
                desc: "Every quoted fare itemizes booking receipt, toll clearances, and fuel. What you agree upon is exactly what you pay—with zero hidden roadside extras or tourist surcharges.",
              },
              {
                icon: "badge",
                title: "Police-Verified Drivers",
                desc: "Every chauffeur holds an active commercial badge, police background verification certificate, and follows our strict guest etiquette code for families and solo travelers.",
              },
              {
                icon: "sanitizer",
                title: "Spotless Vehicles",
                desc: "Each cab undergoes vacuum sanitization, high-performance AC checks, and is stocked with sealed mineral water bottles and device charging cables before dispatch.",
              },
            ].map((assurance, idx) => (
              <div
                key={assurance.title}
                style={{ "--reveal-delay": `${idx * 80}ms` } as React.CSSProperties}
                className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs flex flex-col justify-between lift reveal"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-2.5 transition-transform duration-300 hover:scale-110">
                    <span className="material-symbols-outlined text-icon-20">{assurance.icon}</span>
                  </div>
                  <h3 className={`${EDITORIAL_TYPOGRAPHY.subH4} text-xs sm:text-title-lg mb-1`}>{assurance.title}</h3>
                  <p className={`${EDITORIAL_TYPOGRAPHY.compact} text-body-sm sm:text-label-lg`}>
                    {assurance.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FINAL BOOKING & ENQUIRY CTA SECTION ── */}
      <section className="w-full bg-surface-container-lowest py-8 sm:py-space-xl border-t border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin text-center reveal">
          <span className={EDITORIAL_TYPOGRAPHY.eyebrow}>
            Plan Your Next Journey
          </span>
          <h2 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} hero-line mt-1 max-w-xl mx-auto`}>
            Ready for a seamless travel experience across North India?
          </h2>
          <p className={`${EDITORIAL_TYPOGRAPHY.lead} mt-2 max-w-2xl mx-auto mb-space-lg`}>
            Speak directly with our Taj Ganj dispatch desk for custom itineraries, group delegates, or instant expressway bookings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-space-sm">
            <PrimaryButton href="/book">
              Book Cab Online
            </PrimaryButton>
            <WhatsAppButton
              inquiryText="Hello Agra SK Baghel Tour and Travels Desk, I would like to plan a custom trip."
              label="Chat on WhatsApp"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
