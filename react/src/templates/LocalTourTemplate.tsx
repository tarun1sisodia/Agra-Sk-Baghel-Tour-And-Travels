import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTaxiServiceSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";
import { GroupedVehicleSection } from "../components/fleet/GroupedVehicleSection";

export interface DossierLocalPackageItem {
  id: string;
  slug: string;
  packageCode?: string;
  name: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm?: boolean;
  extraRates?: Record<string, { per_km?: number; per_hr?: number }>;
  nightChargeInr?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type LocalPackageItem = DossierLocalPackageItem;

export interface LocalTourTemplateProps {
  language?: SupportedLanguage;
  item: DossierLocalPackageItem;
}

const VEHICLE_GROUPS_EXTRA_RATES = [
  { group: "Sedan (Dzire, City)", seats: "4 Passengers", perKm: 10, perHr: 150 },
  { group: "SUV (Ertiga, Innova Crysta)", seats: "6-7 Passengers", perKm: 14, perHr: 200 },
  { group: "Tempo Traveller (12/17 Seater)", seats: "12–16 Passengers", perKm: 25, perHr: 400 },
  { group: "Luxury Executive (Camry, Vellfire)", seats: "4–6 Passengers", perKm: 34, perHr: 600 },
];

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

export function LocalTourTemplate({ item }: LocalTourTemplateProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const validRates = Object.values(item.fleetPrices || {}).filter((v) => typeof v === "number" && v > 0);
  const startingFare = Number(item.fleetPrices?.sedan || (validRates.length > 0 ? Math.min(...validRates) : 0));
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);

  const bookingUrl = `/book.html?category=local_package&product=${encodeURIComponent(item.slug)}&from=Agra&to=${encodeURIComponent(item.name)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    startingFare > 0
      ? `Hello Agra SK Baghel Tour & Travels, I want to book local sightseeing package "${item.name}" from ₹${startingFare.toLocaleString("en-IN")}.`
      : `Hello Agra SK Baghel Tour & Travels, I want to book local sightseeing package "${item.name}".`
  )}`;

  const faqs = [
    {
      q: `What is included in the ${item.name} package?`,
      a: `The package includes dedicated vehicle custody for ${item.durationHours} Hours and up to ${item.includedKm} KM, a polite police-verified chauffeur, fuel, and air-conditioning throughout your sightseeing circuit.`,
    },
    {
      q: `What destinations are covered during this tour?`,
      a: `This package covers: ${item.covers}. You have complete flexibility to visit these monuments at your preferred pace or substitute stops within the city limits.`,
    },
    {
      q: `How are extra hours and extra kilometers billed?`,
      a: `If your tour exceeds ${item.durationHours} hours or ${item.includedKm} km, extra rates apply strictly at published transparent tariffs (₹10/km & ₹150/hr for Sedan; ₹14/km & ₹200/hr for Ertiga; ₹18/km & ₹250/hr for Innova Crysta). There are zero hidden fees.`,
    },
    {
      q: `Are monument entry fees and parking included?`,
      a: item.parkingNote || "Monument entry tickets and parking stand fees are billed at actuals. Your chauffeur parks at authorized stands and assists you at ticketing gates.",
    },
    {
      q: `Can the chauffeur pick us up from our hotel or railway station?`,
      a: `Yes! We provide complimentary doorstep pickup from any hotel, homestay, or railway station (Agra Cantt AGC or Agra Fort AF) within municipal Agra city limits.`,
    },
    {
      q: `How does the 28% advance deposit work?`,
      a: `Lock in your private vehicle and driver with a 28% token deposit (₹${tokenAdvance.toLocaleString("en-IN")}). The remaining 72% balance is paid directly to the chauffeur at the conclusion of your sightseeing day.`,
    },
    {
      q: `What is your cancellation and refund policy?`,
      a: `We offer a 24-Hour Free Cancellation guarantee. If cancelled 24 hours or more before scheduled pickup, your 28% advance deposit is refunded 100% with zero cancellation fees.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/packages/${item.slug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Local Packages", url: "/packages/" },
    { name: item.name, url: `/packages/${item.slug}/` },
  ]);

  const faqSchema = buildFaqSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));

  const taxiSchema = buildTaxiServiceSchema({
    name: `${item.name} Sightseeing Tour`,
    description: `Private sightseeing tour covering ${item.covers}. ${item.durationHours} Hours, ${item.includedKm} KM. Verified chauffeur, AC vehicle, transparent rates.`,
    areaServed: ["Agra", "Uttar Pradesh", "India"],
    offers: [
      {
        name: `${item.name} Sedan Package`,
        price: startingFare,
        priceCurrency: "INR",
        description: `${item.durationHours} Hours, ${item.includedKm} KM private sightseeing`,
      },
    ],
  });

  const monumentsCoveredList = item.covers
    ? item.covers.split(/[,•+]/).map((s) => s.trim()).filter(Boolean)
    : ["Taj Mahal", "Agra Fort", "Mehtab Bagh"];

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={buildGraphSchema(breadcrumbSchema, faqSchema, taxiSchema)} />

      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/en/packages/">Packages</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">{item.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider">
            <span className="material-symbols-outlined text-icon-14">tour</span>
            Local Sightseeing Circuit
          </span>
        </div>
      </div>

      {/* Hero Showcase */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            {/* Left Column: Tour Specs */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-widest w-fit">
                <span className="material-symbols-outlined text-icon-14">schedule</span>
                {item.durationHours} Hours Dedicated Custody • Up to {item.includedKm} KM Included
              </span>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {item.name}
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Enjoy an unhurried, private sightseeing exploration of Agra in an air-conditioned commercial cab.
                Covering <strong className="text-ink-charcoal font-semibold">{item.covers}</strong> with a courteous police-verified chauffeur.
              </p>

              {/* Package Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">hourglass_top</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.durationHours} Hours</span>
                    <span className="text-label-md text-secondary">Trip Duration</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">straighten</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.includedKm} KM</span>
                    <span className="text-label-md text-secondary">Included Kilometers</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">local_gas_station</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Fuel &amp; AC</span>
                    <span className="text-label-md text-secondary">100% Included</span>
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

              {/* Rate Card & Direct Booking Bar */}
              <div className="bg-sandstone-wash/80 p-space-lg rounded-xl border border-border-warm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase">Starting Tour Tariff (Sedan)</span>
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
                    <span>Book Sightseeing Tour</span>
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

            {/* Right Column: Sightseeing Highlights Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl border border-border-warm/60 shadow-lg flex flex-col gap-space-md">
                <span className="text-label-caps uppercase text-terracotta-sandstone font-bold tracking-widest">
                  Monuments Covered in Circuit
                </span>
                <div className="flex flex-col gap-2.5">
                  {monumentsCoveredList.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low border border-border-warm/40">
                      <span className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="font-title-md text-ink-charcoal font-medium">{m}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-sandstone-wash/80 border border-border-warm/60 flex items-start gap-2.5 text-body-sm text-secondary">
                  <span className="material-symbols-outlined text-primary text-icon-20 shrink-0 mt-0.5">info</span>
                  <span>{item.parkingNote || "Monument tickets and parking fees are at actuals. Chauffeur assists with ticketing gates and waiting stands."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Group-Based Vehicle Selection */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <GroupedVehicleSection
            title={`Select Vehicle for ${item.name}`}
            subtitle={`Guaranteed fixed rates for ${item.durationHours} Hours and ${item.includedKm} KM. Verified commercial yellow-plate vehicles with air-conditioning.`}
            category="local_package"
            productCode={item.slug}
            productName={item.name}
            originName="Agra"
            destinationName={item.name}
            fares={item.fleetPrices}
          />
        </div>
      </section>

      {/* Section 3: Extra Kilometer & Extra Hour Tariff Transparency Table */}
      <section className="w-full bg-surface py-space-3xl border-b border-border-warm/30">
        <div className="max-w-5xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Transparent Surcharges
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Extra Kilometer &amp; Extra Hour Rates
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Exceeded your tour package time or distance? Here are our standard, publicly published overtime and extra kilometer rates across each vehicle tier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-warm/60 bg-surface-container-lowest shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-warm text-label-caps font-label-caps text-terracotta-sandstone uppercase">
                  <th className="py-3 px-4">Vehicle Tier</th>
                  <th className="py-3 px-4">Seating</th>
                  <th className="py-3 px-4">Extra Rate / KM</th>
                  <th className="py-3 px-4">Extra Rate / Hour</th>
                  <th className="py-3 px-4">Chauffeur Night Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/30 text-body-md text-on-surface-variant">
                {VEHICLE_GROUPS_EXTRA_RATES.map((g) => (
                  <tr key={g.group} className="hover:bg-sandstone-wash/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ink-charcoal">{g.group}</td>
                    <td className="py-3.5 px-4 text-secondary">{g.seats}</td>
                    <td className="py-3.5 px-4 text-ink-charcoal font-medium">₹{g.perKm} / km</td>
                    <td className="py-3.5 px-4 text-ink-charcoal font-medium">₹{g.perHr} / hr</td>
                    <td className="py-3.5 px-4 text-success-jade font-semibold">
                      {item.nightChargeInr && item.nightChargeInr > 0 ? `₹${item.nightChargeInr}` : "₹0 (Day Tours)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 4: Package FAQs */}
      <section className="w-full bg-surface-container-low py-space-3xl">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Frequently Asked Questions
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Answers for Sightseeing Travelers
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Key details about pickup flexibility, parking regulations, and local sightseeing operations in Agra.
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
