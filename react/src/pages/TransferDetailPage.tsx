import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTaxiServiceSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";
import { GroupedVehicleSection } from "../components/fleet/GroupedVehicleSection";

export interface DossierTransferRouteItem {
  id: string;
  slug: string;
  routeCode?: string;
  name: string;
  pickupName?: string | null;
  dropName?: string | null;
  distanceText?: string | null;
  directionNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  nightChargeInr: number;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TransferDetailPageProps {
  language?: SupportedLanguage;
  item: DossierTransferRouteItem;
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

function getTransferSpecificFaqs(slug: string, name: string): { q: string; a: string }[] {
  const s = slug.toLowerCase();
  if (s.includes("delhi") || s.includes("igi")) {
    return [
      {
        q: `How long is Delhi IGI Airport to Agra?`,
        a: `240 km, about 3.5 hours via the Yamuna Expressway. The driver meets you at the arrivals curb of your terminal with a name board.`,
      },
      {
        q: `What if my flight lands late?`,
        a: `Give the flight number when booking. The driver tracks the flight and waits up to 60 minutes free at the terminal pickup bay.`,
      },
      {
        q: `Can the airport taxi stop for food on the Yamuna Expressway?`,
        a: `Yes. The driver can halt at expressway food courts — Haldiram's, Costa Coffee or Starbucks — at no extra charge for the stop itself.`,
      },
    ];
  }
  if (s.includes("cantt") || s.includes("station") || s.includes("railway")) {
    return [
      {
        q: `Where exactly do I meet the driver at Agra Cantt?`,
        a: `At the main exit taxi parking bay, with your name board. Confirm your coach position on WhatsApp before the train arrives for an immediate pickup.`,
      },
      {
        q: `Which Agra stations do you serve?`,
        a: `Agra Cantt (AGC), Agra Fort (AF) and Raja Ki Mandi. Give the train number and the driver tracks its running status.`,
      },
      {
        q: `Can I go straight from the station to the Taj Mahal?`,
        a: `Yes. Agra Cantt is about 6 km from the Taj Mahal, so a station-to-Taj transfer makes sense if your itinerary is tight.`,
      },
    ];
  }
  if (s.includes("agra-airport") || s.includes("kheria")) {
    return [
      {
        q: `How far is Agra Airport from the Taj Mahal?`,
        a: `About 12 km, 25–30 minutes. A sedan airport transfer is the usual booking; give the flight number so the driver times the pickup.`,
      },
      {
        q: `Are there flights into Agra Airport every day?`,
        a: `No, Agra Airport has limited flights. Check your flight status before booking the transfer, and give the flight number so delays are tracked.`,
      },
    ];
  }
  return [
    {
      q: `What is included in the fare for ${name}?`,
      a: `The quoted transfer fare is all-inclusive: private AC vehicle, verified chauffeur, fuel, expressway FASTag tolls and terminal parking access.`,
    },
    {
      q: `What if my arrival is delayed?`,
      a: `Provide your flight number or train PNR when booking; our driver tracks the live status and adjusts pickup with complimentary waiting.`,
    },
  ];
}

export function TransferDetailPage({ item }: TransferDetailPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const validRates = Object.values(item.fleetPrices || {}).filter((v) => typeof v === "number" && v > 0);
  const startingFare = Number(item.fleetPrices?.sedan || (validRates.length > 0 ? Math.min(...validRates) : 0));
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);
  const bookingUrl = `/book.html?category=transfer&product=${encodeURIComponent(item.slug)}&from=${encodeURIComponent(item.pickupName || "Agra")}&to=${encodeURIComponent(item.dropName || item.name)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    startingFare > 0
      ? `Hello Agra SK Baghel Tour & Travels, I want to book transfer "${item.name}" from ₹${startingFare.toLocaleString("en-IN")}.`
      : `Hello Agra SK Baghel Tour & Travels, I want to inquire about transfer "${item.name}".`
  )}`;

  const specificFaqs = getTransferSpecificFaqs(item.slug, item.name);

  const faqs = [
    ...specificFaqs,
    {
      q: `Can the vehicle accommodate our luggage?`,
      a: `Sedans carry 2 large suitcases + 2 small bags. For 3–4 large suitcases, book an Ertiga or Innova Crysta; Tempo Travellers feature dedicated rear luggage bays for 8+ bags.`,
    },
    {
      q: `Where will the chauffeur meet me upon arrival?`,
      a: `At Agra Cantt (AGC) or Agra Fort, the chauffeur meets you at the taxi parking bay with your name board. At Delhi IGI Airport, your driver meets you directly at your terminal arrival curb.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/transfers/${item.slug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Transfers", url: "/en/routes/" },
    { name: item.name, url: `/en/transfers/${item.slug}/` },
  ]);

  const faqSchema = buildFaqSchema(
    faqs.map((f) => ({ question: f.q, answer: f.a })),
    `${canonicalUrl}#faq`
  );

  const taxiServiceSchema = buildTaxiServiceSchema({
    id: `${canonicalUrl}#taxiservice`,
    name: `${item.name} Taxi Service`,
    description: item.directionNote || `Point-to-point transfer: ${item.name}. Distance: ${item.distanceText || "Direct"}. AC cab with verified chauffeur.`,
    offers: [
      ...(item.fleetPrices?.sedan || startingFare > 0
        ? [{ name: "Sedan", price: item.fleetPrices?.sedan ?? startingFare }]
        : []),
      ...(item.fleetPrices?.ertiga
        ? [{ name: "Ertiga", price: item.fleetPrices.ertiga }]
        : []),
      ...(item.fleetPrices?.innova
        ? [{ name: "Innova Crysta", price: item.fleetPrices.innova }]
        : []),
      ...(item.fleetPrices?.tempo
        ? [{ name: "Tempo Traveller", price: item.fleetPrices.tempo }]
        : []),
      ...(item.fleetPrices?.urbania
        ? [{ name: "Force Urbania", price: item.fleetPrices.urbania }]
        : []),
    ],
  });

  const pageSchemaGraph = buildGraphSchema(breadcrumbSchema, faqSchema, taxiServiceSchema);

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={pageSchemaGraph} />

      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/en/routes/">Routes &amp; Transfers</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium truncate max-w-xs">{item.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider font-semibold">
            <span className="material-symbols-outlined text-icon-14">flight_takeoff</span>
            Direct Point-to-Point Transfer
          </span>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-label-caps font-label-caps uppercase tracking-widest font-bold">
                  <span className="material-symbols-outlined text-icon-14">directions_car</span>
                  Fixed Transfer Fare
                </span>
                {item.distanceText && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-sandstone text-label-caps font-label-caps uppercase tracking-wider font-semibold">
                    <span className="material-symbols-outlined text-icon-14">straighten</span>
                    {item.distanceText}
                  </span>
                )}
              </div>

              {/* Exactly one H1 per page */}
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {item.name}
              </h1>

              {item.directionNote && (
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                  {item.directionNote}
                </p>
              )}

              {/* Transit Intelligence Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">pin_drop</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Doorstep</span>
                    <span className="text-label-md text-secondary">Pickup &amp; Drop</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">schedule</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">60-Min</span>
                    <span className="text-label-md text-secondary">Delay Waiting Free</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">receipt_long</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Tolls Inc.</span>
                    <span className="text-label-md text-secondary">Zero Surcharges</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">verified</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">28% Token</span>
                    <span className="text-label-md text-secondary">Reserve to Lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Callout Card */}
            <div className="lg:col-span-4 bg-sandstone-wash/90 p-space-xl rounded-2xl border border-border-warm shadow-md flex flex-col gap-space-md">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest font-bold">
                {startingFare > 0 ? "Starting Transfer Fare" : "Transfer Fare"}
              </span>
              <div className="flex items-baseline gap-2">
                {startingFare > 0 ? (
                  <>
                    <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-bold">
                      ₹{startingFare.toLocaleString("en-IN")}
                    </span>
                    <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
                  </>
                ) : (
                  <span className="font-headline-lg text-headline-lg text-ink-charcoal font-serif font-bold">
                    On Request
                  </span>
                )}
              </div>
              <p className="text-body-sm text-secondary">
                {startingFare > 0
                  ? `Lock your scheduled transfer with a ₹${tokenAdvance.toLocaleString("en-IN")} deposit (28%). The remaining 72% is paid to your chauffeur at your destination.`
                  : "All transfer bookings include private sanitized AC vehicle, verified chauffeur, highway FASTag tolls, and parking fees."}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white py-3.5 rounded-lg text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center font-bold"
                  href={bookingUrl}
                  rel="nofollow"
                >
                  <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                  <span>Book Transfer Online</span>
                </a>
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg text-label-lg font-label-lg shadow-xs hover:bg-ink-slate transition-all text-center"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                  <span>Chat with Concierge</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group-Based Fleet Rates */}
      <section className="w-full bg-surface-container-low py-space-3xl border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <GroupedVehicleSection
            rates={item.fleetPrices}
            category="transfer"
            productSlug={item.slug}
            pickup={item.pickupName || "Agra"}
            drop={item.dropName || item.name}
            title="Fixed Transfer Rates by Fleet Category"
            subtitle="Fixed, guaranteed pricing across verified fleet groups. Tolls, airport parking permits, and driver allowances included."
            updatedAt={item.updatedAt}
          />

          {/* Transfer Guidance Information Strip */}
          <div className="mt-space-2xl grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/60 shadow-xs">
              <div className="flex items-center gap-2 text-terracotta-sandstone mb-2">
                <span className="material-symbols-outlined text-icon-22">flight_and_flag</span>
                <h3 className="font-title-md text-ink-charcoal font-bold">Terminal &amp; Station Logistics</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Whether arriving at Agra Cantt (AGC) on the Gatimaan Express, Agra Fort Station, or flying in/out of Agra Airport (AGR) or Delhi IGI (DEL), our chauffeurs sync your live itinerary. Up to 60 minutes complimentary waiting is included at pickup bays with zero penalty for train or flight delays.
              </p>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/60 shadow-xs">
              <div className="flex items-center gap-2 text-terracotta-sandstone mb-2">
                <span className="material-symbols-outlined text-icon-22">shield</span>
                <h3 className="font-title-md text-ink-charcoal font-bold">Safety &amp; Fleet Verification</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                100% commercial yellow-plate fleet driven by police-verified local Agra drivers. Clean air-conditioned vehicles, functioning seatbelts on all seats, GPS tracking, and 24×7 dispatch support from our central office in Taj Ganj.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8–13 FAQs with Accordion */}
      <section className="w-full bg-surface py-space-3xl border-b border-border-warm/30">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs font-bold">
              Transfer Clarifications
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-xs font-bold">
              Frequently Asked Transfer Questions
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Everything you need to know about airport terminal meet &amp; greets, luggage limits, and punctuality.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-container-low rounded-lg border border-border-warm/60 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-space-lg flex items-center justify-between gap-space-md text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-title-md text-ink-charcoal font-serif font-bold">{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-terracotta-sandstone text-icon-22 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-space-lg pb-space-lg pt-0 text-body-md text-on-surface-variant leading-relaxed border-t border-border-warm/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking CTA Strip with Phone in H2 */}
      <section className="w-full bg-sandstone-wash py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-10 shadow-lg border border-border-warm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            <div className="flex flex-col gap-space-xs max-w-xl">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest font-bold">
                24×7 Airport &amp; Station Concierge
              </span>
              {/* Phone in H2 requirement */}
              <h2 className="font-headline-md text-headline-md text-ink-charcoal font-serif font-bold leading-tight">
                Call 24×7 for Transfer Booking:{" "}
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {contact.phoneDisplay}
                </a>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Reserve your transfer for {item.name} with verified commercial vehicles and zero roadside surge pricing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                className="inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white px-8 py-4 rounded-xl text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all text-center font-bold"
                href={bookingUrl}
                rel="nofollow"
              >
                <span className="material-symbols-outlined text-icon-20">directions_car</span>
                <span>Book Transfer Now</span>
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 bg-ink-charcoal text-white px-6 py-4 rounded-xl text-label-lg font-label-lg shadow-sm hover:bg-ink-slate transition-all text-center font-semibold"
                href={`tel:${contact.phone}`}
              >
                <span className="material-symbols-outlined text-icon-20 text-terracotta-sunlit">phone_in_talk</span>
                <span>Call Chauffeur Desk</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TransferDetailPage;
