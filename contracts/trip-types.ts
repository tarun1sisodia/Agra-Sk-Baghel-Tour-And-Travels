/**
 * @file trip-types.ts — Canonical Trip Types contract for Agra SK Baghel Tour & Travels.
 * @usage Contract C-ENUM-002: Synchronized across backend, admin, and react.
 */

export const TRIP_TYPES = [
  "one-way",
  "round-trip",
  "local-tour",
  "airport-transfer",
] as const;

export type TripType = (typeof TRIP_TYPES)[number];

export const TRIP_TYPE_META: Record<TripType, { label: string; description: string }> = {
  "one-way": {
    label: "One Way",
    description: "Intercity point-to-point journey with fixed corridor distance.",
  },
  "round-trip": {
    label: "Round Trip",
    description: "Intercity round trip journey with minimum daily distance rules.",
  },
  "local-tour": {
    label: "Local Tour",
    description: "Intra-city rental governed by fixed duration/distance slabs.",
  },
  "airport-transfer": {
    label: "Airport / Railway Transfer",
    description: "Point-to-point airport or railway station pickup and drop service.",
  },
};

/**
 * Normalizes user/client trip type input to canonical TripType.
 * Rejects unknown trip types with undefined.
 */
export function toCanonicalTripType(input: string): TripType | undefined {
  const clean = (input || "").trim().toLowerCase();
  if ((TRIP_TYPES as readonly string[]).includes(clean)) {
    return clean as TripType;
  }
  const normalized = clean.replace(/_/g, "-");
  if ((TRIP_TYPES as readonly string[]).includes(normalized)) {
    return normalized as TripType;
  }
  if (normalized === "oneway") return "one-way";
  if (normalized === "roundtrip") return "round-trip";
  if (normalized === "local") return "local-tour";
  if (normalized === "transfer") return "airport-transfer";
  return undefined;
}
