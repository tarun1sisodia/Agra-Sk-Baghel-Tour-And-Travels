/**
 * Fleet-bucket normalization for the admin Operations Overview
 * "Trips by vehicle tier / Current records" card (issue #129).
 *
 * The ops/admin bookings API has historically returned `vehicleTier` as either
 * a canonical model key (legacy fare snapshot), a vehicle GROUP code (clean
 * quote snapshot: sedan / suv / luxury / tempo_traveller), or — before the
 * backend fix — a silent "sedan" fallback. This module collapses every supported
 * model key, historical alias and display name into the five dashboard buckets
 * (Sedan, Ertiga, Innova, Tempo, Urbania) plus explicit "other" / "unknown"
 * buckets so records are never silently lost or misclassified as Sedan.
 *
 * Pure module: no React / DOM / env imports, so it runs under
 * `node --experimental-strip-types --test`. The only runtime import is the
 * generated C-ENUM-001 contract helper (relative `.ts` extension for Node).
 */
import { toCanonicalTierKey } from "../contracts/vehicle-tiers.ts";
import type { VehicleTier } from "./types";

/** The five fleet buckets displayed on the dashboard, in render order. */
export const FLEET_BUCKETS: readonly { key: VehicleTier; label: string }[] = [
  { key: "sedan", label: "Sedan" },
  { key: "ertiga", label: "Ertiga" },
  { key: "innova-crysta", label: "Innova" },
  { key: "tempo-traveller", label: "Tempo" },
  { key: "urbania", label: "Urbania" },
];

/**
 * Canonical group/model key → dashboard bucket.
 * `suv` and `luxury` are groups that span multiple displayed fleets (or none),
 * so on their own they are "other" — model identity is required to split them.
 */
const CANONICAL_BUCKET: Record<string, VehicleTier> = {
  // groups
  sedan: "sedan",
  suv: "other",
  luxury: "other",
  tempo_traveller: "tempo-traveller",
  "tempo-traveller": "tempo-traveller",
  // sedan models
  dzire: "sedan",
  city: "sedan",
  // displayed MPV / van models
  ertiga: "ertiga",
  "innova-crysta": "innova-crysta",
  "traveller-12": "tempo-traveller",
  "traveller-17": "tempo-traveller",
  "urbania-13": "urbania",
  // luxury models outside the five displayed fleets
  fortuner: "other",
  camry: "other",
  vellfire: "other",
};

/**
 * Display-name keyword rules, most specific first. Urbania is checked before
 * Traveller so a "Force Urbania" name never lands in the Tempo bucket, and
 * Ertiga / Innova are checked before generic sedan keywords.
 */
const DISPLAY_NAME_RULES: readonly { test: RegExp; bucket: VehicleTier }[] = [
  { test: /urbania/, bucket: "urbania" },
  { test: /ertiga/, bucket: "ertiga" },
  { test: /innova/, bucket: "innova-crysta" },
  { test: /traveller|tempo/, bucket: "tempo-traveller" },
  { test: /fortuner|camry|vellfire/, bucket: "other" },
  { test: /dzire|city|amaze|slavia|belta|ciaz|glanza|swift|sedan/, bucket: "sedan" },
];

/** Shape of the vehicle identity object the API may attach (camel or snake). */
export interface RawVehicleModel {
  id?: unknown;
  displayName?: unknown;
  display_name?: unknown;
  groupCode?: unknown;
  group_code?: unknown;
}

/** The vehicle-bearing fields of a raw ops/admin booking item. */
export interface RawBookingVehicleFields {
  vehicleTier?: unknown;
  /** New additive field from the ops/admin serializer (camelCase). */
  vehicleModel?: RawVehicleModel | null;
  /** Legacy QuoteResponse-style `vehicle` object. */
  vehicle?: RawVehicleModel | null;
  /** Legacy BookingDetail-style `vehicle_model` object. */
  vehicle_model?: RawVehicleModel | null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function bucketFromCanonical(raw: string): VehicleTier | undefined {
  const canonical = toCanonicalTierKey(raw);
  if (canonical === undefined) return undefined;
  return CANONICAL_BUCKET[String(canonical)];
}

function bucketFromDisplayName(name: string): VehicleTier | undefined {
  const lower = name.toLowerCase();
  for (const rule of DISPLAY_NAME_RULES) {
    if (rule.test.test(lower)) return rule.bucket;
  }
  return undefined;
}

/**
 * Resolve a raw booking's vehicle information into a dashboard bucket.
 *
 * Priority: explicit model display name → canonical tier key → model group
 * code. A non-empty but unclassifiable tier is "other" (data exists, just not
 * one of the five fleets); completely missing vehicle data is "unknown".
 * Missing data is NEVER silently classified as Sedan.
 */
export function resolveFleetBucket(item: RawBookingVehicleFields): VehicleTier {
  const models = [item.vehicleModel, item.vehicle, item.vehicle_model];

  // 1. Model display name is the most specific identity (splits SUV group).
  for (const model of models) {
    const name = asString(model?.displayName) ?? asString(model?.display_name);
    if (name) {
      const bucket = bucketFromDisplayName(name);
      if (bucket) return bucket;
    }
  }

  // 2. Canonical tier / group key on the booking itself.
  const tier = asString(item.vehicleTier);
  if (tier) {
    if (tier.toLowerCase() === "unknown") return "unknown";
    const bucket = bucketFromCanonical(tier);
    if (bucket) return bucket;
  }

  // 3. Group code from the model identity, when the tier was absent/ambiguous.
  for (const model of models) {
    const group = asString(model?.groupCode) ?? asString(model?.group_code);
    if (group) {
      const bucket = bucketFromCanonical(group);
      if (bucket) return bucket;
    }
  }

  // 4. Some vehicle data existed but could not be classified → other.
  if (tier) return "other";
  const hasAnyModel = models.some(
    (m) => asString(m?.displayName) || asString(m?.display_name) || asString(m?.groupCode) || asString(m?.group_code) || asString(m?.id),
  );
  if (hasAnyModel) return "other";

  // 5. No vehicle evidence at all.
  return "unknown";
}

/**
 * Tally already-normalized bookings into every bucket. Any unexpected tier
 * value is defensively counted as "other" rather than dropped.
 */
export function countFleetTrips(
  bookings: ReadonlyArray<{ vehicleTier: VehicleTier }>,
): Record<VehicleTier, number> {
  const counts: Record<VehicleTier, number> = {
    sedan: 0,
    ertiga: 0,
    "innova-crysta": 0,
    "tempo-traveller": 0,
    urbania: 0,
    other: 0,
    unknown: 0,
  };
  for (const booking of bookings) {
    const key = booking.vehicleTier;
    if (key in counts) {
      counts[key] += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}
