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
  category: "all" | "sedan" | "suv" | "luxury" | "tempo_traveller";
  highlightBadge: string;
  description: string;
  image: string;
  rates: {
    outstationPerKm: number | null;
    local8h80km: number | null;
    minimum?: number;
    fullDayYamuna: number | null;
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
    name: "Maruti Dzire / Honda Amaze / Toyota Etios",
    classTag: "CLASS 01",
    category: "sedan",
    highlightBadge: "MOST POPULAR • CITY & EXPRESSWAY DROPS",
    description:
      "Agile, highly comfortable, and ideal for couples, solo business executives, and rapid airport transfers across the Yamuna Expressway and Delhi NCR.",
    image: "/assets/fleet/sedan.webp",
    rates: {
      outstationPerKm: null,
      local8h80km: null,
      fullDayYamuna: null,
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
    category: "suv",
    highlightBadge: "FAMILY FAVORITE • ECONOMY 6-SEATER",
    description:
      "A versatile, fuel-efficient 6-passenger transporter designed for nuclear families, pilgrimage circles to Mathura-Vrindavan, and intercity sightseeing.",
    image: "/assets/fleet/ertiga.webp",
    rates: {
      outstationPerKm: null,
      local8h80km: null,
      fullDayYamuna: null,
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
      outstationPerKm: null,
      local8h80km: null,
      fullDayYamuna: null,
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
    id: "luxury",
    name: "Toyota Camry / Vellfire Luxury",
    classTag: "CLASS 04",
    category: "luxury",
    highlightBadge: "PRESIDENTIAL LUXURY • CHAUFFEUR DRIVEN",
    description:
      "Presidential-class luxury travel with whisper-quiet cabin acoustics, ottoman reclining seating, and elite executive presentation.",
    image: "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg",
    rates: {
      outstationPerKm: null,
      local8h80km: null,
      fullDayYamuna: null,
    },
    specs: {
      seats: "4–6 Executive Seats",
      luggage: "3 Large + 2 Cabin Bags",
      climate: "Multi-Zone Nanoe™ AC",
      fuel: "Self-Charging Hybrid / V6",
    },
    amenities: [
      "Plush leatherette ottoman seating",
      "Executive reading lounge lighting",
      "Acoustic insulated private cabin",
      "Chilled Evian mineral water bottles",
    ],
    bestSuitedFor: "Corporate CXOs, luxury destination weddings, and VIP dignitary heritage travel.",
  },
  {
    id: "tempo",
    name: "Force Tempo Traveller",
    classTag: "CLASS 05",
    category: "tempo_traveller",
    highlightBadge: "GROUP TRAVEL • 12 TO 26 SEATER",
    description:
      "Roomy, high-roof touring van for large family groups, corporate offsites, and multi-city tourist parties who travel together in high comfort.",
    image: "/assets/fleet/tempo.webp",
    rates: {
      outstationPerKm: null,
      local8h80km: null,
      minimum: 300,
      fullDayYamuna: null,
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
    classTag: "CLASS 06",
    category: "tempo_traveller",
    highlightBadge: "VIP MONOCOQUE VAN • EUROPEAN STYLING",
    description:
      "State-of-the-art European monocoque architecture delivering whisper-quiet highway ride, plush passenger lounge, and wide panoramic windows.",
    image: "/assets/fleet/urbania.webp",
    rates: {
      outstationPerKm: null,
      local8h80km: null,
      minimum: 300,
      fullDayYamuna: null,
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

interface ShowcaseVehicle {
  name: string;
  tier: string;
  capacity: string;
  image: string;
  features: string[];
}

const EXTENDED_FLEET_SHOWCASE: ShowcaseVehicle[] = [
  {
    name: "Toyota Fortuner 4x4",
    tier: "Full-Size SUV",
    capacity: "7 Pax · 4 Bags",
    image: "/assets/fleet/toyota-fortuner-black-suv-360x536.jpg",
    features: ["Commanding road presence", "Heavy expressway stability", "Dual AC blowers"],
  },
  {
    name: "Toyota Camry Hybrid",
    tier: "Executive Luxury",
    capacity: "4 Pax · 3 Bags",
    image: "/assets/fleet/toyota-camry-hybrid-executive-luxury-360x536.jpg",
    features: ["Whisper-quiet hybrid drive", "Executive reclining rear", "Nanoe™ air purification"],
  },
  {
    name: "Toyota Vellfire VIP Lounge",
    tier: "Presidential MPV",
    capacity: "6 Pax · 4 Bags",
    image: "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg",
    features: ["Ottoman captain seats", "Private acoustic cabin", "Ambient mood lounge"],
  },
  {
    name: "Honda Amaze Sedan",
    tier: "Compact Executive",
    capacity: "4 Pax · 2 Bags",
    image: "/assets/fleet/honda-amaze-red-sedan-921x519.webp",
    features: ["Smooth CVT automatic", "Deep 420L boot hold", "Chilled dual AC"],
  },
  {
    name: "Hyundai Creta Facelift",
    tier: "Premium Compact SUV",
    capacity: "5 Pax · 3 Bags",
    image: "/assets/fleet/hyundai-creta-white-suv-921x519.jpg",
    features: ["Panoramic glass sunroof", "Ventilated seating", "Plush highway suspension"],
  },
  {
    name: "Maruti Suzuki Brezza",
    tier: "City & Highway SUV",
    capacity: "5 Pax · 3 Bags",
    image: "/assets/fleet/maruti-brezza-red-compact-suv-1260x564.png",
    features: ["Smart hybrid economy", "High ground clearance", "Rear AC vents"],
  },
  {
    name: "Skoda Slavia Monte Carlo",
    tier: "European Touring Sedan",
    capacity: "4 Pax · 3 Bags",
    image: "/assets/fleet/skoda-slavia-montecarlo-jodhpur-palace-921x519.jpg",
    features: ["521L cavernous boot", "TSI high-speed touring", "German-engineered safety"],
  },
  {
    name: "Tata Nexon Fearless",
    tier: "5-Star Safety Compact SUV",
    capacity: "5 Pax · 3 Bags",
    image: "/assets/fleet/tata-nexon-fearless-green-suv-1260x564.png",
    features: ["5-Star Global NCAP", "Reinforced crash shell", "All-weather hill agility"],
  },
  {
    name: "Mahindra XUV700",
    tier: "Luxury Highway Tourer",
    capacity: "6 Pax · 3 Bags",
    image: "/assets/fleet/mahindra-xuv700-blue-suv-360x536.jpg",
    features: ["Skyroof panoramic glass", "mStallion turbo power", "Sony 3D immersive sound"],
  },
  {
    name: "Honda Elevate",
    tier: "Mid-Size Highway SUV",
    capacity: "5 Pax · 3 Bags",
    image: "/assets/fleet/honda-elevate-black-suv-front-930x620.jpg",
    features: ["220mm ground clearance", "Airy glasshouse cabin", "Honda Sensing security"],
  },
  {
    name: "Toyota Glanza Executive",
    tier: "Premium Hatchback",
    capacity: "4 Pax · 2 Bags",
    image: "/assets/fleet/toyota-glanza-red-hatchback-studio-1537x1023.png",
    features: ["Agile city sightseeing", "Fuel-efficient K-series", "Automatic climate control"],
  },
  {
    name: "MG Hector Plus 6-Seater",
    tier: "Executive Captain MPV",
    capacity: "6 Pax · 3 Bags",
    image: "/assets/fleet/mg-hector-plus-black-suv-480x360.webp",
    features: ["Middle row captain chairs", "Panoramic moonroof", "Full connectivity docks"],
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
  const [activeCategory, setActiveCategory] = useState<"all" | "sedan" | "suv" | "luxury" | "tempo_traveller">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Live fleet from the admin "Fleet & Fare Rules" editor — names, seats,
  // per-km rates and availability flow through automatically.
  const [liveFleet, setLiveFleet] = useState<PublicFleetVehicle[]>([]);
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchLiveFleet()
      .then((fleet) => {
        if (!isMounted) return;
        if (fleet && fleet.length > 0) {
          setLiveFleet(fleet);
          setLoadError(null);
        } else {
          setLiveFleet([]);
          setLoadError("No active vehicles configured in dispatch catalogue.");
        }
      })
      .catch(() => {
        if (isMounted) {
          setLiveFleet([]);
          setLoadError("Unable to connect to dispatch fleet service.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
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
  }, [activeCategory, fleet]);

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
                Fleet &amp; Group Luxury Car Rental in Agra
              </h1>
              <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mt-space-sm leading-relaxed">
                Rent spacious Tempo Travellers (9–26 seats) or hire an Innova Crysta in Agra for family tours and weddings. Chauffeur-driven luxury fleet at budget-friendly rates.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-space-lg">
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg shadow-xs border border-border-warm/70 flex items-start gap-2 h-full">
              <div className="w-8 h-8 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-icon-18">verified</span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">100% Commercial Plates</h3>
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
                <h3 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Speed Governed</h3>
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
                <h3 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Clean, Sanitized Cabins</h3>
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
                <h3 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Official Tax Invoice</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Instant tax invoice for corporate &amp; family travel.
                </p>
              </div>
            </div>
          </div>

          {/* High-Intent Fleet & Group Rental Architecture (Phase 17) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            <div className="p-space-lg rounded-xl bg-surface border border-border-warm/60 shadow-xs flex flex-col gap-2">
              <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
                Hire Innova Crysta, Ertiga, or Tempo Traveller in Agra for Family Tours
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Traveling with a large family group or corporate team requires unmatched comfort and ample luggage space. At <strong className="text-on-surface font-semibold">Agra SK Baghel Tour and Travels</strong>, we manage a diverse, well-maintained commercial fleet tailored specifically to your group size.
              </p>
            </div>
            <div className="p-space-lg rounded-xl bg-surface border border-border-warm/60 shadow-xs flex flex-col gap-2">
              <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
                Choose Your Perfect Vehicle Tier
              </h2>
              <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-1.5">
                <p>Select from our widely requested vehicle configurations:</p>
                <ul className="space-y-1 text-on-surface text-sm">
                  <li>• <strong className="text-primary font-semibold">Executive SUVs:</strong> Enjoy premium comfort with an elite <strong className="font-semibold">innova crysta rental in agra</strong>, ideal for corporate travelers or small families of 6–7 passengers.</li>
                  <li>• <strong className="text-primary font-semibold">Value Multi-Purpose Vehicles:</strong> Access an economical <strong className="font-semibold">ertiga taxi booking agra</strong> option for smart group travel without compromising on air-conditioned space.</li>
                  <li>• <strong className="text-primary font-semibold">Minivans &amp; Group Coaches:</strong> Secure spacious luxury configurations through our premium <strong className="font-semibold">tempo traveller booking agra</strong> options (9, 12, 16, and up to 26-seater varieties).</li>
                  <li>• <strong className="text-primary font-semibold">Special Occasions:</strong> Premium <strong className="font-semibold">luxury car rental for wedding in agra</strong> requirements to make your celebrations memorable.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTERS */}
      <section className="w-full bg-surface border-b border-border-warm/60 py-4 sticky top-20 z-30 backdrop-blur-md bg-surface/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Vehicles" },
            { id: "sedan", label: "Sedan" },
            { id: "suv", label: "SUV" },
            { id: "luxury", label: "Luxury" },
            { id: "tempo_traveller", label: "Tempo Traveller" },
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
          {loading ? (
            <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading fleet showroom">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl shadow-xs border border-border-warm/70 p-6 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[260px]"
                >
                  <div className="lg:col-span-5 bg-surface-container-high rounded-lg min-h-[200px]" />
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    <div>
                      <div className="h-6 w-1/3 bg-surface-container-high rounded mb-3" />
                      <div className="h-4 w-3/4 bg-surface-container-high rounded mb-4" />
                      <div className="h-16 bg-surface-container-low rounded-lg mb-4" />
                    </div>
                    <div className="h-8 w-1/2 bg-surface-container-high rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-surface-container-lowest border border-border-warm/60 max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sandstone-wash text-primary flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-icon-24">directions_car</span>
              </div>
              <h3 className="font-headline-md text-base text-ink-charcoal font-bold mb-1">
                Active Fleet Verification Under Update
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant max-w-md mx-auto mb-4 leading-relaxed">
                {loadError || "Vehicle availability and live kilometer tariffs are undergoing synchronization with our Taj Ganj dispatch desk. Contact dispatch for immediate cab reservation."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    fetchLiveFleet()
                      .then((data) => {
                        if (data && data.length > 0) {
                          setLiveFleet(data);
                          setLoadError(null);
                        } else {
                          setLiveFleet([]);
                          setLoadError("No active vehicles returned.");
                        }
                      })
                      .catch(() => setLoadError("Unable to load dispatch fleet."))
                      .finally(() => setLoading(false));
                  }}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold font-label-caps transition-colors"
                >
                  Retry Verification
                </button>
                <a
                  href="https://wa.me/919762817598?text=Hello%20Agra%20SK%20Baghel%20Desk%2C%20I%20would%20like%20to%20check%20cab%20availability."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold font-label-caps hover:bg-primary-container transition-colors"
                >
                  <span>Inquire via WhatsApp Desk</span>
                  <span className="material-symbols-outlined text-icon-14">arrow_forward</span>
                </a>
              </div>
            </div>
          ) : (
            filteredVehicles.map((veh) => (
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
                        {veh.rates.outstationPerKm ? (
                          <>
                            <span className="font-price-display text-base sm:text-lg text-terracotta-sandstone font-bold">
                              ₹{veh.rates.outstationPerKm}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">/ km</span>
                          </>
                        ) : (
                          <span className="font-body-sm text-label-md text-terracotta-sandstone font-semibold">
                            On request
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-surface-container-high/40 rounded py-0.5 px-1 sm:border-x sm:border-border-warm/40">
                      <span className="block font-label-caps text-label-caps text-secondary uppercase font-semibold">
                        8h/80Km Local
                      </span>
                      {veh.rates.local8h80km ? (
                        <span className="block font-price-display text-base text-ink-charcoal font-bold mt-0.5">
                          ₹{veh.rates.local8h80km.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="block font-body-sm text-label-md text-ink-charcoal font-semibold mt-0.5">
                          On request
                        </span>
                      )}
                      <span className="block font-body-sm text-label-caps text-on-surface-variant">Standard Day</span>
                    </div>
                    <div className="py-0.5">
                      <span className="block font-label-caps text-label-caps text-secondary uppercase font-semibold">
                        Full Day Agra
                      </span>
                      {veh.rates.fullDayYamuna ? (
                        <span className="block font-price-display text-base text-ink-charcoal font-bold mt-0.5">
                          ₹{veh.rates.fullDayYamuna.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="block font-body-sm text-label-md text-ink-charcoal font-semibold mt-0.5">
                          On request
                        </span>
                      )}
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
                      href={`/book.html?category=outstation&car=${veh.id}`}
                    >
                      <span>Book {veh.name.split(" ")[0]}</span>
                      <span className="material-symbols-outlined text-icon-15">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>

      {/* 3B. EXTENDED FLEET GALLERY & BESPOKE MODELS */}
      <section className="w-full bg-sandstone-wash/20 py-10 sm:py-space-xl border-t border-border-warm/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-label-caps text-body-sm text-terracotta-sandstone uppercase tracking-widest font-bold block mb-1">
                COMPREHENSIVE MODEL LINEUP
              </span>
              <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal font-semibold">
                Available Makes &amp; Custom Models
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
                Explore our full spectrum of specialized cars available on advance reservation. From luxury sedans to full-size 4x4 SUVs, every car is chauffeur-driven and immaculately maintained.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all shrink-0 font-semibold active:scale-[0.98]"
              style={{ color: "#ffffff" }}
              href="https://wa.me/919762817598?text=Hello%2C%20I%20am%20inquiring%20about%20a%20specific%20vehicle%20model%20for%20my%20Agra%20tour."
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
              <span className="text-white font-semibold" style={{ color: "#ffffff" }}>Request Custom Model</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {EXTENDED_FLEET_SHOWCASE.map((item) => (
              <div
                key={item.name}
                className="bg-surface-container-lowest rounded-xl border border-border-warm/70 shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="relative h-44 bg-surface-container-low overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-bold font-label-caps uppercase tracking-wide">
                      {item.tier}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <h3 className="font-headline-md text-base font-semibold text-ink-charcoal mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">group</span>
                      <span>{item.capacity}</span>
                    </p>
                    <ul className="space-y-1 mb-2">
                      {item.features.map((feat, i) => (
                        <li key={i} className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-icon-12 text-success-jade shrink-0">check</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-3 pt-0">
                  <a
                    href={`https://wa.me/919762817598?text=Hello%20Desk%2C%20I%20would%20like%20to%20reserve%20a%20${encodeURIComponent(item.name)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal text-xs font-semibold font-label-caps transition-colors flex items-center justify-center gap-1.5 border border-border-warm/60"
                  >
                    <span>Reserve via Desk</span>
                    <span className="material-symbols-outlined text-icon-14">arrow_forward</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
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
                {fleet.map((v) => (
                  <tr key={v.id} className="hover:bg-sandstone-wash/20 transition-colors">
                    <td className="py-2.5 px-3.5 align-middle">
                      <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">{v.name}</span>
                      <span className="font-body-sm text-body-sm text-secondary font-normal">{v.classTag}</span>
                    </td>
                    <td className="py-2.5 px-3.5 align-middle text-on-surface-variant font-medium whitespace-nowrap">{v.specs.seats}</td>
                    <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">{v.specs.luggage}</td>
                    <td className="py-2.5 px-3.5 align-middle text-on-surface-variant">{v.specs.climate}</td>
                    <td className="py-2.5 px-3.5 align-middle font-bold text-terracotta-sandstone text-sm whitespace-nowrap">
                      {v.rates.outstationPerKm ? `₹${v.rates.outstationPerKm} / km` : "On request"}
                    </td>
                    <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                      <a
                        className="inline-block px-2.5 py-1 rounded bg-terracotta-deep hover:bg-terracotta-sunlit text-white font-label-caps text-body-sm tracking-wider transition-all shadow-xs font-bold"
                        href={`/book.html?category=outstation&car=${v.id}`}
                      >
                        Select {v.name.split(" ")[0]}
                      </a>
                    </td>
                  </tr>
                ))}
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
