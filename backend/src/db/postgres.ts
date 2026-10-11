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
import type { DeviceRegistrationRecord, FareRuleRecord, InquiryListFilter, RentalEnquiryListFilter, PaymentListFilter, Repositories } from "./types.js";
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

function safeIsoDate(val: unknown, fallback: string = new Date().toISOString()): string {
  if (val === null || val === undefined || val === "") return fallback;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? fallback : d.toISOString();
}

function safeIsoDateOrNull(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  const d = new Date(val as string | number | Date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function mapLocalPackage(row: Record<string, unknown>): LocalSightseeingPackageRecord {
  return {
    id: String(row.id),
    packageCode: String(row.package_code),
    name: String(row.name),
    durationHours: num(row.duration_hours),
    includedKm: num(row.included_km),
    covers: String(row.covers),
    parkingNote: row.parking_note ? String(row.parking_note) : null,
    fleetPrices: (row.fleet_prices as Record<string, number>) ?? {},
    usePerKm: Boolean(row.use_per_km),
    extraRates: (row.extra_rates as LocalSightseeingPackageRecord["extraRates"]) ?? null,
    nightChargeInr: num(row.night_charge_inr),
    status: row.status as ContentStatus,
    isActive: Boolean(row.is_active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapTransferRoute(row: Record<string, unknown>): TransferRouteRecord {
  return {
    id: String(row.id),
    routeCode: String(row.route_code),
    name: String(row.name),
    distanceText: row.distance_text ? String(row.distance_text) : null,
    directionNote: row.direction_note ? String(row.direction_note) : null,
    fleetPrices: (row.fleet_prices as Record<string, number>) ?? {},
    usePerKm: Boolean(row.use_per_km),
    nightChargeInr: num(row.night_charge_inr),
    status: row.status as ContentStatus,
    isActive: Boolean(row.is_active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapTourPackage(row: Record<string, unknown>): TourPackageRecord {
  return {
    id: String(row.id),
    packageCode: String(row.package_code),
    name: String(row.name),
    durationText: String(row.duration_text),
    days: num(row.days),
    nights: num(row.nights),
    baseTierCode: String(row.base_tier_code),
    startingPriceInr: num(row.starting_price_inr),
    fleetPrices: (row.fleet_prices as Record<string, number>) ?? {},
    nightChargeInr: num(row.night_charge_inr),
    inclusionsHighlight: row.inclusions_highlight ? String(row.inclusions_highlight) : null,
    inclusionsNote: row.inclusions_note ? String(row.inclusions_note) : null,
    source: String(row.source ?? "Agra"),
    destination: String(row.destination ?? ""),
    inclusions: Array.isArray(row.inclusions) ? (row.inclusions as string[]) : [],
    exclusions: Array.isArray(row.exclusions) ? (row.exclusions as string[]) : [],
    itinerary: Array.isArray(row.itinerary) ? (row.itinerary as any[]) : [],
    imageUrl: row.image_url ? String(row.image_url) : null,
    gallery: Array.isArray(row.gallery) ? (row.gallery as any) : [],
    status: row.status as ContentStatus,
    isActive: Boolean(row.is_active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapPackageUpgrade(row: Record<string, unknown>): PackageVehicleUpgradeRecord {
  return {
    id: String(row.id),
    packageId: row.package_id ? String(row.package_id) : null,
    tierCode: String(row.tier_code),
    passengerNote: row.passenger_note ? String(row.passenger_note) : null,
    surchargeInr: num(row.surcharge_inr),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
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
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
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
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
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
    approvedAt: row.approved_at ? new Date(String(row.approved_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
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
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
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
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapRouteCatalog(row: Record<string, unknown>): RouteCatalogRecord {
  return { id: String(row.id), tripType: row.trip_type as RouteCatalogRecord["tripType"], sourceCity: String(row.source_city), sourceDetail: row.source_detail ? String(row.source_detail) : null, destinationCity: row.destination_city ? String(row.destination_city) : null, slug: String(row.slug), distanceKm: row.distance_km === null ? null : num(row.distance_km), durationText: row.duration_text ? String(row.duration_text) : null, availableFleets: (row.available_fleets as string[]) ?? [], faresInr: (row.fares_inr as Record<string, number>) ?? {}, driverChargeInr: num(row.driver_charge_inr), nightHaltInr: num(row.night_halt_inr), tollIncluded: Boolean(row.toll_included), tollAmountInr: row.toll_amount_inr === null ? null : num(row.toll_amount_inr), interstateCharges: (row.interstate_charges as RouteCatalogRecord["interstateCharges"]) ?? [], minKmPerDay: num(row.min_km_per_day), stops: (row.stops as RouteCatalogRecord["stops"]) ?? [], usePerKm: row.use_per_km === undefined ? true : Boolean(row.use_per_km), perKmRateOverride: row.per_km_rate_override === null || row.per_km_rate_override === undefined ? null : num(row.per_km_rate_override), highway: row.highway ? String(row.highway) : null, allInclusiveNote: row.all_inclusive_note ? String(row.all_inclusive_note) : null, status: row.status as RouteCatalogRecord["status"], needsReview: Boolean(row.needs_review), createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() };
}

function mapRentalEnquiry(row: Record<string, unknown>): RentalEnquiryRecord { return { id: String(row.id), ref: String(row.ref), name: String(row.name), phone: String(row.phone), email: row.email ? String(row.email) : null, carTier: row.car_tier as RentalEnquiryRecord["carTier"], pickupDate: String(row.pickup_date).slice(0,10), returnDate: String(row.return_date).slice(0,10), pickupLocation: String(row.pickup_location), withDriver: Boolean(row.with_driver), note: row.note ? String(row.note) : null, status: row.status as RentalEnquiryRecord["status"], notes: (row.notes as string[]) ?? [], createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() }; }
function mapBooking(row: Record<string, unknown>): BookingRecord {
  const breakdown = (row.fare_breakdown && typeof row.fare_breakdown === "object"
    ? row.fare_breakdown
    : (typeof row.fare_breakdown === "string" ? JSON.parse(row.fare_breakdown) : {})) as Record<string, any>;
  const vehicle = breakdown.vehicle ?? {};
  const details = breakdown.details ?? {};
  const totalAmount = num(row.total_amount ?? row.total_fare ?? breakdown.total ?? 0);
  const advanceAmount = num(row.advance_amount ?? breakdown.advance ?? 0);
  const balanceAmount = num(row.balance_amount ?? breakdown.balance ?? Math.max(0, totalAmount - advanceAmount));
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
  const amountPaise = num(row.amount_paise ?? row.inr_amount_paise ?? row.amount_minor ?? 0);
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
          await query(client, `insert into route_catalog (id, trip_type, source_city, source_detail, destination_city, slug, distance_km, duration_text, available_fleets, fares_inr, driver_charge_inr, night_halt_inr, toll_included, toll_amount_inr, interstate_charges, min_km_per_day, stops, use_per_km, per_km_rate_override, highway, all_inclusive_note, status, needs_review, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`, [record.id, record.tripType, record.sourceCity, record.sourceDetail, record.destinationCity, record.slug, record.distanceKm, record.durationText, record.availableFleets, JSON.stringify(record.faresInr), record.driverChargeInr, record.nightHaltInr, record.tollIncluded, record.tollAmountInr, JSON.stringify(record.interstateCharges), record.minKmPerDay, JSON.stringify(record.stops), record.usePerKm, record.perKmRateOverride, record.highway, record.allInclusiveNote, record.status, record.needsReview, record.createdAt, record.updatedAt]);
          return record;
        },
        async update(record: RouteCatalogRecord) {
          await query(client, `update route_catalog set trip_type=$2, source_city=$3, source_detail=$4, destination_city=$5, distance_km=$6, duration_text=$7, available_fleets=$8, fares_inr=$9, driver_charge_inr=$10, night_halt_inr=$11, toll_included=$12, toll_amount_inr=$13, interstate_charges=$14, min_km_per_day=$15, stops=$16, use_per_km=$17, per_km_rate_override=$18, highway=$19, all_inclusive_note=$20, status=$21, needs_review=$22, updated_at=$23 where id=$1`, [record.id, record.tripType, record.sourceCity, record.sourceDetail, record.destinationCity, record.distanceKm, record.durationText, record.availableFleets, JSON.stringify(record.faresInr), record.driverChargeInr, record.nightHaltInr, record.tollIncluded, record.tollAmountInr, JSON.stringify(record.interstateCharges), record.minKmPerDay, JSON.stringify(record.stops), record.usePerKm, record.perKmRateOverride, record.highway, record.allInclusiveNote, record.status, record.needsReview, record.updatedAt]);
          return record;
        },
        async getById(id: string) { if (!isUuid(id)) return null; const rows = await query(client, "select * from route_catalog where id=$1", [id]); return rows[0] ? mapRouteCatalog(rows[0]) : null; },
        async getBySlug(slug: string) { const rows = await query(client, "select * from route_catalog where slug=$1", [slug]); return rows[0] ? mapRouteCatalog(rows[0]) : null; },
        async list(filter) {
          const clauses: string[] = []; const params: unknown[] = [];
          if (filter.tripType) { params.push(filter.tripType); clauses.push(`trip_type=$${params.length}`); }
          if (filter.status) { params.push(filter.status); clauses.push(`status=$${params.length}`); }
          if (filter.q) { params.push(`%${filter.q}%`); clauses.push(`(source_city ilike $${params.length} or coalesce(destination_city,'') ilike $${params.length} or slug ilike $${params.length})`); }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from route_catalog ${where} order by updated_at desc`, params);
          const page = filter.page ?? 1; const limit = filter.limit ?? 50; const total = rows.length;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapRouteCatalog), total };
        },
        async delete(id: string) { await query(client, "delete from route_catalog where id=$1", [id]); },
      },
      tourPackages: {
        async create(record: TourPackageRecord) {
          await query(
            client,
            `insert into tour_packages (id, package_code, name, duration_text, days, nights, base_tier_code, starting_price_inr, fleet_prices, night_charge_inr, inclusions_highlight, inclusions_note, source, destination, inclusions, exclusions, itinerary, image_url, gallery, status, is_active, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
            [
              record.id, record.packageCode, record.name, record.durationText, record.days, record.nights,
              record.baseTierCode, record.startingPriceInr, JSON.stringify(record.fleetPrices), record.nightChargeInr,
              record.inclusionsHighlight, record.inclusionsNote, record.source ?? "Agra", record.destination ?? "",
              JSON.stringify(record.inclusions ?? []), JSON.stringify(record.exclusions ?? []), JSON.stringify(record.itinerary ?? []),
              record.imageUrl ?? null, JSON.stringify(record.gallery ?? []), record.status, record.isActive, record.createdAt, record.updatedAt
            ]
          );
          return record;
        },
        async update(record: TourPackageRecord) {
          await query(
            client,
            `update tour_packages set package_code=$2, name=$3, duration_text=$4, days=$5, nights=$6, base_tier_code=$7, starting_price_inr=$8, fleet_prices=$9, night_charge_inr=$10, inclusions_highlight=$11, inclusions_note=$12, source=$13, destination=$14, inclusions=$15, exclusions=$16, itinerary=$17, image_url=$18, gallery=$19, status=$20, is_active=$21, updated_at=$22 where id=$1`,
            [
              record.id, record.packageCode, record.name, record.durationText, record.days, record.nights,
              record.baseTierCode, record.startingPriceInr, JSON.stringify(record.fleetPrices), record.nightChargeInr,
              record.inclusionsHighlight, record.inclusionsNote, record.source ?? "Agra", record.destination ?? "",
              JSON.stringify(record.inclusions ?? []), JSON.stringify(record.exclusions ?? []), JSON.stringify(record.itinerary ?? []),
              record.imageUrl ?? null, JSON.stringify(record.gallery ?? []), record.status, record.isActive, record.updatedAt
            ]
          );
          return record;
        },
        async getById(id: string) {
          const rows = isUuid(id)
            ? await query(client, "select * from tour_packages where id = $1::uuid", [id])
            : await query(client, "select * from tour_packages where package_code = $1", [id]);
          return rows[0] ? mapTourPackage(rows[0]) : null;
        },
        async getByCode(code: string) {
          const rows = isUuid(code)
            ? await query(client, "select * from tour_packages where id = $1::uuid", [code])
            : await query(client, "select * from tour_packages where package_code = $1", [code]);
          return rows[0] ? mapTourPackage(rows[0]) : null;
        },
        async list(filter = {}) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status && filter.status !== "all") {
            params.push(filter.status);
            clauses.push(`status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(name ilike $${params.length} or package_code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from tour_packages ${where} order by created_at asc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapTourPackage), total: rows.length };
        },
        async delete(id: string) {
          await query(client, "delete from tour_packages where id=$1", [id]);
        },
        async listUpgrades(packageId?: string | null) {
          const rows = packageId && isUuid(packageId)
            ? await query(client, "select * from package_vehicle_upgrades where package_id=$1 or package_id is null order by surcharge_inr asc", [packageId])
            : await query(client, "select * from package_vehicle_upgrades where package_id is null order by surcharge_inr asc");
          return rows.map(mapPackageUpgrade);
        },
        async saveUpgrade(record: PackageVehicleUpgradeRecord) {
          const values = [record.id, record.packageId, record.tierCode, record.passengerNote, record.surchargeInr, record.createdAt, record.updatedAt];
          const rows = record.packageId
            ? await query(
                client,
                `insert into package_vehicle_upgrades (id, package_id, tier_code, passenger_note, surcharge_inr, created_at, updated_at)
                 values ($1,$2,$3,$4,$5,$6,$7)
                 on conflict (package_id, tier_code) do update
                 set passenger_note=excluded.passenger_note, surcharge_inr=excluded.surcharge_inr, updated_at=excluded.updated_at
                 returning *`,
                values,
              )
            : await query(
                client,
                `insert into package_vehicle_upgrades (id, package_id, tier_code, passenger_note, surcharge_inr, created_at, updated_at)
                 values ($1,$2,$3,$4,$5,$6,$7)
                 on conflict (tier_code) where package_id is null do update
                 set passenger_note=excluded.passenger_note, surcharge_inr=excluded.surcharge_inr, updated_at=excluded.updated_at
                 returning *`,
                values,
              );
          return rows[0] ? mapPackageUpgrade(rows[0]) : record;
        },
        async deleteUpgrade(id: string) {
          const result = await client.query("delete from package_vehicle_upgrades where id=$1", [id]);
          return (result.rowCount ?? 0) > 0;
        },
      },
      transferRoutes: {
        async create(record: TransferRouteRecord) {
          await query(
            client,
            `insert into transfer_routes (id, route_code, name, distance_text, direction_note, fleet_prices, use_per_km, night_charge_inr, status, is_active, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [record.id, record.routeCode, record.name, record.distanceText, record.directionNote, JSON.stringify(record.fleetPrices), record.usePerKm, record.nightChargeInr, record.status, record.isActive, record.createdAt, record.updatedAt]
          );
          return record;
        },
        async update(record: TransferRouteRecord) {
          await query(
            client,
            `update transfer_routes set route_code=$2, name=$3, distance_text=$4, direction_note=$5, fleet_prices=$6, use_per_km=$7, night_charge_inr=$8, status=$9, is_active=$10, updated_at=$11 where id=$1`,
            [record.id, record.routeCode, record.name, record.distanceText, record.directionNote, JSON.stringify(record.fleetPrices), record.usePerKm, record.nightChargeInr, record.status, record.isActive, record.updatedAt]
          );
          return record;
        },
        async getById(id: string) {
          const rows = isUuid(id)
            ? await query(client, "select * from transfer_routes where id = $1::uuid", [id])
            : await query(client, "select * from transfer_routes where route_code = $1", [id]);
          return rows[0] ? mapTransferRoute(rows[0]) : null;
        },
        async getByCode(code: string) {
          const rows = isUuid(code)
            ? await query(client, "select * from transfer_routes where id = $1::uuid", [code])
            : await query(client, "select * from transfer_routes where route_code = $1", [code]);
          return rows[0] ? mapTransferRoute(rows[0]) : null;
        },
        async list(filter = {}) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status && filter.status !== "all") {
            params.push(filter.status);
            clauses.push(`status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(name ilike $${params.length} or route_code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from transfer_routes ${where} order by created_at asc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapTransferRoute), total: rows.length };
        },
        async delete(id: string) {
          await query(client, "delete from transfer_routes where id=$1", [id]);
        },
      },
      localPackages: {
        async create(record: LocalSightseeingPackageRecord) {
          await query(
            client,
            `insert into local_sightseeing_packages (id, package_code, name, duration_hours, included_km, covers, parking_note, fleet_prices, use_per_km, extra_rates, night_charge_inr, status, is_active, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
            [record.id, record.packageCode, record.name, record.durationHours, record.includedKm, record.covers, record.parkingNote, JSON.stringify(record.fleetPrices), record.usePerKm, record.extraRates ? JSON.stringify(record.extraRates) : null, record.nightChargeInr, record.status, record.isActive, record.createdAt, record.updatedAt]
          );
          return record;
        },
        async update(record: LocalSightseeingPackageRecord) {
          await query(
            client,
            `update local_sightseeing_packages set package_code=$2, name=$3, duration_hours=$4, included_km=$5, covers=$6, parking_note=$7, fleet_prices=$8, use_per_km=$9, extra_rates=$10, night_charge_inr=$11, status=$12, is_active=$13, updated_at=$14 where id=$1`,
            [record.id, record.packageCode, record.name, record.durationHours, record.includedKm, record.covers, record.parkingNote, JSON.stringify(record.fleetPrices), record.usePerKm, record.extraRates ? JSON.stringify(record.extraRates) : null, record.nightChargeInr, record.status, record.isActive, record.updatedAt]
          );
          return record;
        },
        async getById(id: string) {
          const rows = isUuid(id)
            ? await query(client, "select * from local_sightseeing_packages where id = $1::uuid", [id])
            : await query(client, "select * from local_sightseeing_packages where package_code = $1", [id]);
          return rows[0] ? mapLocalPackage(rows[0]) : null;
        },
        async getByCode(code: string) {
          const rows = isUuid(code)
            ? await query(client, "select * from local_sightseeing_packages where id = $1::uuid", [code])
            : await query(client, "select * from local_sightseeing_packages where package_code = $1", [code]);
          return rows[0] ? mapLocalPackage(rows[0]) : null;
        },
        async list(filter = {}) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status && filter.status !== "all") {
            params.push(filter.status);
            clauses.push(`status = $${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(name ilike $${params.length} or package_code ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from local_sightseeing_packages ${where} order by duration_hours asc`, params);
          const page = filter.page ?? 1;
          const limit = filter.limit ?? 50;
          return { items: rows.slice((page - 1) * limit, page * limit).map(mapLocalPackage), total: rows.length };
        },
        async delete(id: string) {
          await query(client, "delete from local_sightseeing_packages where id=$1", [id]);
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
             route_summary=$7, starting_price_inr=$8, distance_km=$9, availability=$10, seats_left=$11,
             stops=$12, trip_type=$13, version=$14, updated_by=$15, published_at=$16, updated_at=$17
             where id=$1`,
            [
              record.id, record.title, record.shortDescription, record.description, record.status,
              record.durationText, record.routeSummary, record.startingPriceInr, record.distanceKm,
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
          await query(
            client,
            `insert into reviews (
              id, booking_id, catalog_item_id, customer_id, display_name, rating, review_text, status,
              verification_status, social_profile_url, social_platform, verification_notes, reviewed_by,
              reviewed_at, published_at, guest_access_token, created_at
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
              record.id, record.bookingId, record.catalogItemId, record.customerId, record.displayName,
              record.rating, record.reviewText, record.status, record.verificationStatus, record.socialProfileUrl,
              record.socialPlatform, record.verificationNotes, record.reviewedBy, record.reviewedAt,
              record.publishedAt, record.guestAccessToken, record.createdAt,
            ],
          );
          return record;
        },
        async update(record: ReviewRecord) {
          await query(
            client,
            `update reviews set status=$2, verification_status=$3, verification_notes=$4, reviewed_by=$5,
             reviewed_at=$6, published_at=$7 where id=$1`,
            [
              record.id, record.status, record.verificationStatus, record.verificationNotes,
              record.reviewedBy, record.reviewedAt, record.publishedAt,
            ],
          );
          return record;
        },
        async getById(id: string) {
          const rows = await query(client, "select * from reviews where id=$1", [id]);
          return rows[0] ? mapReview(rows[0]) : null;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter.catalogItemId) {
            params.push(filter.catalogItemId);
            clauses.push(`catalog_item_id=$${params.length}`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from reviews ${where} order by created_at desc`, params);
          return rows.map(mapReview);
        },
        async listPublishedByCatalog(catalogItemId: string) {
          const rows = await query(
            client,
            "select * from reviews where catalog_item_id=$1 and status='published' order by published_at desc",
            [catalogItemId],
          );
          return rows.map(mapReview);
        },
      },
      promos: {
        async getByCode(code: string) {
          const rows = await query(client, "select * from promo_codes where code=$1", [code.trim().toUpperCase()]);
          return rows[0] ? mapPromo(rows[0]) : null;
        },
        async getById(id: string) {
          const rows = await query(client, "select * from promo_codes where id=$1", [id]);
          return rows[0] ? mapPromo(rows[0]) : null;
        },
        async list() {
          const rows = await query(client, "select * from promo_codes order by code");
          return rows.map(mapPromo);
        },
        async getFeatured() {
          const rows = await query(
            client,
            `select * from promo_codes
             where is_broadcast = true
               and is_active = true
               and (valid_from is null or valid_from <= now())
               and (valid_to is null or valid_to >= now())
               and (max_redemptions is null or redemption_count < max_redemptions)
             order by valid_from desc nulls last
             limit 1`,
          );
          return rows[0] ? mapPromo(rows[0]) : null;
        },
        async consume(code: string) {
          const rows = await query(
            client,
            `update promo_codes
             set redemption_count = redemption_count + 1
             where code=$1
               and is_active = true
               and (valid_from is null or valid_from <= now())
               and (valid_to is null or valid_to >= now())
               and (max_redemptions is null or redemption_count < max_redemptions)
             returning *`,
            [code.trim().toUpperCase()],
          );
          return rows[0] ? mapPromo(rows[0]) : null;
        },
        async create(record: PromoCodeRecord) {
          try {
            await query(
              client,
              `insert into promo_codes (id, code, discount_amount, min_total, description, is_active, max_redemptions, redemption_count, valid_from, valid_to, allow_group_vehicles, is_broadcast)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
              [
                record.id, record.code, record.discountAmount, record.minTotal, record.description, record.isActive,
                record.maxRedemptions, record.redemptionCount, record.validFrom, record.validTo,
                record.allowGroupVehicles, record.isBroadcast,
              ],
            );
            return record;
          } catch (error: any) {
            if (
              error?.code === "23505" &&
              (error?.constraint === "idx_promo_codes_single_broadcast" ||
                String(error?.message).includes("idx_promo_codes_single_broadcast"))
            ) {
              throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
            }
            throw error;
          }
        },
        async update(record: PromoCodeRecord) {
          try {
            await query(
              client,
              `update promo_codes set
                 code=$2,
                 discount_amount=$3,
                 min_total=$4,
                 description=$5,
                 is_active=$6,
                 max_redemptions=$7,
                 redemption_count=$8,
                 valid_from=$9,
                 valid_to=$10,
                 allow_group_vehicles=$11,
                 is_broadcast=$12
               where id=$1`,
              [
                record.id,
                record.code,
                record.discountAmount,
                record.minTotal,
                record.description,
                record.isActive,
                record.maxRedemptions,
                record.redemptionCount,
                record.validFrom,
                record.validTo,
                record.allowGroupVehicles,
                record.isBroadcast,
              ],
            );
            return record;
          } catch (error: any) {
            if (
              error?.code === "23505" &&
              (error?.constraint === "idx_promo_codes_single_broadcast" ||
                String(error?.message).includes("idx_promo_codes_single_broadcast"))
            ) {
              throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
            }
            throw error;
          }
        },
        async delete(id: string) {
          const res = await query(client, "delete from promo_codes where id=$1", [id]);
          return ((res as any).rowCount ?? 0) > 0;
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
        async create(record: RentalEnquiryRecord) { const rows = await query(client, `insert into rental_enquiries (id, ref, name, phone, email, car_tier, pickup_date, return_date, pickup_location, with_driver, note, status, notes, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`, [record.id,record.ref,record.name,record.phone,record.email,record.carTier,record.pickupDate,record.returnDate,record.pickupLocation,record.withDriver,record.note,record.status,record.notes,record.createdAt,record.updatedAt]); return mapRentalEnquiry(rows[0]!); },
        async update(record: RentalEnquiryRecord) { const rows = await query(client, `update rental_enquiries set status=$2, notes=$3, updated_at=$4 where id=$1 returning *`, [record.id,record.status,record.notes,record.updatedAt]); if (!rows[0]) throw new Error("rental enquiry update failed: not found"); return mapRentalEnquiry(rows[0]); },
        async getById(id: string) { const rows = await query(client, "select * from rental_enquiries where id=$1", [id]); return rows[0] ? mapRentalEnquiry(rows[0]) : null; },
        async list(filter?: RentalEnquiryListFilter) { const clauses:string[]=[]; const params:unknown[]=[]; if(filter?.status){params.push(filter.status);clauses.push(`status=$${params.length}`);} if(filter?.carTier){params.push(filter.carTier);clauses.push(`car_tier=$${params.length}`);} if(filter?.from){params.push(filter.from);clauses.push(`pickup_date >= $${params.length}`);} if(filter?.to){params.push(filter.to);clauses.push(`pickup_date <= $${params.length}`);} if(filter?.q){params.push(`%${filter.q.toLowerCase()}%`);clauses.push(`(lower(name) like $${params.length} or phone like $${params.length})`);} const where=clauses.length?`where ${clauses.join(" and ")}`:""; const count=await query(client,`select count(*)::int as total from rental_enquiries ${where}`,params); const page=filter?.page??1, limit=filter?.limit??50; const qp=[...params,limit,(page-1)*limit]; const rows=await query(client,`select * from rental_enquiries ${where} order by created_at desc limit $${qp.length-1} offset $${qp.length}`,qp); return { total:num(count[0]?.total??0), items:rows.map(mapRentalEnquiry) }; },
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
          const existing = await query(client, "select * from raw_webhooks where event_id=$1", [event.eventId]);
          if (existing[0]) {
            return { created: false, record: mapWebhook(existing[0]) };
          }
          await query(
            client,
            `insert into raw_webhooks (id, provider, event_id, event_type, payload, payload_hash, processed, received_at)
             values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
            [
              event.id, event.provider, event.eventId, event.eventType, JSON.stringify(event.payload),
              event.payloadHash, event.processed, event.receivedAt,
            ],
          );
          return { created: true, record: event };
        },
        async markProcessed(eventId: string) {
          await query(client, "update raw_webhooks set processed=true where event_id=$1", [eventId]);
        },
        async hasEvent(eventId: string) {
          const rows = await query(client, "select 1 from raw_webhooks where event_id=$1", [eventId]);
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
        },
        async getByVersion(version: string) {
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
        },
        async listAll() {
          const rows = await query(client, "select * from fare_rules order by created_at desc");
          return rows.map((r) => ({
            id: String(r.id),
            version: String(r.version),
            config: r.config,
            effectiveFrom: new Date(String(r.effective_from)).toISOString(),
            effectiveTo: r.effective_to ? new Date(String(r.effective_to)).toISOString() : null,
            isActive: Boolean(r.is_active),
            createdAt: new Date(String(r.created_at)).toISOString(),
          }));
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
    };
  }

  return repos;
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
    startingPriceInr: num(row.starting_price_inr),
    distanceKm: row.distance_km === null || row.distance_km === undefined ? null : num(row.distance_km),
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
  return {
    id: String(row.id),
    bookingId: row.booking_id ? String(row.booking_id) : null,
    catalogItemId: row.catalog_item_id ? String(row.catalog_item_id) : null,
    customerId: row.customer_id ? String(row.customer_id) : null,
    displayName: String(row.display_name),
    rating: num(row.rating),
    reviewText: String(row.review_text),
    status: row.status as ReviewRecord["status"],
    verificationStatus: row.verification_status as ReviewRecord["verificationStatus"],
    socialProfileUrl: row.social_profile_url ? String(row.social_profile_url) : null,
    socialPlatform: row.social_platform ? String(row.social_platform) : null,
    verificationNotes: row.verification_notes ? String(row.verification_notes) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at ? new Date(String(row.reviewed_at)).toISOString() : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    guestAccessToken: row.guest_access_token ? String(row.guest_access_token) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapPromo(row: Record<string, unknown>): PromoCodeRecord {
  return {
    id: String(row.id),
    code: String(row.code),
    discountAmount: num(row.discount_amount),
    minTotal: num(row.min_total),
    description: String(row.description),
    isActive: Boolean(row.is_active),
    maxRedemptions: row.max_redemptions === null || row.max_redemptions === undefined ? null : num(row.max_redemptions),
    redemptionCount: num(row.redemption_count),
    validFrom: row.valid_from ? new Date(String(row.valid_from)).toISOString() : null,
    validTo: row.valid_to ? new Date(String(row.valid_to)).toISOString() : null,
    allowGroupVehicles: Boolean(row.allow_group_vehicles),
    isBroadcast: Boolean(row.is_broadcast),
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
    payloadHash: String(row.payload_hash),
    processed: Boolean(row.processed),
    receivedAt: new Date(String(row.received_at)).toISOString(),
  };
}

async function insertCatalog(client: pg.Pool | PoolClient, record: CatalogItemRecord): Promise<void> {
  await client.query(
    `insert into catalog_items (
      id, type, slug, title, short_description, description, status, duration_text, route_summary,
      starting_price_inr, distance_km, availability, seats_left, stops, trip_type, version,
      created_by, updated_by, published_at, created_at, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      record.id, record.type, record.slug, record.title, record.shortDescription, record.description,
      record.status, record.durationText, record.routeSummary, record.startingPriceInr,
      record.distanceKm, record.availability, record.seatsLeft, record.stops, record.tripType, record.version,
      record.createdBy, record.updatedBy, record.publishedAt, record.createdAt, record.updatedAt,
    ],
  );
}
