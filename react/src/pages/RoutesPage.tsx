import { useState, useMemo, useEffect } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { InstantRouteCalculator } from "../components/routes/InstantRouteCalculator";
import { Pagination } from "../components/ui/Pagination";
import { loadRoutesManifest, fetchPublishedTransferRoutes, fetchPublishedLocalTransfers } from "../services/catalogManifest";
import generatedPublishedTransferRoutes from "../data/generated-published-transfer-routes.json";
import generatedPublishedLocalPackages from "../data/generated-published-local-packages.json";
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
  const [transferRoutes, setTransferRoutes] = useState<any[]>([]);
  const [localPackages, setLocalPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    setLoading(true);
    loadRoutesManifest()
      .then((data) => {
        if (!isMounted) return;
        if (data && Object.keys(data).length > 0) {
          setManifest(data as any);
          setLoadError(null);
        } else {
          setManifest({});
        }
      })
      .catch(() => {
        if (isMounted) {
          setManifest({});
          setLoadError("Unable to load live verified routes.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchPublishedTransferRoutes()
      .then((data) => {
        if (isMounted && data && data.length > 0) setTransferRoutes(data);
      })
      .catch(() => {});
    fetchPublishedLocalTransfers()
      .then((data) => {
        if (isMounted && data && data.length > 0) setLocalPackages(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const activeTransfers = useMemo(() => {
    const list = transferRoutes && transferRoutes.length > 0 ? transferRoutes : (generatedPublishedTransferRoutes as any[]);
    return list.slice(0, 3);
  }, [transferRoutes]);

  const activeLocalCharters = useMemo(() => {
    const list = localPackages && localPackages.length > 0 ? localPackages : (generatedPublishedLocalPackages as any[]);
    return list.slice(0, 3);
  }, [localPackages]);

  const allRoutes = useMemo<RouteItem[]>(() => {
    if (!manifest || Object.keys(manifest).length === 0) return [];
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
              {loading ? (
                <span>Loading verified published corridors...</span>
              ) : (
                <>Showing <strong className="text-on-surface">{filteredRoutes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredRoutes.length)}</strong> of <strong className="text-on-surface">{filteredRoutes.length}</strong> verified corridors</>
              )}
            </span>
            {searchQuery && !loading && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="text-primary hover:underline font-semibold text-xs"
              >
                Clear filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5" aria-busy="true" aria-label="Loading verified routes">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-border-warm/60 animate-pulse flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-5 w-24 bg-surface-container-high rounded" />
                      <div className="h-4 w-32 bg-surface-container-high rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-surface-container-high rounded mb-3" />
                    <div className="h-4 w-1/2 bg-surface-container-high rounded mb-4" />
                    <div className="h-14 bg-surface-container-low rounded-lg mb-4" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border-warm/40">
                    <div className="h-4 w-28 bg-surface-container-high rounded" />
                    <div className="h-8 w-24 bg-surface-container-high rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-surface-container-lowest border border-border-warm/60 max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sandstone-wash text-primary flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-icon-24">route</span>
              </div>
              <h3 className="font-headline-md text-base text-ink-charcoal font-bold mb-1">
                {searchQuery ? "No matching corridors found" : "No published routes available"}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant max-w-md mx-auto mb-4 leading-relaxed">
                {searchQuery
                  ? `We could not find any verified corridors matching "${searchQuery}". Clear your search query or switch corridor filter.`
                  : "Route manifest is undergoing synchronization with dispatch. For immediate point-to-point fares, contact dispatch directly."}
              </p>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSelectedFilter("all"); setCurrentPage(1); }}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold font-label-caps hover:bg-primary-container transition-colors"
                >
                  Reset Filters
                </button>
              ) : (
                <a
                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=Hello%20Agra%20SK%20Baghel%20Desk%2C%20I%20would%20like%20to%20inquire%20about%20a%20custom%20route.`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold font-label-caps hover:bg-primary-container transition-colors"
                >
                  <span>Inquire via WhatsApp Desk</span>
                  <span className="material-symbols-outlined text-icon-14">arrow_forward</span>
                </a>
              )}
            </div>
          ) : (
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
          )}
        </div>
        {!loading && filteredRoutes.length > itemsPerPage && (
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
            {activeTransfers.map((item: any) => {
              const slug = item.slug || item.routeCode || "";
              const startingFare = item.fleetPrices?.sedan || item.fleetPrices?.dzire || 800;
              const isAirport = (item.name || "").toLowerCase().includes("airport") || slug.includes("airport");
              return (
                <a
                  key={`transfer-${slug || item.id}`}
                  href={`/en/transfers/${slug}/`}
                  className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone text-label-caps font-bold uppercase">
                        {isAirport ? "Airport Corridor" : "Station Transfer"}
                      </span>
                      <span className="text-body-sm text-primary font-bold">From ₹{Number(startingFare).toLocaleString("en-IN")}</span>
                    </div>
                    <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                      {item.directionNote || "Doorstep hotel pickup or drop synchronized with flight & train arrivals."}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                    <span>{item.distanceText || "Direct Transfer"}</span>
                    <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Fares →
                    </span>
                  </div>
                </a>
              );
            })}

            {activeLocalCharters.map((pkg: any) => {
              const slug = pkg.slug || pkg.packageCode || "";
              const startingFare = pkg.fleetPrices?.sedan || pkg.fleetPrices?.dzire || 1900;
              const durationHours = pkg.durationHours || 8;
              const includedKm = pkg.includedKm || 80;
              return (
                <a
                  key={`charter-${slug || pkg.id}`}
                  href={`/en/local-packages/${slug}/`}
                  className="p-4 rounded-xl bg-surface-container-lowest border border-border-warm/70 shadow-2xs hover:shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-label-caps font-bold uppercase">
                        {durationHours} Hr / {includedKm} KM
                      </span>
                      <span className="text-body-sm text-primary font-bold">From ₹{Number(startingFare).toLocaleString("en-IN")}</span>
                    </div>
                    <h3 className="font-title-md text-sm font-bold text-ink-charcoal group-hover:text-primary transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                      {pkg.covers || pkg.description || "Comprehensive city tour with dedicated private AC car and verified chauffeur."}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-warm/30 flex items-center justify-between text-xs text-secondary font-medium">
                    <span>Sightseeing Charter</span>
                    <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Details →
                    </span>
                  </div>
                </a>
              );
            })}
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
