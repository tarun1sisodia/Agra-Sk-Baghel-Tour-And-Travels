/**
 * CONTRACT C-ENUM-001 — Canonical vehicle tiers. LOCKED.
 *
 * The 5 fleets of Agra SK Baghel Tour & Travels. `VehicleTier` (long form) is the ONLY
 * valid tier key at API boundaries, in zod schemas, and in all newly written
 * database rows. Decided by Tarun 2026-10-07 (D1): long form wins.
 *
 * GENERATED COPIES (do not edit — run `npx tsx contracts/scripts/sync-contracts.ts`):
 *   backend/src/contracts/vehicle-tiers.ts
 *   admin/src/contracts/vehicle-tiers.ts
 *   react/src/contracts/vehicle-tiers.ts
 *
 * Change process: contracts/LOCKED.md. Version history: contracts/CHANGELOG.md.
 * Why/what/how for the tests guarding this contract:
 *   contracts/docs/vehicle-tiers.tests.md
 */

export const VEHICLE_TIERS = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
] as const;

export type VehicleTier = (typeof VEHICLE_TIERS)[number];

export interface VehicleTierMeta {
  /** Display label, e.g. "Innova" */
  label: string;
  /** Seating capacity as the business states it, e.g. "6-7" */
  seats: string;
  /**
   * Short id found in historical data (seeds, pre-0034 DB rows, PACKAGE_UPGRADES).
   * NEVER use for new writes. Only for reading compatibility data via resolveTierKey().
   */
  shortId: string;
}

export const VEHICLE_TIER_META: Record<VehicleTier, VehicleTierMeta> = {
  sedan: { label: "Sedan", seats: "4", shortId: "sedan" },
  ertiga: { label: "Ertiga", seats: "6", shortId: "ertiga" },
  "innova-crysta": { label: "Innova", seats: "6-7", shortId: "innova" },
  "tempo-traveller": { label: "Tempo", seats: "12", shortId: "tempo" },
  urbania: { label: "Urbania", seats: "16", shortId: "urbania" },
};

const SHORT_TO_CANONICAL: Record<string, VehicleTier> = {
  sedan: "sedan",
  ertiga: "ertiga",
  innova: "innova-crysta",
  innova_crysta: "innova-crysta",
  tempo: "tempo-traveller",
  tempo_traveller: "tempo-traveller",
  "tempo-12": "tempo-traveller",
  "tempo-16": "tempo-traveller",
  urbania: "urbania",
};

/**
 * Normalize any tier key (canonical long form, short id, or snake_case alias)
 * to the canonical VehicleTier. Returns undefined for unknown keys — callers must
 * reject those loudly (400), never silently ignore.
 */
export function toCanonicalTierKey(input: string): VehicleTier | undefined {
  const clean = (input || "").trim().toLowerCase();
  if ((VEHICLE_TIERS as readonly string[]).includes(clean)) {
    return clean as VehicleTier;
  }
  const dashed = clean.replace(/_/g, "-");
  if ((VEHICLE_TIERS as readonly string[]).includes(dashed)) {
    return dashed as VehicleTier;
  }
  return SHORT_TO_CANONICAL[clean] ?? SHORT_TO_CANONICAL[dashed];
}

/**
 * Normalizes any fleet code, alias, or short tier id to a canonical VehicleTier.
 * If unrecognized, falls back to a safe canonical default ("sedan").
 */
export function normalizeFleetCode(input: string, fallback: VehicleTier = "sedan"): VehicleTier {
  return toCanonicalTierKey(input) ?? fallback;
}

export type TierKeySource = "canonical" | "compat" | "miss";

export interface TierKeyResolution<T> {
  value: T | undefined;
  /** "canonical" = long-form key hit · "compat" = short-id or snake-case key hit · "miss" = no key */
  via: TierKeySource;
}

/**
 * Read a tier-keyed record (fleetPrices, extraRates, upgradeSurcharges, prices.fleet_per_km, ...).
 * Canonical long-form key wins; short id or snake_case key is accepted for compatibility rows
 * so reads don't break during data migration. Never silently fall through on "miss".
 */
export function resolveTierKey<T>(
  record: Record<string, T> | null | undefined,
  tier: VehicleTier,
): TierKeyResolution<T> {
  if (!record) return { value: undefined, via: "miss" };
  if (tier in record) return { value: record[tier], via: "canonical" };
  const shortId = VEHICLE_TIER_META[tier].shortId;
  if (shortId !== tier && shortId in record) {
    return { value: record[shortId], via: "compat" };
  }
  const snakeId = tier.replace(/-/g, "_");
  if (snakeId !== tier && snakeId in record) {
    return { value: record[snakeId], via: "compat" };
  }
  return { value: undefined, via: "miss" };
}

