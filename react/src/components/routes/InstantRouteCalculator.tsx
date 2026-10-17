import { useState, useEffect, useMemo, useCallback } from "react";
import { EDITORIAL_TYPOGRAPHY } from "../layout/EditorialPageTemplate";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { contact } from "../../data/contact";
import { getIndicativeBrowseFare } from "../../fares";
import { loadRoutesManifest } from "../../services/catalogManifest";
import { LocationCombobox } from "../search/LocationCombobox";
import { FLEETS } from "../../data/fleets";
import type { UiVehicleTier } from "../../data/fleets";
import type { LocationSuggestion } from "../../hooks/useLocationIQ";

export interface CompressedRouteItem {
  o: string;        // Origin
  d: string;        // Destination
  km: number;       // Distance in km (One-Way)
  m: number;        // Duration in minutes
  fs: number;       // Fare Sedan
  fe: number;       // Fare Ertiga / SUV
  fi: number;       // Fare Innova Crysta
  ft: number;       // Tempo Traveller Per-KM Rate
  fu: number;       // Force Urbania Per-KM Rate
  c: string;        // Travel Corridor
  toll: 1 | 0;      // Toll inclusion
}

/**
 * Vehicle tier for the route widget. Aliased to the canonical UI registry
 * (data/fleets.ts) — the 5 bookable fleets. There is no 6th "hatchback" tier.
 */
export type VehicleTier = UiVehicleTier;

export interface InstantRouteCalculatorProps {
  initialOrigin?: string;
  initialDestination?: string;
  onSelectRoute?: (slug: string, route: CompressedRouteItem) => void;
  className?: string;
}

function cleanCityName(raw: string): string {
  if (!raw) return "";
  const beforeParen = raw.split("(")[0]?.trim() || raw.trim();
  const firstSegment = beforeParen.split(",")[0]?.trim() || beforeParen;
  return firstSegment.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function InstantRouteCalculator({
  initialOrigin = "Agra",
  initialDestination = "Delhi",
  onSelectRoute,
  className = "",
}: InstantRouteCalculatorProps) {
  const [manifest, setManifest] = useState<Record<string, CompressedRouteItem> | null>(null);
  const [originInput, setOriginInput] = useState(initialOrigin);
  const [destInput, setDestInput] = useState(initialDestination);
  const [selectedTier, setSelectedTier] = useState<VehicleTier>("sedan");
  const [isLoading, setIsLoading] = useState(true);

  // Sync initial query params if present in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qFrom = params.get("from") || params.get("origin");
    const qTo = params.get("to") || params.get("destination") || params.get("dest");
    if (qFrom) setOriginInput(qFrom);
    if (qTo) setDestInput(qTo);
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadRoutesManifest()
      .then((data) => {
        if (isMounted) {
          setManifest(data as any);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const matchedEntry = useMemo(() => {
    if (!manifest) return null;
    const rawO = originInput.trim();
    const rawD = destInput.trim();
    if (!rawO || !rawD) return null;

    const cleanO = rawO.toLowerCase();
    const cleanD = rawD.toLowerCase();
    const normO = cleanCityName(rawO);
    const normD = cleanCityName(rawD);

    // 1. Exact match on raw names
    for (const [slug, item] of Object.entries(manifest)) {
      if (!item || typeof item.o !== "string" || typeof item.d !== "string") continue;
      if (item.o.toLowerCase() === cleanO && item.d.toLowerCase() === cleanD) return { slug, ...item };
    }
    // 2. Normalized city token match
    if (normO && normD) {
      for (const [slug, item] of Object.entries(manifest)) {
        if (!item || typeof item.o !== "string" || typeof item.d !== "string") continue;
        const itemNormO = cleanCityName(item.o);
        const itemNormD = cleanCityName(item.d);
        if (itemNormO === normO && itemNormD === normD) {
          return { slug, ...item };
        }
      }
    }
    // 3. Substring match
    for (const [slug, item] of Object.entries(manifest)) {
      if (!item || typeof item.o !== "string" || typeof item.d !== "string") continue;
      const itemOLower = item.o.toLowerCase();
      const itemDLower = item.d.toLowerCase();
      if (
        (itemOLower.includes(cleanO) || cleanO.includes(itemOLower) || (normO && itemOLower.includes(normO))) &&
        (itemDLower.includes(cleanD) || cleanD.includes(itemDLower) || (normD && itemDLower.includes(normD)))
      ) {
        return { slug, ...item };
      }
    }
    // 4. Fallback slug search
    const slugKey = `${normO || cleanO.replace(/\s+/g, "-")}-to-${normD || cleanD.replace(/\s+/g, "-")}`;
    for (const [slug, item] of Object.entries(manifest)) {
      if (typeof slug === "string" && slug.includes(slugKey)) {
        return { slug, ...item };
      }
    }
    return null;
  }, [manifest, originInput, destInput]);

  const applyRouteSelection = useCallback(
    (slug: string, item: CompressedRouteItem) => {
      const targetUrl = `/routes/${slug}/`;
      if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
        window.history.pushState({ slug, o: item.o, d: item.d }, "", targetUrl);
      }
      onSelectRoute?.(slug, item);
    },
    [onSelectRoute]
  );

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.o && e.state.d) {
        setOriginInput(e.state.o);
        setDestInput(e.state.d);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Authoritative published route fare for the selected tier
  const activeFare = useMemo(() => {
    if (!matchedEntry) return null;
    switch (selectedTier) {
      case "sedan": return matchedEntry.fs;
      case "ertiga": return matchedEntry.fe;
      case "innova": return matchedEntry.fi;
      case "tempo": return matchedEntry.ft;
      case "urbania": return matchedEntry.fu;
      default: return matchedEntry.fs;
    }
  }, [matchedEntry, selectedTier]);

  const hasSearchedPair = Boolean(originInput.trim() && destInput.trim());

  return (
    <div
      className={`w-full bg-surface-container-lowest border border-border-warm rounded-xl p-space-md lg:p-space-lg shadow-[0_4px_24px_-4px_rgba(24,29,39,0.06)] ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md border-b border-border-warm pb-space-sm">
        <div>
          <span className={EDITORIAL_TYPOGRAPHY.eyebrowSandstone}>LocationIQ Search &amp; 0ms Corridor Engine</span>
          <h3 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} mt-0.5`}>Instant Outstation Route &amp; Fare Discovery</h3>
        </div>
        <div className="flex items-center gap-1.5 font-body-sm text-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-success-jade animate-pulse" />
          <span className="font-semibold text-ink-slate">Live Published Corridors</span>
        </div>
      </div>

      {/* LocationIQ Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">
        <div>
          <label className="block font-label-lg text-xs font-bold text-ink-slate mb-1">
            Pickup Origin City / Airport
          </label>
          <LocationCombobox
            id="instant-calc-origin"
            value={originInput}
            onChange={(val) => setOriginInput(val)}
            placeholder="Search pickup city, airport, landmark..."
            label="Pickup Origin"
            triggerIcon="trip_origin"
          />
        </div>
        <div>
          <label className="block font-label-lg text-xs font-bold text-ink-slate mb-1">
            Drop-off Destination City / Hub
          </label>
          <LocationCombobox
            id="instant-calc-dest"
            value={destInput}
            onChange={(val) => setDestInput(val)}
            placeholder="Search destination city, airport, landmark..."
            label="Drop-off Destination"
            triggerIcon="pin_drop"
          />
        </div>
      </div>

      {/* Vehicle Tier Selector (5 Options — canonical fleet registry, see data/fleets.ts) */}
      <div className="mb-space-md">
        <label className="block font-label-lg text-xs font-bold text-ink-slate mb-1.5">Select Vehicle Class</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {FLEETS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                selectedTier === tier.id
                  ? "bg-primary-container text-on-primary-container border-primary font-semibold shadow-xs"
                  : "bg-surface hover:bg-surface-container text-on-surface border-border-warm"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="material-symbols-outlined text-icon-16 text-terracotta-sandstone">{tier.icon}</span>
                <span className="font-title-md text-xs font-bold leading-tight">{tier.label}</span>
              </div>
              <div className="font-body-sm text-label-md opacity-80 pl-5">{tier.seats}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Result Calculation Dock or Empty Fallback */}
      {matchedEntry ? (
        <div className="bg-sandstone-wash/80 border border-border-warm rounded-lg p-space-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-sm">
            <div>
              <div className="flex items-center gap-space-xs mb-1">
                <span className="font-title-lg text-title-lg text-ink-charcoal font-bold">
                  {matchedEntry.o} → {matchedEntry.d}
                </span>
                <span className="font-label-caps text-label-lg px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold uppercase">
                  {matchedEntry.c}
                </span>
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-medium text-ink-slate">
                  <span className="material-symbols-outlined text-icon-14 text-primary">add_road</span>
                  {matchedEntry.km} km (One-Way)
                </span>
                <span className="flex items-center gap-1 font-medium text-ink-slate">
                  <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">schedule</span>
                  {Math.floor(matchedEntry.m / 60)}h {matchedEntry.m % 60}m approx
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="block font-body-sm text-xs text-on-surface-variant">
                Published One-Way Tariff
              </span>
              <span className={EDITORIAL_TYPOGRAPHY.price}>
                {activeFare && activeFare > 0 ? `₹${activeFare.toLocaleString("en-IN")}` : "Server Quote on Request"}
              </span>
              <span className="block font-body-sm text-label-lg text-on-surface-variant mt-0.5 font-medium">
                {matchedEntry.toll === 1 ? "Expressway tolls included" : "Tolls as per actuals"}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 pt-space-xs border-t border-border-warm/60">
            <a
              href={`/routes/${matchedEntry.slug}/`}
              onClick={(e) => {
                e.preventDefault();
                applyRouteSelection(matchedEntry.slug, matchedEntry);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink-charcoal text-ivory-surface font-label-lg text-xs font-semibold hover:bg-ink-slate transition-colors"
              style={{ color: "#FDF8F5" }}
            >
              <span>View Route Details</span>
              <span className="material-symbols-outlined text-icon-14">arrow_forward</span>
            </a>
            <a
              href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello Agra SK Baghel Tour and Travels, I would like to book a ${selectedTier.toUpperCase()} for ${matchedEntry.o} to ${matchedEntry.d} (${matchedEntry.km} km).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black border border-white/15 text-white font-label-lg text-xs font-semibold hover:bg-neutral-900 transition-colors shadow-xs"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
              <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp Concierge</span>
            </a>
            <a
              href={`/book?category=outstation&from=${encodeURIComponent(matchedEntry.o)}&to=${encodeURIComponent(matchedEntry.d)}&vehicle=${selectedTier}&route=${encodeURIComponent(matchedEntry.slug)}`}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-primary text-white font-label-lg text-xs font-semibold hover:bg-primary-container transition-colors ml-auto shadow-xs active:scale-[0.98]"
            >
              <span>Direct Booking Form</span>
              <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            </a>
          </div>
        </div>
      ) : hasSearchedPair ? (
        <div className="p-space-lg text-center bg-surface-container-low rounded-xl border border-dashed border-border-warm flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-sandstone-wash text-terracotta-sandstone flex items-center justify-center mb-0.5">
            <span className="material-symbols-outlined text-icon-26">explore_off</span>
          </div>
          <h4 className="font-title-lg text-title-lg text-ink-charcoal font-bold">
            There is no route available, sorry.
          </h4>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            We could not find a scheduled direct corridor between <strong>{originInput}</strong> and <strong>{destInput}</strong> in our standard catalog. Our 24/7 operations desk can create a customized private charter quotation for you.
          </p>
          <a
            href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
              `Hello Agra SK Baghel Tour and Travels, I am looking for a custom route from ${originInput} to ${destInput}. Please provide availability and fare quotation.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ffffff" }}
            className="mt-space-sm inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-900 border border-white/10 shadow-xs active:scale-[0.98] transition-all"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
            <span className="text-white font-semibold" style={{ color: "#ffffff" }}>Request Custom Route via WhatsApp Concierge</span>
          </a>
        </div>
      ) : (
        <div className="p-space-md text-center font-body-sm text-xs text-on-surface-variant bg-surface rounded-lg border border-dashed border-border-warm">
          {isLoading ? "Loading routes manifest..." : "Select a pickup origin and destination drop city above to view live fares."}
        </div>
      )}
    </div>
  );
}
