/**
 * GENERATED — do not edit by hand.
 * Source: contracts/vehicle-tiers.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
/**
 * CONTRACT C-ENUM-001 — Vehicle Groups & Canonical Vehicle Models.
 *
 * Source of truth: Database `vehicle_groups` and `vehicle_models`.
 * Canonical groups: sedan, suv, luxury, tempo_traveller.
 *
 * GENERATED COPIES (do not edit — run `npm run contracts:sync`):
 *   backend/src/contracts/vehicle-tiers.ts
 *   admin/src/contracts/vehicle-tiers.ts
 *   react/src/contracts/vehicle-tiers.ts
 */

export const VEHICLE_GROUPS = [
  "sedan",
  "suv",
  "luxury",
  "tempo_traveller",
] as const;

export type VehicleGroup = (typeof VEHICLE_GROUPS)[number];

export const VEHICLE_MODELS = [
  "dzire",
  "city",
  "ertiga",
  "innova-crysta",
  "fortuner",
  "camry",
  "vellfire",
  "traveller-12",
  "traveller-17",
  "urbania-13",
] as const;

export type VehicleModel = (typeof VEHICLE_MODELS)[number] | (string & {});

// Combined valid fleet/model keys for type checking and schemas
export const VEHICLE_TIERS = [
  ...VEHICLE_GROUPS,
  ...VEHICLE_MODELS,
] as const;

export type VehicleTier = (typeof VEHICLE_TIERS)[number] | (string & {});

/**
 * Normalizes input string to canonical group or model key.
 */
export function toCanonicalTierKey(input: string): VehicleTier | undefined {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return undefined;
  if ((VEHICLE_TIERS as readonly string[]).includes(raw)) {
    return raw as VehicleTier;
  }
  const dashed = raw.replace(/_/g, "-");
  if ((VEHICLE_TIERS as readonly string[]).includes(dashed)) {
    return dashed as VehicleTier;
  }
  const snaked = raw.replace(/-/g, "_");
  if ((VEHICLE_TIERS as readonly string[]).includes(snaked)) {
    return snaked as VehicleTier;
  }
  if (raw === "innova") return "innova-crysta";
  if (raw === "tempo" || raw === "tempo-traveller") return "traveller-12";
  if (raw === "urbania") return "urbania-13";
  return dashed as VehicleTier;
}

/**
 * Normalizes any fleet code, alias, or model id to a canonical VehicleTier.
 */
export function normalizeFleetCode(input: string, fallback: VehicleTier = "sedan"): VehicleTier {
  return toCanonicalTierKey(input) ?? fallback;
}

/**
 * Read a tier/model-keyed record. Canonical key wins.
 */
export function resolveTierKey<T>(
  record: Record<string, T> | null | undefined,
  tier: string,
): { value: T | undefined } {
  if (!record) return { value: undefined };
  if (tier in record) return { value: record[tier] };
  const dashed = tier.replace(/_/g, "-");
  if (dashed in record) return { value: record[dashed] };
  const snake = tier.replace(/-/g, "_");
  if (snake in record) return { value: record[snake] };
  return { value: undefined };
}
