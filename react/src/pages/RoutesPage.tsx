import { useState, useMemo, useEffect } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { InstantRouteCalculator } from "../components/routes/InstantRouteCalculator";
import { Pagination } from "../components/ui/Pagination";
import { loadRoutesManifest } from "../services/catalogManifest";
import { routes as staticCatalogRoutes, type Route as CatalogueRoute } from "../data/catalogue";
import { LatestRoutesSection } from "../templates/sections/LatestRoutesSection";

export interface RoutesPageProps {
  language?: SupportedLanguage;
}

export type RouteCategory = "expressway" | "golden-triangle" | "pilgrimage" | "heritage" | "local" | "tempo";

interface RouteItem {
  id: string;
  name: string;
  origin?: string;
  destination?: string;
  category: RouteCategory;
  categoryBadge: string;
  distanceKm: number;
  duration: string;
  highway: string;
  description: string;
  tollNote: string;
  stateTaxNote: string;
  pricingModel?: string;
  fares: {
    sedan: number;
    ertiga: number;
    crysta: number;
    tempo: number;
    urbania: number;
  };
}

interface ManifestRouteData {
  o: string;
  d: string;
  km: number;
  m: number;
  fs: number;
  fe: number;
  fi: number;
  ft: number;
  fu: number;
  pm: "one-way" | "round-trip" | "local-tour" | "oneway" | "day120" | "tempo" | "tour" | "custom" | string;
  c: string;
  toll: 1 | 0;
}

function mapCatalogueRoute(item: CatalogueRoute): RouteItem {
  const isLocal = (item as any).kind === "local" || (item as any).kind === "local-tour" || item.pricingModel === "day120" || item.pricingModel === "12hr-120km" || item.pricingModel === "8hr-80km";
  const isTempo = item.pricingModel === "tempo";
  let category: RouteCategory = "expressway";
  const cLower = (item.corridor || "").toLowerCase();
  if (cLower.includes("expressway") || cLower.includes("delhi") || cLower.includes("gurgaon") || cLower.includes("noida")) {
    category = "expressway";
  } else if (cLower.includes("jaipur") || cLower.includes("golden") || cLower.includes("rajasthan")) {
    category = "golden-triangle";
  } else if (cLower.includes("mathura") || cLower.includes("vrindavan") || cLower.includes("haridwar") || cLower.includes("ayodhya") || cLower.includes("ganga")) {
    category = "pilgrimage";
  } else if (cLower.includes("lucknow") || cLower.includes("gwalior") || cLower.includes("heritage")) {
    category = "heritage";
  } else if (isLocal) {
    category = "local";
  } else if (isTempo) {
    category = "tempo";
  }

  const origin = item.origin || (item.from ? item.from.replace(/-/g, " ") : "Agra");
  const destination = item.destination || (item.to ? item.to.replace(/-/g, " ") : "Outstation");

  return {
    id: item.id,
    name: `${origin} → ${destination}`,
    origin,
    destination,
    category,
    categoryBadge: item.corridor ? item.corridor.replace("->", "→") : (isLocal ? "LOCAL 120KM PACKAGE" : "OUTSTATION CORRIDOR"),
    distanceKm: item.km > 0 ? item.km : 180,
    duration: item.duration || "4h 00m",
    highway: item.corridor || "Direct Highway Corridor",
    description: isLocal
      ? `Dedicated 120 km full-day local & outstation chauffeur service connecting ${origin} to ${destination}.`
      : isTempo
      ? `Spacious 9-26 seater Tempo Traveller & Force Urbania group rental connecting ${origin} to ${destination}.`
      : `Point-to-point AC outstation cab directly connecting ${origin} to ${destination} with transparent pricing.`,
    tollNote: item.toll === 1 ? "Highway tolls included in one-way fare" : "Tolls as per actuals",
    stateTaxNote: "Interstate commercial permits clear",
    pricingModel: item.pricingModel,
    fares: {
      sedan: Number(item.fares?.sedan ?? 0),
      ertiga: Number(item.fares?.ertiga ?? 0),
      crysta: Number(item.fares?.innova ?? 0),
      tempo: Number(item.fares?.tempo ?? 0),
      urbania: Number(item.fares?.urbania ?? 0),
    },
  };
}


const ROUTE_FAQS = [
  {
    q: "How does one-way outstation taxi billing work?",
    a: "One-way fares are fixed and point-to-point. You only pay for the journey from your pickup address in Agra to your destination drop address. There are zero empty return charges and zero dead-mileage billing.",
  },
  {
    q: "Are expressway tolls and state entry taxes included in the fare?",
    a: "Yes. All our published one-way fares are 100% all-inclusive. Yamuna Expressway tolls, FASTag deductions, and commercial border passenger entry permits (Delhi, Rajasthan, Haryana, MP) are covered with zero hidden surprises.",
  },
  {
    q: "What is the 300 km/day rule for outstation round-trips?",
    a: "For multi-day or round-trip journeys, outstation cabs operate on a standard minimum billing threshold of 300 km per calendar day. For example, a 2-day round-trip has a minimum billable distance of 600 km.",
  },
  {
    q: "Can the chauffeur pick us up directly from Agra Cantt railway station or our hotel?",
    a: "Absolutely. Chauffeurs provide complimentary doorstep pickup from any hotel, residence, Agra Cantt, Agra Fort, or Raja Ki Mandi railway station.",
  },
];

export function RoutesPage({ language = "en" }: RoutesPageProps) {
  const [manifest, setManifest] = useState<Record<string, ManifestRouteData> | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const page = Number(new URLSearchParams(window.location.search).get("page"));
      return page > 0 ? page : 1;
    }
    return 1;
  });
  const itemsPerPage = 12;

  useEffect(() => {
    let isMounted = true;
    loadRoutesManifest()
      .then((data) => {
        if (isMounted && data && Object.keys(data).length > 0) {
          setManifest(data as any);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const allRoutes = useMemo<RouteItem[]>(() => {
    if (!manifest) return staticCatalogRoutes.map(mapCatalogueRoute);
    return Object.entries(manifest).map(([slug, item]) => {
      const isLocal = item.pm === "day120";
      const isTempo = item.pm === "tempo";
      let category: RouteCategory = "expressway";
      const cLower = (item.c || "").toLowerCase();
      if (cLower.includes("expressway") || cLower.includes("delhi") || cLower.includes("gurgaon") || cLower.includes("noida")) {
        category = "expressway";
      } else if (cLower.includes("jaipur") || cLower.includes("golden") || cLower.includes("rajasthan")) {
        category = "golden-triangle";
      } else if (cLower.includes("mathura") || cLower.includes("vrindavan") || cLower.includes("haridwar") || cLower.includes("ayodhya") || cLower.includes("ganga")) {
        category = "pilgrimage";
      } else if (cLower.includes("lucknow") || cLower.includes("gwalior") || cLower.includes("heritage")) {
        category = "heritage";
      } else if (isLocal) {
        category = "local";
      } else if (isTempo) {
        category = "tempo";
      } else {
        category = "expressway";
      }

      const durationHrs = Math.floor(item.m / 60);
      const durationMins = item.m % 60;
      const durationStr = `${durationHrs}h${durationMins ? ` ${durationMins}m` : ""}`;
      const dist = item.km > 0 ? item.km : durationHrs * 55;

      return {
        id: slug,
        name: `${item.o} → ${item.d}`,
        origin: item.o,
        destination: item.d,
        category,
        categoryBadge: item.c ? item.c.replace("->", "→") : (isLocal ? "LOCAL 120KM PACKAGE" : "OUTSTATION CORRIDOR"),
        distanceKm: dist,
        duration: durationStr,
        highway: item.c.includes("->") ? item.c.replace("->", "⇄") : item.c || "Direct Highway Corridor",
        description: isLocal
          ? `Dedicated 120 km full-day local & outstation chauffeur service connecting ${item.o} to ${item.d}.`
          : isTempo
          ? `Spacious 9-26 seater Tempo Traveller & Force Urbania group rental connecting ${item.o} to ${item.d}.`
          : `Point-to-point AC outstation cab directly connecting ${item.o} to ${item.d} with transparent pricing.`,
        tollNote: item.toll === 1 ? "Highway tolls included in one-way fare" : "Tolls as per actuals",
        stateTaxNote: item.o.toLowerCase().includes("delhi") || item.d.toLowerCase().includes("delhi")
          ? "Delhi/Haryana state permit included"
          : item.o.toLowerCase().includes("jaipur") || item.d.toLowerCase().includes("jaipur")
          ? "Rajasthan state entry tax included"
          : "Interstate commercial permits clear",
        pricingModel: item.pm,
        fares: {
          sedan: item.fs ?? 0,
          ertiga: item.fe ?? 0,
          crysta: item.fi ?? 0,
          tempo: item.ft > 100 ? item.ft : (dist > 0 && item.ft ? dist * item.ft : 0),
          urbania: item.fu > 100 ? item.fu : (dist > 0 && item.fu ? dist * item.fu : 0),
        },
      };
    });
  }, [manifest]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(newPage));
      window.history.pushState({}, "", url.toString());
      const section = document.getElementById("routes-directory");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const latestRoutesProp = useMemo(() => {
    return allRoutes.slice(0, 3).map((r) => ({
      slug: r.id,
      sourceCity: r.origin,
      destinationCity: r.destination,
      distanceKm: r.distanceKm,
      durationText: r.duration,
      faresInr: {
        sedan: r.fares.sedan,
        ertiga: r.fares.ertiga,
        innova: r.fares.crysta,
      },
      tripType: r.pricingModel || "one-way",
      isPublished: true,
    }));
  }, [allRoutes]);

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRoutes.filter((route) => {
      const matchesFilter =
        selectedFilter === "all" ||
        route.category === selectedFilter ||
        (selectedFilter === "local" && route.pricingModel === "day120") ||
        (selectedFilter === "tempo" && route.pricingModel === "tempo");
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        route.name.toLowerCase().includes(q) ||
        (route.origin && route.origin.toLowerCase().includes(q)) ||
        (route.destination && route.destination.toLowerCase().includes(q)) ||
        route.categoryBadge.toLowerCase().includes(q) ||
        route.highway.toLowerCase().includes(q) ||
        route.description.toLowerCase().includes(q)
      );
    });
  }, [allRoutes, selectedFilter, searchQuery]);

  const paginatedRoutes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRoutes.slice(start, start + itemsPerPage);
  }, [filteredRoutes, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. BREADCRUMBS & EDITORIAL HERO */}
      <section className="relative w-full bg-surface py-space-xl lg:py-space-2xl overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin relative z-10">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-caps text-xs uppercase tracking-wider mb-space-md">
            <a className="hover:text-primary transition-colors" href="/">
              Home
            </a>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span className="text-primary font-bold">Routes &amp; Outstation Corridors</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end mb-space-xl">
            <div className="lg:col-span-8">
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight max-w-3xl">
                Point-to-point intercity cabs.{" "}
                <span className="italic font-normal text-terracotta-sandstone">Zero hidden return fares.</span>
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Transparent one-way and round-trip chauffeurs connecting Agra directly to Delhi NCR, Jaipur, Mathura, Gwalior,
                Lucknow, and Rajasthan circuits. Every fare includes toll clearance options, verified commercial drivers.
              </p>
            </div>
          </div>

          {/* Trust Stats Strip (Compact -20%) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-surface-container shadow-xs mb-space-lg border border-border-warm/50">
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-icon-18">signpost</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-title-lg text-ink-charcoal font-bold">{allRoutes.length} Corridors</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Verified Intercity Drops</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-success-jade shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-icon-18">verified_user</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-title-lg text-ink-charcoal font-bold">100% Fastag</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">&amp; Toll Clarity</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-gold-accent shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-icon-18">speed</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-title-lg text-ink-charcoal font-bold">300 KM/Day</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Round-Trip Baseline</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-terracotta-sunlit shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-icon-18">money_off</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-title-lg text-ink-charcoal font-bold">Zero Empty</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Return Surcharges</div>
              </div>
            </div>
          </div>

          {/* 0ms In-Memory Route Calculator across all 982 corridors */}
          <InstantRouteCalculator className="mb-space-xl" />

          {/* Latest Published Routes Showcase */}
          {selectedFilter === "all" && !searchQuery && currentPage === 1 && latestRoutesProp.length > 0 && (
            <div className="mb-space-xl -mx-margin-mobile lg:-mx-margin">
              <LatestRoutesSection routes={latestRoutesProp} />
            </div>
          )}

          {/* Search & Filter Bar (Compact -20%) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-space-md">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: `All Corridors (${allRoutes.length})` },
                { id: "expressway", label: "Expressway & NCR" },
                { id: "golden-triangle", label: "Jaipur & Rajasthan" },
                { id: "pilgrimage", label: "Mathura & Pilgrimage" },
                { id: "heritage", label: "Lucknow & Gwalior" },
                { id: "local", label: "Day Packages (120 KM)" },
                { id: "tempo", label: "Tempo Traveller" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full font-label-caps text-xs uppercase tracking-wider transition-all font-bold ${
                    selectedFilter === tab.id
                      ? "bg-ink-charcoal text-white shadow-xs"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-2 text-icon-16">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search corridor or city..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 text-on-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPREHENSIVE ROUTE DIRECTORY (CARDS -20% Compact) */}
      <section id="routes-directory" className="w-full bg-surface py-6 sm:py-8">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-on-surface-variant font-medium mb-4">
            <span>
              Showing <strong className="text-on-surface">{filteredRoutes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredRoutes.length)}</strong> of <strong className="text-on-surface">{filteredRoutes.length}</strong> verified corridors
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="text-primary hover:underline font-semibold text-xs"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {paginatedRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-surface-container-lowest rounded-xl p-3.5 sm:p-4.5 shadow-xs border border-border-warm/70 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-body-sm uppercase font-bold tracking-wider">
                      {route.categoryBadge}
                    </span>
                    <span className="font-label-caps text-body-sm text-on-surface-variant flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-icon-13 text-success-jade">check_circle</span>
                      {route.tollNote}
                    </span>
                  </div>

                  <h3 className="font-headline-md text-sm sm:text-base text-on-surface font-bold mb-1.5">
                    <a href={`/routes/${route.id}/`} className="hover:text-primary transition-colors">
                      {route.name}
                    </a>
                  </h3>

                  <div className="flex items-center gap-3 font-body-sm text-body-md text-on-surface-variant mb-2 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-icon-14 text-primary">pin_drop</span>
                      {route.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-icon-14 text-primary">schedule</span>
                      {route.duration}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-icon-14 text-primary">route</span>
                      {route.highway}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-md text-on-surface-variant mb-3 leading-relaxed">
                    {route.description}
                  </p>

                  {/* Fare Grid (5-column: Sedan, Ertiga, Innova, Tempo, Urbania) */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3 p-2 rounded-lg bg-surface-container-low border border-border-warm/40 text-center">
                    <div className="p-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase block font-semibold">Sedan</span>
                      <span className="font-price-display text-sm sm:text-base text-primary font-bold">
                        {route.fares.sedan > 0 ? `₹${route.fares.sedan.toLocaleString("en-IN")}` : "On request"}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase block font-semibold">Ertiga</span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        {route.fares.ertiga > 0 ? `₹${route.fares.ertiga.toLocaleString("en-IN")}` : "On request"}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase block font-semibold">Innova</span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        {route.fares.crysta > 0 ? `₹${route.fares.crysta.toLocaleString("en-IN")}` : "On request"}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase block font-semibold">
                        Tempo <span className="text-label-caps text-terracotta-sandstone font-normal">(RT)</span>
                      </span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        {route.fares.tempo > 0 ? `₹${route.fares.tempo.toLocaleString("en-IN")}` : "On request"}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase block font-semibold">
                        Urbania <span className="text-label-caps text-terracotta-sandstone font-normal">(RT)</span>
                      </span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        {route.fares.urbania > 0 ? `₹${route.fares.urbania.toLocaleString("en-IN")}` : "On request"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border-warm/60">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    {route.stateTaxNote}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-xs transition-colors font-semibold inline-flex items-center gap-1"
                      href={`/routes/${route.id}/`}
                    >
                      <span>Details</span>
                      <span className="material-symbols-outlined text-icon-13">info</span>
                    </a>
                    <a
                      className="px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-caps text-xs transition-colors font-bold inline-flex items-center gap-1.5 active:scale-[0.98]"
                      style={{ color: "#ffffff" }}
                      href={`https://wa.me/919762817598?text=Booking%20Route%20${encodeURIComponent(route.name)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 text-white" />
                      <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
                    </a>
                    <a
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-caps text-xs transition-all shadow-xs font-bold flex items-center gap-1"
                      href={`/book?category=outstation&from=${encodeURIComponent(route.origin || route.name.split("→")[0]?.trim() || "Agra")}&to=${encodeURIComponent(route.destination || route.name.split("→")[1]?.trim() || "")}&route=${encodeURIComponent(route.id)}`}
                    >
                      <span>Book Cab</span>
                      <span className="material-symbols-outlined text-icon-13">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {filteredRoutes.length > itemsPerPage && (
          <Pagination
            totalItems={filteredRoutes.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            className="mt-8"
            showFirstLastButtons={true}
            pageButtonLimit={5}
          />
        )}
      </section>

      {/* 2b. POINT-TO-POINT TRANSFERS & LOCAL SIGHTSEEING PACKAGES */}
      <section className="w-full bg-surface-container-low py-8 sm:py-10 border-t border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
                Fixed Rate Transfers &amp; City Charters
              </span>
              <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-semibold">
                Station Drops, Airport Transfers &amp; Local Sightseeing
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">
                Fixed transparent fares with zero surge pricing, verified chauffeurs, and complimentary delay tracking.
              </p>
            </div>
            <a
              href="/en/packages/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0"
            >
              <span>Explore All Tour Packages</span>
              <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <a
              href="/en/transfers/agc-station-drop/"
              className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-label-caps font-bold uppercase">
                    Railway Transfer
                  </span>
                  <span className="text-body-sm text-primary font-bold">From ₹800</span>
                </div>
                <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                  Agra Cantt Station (AGC) Drop/Pickup
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Doorstep hotel drop or pickup synchronized with Gatimaan &amp; Shatabdi train schedules.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                <span>~15–20 km</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Fares →
                </span>
              </div>
            </a>

            <a
              href="/en/transfers/delhi-igi-oneway/"
              className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-label-caps font-bold uppercase">
                    Airport Corridor
                  </span>
                  <span className="text-body-sm text-primary font-bold">From ₹3,499</span>
                </div>
                <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                  Delhi IGI Airport (DEL) Direct Transfer
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Direct express highway transfer via Yamuna Expressway with all tolls &amp; terminal parking included.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                <span>225 km Express</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Fares →
                </span>
              </div>
            </a>

            <a
              href="/en/transfers/kheria-airport/"
              className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-label-caps font-bold uppercase">
                    Airport Drop
                  </span>
                  <span className="text-body-sm text-primary font-bold">From ₹900</span>
                </div>
                <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                  Agra Airport (Kheria AGR) Transfer
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Smooth doorstep pickup and luggage assistance for commercial flight departures from Kheria.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                <span>~15–25 km</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Fares →
                </span>
              </div>
            </a>

            <a
              href="/en/local-packages/agra-standard-sightseeing/"
              className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-label-caps font-bold uppercase">
                    8 Hr / 80 KM
                  </span>
                  <span className="text-body-sm text-primary font-bold">From ₹1,900</span>
                </div>
                <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                  Agra Standard Sightseeing Charter
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Taj Mahal, Agra Fort, Mehtab Bagh &amp; Baby Taj with dedicated private AC car and verified chauffeur.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                <span>Full Day City Tour</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Details →
                </span>
              </div>
            </a>

            <a
              href="/en/local-packages/agra-extended-city-tour/"
              className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-label-caps font-bold uppercase">
                    12 Hr / 120 KM
                  </span>
                  <span className="text-body-sm text-primary font-bold">From ₹2,200</span>
                </div>
                <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                  Agra Extended Heritage &amp; Fatehpur Sikri
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Complete heritage circuit including Emperor Akbar's ghost citadel at Fatehpur Sikri &amp; Taj Mahal.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                <span>Extended Circuit</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Details →
                </span>
              </div>
            </a>

            <a
              href="/en/transfers/af-station-drop/"
              className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-label-caps font-bold uppercase">
                    Station Transfer
                  </span>
                  <span className="text-body-sm text-primary font-bold">From ₹800</span>
                </div>
                <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                  Agra Fort Railway Station (AF) Transfer
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Convenient doorstep cab transfers connecting Agra Fort railway station with local hotels &amp; monuments.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                <span>~12–15 km</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Fares →
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 3. OUTSTATION BILLING PRINCIPLES (Compact -20%) */}
      <section className="w-full bg-surface py-8 sm:py-10 border-t border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
              Transparent Commercial Billing
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              The 4 Rules of Outstation Pricing
            </h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              Every fare calculated by Agra SK Baghel Tour and Travels adheres to these strict principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-icon-22 mb-1.5">straighten</span>
              <h3 className="font-title-md text-xs sm:text-title-lg text-on-surface font-bold mb-1">300 km/Day Minimum</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant leading-relaxed">
                Standard outstation threshold applied to round-trips to ensure driver wages and highway vehicle upkeep are fairly compensated.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-icon-22 mb-1.5">toll</span>
              <h3 className="font-title-md text-xs sm:text-title-lg text-on-surface font-bold mb-1">All-Inclusive Tolls</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant leading-relaxed">
                Yamuna Expressway and national highway tolls are included upfront in one-way quotations with zero roadside toll haggling.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-icon-22 mb-1.5">bedtime</span>
              <h3 className="font-title-md text-xs sm:text-title-lg text-on-surface font-bold mb-1">Night Allowance</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant leading-relaxed">
                A fixed ₹300 allowance applies when the vehicle is driven between 10:00 PM and 6:00 AM to ensure chauffeur safety.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-icon-22 mb-1.5">savings</span>
              <h3 className="font-title-md text-xs sm:text-title-lg text-on-surface font-bold mb-1">28% Token Advance</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant leading-relaxed">
                Reserve your ride with just a 28% advance deposit via UPI or card. Pay the remaining 72% directly to the chauffeur at trip completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROUTE FAQS (Compact -20%) */}
      <section className="w-full bg-surface py-8 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
              Corridor Inquiries
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Route Questions
            </h2>
          </div>
          <div className="space-y-2.5">
            {ROUTE_FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
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
