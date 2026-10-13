import { useEffect, useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { fetchLiveFleet, type PublicFleetVehicle } from "../services/catalog";
import { fetchPublishedLocalTransfers } from "../services/catalogManifest";

export interface FleetPageProps {
  language?: SupportedLanguage;
}

interface FleetVehicle {
  id: string;
  name: string;
  classTag: string;
  category: "all" | "sedan" | "mpv" | "suv" | "group";
  highlightBadge: string;
  description: string;
  image: string;
  rates: {
    outstationPerKm: number;
    local8h80km: number;
    minimum?: number;
    fullDayYamuna: number;
  };
  specs: {
    seats: string;
    luggage: string;
    climate: string;
    fuel: string;
  };
  amenities: string[];
  bestSuitedFor: string;
}

const FLEET_DATA: FleetVehicle[] = [
  {
    id: "sedan",
    name: "Maruti Dzire / Toyota Etios",
    classTag: "CLASS 01",
    category: "sedan",
    highlightBadge: "MOST POPULAR • CITY & EXPRESSWAY DROPS",
    description:
      "Agile, highly comfortable, and ideal for couples, solo business executives, and rapid airport transfers across the Yamuna Expressway and Delhi NCR.",
    image: "/assets/fleet/sedan.webp",
    rates: {
      outstationPerKm: 10,
      local8h80km: 1900,
      fullDayYamuna: 3499,
    },
    specs: {
      seats: "4 Pax + Chauffeur",
      luggage: "2 Large + 2 Bags",
      climate: "Dual AC Vents",
      fuel: "1.2L DualJet Petrol",
    },
    amenities: [
      "Chilled bottled water on arrival",
      "Type-C & USB fast charging docks",
      "Reading lamps & tissues",
      "Umbrella on board",
    ],
    bestSuitedFor: "Same-day Taj Mahal tours, solo business transfers, couples visiting Fatehpur Sikri.",
  },
  {
    id: "ertiga",
    name: "Maruti Ertiga Hybrid",
    classTag: "CLASS 02",
    category: "mpv",
    highlightBadge: "FAMILY FAVORITE • ECONOMY 6-SEATER",
    description:
      "A versatile, fuel-efficient 6-passenger transporter designed for nuclear families, pilgrimage circles to Mathura-Vrindavan, and intercity sightseeing.",
    image: "/assets/fleet/ertiga.webp",
    rates: {
      outstationPerKm: 14,
      local8h80km: 2600,
      fullDayYamuna: 4800,
    },
    specs: {
      seats: "6 Pax + Chauffeur",
      luggage: "3 Large + 2 Cabin Bags",
      climate: "Roof-Mounted AC Blower",
      fuel: "1.5L K15C Smart Hybrid",
    },
    amenities: [
      "Dedicated roof blower airflow",
      "Flexible folding third-row seats",
      "Chilled bottled water & paper napkins",
      "Expressway emergency kit",
    ],
    bestSuitedFor: "Families with elders or children visiting temples in Mathura, Vrindavan, and Agra Fort.",
  },
  {
    id: "innova",
    name: "Toyota Innova Crysta",
    classTag: "CLASS 03",
    category: "suv",
    highlightBadge: "EXECUTIVE LUXURY • CAPTAIN CHAIRS",
    description:
      "The undisputed emperor of Indian highway touring. Featuring deep plush captain seats, independent climate control, and unmatched sound insulation.",
    image: "/assets/fleet/innova.webp",
    rates: {
      outstationPerKm: 18,
      local8h80km: 3500,
      fullDayYamuna: 6499,
    },
    specs: {
      seats: "6/7 Pax + Chauffeur",
      luggage: "4 Large Bags + Racks",
      climate: "Dual-Zone Digital Climate Control",
      fuel: "2.4L GD Turbo Diesel",
    },
    amenities: [
      "Reclining leatherette captain seats",
      "Dual-zone digital auto climate control",
      "Premium acoustic ride damping",
      "Mineral water bottles & newspaper",
    ],
    bestSuitedFor: "Foreign dignitaries, executive business delegations, and Golden Triangle multi-day loops.",
  },
  {
    id: "tempo",
    name: "Force Tempo Traveller",
    classTag: "CLASS 04",
    category: "group",
    highlightBadge: "GROUP TRAVEL • 12 TO 26 SEATER",
    description:
      "Roomy, high-roof touring van for large family groups, corporate offsites, and multi-city tourist parties who travel together in high comfort.",
    image: "/assets/fleet/tempo.webp",
    rates: {
      outstationPerKm: 25,
      local8h80km: 5500,
      minimum: 300,
      fullDayYamuna: 9500,
    },
    specs: {
      seats: "12 to 26 Reclining Seats",
      luggage: "Rear Bay + Heavy-Duty Carrier",
      climate: "Commercial Dual AC Compressor",
      fuel: "2.6L FM CR Common Rail",
    },
    amenities: [
      "Individual reclining high-back seats",
      "Dedicated reading lights and USB ports",
      "LCD multimedia screen & PA audio system",
      "Weatherproof roof luggage carrier",
    ],
    bestSuitedFor: "Wedding party transits, student heritage excursions, and extended Rajasthan circuits.",
  },
  {
    id: "urbania",
    name: "Force Urbania VIP",
    classTag: "CLASS 05",
    category: "group",
    highlightBadge: "VIP MONOCOQUE VAN • EUROPEAN STYLING",
    description:
      "State-of-the-art European monocoque architecture delivering whisper-quiet highway ride, plush passenger lounge, and wide panoramic windows.",
    image: "/assets/fleet/urbania.webp",
    rates: {
      outstationPerKm: 34,
      local8h80km: 7500,
      minimum: 300,
      fullDayYamuna: 12500,
    },
    specs: {
      seats: "10 to 17 Luxury Captain Seats",
      luggage: "Dedicated Internal Deep Boot",
      climate: "Individual Jet AC Louvers",
      fuel: "Mercedes-Derived FM 2.6L CR",
    },
    amenities: [
      "Ultra-wide reclining plush captain seats",
      "Aircraft-style individual jet vents & lighting",
      "Panoramic tinted UV-cut glass",
      "Large dedicated rear luggage hold",
    ],
    bestSuitedFor: "Luxury inbound travel groups, VIP wedding entourage, and luxury Golden Triangle tours.",
  },
];

const FLEET_FAQS = [
  {
    q: "What is the difference between Ertiga and Innova Crysta for outstation travel?",
    a: "While both accommodate 6 passengers, the Toyota Innova Crysta features a heavier ladder-frame chassis, superior highway suspension, wider captain-seat comfort, and dedicated luggage space behind the 3rd row. The Maruti Ertiga is lighter and more economical, ideal for budget-conscious families with light luggage.",
  },
  {
    q: "How does the per-km billing work for outstation trips?",
    a: "Outstation round-trips are billed based on the garage-to-garage distance with an industry-standard minimum threshold of 300 km per calendar day. For example, a 2-day round trip covers a minimum billable 600 km. Expressway toll taxes, state border permits, and parking are billed transparently at actuals.",
  },
  {
    q: "Are luggage carriers or roof racks available for extra bags?",
    a: "Yes. Our Force Tempo Travellers come equipped with heavy-duty roof luggage carriers with weatherproof tarpaulin covers, in addition to their rear luggage bays. For Ertiga and Innova Crysta, covered roof carriers can be mounted on advance request for airport groups carrying large suitcases.",
  },
  {
    q: "Do all vehicles have full air-conditioning during peak summer and hill travel?",
    a: "100% yes. Every cab and van in our fleet is fitted with powerful factory-installed dual air conditioning systems. AC is kept continuously running during highway travel and city sightseeing without any compromise on passenger comfort.",
  },
  {
    q: "Are the vehicles yellow-plate commercial tourist cabs?",
    a: "Every vehicle operated by Agra SK Baghel Tour and Travels carries a registered commercial yellow plate, All-India Tourist Permit (AITP), up-to-date fitness certificates, and comprehensive passenger insurance.",
  },
];

/** fleet tier (API) → static FleetVehicle id */
const TIER_TO_ID: Record<string, string> = {
  sedan: "sedan",
  ertiga: "ertiga",
  "innova-crysta": "innova",
  innova: "innova",
  "tempo-traveller": "tempo",
  tempo: "tempo",
  urbania: "urbania",
};

export function FleetPage({ language = "en" }: FleetPageProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | "sedan" | "mpv" | "suv" | "group">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Live fleet from the admin "Fleet & Fare Rules" editor — names, seats,
  // per-km rates and availability flow through automatically.
  const [liveFleet, setLiveFleet] = useState<PublicFleetVehicle[]>([]);
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    fetchLiveFleet()
      .then((fleet) => {
        if (isMounted) setLiveFleet(fleet);
      })
      .catch(() => {
        /* static fleet remains the fallback */
      });

    fetchPublishedLocalTransfers()
      .then((pkgs) => {
        if (!isMounted || !Array.isArray(pkgs)) return;
        const p8 = pkgs.find(
          (p: any) =>
            p?.code?.includes("8hr") ||
            p?.packageCode?.includes("8hr") ||
            p?.durationHours === 8 ||
            p?.duration_hours === 8
        );
        if (p8?.fleetPrices) {
          setLocalPrices(p8.fleetPrices);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const fleet = useMemo(() => {
    if (liveFleet.length === 0) return FLEET_DATA;
    return FLEET_DATA.map((veh) => {
      const live = liveFleet.find((v) => TIER_TO_ID[v.tier] === veh.id || TIER_TO_ID[v.id] === veh.id);
      if (!live) return veh;
      const liveLocal = localPrices[veh.id] || (live.tier ? localPrices[live.tier] : undefined);
      return {
        ...veh,
        name: live.name || veh.name,
        rates: {
          ...veh.rates,
          outstationPerKm: live.perKm > 0 ? live.perKm : veh.rates.outstationPerKm,
          local8h80km: typeof liveLocal === "number" && liveLocal > 0 ? liveLocal : veh.rates.local8h80km,
        },
        specs: {
          ...veh.specs,
          seats: live.seats > 0 ? `${live.seats} Pax + Chauffeur` : veh.specs.seats,
        },
        // Deactivated vehicles stay visible but are clearly marked "on request".
        highlightBadge: live.active ? veh.highlightBadge : "ON REQUEST • DESK CONFIRMATION",
      };
    });
  }, [liveFleet, localPrices]);

  const filteredVehicles = useMemo(() => {
    if (activeCategory === "all") return fleet;
    return fleet.filter((v) => v.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. BREADCRUMB & HERO */}
      <section className="w-full bg-sandstone-wash/40 py-10 sm:py-space-xl border-b border-border-warm/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-wrap">
            <a className="hover:text-primary transition-colors" href="/">
              Home
            </a>
            <span className="text-outline-variant font-medium">/</span>
            <span className="text-ink-charcoal font-semibold">Fleet &amp; Chauffeured Vehicles</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-lg">
            <div className="max-w-3xl">
              <h1 className="font-headline-hero text-headline-hero-mobile sm:text-headline-lg lg:text-headline-hero text-ink-charcoal leading-tight tracking-tight mt-1.5">
                Clean, modern vehicles. Verified drivers.{" "}
                <span className="text-terracotta-sandstone italic block sm:inline">
                  Transparent rates per kilometer.
                </span>
              </h1>
              <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mt-space-sm leading-relaxed">
                Explore our clean,
                Zero hidden charges, 100% AC performance guaranteed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <a
                className="inline-flex items-center justify-center gap-1.5 bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-lg text-xs px-4.5 py-2.5 rounded-lg shadow-sm transition-all whitespace-nowrap font-semibold"
                href="#spec-comparison"
              >
                <span>Compare Specs</span>
                <span className="material-symbols-outlined text-icon-16">south</span>
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-xs px-4.5 py-2.5 rounded-lg shadow-xs transition-all whitespace-nowrap font-semibold active:scale-[0.98]"
                style={{ color: "#ffffff" }}
                href="https://wa.me/919762817598"
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
                <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp Support</span>
              </a>
            </div>
          </div>

          {/* Trust Proof Ribbon (Compact -20%) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg shadow-xs border border-border-warm/70 flex items-start gap-2 h-full">
              <div className="w-8 h-8 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-icon-18">verified</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">100% Commercial Plates</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  All-India Tourist Permit with pre-cleared interstate taxes.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg shadow-xs border border-border-warm/70 flex items-start gap-2 h-full">
              <div className="w-8 h-8 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-icon-18">speed</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Speed Governed</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Strict adherence to 80/100 km/h expressway security benchmarks.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg shadow-xs border border-border-warm/70 flex items-start gap-2 h-full">
              <div className="w-8 h-8 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-icon-18">airline_seat_recline_extra</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Clean, Sanitized Cabins</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Vacuumed and cleaned before every single guest pickup.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg shadow-xs border border-border-warm/70 flex items-start gap-2 h-full">
              <div className="w-8 h-8 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-icon-18">receipt_long</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Official Tax Invoice</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Instant tax invoice for corporate &amp; family travel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTERS */}
      <section className="w-full bg-surface border-b border-border-warm/60 py-4 sticky top-20 z-30 backdrop-blur-md bg-surface/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Vehicles (5)" },
            { id: "sedan", label: "Executive Sedans" },
            { id: "mpv", label: "Family MPVs (6-Seater)" },
            { id: "suv", label: "Premium SUV (Innova Crysta)" },
            { id: "group", label: "Group Vans & Minibus" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-lg font-label-caps text-xs uppercase tracking-wider transition-all whitespace-nowrap font-bold ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. COMPREHENSIVE FLEET SHOWROOM */}
      <section className="w-full py-12 sm:py-space-2xl bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:gap-space-xl">
          {filteredVehicles.map((veh) => (
            <article
              key={veh.id}
              className="bg-surface-container-lowest rounded-xl shadow-xs border border-border-warm/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch transition-all duration-300 hover:shadow-md"
            >
              <div className="lg:col-span-5 relative min-h-[190px] sm:min-h-[220px] lg:min-h-[260px] bg-sandstone-wash overflow-hidden">
                <img
                  className="w-full h-full object-cover min-h-[190px] sm:min-h-[220px] lg:min-h-[260px]"
                  src={veh.image}
                  alt={veh.name}
                />
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-sandstone-wash/95 backdrop-blur-sm text-terracotta-sandstone font-label-caps text-label-caps uppercase tracking-wider shadow-xs font-bold">
                    {veh.highlightBadge}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 p-3.5 sm:p-4.5 lg:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                    <h2 className="font-headline-md text-base sm:text-lg text-ink-charcoal font-semibold">
                      {veh.name}
                    </h2>
                    <span className="font-label-caps text-label-lg px-2 py-0.5 rounded bg-sandstone-wash text-ink-charcoal font-bold border border-border-warm">
                      {veh.classTag}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-md sm:text-label-md text-on-surface-variant mb-space-sm leading-relaxed">
                    {veh.description}
                  </p>

                  {/* Pricing Banner (Compact -20%) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-surface-container-low p-2 sm:p-2.5 rounded-lg mb-space-sm border border-border-warm/60 text-center">
                    <div className="py-0.5">
                      <span className="block font-label-caps text-label-caps text-secondary uppercase font-semibold">
                        Outstation Rate
                      </span>
                      <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                        <span className="font-price-display text-base sm:text-lg text-terracotta-sandstone font-bold">
                          ₹{veh.rates.outstationPerKm}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">/ km</span>
                      </div>
                    </div>
                    <div className="bg-surface-container-high/40 rounded py-0.5 px-1 sm:border-x sm:border-border-warm/40">
                      <span className="block font-label-caps text-label-caps text-secondary uppercase font-semibold">
                        8h/80Km Local
                      </span>
                      <span className="block font-price-display text-base text-ink-charcoal font-bold mt-0.5">
                        ₹{veh.rates.local8h80km.toLocaleString("en-IN")}
                      </span>
                      <span className="block font-body-sm text-label-caps text-on-surface-variant">Standard Day</span>
                    </div>
                    <div className="py-0.5">
                      <span className="block font-label-caps text-label-caps text-secondary uppercase font-semibold">
                        Full Day Agra
                      </span>
                      <span className="block font-price-display text-base text-ink-charcoal font-bold mt-0.5">
                        ₹{veh.rates.fullDayYamuna.toLocaleString("en-IN")}
                      </span>
                      <span className="block font-body-sm text-label-caps text-success-jade font-semibold">Tolls Included</span>
                    </div>
                  </div>

                  {/* Technical Specs Grid (Compact -20%) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-space-sm">
                    <div className="bg-surface-container p-2 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-label-caps text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">
                          airline_seat_recline_normal
                        </span>
                        Seats
                      </span>
                      <span className="font-title-md text-body-md text-ink-charcoal mt-0.5 block font-semibold">{veh.specs.seats}</span>
                    </div>
                    <div className="bg-surface-container p-2 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-label-caps text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">luggage</span>
                        Luggage
                      </span>
                      <span className="font-title-md text-body-md text-ink-charcoal mt-0.5 block font-semibold">{veh.specs.luggage}</span>
                    </div>
                    <div className="bg-surface-container p-2 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-label-caps text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">ac_unit</span>
                        Climate
                      </span>
                      <span className="font-title-md text-body-md text-ink-charcoal mt-0.5 block font-semibold">{veh.specs.climate}</span>
                    </div>
                    <div className="bg-surface-container p-2 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-label-caps text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">directions_car</span>
                        Engine
                      </span>
                      <span className="font-title-md text-body-md text-ink-charcoal mt-0.5 block font-semibold">{veh.specs.fuel}</span>
                    </div>
                  </div>

                  {/* Amenities & Best Suited */}
                  <div className="flex flex-col gap-1 mb-space-sm text-on-surface-variant font-body-sm text-label-lg">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-icon-14 text-success-jade shrink-0 mt-0.5">check_circle</span>
                      <span>
                        <strong>Complimentary Amenities:</strong> {veh.amenities.join(" · ")}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone shrink-0 mt-0.5">stars</span>
                      <span>
                        <strong>Best Suited For:</strong> {veh.bestSuitedFor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-space-xs border-t border-border-warm/60">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <a
                      className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 font-semibold active:scale-[0.98]"
                      style={{ color: "#ffffff" }}
                      href={`https://wa.me/919762817598?text=Inquiry%20for%20${encodeURIComponent(veh.name)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 text-white" />
                      <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp Inquiry</span>
                    </a>
                    <a
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-lg text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 font-semibold"
                      href={`/book?vehicle=${veh.id}&step=2`}
                    >
                      <span>Book {veh.name.split(" ")[0]}</span>
                      <span className="material-symbols-outlined text-icon-15">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. COMPREHENSIVE COMPARISON TABLE (Compact -20%) */}
      <section id="spec-comparison" className="w-full bg-sandstone-wash/30 py-8 sm:py-space-xl border-y border-border-warm/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-space-lg">
            <span className="font-label-caps text-body-sm text-terracotta-sandstone uppercase tracking-widest font-bold">
              TRANSPARENT TARIFF BENCHMARK
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal mt-1 font-semibold">
              Side-by-Side Fleet Comparison
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
              Compare key technical capabilities and outstation billing guidelines across all five classes before reserving your journey.
            </p>
          </div>
          <div className="w-full overflow-x-auto rounded-xl shadow-xs bg-surface-container-lowest border border-border-warm/80">
            <table className="w-full text-left font-body-sm text-label-md min-w-[720px] border-collapse">
              <thead className="bg-surface-container text-ink-charcoal font-label-caps text-body-sm uppercase tracking-wider border-b border-border-warm font-bold">
                <tr>
                  <th className="py-2.5 px-3.5 align-middle">Vehicle Class</th>
                  <th className="py-2.5 px-3.5 align-middle">Passenger Capacity</th>
                  <th className="py-2.5 px-3.5 align-middle">Luggage Capacity</th>
                  <th className="py-2.5 px-3.5 align-middle">AC &amp; Climate Control</th>
                  <th className="py-2.5 px-3.5 align-middle">Outstation Rate</th>
                  <th className="py-2.5 px-3.5 align-middle text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-2.5 px-3.5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Maruti Dzire / Etios</span>
                    <span className="font-body-sm text-body-sm text-secondary font-normal">Executive Sedan</span>
                  </td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant font-medium whitespace-nowrap">4 + 1 Pax</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">2 Large Bags</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">Dual Front/Rear Vents</td>
                  <td className="py-2.5 px-3.5 align-middle font-bold text-terracotta-sandstone text-sm whitespace-nowrap">₹10 / km</td>
                  <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-2.5 py-1 rounded bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-caps text-body-sm tracking-wider transition-all shadow-xs font-bold"
                      href="/book?vehicle=sedan&step=2"
                    >
                      Select Sedan
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-2.5 px-3.5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Maruti Suzuki Ertiga</span>
                    <span className="font-body-sm text-body-sm text-secondary font-normal">Smart Hybrid MPV</span>
                  </td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant font-medium whitespace-nowrap">6 + 1 Pax</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">3 Medium + 3 Cabin</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">Roof Blower Airflow</td>
                  <td className="py-2.5 px-3.5 align-middle font-bold text-terracotta-sandstone text-sm whitespace-nowrap">₹14 / km</td>
                  <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-2.5 py-1 rounded bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-caps text-body-sm tracking-wider transition-all shadow-xs font-bold"
                      href="/book?vehicle=ertiga&step=2"
                    >
                      Select MPV
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors bg-sandstone-wash/10">
                  <td className="py-2.5 px-3.5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Toyota Innova Crysta</span>
                    <span className="font-body-sm text-body-sm text-terracotta-sandstone font-semibold">Executive Touring</span>
                  </td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant font-medium whitespace-nowrap">6/7 + 1 Pax</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">4 Large + Handbags</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">Dual-Zone Auto Digital</td>
                  <td className="py-2.5 px-3.5 align-middle font-bold text-terracotta-sandstone text-sm whitespace-nowrap">₹18 / km</td>
                  <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-2.5 py-1 rounded bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-caps text-body-sm tracking-wider transition-all shadow-xs font-bold"
                      href="/book?vehicle=innova&step=2"
                    >
                      Select Crysta
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-2.5 px-3.5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Force Tempo Traveller</span>
                    <span className="font-body-sm text-body-sm text-secondary font-normal">Luxury Minibus</span>
                  </td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant font-medium whitespace-nowrap">12 to 26 Pax</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">15+ Bags + Deep Boot</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">Commercial Dual AC</td>
                  <td className="py-2.5 px-3.5 align-middle font-bold text-terracotta-sandstone text-sm whitespace-nowrap">₹25 / km</td>
                  <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-2.5 py-1 rounded bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-caps text-body-sm tracking-wider transition-all shadow-xs font-bold"
                      href="/book?vehicle=tempo&step=2"
                    >
                      Select Minibus
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-2.5 px-3.5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Force Urbania VIP</span>
                    <span className="font-body-sm text-body-sm text-secondary font-normal">Monocoque Executive Van</span>
                  </td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant font-medium whitespace-nowrap">9 to 17 Pax</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">12+ Suitcases Hold</td>
                  <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">Individual Jet AC Louvers</td>
                  <td className="py-2.5 px-3.5 align-middle font-bold text-terracotta-sandstone text-sm whitespace-nowrap">₹34 / km</td>
                  <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-2.5 py-1 rounded bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-caps text-body-sm tracking-wider transition-all shadow-xs font-bold"
                      href="/book?vehicle=urbania&step=2"
                    >
                      Select Urbania
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. FLEET FAQS (Compact -20%) */}
      <section className="w-full bg-surface py-8 sm:py-space-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-space-lg">
            <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
              Vehicle Guidelines &amp; Policies
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Fleet Questions
            </h2>
          </div>
          <div className="space-y-2.5">
            {FLEET_FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-xs sm:text-title-lg font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-icon-18 shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-3 sm:p-3.5 pt-0 text-on-surface-variant font-body-sm text-body-md leading-relaxed border-t border-border-warm/40 mt-1">
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
