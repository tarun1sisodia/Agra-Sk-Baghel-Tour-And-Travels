import pg from "pg";
import type {
  AuditLogRecord,
  BookingIntentRecord,
  BookingRecord,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  RentalEnquiryRecord,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  WebhookEventRecord,
} from "../types/domain.js";
import type { DeviceRegistrationRecord, FareRuleRecord, InquiryListFilter, RentalEnquiryListFilter, PaymentListFilter, PublishEventInput, PublishEventRecord, Repositories } from "./types.js";
import type { RouteCatalogRecord } from "./route-catalog-types.js";
import type {
  CancellationPolicyRecord,
  CompanyProfileRecord,
  ContentStatus,
  DossierSignoffRecord,
  LocalSightseeingPackageRecord,
  MonumentRecord,
  PackageVehicleUpgradeRecord,
  PetTaxiPolicyRecord,
  TourPackageGalleryImage,
  TourPackageRecord,
  TransferRouteRecord,
} from "./dossier-types.js";
import { createPoolConfig } from "./poolConfig.js";
import { AppError } from "../shared/errors.js";
import { phonesMatch } from "../shared/privacy.js";

type PoolClient = pg.PoolClient;

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(val: unknown): boolean {
  return typeof val === "string" && UUID_REGEX.test(val.trim());
}

export function safeIsoDate(val: unknown, fallback?: string): string {
  if (val === null || val === undefined || val === "") {
    if (fallback !== undefined) return fallback;
    throw new AppError("DATA_CORRUPTION", "Missing required timestamp", 500);
  }
  const d = new Date(val as string | number | Date);
  if (isNaN(d.getTime())) {
    if (fallback !== undefined) return fallback;
    throw new AppError("DATA_CORRUPTION", `Invalid timestamp value: ${String(val)}`, 500);
  }
  return d.toISOString();
}

export function safeIsoDateOrNull(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function mapLocalPackage(row: Record<string, unknown>): LocalSightseeingPackageRecord {
  return {
    id: String(row.id),
    packageCode: String(row.code ?? row.package_code ?? ""),
    name: String(row.name),
    durationHours: num(row.duration_hours),
    includedKm: num(row.included_km),
    covers: String(row.covers ?? ""),
    parkingNote: row.parking_note ? String(row.parking_note) : (row.inclusions_note ? String(row.inclusions_note) : null),
    fleetPrices: (row.fleet_prices as Record<string, number>) ?? {},
    imageUrl: row.image_url ? String(row.image_url) : null,
    gallery: Array.isArray(row.gallery) ? (row.gallery as TourPackageGalleryImage[]) : [],
    usePerKm: row.use_per_km === null || row.use_per_km === undefined ? null : Boolean(row.use_per_km),
    extraRates: (row.extra_rates as LocalSightseeingPackageRecord["extraRates"]) ?? null,
    nightChargeInr: row.night_charge_inr !== null && row.night_charge_inr !== undefined ? num(row.night_charge_inr) : null,
    status: (row.status as ContentStatus) ?? "draft",
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : row.status === "published",
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

export function mapTransferRoute(row: Record<string, unknown>): TransferRouteRecord {
  return {
    id: String(row.id),
    routeCode: String(row.code ?? row.route_code ?? ""),
    name: String(row.name),
    distanceText: row.distance_text ? String(row.distance_text) : null,
    directionNote: row.direction_note ? String(row.direction_note) : (row.pickup_name && row.drop_name ? `${row.pickup_name} to ${row.drop_name}` : null),
    fleetPrices: (row.fleet_prices as Record<string, number>) ?? {},
    usePerKm: row.use_per_km === null || row.use_per_km === undefined ? null : Boolean(row.use_per_km),
    nightChargeInr: row.night_charge_inr !== null && row.night_charge_inr !== undefined ? num(row.night_charge_inr) : null,
    status: (row.status as ContentStatus) ?? "draft",
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : row.status === "published",
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

export function mapTourPackage(row: Record<string, unknown>): TourPackageRecord {
  return {
    id: String(row.id),
    packageCode: String(row.code ?? row.package_code ?? ""),
    name: String(row.name),
    durationText: String(row.duration_text ?? `${row.days ?? 1} Days`),
    days: num(row.days ?? 1),
    nights: num(row.nights ?? 0),
    baseTierCode: row.base_tier_code ? String(row.base_tier_code) : null,
    startingPriceInr: row.starting_price_inr !== null && row.starting_price_inr !== undefined ? num(row.starting_price_inr) : null,
    fleetPrices: (row.fleet_prices as Record<string, number>) ?? {},
    nightChargeInr: row.night_charge_inr !== null && row.night_charge_inr !== undefined ? num(row.night_charge_inr) : null,
    inclusionsHighlight: row.inclusions_highlight ? String(row.inclusions_highlight) : null,
    inclusionsNote: row.inclusions_note ? String(row.inclusions_note) : null,
    source: row.source !== undefined && row.source !== null ? String(row.source) : null,
    destination: row.destination !== undefined && row.destination !== null ? String(row.destination) : null,
    inclusions: Array.isArray(row.inclusions) ? (row.inclusions as string[]) : [],
    exclusions: Array.isArray(row.exclusions) ? (row.exclusions as string[]) : [],
    itinerary: Array.isArray(row.itinerary) ? (row.itinerary as any[]) : [],
    imageUrl: row.image_url ? String(row.image_url) : null,
    gallery: Array.isArray(row.gallery) ? (row.gallery as any) : [],
    status: (row.status as ContentStatus) ?? "draft",
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : row.status === "published",
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}



function mapCancellationPolicy(row: Record<string, unknown>): CancellationPolicyRecord {
  return {
    id: String(row.id),
    policyType: row.policy_type as CancellationPolicyRecord["policyType"],
    noticePeriodText: String(row.notice_period_text),
    sortOrder: num(row.sort_order),
    feeRetainedPercent: num(row.fee_retained_percent),
    refundPercent: num(row.refund_percent),
    ruleText: String(row.rule_text),
    refundTimelineNote: String(row.refund_timeline_note),
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapCompanyProfile(row: Record<string, unknown>): CompanyProfileRecord {
  return {
    id: String(row.id),
    brandName: String(row.brand_name),
    officeAddress: String(row.office_address),
    primaryPhone: String(row.primary_phone),
    whatsappNumber: String(row.whatsapp_number),
    email: String(row.email),
    gstin: String(row.gstin),
    operatingHours: String(row.operating_hours),
    mapsLocation: String(row.maps_location),
    dossierVersion: String(row.dossier_version),
    dossierStatus: row.dossier_status as CompanyProfileRecord["dossierStatus"],
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapDossierSignoff(row: Record<string, unknown>): DossierSignoffRecord {
  return {
    id: String(row.id),
    sectionKey: String(row.section_key),
    sectionTitle: String(row.section_title),
    status: row.status as DossierSignoffRecord["status"],
    clientNotes: row.client_notes ? String(row.client_notes) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? safeIsoDateOrNull(row.approved_at) : null,
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapMonument(row: Record<string, unknown>): MonumentRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    visitingHours: String(row.visiting_hours),
    closedNote: String(row.closed_note),
    historicalContext: row.historical_context ? String(row.historical_context) : null,
    sortOrder: num(row.sort_order),
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapPetTaxiPolicy(row: Record<string, unknown>): PetTaxiPolicyRecord {
  return {
    id: String(row.id),
    isOffered: Boolean(row.is_offered),
    seatProtectionNote: String(row.seat_protection_note),
    breedRestrictionNote: String(row.breed_restriction_note),
    comfortStopNote: String(row.comfort_stop_note),
    bookingInstruction: String(row.booking_instruction),
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapRouteCatalog(row: Record<string, unknown>): RouteCatalogRecord {
  return {
    id: String(row.id),
    tripType: (row.trip_type as RouteCatalogRecord["tripType"]) ?? "one-way",
    sourceCity: String(row.source_city ?? row.origin_name ?? ""),
    sourceDetail: row.source_detail ? String(row.source_detail) : null,
    destinationCity: row.destination_city ? String(row.destination_city) : (row.destination_name ? String(row.destination_name) : null),
    slug: String(row.slug ?? row.code ?? ""),
    distanceKm: row.distance_km === null || row.distance_km === undefined ? null : num(row.distance_km),
    durationText: row.duration_text ? String(row.duration_text) : (row.duration_minutes ? `${row.duration_minutes} mins` : null),
    availableFleets: (row.available_fleets as string[]) ?? [],
    faresInr: (row.fares_inr as Record<string, number>) ?? {},
    driverChargeInr: row.driver_charge_inr !== null && row.driver_charge_inr !== undefined ? num(row.driver_charge_inr) : null,
    nightHaltInr: row.night_halt_inr !== null && row.night_halt_inr !== undefined ? num(row.night_halt_inr) : null,
    tollIncluded: row.toll_included === null || row.toll_included === undefined ? null : Boolean(row.toll_included),
    tollAmountInr: row.toll_amount_inr === null || row.toll_amount_inr === undefined ? null : num(row.toll_amount_inr),
    interstateCharges: (row.interstate_charges as RouteCatalogRecord["interstateCharges"]) ?? [],
    minKmPerDay: row.min_km_per_day !== null && row.min_km_per_day !== undefined ? num(row.min_km_per_day) : null,
    stops: (row.stops as RouteCatalogRecord["stops"]) ?? [],
    usePerKm: row.use_per_km === null || row.use_per_km === undefined ? null : Boolean(row.use_per_km),
    perKmRateOverride: row.per_km_rate_override === null || row.per_km_rate_override === undefined ? null : num(row.per_km_rate_override),
    highway: row.highway ? String(row.highway) : null,
    allInclusiveNote: row.all_inclusive_note ? String(row.all_inclusive_note) : (row.description ? String(row.description) : null),
    status: (row.status as RouteCatalogRecord["status"]) ?? "draft",
    needsReview: Boolean(row.needs_review ?? false),
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapRentalEnquiry(row: Record<string, unknown>): RentalEnquiryRecord {
  return {
    id: String(row.id),
    ref: String(row.ref),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    carTier: (row.car_tier as RentalEnquiryRecord["carTier"]) ?? null,
    vehicleGroupCode: (row.vehicle_group_code as RentalEnquiryRecord["vehicleGroupCode"]) ?? null,
    vehicleModelId: row.vehicle_model_id ? String(row.vehicle_model_id) : null,
    vehicleModelName: row.vehicle_model_name ? String(row.vehicle_model_name) : null,
    vehicleGroupName: row.vehicle_group_name ? String(row.vehicle_group_name) : null,
    destinationOrItinerary: row.destination_or_itinerary ? String(row.destination_or_itinerary) : null,
    passengers: row.passengers != null ? Number(row.passengers) : null,
    pickupDate: String(row.pickup_date).slice(0, 10),
    returnDate: String(row.return_date).slice(0, 10),
    pickupLocation: String(row.pickup_location),
    withDriver: Boolean(row.with_driver),
    note: row.note ? String(row.note) : null,
    status: row.status as RentalEnquiryRecord["status"],
    notes: (row.notes as string[]) ?? [],
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at, safeIsoDate(row.created_at)),
  };
}

function mapBooking(row: Record<string, unknown>): BookingRecord {
  const breakdown = (row.fare_breakdown && typeof row.fare_breakdown === "object"
    ? row.fare_breakdown
    : (typeof row.fare_breakdown === "string" ? JSON.parse(row.fare_breakdown) : {})) as Record<string, any>;
  const vehicle = breakdown.vehicle ?? {};
  const details = breakdown.details ?? {};
  // Fail-closed validation on canonical financial columns
  let totalAmount: number;
  if (row.total_amount !== undefined && row.total_amount !== null) {
    totalAmount = num(row.total_amount);
  } else if (row.total_fare !== undefined && row.total_fare !== null) {
    totalAmount = num(row.total_fare);
  } else if (breakdown.total !== undefined && breakdown.total !== null) {
    totalAmount = num(breakdown.total);
  } else {
    throw new AppError("DATA_CORRUPTION", `Booking ${String(row.id ?? "unknown")} has missing total amount`, 500);
  }

  if (isNaN(totalAmount) || totalAmount <= 0) {
    throw new AppError("DATA_CORRUPTION", `Booking ${String(row.id ?? "unknown")} has invalid total amount: ${totalAmount}`, 500);
  }

  let advanceAmount: number;
  if (row.advance_amount !== undefined && row.advance_amount !== null) {
    advanceAmount = num(row.advance_amount);
  } else if (breakdown.advance !== undefined && breakdown.advance !== null) {
    advanceAmount = num(breakdown.advance);
  } else {
    throw new AppError("DATA_CORRUPTION", `Booking ${String(row.id ?? "unknown")} has missing advance amount`, 500);
  }

  if (isNaN(advanceAmount) || advanceAmount < 0 || advanceAmount > totalAmount) {
    throw new AppError("DATA_CORRUPTION", `Booking ${String(row.id ?? "unknown")} has invalid advance amount: ${advanceAmount}`, 500);
  }

  let balanceAmount: number;
  if (row.balance_amount !== undefined && row.balance_amount !== null) {
    balanceAmount = num(row.balance_amount);
  } else if (breakdown.balance !== undefined && breakdown.balance !== null) {
    balanceAmount = num(breakdown.balance);
  } else {
    balanceAmount = Math.max(0, totalAmount - advanceAmount);
  }

  if (isNaN(balanceAmount) || balanceAmount < 0 || (advanceAmount + balanceAmount !== totalAmount)) {
    throw new AppError("DATA_CORRUPTION", `Booking ${String(row.id ?? "unknown")} balance amount violates INV-3: total=${totalAmount}, advance=${advanceAmount}, balance=${balanceAmount}`, 500);
  }
  const distanceKm = num(row.distance_km ?? details.distance_km ?? 0);
  const tripType = (row.trip_type as BookingRecord["tripType"]) ?? (details.effective_trip_type as BookingRecord["tripType"]) ?? "one_way";
  const vehicleTier = (row.vehicle_tier as BookingRecord["vehicleTier"]) ?? (vehicle.group_code as BookingRecord["vehicleTier"]) ?? "sedan";
  const originName = row.origin_name ? String(row.origin_name) : (details.origin ? String(details.origin) : (row.pickup_address ? String(row.pickup_address) : null));
  const destinationName = row.destination_name ? String(row.destination_name) : (details.destination ? String(details.destination) : (row.drop_address ? String(row.drop_address) : null));
  const pickupDatetime = safeIsoDate(row.pickup_datetime ?? row.pickup_at);
  const returnDatetime = safeIsoDateOrNull(row.return_datetime ?? row.return_at);

  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    userId: row.user_id ? String(row.user_id) : null,
    guestAccessToken: String(row.guest_access_token ?? ""),
    tripType,
    vehicleTier,
    originName,
    destinationName,
    bookingSelection: row.booking_selection && typeof row.booking_selection === "object"
      ? (row.booking_selection as BookingRecord["bookingSelection"])
      : null,
    selectedCatalogItemId: row.selected_catalog_item_id
      ? String(row.selected_catalog_item_id)
      : (row.route_id ? String(row.route_id) : (row.local_package_id ? String(row.local_package_id) : (row.transfer_id ? String(row.transfer_id) : (row.tour_package_id ? String(row.tour_package_id) : null)))),
    pickupAddress: String(row.pickup_address ?? ""),
    dropAddress: row.drop_address ? String(row.drop_address) : null,
    pickupDatetime,
    returnDatetime,
    flightTrainNumber: row.flight_train_number ? String(row.flight_train_number) : null,
    distanceKm,
    customerName: String(row.customer_name ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    baseFare: num(row.base_fare ?? totalAmount),
    nightAllowance: num(row.night_allowance ?? 0),
    driverAllowance: num(row.driver_allowance ?? 0),
    discountAmount: num(row.discount_amount ?? 0),
    promoCode: row.promo_code ? String(row.promo_code) : null,
    totalFare: totalAmount,
    advanceAmount,
    balanceAmount,
    fareRulesVersion: String(row.fare_rules_version ?? "2.0"),
    fareSnapshot: (row.fare_snapshot as BookingRecord["fareSnapshot"]) ?? {
      baseFare: num(row.base_fare ?? totalAmount),
      nightAllowance: num(row.night_allowance ?? 0),
      driverAllowance: num(row.driver_allowance ?? 0),
      discountAmount: num(row.discount_amount ?? 0),
      totalFare: totalAmount,
      advanceAmount,
      balanceAmount,
      currency: "INR",
      fareVersion: String(row.fare_rules_version ?? "2.0"),
      label: `${originName ?? ""} → ${destinationName ?? ""}`,
      duration: details.duration_minutes ? `${details.duration_minutes} mins` : "",
      distanceKm,
      tripType,
      vehicleTier,
      promoCode: row.promo_code ? String(row.promo_code) : null,
      promoValid: Boolean(row.promo_code),
      roundMultiplierApplied: false,
      rules: [],
    },
    status: (row.status as BookingRecord["status"]) ?? "pending_payment",
    version: num(row.version ?? 1),
    specialNotes: row.special_notes ? String(row.special_notes) : null,
    packageId: row.package_id ? String(row.package_id) : (row.local_package_id ? String(row.local_package_id) : (row.tour_package_id ? String(row.tour_package_id) : null)),
    createdAt: safeIsoDate(row.created_at),
    updatedAt: safeIsoDate(row.updated_at ?? row.created_at),
  };
}

function mapBookingIntent(row: Record<string, unknown>): BookingIntentRecord {
  return {
    id: String(row.id),
    idempotencyKey: String(row.idempotency_key),
    resumeSecretHash: String(row.resume_secret_hash),
    payload: row.payload,
    quote: row.quote as BookingIntentRecord["quote"],
    quoteTotalFare: num(row.quote_total_fare),
    quoteAdvanceAmount: num(row.quote_advance_amount),
    quoteBalanceAmount: num(row.quote_balance_amount),
    fareReconfirmationPending: Boolean(row.fare_reconfirmation_pending),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    consumedAt: row.consumed_at ? new Date(String(row.consumed_at)).toISOString() : null,
    claimedUserId: row.claimed_user_id ? String(row.claimed_user_id) : null,
    resultingBookingId: row.resulting_booking_id ? String(row.resulting_booking_id) : null,
  };
}

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  // Fail-closed validation on canonical payment columns
  let amountPaise: number;
  if (row.amount_paise !== undefined && row.amount_paise !== null) {
    amountPaise = num(row.amount_paise);
  } else if (row.inr_amount_paise !== undefined && row.inr_amount_paise !== null) {
    amountPaise = num(row.inr_amount_paise);
  } else if (row.amount_minor !== undefined && row.amount_minor !== null) {
    amountPaise = num(row.amount_minor);
  } else {
    throw new AppError("DATA_CORRUPTION", `Payment ${String(row.id ?? "unknown")} has missing amount_paise`, 500);
  }

  if (isNaN(amountPaise) || amountPaise <= 0) {
    throw new AppError("DATA_CORRUPTION", `Payment ${String(row.id ?? "unknown")} has non-positive amount_paise: ${amountPaise}`, 500);
  }
  const nowIso = new Date().toISOString();
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    provider: (row.provider as PaymentRecord["provider"]) ?? "razorpay",
    providerOrderId: String(row.provider_order_id ?? ""),
    providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : null,
    checkoutSessionId: row.checkout_session_id ? String(row.checkout_session_id) : null,
    checkoutUrl: row.checkout_url ? String(row.checkout_url) : null,
    publicClientToken: row.public_client_token ? String(row.public_client_token) : null,
    amountMinor: amountPaise,
    currency: (row.currency as PaymentRecord["currency"]) ?? "INR",
    inrAmountPaise: amountPaise,
    status: (row.status as PaymentRecord["status"]) ?? "pending",
    paymentMethod: row.payment_method ? String(row.payment_method) : null,
    feeMinor: num(row.fee_minor ?? 0),
    taxMinor: num(row.tax_minor ?? 0),
    idempotencyKey: String(row.idempotency_key ?? row.provider_order_id ?? row.id),
    webhookEventId: row.webhook_event_id ? String(row.webhook_event_id) : null,
    reconciliationStatus: (row.reconciliation_status as PaymentRecord["reconciliationStatus"]) ?? "pending",
    failureReason: row.failure_reason ? String(row.failure_reason) : null,
    verifiedAt: safeIsoDateOrNull(row.verified_at),
    expiresAt: safeIsoDate(row.expires_at ?? row.created_at, nowIso),
    createdAt: safeIsoDate(row.created_at, nowIso),
    updatedAt: safeIsoDate(row.updated_at ?? row.created_at, nowIso),
  };
}

function mapInquiry(row: Record<string, unknown>): InquiryRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    message: String(row.message),
    tripInterest: row.trip_interest ? String(row.trip_interest) : null,
    status: (row.status ? String(row.status) : "new") as InquiryRecord["status"],
    notes: Array.isArray(row.notes) ? (row.notes as string[]) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at ?? row.created_at)).toISOString(),
  };
}

const ROUTE_CATALOG_BASE_SELECT = `
SELECT
  r.*,
  'one-way' as trip_type,
  r.origin_name as source_city,
  null as source_detail,
  r.destination_name as destination_city,
  r.code as slug,
  case when r.duration_minutes is not null then concat(r.duration_minutes, ' mins') else null end as duration_text,
  coalesce(
    (
      select jsonb_agg(distinct coalesce(lower(replace(vm.model_name, ' ', '-')), replace(vg.code, '_', '-')))
      from outstation_route_vehicles orv
      join vehicle_models vm on orv.vehicle_model_id = vm.id
      left join vehicle_groups vg on vm.vehicle_group_id = vg.id
      where orv.route_id = r.id and orv.is_active = true and orv.one_way_amount is not null
    ),
    '[]'::jsonb
  ) as available_fleets,
  coalesce(
    (
      select jsonb_object_agg(sub.k, sub.v)
      from (
        select lower(replace(vm.model_name, ' ', '-')) as k, orv.one_way_amount as v
        from outstation_route_vehicles orv
        join vehicle_models vm on orv.vehicle_model_id = vm.id
        where orv.route_id = r.id and orv.is_active = true and orv.one_way_amount is not null
        order by vm.sort_order asc
      ) sub
    ),
    '{}'::jsonb
  ) as fares_inr,
  null as driver_charge_inr,
  null as night_halt_inr,
  null as toll_included,
  null as toll_amount_inr,
  '[]'::jsonb as interstate_charges,
  null as min_km_per_day,
  '[]'::jsonb as stops,
  false as use_per_km,
  null as per_km_rate_override,
  null as highway,
  r.description as all_inclusive_note,
  false as needs_review
FROM outstation_routes r
`;

const TRANSFER_ROUTES_BASE_SELECT = `
SELECT
  t.*,
  t.code as route_code,
  concat(t.pickup_name, ' to ', t.drop_name) as direction_note,
  null as distance_text,
  false as use_per_km,
  null as night_charge_inr,
  (t.status = 'published') as is_active,
  coalesce(
    (
      select jsonb_object_agg(sub.k, sub.v)
      from (
        select lower(replace(vm.model_name, ' ', '-')) as k, fr.amount as v
        from fare_rules fr
        join vehicle_models vm on fr.vehicle_model_id = vm.id
        where fr.transfer_id = t.id and fr.category = 'transfer' and fr.is_active = true
        order by vm.sort_order asc
      ) sub
    ),
    '{}'::jsonb
  ) as fleet_prices
FROM transfers t
`;

const LOCAL_PACKAGES_BASE_SELECT = `
SELECT
  lp.*,
  lp.code as package_code,
  lp.inclusions_note as parking_note,
  false as use_per_km,
  null as extra_rates,
  null as night_charge_inr,
  (lp.status = 'published') as is_active,
  coalesce(
    (
      select jsonb_object_agg(sub.k, sub.v)
      from (
        select lower(replace(vm.model_name, ' ', '-')) as k, fr.amount as v
        from fare_rules fr
        join vehicle_models vm on fr.vehicle_model_id = vm.id
        where fr.local_package_id = lp.id and fr.category = 'local_package' and fr.is_active = true
        order by vm.sort_order asc
      ) sub
    ),
    '{}'::jsonb
  ) as fleet_prices
FROM local_packages lp
`;

const TOUR_PACKAGES_BASE_SELECT = `
SELECT
  tp.*,
  tp.code as package_code,
  null as base_tier_code,
  (
    select min(fr.amount)
    from fare_rules fr
    where fr.tour_package_id = tp.id and fr.category = 'tour_package' and fr.is_active = true
  ) as starting_price_inr,
  null as night_charge_inr,
  (tp.status = 'published') as is_active,
  coalesce(
    (
      select jsonb_object_agg(sub.k, sub.v)
      from (
        select lower(replace(vm.model_name, ' ', '-')) as k, fr.amount as v
        from fare_rules fr
        join vehicle_models vm on fr.vehicle_model_id = vm.id
        where fr.tour_package_id = tp.id and fr.category = 'tour_package' and fr.is_active = true
        order by vm.sort_order asc
      ) sub
    ),
    '{}'::jsonb
  ) as fleet_prices
FROM tour_packages tp
`;

export async function createPostgresRepositories(databaseUrl: string): Promise<Repositories> {
  const pool = new pg.Pool(createPoolConfig(databaseUrl));

  pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client:", err);
  });

  async function query<T extends Record<string, unknown>>(
    client: pg.Pool | PoolClient,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result = await client.query(sql, params);
    return result.rows as T[];
  }

  async function resolveVehicleModelId(client: pg.Pool | PoolClient, key: string): Promise<string | null> {
    const normalized = key.trim().toLowerCase().replace(/[\s_]+/g, "-");
    const rows = await query<{ id: string }>(
      client,
      `SELECT vm.id
       FROM vehicle_models vm
       LEFT JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
       WHERE vm.id::text = $1
          OR lower(replace(vm.model_name, ' ', '-')) = $2
          OR lower(replace(vm.display_name, ' ', '-')) = $2
          OR lower(replace(vg.code, '_', '-')) = $2
       ORDER BY vm.sort_order ASC
       LIMIT 1`,
      [isUuid(key) ? key : "00000000-0000-0000-0000-000000000000", normalized]
    );
    return rows[0]?.id ?? null;
  }

  const repos: Repositories = {
    pool,
    async healthCheck() {
      try {
        const result = await pool.query("select 1 as ok");
        return result.rowCount === 1;
      } catch {
        return false;
      }
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        // Use REPEATABLE READ to prevent phantom reads for payment and assignment flows
        await client.query("begin isolation level repeatable read");
        const bound = createBound(client);
        const transactional: Repositories = {
          healthCheck: async () => true,
          transaction: async (inner) => inner(transactional),
          ...bound,
        };
        const result = await fn(transactional);
        await client.query("commit");
        return result;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
    ...createBound(pool),
  };

  function createBound(client: pg.Pool | PoolClient): Omit<Repositories, "healthCheck" | "transaction"> {
    return {
      bookings: {
        async create(record: BookingRecord) {
          const breakdown = record.fareSnapshot ?? {};
          const rows = await query(
            client,
            `insert into bookings (
              id, ticket_id, user_id, guest_access_token, customer_name, customer_phone,
              customer_email, category, vehicle_model_id, passenger_count, route_id,
              local_package_id, transfer_id, tour_package_id, trip_type, pickup_at,
              return_at, pickup_address, drop_address, flight_train_number, special_notes,
              fare_breakdown, total_amount, advance_amount, status, created_at, updated_at
            ) values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24, $25, $26, $27
            ) returning *`,
            [
              record.id,
              record.ticketId,
              record.userId,
              record.guestAccessToken,
              record.customerName,
              record.customerPhone,
              record.customerEmail,
              (record.bookingSelection?.kind === "package" ? "tour_package" : (record.bookingSelection?.kind === "local" ? "local_package" : "outstation")),
              (record.bookingSelection as { vehicleModelId?: string } | null | undefined)?.vehicleModelId ?? "10000000-0000-0000-0002-000000000001",
              1,
              isUuid(record.selectedCatalogItemId) ? record.selectedCatalogItemId : null,
              null,
              null,
              null,
              record.tripType === "round-trip" ? "round_trip" : "one_way",
              record.pickupDatetime,
              record.returnDatetime,
              record.pickupAddress,
              record.dropAddress,
              record.flightTrainNumber,
              record.specialNotes,
              JSON.stringify(breakdown),
              record.totalFare,
              record.advanceAmount,
              record.status,
              record.createdAt,
              record.updatedAt,
            ],
          );
          return mapBooking(rows[0]!);
        },
        async update(record: BookingRecord) {
          const rows = await query(
            client,
            `update bookings set
              status=$2, customer_name=$3, customer_phone=$4, customer_email=$5,
              pickup_address=$6, drop_address=$7, flight_train_number=$8,
              special_notes=$9, updated_at=$10
              where id=$1 returning *`,
            [
              record.id,
              record.status,
              record.customerName,
              record.customerPhone,
              record.customerEmail,
              record.pickupAddress,
              record.dropAddress,
              record.flightTrainNumber,
              record.specialNotes,
              record.updatedAt,
            ],
          );
          if (!rows[0]) {
            throw new Error("booking update failed: not found");
          }
          return mapBooking(rows[0]);
        },
        async getById(id: string) {
          // Use FOR UPDATE when inside transaction to lock row
          const isTx = "release" in client && typeof (client as { release?: unknown }).release === "function";
          const sql = isTx ? "select * from bookings where id=$1 for update" : "select * from bookings where id=$1";
          const rows = await query(client, sql, [id]);
          return rows[0] ? mapBooking(rows[0]) : null;
        },
        async getByTicketId(ticketId: string) {
          const rows = await query(client, "select * from bookings where ticket_id=$1", [ticketId]);
          return rows[0] ? mapBooking(rows[0]) : null;
        },
        async ticketExists(ticketId: string) {
          const rows = await query(client, "select 1 from bookings where ticket_id=$1", [ticketId]);
          return rows.length > 0;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter.ticketId) {
            params.push(filter.ticketId);
            clauses.push(`ticket_id=$${params.length}`);
          }
          if (filter.from) {
            params.push(filter.from);
            clauses.push(`COALESCE(pickup_at, created_at) >= $${params.length}`);
          }
          if (filter.to) {
            params.push(filter.to);
            clauses.push(`COALESCE(pickup_at, created_at) <= $${params.length}`);
          }
          if (filter.userId) {
            params.push(filter.userId);
            clauses.push(`user_id=$${params.length}`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const countRows = await query(client, `select count(*)::int as total from bookings ${where}`, params);
          const page = filter.page ?? 1;
          const pageSize = filter.pageSize ?? 20;
          params.push(pageSize, (page - 1) * pageSize);
          const rows = await query(
            client,
            `select * from bookings ${where} order by created_at desc limit $${params.length - 1} offset $${params.length}`,
            params,
          );
          return { items: rows.map(mapBooking), total: num(countRows[0]?.total ?? 0) };
        },
        async listByPhone(phone: string, options: { from: string }) {
          const digits = phone.replace(/\D/g, "");
          const suffix = digits.slice(-10);
          const rows = await query(
            client,
            `select * from bookings where created_at >= $1 and (customer_phone = $2 or customer_phone like $3) order by created_at desc`,
            [options.from, phone, `%${suffix}`],
          );
          const items = rows.map(mapBooking);
          return items.filter((item) => phonesMatch(item.customerPhone, phone));
        },
      },
      bookingIntents: {
        async create(record: BookingIntentRecord) {
          const rows = await query(client, `insert into customer_booking_intents
            (id, idempotency_key, resume_secret_hash, payload, quote, quote_total_fare,
             quote_advance_amount, quote_balance_amount, fare_reconfirmation_pending, expires_at, created_at, updated_at,
             consumed_at, claimed_user_id, resulting_booking_id)
            values ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`,
            [record.id, record.idempotencyKey, record.resumeSecretHash, JSON.stringify(record.payload), JSON.stringify(record.quote),
             record.quoteTotalFare, record.quoteAdvanceAmount, record.quoteBalanceAmount, record.fareReconfirmationPending, record.expiresAt, record.createdAt,
             record.updatedAt, record.consumedAt, record.claimedUserId, record.resultingBookingId]);
          return mapBookingIntent(rows[0]!);
        },
        async update(record: BookingIntentRecord) {
          const rows = await query(client, `update customer_booking_intents set
            resume_secret_hash=$2, payload=$3::jsonb, quote=$4::jsonb, quote_total_fare=$5, quote_advance_amount=$6,
            quote_balance_amount=$7, expires_at=$8, updated_at=$9, consumed_at=$10,
            claimed_user_id=$11, resulting_booking_id=$12, fare_reconfirmation_pending=$13 where id=$1 returning *`,
            [record.id, record.resumeSecretHash, JSON.stringify(record.payload), JSON.stringify(record.quote), record.quoteTotalFare,
             record.quoteAdvanceAmount, record.quoteBalanceAmount, record.expiresAt, record.updatedAt,
             record.consumedAt, record.claimedUserId, record.resultingBookingId, record.fareReconfirmationPending]);
          if (!rows[0]) throw new Error("booking intent update failed");
          return mapBookingIntent(rows[0]);
        },
        async getById(id: string) {
          const isTx = "release" in client && typeof (client as { release?: unknown }).release === "function";
          const rows = await query(client, isTx ? "select * from customer_booking_intents where id=$1 for update" : "select * from customer_booking_intents where id=$1", [id]);
          return rows[0] ? mapBookingIntent(rows[0]) : null;
        },
        async getByIdempotencyKey(key: string) {
          const rows = await query(client, "select * from customer_booking_intents where idempotency_key=$1", [key]);
          return rows[0] ? mapBookingIntent(rows[0]) : null;
        },
      },
      payments: {
        async create(record: PaymentRecord) {
          const rows = await query(
            client,
            `insert into payments (
              id, booking_id, provider, provider_order_id, provider_payment_id,
              amount_paise, status, failure_reason, created_at, updated_at
            ) values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) returning *`,
            [
              record.id,
              record.bookingId,
              record.provider,
              record.providerOrderId,
              record.providerPaymentId,
              record.amountMinor || record.inrAmountPaise,
              record.status,
              record.failureReason,
              record.createdAt,
              record.updatedAt,
            ],
          );
          return mapPayment(rows[0]!);
        },
        async update(record: PaymentRecord) {
          const rows = await query(
            client,
            `update payments set
              provider_payment_id=$2, status=$3, failure_reason=$4, updated_at=$5
              where id=$1 returning *`,
            [
              record.id,
              record.providerPaymentId,
              record.status,
              record.failureReason,
              record.updatedAt,
            ],
          );
          if (!rows[0]) throw new Error("payment update failed");
          return mapPayment(rows[0]!);
        },
        async getById(id: string) {
          const isTx = "release" in client && typeof (client as { release?: unknown }).release === "function";
          const sql = isTx ? "select * from payments where id=$1 for update" : "select * from payments where id=$1";
          const rows = await query(client, sql, [id]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async getByIdempotencyKey(key: string) {
          const rows = await query(client, "select * from payments where provider_order_id=$1", [key]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async getByProviderOrderId(providerOrderId: string) {
          const rows = await query(client, "select * from payments where provider_order_id=$1", [providerOrderId]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async getByProviderPaymentId(providerPaymentId: string) {
          const rows = await query(client, "select * from payments where provider_payment_id=$1", [providerPaymentId]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async listByBookingId(bookingId: string) {
          const rows = await query(client, "select * from payments where booking_id=$1 order by created_at desc", [bookingId]);
          return rows.map(mapPayment);
        },
        async getOpenByBookingId(bookingId: string) {
          const rows = await query(
            client,
            "select * from payments where booking_id=$1 and status='pending' order by created_at desc limit 1 for update",
            [bookingId],
          );
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async list(filter?: PaymentListFilter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter?.bookingId) {
            params.push(filter.bookingId);
            clauses.push(`booking_id=$${params.length}`);
          }
          if (filter?.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter?.provider) {
            params.push(filter.provider);
            clauses.push(`provider=$${params.length}`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const aggRows = await query(
            client,
            `select
               count(*)::int as total,
               coalesce(sum(case when status='captured' then amount_paise else 0 end), 0)::bigint as total_captured,
               coalesce(sum(case when status='refunded' then amount_paise else 0 end), 0)::bigint as total_refunded
             from payments ${where}`,
            params,
          );
          const page = filter?.page ?? 1;
          const pageSize = filter?.limit ?? 50;
          const offset = (page - 1) * pageSize;
          const queryParams = [...params, pageSize, offset];
          const rows = await query(
            client,
            `select * from payments ${where} order by created_at desc limit $${queryParams.length - 1} offset $${queryParams.length}`,
            queryParams,
          );
          return {
            items: rows.map(mapPayment),
            total: num(aggRows[0]?.total ?? 0),
            totalCapturedPaise: num(aggRows[0]?.total_captured ?? 0),
            totalRefundedPaise: num(aggRows[0]?.total_refunded ?? 0),
          };
        },
      },
      refunds: {
        async create(record: RefundRecord) {
          await query(
            client,
            `insert into refunds (id, payment_id, booking_id, provider_refund_id, amount_minor, currency, reason, status, idempotency_key, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              record.id, record.paymentId, record.bookingId, record.providerRefundId, record.amountMinor,
              record.currency, record.reason, record.status, record.idempotencyKey, record.createdAt,
            ],
          );
          return record;
        },
        async update(record: RefundRecord) {
          await query(
            client,
            `update refunds set provider_refund_id=$2, amount_minor=$3, currency=$4, reason=$5, status=$6 where id=$1`,
            [record.id, record.providerRefundId, record.amountMinor, record.currency, record.reason, record.status],
          );
          return record;
        },
        async getByIdempotencyKey(key: string) {
          const rows = await query(client, "select * from refunds where idempotency_key=$1", [key]);
          const row = rows[0];
          if (!row) return null;
          return {
            id: String(row.id),
            paymentId: String(row.payment_id),
            bookingId: String(row.booking_id),
            providerRefundId: row.provider_refund_id ? String(row.provider_refund_id) : null,
            amountMinor: num(row.amount_minor),
            currency: row.currency as RefundRecord["currency"],
            reason: String(row.reason),
            status: row.status as RefundRecord["status"],
            idempotencyKey: String(row.idempotency_key),
            createdAt: new Date(String(row.created_at)).toISOString(),
          };
        },
        async getByProviderRefundId(providerRefundId: string) {
          const rows = await query(client, "select * from refunds where provider_refund_id=$1", [providerRefundId]);
          const row = rows[0];
          if (!row) return null;
          return {
            id: String(row.id),
            paymentId: String(row.payment_id),
            bookingId: String(row.booking_id),
            providerRefundId: row.provider_refund_id ? String(row.provider_refund_id) : null,
            amountMinor: num(row.amount_minor),
            currency: row.currency as RefundRecord["currency"],
            reason: String(row.reason),
            status: row.status as RefundRecord["status"],
            idempotencyKey: String(row.idempotency_key),
            createdAt: new Date(String(row.created_at)).toISOString(),
          };
        },
        async listByBookingId(bookingId: string) {
          const rows = await query(client, "select * from refunds where booking_id=$1 order by created_at desc", [bookingId]);
          return rows.map((row) => ({
            id: String(row.id),
            paymentId: String(row.payment_id),
            bookingId: String(row.booking_id),
            providerRefundId: row.provider_refund_id ? String(row.provider_refund_id) : null,
            amountMinor: num(row.amount_minor),
            currency: row.currency as RefundRecord["currency"],
            reason: String(row.reason),
            status: row.status as RefundRecord["status"],
            idempotencyKey: String(row.idempotency_key),
            createdAt: new Date(String(row.created_at)).toISOString(),
          }));
        },
      },

      profiles: {
        async getById(id: string) {
          const rows = await query(client, "select * from profiles where id=$1", [id]);
          const row = rows[0];
          if (!row) return null;
          return mapProfile(row);
        },
        async getByRole(role) {
          const rows = await query(client, "select * from profiles where role=$1", [role]);
          return rows.map(mapProfile);
        },
        async upsert(record: ProfileRecord) {
          await query(
            client,
            `insert into profiles (id, full_name, phone, email, role, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7)
             on conflict (id) do update set full_name=excluded.full_name, phone=excluded.phone, email=excluded.email, role=excluded.role, updated_at=excluded.updated_at`,
            [record.id, record.fullName, record.phone, record.email, record.role, record.createdAt, record.updatedAt],
          );
          return record;
        },
      },
      routeCatalog: {
        async create(record: RouteCatalogRecord) {
          const durationMins = record.durationText ? parseInt(record.durationText, 10) || null : null;
          const rows = await query<{ id: string }>(
            client,
            `insert into outstation_routes (id, code, origin_name, destination_name, distance_km, duration_minutes, description, status, created_at, updated_at)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             on conflict (code) do update set
               origin_name = excluded.origin_name,
               destination_name = excluded.destination_name,
               distance_km = excluded.distance_km,
               duration_minutes = excluded.duration_minutes,
               description = excluded.description,
               status = excluded.status,
               updated_at = excluded.updated_at
             returning id`,
            [
              record.id,
              record.slug,
              record.sourceCity,
              record.destinationCity ?? record.sourceCity,
              record.distanceKm,
              durationMins,
              record.allInclusiveNote,
              record.status,
              record.createdAt,
              record.updatedAt,
            ],
          );
          const routeId = rows[0]?.id ?? record.id;
          if (record.faresInr && typeof record.faresInr === "object" && isUuid(routeId)) {
            for (const [key, amount] of Object.entries(record.faresInr)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  await query(
                    client,
                    `insert into outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
                     values ($1, $2, $3, true, true)
                     on conflict (route_id, vehicle_model_id) do update set
                       one_way_amount = excluded.one_way_amount,
                       is_active = true`,
                    [routeId, modelId, Math.round(amount)]
                  );
                }
              }
            }
          }
          return record;
        },
        async update(record: RouteCatalogRecord) {
          const durationMins = record.durationText ? parseInt(record.durationText, 10) || null : null;
          const rows = isUuid(record.id)
            ? await query<{ id: string }>(
                client,
                `update outstation_routes set
                   code = $2,
                   origin_name = $3,
                   destination_name = $4,
                   distance_km = $5,
                   duration_minutes = $6,
                   description = $7,
                   status = $8,
                   updated_at = $9
                 where id = $1::uuid
                 returning id`,
                [
                  record.id,
                  record.slug,
                  record.sourceCity,
                  record.destinationCity ?? record.sourceCity,
                  record.distanceKm,
                  durationMins,
                  record.allInclusiveNote,
                  record.status,
                  record.updatedAt,
                ],
              )
            : await query<{ id: string }>(
                client,
                `update outstation_routes set
                   origin_name = $2,
                   destination_name = $3,
                   distance_km = $4,
                   duration_minutes = $5,
                   description = $6,
                   status = $7,
                   updated_at = $8
                 where code = $1
                 returning id`,
                [
                  record.slug,
                  record.sourceCity,
                  record.destinationCity ?? record.sourceCity,
                  record.distanceKm,
                  durationMins,
                  record.allInclusiveNote,
                  record.status,
                  record.updatedAt,
                ],
              );
          const routeId = rows[0]?.id ?? record.id;
          if (record.faresInr && typeof record.faresInr === "object" && isUuid(routeId)) {
            for (const [key, amount] of Object.entries(record.faresInr)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  await query(
                    client,
                    `insert into outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
                     values ($1, $2, $3, true, true)
                     on conflict (route_id, vehicle_model_id) do update set
                       one_way_amount = excluded.one_way_amount,
                       is_active = true`,
                    [routeId, modelId, Math.round(amount)]
                  );
                }
              }
            }
          }
          return record;
        },
        async getById(id: string) {
          if (!isUuid(id)) return null;
          const rows = await query(client, `${ROUTE_CATALOG_BASE_SELECT} where r.id = $1::uuid`, [id]);
          return rows[0] ? mapRouteCatalog(rows[0]) : null;
        },
        async getBySlug(slug: string) {
          const rows = await query(client, `${ROUTE_CATALOG_BASE_SELECT} where r.code = $1`, [slug]);
          return rows[0] ? mapRouteCatalog(rows[0]) : null;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`r.status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(r.origin_name ilike $${params.length} or coalesce(r.destination_name, '') ilike $${params.length} or r.code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `${ROUTE_CATALOG_BASE_SELECT} ${where} order by r.created_at desc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapRouteCatalog), total: rows.length };
        },
        async delete(id: string) {
          if (isUuid(id)) {
            await query(client, "delete from outstation_routes where id = $1::uuid", [id]);
          } else {
            await query(client, "delete from outstation_routes where code = $1", [id]);
          }
        },
      },
      tourPackages: {
        async create(record: TourPackageRecord) {
          const rows = await query<{ id: string }>(
            client,
            `insert into tour_packages (id, code, name, duration_text, days, nights, source, destination, inclusions_highlight, inclusions_note, inclusions, exclusions, itinerary, image_url, gallery, status, created_at, updated_at)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             on conflict (code) do update set
               name = excluded.name,
               duration_text = excluded.duration_text,
               days = excluded.days,
               nights = excluded.nights,
               source = excluded.source,
               destination = excluded.destination,
               inclusions_highlight = excluded.inclusions_highlight,
               inclusions_note = excluded.inclusions_note,
               inclusions = excluded.inclusions,
               exclusions = excluded.exclusions,
               itinerary = excluded.itinerary,
               image_url = excluded.image_url,
               gallery = excluded.gallery,
               status = excluded.status,
               updated_at = excluded.updated_at
             returning id`,
            [
              record.id,
              record.packageCode,
              record.name,
              record.durationText,
              record.days,
              record.nights,
              record.source ?? null,
              record.destination ?? null,
              record.inclusionsHighlight,
              record.inclusionsNote,
              JSON.stringify(record.inclusions ?? []),
              JSON.stringify(record.exclusions ?? []),
              JSON.stringify(record.itinerary ?? []),
              record.imageUrl ?? null,
              JSON.stringify(record.gallery ?? []),
              record.status,
              record.createdAt,
              record.updatedAt,
            ],
          );
          const pkgId = rows[0]?.id ?? record.id;
          if (record.fleetPrices && typeof record.fleetPrices === "object" && isUuid(pkgId)) {
            for (const [key, amount] of Object.entries(record.fleetPrices)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  const updated = await query(
                    client,
                    `update fare_rules set amount = $1, is_active = true
                     where category = 'tour_package' and tour_package_id = $2 and vehicle_model_id = $3 and is_active = true
                     returning id`,
                    [Math.round(amount), pkgId, modelId],
                  );
                  if (updated.length === 0) {
                    await query(
                      client,
                      `insert into fare_rules (category, vehicle_model_id, tour_package_id, amount, is_active)
                       values ('tour_package', $1, $2, $3, true)`,
                      [modelId, pkgId, Math.round(amount)],
                    );
                  }
                }
              }
            }
          }
          return record;
        },
        async update(record: TourPackageRecord) {
          const rows = isUuid(record.id)
            ? await query<{ id: string }>(
                client,
                `update tour_packages set
                   code = $2,
                   name = $3,
                   duration_text = $4,
                   days = $5,
                   nights = $6,
                   source = $7,
                   destination = $8,
                   inclusions_highlight = $9,
                   inclusions_note = $10,
                   inclusions = $11,
                   exclusions = $12,
                   itinerary = $13,
                   image_url = $14,
                   gallery = $15,
                   status = $16,
                   updated_at = $17
                 where id = $1::uuid
                 returning id`,
                [
                  record.id,
                  record.packageCode,
                  record.name,
                  record.durationText,
                  record.days,
                  record.nights,
                  record.source ?? null,
                  record.destination ?? null,
                  record.inclusionsHighlight,
                  record.inclusionsNote,
                  JSON.stringify(record.inclusions ?? []),
                  JSON.stringify(record.exclusions ?? []),
                  JSON.stringify(record.itinerary ?? []),
                  record.imageUrl ?? null,
                  JSON.stringify(record.gallery ?? []),
                  record.status,
                  record.updatedAt,
                ],
              )
            : await query<{ id: string }>(
                client,
                `update tour_packages set
                   name = $2,
                   duration_text = $3,
                   days = $4,
                   nights = $5,
                   source = $6,
                   destination = $7,
                   inclusions_highlight = $8,
                   inclusions_note = $9,
                   inclusions = $10,
                   exclusions = $11,
                   itinerary = $12,
                   image_url = $13,
                   gallery = $14,
                   status = $15,
                   updated_at = $16
                 where code = $1
                 returning id`,
                [
                  record.packageCode,
                  record.name,
                  record.durationText,
                  record.days,
                  record.nights,
                  record.source ?? null,
                  record.destination ?? null,
                  record.inclusionsHighlight,
                  record.inclusionsNote,
                  JSON.stringify(record.inclusions ?? []),
                  JSON.stringify(record.exclusions ?? []),
                  JSON.stringify(record.itinerary ?? []),
                  record.imageUrl ?? null,
                  JSON.stringify(record.gallery ?? []),
                  record.status,
                  record.updatedAt,
                ],
              );
          const pkgId = rows[0]?.id ?? record.id;
          if (record.fleetPrices && typeof record.fleetPrices === "object" && isUuid(pkgId)) {
            for (const [key, amount] of Object.entries(record.fleetPrices)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  const updated = await query(
                    client,
                    `update fare_rules set amount = $1, is_active = true
                     where category = 'tour_package' and tour_package_id = $2 and vehicle_model_id = $3 and is_active = true
                     returning id`,
                    [Math.round(amount), pkgId, modelId],
                  );
                  if (updated.length === 0) {
                    await query(
                      client,
                      `insert into fare_rules (category, vehicle_model_id, tour_package_id, amount, is_active)
                       values ('tour_package', $1, $2, $3, true)`,
                      [modelId, pkgId, Math.round(amount)],
                    );
                  }
                }
              }
            }
          }
          return record;
        },
        async getById(id: string) {
          const rows = isUuid(id)
            ? await query(client, `${TOUR_PACKAGES_BASE_SELECT} where tp.id = $1::uuid`, [id])
            : await query(client, `${TOUR_PACKAGES_BASE_SELECT} where tp.code = $1`, [id]);
          return rows[0] ? mapTourPackage(rows[0]) : null;
        },
        async getByCode(code: string) {
          const rows = isUuid(code)
            ? await query(client, `${TOUR_PACKAGES_BASE_SELECT} where tp.id = $1::uuid or tp.code = $1`, [code])
            : await query(client, `${TOUR_PACKAGES_BASE_SELECT} where tp.code = $1`, [code]);
          return rows[0] ? mapTourPackage(rows[0]) : null;
        },
        async list(filter = {}) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status && filter.status !== "all") {
            params.push(filter.status);
            clauses.push(`tp.status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(tp.name ilike $${params.length} or tp.code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `${TOUR_PACKAGES_BASE_SELECT} ${where} order by tp.created_at asc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapTourPackage), total: rows.length };
        },
        async delete(id: string) {
          if (isUuid(id)) {
            await query(client, "delete from tour_packages where id = $1::uuid", [id]);
          } else {
            await query(client, "delete from tour_packages where code = $1", [id]);
          }
        },
        async listUpgrades(_packageId?: string | null) {
          return [];
        },
        async saveUpgrade(_record: PackageVehicleUpgradeRecord) {
          throw new AppError("UPGRADES_RETIRED", "Package vehicle upgrades were retired in migration 0038. Use fare_rules per vehicle model.", 410);
        },
        async deleteUpgrade(_id: string) {
          throw new AppError("UPGRADES_RETIRED", "Package vehicle upgrades were retired in migration 0038. Use fare_rules per vehicle model.", 410);
        },
      },
      transferRoutes: {
        async create(record: TransferRouteRecord) {
          const rows = await query<{ id: string }>(
            client,
            `insert into transfers (id, code, name, pickup_name, drop_name, description, status, created_at, updated_at)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             on conflict (code) do update set
               name = excluded.name,
               pickup_name = excluded.pickup_name,
               drop_name = excluded.drop_name,
               description = excluded.description,
               status = excluded.status,
               updated_at = excluded.updated_at
             returning id`,
            [
              record.id,
              record.routeCode,
              record.name,
              record.directionNote?.split(" to ")[0] || record.name,
              record.directionNote?.split(" to ")[1] || record.name,
              record.directionNote,
              record.status,
              record.createdAt,
              record.updatedAt,
            ],
          );
          const transferId = rows[0]?.id ?? record.id;
          if (record.fleetPrices && typeof record.fleetPrices === "object" && isUuid(transferId)) {
            for (const [key, amount] of Object.entries(record.fleetPrices)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  const updated = await query(
                    client,
                    `update fare_rules set amount = $1, is_active = true
                     where category = 'transfer' and transfer_id = $2 and vehicle_model_id = $3 and is_active = true
                     returning id`,
                    [Math.round(amount), transferId, modelId],
                  );
                  if (updated.length === 0) {
                    await query(
                      client,
                      `insert into fare_rules (category, vehicle_model_id, transfer_id, amount, is_active)
                       values ('transfer', $1, $2, $3, true)`,
                      [modelId, transferId, Math.round(amount)],
                    );
                  }
                }
              }
            }
          }
          return record;
        },
        async update(record: TransferRouteRecord) {
          const rows = isUuid(record.id)
            ? await query<{ id: string }>(
                client,
                `update transfers set
                   code = $2,
                   name = $3,
                   pickup_name = $4,
                   drop_name = $5,
                   description = $6,
                   status = $7,
                   updated_at = $8
                 where id = $1::uuid
                 returning id`,
                [
                  record.id,
                  record.routeCode,
                  record.name,
                  record.directionNote?.split(" to ")[0] || record.name,
                  record.directionNote?.split(" to ")[1] || record.name,
                  record.directionNote,
                  record.status,
                  record.updatedAt,
                ],
              )
            : await query<{ id: string }>(
                client,
                `update transfers set
                   name = $2,
                   pickup_name = $3,
                   drop_name = $4,
                   description = $5,
                   status = $6,
                   updated_at = $7
                 where code = $1
                 returning id`,
                [
                  record.routeCode,
                  record.name,
                  record.directionNote?.split(" to ")[0] || record.name,
                  record.directionNote?.split(" to ")[1] || record.name,
                  record.directionNote,
                  record.status,
                  record.updatedAt,
                ],
              );
          const transferId = rows[0]?.id ?? record.id;
          if (record.fleetPrices && typeof record.fleetPrices === "object" && isUuid(transferId)) {
            for (const [key, amount] of Object.entries(record.fleetPrices)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  const updated = await query(
                    client,
                    `update fare_rules set amount = $1, is_active = true
                     where category = 'transfer' and transfer_id = $2 and vehicle_model_id = $3 and is_active = true
                     returning id`,
                    [Math.round(amount), transferId, modelId],
                  );
                  if (updated.length === 0) {
                    await query(
                      client,
                      `insert into fare_rules (category, vehicle_model_id, transfer_id, amount, is_active)
                       values ('transfer', $1, $2, $3, true)`,
                      [modelId, transferId, Math.round(amount)],
                    );
                  }
                }
              }
            }
          }
          return record;
        },
        async getById(id: string) {
          if (!isUuid(id)) return null;
          const rows = await query(client, `${TRANSFER_ROUTES_BASE_SELECT} where t.id = $1::uuid`, [id]);
          return rows[0] ? mapTransferRoute(rows[0]) : null;
        },
        async getByCode(code: string) {
          const rows = isUuid(code)
            ? await query(client, `${TRANSFER_ROUTES_BASE_SELECT} where t.id = $1::uuid or t.code = $1`, [code])
            : await query(client, `${TRANSFER_ROUTES_BASE_SELECT} where t.code = $1`, [code]);
          return rows[0] ? mapTransferRoute(rows[0]) : null;
        },
        async list(filter = {}) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status && filter.status !== "all") {
            params.push(filter.status);
            clauses.push(`t.status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(t.name ilike $${params.length} or t.code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `${TRANSFER_ROUTES_BASE_SELECT} ${where} order by t.created_at asc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapTransferRoute), total: rows.length };
        },
        async delete(id: string) {
          if (isUuid(id)) {
            await query(client, "delete from transfers where id = $1::uuid", [id]);
          } else {
            await query(client, "delete from transfers where code = $1", [id]);
          }
        },
      },
      localPackages: {
        async create(record: LocalSightseeingPackageRecord) {
          const rows = await query<{ id: string }>(
            client,
            `insert into local_packages (id, code, name, duration_hours, included_km, covers, inclusions_note, status, created_at, updated_at)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             on conflict (code) do update set
               name = excluded.name,
               duration_hours = excluded.duration_hours,
               included_km = excluded.included_km,
               covers = excluded.covers,
               inclusions_note = excluded.inclusions_note,
               status = excluded.status,
               updated_at = excluded.updated_at
             returning id`,
            [
              record.id,
              record.packageCode,
              record.name,
              record.durationHours,
              record.includedKm,
              record.covers,
              record.parkingNote,
              record.status,
              record.createdAt,
              record.updatedAt,
            ],
          );
          const packageId = rows[0]?.id ?? record.id;
          if (record.fleetPrices && typeof record.fleetPrices === "object" && isUuid(packageId)) {
            for (const [key, amount] of Object.entries(record.fleetPrices)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  const updated = await query(
                    client,
                    `update fare_rules set amount = $1, is_active = true
                     where category = 'local_package' and local_package_id = $2 and vehicle_model_id = $3 and is_active = true
                     returning id`,
                    [Math.round(amount), packageId, modelId],
                  );
                  if (updated.length === 0) {
                    await query(
                      client,
                      `insert into fare_rules (category, vehicle_model_id, local_package_id, amount, is_active)
                       values ('local_package', $1, $2, $3, true)`,
                      [modelId, packageId, Math.round(amount)],
                    );
                  }
                }
              }
            }
          }
          return record;
        },
        async update(record: LocalSightseeingPackageRecord) {
          const rows = isUuid(record.id)
            ? await query<{ id: string }>(
                client,
                `update local_packages set
                   code = $2,
                   name = $3,
                   duration_hours = $4,
                   included_km = $5,
                   covers = $6,
                   inclusions_note = $7,
                   status = $8,
                   updated_at = $9
                 where id = $1::uuid
                 returning id`,
                [
                  record.id,
                  record.packageCode,
                  record.name,
                  record.durationHours,
                  record.includedKm,
                  record.covers,
                  record.parkingNote,
                  record.status,
                  record.updatedAt,
                ],
              )
            : await query<{ id: string }>(
                client,
                `update local_packages set
                   name = $2,
                   duration_hours = $3,
                   included_km = $4,
                   covers = $5,
                   inclusions_note = $6,
                   status = $7,
                   updated_at = $8
                 where code = $1
                 returning id`,
                [
                  record.packageCode,
                  record.name,
                  record.durationHours,
                  record.includedKm,
                  record.covers,
                  record.parkingNote,
                  record.status,
                  record.updatedAt,
                ],
              );
          const packageId = rows[0]?.id ?? record.id;
          if (record.fleetPrices && typeof record.fleetPrices === "object" && isUuid(packageId)) {
            for (const [key, amount] of Object.entries(record.fleetPrices)) {
              if (typeof amount === "number" && amount > 0) {
                const modelId = await resolveVehicleModelId(client, key);
                if (modelId) {
                  const updated = await query(
                    client,
                    `update fare_rules set amount = $1, is_active = true
                     where category = 'local_package' and local_package_id = $2 and vehicle_model_id = $3 and is_active = true
                     returning id`,
                    [Math.round(amount), packageId, modelId],
                  );
                  if (updated.length === 0) {
                    await query(
                      client,
                      `insert into fare_rules (category, vehicle_model_id, local_package_id, amount, is_active)
                       values ('local_package', $1, $2, $3, true)`,
                      [modelId, packageId, Math.round(amount)],
                    );
                  }
                }
              }
            }
          }
          return record;
        },
        async getById(id: string) {
          if (!isUuid(id)) return null;
          const rows = await query(client, `${LOCAL_PACKAGES_BASE_SELECT} where lp.id = $1::uuid`, [id]);
          return rows[0] ? mapLocalPackage(rows[0]) : null;
        },
        async getByCode(code: string) {
          const rows = isUuid(code)
            ? await query(client, `${LOCAL_PACKAGES_BASE_SELECT} where lp.id = $1::uuid or lp.code = $1`, [code])
            : await query(client, `${LOCAL_PACKAGES_BASE_SELECT} where lp.code = $1`, [code]);
          return rows[0] ? mapLocalPackage(rows[0]) : null;
        },
        async list(filter = {}) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status && filter.status !== "all") {
            params.push(filter.status);
            clauses.push(`lp.status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(lp.name ilike $${params.length} or lp.code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `${LOCAL_PACKAGES_BASE_SELECT} ${where} order by lp.duration_hours asc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapLocalPackage), total: rows.length };
        },
        async delete(id: string) {
          if (isUuid(id)) {
            await query(client, "delete from local_packages where id = $1::uuid", [id]);
          } else {
            await query(client, "delete from local_packages where code = $1", [id]);
          }
        },
      },
      cancellationPolicies: {
        async list() {
          const rows = await query(client, "select * from cancellation_policies order by policy_type asc, sort_order asc");
          return rows.map(mapCancellationPolicy);
        },
        async update(record: CancellationPolicyRecord) {
          await query(
            client,
            `update cancellation_policies set notice_period_text=$2, fee_retained_percent=$3, refund_percent=$4, rule_text=$5, refund_timeline_note=$6, updated_at=$7 where id=$1`,
            [record.id, record.noticePeriodText, record.feeRetainedPercent, record.refundPercent, record.ruleText, record.refundTimelineNote, record.updatedAt]
          );
          return record;
        },
      },
      monuments: {
        async list() {
          const rows = await query(client, "select * from monuments order by sort_order asc");
          return rows.map(mapMonument);
        },
        async update(record: MonumentRecord) {
          await query(
            client,
            `update monuments set name=$2, visiting_hours=$3, closed_note=$4, historical_context=$5, sort_order=$6, updated_at=$7 where id=$1`,
            [record.id, record.name, record.visitingHours, record.closedNote, record.historicalContext, record.sortOrder, record.updatedAt]
          );
          return record;
        },
      },
      petPolicy: {
        async get() {
          const rows = await query(client, "select * from pet_taxi_policy limit 1");
          return rows[0] ? mapPetTaxiPolicy(rows[0]) : null;
        },
        async update(record: PetTaxiPolicyRecord) {
          await query(
            client,
            `update pet_taxi_policy set is_offered=$2, seat_protection_note=$3, breed_restriction_note=$4, comfort_stop_note=$5, booking_instruction=$6, updated_at=$7 where id=$1`,
            [record.id, record.isOffered, record.seatProtectionNote, record.breedRestrictionNote, record.comfortStopNote, record.bookingInstruction, record.updatedAt]
          );
          return record;
        },
      },
      companyProfile: {
        async get() {
          const rows = await query(client, "select * from company_profile limit 1");
          return rows[0] ? mapCompanyProfile(rows[0]) : null;
        },
        async update(record: CompanyProfileRecord) {
          await query(
            client,
            `update company_profile set brand_name=$2, office_address=$3, primary_phone=$4, whatsapp_number=$5, email=$6, gstin=$7, operating_hours=$8, maps_location=$9, dossier_version=$10, dossier_status=$11, updated_at=$12 where id=$1`,
            [record.id, record.brandName, record.officeAddress, record.primaryPhone, record.whatsappNumber, record.email, record.gstin, record.operatingHours, record.mapsLocation, record.dossierVersion, record.dossierStatus, record.updatedAt]
          );
          return record;
        },
      },
      dossierSignoffs: {
        async list() {
          const rows = await query(client, "select * from dossier_signoffs order by section_key asc");
          return rows.map(mapDossierSignoff);
        },
        async update(record: DossierSignoffRecord) {
          await query(
            client,
            `update dossier_signoffs set status=$2, client_notes=$3, approved_by=$4, approved_at=$5, updated_at=$6 where id=$1`,
            [record.id, record.status, record.clientNotes, record.approvedBy, record.approvedAt, record.updatedAt]
          );
          return record;
        },
      },
      catalog: {
        async create(record: CatalogItemRecord) {
          await insertCatalog(client, record);
          return record;
        },
        async update(record: CatalogItemRecord) {
          await query(
            client,
            `update catalog_items set title=$2, short_description=$3, description=$4, status=$5, duration_text=$6,
             route_summary=$7, availability=$8, seats_left=$9, stops=$10, trip_type=$11, version=$12,
             updated_by=$13, published_at=$14, updated_at=$15
             where id=$1`,
            [
              record.id, record.title, record.shortDescription, record.description, record.status,
              record.durationText, record.routeSummary,
              record.availability, record.seatsLeft, record.stops, record.tripType, record.version,
              record.updatedBy, record.publishedAt, record.updatedAt,
            ],
          );
          return record;
        },
        async getById(id: string) {
          if (!isUuid(id)) return null;
          const rows = await query(client, "select * from catalog_items where id=$1", [id]);
          return rows[0] ? mapCatalog(rows[0]) : null;
        },
        async getBySlug(slug: string) {
          const rows = await query(client, "select * from catalog_items where slug=$1", [slug]);
          return rows[0] ? mapCatalog(rows[0]) : null;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.type) {
            params.push(filter.type);
            clauses.push(`type=$${params.length}`);
          }
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(title ilike $${params.length} or slug ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from catalog_items ${where} order by updated_at desc`, params);
          return rows.map(mapCatalog);
        },
      },
      media: {
        async create(record: CatalogMediaRecord) {
          await query(
            client,
            `insert into catalog_item_media (
              id, catalog_item_id, storage_path, media_type, alt_text, caption, sort_order, status,
              source_type, copyright_owner, mime_type, content_base64, size_bytes,
              created_by, approved_by, published_at, created_at
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
              record.id, record.catalogItemId, record.storagePath, record.mediaType, record.altText,
              record.caption, record.sortOrder, record.status, record.sourceType, record.copyrightOwner,
              record.mimeType, record.contentBase64, record.sizeBytes,
              record.createdBy, record.approvedBy, record.publishedAt, record.createdAt,
            ],
          );
          return record;
        },
        async update(record: CatalogMediaRecord) {
          await query(
            client,
            `update catalog_item_media set alt_text=$2, caption=$3, sort_order=$4, status=$5, approved_by=$6, published_at=$7 where id=$1`,
            [record.id, record.altText, record.caption, record.sortOrder, record.status, record.approvedBy, record.publishedAt],
          );
          return record;
        },
        async getById(id: string) {
          const rows = await query(client, "select * from catalog_item_media where id=$1", [id]);
          return rows[0] ? mapMedia(rows[0]) : null;
        },
        async listByCatalogItem(catalogItemId: string) {
          const rows = await query(
            client,
            "select * from catalog_item_media where catalog_item_id=$1 order by sort_order",
            [catalogItemId],
          );
          return rows.map(mapMedia);
        },
        async delete(id: string) {
          await query(client, "delete from catalog_item_media where id=$1", [id]);
        },
      },
      reviews: {
        async create(record: ReviewRecord) {
          return record;
        },
        async update(record: ReviewRecord) {
          const status = record.status === "published" || record.status === "approved" ? "approved" : record.status === "rejected" ? "rejected" : "pending";
          const showOnHomepage = record.status === "published";
          await query(
            client,
            `UPDATE review_submissions SET status=$2, show_on_homepage=$3, reviewed_by=$4, reviewed_at=NOW() WHERE id=$1`,
            [record.id, status, showOnHomepage, record.reviewedBy]
          );
          return record;
        },
        async getById(id: string) {
          const rows = await query(
            client,
            `SELECT s.*, b.ticket_id, b.status as booking_status
             FROM review_submissions s
             LEFT JOIN bookings b ON s.booking_id = b.id
             WHERE s.id = $1`,
            [id]
          );
          return rows[0] ? mapReview(rows[0]) : null;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status) {
            params.push(filter.status === "published" ? "approved" : filter.status === "pending_review" ? "pending" : filter.status);
            clauses.push(`s.status=$${params.length}`);
            if (filter.status === "published") {
              clauses.push(`s.show_on_homepage=true`);
            }
          }
          const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
          const rows = await query(
            client,
            `SELECT s.*, b.ticket_id, b.status as booking_status
             FROM review_submissions s
             LEFT JOIN bookings b ON s.booking_id = b.id
             ${where}
             ORDER BY s.created_at DESC`,
            params
          );
          return rows.map(mapReview);
        },
        async listPublishedByCatalog(_catalogItemId: string) {
          const rows = await query(
            client,
            `SELECT s.*, b.ticket_id, b.status as booking_status
             FROM review_submissions s
             LEFT JOIN bookings b ON s.booking_id = b.id
             WHERE s.status = 'approved' AND s.show_on_homepage = true AND s.consent_public = true
             ORDER BY s.created_at DESC`,
            []
          );
          return rows.map(mapReview);
        },
      },
      promos: {
        /**
         * Promo codes were officially retired in canonical migration 0038_fare_system_clean_rebuild.sql
         * in favor of server-authoritative fare rules and explicit extra charges.
         * Read methods return intentional, documented empty states (null or empty array) so legacy callers
         * receive valid empty responses rather than HTTP 500 runtime database relation errors.
         * Mutating operations fail fast with an explicit AppError explaining the retirement.
         */
        async getByCode(_code: string) {
          return null;
        },
        async getById(_id: string) {
          return null;
        },
        async list() {
          return [];
        },
        async getFeatured() {
          return null;
        },
        async consume(_code: string) {
          return null;
        },
        async create(_record: PromoCodeRecord) {
          throw new AppError("PROMOS_RETIRED", "Promo codes were retired in migration 0038. Use fare_rules or extra_charges.", 410);
        },
        async update(_record: PromoCodeRecord) {
          throw new AppError("PROMOS_RETIRED", "Promo codes were retired in migration 0038. Use fare_rules or extra_charges.", 410);
        },
        async delete(_id: string) {
          throw new AppError("PROMOS_RETIRED", "Promo codes were retired in migration 0038. Use fare_rules or extra_charges.", 410);
        },
      },
      audit: {
        async append(record: AuditLogRecord) {
          await query(
            client,
            `insert into admin_audit_logs (id, actor_id, actor_role, resource_type, resource_id, action, before_state, after_state, reason, request_id, created_at)
             values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)`,
            [
              record.id, record.actorId, record.actorRole, record.resourceType, record.resourceId, record.action,
              JSON.stringify(record.before), JSON.stringify(record.after), record.reason, record.requestId, record.createdAt,
            ],
          );
          return record;
        },
        async list(limit = 100) {
          const rows = await query(client, "select * from admin_audit_logs order by created_at desc limit $1", [limit]);
          return rows.map((row) => ({
            id: String(row.id),
            actorId: String(row.actor_id),
            actorRole: row.actor_role as AuditLogRecord["actorRole"],
            resourceType: String(row.resource_type),
            resourceId: String(row.resource_id),
            action: String(row.action),
            before: (row.before_state as Record<string, unknown> | null) ?? null,
            after: (row.after_state as Record<string, unknown> | null) ?? null,
            reason: row.reason ? String(row.reason) : null,
            requestId: String(row.request_id),
            createdAt: new Date(String(row.created_at)).toISOString(),
          }));
        },
      },
      rentalEnquiries: {
        async create(record: RentalEnquiryRecord) {
          const rows = await query(
            client,
            `insert into rental_enquiries (
              id, ref, name, phone, email, car_tier, pickup_date, return_date, pickup_location, with_driver, note, status, notes, created_at, updated_at,
              vehicle_group_code, vehicle_model_id, destination_or_itinerary, passengers
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) returning *`,
            [
              record.id, record.ref, record.name, record.phone, record.email, record.carTier,
              record.pickupDate, record.returnDate, record.pickupLocation, record.withDriver,
              record.note, record.status, record.notes, record.createdAt, record.updatedAt,
              record.vehicleGroupCode ?? null, record.vehicleModelId ?? null,
              record.destinationOrItinerary ?? null, record.passengers ?? null,
            ]
          );
          return mapRentalEnquiry(rows[0]!);
        },
        async update(record: RentalEnquiryRecord) {
          const rows = await query(
            client,
            `update rental_enquiries set status=$2, notes=$3, updated_at=$4 where id=$1 returning *`,
            [record.id, record.status, record.notes, record.updatedAt]
          );
          if (!rows[0]) throw new Error("rental enquiry update failed: not found");
          return mapRentalEnquiry(rows[0]);
        },
        async getById(id: string) {
          const rows = await query(
            client,
            `select re.*, vm.display_name as vehicle_model_name, vg.name as vehicle_group_name
             from rental_enquiries re
             left join vehicle_models vm on vm.id = re.vehicle_model_id
             left join vehicle_groups vg on vg.code = re.vehicle_group_code
             where re.id = $1`,
            [id]
          );
          return rows[0] ? mapRentalEnquiry(rows[0]) : null;
        },
        async list(filter?: RentalEnquiryListFilter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter?.status) {
            params.push(filter.status);
            clauses.push(`re.status = $${params.length}`);
          }
          if (filter?.vehicleGroupCode) {
            params.push(filter.vehicleGroupCode);
            clauses.push(`re.vehicle_group_code = $${params.length}`);
          }
          if (filter?.carTier) {
            params.push(filter.carTier);
            clauses.push(`(re.car_tier = $${params.length} or re.vehicle_group_code = $${params.length})`);
          }
          if (filter?.car && filter.car !== "all") {
            params.push(filter.car);
            clauses.push(`(re.car_tier = $${params.length} or re.vehicle_group_code = $${params.length})`);
          }
          if (filter?.from) {
            params.push(filter.from);
            clauses.push(`re.pickup_date >= $${params.length}`);
          }
          if (filter?.to) {
            params.push(filter.to);
            clauses.push(`re.pickup_date <= $${params.length}`);
          }
          if (filter?.q) {
            params.push(`%${filter.q.toLowerCase()}%`);
            clauses.push(`(lower(re.name) like $${params.length} or re.phone like $${params.length} or lower(coalesce(re.ref, '')) like $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const count = await query(client, `select count(*)::int as total from rental_enquiries re ${where}`, params);
          const page = filter?.page ?? 1, limit = filter?.limit ?? 50;
          const qp = [...params, limit, (page - 1) * limit];
          const rows = await query(
            client,
            `select re.*, vm.display_name as vehicle_model_name, vg.name as vehicle_group_name
             from rental_enquiries re
             left join vehicle_models vm on vm.id = re.vehicle_model_id
             left join vehicle_groups vg on vg.code = re.vehicle_group_code
             ${where}
             order by re.created_at desc limit $${qp.length - 1} offset $${qp.length}`,
            qp
          );
          return { total: num(count[0]?.total ?? 0), items: rows.map(mapRentalEnquiry) };
        },
      },
      inquiries: {
        async create(record: InquiryRecord) {
          const rows = await query(
            client,
            `insert into inquiries (id, name, phone, email, message, trip_interest, status, notes, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
            [
              record.id, record.name, record.phone, record.email, record.message,
              record.tripInterest, record.status, record.notes, record.createdAt, record.updatedAt,
            ],
          );
          return mapInquiry(rows[0]!);
        },
        async update(record: InquiryRecord) {
          const rows = await query(
            client,
            `update inquiries set
               name=$2, phone=$3, email=$4, message=$5, trip_interest=$6,
               status=$7, notes=$8, updated_at=$9
             where id=$1 returning *`,
            [
              record.id, record.name, record.phone, record.email, record.message,
              record.tripInterest, record.status, record.notes, record.updatedAt,
            ],
          );
          if (!rows[0]) throw new Error("inquiry update failed: not found");
          return mapInquiry(rows[0]!);
        },
        async getById(id: string) {
          const rows = await query(client, "select * from inquiries where id=$1", [id]);
          return rows[0] ? mapInquiry(rows[0]) : null;
        },
        async list(filter?: InquiryListFilter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter?.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter?.q) {
            params.push(`%${filter.q.toLowerCase()}%`);
            clauses.push(`(lower(name) like $${params.length} or phone like $${params.length} or lower(coalesce(email, '')) like $${params.length} or lower(coalesce(trip_interest, '')) like $${params.length} or lower(message) like $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const countRows = await query(client, `select count(*)::int as total from inquiries ${where}`, params);
          const page = filter?.page ?? 1;
          const limit = filter?.limit ?? 50;
          const offset = (page - 1) * limit;
          const queryParams = [...params, limit, offset];
          const rows = await query(
            client,
            `select * from inquiries ${where} order by created_at desc limit $${queryParams.length - 1} offset $${queryParams.length}`,
            queryParams,
          );
          return {
            items: rows.map(mapInquiry),
            total: num(countRows[0]?.total ?? 0),
          };
        },
      },
      notifications: {
        async create(record: NotificationJobRecord) {
          await query(
            client,
            `insert into notification_jobs (id, booking_id, channel, template_key, dedupe_key, payload, status, attempt_count, provider_message_id, last_error, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12)`,
            [
              record.id, record.bookingId, record.channel, record.templateKey, record.dedupeKey,
              JSON.stringify(record.payload), record.status, record.attemptCount, record.providerMessageId,
              record.lastError, record.createdAt, record.updatedAt,
            ],
          );
          return record;
        },
        async update(record: NotificationJobRecord) {
          await query(
            client,
            `update notification_jobs set status=$2, attempt_count=$3, provider_message_id=$4, last_error=$5, updated_at=$6 where id=$1`,
            [record.id, record.status, record.attemptCount, record.providerMessageId, record.lastError, record.updatedAt],
          );
          return record;
        },
        async getByDedupeKey(key: string) {
          const rows = await query(client, "select * from notification_jobs where dedupe_key=$1", [key]);
          return rows[0] ? mapNotification(rows[0]) : null;
        },
        async listQueued() {
          const rows = await query(client, "select * from notification_jobs where status='queued' and attempt_count < 3");
          return rows.map(mapNotification);
        },
      },
      webhooks: {
        async record(event: WebhookEventRecord) {
          const existing = await query(client, "select * from payment_webhook_events where provider=$1 and event_id=$2", [event.provider, event.eventId]);
          if (existing[0]) {
            return { created: false, record: mapWebhook(existing[0]) };
          }
          await query(
            client,
            `insert into payment_webhook_events (id, provider, event_id, event_type, payload, processed, received_at)
             values ($1,$2,$3,$4,$5::jsonb,$6,$7)
             on conflict (provider, event_id) do nothing`,
            [
              event.id, event.provider, event.eventId, event.eventType, JSON.stringify(event.payload),
              event.processed, event.receivedAt,
            ],
          );
          return { created: true, record: event };
        },
        async markProcessed(eventId: string) {
          await query(client, "update payment_webhook_events set processed=true where event_id=$1", [eventId]);
        },
        async hasEvent(eventId: string) {
          const rows = await query(client, "select 1 from payment_webhook_events where event_id=$1", [eventId]);
          return rows.length > 0;
        },
      },
      locationCache: {
        async get(key: string) {
          const rows = await query(client, "select suggestions, stored_at from location_cache where cache_key=$1", [key]);
          const row = rows[0];
          if (!row) return null;
          return {
            suggestions: row.suggestions as LocationSuggestion[],
            storedAt: new Date(String(row.stored_at)).toISOString(),
          };
        },
        async set(key: string, suggestions: LocationSuggestion[], storedAt: string) {
          await query(
            client,
            `insert into location_cache (cache_key, suggestions, stored_at)
             values ($1,$2::jsonb,$3)
             on conflict (cache_key) do update set suggestions=excluded.suggestions, stored_at=excluded.stored_at`,
            [key, JSON.stringify(suggestions), storedAt],
          );
        },
      },
      devices: {
        async register(record: DeviceRegistrationRecord) {
          if (record.userId) {
            await query(
              client,
              `delete from device_registrations where device_id=$1 and user_id is null`,
              [record.deviceId],
            );
            await query(
              client,
              `insert into device_registrations (id, user_id, booking_id, device_id, platform, fcm_token, is_active, last_seen_at, created_at)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
               on conflict (user_id, device_id) where user_id is not null do update set
                 booking_id=coalesce(excluded.booking_id, device_registrations.booking_id),
                 platform=excluded.platform,
                 fcm_token=excluded.fcm_token,
                 is_active=excluded.is_active,
                 last_seen_at=excluded.last_seen_at`,
              [
                record.id, record.userId, record.bookingId || null, record.deviceId,
                record.platform, record.fcmToken, record.isActive, record.lastSeenAt, record.createdAt,
              ],
            );
          } else {
            await query(
              client,
              `insert into device_registrations (id, user_id, booking_id, device_id, platform, fcm_token, is_active, last_seen_at, created_at)
               values ($1,null,$2,$3,$4,$5,$6,$7,$8)
               on conflict (device_id) where user_id is null do update set
                 booking_id=coalesce(excluded.booking_id, device_registrations.booking_id),
                 platform=excluded.platform,
                 fcm_token=excluded.fcm_token,
                 is_active=excluded.is_active,
                 last_seen_at=excluded.last_seen_at`,
              [
                record.id, record.bookingId || null, record.deviceId,
                record.platform, record.fcmToken, record.isActive, record.lastSeenAt, record.createdAt,
              ],
            );
          }
          return record;
        },
        async getByDeviceId(deviceId: string) {
          const rows = await query(client, "select * from device_registrations where device_id=$1 and is_active=true", [deviceId]);
          if (!rows[0]) return null;
          return {
            id: String(rows[0].id),
            userId: rows[0].user_id ? String(rows[0].user_id) : null,
            bookingId: rows[0].booking_id ? String(rows[0].booking_id) : null,
            deviceId: String(rows[0].device_id),
            platform: rows[0].platform as DeviceRegistrationRecord["platform"],
            fcmToken: String(rows[0].fcm_token),
            isActive: Boolean(rows[0].is_active),
            lastSeenAt: new Date(String(rows[0].last_seen_at)).toISOString(),
            createdAt: new Date(String(rows[0].created_at)).toISOString(),
          };
        },
        async listByUserId(userId: string) {
          const rows = await query(client, "select * from device_registrations where user_id=$1 and is_active=true", [userId]);
          return rows.map((r) => ({
            id: String(r.id),
            userId: r.user_id ? String(r.user_id) : null,
            bookingId: r.booking_id ? String(r.booking_id) : null,
            deviceId: String(r.device_id),
            platform: r.platform as DeviceRegistrationRecord["platform"],
            fcmToken: String(r.fcm_token),
            isActive: Boolean(r.is_active),
            lastSeenAt: new Date(String(r.last_seen_at)).toISOString(),
            createdAt: new Date(String(r.created_at)).toISOString(),
          }));
        },
      },
      fareRules: {
        async getActive() {
          try {
            const rows = await query(client, "select * from fare_rules where is_active=true order by created_at desc limit 1");
            if (!rows[0]) return null;
            return {
              id: String(rows[0].id),
              version: String(rows[0].version),
              config: rows[0].config,
              effectiveFrom: new Date(String(rows[0].effective_from)).toISOString(),
              effectiveTo: rows[0].effective_to ? new Date(String(rows[0].effective_to)).toISOString() : null,
              isActive: Boolean(rows[0].is_active),
              createdAt: new Date(String(rows[0].created_at)).toISOString(),
            };
          } catch {
            return null;
          }
        },
        async getByVersion(version: string) {
          try {
            const rows = await query(client, "select * from fare_rules where version=$1 limit 1", [version]);
            if (!rows[0]) return null;
            return {
              id: String(rows[0].id),
              version: String(rows[0].version),
              config: rows[0].config,
              effectiveFrom: new Date(String(rows[0].effective_from)).toISOString(),
              effectiveTo: rows[0].effective_to ? new Date(String(rows[0].effective_to)).toISOString() : null,
              isActive: Boolean(rows[0].is_active),
              createdAt: new Date(String(rows[0].created_at)).toISOString(),
            };
          } catch {
            return null;
          }
        },
        async listAll() {
          try {
            const rows = await query(client, "select * from fare_rules order by created_at desc");
            return rows.map((r: any) => ({
              id: String(r.id),
              version: String(r.version),
              config: r.config,
              effectiveFrom: new Date(String(r.effective_from)).toISOString(),
              effectiveTo: r.effective_to ? new Date(String(r.effective_to)).toISOString() : null,
              isActive: Boolean(r.is_active),
              createdAt: new Date(String(r.created_at)).toISOString(),
            }));
          } catch {
            return [];
          }
        },
        async save(record: FareRuleRecord) {
          if (record.isActive) {
            await query(
              client,
              "update fare_rules set is_active=false, effective_to=$1 where is_active=true and version != $2",
              [record.effectiveFrom || new Date().toISOString(), record.version],
            );
          }
          await query(
            client,
            `insert into fare_rules (id, version, config, effective_from, effective_to, is_active, created_at)
             values ($1,$2,$3::jsonb,$4,$5,$6,$7)
             on conflict (version) do update set
               config=excluded.config,
               is_active=excluded.is_active,
               effective_from=excluded.effective_from,
               effective_to=excluded.effective_to`,
            [
              record.id, record.version, JSON.stringify(record.config),
              record.effectiveFrom, record.effectiveTo || null, record.isActive, record.createdAt,
            ],
          );
          return record;
        },
        async activate(version: string) {
          const now = new Date().toISOString();
          await query(
            client,
            "update fare_rules set is_active=false, effective_to=$1 where is_active=true and version != $2",
            [now, version],
          );
          const rows = await query(
            client,
            "update fare_rules set is_active=true, effective_from=$1, effective_to=null where version=$2 returning *",
            [now, version],
          );
          if (!rows[0]) return null;
          return {
            id: String(rows[0].id),
            version: String(rows[0].version),
            config: rows[0].config,
            effectiveFrom: new Date(String(rows[0].effective_from)).toISOString(),
            effectiveTo: rows[0].effective_to ? new Date(String(rows[0].effective_to)).toISOString() : null,
            isActive: Boolean(rows[0].is_active),
            createdAt: new Date(String(rows[0].created_at)).toISOString(),
          };
        },
      },
      publishEvents: {
        async enqueue(input: PublishEventInput) {
          const rows = await query<Record<string, unknown>>(
            client,
            `INSERT INTO site_publish_events (entity_type, entity_id, event_type, status)
             VALUES ($1, $2, $3, 'pending')
             ON CONFLICT (entity_type, entity_id, event_type) WHERE status = 'pending'
             DO UPDATE SET next_attempt_at = NOW()
             RETURNING *`,
            [input.entityType, input.entityId, input.eventType]
          );
          return mapPublishEvent(rows[0]!);
        },
        async getById(id: string) {
          const rows = await query<Record<string, unknown>>(
            client,
            `SELECT * FROM site_publish_events WHERE id = $1`,
            [id]
          );
          return rows[0] ? mapPublishEvent(rows[0]) : null;
        },
        async listPending(limit = 10) {
          const rows = await query<Record<string, unknown>>(
            client,
            `SELECT * FROM site_publish_events WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1`,
            [limit]
          );
          return rows.map(mapPublishEvent);
        },
      },
    };
  }

  return repos;
}

function mapPublishEvent(row: Record<string, unknown>): PublishEventRecord {
  return {
    id: String(row.id),
    entity_type: row.entity_type as PublishEventRecord["entity_type"],
    entity_id: String(row.entity_id),
    event_type: row.event_type as PublishEventRecord["event_type"],
    status: row.status as PublishEventRecord["status"],
    attempt_count: num(row.attempt_count),
    next_attempt_at: row.next_attempt_at ? new Date(String(row.next_attempt_at)).toISOString() : new Date().toISOString(),
    deployment_ref: row.deployment_ref ? String(row.deployment_ref) : null,
    last_error: row.last_error ? String(row.last_error) : null,
    created_at: new Date(String(row.created_at)).toISOString(),
    processed_at: row.processed_at ? new Date(String(row.processed_at)).toISOString() : null,
  };
}



function mapProfile(row: Record<string, unknown>): ProfileRecord {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    role: row.role as ProfileRecord["role"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapCatalog(row: Record<string, unknown>): CatalogItemRecord {
  return {
    id: String(row.id),
    type: row.type as CatalogItemRecord["type"],
    slug: String(row.slug),
    title: String(row.title),
    shortDescription: String(row.short_description),
    description: String(row.description),
    status: row.status as CatalogItemRecord["status"],
    durationText: String(row.duration_text),
    routeSummary: String(row.route_summary),
    startingPriceInr: row.starting_price_inr != null && num(row.starting_price_inr) > 0 ? num(row.starting_price_inr) : null,
    distanceKm: row.distance_km != null ? num(row.distance_km) : null,
    availability: (row.availability as CatalogItemRecord["availability"]) ?? "available",
    seatsLeft: row.seats_left === null || row.seats_left === undefined ? null : num(row.seats_left),
    stops: Array.isArray(row.stops) ? row.stops.map((s) => String(s)) : [],
    tripType: (row.trip_type as CatalogItemRecord["tripType"]) ?? null,
    version: num(row.version),
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapMedia(row: Record<string, unknown>): CatalogMediaRecord {
  return {
    id: String(row.id),
    catalogItemId: String(row.catalog_item_id),
    storagePath: String(row.storage_path),
    mediaType: row.media_type as CatalogMediaRecord["mediaType"],
    altText: String(row.alt_text),
    caption: row.caption ? String(row.caption) : null,
    sortOrder: num(row.sort_order),
    status: row.status as CatalogMediaRecord["status"],
    sourceType: row.source_type as CatalogMediaRecord["sourceType"],
    copyrightOwner: row.copyright_owner ? String(row.copyright_owner) : null,
    mimeType: row.mime_type ? String(row.mime_type) : null,
    contentBase64: row.content_base64 ? String(row.content_base64) : null,
    sizeBytes: row.size_bytes === null || row.size_bytes === undefined ? null : num(row.size_bytes),
    createdBy: row.created_by ? String(row.created_by) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapReview(row: Record<string, unknown>): ReviewRecord {
  const isVerified =
    (row.booking_id && row.booking_status === "completed") ||
    row.verification_status === "booking_verified";
  return {
    id: String(row.id),
    bookingId: row.ticket_id
      ? String(row.ticket_id)
      : row.booking_id
        ? String(row.booking_id)
        : null,
    catalogItemId: row.catalog_item_id ? String(row.catalog_item_id) : null,
    customerId: row.customer_id ? String(row.customer_id) : null,
    displayName: String(row.display_name),
    rating: num(row.rating),
    reviewText: String(row.review_text),
    status: (row.status === "approved" && row.show_on_homepage
      ? "published"
      : row.status === "approved"
        ? "approved"
        : row.status === "rejected"
          ? "rejected"
          : "pending_review") as ReviewRecord["status"],
    verificationStatus: isVerified ? "booking_verified" : "unverified",
    socialProfileUrl: row.social_username
      ? String(row.social_username)
      : row.social_profile_url
        ? String(row.social_profile_url)
        : null,
    socialPlatform: row.social_platform ? String(row.social_platform) : null,
    verificationNotes: row.verification_notes ? String(row.verification_notes) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at ? new Date(String(row.reviewed_at)).toISOString() : null,
    publishedAt: row.show_on_homepage
      ? row.reviewed_at
        ? new Date(String(row.reviewed_at)).toISOString()
        : new Date().toISOString()
      : null,
    guestAccessToken: row.guest_access_token ? String(row.guest_access_token) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapNotification(row: Record<string, unknown>): NotificationJobRecord {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    channel: row.channel as NotificationJobRecord["channel"],
    templateKey: String(row.template_key),
    dedupeKey: String(row.dedupe_key),
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as NotificationJobRecord["status"],
    attemptCount: num(row.attempt_count),
    providerMessageId: row.provider_message_id ? String(row.provider_message_id) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapWebhook(row: Record<string, unknown>): WebhookEventRecord {
  return {
    id: String(row.id),
    provider: String(row.provider),
    eventId: String(row.event_id),
    eventType: String(row.event_type),
    payload: row.payload,
    payloadHash: String(row.payload_hash ?? ""),
    processed: Boolean(row.processed),
    receivedAt: new Date(String(row.received_at)).toISOString(),
  };
}

async function insertCatalog(client: pg.Pool | PoolClient, record: CatalogItemRecord): Promise<void> {
  await client.query(
    `insert into catalog_items (
      id, type, slug, title, short_description, description, status, duration_text, route_summary,
      availability, seats_left, stops, trip_type, version,
      created_by, updated_by, published_at, created_at, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [
      record.id, record.type, record.slug, record.title, record.shortDescription, record.description,
      record.status, record.durationText, record.routeSummary,
      record.availability, record.seatsLeft, record.stops, record.tripType, record.version,
      record.createdBy, record.updatedBy, record.publishedAt, record.createdAt, record.updatedAt,
    ],
  );
}
