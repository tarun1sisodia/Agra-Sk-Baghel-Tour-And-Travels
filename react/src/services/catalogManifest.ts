import type { TourPackage } from "../data";
import { getApiBaseUrl } from "./api";
import { resolveCatalogMediaUrl } from "./catalog";
import generatedPublishedLocalPackages from "../data/generated-published-local-packages.json";
import generatedPublishedTransferRoutes from "../data/generated-published-transfer-routes.json";
import generatedPublishedTourPackages from "../data/generated-published-tour-packages.json";
import generatedCatalog from "../data/generated-catalog.json";
import { getFallbackPublishedCatalog } from "./cleanFareApi";

export interface CompressedRoute {
  o: string;              // Origin
  d: string;              // Destination
  km: number;             // Distance in km (One-Way)
  m: number;              // Duration in minutes
  fs: number;             // Fare Sedan (Dzire / Etios)
  fe: number;             // Fare Ertiga / SUV
  fi: number;             // Fare Innova Crysta
  ft: number;             // Tempo Traveller Fare
  fu: number;             // Force Urbania Fare
  pm: string;             // Pricing Model Flag
  c: string;              // Travel Corridor
  toll: 1 | 0;            // Toll inclusion: 1 = included, 0 = extra
}

export interface CatalogManifestData {
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
  routes: Record<string, CompressedRoute>;
  packages: TourPackage[];
  vehicles: readonly any[];
  etag?: string;
  isStale?: boolean;
}

interface CachedManifestEnvelope {
  etag?: string;
  cachedAt: number;
  data: CatalogManifestData;
}

const CACHE_STORAGE_KEY = "arena_catalog_manifest_v3";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes bounded TTL

let inMemoryManifest: CatalogManifestData | null = null;
let inMemoryManifestCachedAt = 0;
let fetchPromise: Promise<CatalogManifestData | null> | null = null;

export function invalidateCatalogManifestCache(): void {
  inMemoryManifest = null;
  inMemoryManifestCachedAt = 0;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch { }
  }
}

export async function fetchCatalogManifest(): Promise<CatalogManifestData | null> {
  if (inMemoryManifest && Date.now() - inMemoryManifestCachedAt < CACHE_TTL_MS) {
    return inMemoryManifest;
  }
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    // 1. In browser, check localStorage for cached manifest envelope
    let localEnvelope: CachedManifestEnvelope | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.data) {
            localEnvelope = parsed;
          } else if (parsed && parsed.routes) {
            localEnvelope = { cachedAt: 0, data: parsed };
          }
        }
      } catch {
        // LocalStorage blocked or quota error
      }
    }

    // 2. Try fetching latest manifest from backend authoritative endpoint with ETag
    try {
      const apiBase = getApiBaseUrl();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (localEnvelope?.etag) {
        headers["If-None-Match"] = localEnvelope.etag;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${apiBase}/api/v1/catalog/manifest`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle 304 Not Modified
      if (res.status === 304 && localEnvelope?.data) {
        inMemoryManifest = { ...localEnvelope.data, isStale: false };
        inMemoryManifestCachedAt = Date.now();
        try {
          window.localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify({ ...localEnvelope, cachedAt: Date.now() }),
          );
        } catch { }
        return inMemoryManifest;
      }

      if (res.ok) {
        const json = await res.json();
        const data = json?.data as CatalogManifestData;
        if (data && data.routes && typeof data.version === "number") {
          const etag = res.headers.get("etag") ?? undefined;
          data.etag = etag;
          data.isStale = false;
          inMemoryManifest = data;
          inMemoryManifestCachedAt = Date.now();
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(
                CACHE_STORAGE_KEY,
                JSON.stringify({ etag, cachedAt: Date.now(), data }),
              );
            } catch {
              // Ignore quota issues
            }
          }
          return inMemoryManifest;
        }
      }
    } catch {
      // API unreachable or timed out
    }

    // 3. Fallback to localStorage if available (mark stale if expired)
    if (localEnvelope?.data) {
      const isStale = Date.now() - localEnvelope.cachedAt > CACHE_TTL_MS;
      inMemoryManifest = {
        ...localEnvelope.data,
        isStale,
      };
      inMemoryManifestCachedAt = localEnvelope.cachedAt || Date.now();
      return inMemoryManifest;
    }

    // 4. Return null if remote API is unreachable and no cache exists
    return null;
  })().finally(() => {
    fetchPromise = null;
  });

  return fetchPromise;
}

export async function loadRoutesManifest(): Promise<Record<string, CompressedRoute>> {
  const manifest = await fetchCatalogManifest();
  if (manifest?.routes && Object.keys(manifest.routes).length > 0) {
    return manifest.routes;
  }
  const rawList = (generatedCatalog as any)?.routes;
  if (Array.isArray(rawList)) {
    const fallback: Record<string, CompressedRoute> = {};
    for (const item of rawList) {
      if (!item?.id) continue;
      fallback[item.id] = {
        o: item.origin || item.from || "",
        d: item.destination || item.to || "",
        km: Number(item.km) || 0,
        m: Number(item.durationMins) || 0,
        fs: item.fares?.sedan ?? null,
        fe: item.fares?.ertiga ?? null,
        fi: item.fares?.innova ?? null,
        ft: item.fares?.tempo ?? null,
        fu: item.fares?.urbania ?? null,
        pm: item.pricingModel || "oneway",
        c: item.corridor || "Direct Highway Corridor",
        toll: item.toll === 0 ? 0 : 1,
      };
    }
    return fallback;
  }
  return {};
}

export async function loadPublishedPackages(): Promise<TourPackage[]> {
  // 1. Live tour-packages manifest from Fastify API (Primary source of truth)
  try {
    const apiBase = getApiBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${apiBase}/api/v1/tour-packages/manifest`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      const published = items
        .filter((item: any) => !item.status || item.status === "published")
        .map((item: any) => toDossierTourPackage(item));
      if (published.length > 0) {
        return published;
      }
    }
  } catch {
    // API unavailable or network timeout; fall through to verified manifest snapshot
  }

  // 2. Verified manifest snapshot emitted during build
  try {
    const manifest = await fetchCatalogManifest();
    if (manifest?.packages && manifest.packages.length > 0) {
      return manifest.packages;
    }
  } catch {
    // Manifest snapshot unavailable
  }

  // 3. Fallback to generated-published-tour-packages
  return ((generatedPublishedTourPackages as any[]) || []).map(toDossierTourPackage);
}

export function toTourPackage(item: any): TourPackage {
  let fleetPrices: Record<string, number> = {};
  if (item.fleetPrices && typeof item.fleetPrices === "object") {
    fleetPrices = { ...item.fleetPrices };
  } else if (item.fleet_prices && typeof item.fleet_prices === "object") {
    fleetPrices = { ...item.fleet_prices };
  } else if (Array.isArray(item.upgrades)) {
    for (const u of item.upgrades) {
      if (u.vehId && typeof u.price === "number") {
        fleetPrices[u.vehId] = u.price;
      }
    }
  }

  const priceValues = Object.values(fleetPrices).filter((v) => typeof v === "number" && v > 0);
  const minFleetPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const startingPrice = Number(
    item.startingPriceInr ||
    item.starting_price_inr ||
    minFleetPrice ||
    item.from ||
    0
  );
  const slug = String(item.slug ?? item.packageCode ?? item.package_code ?? item.id);
  const inclusions = Array.isArray(item.inclusions) && item.inclusions.length > 0
    ? item.inclusions
    : [
      "Private AC vehicle & dedicated verified chauffeur",
      "All highway tolls & monument parking fees included",
      "Doorstep pickup & drop-off from hotel or station",
    ];
  const exclusions = Array.isArray(item.exclusions) && item.exclusions.length > 0
    ? item.exclusions
    : [
      "Monument entry tickets",
      "Meals & personal expenses",
    ];
  const source = item.source || "Agra";
  const destination = item.destination || item.name;

  const rawImage = item.imageUrl || item.image_url || item.image || (item.gallery?.[0]?.url || item.gallery?.[0]) || "";
  const image = rawImage ? resolveCatalogMediaUrl(rawImage) : "";
  console.log("[toTourPackage] Raw image URL:", rawImage, "-> Resolved:", image);

  const rawGallery = Array.isArray(item.gallery) ? item.gallery : [];
  console.log("[toTourPackage] Raw gallery:", rawGallery);
  const gallery = rawGallery
    .filter(Boolean)
    .map((g: any, i: number) => {
      if (typeof g === "string") {
        const resolved = resolveCatalogMediaUrl(g);
        console.log(`[toTourPackage] Gallery item ${i} (string):`, g, "->", resolved);
        return {
          url: resolved,
          alt: `${item.name || "Tour"} photo ${i + 1}`,
          caption: `${item.name || "Tour"} view ${i + 1}`,
        };
      }
      const resolved = resolveCatalogMediaUrl(g.url);
      console.log(`[toTourPackage] Gallery item ${i} (object):`, g.url, "->", resolved);
      return {
        url: resolved,
        alt: g.alt || `${item.name || "Tour"} photo ${i + 1}`,
        caption: g.caption || `${item.name || "Tour"} view ${i + 1}`,
      };
    });
  console.log("[toTourPackage] Processed gallery:", gallery);

  return {
    id: slug,
    slug,
    name: item.name,
    kicker: `${item.days ?? 1} Day${(item.days ?? 1) > 1 ? "s" : ""} Private Tour`,
    duration: item.durationText || `${item.days ?? 1} Day`,
    from: startingPrice,
    image,
    gallery: gallery.length > 0 ? gallery : [{ url: image, alt: item.name, caption: `${item.name} cover` }],
    source,
    destination,
    fleetPrices,
    days: item.days,
    nights: item.nights,
    places: [source, destination, "Heritage Sites"],
    blurb: item.inclusionsHighlight || "Private sanitized AC cab, dedicated verified chauffeur & monument sightseeing.",
    includes: inclusions,
    excludes: exclusions,
    itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
  };
}

export async function fetchTourPackageBySlug(slug: string): Promise<TourPackage | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  // 1. Check in loaded published packages
  try {
    const published = await loadPublishedPackages();
    const match = published.find((p) => p.slug === normalizedSlug || p.id === normalizedSlug);
    if (match) return match;
  } catch {
    // Continue
  }

  // 2. Fetch directly from Fastify API by-code endpoint
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/v1/tour-packages/by-code/${encodeURIComponent(normalizedSlug)}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        return toDossierTourPackage(json.data);
      }
    }
  } catch {
    // Continue
  }

  return null;
}

/** Fetch the current package tariff without the SSG/local manifest cache. */
export async function fetchLiveTourPackageBySlug(slug: string): Promise<TourPackage | null> {
  try {
    const apiBase = getApiBaseUrl();
    const url = `${apiBase}/api/v1/tour-packages/by-code/${encodeURIComponent(slug.trim().toLowerCase())}?live=${Date.now()}`;
    console.log("[fetchLiveTourPackageBySlug] Fetching from:", url);
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    console.log("[fetchLiveTourPackageBySlug] Response status:", res.status, res.statusText);
    if (!res.ok) {
      console.log("[fetchLiveTourPackageBySlug] Response not ok, returning null");
      return null;
    }
    const json = await res.json();
    console.log("[fetchLiveTourPackageBySlug] Raw API response:", json);
    const result = json?.data ? toDossierTourPackage(json.data) : null;
    console.log("[fetchLiveTourPackageBySlug] Processed result:", result);
    return result;
  } catch (err) {
    console.error("[fetchLiveTourPackageBySlug] Error:", err);
    return null;
  }
}

/** Canonical alias: fetchPublishedTourPackages */
export const fetchPublishedTourPackages = loadPublishedPackages;

/** Canonical alias: fetchPublishedRoutes */
export const fetchPublishedRoutes = loadRoutesManifest;

/** Compatibility alias for tour packages */
export const toDossierTourPackage = toTourPackage;

/** Fetch published airport and station transfer routes */
export async function fetchPublishedTransferRoutes(): Promise<any[]> {
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/v1/transfers`, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (items.length > 0) return items;
    }
  } catch {
    // Return empty on offline/static
  }
  return (generatedPublishedTransferRoutes as any[]) || [];
}

/** Fetch published local tours */
export async function fetchPublishedLocalTransfers(): Promise<any[]> {
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/v1/local-tours`, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (items.length > 0) return items;
    }
  } catch {
    // Return empty on offline/static
  }
  return (generatedPublishedLocalPackages as any[]) || [];
}

/** Fetch vehicle fleet specifications from canonical endpoint */
export async function fetchFleet(): Promise<any[]> {
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/v1/fleet`, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      const payload = json?.data ?? json;
      const vehicles = Array.isArray(payload?.vehicles) ? payload.vehicles : Array.isArray(payload) ? payload : [];
      if (vehicles.length > 0) return vehicles;
    }
  } catch {
    // Return empty on offline/static
  }
  return getFallbackPublishedCatalog().vehicles;
}

