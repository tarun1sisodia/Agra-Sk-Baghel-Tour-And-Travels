/**
 * Live Catalog Service — reads the published catalog from the Fastify API.
 *
 * The backend catalog is the SINGLE SOURCE OF TRIPS: the operations desk
 * publishes rides, tours, packages, routes, vehicles and famous places, and
 * they appear here automatically — no frontend deploy, no developer.
 *
 * The static data in `src/data.ts` remains the SSG baseline (fast first paint,
 * crawlable HTML); published catalog items are fetched at runtime and merged
 * over it.
 */

import { getApiBaseUrl } from "./api";

export type PublicCatalogType = "ride" | "tour" | "package" | "route" | "vehicle" | "place";
export type PublicTripType = "one-way" | "round-trip" | "local-tour" | "airport-transfer";
export type PublicAvailability = "available" | "limited" | "unavailable";

export interface PublicCatalogGalleryImage {
  id: string;
  mediaType: "image" | "video";
  altText: string;
  caption: string | null;
  sortOrder: number;
  url: string;
}

export interface PublicCatalogItem {
  id: string;
  type: PublicCatalogType;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  durationText: string;
  routeSummary: string;
  startingPriceInr: number | null;
  distanceKm: number | null;
  availability: PublicAvailability;
  seatsLeft: number | null;
  stops: string[];
  tripType: PublicTripType | null;
  publishedAt: string | null;
  updatedAt: string | null;
  coverImage: { url: string } | null;
  gallery: PublicCatalogGalleryImage[];
}

export interface PublicFleetVehicle {
  id: string;
  tier: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  active: boolean;
}

export interface PublicFleetModel {
  id: string;
  groupCode: string;
  groupName: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number | null;
  imageUrl: string | null;
  active: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** Absolute, browser-loadable URL for a catalog media entry. */
export function resolveCatalogMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    const localhostMatch = trimmed.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/api\/.*)$/i);
    if (localhostMatch) {
      return `${getApiBaseUrl()}${localhostMatch[1]}`;
    }
    return trimmed;
  }
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (normalized.startsWith("/api/")) {
    return `${getApiBaseUrl()}${normalized}`;
  }
  return trimmed;
}

const catalogCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute cache

async function getJson<T>(path: string): Promise<T> {
  const cached = catalogCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = window.sessionStorage.getItem(`arenaai:cat:${path}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          catalogCache.set(path, parsed);
          return parsed.data as T;
        }
      }
    } catch { }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`Catalog request failed (${res.status})`);
    }
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!json || typeof json !== "object") {
      throw new Error("Catalog response was malformed.");
    }
    const result = ("data" in json ? json.data : json) as T;
    catalogCache.set(path, { data: result, timestamp: Date.now() });
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          `arenaai:cat:${path}`,
          JSON.stringify({ data: result, timestamp: Date.now() }),
        );
      } catch { }
    }
    return result;
  } catch (err) {
    clearTimeout(timer);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data as T;
    throw err;
  }
}

function normalizeItem(raw: Record<string, unknown>): PublicCatalogItem {
  const gallery = Array.isArray(raw.gallery)
    ? (raw.gallery as Record<string, unknown>[])
      .filter((g) => g && typeof g === "object")
      .map((g) => {
        const url = typeof g.url === "string" ? g.url.trim() : "";
        return {
          id: String(g.id ?? ""),
          mediaType: (g.mediaType as "image" | "video") ?? "image",
          altText: String(g.altText ?? ""),
          caption: g.caption ? String(g.caption) : null,
          sortOrder: Number(g.sortOrder) || 0,
          url,
        };
      })
      .filter((g) => Boolean(g.url))
      .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  return {
    id: String(raw.id ?? ""),
    type: (raw.type as PublicCatalogType) ?? "package",
    slug: String(raw.slug ?? ""),
    title: String(raw.title ?? ""),
    shortDescription: String(raw.shortDescription ?? ""),
    description: String(raw.description ?? ""),
    durationText: String(raw.durationText ?? ""),
    routeSummary: String(raw.routeSummary ?? ""),
    startingPriceInr: raw.startingPriceInr != null && Number(raw.startingPriceInr) > 0 ? Number(raw.startingPriceInr) : null,
    distanceKm:
      raw.distanceKm === null || raw.distanceKm === undefined ? null : Number(raw.distanceKm),
    availability: (raw.availability as PublicAvailability) ?? "available",
    seatsLeft: raw.seatsLeft === null || raw.seatsLeft === undefined ? null : Number(raw.seatsLeft),
    stops: Array.isArray(raw.stops) ? raw.stops.map((s) => String(s)) : [],
    tripType: (raw.tripType as PublicTripType | null) ?? null,
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
    coverImage: raw.coverImage && (raw.coverImage as { url?: string }).url
      ? { url: String((raw.coverImage as { url?: string }).url) }
      : gallery[0]
        ? { url: gallery[0].url }
        : null,
    gallery,
  };
}

/** Published catalog listing (optionally narrowed by vertical / trip type). */
export async function fetchPublishedCatalog(
  filter: { type?: PublicCatalogType; tripType?: PublicTripType } = {},
): Promise<PublicCatalogItem[]> {
  const params = new URLSearchParams();
  if (filter.type) params.set("type", filter.type);
  if (filter.tripType) params.set("tripType", filter.tripType);
  const qs = params.toString();
  try {
    const raw = await getJson<any>(`/api/v1/catalog${qs ? `?${qs}` : ""}`);
    const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.products) ? raw.products : []);
    return items.filter(isRecord).map(normalizeItem);
  } catch {
    return [];
  }
}

/** Published catalog item by slug (used by dynamic detail pages). */
export async function fetchCatalogItemBySlug(slug: string): Promise<PublicCatalogItem> {
  try {
    const raw = await getJson<Record<string, unknown>>(`/api/v1/catalog/${encodeURIComponent(slug)}`);
    return normalizeItem(raw);
  } catch (err) {
    // Fallback to dedicated tour-packages endpoint
    const res = await getJson<Record<string, unknown>>(`/api/v1/tour-packages/by-code/${encodeURIComponent(slug)}`);
    if (res && res.name) {
      const fp = res.fleetPrices as Record<string, number> | undefined;
      const fpValues = fp ? Object.values(fp).filter((v) => typeof v === "number" && v > 0) : [];
      const minPrice = fpValues.length > 0 ? Math.min(...fpValues) : 0;
      const startingPrice = Number(res.startingPriceInr || res.starting_price_inr || minPrice || 0) || null;
      return {
        id: String(res.id ?? slug),
        type: "package",
        slug: String(res.packageCode ?? res.package_code ?? slug),
        title: String(res.name ?? ""),
        shortDescription: String(res.inclusionsHighlight ?? "Private AC Cab & Chauffeur Tour"),
        description: String(res.inclusionsNote ?? res.inclusionsHighlight ?? "All inclusive private sightseeing tour"),
        durationText: String(res.durationText ?? `${res.days ?? 1} Day`),
        routeSummary: String(res.name ?? ""),
        startingPriceInr: startingPrice,
        distanceKm: null,
        availability: "available",
        seatsLeft: null,
        stops: [String(res.name ?? "Agra Heritage Sites")],
        tripType: "local-tour",
        publishedAt: String(res.createdAt ?? ""),
        updatedAt: String(res.updatedAt ?? ""),
        coverImage: { url: "/assets/packages/taj-dawn.webp" },
        gallery: [],
      };
    }
    throw err;
  }
}

/** Dynamic detail equivalent of fetchCatalogItemBySlug with no browser cache. */
export async function fetchLiveCatalogItemBySlug(slug: string): Promise<PublicCatalogItem> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/catalog/${encodeURIComponent(slug)}?live=${Date.now()}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Catalog item request failed (${response.status})`);
  const envelope = (await response.json()) as { data?: Record<string, unknown> };
  return normalizeItem(envelope.data ?? (envelope as Record<string, unknown>));
}

/** Live fleet from the active fare rules (admin Fleet & Fare editor). */
export async function fetchLiveFleet(): Promise<PublicFleetVehicle[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/fleet?live=${Date.now()}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Fleet request failed (${response.status})`);
  const envelope = (await response.json()) as { data?: { vehicles?: unknown[] } | unknown[] };
  const data = (envelope?.data ?? envelope) as { vehicles?: unknown[] };
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  return vehicles
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .map((v) => ({
      id: String(v.id ?? v.tier ?? ""),
      tier: String(v.tier ?? v.id ?? ""),
      name: String(v.name ?? ""),
      seats: Number(v.seats) || 0,
      bags: Number(v.bags) || 0,
      perKm: Number(v.perKm) || 0,
      active: v.active !== false,
    }));
}

/** Live vehicle-model catalogue, including database fare-rule per-km prices. */
export async function fetchLiveFleetModels(): Promise<PublicFleetModel[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/fleet?live=${Date.now()}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Fleet request failed (${response.status})`);
  const envelope = (await response.json()) as { data?: { groups?: unknown[]; vehicles?: unknown[] } };
  const payload = envelope?.data ?? {};
  const groups = Array.isArray(payload.groups) ? payload.groups : [];
  return groups.flatMap((group) => {
    if (!isRecord(group) || !Array.isArray(group.vehicles)) return [];
    const groupCode = String(group.code ?? "");
    const groupName = String(group.name ?? groupCode);
    return group.vehicles
      .filter(isRecord)
      .map((vehicle) => ({
        id: String(vehicle.id ?? ""),
        groupCode,
        groupName,
        name: String(vehicle.displayName ?? vehicle.modelName ?? ""),
        seats: Number(vehicle.seats) || 0,
        bags: Number(vehicle.bags) || 0,
        perKm: vehicle.perKm == null ? null : Number(vehicle.perKm) || null,
        imageUrl: typeof vehicle.imageUrl === "string" ? vehicle.imageUrl : null,
        active: vehicle.active !== false,
      }));
  });
}

export const TRIP_TYPE_LABEL: Record<PublicTripType, string> = {
  "one-way": "One-way drop",
  "round-trip": "Round trip",
  "local-tour": "Local sightseeing",
  "airport-transfer": "Airport / station transfer",
};
