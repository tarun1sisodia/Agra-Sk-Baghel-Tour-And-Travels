import React, { useState, useMemo } from "react";
import { contact } from "../data/contact";
import { type Vehicle, vehicles, routes } from "../data/catalogue";
import { WhatsAppIcon } from "../components/icons";

interface VehicleDetailPageProps {
  language?: "en" | "hi";
  vehicle: Vehicle;
}

// Fixed route prices by vehicle tier (aligned with CLIENT_CONFIRMATION_FARES_AND_RULES.md)
const ONE_WAY_FARES_BY_VEHICLE: Record<string, Array<{ routeId: string; routeEn: string; highway: string; km: number; fare: number }>> = {
  sedan: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", highway: "Yamuna Expressway", km: 210, fare: 4999 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 4500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 2500 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", highway: "NH-44 (North–South)", km: 120, fare: 3999 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", highway: "Agra–Lucknow Expressway", km: 335, fare: 7500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", highway: "NH-48 / NE-4", km: 280, fare: 5999 },
  ],
  ertiga: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", highway: "Yamuna Expressway", km: 210, fare: 5999 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 6800 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 3000 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", highway: "NH-44 (North–South)", km: 120, fare: 4500 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", highway: "Agra–Lucknow Expressway", km: 335, fare: 8500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", highway: "NH-48 / NE-4", km: 280, fare: 6999 },
  ],
  innova: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", highway: "Yamuna Expressway", km: 210, fare: 7500 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 8500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 4000 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", highway: "NH-44 (North–South)", km: 120, fare: 6899 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", highway: "Agra–Lucknow Expressway", km: 335, fare: 9500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", highway: "NH-48 / NE-4", km: 280, fare: 8499 },
  ],
  tempo: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", highway: "Yamuna Expressway", km: 210, fare: 8500 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 8500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 5200 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", highway: "NH-44 (North–South)", km: 120, fare: 7200 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", highway: "Agra–Lucknow Expressway", km: 335, fare: 12800 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", highway: "NH-48 / NE-4", km: 280, fare: 10500 },
  ],
  urbania: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", highway: "Yamuna Expressway", km: 210, fare: 11500 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 11500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 7200 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", highway: "NH-44 (North–South)", km: 120, fare: 9800 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", highway: "Agra–Lucknow Expressway", km: 335, fare: 16500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", highway: "NH-48 / NE-4", km: 280, fare: 14200 },
  ],
};

// Local Sightseeing & Transfer rates by vehicle
const LOCAL_RATES: Record<string, { standard8h: number; fullDay: number; agraCantt: number; agraAirport: number; delAirport: number }> = {
  sedan: { standard8h: 2200, fullDay: 3000, agraCantt: 1200, agraAirport: 900, delAirport: 4999 },
  ertiga: { standard8h: 2900, fullDay: 4000, agraCantt: 1500, agraAirport: 1050, delAirport: 5999 },
  innova: { standard8h: 4150, fullDay: 5499, agraCantt: 2000, agraAirport: 1250, delAirport: 7500 },
  tempo: { standard8h: 7500, fullDay: 8500, agraCantt: 3500, agraAirport: 2400, delAirport: 8500 },
  urbania: { standard8h: 9500, fullDay: 11500, agraCantt: 4500, agraAirport: 3800, delAirport: 11500 },
};

export function VehicleDetailPage({ vehicle }: VehicleDetailPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const vehicleSlug = vehicle.id === "innova" ? "innova-crysta" : vehicle.id === "tempo" ? "tempo-traveller" : vehicle.id;
  const rates = LOCAL_RATES[vehicle.id] || LOCAL_RATES.sedan;
  const oneWayRoutes = ONE_WAY_FARES_BY_VEHICLE[vehicle.id] || ONE_WAY_FARES_BY_VEHICLE.sedan;

  const faqItems = useMemo(
    () => [
      {
        q: `What is included in the ₹${vehicle.perKm}/km outstation rate for ${vehicle.name}?`,
        a: `The per-kilometer rate covers vehicle charter, chauffeur driving allowance, and comprehensive vehicle maintenance. Fuel is calculated from our garage or pickup point. State entrance taxes and expressway tolls are billed at exact actuals or bundled transparently into fixed quotes.`,
      },
      {
        q: `How does the 300 km per day minimum billing rule apply to this ${vehicle.name}?`,
        a: `In accordance with commercial transport regulations across Uttar Pradesh, Rajasthan, and Delhi NCR, outstation round-trip bookings adhere to a minimum of 300 km per calendar day. For instance, a 2-day round-trip charter has a 600 km minimum base allowance.`,
      },
      {
        q: `Are child seats and luggage carriers available for the ${vehicle.name}?`,
        a: `Yes! Infant and booster child safety seats can be requested in advance at zero extra cost. For larger groups with oversized suitcases, roof-top waterproof luggage carriers are equipped upon request.`,
      },
      {
        q: `What is your chauffeur night allowance policy for ${vehicle.name}?`,
        a: `A nominal driver night charge of ₹300 applies if the vehicle is engaged between 10:00 PM and 6:00 AM, allowing chauffeurs safe rest accommodations during overnight outstation stays.`,
      },
      {
        q: `What is the cancellation and advance deposit policy?`,
        a: `Bookings are secured with a modest 28% advance deposit. Cancellations made at least 24 hours prior to scheduled departure receive an immediate 100% full refund with zero cancellation fee.`,
      },
      {
        q: `What happens if the vehicle encounters a mechanical delay on the highway?`,
        a: `We maintain a 45-Minute Emergency Vehicle Replacement Guarantee along the Yamuna Expressway, NH-19, and NH-21 corridors. Our central Taj Ganj dispatch operations desk immediately deploys a backup commercial vehicle.`,
      },
    ],
    [vehicle]
  );

  const bookingUrl = `/book/?vehicle=${vehicleSlug}&step=2`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hello Agra SK Baghel Tour and Travels Desk, I would like to reserve the ${vehicle.name} for an upcoming journey.`)}`;

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/en/fleet/">Fleet</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">{vehicle.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider">
            <span className="material-symbols-outlined text-icon-14">verified</span>
            100% Yellow-Plate Commercial
          </span>
        </div>
      </div>

      {/* Hero Showcase */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            {/* Left Column: Info & Booking Card */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-caps uppercase tracking-wider border border-border-warm">
                  {vehicle.klass}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                  {vehicle.seats} Seater Luxury
                </span>
              </div>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {vehicle.name} Chauffeur Hire in Agra
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                {vehicle.blurb} Immaculate interiors, verified dual-zone air conditioning, and professional chauffeurs
                steeped in Northern Indian highway expertise.
              </p>

              {/* Spec highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">airline_seat_recline_extra</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{vehicle.seats} Seats</span>
                    <span className="text-label-md text-secondary">Contoured comfort</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">luggage</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{vehicle.bags} Bags</span>
                    <span className="text-label-md text-secondary">Large boot bay</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">mode_fan</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Dual AC</span>
                    <span className="text-label-md text-secondary">Pristine cooling</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">shield_person</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Police ID</span>
                    <span className="text-label-md text-secondary">Verified driver</span>
                  </div>
                </div>
              </div>

              {/* Rate Card & Direct Booking Bar */}
              <div className="bg-sandstone-wash/80 p-space-lg rounded-xl border border-border-warm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase">Starting Outstation Fare</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">₹{vehicle.perKm}</span>
                    <span className="text-body-md text-on-surface-variant font-medium">/ km</span>
                  </div>
                  <span className="text-body-sm text-secondary">Standard 300 km/day minimum • 28% advance token to lock</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm">
                  <a
                    className="inline-flex items-center justify-center gap-space-xs bg-terracotta-deep text-white px-6 py-3.5 rounded text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all duration-200"
                    href={bookingUrl}
                  >
                    <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                    <span>Reserve {vehicle.name}</span>
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

            {/* Right Column: High-Res Photo Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-xl overflow-hidden shadow-xl bg-surface-container border border-border-warm/60">
                <img
                  className="w-full h-[440px] object-cover"
                  src={vehicle.image}
                  alt={`${vehicle.name} luxury fleet charter`}
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/fleet/innova.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-space-lg flex items-center justify-between text-ivory-surface">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md font-serif">{vehicle.name}</span>
                    <span className="text-body-sm text-sandstone-wash/80">{vehicle.seats} Passengers • {vehicle.bags} Bags</span>
                  </div>
                  <span className="bg-primary/90 text-ivory-surface px-3 py-1 rounded text-label-caps font-label-caps uppercase">
                    Pristine Condition
                  </span>
                </div>
              </div>

              {/* Trust signals strip */}
              <div className="grid grid-cols-2 gap-space-sm pt-space-md">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-success-jade text-icon-20">verified</span>
                  <span className="text-body-sm text-on-surface font-medium">100% Yellow Commercial Plate</span>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-success-jade text-icon-20">speed</span>
                  <span className="text-body-sm text-on-surface font-medium">80–100 km/h Speed Governed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Technical Specifications & Cabin Amenities Bento Grid */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Specifications &amp; Comfort
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Engineered for Highway Comfort &amp; Safety
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Every vehicle is thoroughly audited before dispatch to guarantee pristine cabin cleanliness, mechanical
              reliability, and passenger safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            <div className="bg-surface-container-lowest p-space-xl rounded-lg shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-icon-26">chair</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Seating &amp; Ergonomics</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Comfortable pushback seats contoured for spinal support, generous legroom, and effortless ingress.
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 flex items-center justify-between text-body-sm text-secondary font-medium">
                <span>{vehicle.seats} Seats</span>
                <span>{vehicle.klass}</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-xl rounded-lg shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-icon-26">luggage</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Luggage &amp; Storage</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Dedicated secure trunk space accommodating {vehicle.bags} full-size suitcases plus cabin rucksacks.
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 flex items-center justify-between text-body-sm text-secondary font-medium">
                <span>{vehicle.bags} Large Bags</span>
                <span>Secure Boot Bay</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-xl rounded-lg shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-icon-26">ac_unit</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Climate Control &amp; AC</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  High-capacity air conditioning delivering rapid cooling even in peak 45°C summer heat.
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 flex items-center justify-between text-body-sm text-secondary font-medium">
                <span>Dual / Roof AC</span>
                <span>Sealed Cabin</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-xl rounded-lg shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-icon-26">verified_user</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Safety &amp; Compliance</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  ABS brakes, speed-governed cruising, all-India commercial tourist permits, and emergency medical kits.
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 flex items-center justify-between text-body-sm text-secondary font-medium">
                <span>Commercial Yellow Plate</span>
                <span>AITP Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Comprehensive Multi-Service Pricing Breakdown */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Transparent Commercial Pricing
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Standard Fares &amp; Corridors for {vehicle.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Every fare is calculated with complete transparency. Lock your chauffeur vehicle today with a 28% advance
              token; pay the balance upon completion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
            {/* Local Package Card */}
            <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-border-warm/60 flex flex-col justify-between">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-title-md font-serif text-terracotta-sandstone">Local Sightseeing</span>
                  <span className="material-symbols-outlined text-primary text-icon-24">location_city</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Explore Taj Mahal, Agra Fort, Mehtab Bagh, and Baby Taj with a private dedicated chauffeur.
                </p>
                <div className="flex flex-col gap-space-xs pt-space-xs divide-y divide-border-warm/30">
                  <div className="flex items-center justify-between py-2 text-body-sm">
                    <span className="text-ink-charcoal font-medium">8 Hours / 80 km</span>
                    <span className="font-semibold text-terracotta-sandstone font-serif text-headline-md">₹{rates.standard8h}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-body-sm">
                    <span className="text-ink-charcoal font-medium">Full Day Sightseeing (12h)</span>
                    <span className="font-semibold text-terracotta-sandstone font-serif text-headline-md">₹{rates.fullDay}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-body-sm">
                    <span className="text-ink-charcoal font-medium">Agra Cantt Railway Drop</span>
                    <span className="font-semibold text-terracotta-sandstone font-serif text-headline-md">₹{rates.agraCantt}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-body-sm">
                    <span className="text-ink-charcoal font-medium">Agra Airport (AGR) Transfer</span>
                    <span className="font-semibold text-terracotta-sandstone font-serif text-headline-md">₹{rates.agraAirport}</span>
                  </div>
                </div>
              </div>
              <a
                className="mt-space-lg w-full inline-flex items-center justify-center gap-space-xs bg-sandstone-wash text-terracotta-sandstone hover:bg-terracotta-deep hover:text-white py-3 rounded text-label-lg font-label-lg transition-colors border border-border-warm"
                href={`/book/?vehicle=${vehicleSlug}&type=local&step=2`}
              >
                <span>Book Local Agra Cab</span>
                <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
              </a>
            </div>

            {/* Outstation One-Way Corridors */}
            <div className="lg:col-span-2 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-border-warm/60 flex flex-col justify-between">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-title-md font-serif text-terracotta-sandstone">Popular Fixed Outstation Drops</span>
                  <span className="material-symbols-outlined text-primary text-icon-24">alt_route</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  One-way doorstep drops between Agra and major northern hubs. No return empty-run fare penalty.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                  {oneWayRoutes.map((r) => (
                    <div
                      key={r.routeId}
                      className="p-space-sm rounded bg-surface-container-low border border-border-warm/40 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-lg text-ink-charcoal font-semibold">{r.routeEn}</span>
                        <span className="text-label-md text-secondary">{r.highway} • {r.km} km</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-headline-sm text-headline-md text-terracotta-sandstone font-serif font-semibold">
                          ₹{r.fare.toLocaleString("en-IN")}
                        </span>
                        <span className="text-label-lg text-secondary">One-Way</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-space-lg pt-space-sm border-t border-border-warm/40 flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <span className="text-body-sm text-secondary">
                  Tolls and state entrance taxes bundled into fixed one-way bookings.
                </span>
                <a
                  className="inline-flex items-center gap-space-xs bg-terracotta-deep text-white px-6 py-2.5 rounded text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all"
                  href={bookingUrl}
                >
                  <span>Book Outstation Transfer</span>
                  <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Vehicle Specific FAQ Accordion */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Frequently Asked Questions
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Answers About the {vehicle.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Everything you need to know about pricing, luggage space, passenger limits, and chauffeur policies.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-lg border border-border-warm/60 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-space-lg flex items-center justify-between gap-space-md text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-title-md text-ink-charcoal font-serif">{item.q}</span>
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
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Grand Call-to-Action Strip */}
      <section className="w-full bg-sandstone-wash py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 md:p-12 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 w-full border border-border-warm">
            <div className="flex flex-col gap-space-xs max-w-xl text-left w-full">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest">
                Reserve With Confidence
              </span>
              <h2 className="font-headline-lg text-headline-hero sm:text-headline-md md:text-headline-lg text-ink-charcoal font-serif leading-tight">
                Secure Your {vehicle.name} Today.
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg leading-relaxed">
                Confirm your chauffeur car with a transparent 28% advance token. Zero hidden surcharges, fully air-conditioned,
                and backed by our 45-minute roadside replacement guarantee.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-terracotta-deep text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all duration-200 text-center"
                href={bookingUrl}
              >
                <span className="material-symbols-outlined text-icon-20">calendar_today</span>
                <span>Book This Vehicle</span>
              </a>
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-ink-charcoal text-ivory-surface px-6 py-3.5 sm:py-4 rounded text-label-lg font-label-lg shadow-sm hover:bg-ink-slate transition-all duration-200 text-center"
                href={`tel:${contact.phone}`}
              >
                <span className="material-symbols-outlined text-icon-20 text-terracotta-sunlit">phone_in_talk</span>
                <span>{contact.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VehicleDetailPage;
