import { useEffect, useState, useRef, useId } from "react";
import type { SupportedLanguage } from "../../config";
import { getApiBaseUrl } from "../../services/api";

export interface CanonicalFleetVehicle {
  id: string;
  make: string;
  modelName: string;
  displayName: string;
  groupCode: string;
  groupName: string;
  seats: number;
  bags: number;
  perKm: number | null;
  imageUrl: string | null;
  active: boolean;
}

export interface CanonicalFleetGroup {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  vehicles: CanonicalFleetVehicle[];
}

interface FleetSectionProps {
  language?: SupportedLanguage;
}

const FALLBACK_GROUPS: CanonicalFleetGroup[] = [
  {
    id: "g-sedan",
    code: "sedan",
    name: "Sedan",
    sortOrder: 1,
    vehicles: [
      {
        id: "m-dzire",
        make: "Maruti",
        modelName: "Dzire",
        displayName: "Maruti Dzire AC",
        groupCode: "sedan",
        groupName: "Sedan",
        seats: 4,
        bags: 2,
        perKm: 11,
        imageUrl: "/assets/fleet/sedan.webp",
        active: true,
      },
      {
        id: "m-amaze",
        make: "Honda",
        modelName: "Amaze",
        displayName: "Honda Amaze Sedan",
        groupCode: "sedan",
        groupName: "Sedan",
        seats: 4,
        bags: 2,
        perKm: 11,
        imageUrl: "/assets/fleet/honda-amaze-red-sedan-480.webp",
        active: true,
      },
      {
        id: "m-city",
        make: "Honda",
        modelName: "City",
        displayName: "Honda City",
        groupCode: "sedan",
        groupName: "Sedan",
        seats: 4,
        bags: 3,
        perKm: 13,
        imageUrl: "/assets/fleet/sedan.webp",
        active: true,
      },
      {
        id: "m-slavia",
        make: "Skoda",
        modelName: "Slavia",
        displayName: "Skoda Slavia (Executive)",
        groupCode: "sedan",
        groupName: "Sedan",
        seats: 4,
        bags: 3,
        perKm: 14,
        imageUrl: "/assets/fleet/skoda-slavia-montecarlo-480.webp",
        active: true,
      },
      {
        id: "m-ciaz",
        make: "Maruti",
        modelName: "Ciaz",
        displayName: "Maruti Ciaz (Executive Sedan)",
        groupCode: "sedan",
        groupName: "Sedan",
        seats: 4,
        bags: 3,
        perKm: 13,
        imageUrl: "/assets/fleet/toyota-belta-white-sedan-480.webp",
        active: true,
      },
    ],
  },
  {
    id: "g-suv",
    code: "suv",
    name: "SUV",
    sortOrder: 2,
    vehicles: [
      {
        id: "m-ertiga",
        make: "Maruti",
        modelName: "Ertiga",
        displayName: "Maruti Ertiga",
        groupCode: "suv",
        groupName: "SUV",
        seats: 6,
        bags: 3,
        perKm: 14,
        imageUrl: "/assets/fleet/ertiga.webp",
        active: true,
      },
      {
        id: "m-crysta",
        make: "Toyota",
        modelName: "Innova Crysta",
        displayName: "Innova Crysta",
        groupCode: "suv",
        groupName: "SUV",
        seats: 7,
        bags: 4,
        perKm: 18,
        imageUrl: "/assets/fleet/innova.webp",
        active: true,
      },
      {
        id: "m-fortuner",
        make: "Toyota",
        modelName: "Fortuner",
        displayName: "Toyota Fortuner 4x4",
        groupCode: "suv",
        groupName: "SUV",
        seats: 7,
        bags: 4,
        perKm: 28,
        imageUrl: "/assets/fleet/toyota-fortuner-black-suv-360x536.jpg",
        active: true,
      },
      {
        id: "m-creta",
        make: "Hyundai",
        modelName: "Creta",
        displayName: "Hyundai Creta",
        groupCode: "suv",
        groupName: "SUV",
        seats: 5,
        bags: 3,
        perKm: 15,
        imageUrl: "/assets/fleet/hyundai-creta-white-suv-921x519.jpg",
        active: true,
      },
      {
        id: "m-brezza",
        make: "Maruti",
        modelName: "Brezza",
        displayName: "Maruti Brezza",
        groupCode: "suv",
        groupName: "SUV",
        seats: 5,
        bags: 3,
        perKm: 13,
        imageUrl: "/assets/fleet/maruti-brezza-red-compact-suv-1260x564.png",
        active: true,
      },
      {
        id: "m-xuv700",
        make: "Mahindra",
        modelName: "XUV700",
        displayName: "Mahindra XUV700",
        groupCode: "suv",
        groupName: "SUV",
        seats: 6,
        bags: 3,
        perKm: 18,
        imageUrl: "/assets/fleet/mahindra-xuv700-blue-suv-360x536.jpg",
        active: true,
      },
    ],
  },
  {
    id: "g-luxury",
    code: "luxury",
    name: "Luxury",
    sortOrder: 3,
    vehicles: [
      {
        id: "m-camry",
        make: "Toyota",
        modelName: "Camry",
        displayName: "Toyota Camry Hybrid",
        groupCode: "luxury",
        groupName: "Luxury",
        seats: 4,
        bags: 3,
        perKm: 40,
        imageUrl: "/assets/fleet/toyota-camry-hybrid-executive-luxury-360x536.jpg",
        active: true,
      },
      {
        id: "m-vellfire",
        make: "Toyota",
        modelName: "Vellfire",
        displayName: "Toyota Vellfire VIP Lounge",
        groupCode: "luxury",
        groupName: "Luxury",
        seats: 6,
        bags: 4,
        perKm: 45,
        imageUrl: "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg",
        active: true,
      },
    ],
  },
  {
    id: "g-tempo",
    code: "tempo_traveller",
    name: "Tempo Traveller",
    sortOrder: 4,
    vehicles: [
      {
        id: "m-traveller12",
        make: "Force",
        modelName: "Traveller 12",
        displayName: "Force Traveller 12-seater",
        groupCode: "tempo_traveller",
        groupName: "Tempo Traveller",
        seats: 12,
        bags: 10,
        perKm: 25,
        imageUrl: "/assets/fleet/tempo.webp",
        active: true,
      },
      {
        id: "m-traveller17",
        make: "Force",
        modelName: "Traveller 17",
        displayName: "Force Traveller 17-seater",
        groupCode: "tempo_traveller",
        groupName: "Tempo Traveller",
        seats: 17,
        bags: 12,
        perKm: 28,
        imageUrl: "/assets/fleet/tempo.webp",
        active: true,
      },
      {
        id: "m-urbania13",
        make: "Force",
        modelName: "Urbania 13",
        displayName: "Force Urbania 13-seater",
        groupCode: "tempo_traveller",
        groupName: "Tempo Traveller",
        seats: 13,
        bags: 10,
        perKm: 34,
        imageUrl: "/assets/fleet/urbania.webp",
        active: true,
      },
    ],
  },
];

const LOCAL_ASSET_MAP: Record<string, string> = {
  dzire: "/assets/fleet/sedan-480.webp",
  amaze: "/assets/fleet/honda-amaze-red-sedan-480.webp",
  city: "/assets/fleet/sedan-480.webp",
  ciaz: "/assets/fleet/toyota-belta-white-sedan-480.webp",
  belta: "/assets/fleet/toyota-belta-white-sedan-480.webp",
  slavia: "/assets/fleet/skoda-slavia-montecarlo-480.webp",
  sedan: "/assets/fleet/sedan-480.webp",
  ertiga: "/assets/fleet/ertiga-480.webp",
  crysta: "/assets/fleet/innova-480.webp",
  "innova crysta": "/assets/fleet/innova-480.webp",
  fortuner: "/assets/fleet/toyota-fortuner-black-suv-360x536.jpg",
  creta: "/assets/fleet/hyundai-creta-white-suv-921x519.jpg",
  brezza: "/assets/fleet/maruti-brezza-red-compact-suv-1260x564.png",
  punch: "/assets/fleet/tata-punch-blue-suv-1260x564.png",
  nexon: "/assets/fleet/tata-nexon-fearless-green-suv-1260x564.png",
  elevate: "/assets/fleet/honda-elevate-black-suv-front-930x620.jpg",
  glanza: "/assets/fleet/toyota-glanza-red-hatchback-studio-1537x1023.png",
  swift: "/assets/fleet/maruti-swift-red-hatchback-angle-360x536.jpg",
  wagonr: "/assets/fleet/maruti-wagonr-red-hatchback-360x536.jpg",
  xuv700: "/assets/fleet/mahindra-xuv700-blue-suv-360x536.jpg",
  "xuv 3xo": "/assets/fleet/mahindra-xuv-3xo-red-compact-suv-360x536.jpg",
  "xuv3xo": "/assets/fleet/mahindra-xuv-3xo-red-compact-suv-360x536.jpg",
  hector: "/assets/fleet/mg-hector-plus-black-suv-480x360.webp",
  "hector plus": "/assets/fleet/mg-hector-plus-black-suv-480x360.webp",
  camry: "/assets/fleet/toyota-camry-hybrid-executive-luxury-360x536.jpg",
  vellfire: "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg",
  "traveller 12": "/assets/fleet/tempo-480.webp",
  "traveller 17": "/assets/fleet/tempo-480.webp",
  urbania: "/assets/fleet/urbania-480.webp",
  "urbania 13": "/assets/fleet/urbania-480.webp",
};

function resolveVehicleImage(v: CanonicalFleetVehicle): string {
  if (v.imageUrl && v.imageUrl.startsWith("http")) return v.imageUrl;
  const nameKey = v.modelName?.toLowerCase().trim() || "";
  const displayKey = v.displayName?.toLowerCase().trim() || "";
  for (const [key, path] of Object.entries(LOCAL_ASSET_MAP)) {
    if (nameKey.includes(key) || displayKey.includes(key)) return path;
  }
  if (v.groupCode === "tempo_traveller") return "/assets/fleet/tempo-480.webp";
  if (v.groupCode === "suv") return "/assets/fleet/ertiga-480.webp";
  if (v.groupCode === "luxury") return "/assets/fleet/toyota-vellfire-ultra-luxury-mpv-360x536.jpg";
  return "/assets/fleet/sedan-480.webp";
}

export function FleetSection({ language = "en" }: FleetSectionProps) {
  const [groups, setGroups] = useState<CanonicalFleetGroup[]>(FALLBACK_GROUPS);
  const [activeGroupCode, setActiveGroupCode] = useState<string>("sedan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  async function loadFleet() {
    if (groups.length === 0) setLoading(true);
    setError(false);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/fleet`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Failed to fetch fleet");
      const json = await res.json();
      const payload = json?.data ?? json;

      const resolveFleetImageUrl = (url?: string | null) => {
        if (!url || !url.trim()) return null;
        const trimmed = url.trim();
        if (trimmed.startsWith("/api/")) return `${apiBase}${trimmed}`;
        return trimmed;
      };

      if (Array.isArray(payload?.groups) && payload.groups.length > 0) {
        const mappedGroups: CanonicalFleetGroup[] = payload.groups.map((g: any) => ({
          id: String(g.id || g.code),
          code: String(g.code),
          name: String(g.name),
          sortOrder: Number(g.sortOrder ?? g.sort_order ?? 0),
          vehicles: (Array.isArray(g.vehicles) ? g.vehicles : [])
            .filter((v: any) => v && v.active !== false)
            .map((v: any) => ({
              id: String(v.id || v.modelName),
              make: String(v.make || ""),
              modelName: String(v.modelName || v.model_name || ""),
              displayName: String(v.displayName || v.display_name || v.modelName || "Executive Cab"),
              groupCode: String(g.code),
              groupName: String(g.name),
              seats: Number(v.seats || v.passenger_capacity || 4),
              bags: Number(v.bags || v.luggage_capacity || 2),
              perKm: v.perKm != null && Number(v.perKm) > 0 ? Number(v.perKm) : null,
              imageUrl: resolveFleetImageUrl(v.imageUrl || v.image_url),
              active: true,
            })),
        }));
        setGroups(mappedGroups);
        if (mappedGroups.length > 0) {
          setActiveGroupCode(mappedGroups[0].code);
        }
      } else {
        setGroups(FALLBACK_GROUPS);
      }
    } catch {
      setGroups(FALLBACK_GROUPS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFleet();
  }, []);

  const activeGroup = groups.find((g) => g.code === activeGroupCode) ?? groups[0] ?? FALLBACK_GROUPS[0];
  const activeVehicles = activeGroup?.vehicles || [];

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };
  const scrollRight = () => {
    sliderRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section
      id="fleet"
      className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin"
      aria-labelledby={headingId}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
        <div>
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">
            Verified Fleet
          </span>
          <h2 id={headingId} className="font-headline-lg text-headline-lg text-on-surface">
            Choose your vehicle
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-xl">
            Commercial tourist permits, verified chauffeurs, and transparent billing. Switch vehicle categories below to view live models and rates.
          </p>
        </div>
        <a
          href="/en/fleet/"
          className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors shrink-0"
        >
          <span>Full fleet overview</span>
          <span className="material-symbols-outlined text-icon-16">east</span>
        </a>
      </div>

      {/* Group Navigation Tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6 border-b border-border-warm/40"
        role="tablist"
        aria-label="Vehicle category"
      >
        {(groups.length > 0 ? groups : FALLBACK_GROUPS).map((group) => {
          const isActive = group.code === activeGroupCode;
          return (
            <button
              key={group.code}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`fleet-panel-${group.code}`}
              id={`fleet-tab-${group.code}`}
              onClick={() => setActiveGroupCode(group.code)}
              className={`px-5 py-2.5 rounded-full font-label-md text-sm font-bold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary"
              }`}
            >
              {group.name}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Showcase Panel */}
      <div
        role="tabpanel"
        id={`fleet-panel-${activeGroupCode}`}
        aria-labelledby={`fleet-tab-${activeGroupCode}`}
        className="relative"
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl h-80 border border-border-warm/30 p-4">
                <div className="w-full h-44 bg-surface-container rounded-lg mb-4" />
                <div className="h-5 bg-surface-container rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface-container rounded w-1/2 mb-4" />
                <div className="h-10 bg-surface-container rounded w-full mt-auto" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-surface-container-low rounded-2xl p-6 border border-border-warm/40">
            <p className="text-on-surface font-semibold text-lg mb-2">Could not refresh live fleet inventory</p>
            <p className="text-on-surface-variant text-sm mb-4">Please check your internet connection or try again.</p>
            <button
              type="button"
              onClick={loadFleet}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold cursor-pointer hover:bg-primary-container"
            >
              Retry
            </button>
          </div>
        ) : activeVehicles.length === 0 ? (
          <div className="py-12 text-center bg-surface-container-low rounded-2xl p-6 border border-border-warm/40">
            <p className="text-on-surface-variant text-base">
              No active vehicle models currently published under this group. Contact our travel desk for custom requests.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Carousel navigation buttons */}
            <div className="hidden sm:flex items-center justify-end gap-2 mb-3">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Previous vehicles"
                className="w-9 h-9 rounded-full border border-border-warm/60 bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Next vehicles"
                className="w-9 h-9 rounded-full border border-border-warm/60 bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Slider track with mobile snap scroll */}
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0"
            >
              {activeVehicles.map((vehicle) => {
                const img = resolveVehicleImage(vehicle);
                const displayRate = vehicle.perKm != null && vehicle.perKm > 0 ? `₹${vehicle.perKm}/km` : "On request";

                return (
                  <div
                    key={vehicle.id}
                    className="min-w-[280px] sm:min-w-0 snap-start bg-surface-container-lowest rounded-2xl overflow-hidden border border-border-warm/50 flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 shadow-xs"
                  >
                    {/* Photo with aspect-ratio container */}
                    <div className="h-44 w-full overflow-hidden relative bg-surface-container-low">
                      <picture>
                        {img.endsWith("-480.webp") ? (
                          <source type="image/avif" srcSet={img.replace(/\.webp$/, ".avif")} />
                        ) : null}
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={img}
                          width={384}
                          height={176}
                          loading="lazy"
                          decoding="async"
                          alt={vehicle.displayName}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/assets/fleet/sedan-480.webp";
                          }}
                        />
                      </picture>
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded-full bg-ink-midnight/80 backdrop-blur-md text-white font-label-caps text-xs uppercase font-bold tracking-wider">
                          {activeGroup.name}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Vehicle details */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-title-md text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                            {vehicle.displayName}
                          </h3>
                        </div>
                        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                          {vehicle.make} • Commercial Tourist Permit
                        </p>
                      </div>

                      {/* Specs pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant py-2 border-y border-border-warm/40">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                          {vehicle.seats} Passengers
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">luggage</span>
                          {vehicle.bags} Luggage Bags
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">ac_unit</span>
                          Chilled AC
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                          Live GPS Monitored
                        </span>
                      </div>

                      {/* Pricing and Action CTA */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider block font-semibold">
                            Outstation Rate
                          </span>
                          <span className="font-price-display text-base sm:text-lg font-bold text-primary">
                            {displayRate}
                          </span>
                        </div>
                        <a
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md text-xs font-bold transition-all shadow-xs active:scale-[0.98] inline-flex items-center justify-center gap-1"
                          href={`/book?category=outstation&car=${encodeURIComponent(vehicle.modelName.toLowerCase().replace(/\s+/g, "-"))}`}
                          aria-label={`Book Now: ${vehicle.displayName}`}
                        >
                          <span className="text-white">Book Now</span>
                          <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default FleetSection;
