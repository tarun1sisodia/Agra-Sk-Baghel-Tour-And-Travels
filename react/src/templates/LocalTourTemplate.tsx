import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTaxiServiceSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";
import { GroupedVehicleSection } from "../components/fleet/GroupedVehicleSection";
import { getLocalExtraRateFaq, getLocalExtraRateRows } from "./localTourRates";

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
  extraRates?: Record<string, { per_km?: number; per_hr?: number }> | null;
  nightChargeInr?: number | null;
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

function getLocalPackageSpecificFaqs(slug: string): { q: string; a: string }[] {
  const s = slug.toLowerCase();
  if (s.includes("sunrise")) {
    return [
      {
        q: `What time is pickup for the sunrise tour?`,
        a: `45 minutes before sunrise — about 4:45 AM in summer, 5:30 AM in winter. Gates open 30 minutes before sunrise.`,
      },
      {
        q: `What happens on a foggy winter morning?`,
        a: `The tour still runs. The guide starts with the marble interiors and courtyards, then moves to open-air photography once the mist lifts, usually by 8 AM.`,
      },
      {
        q: `Is the sunrise tour possible on a Friday?`,
        a: `No. The Taj Mahal is closed every Friday, so a Friday sunrise tour visits Agra Fort and Mehtab Bagh instead, with the Taj view from across the river.`,
      },
    ];
  }
  if (s.includes("mathura") || s.includes("vrindavan")) {
    return [
      {
        q: `Can Mathura and Vrindavan be covered in one day from Agra?`,
        a: `Yes, with a 5:30–6 AM start. Agra–Mathura is about 60 km (75 minutes); Mathura–Vrindavan is another 25–40 minutes, and you are back in Agra by evening.`,
      },
      {
        q: `Do temples close in the middle of the day?`,
        a: `Yes, most temples close around noon and reopen in the afternoon. The route plans lunch and travel in that gap, so no darshan time is lost.`,
      },
      {
        q: `Can the car reach the temple gates in Vrindavan?`,
        a: `No, not inside the town limits. The driver drops you at the designated parking nodes and you walk or take an e-rickshaw to the temple gates.`,
      },
    ];
  }
  if (s.includes("gatimaan")) {
    return [
      {
        q: `How does the Gatimaan Express tour work?`,
        a: `You arrive in Agra by train and the driver meets you at Agra Cantt with a name board. The car covers the day's sightseeing and drops you back at the station for your return train.`,
      },
      {
        q: `What if my train is late?`,
        a: `Give the train number or PNR when booking. The driver tracks the train and adjusts pickup with no waiting fee for the delay.`,
      },
      {
        q: `Can I go straight to the Taj Mahal from the station?`,
        a: `Yes. Agra Cantt is about 6 km from the Taj Mahal, so the driver can take you to the East Gate first and to your hotel afterwards.`,
      },
    ];
  }
  if (s.includes("unhurried") || s.includes("overnight")) {
    return [
      {
        q: `What does an overnight Agra trip add over a day trip?`,
        a: `A second day. Day 1 is the Taj Mahal and Agra Fort; day 2 is Fatehpur Sikri, Sikandra and Mehtab Bagh at sunset, without rushing any of them.`,
      },
      {
        q: `Is the hotel included in the overnight package?`,
        a: `No. The package is the car, driver and sightseeing; the hotel is booked separately, or tell us your budget and we suggest one near the Taj.`,
      },
      {
        q: `Where does the driver stay overnight?`,
        a: `The driver stays in Agra overnight. A night allowance applies for the overnight halt (8 PM–6 AM): ₹500 for a sedan/SUV, ₹700 for larger vehicles.`,
      },
    ];
  }
  if (s.includes("golden-triangle")) {
    return [
      {
        q: `How many days does the Golden Triangle take?`,
        a: `3 nights / 4 days: Delhi → Agra → Jaipur → Delhi. Each city gets a full sightseeing day, with the same car and driver throughout.`,
      },
      {
        q: `Is the Golden Triangle one booking or three?`,
        a: `One booking. One car, one driver and one fixed price cover the whole circuit, including the 300 km/day outstation minimum.`,
      },
      {
        q: `Can the Golden Triangle start in Agra instead of Delhi?`,
        a: `Yes. The circuit can start and end in Agra; the route and price are recalculated for the Agra start, and Delhi becomes the last stop.`,
      },
    ];
  }
  if (s.includes("fatehpur-sikri")) {
    return [
      {
        q: `How far is Fatehpur Sikri from Agra?`,
        a: `About 40 km, 1–1.5 hours each way on NH21. It fits in a half day, so it pairs with the Taj Mahal in the morning.`,
      },
      {
        q: `What is there to see at Fatehpur Sikri?`,
        a: `Akbar's red-sandstone capital: Buland Darwaza, Jama Masjid and the Salim Chishti Dargah. Plan 2–3 hours inside the complex.`,
      },
      {
        q: `Is Fatehpur Sikri open on Friday when the Taj Mahal is closed?`,
        a: `Yes, it stays open all 7 days. A Friday is the best day to do Fatehpur Sikri, since the Taj Mahal is closed.`,
      },
    ];
  }
  if (s.includes("jaipur")) {
    return [
      {
        q: `Can Jaipur be done in one day from Agra?`,
        a: `Yes, but it is a long day: Agra–Jaipur is 240 km, about 4.5 hours each way. Leave by 5 AM to get 5–6 hours in Jaipur.`,
      },
      {
        q: `What does the Jaipur day cover?`,
        a: `Hawa Mahal, Amer Fort and the old city markets, in that order. Anything more needs an overnight stay.`,
      },
      {
        q: `Is the Agra–Jaipur fare one-way or return?`,
        a: `The published sedan fare is for the Agra–Jaipur leg. A same-day return is billed as a round trip with the 300 km/day minimum.`,
      },
    ];
  }
  if (s.includes("bharatpur")) {
    return [
      {
        q: `When is the best time to visit Bharatpur bird sanctuary?`,
        a: `October to March, when migratory birds arrive. Arrive at the sanctuary gate by 7 AM, when birds are most active and the light is best for photography.`,
      },
      {
        q: `How far is Bharatpur from Agra?`,
        a: `About 55 km, 1.2 hours. It is a half-day trip and pairs with Fatehpur Sikri on the same route.`,
      },
      {
        q: `Does the taxi go inside the sanctuary?`,
        a: `No. Cars stop at the sanctuary gate; inside, you move by cycle-rickshaw or on foot, which is also how you get closest to the birds.`,
      },
    ];
  }
  if (s.includes("international")) {
    return [
      {
        q: `Why is the international tourist tour 12 hours instead of 8?`,
        a: `It covers five monuments — Taj Mahal, Agra Fort, Mehtab Bagh, Sikandra and Baby Taj — at an unhurried pace, with time for photography and lunch built in.`,
      },
      {
        q: `Is the guide included in the international tour?`,
        a: `No, the guide is extra. The car, driver, fuel and parking are included; a licensed English-speaking guide can be added when you book.`,
      },
      {
        q: `Do you pick up from the airport or station for this tour?`,
        a: `Yes, free doorstep pickup from any hotel, homestay, Agra Cantt (AGC) or Agra Fort (AF) station inside Agra city limits.`,
      },
    ];
  }
  // Default / agra-sightseeing
  return [
    {
      q: `Can I see the Taj Mahal, Agra Fort and Mehtab Bagh in one day?`,
      a: `Yes. That is the standard circuit: Taj Mahal in the morning, Agra Fort before lunch, Baby Taj and Mehtab Bagh for sunset. The car waits at each stop, so the order can change to suit you.`,
    },
    {
      q: `What time should I start to avoid the Taj Mahal crowds?`,
      a: `Start at sunrise. Pickup 45 minutes before sunrise gets you to the East Gate before the tour buses; by 10 AM the queues are at their longest.`,
    },
    {
      q: `Where does the car drop me at the Taj Mahal?`,
      a: `At the East Gate or West Gate parking plaza, about 500 m from the gate. Petrol and diesel vehicles cannot go closer; battery golf carts and shuttles cover the last stretch.`,
    },
  ];
}

export function LocalTourTemplate({ item }: LocalTourTemplateProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const validRates = Object.values(item.fleetPrices || {}).filter((v) => typeof v === "number" && v > 0);
  const startingFare = Number(item.fleetPrices?.sedan || (validRates.length > 0 ? Math.min(...validRates) : 0));
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);
  const extraRateRows = getLocalExtraRateRows(item.extraRates);

  const bookingUrl = `/book.html?category=local_package&product=${encodeURIComponent(item.slug)}&from=Agra&to=${encodeURIComponent(item.name)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    startingFare > 0
      ? `Hello Agra SK Baghel Tour & Travels, I want to book local sightseeing package "${item.name}" from ₹${startingFare.toLocaleString("en-IN")}.`
      : `Hello Agra SK Baghel Tour & Travels, I want to book local sightseeing package "${item.name}".`
  )}`;

  const specificFaqs = getLocalPackageSpecificFaqs(item.slug);

  const faqs = [
    {
      q: `What is included in the ${item.name} package?`,
      a: `The package includes dedicated vehicle custody for ${item.durationHours} Hours and up to ${item.includedKm} KM, a polite police-verified chauffeur, fuel, and air-conditioning throughout your sightseeing circuit.`,
    },
    {
      q: `What destinations are covered during this tour?`,
      a: `This package covers: ${item.covers}. You have complete flexibility to visit these monuments at your preferred pace or substitute stops within the city limits.`,
    },
    ...specificFaqs,
    {
      q: `How are extra hours and extra kilometers billed?`,
      a: getLocalExtraRateFaq(extraRateRows, item.durationHours, item.includedKm),
    },
    {
      q: `Can the chauffeur pick us up from our hotel or railway station?`,
      a: `Yes! We provide complimentary doorstep pickup from any hotel, homestay, or railway station (Agra Cantt AGC or Agra Fort AF) within municipal Agra city limits.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/local-packages/${item.slug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Local Packages", url: "/en/packages/" },
    { name: item.name, url: canonicalUrl },
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
                    rel="nofollow"
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
              Exceeded your tour package time or distance? See the configured extra kilometer and overtime rates for this tour. Unlisted rates are available on request.
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
                {extraRateRows.map((g) => (
                  <tr key={g.key} className="hover:bg-sandstone-wash/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ink-charcoal">{g.group}</td>
                    <td className="py-3.5 px-4 text-secondary">{g.seats}</td>
                    <td className="py-3.5 px-4 text-ink-charcoal font-medium">{g.perKm !== null ? `₹${g.perKm.toLocaleString("en-IN")} / km` : "On request"}</td>
                    <td className="py-3.5 px-4 text-ink-charcoal font-medium">{g.perHr !== null ? `₹${g.perHr.toLocaleString("en-IN")} / hr` : "On request"}</td>
                    <td className="py-3.5 px-4 text-success-jade font-semibold">
                      {item.nightChargeInr == null ? "On request" : item.nightChargeInr > 0 ? `₹${item.nightChargeInr.toLocaleString("en-IN")}` : "₹0 (Day Tours)"}
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
