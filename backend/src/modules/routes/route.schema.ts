/**
 * @file route.schema.ts — Zod validation schemas for Intercity Highway Routes.
 * @usage Used by RouteController and RouteService to validate request bodies and query parameters.
 */

import { z } from "zod";
import { VEHICLE_TIERS, toCanonicalTierKey, type VehicleTier } from "../../contracts/vehicle-tiers.js";

export const ROUTE_TRIP_TYPES = ["one-way", "round-trip"] as const;

const fleetKeySchema = z.string().trim().transform((value, ctx) => {
  const canonical = toCanonicalTierKey(value);
  if (!canonical) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unknown fleet key "${value}". Expected one of: ${VEHICLE_TIERS.join(", ")}.`,
    });
    return z.NEVER;
  }
  return canonical;
});

const faresInrSchema = z.record(z.string(), z.number().positive().max(1_000_000).finite()).transform((record, ctx) => {
  const normalized: Record<VehicleTier, number> = {} as Record<VehicleTier, number>;
  for (const [key, amount] of Object.entries(record)) {
    const canonical = toCanonicalTierKey(key);
    if (!canonical) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unknown fleet key "${key}" in fares_inr. Expected one of: ${VEHICLE_TIERS.join(", ")}.`,
      });
      return z.NEVER;
    }
    normalized[canonical as VehicleTier] = amount as number;
  }
  return normalized;
});

const cleanText = (min: number, max: number) =>
  z.string().trim().min(min).max(max).transform((value) => value.replace(/<[^>]*>/g, "").trim());

const cleanOptional = (max: number) =>
  z.string().trim().max(max).transform((value) => value.replace(/<[^>]*>/g, "").trim()).optional();

const base = z.object({
  trip_type: z.enum(ROUTE_TRIP_TYPES),
  source_city: cleanText(2, 80),
  source_detail: cleanOptional(80),
  destination_city: cleanText(2, 80),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/).refine(
    (value) => !/^\d+-btn-/.test(value) && !/command/i.test(value) && !/--/.test(value),
    "Slug contains a reserved or invalid pattern.",
  ),
  distance_km: z.number().positive().max(10000).finite().optional(),
  duration_text: cleanOptional(80),
  available_fleets: z.array(fleetKeySchema).min(1),
  fares_inr: faresInrSchema,
  driver_charge_inr: z.number().nonnegative().max(1_000_000).default(0),
  night_halt_inr: z.number().nonnegative().max(1_000_000).default(0),
  toll_included: z.boolean().default(true),
  toll_amount_inr: z.number().nonnegative().max(1_000_000).optional(),
  interstate_charges: z.array(
    z.object({
      state: cleanText(2, 60),
      amount_inr: z.number().positive().max(1_000_000),
      note: cleanOptional(200),
    }).strict(),
  ).max(20).default([]),
  min_km_per_day: z.number().int().min(50).max(1000).default(300),
  stops: z.array(
    z.object({
      name: cleanText(2, 80),
      halt_mins: z.number().int().min(0).max(1440).optional(),
    }).strict(),
  ).max(24).default([]),
  use_per_km: z.boolean().default(true),
  per_km_rate_override: z.number().positive().max(100_000).finite().nullable().optional(),
  highway: cleanOptional(160),
  all_inclusive_note: cleanOptional(500),
  status: z.enum(["draft", "published", "archived"]).optional(),
  needs_review: z.boolean().default(false),
}).strict();

export const CreateRouteSchema = base;
export const UpdateRouteSchema = base.partial();

export const RouteQuerySchema = z.object({
  tripType: z.enum(ROUTE_TRIP_TYPES).optional(),
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
export type RouteQueryInput = z.infer<typeof RouteQuerySchema>;
