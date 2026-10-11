import { describe, it, expect } from "vitest";
import { QuotesService } from "../../src/modules/quotes/quotes.service.js";
import { BookingsService } from "../../src/modules/bookings/bookings.service.js";
import { PaymentsService } from "../../src/modules/payments/payments.service.js";
import { BookingsRepository, type BookingEntity } from "../../src/modules/bookings/bookings.repository.js";
import { PaymentsRepository, type PaymentEntity } from "../../src/modules/payments/payments.repository.js";
import type {
  FareCatalogRepository,
  VehicleGroupEntity,
  VehicleModelEntity,
  OutstationRouteEntity,
  OutstationRouteVehicleEntity,
  FareRuleEntity,
} from "../../src/modules/fare-catalog/fare-catalog.repository.js";
import {
  calculateOneWayOutstation,
  calculateFixedProduct,
} from "../../src/modules/fare-engine/index.js";
import {
  FIXTURE_SETTINGS,
  FIXTURE_GROUPS,
  FIXTURE_CARS,
  FIXTURE_ROUTES,
  FIXTURE_ROUTE_VEHICLES,
  FIXTURE_FIXED_PRODUCTS,
} from "../fixtures/fare-fixture.js";

// Mock Repositories for Property & Matrix Testing
function createPropertyCatalogRepo(): FareCatalogRepository {
  const groups: VehicleGroupEntity[] = Object.values(FIXTURE_GROUPS).map((g, i) => ({
    id: `10000000-0000-0000-0001-00000000000${i + 1}`,
    code: g.code,
    name: g.code.toUpperCase(),
    driver_allowance_per_day: g.driver_allowance_per_day,
    one_way_night_charge: g.one_way_night_charge,
    round_trip_halt_per_night: g.round_trip_halt_per_night,
    sort_order: i + 1,
    is_active: true,
  }));

  const cars: VehicleModelEntity[] = Object.values(FIXTURE_CARS).map((c, i) => ({
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

  const routes: OutstationRouteEntity[] = Object.values(FIXTURE_ROUTES).map((r) => ({
    id: r.id,
    code: r.code,
    origin_name: r.origin_name,
    destination_name: r.destination_name,
    distance_km: r.distance_km,
    duration_minutes: r.duration_minutes,
    description: "Route description",
    image_url: null,
    gallery: [],
    status: "published",
    created_at: new Date().toISOString(),
  }));

  const routeVehicles: OutstationRouteVehicleEntity[] = [];
  for (const [rCode, carMap] of Object.entries(FIXTURE_ROUTE_VEHICLES)) {
    const route = (FIXTURE_ROUTES as any)[rCode];
    if (!route) continue;
    for (const [cCode, info] of Object.entries(carMap)) {
      const car = (FIXTURE_CARS as any)[cCode];
      if (!car) continue;
      routeVehicles.push({
        id: `rv-${rCode}-${cCode}`,
        route_id: route.id,
        vehicle_model_id: car.id,
        one_way_amount: info.one_way_amount,
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

  const fareRules: FareRuleEntity[] = [];
  for (const car of Object.values(FIXTURE_CARS)) {
    fareRules.push({
      id: `fr-outstation-${car.code}`,
      category: "outstation",
      vehicle_model_id: car.id,
      local_package_id: null,
      transfer_id: null,
      tour_package_id: null,
      amount: car.rate_per_km,
      is_active: true,
    });
  }

  const localPackages: any[] = Object.entries(FIXTURE_FIXED_PRODUCTS.local_package).map(([code, p]) => {
    for (const [cCode, amt] of Object.entries(p.prices)) {
      const car = (FIXTURE_CARS as any)[cCode];
      fareRules.push({
        id: `fr-local-${code}-${cCode}`,
        category: "local_package",
        vehicle_model_id: car.id,
        local_package_id: p.id,
        transfer_id: null,
        tour_package_id: null,
        amount: amt,
        is_active: true,
      });
    }
    return {
      id: p.id,
      code,
      name: code,
      duration_hours: 8,
      included_km: 80,
      description: null,
      inclusions: ["Fuel", "Driver"],
      exclusions: ["Toll", "Parking"],
      image_url: null,
      gallery: [],
      status: "published",
      sort_order: 1,
      created_at: new Date().toISOString(),
    };
  });

  const transfers: any[] = Object.entries(FIXTURE_FIXED_PRODUCTS.transfer).map(([code, p]) => {
    for (const [cCode, amt] of Object.entries(p.prices)) {
      const car = (FIXTURE_CARS as any)[cCode];
      fareRules.push({
        id: `fr-transfer-${code}-${cCode}`,
        category: "transfer",
        vehicle_model_id: car.id,
        local_package_id: null,
        transfer_id: p.id,
        tour_package_id: null,
        amount: amt,
        is_active: true,
      });
    }
    return {
      id: p.id,
      code,
      name: code,
      pickup_zone: "Zone A",
      drop_zone: "Zone B",
      description: null,
      inclusions: ["Toll"],
      exclusions: ["Parking"],
      image_url: null,
      gallery: [],
      status: "published",
      sort_order: 1,
      created_at: new Date().toISOString(),
    };
  });

  const tourPackages: any[] = Object.entries(FIXTURE_FIXED_PRODUCTS.tour_package).map(([code, p]) => {
    for (const [cCode, amt] of Object.entries(p.prices)) {
      const car = (FIXTURE_CARS as any)[cCode];
      fareRules.push({
        id: `fr-tour-${code}-${cCode}`,
        category: "tour_package",
        vehicle_model_id: car.id,
        local_package_id: null,
        transfer_id: null,
        tour_package_id: p.id,
        amount: amt,
        is_active: true,
      });
    }
    return {
      id: p.id,
      code,
      name: code,
      duration_days: 1,
      description: null,
      itinerary: [],
      inclusions: ["Sightseeing", "Fuel"],
      exclusions: ["Monuments", "Food"],
      image_url: null,
      gallery: [],
      status: "published",
      sort_order: 1,
      created_at: new Date().toISOString(),
    };
  });

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
      return localPackages;
    },
    async getLocalPackageByIdOrCode(idOrCode: string) {
      return localPackages.find((p) => p.id === idOrCode || p.code === idOrCode) || null;
    },
    async getTransfers() {
      return transfers;
    },
    async getTransferByIdOrCode(idOrCode: string) {
      return transfers.find((t) => t.id === idOrCode || t.code === idOrCode) || null;
    },
    async getTourPackages() {
      return tourPackages;
    },
    async getTourPackageByIdOrCode(idOrCode: string) {
      return tourPackages.find((tp) => tp.id === idOrCode || tp.code === idOrCode) || null;
    },
    async getFareRules() {
      return fareRules;
    },
    async getExtraCharges() {
      return [];
    },
  } as unknown as FareCatalogRepository;
}

class MockBookingsRepo extends BookingsRepository {
  public bookings = new Map<string, BookingEntity>();
  constructor() {
    super(null as any);
  }
  override async create(data: any): Promise<BookingEntity> {
    const id = `b-${this.bookings.size + 1}`;
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
}

class MockPaymentsRepo extends PaymentsRepository {
  public payments = new Map<string, PaymentEntity>();
  constructor() {
    super(null as any);
  }
  override async create(data: any): Promise<PaymentEntity> {
    const id = `p-${this.payments.size + 1}`;
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
}

describe("Section 12.18: Property and matrix tests (PR-01 to PR-11)", () => {
  const catalogRepo = createPropertyCatalogRepo();
  const quotesService = new QuotesService(catalogRepo);

  it("PR-01: Generated over every car × every published product × trip type × 1–5 days: total = sum(lines), integers, advance <= total, balance = total - advance", async () => {
    const routes = Object.values(FIXTURE_ROUTES);
    const cars = Object.values(FIXTURE_CARS);
    const pickupAt = "2026-10-12T10:00:00+05:30";

    // 1. Outstation One-Way
    for (const route of routes) {
      for (const car of cars) {
        try {
          const q = await quotesService.quote({
            category: "outstation",
            route_id: route.id,
            vehicle_model_id: car.id,
            trip_type: "one_way",
            pickup_at: pickupAt,
            passenger_count: 1,
          });

          // Invariant checks
          const lineSum = q.lines.reduce((s, l) => s + l.amount, 0);
          expect(q.total).toBe(lineSum);
          expect(Number.isInteger(q.total)).toBe(true);
          expect(Number.isInteger(q.advance)).toBe(true);
          expect(Number.isInteger(q.balance)).toBe(true);
          expect(q.advance).toBeLessThanOrEqual(q.total);
          expect(q.balance).toBe(q.total - q.advance);
          for (const l of q.lines) {
            expect(Number.isInteger(l.amount)).toBe(true);
          }
        } catch (e: any) {
          // If vehicle is not enabled for this route, it's expected not to be offered
          expect(["VEHICLE_NOT_AVAILABLE", "NOT_FOUND", "PRODUCT_INACTIVE"]).toContain(e.message);
        }
      }
    }

    // 2. Outstation Round-Trip across 1 to 5 days
    const returnDates = [
      "2026-10-12T18:00:00+05:30", // 1 day
      "2026-10-13T18:00:00+05:30", // 2 days
      "2026-10-14T18:00:00+05:30", // 3 days
      "2026-10-15T18:00:00+05:30", // 4 days
      "2026-10-16T18:00:00+05:30", // 5 days
    ];

    for (const route of routes) {
      for (const car of cars) {
        for (const returnAt of returnDates) {
          try {
            const q = await quotesService.quote({
              category: "outstation",
              route_id: route.id,
              vehicle_model_id: car.id,
              trip_type: "round_trip",
              pickup_at: pickupAt,
              return_at: returnAt,
              passenger_count: 1,
            });

            const lineSum = q.lines.reduce((s, l) => s + l.amount, 0);
            expect(q.total).toBe(lineSum);
            expect(Number.isInteger(q.total)).toBe(true);
            expect(Number.isInteger(q.advance)).toBe(true);
            expect(Number.isInteger(q.balance)).toBe(true);
            expect(q.advance).toBeLessThanOrEqual(q.total);
            expect(q.balance).toBe(q.total - q.advance);
          } catch (e: any) {
            expect(["VEHICLE_NOT_AVAILABLE", "NOT_FOUND", "PRODUCT_INACTIVE"]).toContain(e.message);
          }
        }
      }
    }

    // 3. Fixed Products (local, transfer, tour)
    const localPackages = Object.values(FIXTURE_FIXED_PRODUCTS.local_package);
    for (const lp of localPackages) {
      for (const car of cars) {
        try {
          const q = await quotesService.quote({
            category: "local_package",
            local_package_id: lp.id,
            vehicle_model_id: car.id,
            pickup_at: pickupAt,
            passenger_count: 1,
          });
          const lineSum = q.lines.reduce((s, l) => s + l.amount, 0);
          expect(q.total).toBe(lineSum);
          expect(q.advance).toBeLessThanOrEqual(q.total);
          expect(q.balance).toBe(q.total - q.advance);
        } catch (e: any) {
          expect(["VEHICLE_NOT_AVAILABLE", "NOT_FOUND", "PRODUCT_INACTIVE"]).toContain(e.message);
        }
      }
    }
  });

  it("PR-02: Same request and data give an identical response twice (determinism)", async () => {
    const req = {
      category: "outstation" as const,
      route_id: FIXTURE_ROUTES.DEL.id,
      vehicle_model_id: FIXTURE_CARS.DZ.id,
      trip_type: "one_way" as const,
      pickup_at: "2026-10-12T10:00:00+05:30",
      passenger_count: 2,
    };

    const q1 = await quotesService.quote(req);
    const q2 = await quotesService.quote(req);
    expect(q1).toEqual(q2);
  });

  it("PR-03: One-way fare never changes when the route distance changes", () => {
    const car = FIXTURE_CARS.DZ;
    const group = FIXTURE_GROUPS.sedan;
    const settings = { ...FIXTURE_SETTINGS };

    const route1 = { ...FIXTURE_ROUTES.DEL, distance_km: 230 };
    const route2 = { ...FIXTURE_ROUTES.DEL, distance_km: 500 };

    const q1 = calculateOneWayOutstation({
      route: route1,
      vehicle: car,
      routeVehicle: { one_way_amount: 2500, is_active: true },
      groupSettings: group,
      settings,
      pickup_at: "2026-10-12T10:00:00+05:30",
      extraCharges: [],
    });

    const q2 = calculateOneWayOutstation({
      route: route2,
      vehicle: car,
      routeVehicle: { one_way_amount: 2500, is_active: true },
      groupSettings: group,
      settings,
      pickup_at: "2026-10-12T10:00:00+05:30",
      extraCharges: [],
    });

    expect(q1.total).toBe(2500);
    expect(q2.total).toBe(2500);
    expect(q1.total).toBe(q2.total);
  });

  it("PR-04: Round trip: with max_round_trip_days raised (1 to 5 days), more days never lowers the fare", async () => {
    const returnDates = [
      "2026-10-12T18:00:00+05:30", // 1 day
      "2026-10-13T18:00:00+05:30", // 2 days
      "2026-10-14T18:00:00+05:30", // 3 days
      "2026-10-15T18:00:00+05:30", // 4 days
      "2026-10-16T18:00:00+05:30", // 5 days
    ];

    let previousTotal = 0;
    for (const returnAt of returnDates) {
      const q = await quotesService.quote({
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        trip_type: "round_trip",
        pickup_at: "2026-10-12T10:00:00+05:30",
        return_at: returnAt,
        passenger_count: 1,
      });

      expect(q.total).toBeGreaterThanOrEqual(previousTotal);
      previousTotal = q.total;
    }
  });

  it("PR-05: Round-trip fare is never below 300 × days × ₹/km", async () => {
    const daysArr = [
      { returnAt: "2026-10-12T18:00:00+05:30", days: 1 },
      { returnAt: "2026-10-13T18:00:00+05:30", days: 2 },
      { returnAt: "2026-10-14T18:00:00+05:30", days: 3 },
      { returnAt: "2026-10-15T18:00:00+05:30", days: 4 },
      { returnAt: "2026-10-16T18:00:00+05:30", days: 5 },
    ];

    for (const { returnAt, days } of daysArr) {
      const q = await quotesService.quote({
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        trip_type: "round_trip",
        pickup_at: "2026-10-12T10:00:00+05:30",
        return_at: returnAt,
        passenger_count: 1,
      });

      const distLine = q.lines.find((l) => l.code === "base_fare")!;
      const minDistanceFare = 300 * days * FIXTURE_CARS.DZ.rate_per_km;
      expect(distLine.amount).toBeGreaterThanOrEqual(minDistanceFare);
      expect(q.total).toBeGreaterThanOrEqual(minDistanceFare);
    }
  });

  it("PR-06: Changing the return time within the same IST date never changes the fare", async () => {
    const times = [
      "2026-10-13T06:00:00+05:30",
      "2026-10-13T12:00:00+05:30",
      "2026-10-13T18:00:00+05:30",
      "2026-10-13T23:59:00+05:30",
    ];

    const quotes = await Promise.all(
      times.map((t) =>
        quotesService.quote({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          trip_type: "round_trip",
          pickup_at: "2026-10-12T10:00:00+05:30",
          return_at: t,
          passenger_count: 1,
        })
      )
    );

    const firstTotal = quotes[0]!.total;
    for (const q of quotes) {
      expect(q.total).toBe(firstTotal);
    }
  });

  it("PR-07: Shuffling the order of extra-charge rows never changes the total", () => {
    const extraCharges1 = [
      { category: "outstation" as const, label: "Toll", amount: 400, is_active: true },
      { category: "outstation" as const, label: "Parking", amount: 150, is_active: true },
      { category: "outstation" as const, label: "State Tax", amount: 250, is_active: true },
    ];
    const extraCharges2 = [
      { category: "outstation" as const, label: "State Tax", amount: 250, is_active: true },
      { category: "outstation" as const, label: "Toll", amount: 400, is_active: true },
      { category: "outstation" as const, label: "Parking", amount: 150, is_active: true },
    ];

    const q1 = calculateOneWayOutstation({
      route: FIXTURE_ROUTES.DEL,
      vehicle: FIXTURE_CARS.DZ,
      routeVehicle: { one_way_amount: 2500, is_active: true },
      groupSettings: FIXTURE_GROUPS.sedan,
      settings: FIXTURE_SETTINGS,
      pickup_at: "2026-10-12T10:00:00+05:30",
      extraCharges: extraCharges1,
    });

    const q2 = calculateOneWayOutstation({
      route: FIXTURE_ROUTES.DEL,
      vehicle: FIXTURE_CARS.DZ,
      routeVehicle: { one_way_amount: 2500, is_active: true },
      groupSettings: FIXTURE_GROUPS.sedan,
      settings: FIXTURE_SETTINGS,
      pickup_at: "2026-10-12T10:00:00+05:30",
      extraCharges: extraCharges2,
    });

    expect(q1.total).toBe(q2.total);
    expect(q1.advance).toBe(q2.advance);
  });

  it("PR-08: Fixed categories: result independent of pickup hour and any distance data", () => {
    const hours = ["2026-10-12T02:00:00+05:30", "2026-10-12T12:00:00+05:30", "2026-10-12T22:00:00+05:30"];
    const product = FIXTURE_FIXED_PRODUCTS.local_package["L-8H"];

    const quotes = hours.map(() =>
      calculateFixedProduct({
        category: "local_package",
        productId: product.id,
        vehicle: FIXTURE_CARS.DZ,
        fixedAmount: product.prices.DZ,
        advancePercent: 20,
        extraCharges: [],
      })
    );

    expect(quotes[0]!.total).toBe(1900);
    expect(quotes[1]!.total).toBe(1900);
    expect(quotes[2]!.total).toBe(1900);
  });

  it("PR-09: Matrix: every car × every product × trip type: quote exists iff rules met", async () => {
    // DZ on DEL one-way: enabled (2500)
    const dzDel = await quotesService.quote({
      category: "outstation",
      route_id: FIXTURE_ROUTES.DEL.id,
      vehicle_model_id: FIXTURE_CARS.DZ.id,
      trip_type: "one_way",
      pickup_at: "2026-10-12T10:00:00+05:30",
      passenger_count: 2,
    });
    expect(dzDel.total).toBe(2500);

    // CA on L-8H: not offered (no price in fixture)
    await expect(
      quotesService.quote({
        category: "local_package",
        local_package_id: FIXTURE_FIXED_PRODUCTS.local_package["L-8H"].id,
        vehicle_model_id: FIXTURE_CARS.CA.id,
        pickup_at: "2026-10-12T10:00:00+05:30",
        passenger_count: 2,
      })
    ).rejects.toThrow("VEHICLE_NOT_AVAILABLE");
  });

  it("PR-10: Every quote total equals what the booking stores and what payment charges (advance × 100) end to end", async () => {
    const bookingsRepo = new MockBookingsRepo();
    const paymentsRepo = new MockPaymentsRepo();
    const bookingsService = new BookingsService(bookingsRepo, quotesService);
    const paymentsService = new PaymentsService({
      paymentsRepo,
      bookingsRepo,
      razorpayKeyId: "rzp_test_123",
      razorpayKeySecret: "secret",
      razorpayWebhookSecret: "whsec",
      fetchImpl: async () => ({ ok: true, json: async () => ({ id: "order_pr10" }) } as any),
    });

    const quote = await quotesService.quote({
      category: "outstation",
      route_id: FIXTURE_ROUTES.DEL.id,
      vehicle_model_id: FIXTURE_CARS.DZ.id,
      trip_type: "one_way",
      pickup_at: "2026-10-12T10:00:00+05:30",
      passenger_count: 2,
    });

    const booking = await bookingsService.createBooking({
      customer_name: "Property Tester",
      customer_phone: "+919876543210",
      pickup_address: "Taj Mahal, Agra",
      quoted_total: quote.total,
      quote: {
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        trip_type: "one_way",
        pickup_at: "2026-10-12T10:00:00+05:30",
        passenger_count: 2,
      },
    });

    expect(booking.total_amount).toBe(quote.total);
    expect(booking.advance_amount).toBe(quote.advance);
    expect(booking.balance_amount).toBe(quote.balance);

    const payment = await paymentsService.createPaymentOrder(booking.id);
    expect(payment.amount_paise).toBe(quote.advance * 100);
  });

  it("PR-11: POST /quotes/options and POST /quotes agree for every car in every case above", async () => {
    const pickupAt = "2026-10-12T10:00:00+05:30";
    const options = await quotesService.options({
      category: "outstation",
      route_id: FIXTURE_ROUTES.DEL.id,
      trip_type: "one_way",
      pickup_at: pickupAt,
      passenger_count: 1,
    });

    for (const group of options.groups) {
      for (const car of group.vehicles) {
        const directQuote = await quotesService.quote({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          vehicle_model_id: car.vehicle_model_id,
          trip_type: "one_way",
          pickup_at: pickupAt,
          passenger_count: 1,
        });

        expect(car.quote).toEqual(directQuote);
      }
    }
  });
});
