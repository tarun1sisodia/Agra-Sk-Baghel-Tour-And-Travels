import { z } from "zod";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const Uuid = z.string().regex(UUID_REGEX, "Invalid UUID");

export const CategoryCode = z.enum(["outstation", "local_package", "transfer", "tour_package"]);
export type CategoryCode = z.infer<typeof CategoryCode>;

export const VehicleGroupCode = z.enum(["sedan", "suv", "luxury", "tempo_traveller"]);
export type VehicleGroupCode = z.infer<typeof VehicleGroupCode>;

const Common = z.object({
  vehicle_model_id: Uuid,
  passenger_count: z.number().int().min(1),
  pickup_at: z.string().datetime({ offset: true }), // future; server-checked
});

export const QuoteRequest = z.discriminatedUnion("category", [
  Common.extend({
    category: z.literal("outstation"),
    route_id: Uuid,
    trip_type: z.enum(["one_way", "round_trip"]),
    return_at: z.string().datetime({ offset: true }).optional(), // required for round_trip; after pickup_at
  }),
  Common.extend({ category: z.literal("local_package"), local_package_id: Uuid }),
  Common.extend({ category: z.literal("transfer"), transfer_id: Uuid }),
  Common.extend({ category: z.literal("tour_package"), tour_package_id: Uuid }),
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
    vehicle_model_id: Uuid,
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
    route_id: Uuid,
    trip_type: z.enum(["one_way", "round_trip"]),
    return_at: z.string().datetime({ offset: true }).optional(),
  }),
  OptionsCommon.extend({ category: z.literal("local_package"), local_package_id: Uuid }),
  OptionsCommon.extend({ category: z.literal("transfer"), transfer_id: Uuid }),
  OptionsCommon.extend({ category: z.literal("tour_package"), tour_package_id: Uuid }),
]);
export type OptionsRequest = z.infer<typeof OptionsRequest>;

export const OptionsVehicleItem = z.object({
  vehicle_model_id: Uuid,
  display_name: z.string(),
  passenger_capacity: z.number().int(),
  luggage_capacity: z.number().int().nullable().optional(),
  image_url: z.string().nullable().optional(),
  quote: QuoteResponse,
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
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
  car: z.string().max(80).optional(),
  src: z.string().regex(/^[a-z0-9_]{1,40}$/).optional(),
});
export type BookingEntryParams = z.infer<typeof BookingEntryParams>;

// Admin contracts
export const TermsSide = z.object({
  inclusions: z.array(z.string().min(1)).default([]),
  exclusions: z.array(z.string().min(1)).default([]),
  mandatory: z.array(z.string().min(1)).default([]),
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
      vehicle_model_id: Uuid,
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
  vehicle_model_id: Uuid,
  local_package_id: Uuid.optional(),
  transfer_id: Uuid.optional(),
  tour_package_id: Uuid.optional(),
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
  route_id: Uuid.optional(),
  local_package_id: Uuid.optional(),
  transfer_id: Uuid.optional(),
  tour_package_id: Uuid.optional(),
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

// --- Booking Creation & Detail Contracts ---
export const BookingCreateResponse = z.object({
  booking_id: Uuid,
  ticket_id: z.string(),
  guest_access_token: z.string(),
  status: z.string(),
  total_amount: z.number().int().positive(),
  advance_amount: z.number().int().nonnegative(),
  balance_amount: z.number().int().nonnegative(),
  fare_breakdown: QuoteResponse,
});
export type BookingCreateResponse = z.infer<typeof BookingCreateResponse>;

export const BookingDetailResponse = z.object({
  booking_id: Uuid,
  ticket_id: z.string(),
  status: z.string(),
  category: CategoryCode,
  product_code: z.string(),
  product_name: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string().nullable().optional(),
  pickup_address: z.string(),
  drop_address: z.string().nullable().optional(),
  pickup_at: z.string(),
  return_at: z.string().nullable().optional(),
  passenger_count: z.number().int().positive(),
  vehicle_model: z.object({
    id: Uuid,
    display_name: z.string(),
    group_code: VehicleGroupCode,
  }),
  total_amount: z.number().int().positive(),
  advance_amount: z.number().int().nonnegative(),
  balance_amount: z.number().int().nonnegative(),
  fare_breakdown: QuoteResponse,
  payment_status: z.string(),
  created_at: z.string(),
});
export type BookingDetailResponse = z.infer<typeof BookingDetailResponse>;

// --- Payment Order Contracts ---
export const PaymentOrderResponse = z.object({
  payment_id: Uuid,
  order_id: z.string(),
  currency: z.literal("INR"),
  amount_paise: z.number().int().positive(),
  key_id: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string().nullable().optional(),
});
export type PaymentOrderResponse = z.infer<typeof PaymentOrderResponse>;

// --- Published Catalog Contracts ---
export const ProductStatus = z.enum(["published", "archived", "draft"]);
export type ProductStatus = z.infer<typeof ProductStatus>;

export const PublishedProductSummary = z.object({
  id: Uuid,
  category: CategoryCode,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  starting_price_inr: z.number().int().nonnegative().nullable().optional(),
  status: ProductStatus,
  distance_km: z.number().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
});
export type PublishedProductSummary = z.infer<typeof PublishedProductSummary>;

export const PublishedCatalogResponse = z.object({
  products: z.array(PublishedProductSummary),
  groups: z.array(
    z.object({
      group_code: VehicleGroupCode,
      name: z.string(),
      driver_allowance_per_day: z.number().int(),
      one_way_night_charge: z.number().int(),
      round_trip_halt_per_night: z.number().int(),
      sort_order: z.number().int(),
    })
  ),
  vehicles: z.array(
    z.object({
      id: Uuid,
      group_code: VehicleGroupCode,
      make: z.string(),
      model_name: z.string(),
      display_name: z.string(),
      passenger_capacity: z.number().int(),
      luggage_capacity: z.number().int().nullable().optional(),
      image_url: z.string().nullable().optional(),
    })
  ),
});
export type PublishedCatalogResponse = z.infer<typeof PublishedCatalogResponse>;

export const PublishedProductDetail = PublishedProductSummary.extend({
  gallery: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  highlights: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  itinerary: z.unknown().nullable().optional(),
  origin: z.string().nullable().optional(),
  destination: z.string().nullable().optional(),
  pickup_name: z.string().nullable().optional(),
  drop_name: z.string().nullable().optional(),
  covers: z.string().nullable().optional(),
  duration_hours: z.number().nullable().optional(),
  included_km: z.number().nullable().optional(),
  related_products: z.array(PublishedProductSummary).default([]),
});
export type PublishedProductDetail = z.infer<typeof PublishedProductDetail>;

// --- Reviews & Gallery Public Contracts ---
export const PublicReviewItem = z.object({
  id: Uuid,
  author_name: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
  review_text: z.string(),
  trip_summary: z.string(),
  social_platform: z.string().nullable(),
  social_url: z.string().nullable(),
  is_verified: z.boolean().default(false),
  submitted_at: z.string(),
});
export type PublicReviewItem = z.infer<typeof PublicReviewItem>;

export const PublicGalleryItem = z.object({
  id: Uuid,
  image_url: z.string(),
  caption: z.string().nullable(),
  author_name: z.string(),
});
export type PublicGalleryItem = z.infer<typeof PublicGalleryItem>;

// --- Publishing Events & Audit Logs Contracts ---
export const PublishEventItem = z.object({
  id: Uuid,
  entity_type: z.string(),
  entity_id: Uuid,
  event_type: z.string(),
  status: z.enum(["pending", "processing", "triggered", "succeeded", "failed"]),
  attempt_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  error_message: z.string().nullable().optional(),
});
export type PublishEventItem = z.infer<typeof PublishEventItem>;

export const AdminAuditLogItem = z.object({
  id: Uuid,
  actor_id: z.string().nullable(),
  actor_role: z.string(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().nullable(),
  before_state: z.unknown().nullable(),
  after_state: z.unknown().nullable(),
  created_at: z.string(),
});
export type AdminAuditLogItem = z.infer<typeof AdminAuditLogItem>;

