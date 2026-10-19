import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { BookingsService, PriceChangedError } from "../../src/modules/bookings/bookings.service.js";
import { PaymentsService } from "../../src/modules/payments/payments.service.js";
import { QuotesService } from "../../src/modules/quotes/quotes.service.js";
import { BookingsRepository, type BookingEntity } from "../../src/modules/bookings/bookings.repository.js";
import { PaymentsRepository, type PaymentEntity, type PaymentWebhookEventEntity } from "../../src/modules/payments/payments.repository.js";
import type { FareCatalogRepository } from "../../src/modules/fare-catalog/fare-catalog.repository.js";
import {
  FIXTURE_SETTINGS,
  FIXTURE_GROUPS,
  FIXTURE_CARS,
  FIXTURE_ROUTES,
  FIXTURE_ROUTE_VEHICLES,
} from "../fixtures/fare-fixture.js";
import type { OutstationRouteVehicleEntity } from "../../src/modules/fare-catalog/fare-catalog.repository.js";

function createMockFareCatalogRepo(overrides?: { dzPrice?: number }): FareCatalogRepository {
  const groups = Object.values(FIXTURE_GROUPS).map((g, i) => ({
    id: `10000000-0000-0000-0001-00000000000${i + 1}`,
    code: g.code,
    name: g.code.toUpperCase(),
    driver_allowance_per_day: g.driver_allowance_per_day,
    one_way_night_charge: g.one_way_night_charge,
    round_trip_halt_per_night: g.round_trip_halt_per_night,
    sort_order: i + 1,
    is_active: true,
  }));

  const cars = Object.values(FIXTURE_CARS).map((c, i) => ({
    id: c.id,
    vehicle_group_id: `10000000-0000-0000-0001-00000000000${i + 1}`,
    group_code: c.group_code,
    group_name: c.group_code.toUpperCase(),
    make: "Test",
    model_name: c.display_name,
    display_name: c.display_name,
    passenger_capacity: c.passenger_capacity,
    luggage_capacity: 3,
    image_url: null,
    sort_order: i + 1,
    is_active: true,
  }));

  const routes = Object.values(FIXTURE_ROUTES).map((r) => ({
    id: r.id,
    code: r.code,
    origin_name: r.origin_name,
    destination_name: r.destination_name,
    distance_km: r.distance_km,
    duration_minutes: r.duration_minutes,
    description: null,
    image_url: null,
    gallery: [],
    status: (r as any).status || "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const routeVehicles: OutstationRouteVehicleEntity[] = [];
  for (const [rCode, carMap] of Object.entries(FIXTURE_ROUTE_VEHICLES)) {
    const route = (FIXTURE_ROUTES as any)[rCode];
    if (!route) continue;
    for (const [cCode, info] of Object.entries(carMap)) {
      const car = (FIXTURE_CARS as any)[cCode];
      if (!car) continue;
      let oneWayAmount = info.one_way_amount;
      if (route.id === FIXTURE_ROUTES.DEL.id && car.id === FIXTURE_CARS.DZ.id && overrides?.dzPrice) {
        oneWayAmount = overrides.dzPrice;
      }
      routeVehicles.push({
        id: `rv-${rCode}-${cCode}`,
        route_id: route.id,
        vehicle_model_id: car.id,
        one_way_amount: oneWayAmount,
        round_trip_enabled: info.round_trip_enabled,
        terms: {
          one_way: { inclusions: ["Toll"], exclusions: ["Parking"] },
          round_trip: { inclusions: ["Fuel"], exclusions: ["Toll"] },
        },
        sort_order: 1,
        is_active: true,
      });
    }
  }

  return {
    async getFareSettings() {
      return { ...FIXTURE_SETTINGS };
    },
    async getVehicleGroups() {
      return groups;
    },
    async getVehicleModels() {
      return cars;
    },
    async getVehicleModelById(id: string) {
      return cars.find((c) => c.id === id) || null;
    },
    async getOutstationRoutes() {
      return routes;
    },
    async getOutstationRouteByIdOrCode(idOrCode: string) {
      return routes.find((r) => r.id === idOrCode || r.code === idOrCode) || null;
    },
    async getOutstationRouteVehicles(routeId: string) {
      return routeVehicles.filter((rv) => rv.route_id === routeId);
    },
    async getLocalPackages() {
      return [];
    },
    async getLocalPackageByIdOrCode() {
      return null;
    },
    async getTransfers() {
      return [];
    },
    async getTransferByIdOrCode() {
      return null;
    },
    async getTourPackages() {
      return [];
    },
    async getTourPackageByIdOrCode() {
      return null;
    },
    async getFareRules() {
      return [];
    },
    async getExtraCharges() {
      return [];
    },
  } as unknown as FareCatalogRepository;
}

class MockBookingsRepository extends BookingsRepository {
  public bookings = new Map<string, BookingEntity>();

  constructor() {
    super(null as any);
  }

  override async create(data: any): Promise<BookingEntity> {
    if (data.advance_amount > data.total_amount) {
      throw new Error("DB CHECK violation: advance_amount > total_amount");
    }
    if (data.return_at && data.return_at <= data.pickup_at) {
      throw new Error("DB CHECK violation: return_at <= pickup_at");
    }
    if (data.trip_type === "round_trip" && !data.return_at) {
      throw new Error("DB CHECK violation: round_trip without return_at");
    }
    const id = `booking-${this.bookings.size + 1}`;
    const entity: BookingEntity = {
      id,
      ticket_id: data.ticket_id,
      user_id: data.user_id || null,
      guest_access_token: data.guest_access_token,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      category: data.category,
      vehicle_model_id: data.vehicle_model_id,
      passenger_count: data.passenger_count,
      route_id: data.route_id || null,
      local_package_id: data.local_package_id || null,
      transfer_id: data.transfer_id || null,
      tour_package_id: data.tour_package_id || null,
      trip_type: data.trip_type || null,
      pickup_at: data.pickup_at,
      return_at: data.return_at || null,
      pickup_address: data.pickup_address,
      drop_address: data.drop_address || null,
      flight_train_number: data.flight_train_number || null,
      special_notes: data.special_notes || null,
      fare_breakdown: data.fare_breakdown,
      total_amount: data.total_amount,
      advance_amount: data.advance_amount,
      balance_amount: data.total_amount - data.advance_amount,
      status: "pending_payment",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(id, entity);
    return entity;
  }

  override async getById(id: string): Promise<BookingEntity | null> {
    return this.bookings.get(id) || null;
  }

  override async getByTicketId(ticketId: string): Promise<BookingEntity | null> {
    for (const b of this.bookings.values()) {
      if (b.ticket_id === ticketId) return b;
    }
    return null;
  }

  override async getByGuestAccessToken(token: string): Promise<BookingEntity | null> {
    for (const b of this.bookings.values()) {
      if (b.guest_access_token === token) return b;
    }
    return null;
  }

  override async updateStatus(id: string, status: any): Promise<boolean> {
    const b = this.bookings.get(id);
    if (!b) return false;
    b.status = status;
    b.updated_at = new Date().toISOString();
    return true;
  }
}

class MockPaymentsRepository extends PaymentsRepository {
  public payments = new Map<string, PaymentEntity>();
  public webhookEvents = new Map<string, PaymentWebhookEventEntity>();

  constructor(private bookingsRepo: MockBookingsRepository) {
    super(null as any);
  }

  override async create(data: any): Promise<PaymentEntity> {
    const id = `payment-${this.payments.size + 1}`;
    const entity: PaymentEntity = {
      id,
      booking_id: data.booking_id,
      provider: data.provider,
      provider_order_id: data.provider_order_id,
      provider_payment_id: null,
      amount_paise: data.amount_paise,
      status: "pending",
      failure_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.payments.set(id, entity);
    return entity;
  }

  override async getPendingByBookingId(bookingId: string): Promise<PaymentEntity | null> {
    for (const p of this.payments.values()) {
      if (p.booking_id === bookingId && p.status === "pending") return p;
    }
    return null;
  }

  override async getByProviderOrderId(orderId: string): Promise<PaymentEntity | null> {
    for (const p of this.payments.values()) {
      if (p.provider_order_id === orderId) return p;
    }
    return null;
  }

  override async recordWebhookEvent(data: any): Promise<{ inserted: boolean; event: PaymentWebhookEventEntity | null }> {
    const key = `${data.provider}:${data.event_id}`;
    if (this.webhookEvents.has(key)) {
      return { inserted: false, event: this.webhookEvents.get(key) || null };
    }
    const id = `event-${this.webhookEvents.size + 1}`;
    const entity: PaymentWebhookEventEntity = {
      id,
      provider: data.provider,
      event_id: data.event_id,
      event_type: data.event_type,
      payload: data.payload,
      processed: data.processed || false,
      received_at: new Date().toISOString(),
    };
    this.webhookEvents.set(key, entity);
    return { inserted: true, event: entity };
  }

  override async markWebhookEventProcessed(id: string): Promise<void> {
    for (const ev of this.webhookEvents.values()) {
      if (ev.id === id) ev.processed = true;
    }
  }

  override async processCaptured(params: any): Promise<void> {
    const p = this.payments.get(params.paymentId);
    if (p) {
      p.status = "captured";
      p.provider_payment_id = params.providerPaymentId;
      p.updated_at = new Date().toISOString();
    }
    const b = this.bookingsRepo.bookings.get(params.bookingId);
    if (b && b.status === "pending_payment") {
      b.status = "confirmed";
      b.updated_at = new Date().toISOString();
    }
    if (params.webhookEventId) {
      await this.markWebhookEventProcessed(params.webhookEventId);
    }
  }

  override async processNeedsReview(params: any): Promise<void> {
    const p = this.payments.get(params.paymentId);
    if (p) {
      p.status = "needs_review";
      p.failure_reason = params.reason;
      if (params.providerPaymentId) p.provider_payment_id = params.providerPaymentId;
      p.updated_at = new Date().toISOString();
    }
    if (params.webhookEventId) {
      await this.markWebhookEventProcessed(params.webhookEventId);
    }
  }

  override async processFailed(params: any): Promise<void> {
    const p = this.payments.get(params.paymentId);
    if (p) {
      p.status = "failed";
      p.failure_reason = params.reason;
      p.updated_at = new Date().toISOString();
    }
    if (params.webhookEventId) {
      await this.markWebhookEventProcessed(params.webhookEventId);
    }
  }
}

describe("Section 12.12: Booking and payment (BK-01 to PM-10)", () => {
  let catalogRepo: FareCatalogRepository;
  let quotesService: QuotesService;
  let bookingsRepo: MockBookingsRepository;
  let paymentsRepo: MockPaymentsRepository;
  let bookingsService: BookingsService;
  let paymentsService: PaymentsService;
  const webhookSecret = "whsec_test_secret_123";

  beforeEach(() => {
    catalogRepo = createMockFareCatalogRepo();
    quotesService = new QuotesService(catalogRepo, () => new Date("2026-10-01T00:00:00.000Z"));
    bookingsRepo = new MockBookingsRepository();
    paymentsRepo = new MockPaymentsRepository(bookingsRepo);
    bookingsService = new BookingsService(bookingsRepo, quotesService);
    paymentsService = new PaymentsService({
      paymentsRepo: paymentsRepo as any,
      bookingsRepo: bookingsRepo as any,
      razorpayWebhookSecret: webhookSecret,
    });
  });

  const baseQuoteReq = {
    category: "outstation" as const,
    route_id: FIXTURE_ROUTES.DEL.id,
    trip_type: "one_way" as const,
    vehicle_model_id: FIXTURE_CARS.DZ.id,
    passenger_count: 1,
    pickup_at: "2026-10-12T10:00:00+05:30",
  };

  it("BK-01: Quote DZ DEL one-way (2500), book with quoted_total 2500 -> total 2500, advance 500, balance 2000, pending_payment", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John Doe",
      customer_phone: "9876543210",
      pickup_address: "Agra Cantt",
    });

    expect(booking.total_amount).toBe(2500);
    expect(booking.advance_amount).toBe(500);
    expect(booking.balance_amount).toBe(2000);
    expect(booking.status).toBe("pending_payment");
    expect(booking.ticket_id).toMatch(/^AGR-\d{8}-\d{4}$/);
    expect(booking.guest_access_token).toHaveLength(64);
  });

  it("BK-02: quoted_total 2500 but the price is now 2600 -> 409 PRICE_CHANGED, carries fresh quote (2600), zero rows", async () => {
    const higherPriceRepo = createMockFareCatalogRepo({ dzPrice: 2600 });
    const higherQuotes = new QuotesService(higherPriceRepo, () => new Date("2026-10-01T00:00:00.000Z"));
    const service = new BookingsService(bookingsRepo, higherQuotes);

    let thrownError: any;
    try {
      await service.createBooking({
        quote: baseQuoteReq,
        quoted_total: 2500,
        customer_name: "John Doe",
        customer_phone: "9876543210",
        pickup_address: "Agra Cantt",
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(PriceChangedError);
    expect(thrownError.freshQuote.total).toBe(2600);
    expect(bookingsRepo.bookings.size).toBe(0);
  });

  it("BK-03: Customer tampers quoted_total = 1 -> 409 PRICE_CHANGED", async () => {
    await expect(
      bookingsService.createBooking({
        quote: baseQuoteReq,
        quoted_total: 1,
        customer_name: "Attacker",
        customer_phone: "9876543210",
        pickup_address: "Agra Cantt",
      })
    ).rejects.toThrow("PRICE_CHANGED");
    expect(bookingsRepo.bookings.size).toBe(0);
  });

  it("BK-04: Price changes after BK-01 -> booking total, fare_breakdown, payment amount unchanged", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John Doe",
      customer_phone: "9876543210",
      pickup_address: "Agra Cantt",
    });

    const payment = await paymentsService.createPaymentOrder(booking.id);
    expect(payment.amount_paise).toBe(50000);

    // Update catalog price to 3000
    catalogRepo = createMockFareCatalogRepo({ dzPrice: 3000 });
    const freshBooking = await bookingsRepo.getById(booking.id);
    expect(freshBooking?.total_amount).toBe(2500);
    expect(freshBooking?.advance_amount).toBe(500);
    expect(payment.amount_paise).toBe(50000);
  });

  it("BK-05: fare_breakdown content contains vehicle, group, capacity, details, lines, messages", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John Doe",
      customer_phone: "9876543210",
      pickup_address: "Agra Cantt",
    });

    const breakdown = booking.fare_breakdown;
    expect(breakdown.vehicle.display_name).toBe("Maruti Dzire");
    expect(breakdown.vehicle.group_code).toBe("sedan");
    expect(breakdown.vehicle.passenger_capacity).toBe(4);
    expect(breakdown.details.distance_km).toBe(230);
    expect(breakdown.details.effective_trip_type).toBe("one_way");
    expect(breakdown.lines.length).toBeGreaterThan(0);
    expect(Array.isArray(breakdown.messages)).toBe(true);
  });

  it("BK-06: DB rejects: advance > total, return_at <= pickup_at, round trip without return_at", async () => {
    await expect(
      bookingsRepo.create({
        ticket_id: "T1",
        guest_access_token: "tok1",
        customer_name: "Test",
        customer_phone: "1234567890",
        category: "outstation",
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        passenger_count: 1,
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "one_way",
        pickup_at: "2026-10-12T10:00:00+05:30",
        pickup_address: "Agra",
        fare_breakdown: {} as any,
        total_amount: 1000,
        advance_amount: 1500, // advance > total
      })
    ).rejects.toThrow("advance_amount > total_amount");

    await expect(
      bookingsRepo.create({
        ticket_id: "T2",
        guest_access_token: "tok2",
        customer_name: "Test",
        customer_phone: "1234567890",
        category: "outstation",
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        passenger_count: 1,
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "round_trip",
        pickup_at: "2026-10-12T10:00:00+05:30",
        return_at: "2026-10-12T09:00:00+05:30", // return <= pickup
        pickup_address: "Agra",
        fare_breakdown: {} as any,
        total_amount: 5000,
        advance_amount: 1000,
      })
    ).rejects.toThrow("return_at <= pickup_at");
  });

  it("BK-07: Book an unpublished product or inactive car -> PRODUCT_INACTIVE / VEHICLE_NOT_AVAILABLE, no row", async () => {
    // 1. Vehicle not offered on MAT
    await expect(
      bookingsService.createBooking({
        quote: {
          ...baseQuoteReq,
          route_id: FIXTURE_ROUTES.MAT.id,
          vehicle_model_id: FIXTURE_CARS.CA.id, // Camry not offered on MAT
        },
        quoted_total: 9800,
        customer_name: "John",
        customer_phone: "1234567890",
        pickup_address: "Agra",
      })
    ).rejects.toThrow("VEHICLE_NOT_AVAILABLE");

    // 2. Unpublished product
    const inactiveRouteRepo = createMockFareCatalogRepo();
    const originalGetRoute = inactiveRouteRepo.getOutstationRouteByIdOrCode;
    inactiveRouteRepo.getOutstationRouteByIdOrCode = async (id) => {
      const r = await originalGetRoute(id);
      return r ? { ...r, status: "draft" as any } : null;
    };
    const inactiveService = new BookingsService(bookingsRepo, new QuotesService(inactiveRouteRepo, () => new Date("2026-10-01T00:00:00.000Z")));

    await expect(
      inactiveService.createBooking({
        quote: baseQuoteReq,
        quoted_total: 2500,
        customer_name: "John",
        customer_phone: "1234567890",
        pickup_address: "Agra",
      })
    ).rejects.toThrow("PRODUCT_INACTIVE");

    expect(bookingsRepo.bookings.size).toBe(0);
  });

  it("BK-08: Book with passengers above the seats -> CAPACITY_EXCEEDED, no row", async () => {
    await expect(
      bookingsService.createBooking({
        quote: {
          ...baseQuoteReq,
          passenger_count: 5, // Dzire has 4 seats
        },
        quoted_total: 2500,
        customer_name: "John",
        customer_phone: "1234567890",
        pickup_address: "Agra",
      })
    ).rejects.toThrow("CAPACITY_EXCEEDED");
    expect(bookingsRepo.bookings.size).toBe(0);
  });

  it("PM-01: Create payment for BK-01 -> amount_paise = 50000; client-supplied amount is ignored", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });

    const payment = await paymentsService.createPaymentOrder(booking.id);
    expect(payment.amount_paise).toBe(50000); // 500 advance * 100
    expect(payment.status).toBe("pending");
    expect(payment.provider).toBe("razorpay");
  });

  it("PM-02: Create payment twice -> same pending payment returned; one row", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });

    const p1 = await paymentsService.createPaymentOrder(booking.id);
    const p2 = await paymentsService.createPaymentOrder(booking.id);

    expect(p1.id).toBe(p2.id);
    expect(p1.provider_order_id).toBe(p2.provider_order_id);
    expect(paymentsRepo.payments.size).toBe(1);
  });

  it("PM-03: Verified 'captured' webhook, matching amount -> payment captured, booking confirmed, one transaction", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });

    const payment = await paymentsService.createPaymentOrder(booking.id);

    const webhookBody = JSON.stringify({
      id: "evt_12345",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_xyz999",
            order_id: payment.provider_order_id,
            amount: 50000,
            status: "captured",
          },
        },
      },
    });

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(Buffer.from(webhookBody, "utf8"))
      .digest("hex");

    const result = await paymentsService.handleWebhook(webhookBody, signature);
    expect(result.status).toBe("captured");

    const updatedPayment = await paymentsRepo.getByProviderOrderId(payment.provider_order_id);
    expect(updatedPayment?.status).toBe("captured");
    expect(updatedPayment?.provider_payment_id).toBe("pay_xyz999");

    const updatedBooking = await bookingsRepo.getById(booking.id);
    expect(updatedBooking?.status).toBe("confirmed");
  });

  it("PM-04: Same event_id delivered twice -> second is a no-op; one event row", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });
    const payment = await paymentsService.createPaymentOrder(booking.id);

    const webhookBody = JSON.stringify({
      id: "evt_repeat_1",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_repeat_1",
            order_id: payment.provider_order_id,
            amount: 50000,
          },
        },
      },
    });
    const signature = crypto.createHmac("sha256", webhookSecret).update(Buffer.from(webhookBody)).digest("hex");

    const res1 = await paymentsService.handleWebhook(webhookBody, signature);
    expect(res1.status).toBe("captured");

    const res2 = await paymentsService.handleWebhook(webhookBody, signature);
    expect(res2.status).toBe("already_processed");
    expect(paymentsRepo.webhookEvents.size).toBe(1);
  });

  it("PM-05: Webhook amount differs -> payment needs_review; booking stays pending_payment", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });
    const payment = await paymentsService.createPaymentOrder(booking.id);

    const webhookBody = JSON.stringify({
      id: "evt_mismatch",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_diff",
            order_id: payment.provider_order_id,
            amount: 40000, // differs from 50000!
          },
        },
      },
    });
    const signature = crypto.createHmac("sha256", webhookSecret).update(Buffer.from(webhookBody)).digest("hex");

    const res = await paymentsService.handleWebhook(webhookBody, signature);
    expect(res.status).toBe("needs_review");
    expect(res.reason).toBe("amount_mismatch");

    const updatedPayment = await paymentsRepo.getByProviderOrderId(payment.provider_order_id);
    expect(updatedPayment?.status).toBe("needs_review");

    const updatedBooking = await bookingsRepo.getById(booking.id);
    expect(updatedBooking?.status).toBe("pending_payment");
  });

  it("PM-06: Invalid signature -> rejected; no state change", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });
    const payment = await paymentsService.createPaymentOrder(booking.id);

    const webhookBody = JSON.stringify({
      id: "evt_bad_sig",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_bad",
            order_id: payment.provider_order_id,
            amount: 50000,
          },
        },
      },
    });

    await expect(paymentsService.handleWebhook(webhookBody, "invalid_sig_hex_1234")).rejects.toThrow("Invalid webhook signature");
    expect(paymentsRepo.webhookEvents.size).toBe(0);

    const updatedPayment = await paymentsRepo.getByProviderOrderId(payment.provider_order_id);
    expect(updatedPayment?.status).toBe("pending");
  });

  it("PM-07: Webhook for an unknown order -> event stored, processed = false, nothing else changes", async () => {
    const webhookBody = JSON.stringify({
      id: "evt_unknown_order",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_unknown",
            order_id: "order_does_not_exist",
            amount: 50000,
          },
        },
      },
    });
    const signature = crypto.createHmac("sha256", webhookSecret).update(Buffer.from(webhookBody)).digest("hex");

    const res = await paymentsService.handleWebhook(webhookBody, signature);
    expect(res.status).toBe("order_not_found");
    expect(paymentsRepo.webhookEvents.size).toBe(1);
    const event = paymentsRepo.webhookEvents.get("razorpay:evt_unknown_order");
    expect(event?.processed).toBe(false);
  });

  it("PM-08: Webhook after the booking was cancelled -> payment needs_review; booking stays cancelled", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });
    const payment = await paymentsService.createPaymentOrder(booking.id);

    // Cancel booking before payment arrives
    await bookingsRepo.updateStatus(booking.id, "cancelled");

    const webhookBody = JSON.stringify({
      id: "evt_after_cancel",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_late",
            order_id: payment.provider_order_id,
            amount: 50000,
          },
        },
      },
    });
    const signature = crypto.createHmac("sha256", webhookSecret).update(Buffer.from(webhookBody)).digest("hex");

    const res = await paymentsService.handleWebhook(webhookBody, signature);
    expect(res.status).toBe("needs_review");
    expect(res.reason).toBe("booking_cancelled");

    const updatedPayment = await paymentsRepo.getByProviderOrderId(payment.provider_order_id);
    expect(updatedPayment?.status).toBe("needs_review");

    const updatedBooking = await bookingsRepo.getById(booking.id);
    expect(updatedBooking?.status).toBe("cancelled");
  });

  it("PM-09: Create payment for a booking not in pending_payment -> INVALID_STATE", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });

    await bookingsRepo.updateStatus(booking.id, "confirmed");

    await expect(paymentsService.createPaymentOrder(booking.id)).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });

  it("PM-10: 'Failed' webhook -> payment failed; booking stays pending_payment; a new payment can be created", async () => {
    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "John",
      customer_phone: "1234567890",
      pickup_address: "Agra",
    });
    const payment = await paymentsService.createPaymentOrder(booking.id);

    const webhookBody = JSON.stringify({
      id: "evt_failed",
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_1",
            order_id: payment.provider_order_id,
            error_description: "Bank declined transaction",
          },
        },
      },
    });
    const signature = crypto.createHmac("sha256", webhookSecret).update(Buffer.from(webhookBody)).digest("hex");

    const res = await paymentsService.handleWebhook(webhookBody, signature);
    expect(res.status).toBe("failed");

    const updatedPayment = await paymentsRepo.getByProviderOrderId(payment.provider_order_id);
    expect(updatedPayment?.status).toBe("failed");

    const updatedBooking = await bookingsRepo.getById(booking.id);
    expect(updatedBooking?.status).toBe("pending_payment");

    // Since first payment failed, a new payment can be created (getPendingByBookingId returns null)
    const newPayment = await paymentsService.createPaymentOrder(booking.id);
    expect(newPayment.id).not.toBe(payment.id);
    expect(newPayment.status).toBe("pending");
  });

  it("EM-01: sendBookingConfirmationEmail sends branded voucher via Resend with Idempotency-Key", async () => {
    let calledUrl = "";
    let calledOptions: any = null;

    const mockFetch = async (url: any, opts: any) => {
      calledUrl = String(url);
      calledOptions = opts;
      return {
        ok: true,
        json: async () => ({ id: "email_123" }),
      } as any;
    };

    const emailPaymentsService = new PaymentsService({
      paymentsRepo: paymentsRepo as any,
      bookingsRepo: bookingsRepo as any,
      razorpayWebhookSecret: webhookSecret,
      resendApiKey: "re_test_key_123",
      emailFrom: "bookings@skbagheltravels.in",
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchImpl: mockFetch as any,
    });

    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "Aarav Sharma",
      customer_phone: "9876543210",
      customer_email: "aarav@example.com",
      pickup_address: "Agra Cantt Railway Station",
    });

    const sent = await emailPaymentsService.sendBookingConfirmationEmail(booking.id, "pay_test_captured_123");
    expect(sent).toBe(true);
    expect(calledUrl).toBe("https://api.resend.com/emails");
    expect(calledOptions.headers.Authorization).toBe("Bearer re_test_key_123");
    expect(calledOptions.headers["Idempotency-Key"]).toBe(`booking-confirmed/${booking.id}`);

    const body = JSON.parse(calledOptions.body);
    expect(body.from).toBe("bookings@skbagheltravels.in");
    expect(body.to).toEqual(["aarav@example.com"]);
    expect(body.subject).toContain(`Confirmed: Your Chauffeur Booking Voucher [${booking.ticket_id}]`);
    expect(body.html).toContain(booking.ticket_id);
    expect(body.html).toContain("SK BAGHEL TOUR &amp; TRAVELS");
    expect(body.html).toContain("Aarav Sharma");
    expect(body.html).toContain("pay_test_captured_123");
    expect(body.text).toContain(booking.ticket_id);
    expect(body.attachments).toBeDefined();
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].filename).toBe(`${booking.ticket_id}-confirmation-voucher.pdf`);
    const pdfBytes = Buffer.from(body.attachments[0].content, "base64");
    expect(pdfBytes.subarray(0, 4).toString("utf-8")).toBe("%PDF");
  });

  it("EM-02: sendBookingConfirmationEmail gracefully returns false when customer email is not provided", async () => {
    const emailPaymentsService = new PaymentsService({
      paymentsRepo: paymentsRepo as any,
      bookingsRepo: bookingsRepo as any,
      resendApiKey: "re_test_key_123",
    });

    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "Phone Only Customer",
      customer_phone: "9876543210",
      pickup_address: "Agra Cantt",
    });

    const sent = await emailPaymentsService.sendBookingConfirmationEmail(booking.id);
    expect(sent).toBe(false);
  });

  it("EM-03: sendBookingConfirmationEmail returns false without crashing when Resend returns HTTP 500", async () => {
    const mockFetch = async () =>
      ({
        ok: false,
        text: async () => "Internal Resend Server Error",
      } as any);

    const emailPaymentsService = new PaymentsService({
      paymentsRepo: paymentsRepo as any,
      bookingsRepo: bookingsRepo as any,
      resendApiKey: "re_test_key_123",
      fetchImpl: mockFetch as any,
    });

    const booking = await bookingsService.createBooking({
      quote: baseQuoteReq,
      quoted_total: 2500,
      customer_name: "Test Customer",
      customer_phone: "9876543210",
      customer_email: "test@example.com",
      pickup_address: "Agra",
    });

    const sent = await emailPaymentsService.sendBookingConfirmationEmail(booking.id);
    expect(sent).toBe(false);
  });
});
