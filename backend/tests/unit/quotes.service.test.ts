import { describe, it, expect } from "vitest";
import { QuotesService } from "../../src/modules/quotes/quotes.service.js";
import type {
  FareCatalogRepository,
  VehicleGroupEntity,
  VehicleModelEntity,
  OutstationRouteEntity,
  OutstationRouteVehicleEntity,
  LocalPackageEntity,
  TransferEntity,
  TourPackageEntity,
  FareRuleEntity,
  FareSettingsMap,
} from "../../src/modules/fare-catalog/fare-catalog.repository.js";
import {
  FIXTURE_SETTINGS,
  FIXTURE_GROUPS,
  FIXTURE_CARS,
  FIXTURE_ROUTES,
  FIXTURE_ROUTE_VEHICLES,
  FIXTURE_FIXED_PRODUCTS,
} from "../fixtures/fare-fixture.js";

const TEST_NOW = new Date("2026-10-01T00:00:00.000Z");
const testClock = () => new Date(TEST_NOW);

function createMockRepo(overrides?: Partial<any>): FareCatalogRepository {
  const settings: FareSettingsMap = {
    ...FIXTURE_SETTINGS,
    ...overrides?.settings,
  };

  const groups: VehicleGroupEntity[] = Object.values(FIXTURE_GROUPS).map((g, i) => ({
    id: `10000000-0000-0000-0001-00000000000${i + 1}`,
    code: g.code,
    name: g.code.toUpperCase(),
    driver_allowance_per_day: g.driver_allowance_per_day,
    one_way_night_charge: g.one_way_night_charge,
    round_trip_halt_per_night: g.round_trip_halt_per_night,
    sort_order: i + 1,
    is_active: overrides?.inactiveGroups?.includes(g.code) ? false : true,
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
    is_active: overrides?.inactiveCars?.includes(c.code) ? false : true,
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
    status: r.code === "draft-route" ? "draft" : "published",
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
  // Outstation ₹/km
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

  // Fixed local packages
  for (const [pKey, pVal] of Object.entries(FIXTURE_FIXED_PRODUCTS.local_package)) {
    for (const [cCode, amt] of Object.entries(pVal.prices)) {
      const car = (FIXTURE_CARS as any)[cCode];
      fareRules.push({
        id: `fr-local-${pKey}-${cCode}`,
        category: "local_package",
        vehicle_model_id: car.id,
        local_package_id: pVal.id,
        transfer_id: null,
        tour_package_id: null,
        amount: amt,
        is_active: true,
      });
    }
  }

  // Fixed transfers
  for (const [pKey, pVal] of Object.entries(FIXTURE_FIXED_PRODUCTS.transfer)) {
    for (const [cCode, amt] of Object.entries(pVal.prices)) {
      const car = (FIXTURE_CARS as any)[cCode];
      fareRules.push({
        id: `fr-transfer-${pKey}-${cCode}`,
        category: "transfer",
        vehicle_model_id: car.id,
        local_package_id: null,
        transfer_id: pVal.id,
        tour_package_id: null,
        amount: amt,
        is_active: true,
      });
    }
  }

  // Fixed tours
  for (const [pKey, pVal] of Object.entries(FIXTURE_FIXED_PRODUCTS.tour_package)) {
    for (const [cCode, amt] of Object.entries(pVal.prices)) {
      const car = (FIXTURE_CARS as any)[cCode];
      fareRules.push({
        id: `fr-tour-${pKey}-${cCode}`,
        category: "tour_package",
        vehicle_model_id: car.id,
        local_package_id: null,
        transfer_id: null,
        tour_package_id: pVal.id,
        amount: amt,
        is_active: true,
      });
    }
  }

  return {
    async getFareSettings() {
      return settings;
    },
    async getVehicleGroups() {
      return groups;
    },
    async getVehicleModels() {
      return cars;
    },
    async getVehicleModelById(id: string) {
      return cars.find((c) => c.id === id) ?? null;
    },
    async getOutstationRouteByIdOrCode(idOrCode: string) {
      return routes.find((r) => r.id === idOrCode || r.code === idOrCode) ?? null;
    },
    async getOutstationRouteVehicles(routeId: string) {
      return routeVehicles.filter((rv) => rv.route_id === routeId);
    },
    async getFareRules(category: any) {
      return fareRules.filter((fr) => fr.category === category);
    },
    async getExtraCharges() {
      return [];
    },
    async getLocalPackageByIdOrCode(idOrCode: string) {
      for (const [pKey, pVal] of Object.entries(FIXTURE_FIXED_PRODUCTS.local_package)) {
        if (pVal.id === idOrCode || pVal.code === idOrCode) {
          return {
            id: pVal.id,
            code: pVal.code,
            name: pKey,
            duration_hours: 8,
            included_km: 80,
            covers: "Local",
            description: "Desc",
            inclusions_highlight: null,
            inclusions_note: null,
            image_url: null,
            gallery: [],
            inclusions: ["Fuel", "Driver"],
            exclusions: ["Parking", "Entry"],
            status: "published",
            created_at: new Date().toISOString(),
          } as LocalPackageEntity;
        }
      }
      return null;
    },
    async getTransferByIdOrCode(idOrCode: string) {
      for (const [pKey, pVal] of Object.entries(FIXTURE_FIXED_PRODUCTS.transfer)) {
        if (pVal.id === idOrCode || pVal.code === idOrCode) {
          return {
            id: pVal.id,
            code: pVal.code,
            name: pKey,
            pickup_name: "A",
            drop_name: "B",
            description: "Desc",
            inclusions_highlight: null,
            inclusions_note: null,
            image_url: null,
            gallery: [],
            inclusions: ["Toll"],
            exclusions: ["Parking"],
            status: "published",
            created_at: new Date().toISOString(),
          } as TransferEntity;
        }
      }
      return null;
    },
    async getTourPackageByIdOrCode(idOrCode: string) {
      for (const [pKey, pVal] of Object.entries(FIXTURE_FIXED_PRODUCTS.tour_package)) {
        if (pVal.id === idOrCode || pVal.code === idOrCode) {
          return {
            id: pVal.id,
            code: pVal.code,
            name: pKey,
            duration_text: "1 Day",
            days: 1,
            nights: 0,
            source: "Agra",
            destination: "Agra",
            description: "Desc",
            inclusions_highlight: null,
            inclusions_note: null,
            image_url: null,
            gallery: [],
            inclusions: ["Sightseeing"],
            exclusions: ["Meals"],
            itinerary: [],
            status: "published",
            created_at: new Date().toISOString(),
          } as TourPackageEntity;
        }
      }
      return null;
    },
  } as unknown as FareCatalogRepository;
}

describe("Quotes Service & Options Selector (Sections 12.9 & 12.10)", () => {
  const service = new QuotesService(createMockRepo(), testClock);

  describe("12.9 Grouped Selector (POST /quotes/options)", () => {
    it("VO-01: DEL one-way, 1 passenger -> sedan [DZ, HC], suv [ER, IC, FO], luxury [CA, VE], tempo [T12, T17, UR]", async () => {
      const res = await service.options({
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "one_way",
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      expect(res.groups.length).toBe(4);
      const sedan = res.groups.find((g) => g.group_code === "sedan")!;
      expect(sedan.vehicles.map((v) => v.display_name)).toEqual(["Maruti Dzire", "Honda City"]);

      const suv = res.groups.find((g) => g.group_code === "suv")!;
      expect(suv.vehicles.map((v) => v.display_name)).toEqual(["Maruti Ertiga", "Innova Crysta", "Toyota Fortuner"]);

      const luxury = res.groups.find((g) => g.group_code === "luxury")!;
      expect(luxury.vehicles.map((v) => v.display_name)).toEqual(["Toyota Camry", "Toyota Vellfire"]);

      const tempo = res.groups.find((g) => g.group_code === "tempo_traveller")!;
      expect(tempo.vehicles.map((v) => v.display_name)).toEqual([
        "Force Traveller 12-seater",
        "Force Traveller 17-seater",
        "Force Urbania 13-seater",
      ]);
    });

    it("VO-02: MAT one-way -> luxury group omitted", async () => {
      const res = await service.options({
        category: "outstation",
        route_id: FIXTURE_ROUTES.MAT.id,
        trip_type: "one_way",
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      expect(res.groups.find((g) => g.group_code === "luxury")).toBeUndefined();
      expect(res.groups.map((g) => g.group_code)).toEqual(["sedan", "suv", "tempo_traveller"]);
    });

    it("VO-03: JAI one-way -> luxury omitted, tempo has UR only", async () => {
      const res = await service.options({
        category: "outstation",
        route_id: FIXTURE_ROUTES.JAI.id,
        trip_type: "one_way",
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      expect(res.groups.find((g) => g.group_code === "luxury")).toBeUndefined();
      const tempo = res.groups.find((g) => g.group_code === "tempo_traveller")!;
      expect(tempo.vehicles.map((v) => v.display_name)).toEqual(["Force Urbania 13-seater"]);
    });

    it("VO-04: JAI round trip with dates -> CA and T17 included", async () => {
      const res = await service.options({
        category: "outstation",
        route_id: FIXTURE_ROUTES.JAI.id,
        trip_type: "round_trip",
        passenger_count: 1,
        pickup_at: "2026-10-12T08:00:00+05:30",
        return_at: "2026-10-13T20:00:00+05:30",
      });

      const luxury = res.groups.find((g) => g.group_code === "luxury")!;
      expect(luxury.vehicles.map((v) => v.display_name)).toContain("Toyota Camry");

      const tempo = res.groups.find((g) => g.group_code === "tempo_traveller")!;
      expect(tempo.vehicles.map((v) => v.display_name)).toContain("Force Traveller 17-seater");
    });

    it("VO-05: DEL one-way, 5 passengers -> 4-seater cars hidden", async () => {
      const res = await service.options({
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "one_way",
        passenger_count: 5,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      // Sedan has only 4-seaters, so sedan group must be completely omitted
      expect(res.groups.find((g) => g.group_code === "sedan")).toBeUndefined();
      // Luxury Camry has 4 seats, Vellfire has 6 seats
      const luxury = res.groups.find((g) => g.group_code === "luxury")!;
      expect(luxury.vehicles.map((v) => v.display_name)).toEqual(["Toyota Vellfire"]);
    });

    it("VO-11: Local L-8H options -> sedan [DZ], suv [ER, IC], tempo [UR]", async () => {
      const product = FIXTURE_FIXED_PRODUCTS.local_package["L-8H"];
      const res = await service.options({
        category: "local_package",
        local_package_id: product.id,
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      const sedan = res.groups.find((g) => g.group_code === "sedan")!;
      expect(sedan.vehicles.map((v) => v.display_name)).toEqual(["Maruti Dzire"]);

      const suv = res.groups.find((g) => g.group_code === "suv")!;
      expect(suv.vehicles.map((v) => v.display_name)).toEqual(["Maruti Ertiga", "Innova Crysta"]);

      const tempo = res.groups.find((g) => g.group_code === "tempo_traveller")!;
      expect(tempo.vehicles.map((v) => v.display_name)).toEqual(["Force Urbania 13-seater"]);
    });

    it("VO-12: Transfer T-IGI options -> sedan [DZ], suv [IC], tempo [UR]", async () => {
      const product = FIXTURE_FIXED_PRODUCTS.transfer["T-IGI"];
      const res = await service.options({
        category: "transfer",
        transfer_id: product.id,
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      const sedan = res.groups.find((g) => g.group_code === "sedan")!;
      expect(sedan.vehicles.map((v) => v.display_name)).toEqual(["Maruti Dzire"]);

      const suv = res.groups.find((g) => g.group_code === "suv")!;
      expect(suv.vehicles.map((v) => v.display_name)).toEqual(["Innova Crysta"]);

      const tempo = res.groups.find((g) => g.group_code === "tempo_traveller")!;
      expect(tempo.vehicles.map((v) => v.display_name)).toEqual(["Force Urbania 13-seater"]);
    });

    it("VO-13: Tour P-SUNRISE options -> sedan [DZ], suv [ER, IC], tempo [UR]", async () => {
      const product = FIXTURE_FIXED_PRODUCTS.tour_package["P-SUNRISE"];
      const res = await service.options({
        category: "tour_package",
        tour_package_id: product.id,
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });

      const sedan = res.groups.find((g) => g.group_code === "sedan")!;
      expect(sedan.vehicles.map((v) => v.display_name)).toEqual(["Maruti Dzire"]);
    });

    it("VO-15: Round trip request spanning > 5 dates throws TRIP_TOO_LONG", async () => {
      await expect(
        service.options({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          trip_type: "round_trip",
          passenger_count: 1,
          pickup_at: "2026-10-12T08:00:00+05:30",
          return_at: "2026-10-18T20:00:00+05:30", // 7 calendar days
        })
      ).rejects.toThrow("TRIP_TOO_LONG");
    });

    it("RT-EDGE-01: return time equal to or before pickup is a validation error", async () => {
      for (const return_at of [
        "2026-10-12T08:00:00+05:30",
        "2026-10-12T07:59:00+05:30",
        "2026-10-11T20:00:00+05:30",
      ]) {
        await expect(
          service.options({
            category: "outstation",
            route_id: FIXTURE_ROUTES.DEL.id,
            trip_type: "round_trip",
            passenger_count: 1,
            pickup_at: "2026-10-12T08:00:00+05:30",
            return_at,
          })
        ).rejects.toThrow("VALIDATION_ERROR");
      }
    });

    it("RT-EDGE-02: exactly five IST calendar dates are accepted", async () => {
      const res = await service.options({
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "round_trip",
        passenger_count: 1,
        pickup_at: "2026-10-12T08:00:00+05:30",
        return_at: "2026-10-16T20:00:00+05:30",
      });
      const quotes = res.groups.flatMap((group) => group.vehicles.map((vehicle) => vehicle.quote));
      expect(quotes.length).toBeGreaterThan(0);
      expect(quotes.every((quote) => quote.details.days === 5)).toBe(true);
    });

    it("RT-EDGE-03: past pickup is rejected by quote and options", async () => {
      const pastPickupService = new QuotesService(
        createMockRepo(),
        () => new Date("2026-10-13T00:00:00.000Z")
      );
      const quoteRequest = {
        category: "outstation" as const,
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "one_way" as const,
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        passenger_count: 1,
        pickup_at: "2026-10-12T10:00:00+05:30",
      };
      await expect(pastPickupService.quote(quoteRequest)).rejects.toThrow("VALIDATION_ERROR");
      await expect(
        pastPickupService.options({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          trip_type: "one_way",
          passenger_count: 1,
          pickup_at: quoteRequest.pickup_at,
        })
      ).rejects.toThrow("VALIDATION_ERROR");
    });
  });

  describe("12.10 Seats, Availability & Validation", () => {
    it("CP-01: DZ passengers 4 -> OK, 5 -> CAPACITY_EXCEEDED", async () => {
      const ok = await service.quote({
        category: "outstation",
        route_id: FIXTURE_ROUTES.DEL.id,
        trip_type: "one_way",
        vehicle_model_id: FIXTURE_CARS.DZ.id,
        passenger_count: 4,
        pickup_at: "2026-10-12T10:00:00+05:30",
      });
      expect(ok.total).toBe(2500);

      await expect(
        service.quote({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          trip_type: "one_way",
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          passenger_count: 5,
          pickup_at: "2026-10-12T10:00:00+05:30",
        })
      ).rejects.toThrow("CAPACITY_EXCEEDED");
    });

    it("AV-01: Inactive car throws VEHICLE_NOT_AVAILABLE", async () => {
      const inactiveService = new QuotesService(createMockRepo({ inactiveCars: ["DZ"] }), testClock);
      await expect(
        inactiveService.quote({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          trip_type: "one_way",
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          passenger_count: 1,
          pickup_at: "2026-10-12T10:00:00+05:30",
        })
      ).rejects.toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("AV-02: Inactive group makes its cars throw VEHICLE_NOT_AVAILABLE", async () => {
      const inactiveService = new QuotesService(createMockRepo({ inactiveGroups: ["sedan"] }), testClock);
      await expect(
        inactiveService.quote({
          category: "outstation",
          route_id: FIXTURE_ROUTES.DEL.id,
          trip_type: "one_way",
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          passenger_count: 1,
          pickup_at: "2026-10-12T10:00:00+05:30",
        })
      ).rejects.toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("AV-06: Unknown route id throws NOT_FOUND", async () => {
      await expect(
        service.quote({
          category: "outstation",
          route_id: "00000000-0000-0000-0000-000000000999",
          trip_type: "one_way",
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          passenger_count: 1,
          pickup_at: "2026-10-12T10:00:00+05:30",
        })
      ).rejects.toThrow("NOT_FOUND");
    });
  });
});
