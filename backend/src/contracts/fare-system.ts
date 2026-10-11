/**
 * GENERATED — do not edit by hand.
 * Source: contracts/fare-system.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
import { z } from "zod";

export const CategoryCode = z.enum(["outstation", "local_package", "transfer", "tour_package"]);
export type CategoryCode = z.infer<typeof CategoryCode>;

export const VehicleGroupCode = z.enum(["sedan", "suv", "luxury", "tempo_traveller"]);
export type VehicleGroupCode = z.infer<typeof VehicleGroupCode>;

const Common = z.object({
  vehicle_model_id: z.string().uuid(),
  passenger_count: z.number().int().min(1),
  pickup_at: z.string().datetime({ offset: true }), // future; server-checked
});

export const QuoteRequest = z.discriminatedUnion("category", [
  Common.extend({
    category: z.literal("outstation"),
    route_id: z.string().uuid(),
    trip_type: z.enum(["one_way", "round_trip"]),
    return_at: z.string().datetime({ offset: true }).optional(), // required for round_trip; after pickup_at
  }),
  Common.extend({ category: z.literal("local_package"), local_package_id: z.string().uuid() }),
  Common.extend({ category: z.literal("transfer"), transfer_id: z.string().uuid() }),
  Common.extend({ category: z.literal("tour_package"), tour_package_id: z.string().uuid() }),
]);
export type QuoteRequest = z.infer<typeof QuoteRequest>;

export const QuoteLine = z.object({
  code: z.enum(["base_fare", "driver_allowance", "halt_charge", "night_charge", "extra_charge"]),
  label: z.string(),
  amount: z.number().int().positive(),
});
export type QuoteLine = z.infer<typeof QuoteLine>;

export const QuoteResponse = z.object({
  category: CategoryCode,
  vehicle: z.object({
    vehicle_model_id: z.string().uuid(),
    display_name: z.string(),
    group_code: VehicleGroupCode,
    passenger_capacity: z.number().int().positive(),
  }),
  currency: z.literal("INR"),
  lines: z.array(QuoteLine).min(1),
  total: z.number().int().positive(), // = sum of lines
  advance: z.number().int().nonnegative(), // <= total
  balance: z.number().int().nonnegative(), // = total - advance
  messages: z.array(z.string()), // note-only extra_charges labels
  details: z.object({
    rate_per_km: z.number().int().optional(),
    distance_km: z.number().optional(),
    duration_minutes: z.number().int().optional(),
    billable_km: z.number().optional(),
    days: z.number().int().optional(),
    effective_trip_type: z.enum(["one_way", "round_trip"]).optional(),
  }),
});
export type QuoteResponse = z.infer<typeof QuoteResponse>;

// Grouped selector: same request as QuoteRequest without the vehicle_model_id
const OptionsCommon = z.object({
  passenger_count: z.number().int().min(1).default(1),
  pickup_at: z.string().datetime({ offset: true }),
});

export const OptionsRequest = z.discriminatedUnion("category", [
  OptionsCommon.extend({
    category: z.literal("outstation"),
    route_id: z.string().uuid(),
    trip_type: z.enum(["one_way", "round_trip"]),
    return_at: z.string().datetime({ offset: true }).optional(),
  }),
  OptionsCommon.extend({ category: z.literal("local_package"), local_package_id: z.string().uuid() }),
  OptionsCommon.extend({ category: z.literal("transfer"), transfer_id: z.string().uuid() }),
  OptionsCommon.extend({ category: z.literal("tour_package"), tour_package_id: z.string().uuid() }),
]);
export type OptionsRequest = z.infer<typeof OptionsRequest>;

export const OptionsVehicleItem = z.object({
  vehicle_model_id: z.string().uuid(),
  display_name: z.string(),
  passenger_capacity: z.number().int(),
  luggage_capacity: z.number().int().nullable(),
  image_url: z.string().nullable(),
  quote: QuoteResponse,
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
});
export type OptionsVehicleItem = z.infer<typeof OptionsVehicleItem>;

export const OptionsGroupItem = z.object({
  group_code: VehicleGroupCode,
  name: z.string(),
  vehicles: z.array(OptionsVehicleItem),
});
export type OptionsGroupItem = z.infer<typeof OptionsGroupItem>;

export const OptionsResponse = z.object({
  product: z.object({
    category: CategoryCode,
    code: z.string(),
    name: z.string(),
  }),
  groups: z.array(OptionsGroupItem),
});
export type OptionsResponse = z.infer<typeof OptionsResponse>;

export const CreateBookingRequest = z.object({
  quote: QuoteRequest,
  quoted_total: z.number().int().positive(), // what customer saw; never used as the price
  customer_name: z.string().min(1),
  customer_phone: z.string().min(10),
  customer_email: z.string().email().optional(),
  pickup_address: z.string().min(1),
  drop_address: z.string().optional(),
  flight_train_number: z.string().optional(),
  special_notes: z.string().optional(),
});
export type CreateBookingRequest = z.infer<typeof CreateBookingRequest>;

// Link from route/package pages into booking page. Inputs only, never prices.
export const BookingEntryParams = z.object({
  category: CategoryCode,
  product: z.string().regex(/^[a-z0-9-]{2,80}$/),
  trip: z.enum(["one_way", "round_trip"]).optional(),
  date: z.string().date().optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  return_date: z.string().date().optional(),
  return_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  pax: z.coerce.number().int().min(1).optional(),
  car: z.string().uuid().optional(),
  src: z.string().regex(/^[a-z0-9_]{1,40}$/).optional(),
});
export type BookingEntryParams = z.infer<typeof BookingEntryParams>;

// Admin contracts
export const TermsSide = z.object({
  inclusions: z.array(z.string().min(1)).default([]),
  exclusions: z.array(z.string().min(1)).default([]),
});
export type TermsSide = z.infer<typeof TermsSide>;

export const OutstationTerms = z.object({
  one_way: TermsSide.optional(),
  round_trip: TermsSide.optional(),
});
export type OutstationTerms = z.infer<typeof OutstationTerms>;

export const RouteVehiclesPut = z.object({
  vehicles: z.array(
    z.object({
      vehicle_model_id: z.string().uuid(),
      one_way_amount: z.number().int().positive().nullable(),
      round_trip_enabled: z.boolean(),
      terms: OutstationTerms,
      sort_order: z.number().int().default(0),
      is_active: z.boolean().default(true),
    })
  ),
});
export type RouteVehiclesPut = z.infer<typeof RouteVehiclesPut>;

export const VehicleModelCreate = z.object({
  vehicle_group_code: VehicleGroupCode,
  make: z.string().min(1),
  model_name: z.string().min(1),
  display_name: z.string().min(1),
  passenger_capacity: z.number().int().positive(),
  luggage_capacity: z.number().int().nonnegative().optional(),
  image_url: z.string().optional(),
  sort_order: z.number().int().optional(),
});
export type VehicleModelCreate = z.infer<typeof VehicleModelCreate>;

export const VehicleModelPatch = VehicleModelCreate.omit({ vehicle_group_code: true }).partial().extend({
  is_active: z.boolean().optional(),
});
export type VehicleModelPatch = z.infer<typeof VehicleModelPatch>;

export const VehicleGroupPatch = z.object({
  driver_allowance_per_day: z.number().int().nonnegative().optional(),
  one_way_night_charge: z.number().int().nonnegative().optional(),
  round_trip_halt_per_night: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});
export type VehicleGroupPatch = z.infer<typeof VehicleGroupPatch>;

export const FareRuleCreate = z.object({
  category: CategoryCode,
  vehicle_model_id: z.string().uuid(),
  local_package_id: z.string().uuid().optional(),
  transfer_id: z.string().uuid().optional(),
  tour_package_id: z.string().uuid().optional(),
  amount: z.number().int().positive(),
});
export type FareRuleCreate = z.infer<typeof FareRuleCreate>;

export const FareRulePatch = z.object({
  amount: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});
export type FareRulePatch = z.infer<typeof FareRulePatch>;

export const ExtraChargeCreate = z.object({
  category: CategoryCode,
  vehicle_group_code: VehicleGroupCode.optional(),
  route_id: z.string().uuid().optional(),
  local_package_id: z.string().uuid().optional(),
  transfer_id: z.string().uuid().optional(),
  tour_package_id: z.string().uuid().optional(),
  label: z.string().min(1),
  amount: z.number().int().positive().optional(),
});
export type ExtraChargeCreate = z.infer<typeof ExtraChargeCreate>;

export const ExtraChargePatch = z.object({
  label: z.string().min(1).optional(),
  amount: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type ExtraChargePatch = z.infer<typeof ExtraChargePatch>;

export const FareSettingPatch = z.object({
  value: z.number().int(),
});
export type FareSettingPatch = z.infer<typeof FareSettingPatch>;

export const RouteCalculateRequest = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
});
export type RouteCalculateRequest = z.infer<typeof RouteCalculateRequest>;

export const RouteCalculateResponse = z.object({
  distance_km: z.number().positive(),
  duration_minutes: z.number().int().positive(),
  resolved_origin: z.string(),
  resolved_destination: z.string(),
});
export type RouteCalculateResponse = z.infer<typeof RouteCalculateResponse>;
