/**
 * GENERATED — do not edit by hand.
 * Source: contracts/fleet-pricing.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
/**
 * CONTRACT C-FLEET-PRICING-001 — Shared Customer Price Contract (FleetPriceOption).
 *
 * Defines the normalized customer presentation contract for fleet pricing.
 * Server-authoritative: prices, advance amounts, and allowances are calculated
 * exclusively on the backend. Frontend consumers display these pre-computed values
 * and MUST NEVER perform client-side pricing or distance arithmetic.
 *
 * Canonical source: contracts/fleet-pricing.ts
 * Generated copies:
 *   backend/src/contracts/fleet-pricing.ts
 *   admin/src/contracts/fleet-pricing.ts
 *   react/src/contracts/fleet-pricing.ts
 *
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 */

import { z } from "zod";
import { VEHICLE_TIERS, type VehicleTier } from "./vehicle-tiers.js";

export type { VehicleTier };

export const FLEET_PRICING_TYPES = [
  "per-km-route",
  "fixed-package",
  "local-package",
  "special-commercial",
] as const;

export type FleetPricingType = (typeof FLEET_PRICING_TYPES)[number];

export const FLEET_PRICE_SOURCES = [
  "fare_rules",
  "tour_packages",
  "local_packages",
] as const;

export type FleetPriceSource = (typeof FLEET_PRICE_SOURCES)[number];

export const FleetPriceOptionBreakdownSchema = z.object({
  billedKm: z.number().nonnegative().optional(),
  driverAllowance: z.number().nonnegative().optional(),
  nightAllowance: z.number().nonnegative().optional(),
  tollNote: z.string().optional(),
});

export type FleetPriceOptionBreakdown = z.infer<typeof FleetPriceOptionBreakdownSchema>;

export const FleetPriceOptionSchema = z.object({
  fleetCode: z.enum(VEHICLE_TIERS),
  fleetName: z.string().min(1),
  price: z.number().nonnegative(),
  advanceAmount: z.number().nonnegative(),
  currency: z.literal("INR"),
  pricingType: z.enum(FLEET_PRICING_TYPES),
  displayLabel: z.string().min(1),
  priceSource: z.enum(FLEET_PRICE_SOURCES),
  breakdown: FleetPriceOptionBreakdownSchema.optional(),
});

export type FleetPriceOption = z.infer<typeof FleetPriceOptionSchema>;

export function isValidFleetPriceOption(val: unknown): val is FleetPriceOption {
  return FleetPriceOptionSchema.safeParse(val).success;
}
