import React, { useState } from "react";
import { contact } from "../data/contact";
import { type Route, routeGuidance } from "../data/catalogue";
import { WhatsAppIcon } from "../components/icons";
import { VEHICLE_TIERS, type VehicleTier, resolveTierKey } from "../contracts/vehicle-tiers";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTaxiServiceSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";

export interface RouteTemplateProps {
  language?: "en" | "hi";
  route: Route;
  onSelectVehicle?: (tier: VehicleTier) => void;
}

interface FleetSpec {
  tier: VehicleTier;
  name: string;
  category: string;
  seats: string;
  bags: string;
  ac: string;
  chauffeur: string;
  isAlwaysRoundTrip?: boolean;
}

const CANONICAL_FLEET_SPECS: Record<VehicleTier, FleetSpec> = {
  sedan: {
    tier: "sedan",
    name: "Sedan (Dzire / Etios)",
    category: "Comfort Sedan",
    seats: "4",
    bags: "2-3",
    ac: "Verified Dual AC",
    chauffeur: "Police Verified Chauffeur",
  },
  ertiga: {
    tier: "ertiga",
    name: "Ertiga MPV",
    category: "Spacious MPV",
    seats: "6",
    bags: "3-4",
    ac: "Roof-Mounted AC Vents",
    chauffeur: "Highway Specialist",
  },
  "innova-crysta": {
    tier: "innova-crysta",
    name: "Toyota Innova Crysta",
    category: "VIP Executive",
    seats: "6-7",
    bags: "4-5",
    ac: "Multi-Zone Climate AC",
    chauffeur: "Senior Veteran Chauffeur",
  },
  "tempo-traveller": {
    tier: "tempo-traveller",
    name: "Tempo Traveller",
    category: "Group Charter",
    seats: "12",
    bags: "8-10",
    ac: "Individual AC Vents",
    chauffeur: "Commercial Master Pilot",
    isAlwaysRoundTrip: true,
  },
  urbania: {
    tier: "urbania",
    name: "Force Urbania Luxury Van",
    category: "Ultra-Luxury Van",
    seats: "16",
    bags: "10-12",
    ac: "Monocoque Climate Luxury",
    chauffeur: "VIP Protocol Chauffeur",
    isAlwaysRoundTrip: true,
  },
};

export function RouteTemplate({ language = "en", route }: RouteTemplateProps) {
  const [tripType, setTripType] = useState<"one-way" | "round-trip">(
    route.kind === "local" ? "round-trip" : "one-way"
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const fromEn = route.origin || (route.from ? route.from.charAt(0).toUpperCase() + route.from.slice(1) : "Agra");
  const toEn = route.destination || (route.to ? route.to.charAt(0).toUpperCase() + route.to.slice(1) : "Delhi");
  const isLocal = route.kind === "local";

  const routeGuidanceData = routeGuidance[route.id] || {
    highway: route.corridor || "National Highway / Expressway Corridor",
    transitTime: `${route.duration} (${route.km} km)`,
    departureTip: {
      en: "Early morning or mid-day departures are ideal to avoid peak city rush hours.",
      hi: "Early morning departures avoid peak city rush hours.",
    },
    restStops: {
      en: "Verified highway food courts with hygienic washrooms and branded eateries.",
      hi: "Verified highway food courts with hygienic washrooms.",
    },
    tollTaxPolicy: {
      en: "One-way booking includes highway tolls. Round-trip subject to standard outstation rules.",
      hi: "One-way booking includes highway tolls.",
    },
  };

  // Route stopovers based on destination
  const stopovers = isLocal
    ? [
        { icon: "mosque", title: "Taj Mahal (East Gate)", desc: "Marvel at pristine white marble in the soft golden light of sunrise." },
        { icon: "castle", title: "Agra Fort & Diwan-i-Khas", desc: "Explore the red sandstone imperial citadel of the Mughal Emperors." },
        { icon: "park", title: "Mehtab Bagh Sunset", desc: "Witness the silhouette of the Taj Mahal across the sacred Yamuna river." },
      ]
    : route.id.includes("jaipur")
    ? [
        { icon: "fort", title: "Fatehpur Sikri UNESCO Citadel", desc: "Optional 90-minute stop at Emperor Akbar's ghost capital and Buland Darwaza." },
        { icon: "flutter_dash", title: "Bharatpur Bird Sanctuary", desc: "A paradise for migratory birds and nature lovers midway along NH-21." },
        { icon: "stairs", title: "Abhaneri Stepwell (Chand Baori)", desc: "One of the world's deepest and most visually stunning geometric stepwells." },
      ]
    : route.id.includes("mathura")
    ? [
        { icon: "temple_hindu", title: "Krishna Janmabhoomi Mathura", desc: "Sacred birth temple of Lord Krishna located on the historic NH-19 corridor." },
        { icon: "temple_buddhist", title: "Prem Mandir Vrindavan", desc: "Stunning Italian white marble temple renowned for its evening light show." },
        { icon: "water", title: "Yamuna Vishram Ghat", desc: "Peaceful boat rides and evening devotional aarti on the banks of Yamuna." },
      ]
    : route.id.includes("gwalior")
    ? [
        { icon: "phishing", title: "Chambal River Safari", desc: "Protected sanctuary famous for gharials, dolphins, and rare aquatic wildlife." },
        { icon: "castle", title: "Gwalior Fort & Man Mandir", desc: "Hilltop fortress described by Mughal Emperor Babur as the 'pearl of fortresses'." },
        { icon: "history_edu", title: "Jai Vilas Palace", desc: "19th-century royal palace housing the world's largest crystal chandeliers." },
      ]
    : [
        { icon: "ev_station", title: "Expressway Rest Plaza", desc: "Modern expressway comfort stop with clean restrooms, branded food, and coffee." },
        { icon: "temple_hindu", title: "Vrindavan Expressway Cut", desc: "Optional detour to Banke Bihari and ISKCON temples before entering Agra." },
        { icon: "storefront", title: "Sikandra - Akbar's Tomb", desc: "Magnificent red sandstone mausoleum nestled in quiet deer park grounds." },
      ];

  const faqItems = [
    {
      q: `Are expressway tolls, FASTag charges, and state road taxes included?`,
      a: `Yes! For fixed one-way transfers between ${fromEn} and ${toEn}, all Yamuna Expressway or national highway FASTag tolls and interstate taxes are 100% included in the quoted fare. There are zero surprise toll requests on the road.`,
    },
    {
      q: `Can we stop at en-route landmarks like Fatehpur Sikri or highway food plazas?`,
      a: `Absolutely! Unlike app-based aggregators with rigid routes, our private chauffeur services accommodate requested refreshment stops, coffee breaks, and sightseeing detours. Just let your driver know your preferences.`,
    },
    {
      q: `What is the night driving allowance for late-night departures?`,
      a: `Standard daytime journeys have ₹0 night charge. Commercial regulations apply a nominal night driving charge of ₹300 (Sedan/Ertiga) or ₹500 (Innova/Tempo) only if journeys are active during deep night (11:00 PM to 05:00 AM).`,
    },
    {
      q: `What happens if my flight or train is delayed before pickup?`,
      a: `We provide complimentary flight and train tracking! When booking, simply provide your arrival flight number or train PNR. Your chauffeur will automatically sync departure and include up to 60 minutes of complimentary waiting at terminal pickup bays.`,
    },
    {
      q: `What is your cancellation and refund policy?`,
      a: `Enjoy full peace of mind with our 24-Hour Free Cancellation Policy. If cancelled 24 hours or more before scheduled pickup, your 28% advance deposit is refunded 100% with zero cancellation penalty.`,
    },
    {
      q: `What emergency roadside assistance do you provide along this corridor?`,
      a: `We guarantee a 45-Minute Emergency Vehicle Replacement along major highway corridors (Yamuna Expressway, NH-19, and NH-21). Our central Taj Ganj dispatch operations desk immediately deploys a replacement commercial cab if required.`,
    },
  ];

  // Primary starting fare from sedan
  const sedanResolution = resolveTierKey(route.fares, "sedan");
  const baseSedanFare = Number(sedanResolution.value || 0);
  const primaryFare = baseSedanFare;
  const advanceToken = primaryFare > 0 ? Math.round(primaryFare * 0.25) : 0;

  const bookingUrl = `/book.html?category=outstation&product=${encodeURIComponent(route.id)}&trip=${tripType === "round-trip" ? "round_trip" : "one_way"}&from=${encodeURIComponent(fromEn)}&to=${encodeURIComponent(toEn)}&car=sedan`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour & Travels Desk, I would like to inquire about taxi booking from ${fromEn} to ${toEn} (${tripType === "round-trip" ? "Round Trip" : "One Way"}).`
  )}`;

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/routes/${route.id}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Routes", url: "/routes/" },
    { name: `${fromEn} to ${toEn}`, url: `/routes/${route.id}/` },
  ]);

  const faqSchema = buildFaqSchema(faqItems.map((f) => ({ question: f.q, answer: f.a })));

  const taxiSchema = buildTaxiServiceSchema({
    name: `${fromEn} to ${toEn} Taxi Service`,
    description: `Private AC chauffeur taxi from ${fromEn} to ${toEn} (${route.km} km, ${route.duration}). Doorstep pickup and transparent pricing across 5 canonical vehicle classes.`,
    areaServed: [fromEn, toEn, "Uttar Pradesh", "India"],
    offers: [
      {
        name: "Sedan Transfer",
        price: primaryFare,
        priceCurrency: "INR",
        description: `Taxi transfer from ${fromEn} to ${toEn}`,
      },
    ],
  });

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={buildGraphSchema(breadcrumbSchema, faqSchema, taxiSchema)} />

      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/routes/">Routes</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">{fromEn} to {toEn}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider">
            <span className="material-symbols-outlined text-icon-14">speed</span>
            Expressway Corridor
          </span>
        </div>
      </div>

      {/* Hero Corridor Showcase (STRICT LOCK-N04: ZERO IMAGE GALLERY) */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            {/* Left Column: Corridor Specs & Booking Callout */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-widest w-fit">
                <span className="material-symbols-outlined text-icon-14">directions_car</span>
                Doorstep Intercity Transit • Zero Return Penalties
              </span>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {isLocal ? "Agra Local Sightseeing Taxi" : `${fromEn} to ${toEn} Chauffeur Taxi`}
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Experience seamless, air-conditioned road journeys between {fromEn} and {toEn}. Fully permitted commercial
                yellow-plate fleet, sanitized cabins, and veteran chauffeurs with zero commission shopping detours.
              </p>

              {/* Trip Type Selector Toggle */}
              {!isLocal && (
                <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-lg border border-border-warm/60 w-fit">
                  <button
                    type="button"
                    onClick={() => setTripType("one-way")}
                    className={`px-4 py-2 rounded-md text-label-md font-semibold transition-all ${
                      tripType === "one-way"
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-ink-charcoal"
                    }`}
                  >
                    One-Way Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("round-trip")}
                    className={`px-4 py-2 rounded-md text-label-md font-semibold transition-all ${
                      tripType === "round-trip"
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-ink-charcoal"
                    }`}
                  >
                    Round-Trip Outstation
                  </button>
                </div>
              )}

              {/* Highway Corridor Intelligence Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">straighten</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{route.km} km</span>
                    <span className="text-label-md text-secondary">Verified Distance</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">schedule</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{route.duration}</span>
                    <span className="text-label-md text-secondary">Est. Transit Time</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">alt_route</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Tolls Inc.</span>
                    <span className="text-label-md text-secondary">One-Way Drops</span>
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
                  <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase">
                    Starting Corridor Fare (Sedan {tripType === "round-trip" ? "• Round-Trip" : "• One-Way"})
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {primaryFare > 0 ? (
                      <>
                        <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">
                          ₹{primaryFare.toLocaleString("en-IN")}
                        </span>
                        <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
                      </>
                    ) : (
                      <span className="font-headline-md text-headline-sm text-ink-charcoal font-serif font-semibold">
                        Custom Route / Live Quote
                      </span>
                    )}
                  </div>
                  {primaryFare > 0 && advanceToken > 0 ? (
                    <span className="text-body-sm text-secondary">
                      Lock with only ₹{advanceToken.toLocaleString("en-IN")} (advance deposit)
                    </span>
                  ) : (
                    <span className="text-body-sm text-secondary">
                      Exact fare computed dynamically on booking
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm">
                  <a
                    className="inline-flex items-center justify-center gap-space-xs bg-terracotta-deep text-white px-6 py-3.5 rounded text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all duration-200"
                    href={bookingUrl}
                  >
                    <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                    <span>Book This Route</span>
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

            {/* Right Column: Visual Corridor Card (No multi-image gallery - strict LOCK-N04) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-xl overflow-hidden shadow-xl bg-surface-container border border-border-warm/60">
                <img
                  className="w-full h-[440px] object-cover"
                  src="/assets/hero/hero-highway.webp"
                  alt={`${fromEn} to ${toEn} highway corridor`}
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/fleet/innova.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-space-lg flex items-center justify-between text-ivory-surface">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md font-serif">{routeGuidanceData.highway}</span>
                    <span className="text-body-sm text-sandstone-wash/80">{route.km} km • {route.duration}</span>
                  </div>
                </div>
              </div>

              {/* Trust signals strip */}
              <div className="grid grid-cols-2 gap-space-sm pt-space-md">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-success-jade text-icon-20">verified</span>
                  <span className="text-body-sm text-on-surface font-medium">100% Commercial Fleet</span>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-success-jade text-icon-20">car_repair</span>
                  <span className="text-body-sm text-on-surface font-medium">45-Min Highway Replacement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Canonical 5-Vehicle Fare Comparison Matrix */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Vehicle Comparison
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Select Your Travel Tier for {fromEn} to {toEn}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Transparent, guaranteed fares across all 5 canonical vehicle categories. Zero hidden meter charges or surprise return toll fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {VEHICLE_TIERS.map((tier) => {
              const spec = CANONICAL_FLEET_SPECS[tier];
              const resolved = resolveTierKey(route.fares, tier);
              let rawFare = Number(resolved.value || 0);

              // Fallback calculation if fare is missing
              if (!rawFare) {
                if (tier === "sedan") rawFare = baseSedanFare;
                else if (tier === "ertiga") rawFare = Math.round(baseSedanFare * 1.35);
                else if (tier === "innova-crysta") rawFare = Math.round(baseSedanFare * 1.7);
                else if (tier === "tempo-traveller") rawFare = Math.round(baseSedanFare * 2.6);
                else rawFare = Math.round(baseSedanFare * 3.6);
              }

              const calculatedFare = tripType === "round-trip" && !isLocal && !spec.isAlwaysRoundTrip
                ? Math.round(rawFare * 1.8)
                : rawFare;
              const token = Math.round(calculatedFare * 0.28);
              const isForceVehicle = Boolean(spec.isAlwaysRoundTrip);

              return (
                <div
                  key={tier}
                  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-border-warm/60 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-md uppercase tracking-wider font-semibold">
                        {spec.category}
                      </span>
                      <span className="text-body-sm text-secondary font-medium">{spec.seats} Seats</span>
                    </div>

                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif mt-1">{spec.name}</h3>

                    <div className="flex flex-col gap-1 py-space-xs border-y border-border-warm/30 text-body-sm text-on-surface-variant">
                      <div className="flex items-center justify-between">
                        <span>Luggage Capacity:</span>
                        <span className="font-medium text-ink-charcoal">{spec.bags} Bags</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Air Conditioning:</span>
                        <span className="font-medium text-success-jade">{spec.ac}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Chauffeur:</span>
                        <span className="font-medium text-ink-charcoal">{spec.chauffeur}</span>
                      </div>
                    </div>

                    <div className="flex flex-col pt-1">
                      <span className="text-label-md font-label-caps text-secondary uppercase">
                        {isForceVehicle ? "Round-Trip Fare" : tripType === "round-trip" ? "Round-Trip Fare" : "All-Inclusive Fare"}
                      </span>
                      <span className="font-headline-md text-headline-md text-terracotta-sandstone font-serif font-semibold">
                        ₹{calculatedFare.toLocaleString("en-IN")}
                      </span>
                      <span className="text-label-md text-secondary">
                        ₹{token.toLocaleString("en-IN")} token to lock (28%)
                      </span>
                      {isForceVehicle && (
                        <div className="mt-1.5 p-1.5 rounded bg-primary/10 border border-primary/20 text-body-md text-primary font-semibold leading-tight">
                          This vehicle is always booked as a round trip.
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    className="mt-space-md w-full inline-flex items-center justify-center gap-1 bg-terracotta-deep text-white py-2.5 rounded text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center"
                    href={`/book?from=${encodeURIComponent(fromEn)}&to=${encodeURIComponent(toEn)}&vehicle=${tier}&route=${encodeURIComponent(route.id)}&tripType=${tripType}`}
                  >
                    <span>Select {spec.name.split(" ")[0]}</span>
                    <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Highway Advisory & Route Intelligence Bento Grid */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Corridor Advisory
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Highway Guidance for {fromEn} to {toEn}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Practical driving insights curated by veteran Agra chauffeurs who complete this route daily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="p-space-xl rounded-xl bg-surface-container-lowest border border-border-warm/60 flex flex-col gap-space-sm shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-1">
                <span className="material-symbols-outlined text-icon-24">alarm</span>
              </div>
              <h3 className="font-title-md text-ink-charcoal font-serif">Optimal Departure Timing</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {routeGuidanceData.departureTip[language] || routeGuidanceData.departureTip.en}
              </p>
            </div>

            <div className="p-space-xl rounded-xl bg-surface-container-lowest border border-border-warm/60 flex flex-col gap-space-sm shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-1">
                <span className="material-symbols-outlined text-icon-24">restaurant</span>
              </div>
              <h3 className="font-title-md text-ink-charcoal font-serif">Verified Rest Plazas</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {routeGuidanceData.restStops[language] || routeGuidanceData.restStops.en}
              </p>
            </div>

            <div className="p-space-xl rounded-xl bg-surface-container-lowest border border-border-warm/60 flex flex-col gap-space-sm shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-1">
                <span className="material-symbols-outlined text-icon-24">toll</span>
              </div>
              <h3 className="font-title-md text-ink-charcoal font-serif">Toll Tax & FASTag Policy</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {routeGuidanceData.tollTaxPolicy[language] || routeGuidanceData.tollTaxPolicy.en}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Recommended En-Route Stopovers */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Sightseeing Detours
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Popular Stopovers Along {fromEn} to {toEn}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Turn your road trip into an unforgettable journey. Request any of these halts during reservation with zero hidden detour surcharges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {stopovers.map((stop, idx) => (
              <div
                key={idx}
                className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/60 shadow-sm flex flex-col gap-space-sm"
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-full bg-sandstone-wash text-terracotta-sandstone flex items-center justify-center">
                    <span className="material-symbols-outlined text-icon-20">{stop.icon}</span>
                  </div>
                  <h3 className="font-title-md text-ink-charcoal font-serif">{stop.title}</h3>
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">{stop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Route-Specific FAQs */}
      <section className="w-full bg-surface py-space-3xl border-t border-border-warm/30">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Frequently Asked Questions
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Answers for {fromEn} to {toEn} Travelers
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Everything you need to know about our outstation taxi fares, toll policies, and chauffeur standards.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {faqItems.map((faq, idx) => {
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

      {/* Section 6: Persistent Reservation Guarantee Footer Dock */}
      <section className="w-full bg-surface-container-low py-space-2xl border-t border-border-warm">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="flex flex-col">
            <span className="font-title-md text-ink-charcoal font-serif">
              Ready to travel {fromEn} to {toEn}?
            </span>
            <span className="text-body-sm text-secondary">
              Lock your chauffeur with a 28% advance deposit (₹{advanceToken.toLocaleString("en-IN")}). 100% refund on cancellations 24h prior.
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <a
              className="inline-flex items-center gap-1.5 bg-terracotta-deep text-white px-6 py-3 rounded text-label-lg font-semibold hover:bg-terracotta-sunlit transition-all shadow-sm"
              href={bookingUrl}
            >
              <span className="material-symbols-outlined text-icon-20">calendar_month</span>
              <span>Reserve Now</span>
            </a>
            <a
              className="inline-flex items-center gap-1.5 bg-black text-white hover:bg-neutral-900 border border-white/10 px-5 py-3 rounded text-label-lg font-semibold transition-all shadow-sm"
              style={{ color: "#ffffff" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
              <span className="text-white" style={{ color: "#ffffff" }}>Instant WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
