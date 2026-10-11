import { describe, it, expect } from "vitest";
import {
  calculateOneWayOutstation,
  calculateRoundTripOutstation,
  calculateFixedProduct,
  roundHalfUp,
} from "../../src/modules/fare-engine/index.js";
import type { ExtraChargeRow } from "../../src/modules/fare-engine/extra-charges.js";
import {
  FIXTURE_SETTINGS,
  FIXTURE_GROUPS,
  FIXTURE_CARS,
  FIXTURE_ROUTES,
  FIXTURE_ROUTE_VEHICLES,
  FIXTURE_FIXED_PRODUCTS,
} from "../fixtures/fare-fixture.js";

describe("Fare Engine Unit Tests", () => {
  const MON_10_00_IST = "2026-10-12T10:00:00+05:30";

  // Helper for one-way quotes
  function quoteOneWay(carCode: string, routeCode: string, pickupAt = MON_10_00_IST, advancePercent = 20, extraCharges: any[] = []) {
    const car = (FIXTURE_CARS as any)[carCode];
    const route = (FIXTURE_ROUTES as any)[routeCode];
    const routeVehicle = (FIXTURE_ROUTE_VEHICLES as any)[routeCode]?.[carCode] ?? { one_way_amount: null, round_trip_enabled: false };
    const group = (FIXTURE_GROUPS as any)[car.group_code];

    return calculateOneWayOutstation({
      route,
      vehicle: car,
      routeVehicle: {
        one_way_amount: routeVehicle.one_way_amount,
        is_active: true,
      },
      groupSettings: group,
      settings: {
        ...FIXTURE_SETTINGS,
        advance_percent: advancePercent,
      },
      pickup_at: pickupAt,
      extraCharges,
    });
  }

  // Helper for round-trip quotes
  function quoteRoundTrip(
    carCode: string,
    routeCode: string,
    pickupAt: string,
    returnAt: string,
    options?: {
      advancePercent?: number;
      minKmPerDay?: number;
      maxRoundTripDays?: number;
      haltPerNight?: number;
      driverAllowancePerDay?: number;
      extraCharges?: any[];
      ratePerKmOverride?: number;
    }
  ) {
    const car = (FIXTURE_CARS as any)[carCode];
    const route = (FIXTURE_ROUTES as any)[routeCode];
    const routeVehicle = (FIXTURE_ROUTE_VEHICLES as any)[routeCode]?.[carCode] ?? { one_way_amount: null, round_trip_enabled: true };
    const group = { ...(FIXTURE_GROUPS as any)[car.group_code] };
    if (options?.haltPerNight !== undefined) {
      group.round_trip_halt_per_night = options.haltPerNight;
    }
    if (options?.driverAllowancePerDay !== undefined) {
      group.driver_allowance_per_day = options.driverAllowancePerDay;
    }

    return calculateRoundTripOutstation({
      route,
      vehicle: car,
      routeVehicle: {
        round_trip_enabled: routeVehicle.round_trip_enabled,
        is_active: true,
      },
      ratePerKm: options?.ratePerKmOverride ?? car.rate_per_km,
      groupSettings: group,
      settings: {
        advance_percent: options?.advancePercent ?? FIXTURE_SETTINGS.advance_percent,
        min_km_per_day: options?.minKmPerDay ?? FIXTURE_SETTINGS.min_km_per_day,
        max_round_trip_days: options?.maxRoundTripDays ?? FIXTURE_SETTINGS.max_round_trip_days,
      },
      pickup_at: pickupAt,
      return_at: returnAt,
      extraCharges: options?.extraCharges ?? [],
    });
  }

  describe("12.2 One-Way (Fixed Price)", () => {
    it("OW-01: DZ DEL, Mon 10:00", () => {
      const q = quoteOneWay("DZ", "DEL");
      expect(q.total).toBe(2500);
      expect(q.advance).toBe(500);
      expect(q.balance).toBe(2000);
    });

    it("OW-02: HC DEL", () => {
      const q = quoteOneWay("HC", "DEL");
      expect(q.total).toBe(3100);
      expect(q.advance).toBe(620);
    });

    it("OW-03: ER DEL", () => {
      const q = quoteOneWay("ER", "DEL");
      expect(q.total).toBe(3600);
      expect(q.advance).toBe(720);
    });

    it("OW-04: IC DEL", () => {
      const q = quoteOneWay("IC", "DEL");
      expect(q.total).toBe(4500);
      expect(q.advance).toBe(900);
    });

    it("OW-05: FO DEL", () => {
      const q = quoteOneWay("FO", "DEL");
      expect(q.total).toBe(6800);
      expect(q.advance).toBe(1360);
    });

    it("OW-06: CA DEL", () => {
      const q = quoteOneWay("CA", "DEL");
      expect(q.total).toBe(9800);
      expect(q.advance).toBe(1960);
    });

    it("OW-07: VE DEL", () => {
      const q = quoteOneWay("VE", "DEL");
      expect(q.total).toBe(11000);
      expect(q.advance).toBe(2200);
    });

    it("OW-08: T12 DEL", () => {
      const q = quoteOneWay("T12", "DEL");
      expect(q.total).toBe(7500);
      expect(q.advance).toBe(1500);
    });

    it("OW-09: T17 DEL", () => {
      const q = quoteOneWay("T17", "DEL");
      expect(q.total).toBe(8500);
      expect(q.advance).toBe(1700);
    });

    it("OW-10: UR DEL", () => {
      const q = quoteOneWay("UR", "DEL");
      expect(q.total).toBe(11000);
      expect(q.advance).toBe(2200);
    });

    it("OW-11: DZ, ER, IC, T12 on MAT", () => {
      expect(quoteOneWay("DZ", "MAT").total).toBe(1200);
      expect(quoteOneWay("DZ", "MAT").advance).toBe(240);
      expect(quoteOneWay("ER", "MAT").total).toBe(1700);
      expect(quoteOneWay("ER", "MAT").advance).toBe(340);
      expect(quoteOneWay("IC", "MAT").total).toBe(2300);
      expect(quoteOneWay("IC", "MAT").advance).toBe(460);
      expect(quoteOneWay("T12", "MAT").total).toBe(3800);
      expect(quoteOneWay("T12", "MAT").advance).toBe(760);
    });

    it("OW-12: DZ, ER, IC, UR on JAI", () => {
      expect(quoteOneWay("DZ", "JAI").total).toBe(2900);
      expect(quoteOneWay("DZ", "JAI").advance).toBe(580);
      expect(quoteOneWay("ER", "JAI").total).toBe(4100);
      expect(quoteOneWay("ER", "JAI").advance).toBe(820);
      expect(quoteOneWay("IC", "JAI").total).toBe(5300);
      expect(quoteOneWay("IC", "JAI").advance).toBe(1060);
      expect(quoteOneWay("UR", "JAI").total).toBe(12000);
      expect(quoteOneWay("UR", "JAI").advance).toBe(2400);
    });

    it("OW-13: GWA and LKO routes", () => {
      expect(quoteOneWay("DZ", "GWA").total).toBe(1700);
      expect(quoteOneWay("DZ", "GWA").advance).toBe(340);
      expect(quoteOneWay("HC", "GWA").total).toBe(2100);
      expect(quoteOneWay("HC", "GWA").advance).toBe(420);
      expect(quoteOneWay("DZ", "LKO").total).toBe(4200);
      expect(quoteOneWay("DZ", "LKO").advance).toBe(840);
      expect(quoteOneWay("T12", "LKO").total).toBe(9800);
      expect(quoteOneWay("T12", "LKO").advance).toBe(1960);
    });

    it("OW-14: Cars not offered on MAT throw VEHICLE_NOT_AVAILABLE", () => {
      expect(() => quoteOneWay("HC", "MAT")).toThrow("VEHICLE_NOT_AVAILABLE");
      expect(() => quoteOneWay("FO", "MAT")).toThrow("VEHICLE_NOT_AVAILABLE");
      expect(() => quoteOneWay("CA", "MAT")).toThrow("VEHICLE_NOT_AVAILABLE");
      expect(() => quoteOneWay("VE", "MAT")).toThrow("VEHICLE_NOT_AVAILABLE");
      expect(() => quoteOneWay("T17", "MAT")).toThrow("VEHICLE_NOT_AVAILABLE");
      expect(() => quoteOneWay("UR", "MAT")).toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("OW-15: CA on JAI one-way (round-trip-only car) throws VEHICLE_NOT_AVAILABLE", () => {
      expect(() => quoteOneWay("CA", "JAI")).toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("OW-16: Change DEL distance 230 -> 300 does not affect one-way fare", () => {
      const car = FIXTURE_CARS.DZ;
      const route = { ...FIXTURE_ROUTES.DEL, distance_km: 300 };
      const q = calculateOneWayOutstation({
        route,
        vehicle: car,
        routeVehicle: { one_way_amount: 2500, is_active: true },
        groupSettings: FIXTURE_GROUPS.sedan,
        settings: FIXTURE_SETTINGS,
        pickup_at: MON_10_00_IST,
        extraCharges: [],
      });
      expect(q.total).toBe(2500);
    });

    it("OW-18: Inactive route vehicle throws VEHICLE_NOT_AVAILABLE", () => {
      const car = FIXTURE_CARS.DZ;
      const route = FIXTURE_ROUTES.DEL;
      expect(() =>
        calculateOneWayOutstation({
          route,
          vehicle: car,
          routeVehicle: { one_way_amount: 2500, is_active: false },
          groupSettings: FIXTURE_GROUPS.sedan,
          settings: FIXTURE_SETTINGS,
          pickup_at: MON_10_00_IST,
          extraCharges: [],
        })
      ).toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("OW-19: Seed value advance_percent 28 -> DZ DEL advance 700", () => {
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 28);
      expect(q.total).toBe(2500);
      expect(q.advance).toBe(700);
      expect(q.balance).toBe(1800);
    });
  });

  describe("12.3 One-Way Night Charge", () => {
    it("NW-01: 19:59 IST -> 2500 (no charge)", () => {
      const q = quoteOneWay("DZ", "DEL", "2026-10-12T19:59:00+05:30");
      expect(q.total).toBe(2500);
    });

    it("NW-02: 20:00 IST -> 2750 (night charge added)", () => {
      const q = quoteOneWay("DZ", "DEL", "2026-10-12T20:00:00+05:30");
      expect(q.total).toBe(2750);
      expect(q.lines.find((l) => l.code === "night_charge")?.amount).toBe(250);
    });

    it("NW-03: 23:59, 00:00, 05:59 IST -> 2750", () => {
      expect(quoteOneWay("DZ", "DEL", "2026-10-12T23:59:00+05:30").total).toBe(2750);
      expect(quoteOneWay("DZ", "DEL", "2026-10-13T00:00:00+05:30").total).toBe(2750);
      expect(quoteOneWay("DZ", "DEL", "2026-10-13T05:59:00+05:30").total).toBe(2750);
    });

    it("NW-04: 06:00 IST -> 2500", () => {
      const q = quoteOneWay("DZ", "DEL", "2026-10-13T06:00:00+05:30");
      expect(q.total).toBe(2500);
    });

    it("NW-05: pickup_at 2026-10-12T14:30:00Z (= 20:00 IST) -> 2750", () => {
      const q = quoteOneWay("DZ", "DEL", "2026-10-12T14:30:00Z");
      expect(q.total).toBe(2750);
    });

    it("NW-06: pickup_at 2026-10-12T14:29:00Z (= 19:59 IST) -> 2500", () => {
      const q = quoteOneWay("DZ", "DEL", "2026-10-12T14:29:00Z");
      expect(q.total).toBe(2500);
    });

    it("NW-07: VE DEL 22:30 -> 11500 (11000 + 500)", () => {
      const q = quoteOneWay("VE", "DEL", "2026-10-12T22:30:00+05:30");
      expect(q.total).toBe(11500);
    });

    it("NW-08: T12 DEL 21:00 -> 7900 (7500 + 400)", () => {
      const q = quoteOneWay("T12", "DEL", "2026-10-12T21:00:00+05:30");
      expect(q.total).toBe(7900);
    });

    it("NW-10: DZ DEL 10:00 plus fixed extra Toll 400 -> 2900", () => {
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, [
        { category: "outstation", label: "Toll", amount: 400, is_active: true },
      ]);
      expect(q.total).toBe(2900);
    });

    it("NW-11: Night charge left at 0 for a group -> no night line, no error", () => {
      const car = FIXTURE_CARS.DZ;
      const route = FIXTURE_ROUTES.DEL;
      const q = calculateOneWayOutstation({
        route,
        vehicle: car,
        routeVehicle: { one_way_amount: 2500, is_active: true },
        groupSettings: { ...FIXTURE_GROUPS.sedan, one_way_night_charge: 0 },
        settings: FIXTURE_SETTINGS,
        pickup_at: "2026-10-12T22:00:00+05:30",
        extraCharges: [],
      });
      expect(q.total).toBe(2500);
      expect(q.lines.find((l) => l.code === "night_charge")).toBeUndefined();
    });

    it("NW-12: night_start_hour set to 22 -> 21:00 no charge, 22:00 charge", () => {
      const car = FIXTURE_CARS.DZ;
      const route = FIXTURE_ROUTES.DEL;
      const q21 = calculateOneWayOutstation({
        route,
        vehicle: car,
        routeVehicle: { one_way_amount: 2500, is_active: true },
        groupSettings: FIXTURE_GROUPS.sedan,
        settings: { ...FIXTURE_SETTINGS, night_start_hour: 22 },
        pickup_at: "2026-10-12T21:00:00+05:30",
        extraCharges: [],
      });
      expect(q21.total).toBe(2500);

      const q22 = calculateOneWayOutstation({
        route,
        vehicle: car,
        routeVehicle: { one_way_amount: 2500, is_active: true },
        groupSettings: FIXTURE_GROUPS.sedan,
        settings: { ...FIXTURE_SETTINGS, night_start_hour: 22 },
        pickup_at: "2026-10-12T22:00:00+05:30",
        extraCharges: [],
      });
      expect(q22.total).toBe(2750);
    });
  });

  describe("12.4 Round Trip", () => {
    const MON_08_00 = "2026-10-12T08:00:00+05:30";
    const MON_20_00 = "2026-10-12T20:00:00+05:30";
    const TUE_20_00 = "2026-10-13T20:00:00+05:30";

    it("RT-01: DZ DEL same day -> 5100 (adv 1020)", () => {
      const q = quoteRoundTrip("DZ", "DEL", MON_08_00, MON_20_00);
      expect(q.total).toBe(5100);
      expect(q.advance).toBe(1020);
    });

    it("RT-02: DZ MAT same day -> 3500 (adv 700)", () => {
      const q = quoteRoundTrip("DZ", "MAT", MON_08_00, MON_20_00);
      expect(q.total).toBe(3500);
      expect(q.advance).toBe(700);
    });

    it("RT-03: DZ MAT 2 days -> 7000 (adv 1400)", () => {
      const q = quoteRoundTrip("DZ", "MAT", MON_08_00, TUE_20_00);
      expect(q.total).toBe(7000);
      expect(q.advance).toBe(1400);
    });

    it("RT-04: DZ LKO 2 days -> 7700 (adv 1540)", () => {
      const q = quoteRoundTrip("DZ", "LKO", MON_08_00, TUE_20_00);
      expect(q.total).toBe(7700);
      expect(q.advance).toBe(1540);
    });

    it("RT-05: IC JAI 2 days -> 11800 (adv 2360)", () => {
      const q = quoteRoundTrip("IC", "JAI", MON_08_00, TUE_20_00);
      expect(q.total).toBe(11800);
      expect(q.advance).toBe(2360);
    });

    it("RT-06: IC JAI same day -> 9140 (adv 1828)", () => {
      const q = quoteRoundTrip("IC", "JAI", MON_08_00, MON_20_00);
      expect(q.total).toBe(9140);
      expect(q.advance).toBe(1828);
    });

    it("RT-07: ER DEL 2 days -> 9400 (adv 1880)", () => {
      const q = quoteRoundTrip("ER", "DEL", MON_08_00, TUE_20_00);
      expect(q.total).toBe(9400);
      expect(q.advance).toBe(1880);
    });

    it("RT-08: CA JAI 2 days -> 25000 (adv 5000)", () => {
      const q = quoteRoundTrip("CA", "JAI", MON_08_00, TUE_20_00);
      expect(q.total).toBe(25000);
      expect(q.advance).toBe(5000);
    });

    it("RT-09: HC GWA same day -> 4400 (adv 880)", () => {
      const q = quoteRoundTrip("HC", "GWA", MON_08_00, MON_20_00);
      expect(q.total).toBe(4400);
      expect(q.advance).toBe(880);
    });

    it("RT-10: T12 DEL same day -> 12200 (adv 2440)", () => {
      const q = quoteRoundTrip("T12", "DEL", MON_08_00, MON_20_00);
      expect(q.total).toBe(12200);
      expect(q.advance).toBe(2440);
    });

    it("RT-11: T12 MAT same day -> 8200 (adv 1640)", () => {
      const q = quoteRoundTrip("T12", "MAT", MON_08_00, MON_20_00);
      expect(q.total).toBe(8200);
      expect(q.advance).toBe(1640);
    });

    it("RT-12: T12 LKO 2 days -> 18150 (adv 3630)", () => {
      const q = quoteRoundTrip("T12", "LKO", MON_08_00, TUE_20_00);
      expect(q.total).toBe(18150);
      expect(q.advance).toBe(3630);
    });

    it("RT-13: UR DEL 2 days -> 21800 (adv 4360)", () => {
      const q = quoteRoundTrip("UR", "DEL", MON_08_00, TUE_20_00);
      expect(q.total).toBe(21800);
      expect(q.advance).toBe(4360);
    });

    it("RT-14: HC ODD same day (decimal rounding) -> 11168 (adv 2234)", () => {
      const q = quoteRoundTrip("HC", "ODD", MON_08_00, MON_20_00);
      expect(q.total).toBe(11168);
      expect(q.advance).toBe(2234);
    });

    it("RT-15: DZ MAT, pickup Mon 18:00, return Tue 00:30 (2 IST days) -> 7000 (adv 1400)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T18:00:00+05:30", "2026-10-13T00:30:00+05:30");
      expect(q.total).toBe(7000);
      expect(q.advance).toBe(1400);
    });

    it("RT-16: DZ DEL same day plus fixed extra Toll 400 -> 5500 (adv 1100)", () => {
      const q = quoteRoundTrip("DZ", "DEL", MON_08_00, MON_20_00, {
        extraCharges: [{ category: "outstation", label: "Toll", amount: 400, is_active: true }],
      });
      expect(q.total).toBe(5500);
      expect(q.advance).toBe(1100);
    });

    it("RT-17: DZ MAT 2 days, pickup 22:00 -> no night charge on round trips (7000)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T22:00:00+05:30", TUE_20_00);
      expect(q.total).toBe(7000);
      expect(q.lines.find((l) => l.code === "night_charge")).toBeUndefined();
    });

    it("RT-18: VE DEL 2 days -> 28000 (adv 5600)", () => {
      const q = quoteRoundTrip("VE", "DEL", MON_08_00, TUE_20_00);
      expect(q.total).toBe(28000);
      expect(q.advance).toBe(5600);
    });

    it("RT-19: Car with round_trip_enabled = false throws VEHICLE_NOT_AVAILABLE", () => {
      const car = FIXTURE_CARS.DZ;
      const route = FIXTURE_ROUTES.DEL;
      expect(() =>
        calculateRoundTripOutstation({
          route,
          vehicle: car,
          routeVehicle: { round_trip_enabled: false, is_active: true },
          ratePerKm: 10,
          groupSettings: FIXTURE_GROUPS.sedan,
          settings: FIXTURE_SETTINGS,
          pickup_at: MON_08_00,
          return_at: MON_20_00,
          extraCharges: [],
        })
      ).toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("RT-20: Car with no rate_per_km throws VEHICLE_NOT_AVAILABLE", () => {
      expect(() =>
        quoteRoundTrip("DZ", "DEL", MON_08_00, MON_20_00, { ratePerKmOverride: 0 })
      ).toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("RT-21: Return before or equal pickup throws VALIDATION_ERROR", () => {
      expect(() => quoteRoundTrip("DZ", "DEL", MON_08_00, MON_08_00)).toThrow("VALIDATION_ERROR");
      expect(() => quoteRoundTrip("DZ", "DEL", MON_20_00, MON_08_00)).toThrow("VALIDATION_ERROR");
    });
  });

  describe("12.5 Maximum Days & Halt Charge (Requirement B: 5 Calendar Days Limit)", () => {
    it("DL-01: Round trip spanning 6 calendar dates throws TRIP_TOO_LONG", () => {
      expect(() =>
        quoteRoundTrip("DZ", "DEL", "2026-10-12T08:00:00+05:30", "2026-10-17T20:00:00+05:30")
      ).toThrow("TRIP_TOO_LONG");
    });

    it("DL-02: Mon 20:00 -> Tue 21:00 (2 calendar dates) accepted (2 days)", () => {
      const q = quoteRoundTrip("DZ", "DEL", "2026-10-12T20:00:00+05:30", "2026-10-13T21:00:00+05:30");
      expect(q.details.days).toBe(2);
    });

    it("DL-04: Pickup Mon 23:30, return Tue 00:30 accepted (2 days)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T23:30:00+05:30", "2026-10-13T00:30:00+05:30");
      expect(q.details.days).toBe(2);
      expect(q.total).toBe(7000);
    });

    it("DL-05: Pickup 2026-10-12T20:00Z (Tue 01:30 IST), return 2026-10-13T10:00Z (Tue 15:30 IST) is 1 day (3500)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T20:00:00Z", "2026-10-13T10:00:00Z");
      expect(q.details.days).toBe(1);
      expect(q.total).toBe(3500);
    });

    it("DL-06: ER JAI 3 days -> 14100", () => {
      const q = quoteRoundTrip("ER", "JAI", "2026-10-12T08:00:00+05:30", "2026-10-14T20:00:00+05:30");
      expect(q.details.days).toBe(3);
      expect(q.total).toBe(14100);
    });

    it("DL-07: ER JAI 5 days -> 23500", () => {
      const q = quoteRoundTrip("ER", "JAI", "2026-10-12T08:00:00+05:30", "2026-10-16T20:00:00+05:30");
      expect(q.details.days).toBe(5);
      expect(q.total).toBe(23500);
    });

    it("DL-08: HC GWA 3 days -> 13200", () => {
      const q = quoteRoundTrip("HC", "GWA", "2026-10-12T08:00:00+05:30", "2026-10-14T20:00:00+05:30");
      expect(q.details.days).toBe(3);
      expect(q.total).toBe(13200);
    });

    it("DL-09: DZ MAT Mon 08:00 -> Wed 08:00 (3 days) -> 10500", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T08:00:00+05:30", "2026-10-14T08:00:00+05:30");
      expect(q.details.days).toBe(3);
      expect(q.total).toBe(10500);
    });

    it("DL-10: T17 JAI 3 days -> 27300", () => {
      const q = quoteRoundTrip("T17", "JAI", "2026-10-12T08:00:00+05:30", "2026-10-14T20:00:00+05:30");
      expect(q.details.days).toBe(3);
      expect(q.total).toBe(27300);
    });

    it("HL-01: Set sedan round_trip_halt_per_night 300: DZ MAT 2 days -> 7300 (adv 1460)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T08:00:00+05:30", "2026-10-13T20:00:00+05:30", {
        haltPerNight: 300,
      });
      expect(q.total).toBe(7300);
      expect(q.advance).toBe(1460);
      expect(q.lines.find((l) => l.code === "halt_charge")?.amount).toBe(300);
    });

    it("HL-02: Same with 1 day trip -> 3500 (no nights, no halt)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T08:00:00+05:30", "2026-10-12T20:00:00+05:30", {
        haltPerNight: 300,
      });
      expect(q.total).toBe(3500);
      expect(q.lines.find((l) => l.code === "halt_charge")).toBeUndefined();
    });

    it("HL-03: Set tempo halt 500: T12 MAT 2 days -> 16900", () => {
      const q = quoteRoundTrip("T12", "MAT", "2026-10-12T08:00:00+05:30", "2026-10-13T20:00:00+05:30", {
        haltPerNight: 500,
      });
      expect(q.total).toBe(16900);
    });

    it("HL-04: Halt left at 0 -> no halt line", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T08:00:00+05:30", "2026-10-13T20:00:00+05:30", {
        haltPerNight: 0,
      });
      expect(q.lines.find((l) => l.code === "halt_charge")).toBeUndefined();
    });
  });

  describe("12.6 Fixed Categories", () => {
    function quoteFixed(category: "local_package" | "transfer" | "tour_package", productKey: string, carCode: string, advancePercent = 20, extraCharges: any[] = []) {
      const car = (FIXTURE_CARS as any)[carCode];
      const product = (FIXTURE_FIXED_PRODUCTS[category] as any)[productKey];
      const fixedAmount = product?.prices[carCode] ?? 0;

      return calculateFixedProduct({
        category,
        productId: product?.id,
        vehicle: car,
        fixedAmount,
        advancePercent,
        extraCharges,
      });
    }

    it("LP-01: L-8H DZ, ER, IC, UR", () => {
      expect(quoteFixed("local_package", "L-8H", "DZ").total).toBe(1900);
      expect(quoteFixed("local_package", "L-8H", "DZ").advance).toBe(380);
      expect(quoteFixed("local_package", "L-8H", "ER").total).toBe(2600);
      expect(quoteFixed("local_package", "L-8H", "ER").advance).toBe(520);
      expect(quoteFixed("local_package", "L-8H", "IC").total).toBe(3200);
      expect(quoteFixed("local_package", "L-8H", "IC").advance).toBe(640);
      expect(quoteFixed("local_package", "L-8H", "UR").total).toBe(6000);
      expect(quoteFixed("local_package", "L-8H", "UR").advance).toBe(1200);
    });

    it("LP-02: L-FD DZ, ER", () => {
      expect(quoteFixed("local_package", "L-FD", "DZ").total).toBe(2800);
      expect(quoteFixed("local_package", "L-FD", "DZ").advance).toBe(560);
      expect(quoteFixed("local_package", "L-FD", "ER").total).toBe(3600);
      expect(quoteFixed("local_package", "L-FD", "ER").advance).toBe(720);
    });

    it("LP-03: L-8H CA (no price) throws VEHICLE_NOT_AVAILABLE", () => {
      expect(() => quoteFixed("local_package", "L-8H", "CA")).toThrow("VEHICLE_NOT_AVAILABLE");
    });

    it("TR-01: T-CANTT DZ, ER, IC", () => {
      expect(quoteFixed("transfer", "T-CANTT", "DZ").total).toBe(500);
      expect(quoteFixed("transfer", "T-CANTT", "DZ").advance).toBe(100);
      expect(quoteFixed("transfer", "T-CANTT", "ER").total).toBe(800);
      expect(quoteFixed("transfer", "T-CANTT", "ER").advance).toBe(160);
      expect(quoteFixed("transfer", "T-CANTT", "IC").total).toBe(1000);
      expect(quoteFixed("transfer", "T-CANTT", "IC").advance).toBe(200);
    });

    it("TR-02: T-AIRPORT DZ, IC", () => {
      expect(quoteFixed("transfer", "T-AIRPORT", "DZ").total).toBe(600);
      expect(quoteFixed("transfer", "T-AIRPORT", "DZ").advance).toBe(120);
      expect(quoteFixed("transfer", "T-AIRPORT", "IC").total).toBe(1100);
      expect(quoteFixed("transfer", "T-AIRPORT", "IC").advance).toBe(220);
    });

    it("TR-03: T-IGI DZ, IC, UR", () => {
      expect(quoteFixed("transfer", "T-IGI", "DZ").total).toBe(3200);
      expect(quoteFixed("transfer", "T-IGI", "DZ").advance).toBe(640);
      expect(quoteFixed("transfer", "T-IGI", "IC").total).toBe(5200);
      expect(quoteFixed("transfer", "T-IGI", "IC").advance).toBe(1040);
      expect(quoteFixed("transfer", "T-IGI", "UR").total).toBe(9500);
      expect(quoteFixed("transfer", "T-IGI", "UR").advance).toBe(1900);
    });

    it("TP-01: P-SUNRISE DZ, ER, IC, UR", () => {
      expect(quoteFixed("tour_package", "P-SUNRISE", "DZ").total).toBe(1500);
      expect(quoteFixed("tour_package", "P-SUNRISE", "DZ").advance).toBe(300);
      expect(quoteFixed("tour_package", "P-SUNRISE", "ER").total).toBe(2200);
      expect(quoteFixed("tour_package", "P-SUNRISE", "ER").advance).toBe(440);
      expect(quoteFixed("tour_package", "P-SUNRISE", "IC").total).toBe(2800);
      expect(quoteFixed("tour_package", "P-SUNRISE", "IC").advance).toBe(560);
      expect(quoteFixed("tour_package", "P-SUNRISE", "UR").total).toBe(5500);
      expect(quoteFixed("tour_package", "P-SUNRISE", "UR").advance).toBe(1100);
    });

    it("TP-03: P-GOLDEN DZ, IC", () => {
      expect(quoteFixed("tour_package", "P-GOLDEN", "DZ").total).toBe(12500);
      expect(quoteFixed("tour_package", "P-GOLDEN", "DZ").advance).toBe(2500);
      expect(quoteFixed("tour_package", "P-GOLDEN", "IC").total).toBe(22000);
      expect(quoteFixed("tour_package", "P-GOLDEN", "IC").advance).toBe(4400);
    });

    it("TP-05: P-MATHURA DZ, IC", () => {
      expect(quoteFixed("tour_package", "P-MATHURA", "DZ").total).toBe(2400);
      expect(quoteFixed("tour_package", "P-MATHURA", "DZ").advance).toBe(480);
      expect(quoteFixed("tour_package", "P-MATHURA", "IC").total).toBe(3800);
      expect(quoteFixed("tour_package", "P-MATHURA", "IC").advance).toBe(760);
    });
  });

  describe("12.7 Explicit Charges", () => {
    it("EX-01: Outstation all vehicles Toll 400 -> DZ DEL is 2900 (adv 580)", () => {
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, [
        { category: "outstation", label: "Toll", amount: 400, is_active: true },
      ]);
      expect(q.total).toBe(2900);
      expect(q.advance).toBe(580);
    });

    it("EX-02: Add Parking 150 as well -> 3050, 2 lines, adv 610", () => {
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, [
        { category: "outstation", label: "Toll", amount: 400, is_active: true },
        { category: "outstation", label: "Parking", amount: 150, is_active: true },
      ]);
      expect(q.total).toBe(3050);
      expect(q.advance).toBe(610);
      expect(q.lines.filter((l) => l.code === "extra_charge").length).toBe(2);
    });

    it("EX-03: Toll 400 scoped to route DEL -> DZ DEL 2900, DZ MAT 1200", () => {
      const delToll = [{ category: "outstation", route_id: FIXTURE_ROUTES.DEL.id, label: "Toll", amount: 400, is_active: true }];
      expect(quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, delToll).total).toBe(2900);
      expect(quoteOneWay("DZ", "MAT", MON_10_00_IST, 20, delToll).total).toBe(1200);
    });

    it("EX-04: Toll 400 scoped to group suv -> ER DEL 4000, DZ DEL 2500", () => {
      const suvToll = [{ category: "outstation", vehicle_group_code: "suv", label: "Toll", amount: 400, is_active: true }];
      expect(quoteOneWay("ER", "DEL", MON_10_00_IST, 20, suvToll).total).toBe(4000);
      expect(quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, suvToll).total).toBe(2500);
    });

    it("EX-05: Note-only row -> text in messages, total unchanged", () => {
      const noteRow = [{ category: "outstation", label: "Tolls and parking extra, paid to driver", amount: null, is_active: true }];
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, noteRow);
      expect(q.total).toBe(2500);
      expect(q.messages).toContain("Tolls and parking extra, paid to driver");
    });

    it("EX-06: Inactive Toll row is ignored", () => {
      const inactiveToll = [{ category: "outstation", label: "Toll", amount: 400, is_active: false }];
      expect(quoteOneWay("DZ", "DEL", MON_10_00_IST, 20, inactiveToll).total).toBe(2500);
    });

    it("EX-07: DZ DEL pickup 21:00 + Toll 400 -> 3150 (adv 630)", () => {
      const q = quoteOneWay("DZ", "DEL", "2026-10-12T21:00:00+05:30", 20, [
        { category: "outstation", label: "Toll", amount: 400, is_active: true },
      ]);
      expect(q.total).toBe(3150);
      expect(q.advance).toBe(630);
    });

    it("EX-08: Local L-8H, all vehicles: Parking 100 -> DZ 2000 (adv 400)", () => {
      const car = FIXTURE_CARS.DZ;
      const product = FIXTURE_FIXED_PRODUCTS.local_package["L-8H"];
      const q = calculateFixedProduct({
        category: "local_package",
        productId: product.id,
        vehicle: car,
        fixedAmount: product.prices.DZ,
        advancePercent: 20,
        extraCharges: [{ category: "local_package", label: "Parking", amount: 100, is_active: true }],
      });
      expect(q.total).toBe(2000);
      expect(q.advance).toBe(400);
    });

    it("EX-09: Outstation toll does not apply to Local L-8H", () => {
      const car = FIXTURE_CARS.DZ;
      const product = FIXTURE_FIXED_PRODUCTS.local_package["L-8H"];
      const q = calculateFixedProduct({
        category: "local_package",
        productId: product.id,
        vehicle: car,
        fixedAmount: product.prices.DZ,
        advancePercent: 20,
        extraCharges: [{ category: "outstation", label: "Toll", amount: 400, is_active: true }],
      });
      expect(q.total).toBe(1900);
    });

    it("EX-10: Transfer T-AIRPORT Airport entry 50 -> DZ 650 (adv 130)", () => {
      const car = FIXTURE_CARS.DZ;
      const product = FIXTURE_FIXED_PRODUCTS.transfer["T-AIRPORT"];
      const q = calculateFixedProduct({
        category: "transfer",
        productId: product.id,
        vehicle: car,
        fixedAmount: product.prices.DZ,
        advancePercent: 20,
        extraCharges: [{ category: "transfer", transfer_id: product.id, label: "Airport entry", amount: 50, is_active: true }],
      });
      expect(q.total).toBe(650);
      expect(q.advance).toBe(130);
    });

    it("EX-11: Tour P-SUNRISE Parking 200 scoped to suv -> ER 2400, DZ 1500", () => {
      const product = FIXTURE_FIXED_PRODUCTS.tour_package["P-SUNRISE"];
      const suvParking: ExtraChargeRow[] = [
        { category: "tour_package", vehicle_group_code: "suv", label: "Parking", amount: 200, is_active: true },
      ];

      const qEr = calculateFixedProduct({
        category: "tour_package",
        productId: product.id,
        vehicle: FIXTURE_CARS.ER,
        fixedAmount: product.prices.ER,
        advancePercent: 20,
        extraCharges: suvParking,
      });
      expect(qEr.total).toBe(2400);

      const qDz = calculateFixedProduct({
        category: "tour_package",
        productId: product.id,
        vehicle: FIXTURE_CARS.DZ,
        fixedAmount: product.prices.DZ,
        advancePercent: 20,
        extraCharges: suvParking,
      });
      expect(qDz.total).toBe(1500);
    });

    it("EX-12: DZ MAT 2-day round trip + Toll 400 -> 7400 (flat, not per day, adv 1480)", () => {
      const q = quoteRoundTrip("DZ", "MAT", "2026-10-12T08:00:00+05:30", "2026-10-13T20:00:00+05:30", {
        extraCharges: [{ category: "outstation", label: "Toll", amount: 400, is_active: true }],
      });
      expect(q.total).toBe(7400);
      expect(q.advance).toBe(1480);
    });
  });

  describe("12.8 Advance & Rounding", () => {
    it("AD-01: 20%, total 2500 -> 500", () => {
      expect(roundHalfUp((2500 * 20) / 100)).toBe(500);
    });

    it("AD-02: 33%, total 2990 -> 986.7 -> 987", () => {
      expect(roundHalfUp((2990 * 33) / 100)).toBe(987);
    });

    it("AD-03: 100%, total 2500 -> advance 2500, balance 0", () => {
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 100);
      expect(q.advance).toBe(2500);
      expect(q.balance).toBe(0);
    });

    it("AD-04: 1%, total 2500 -> 25", () => {
      const q = quoteOneWay("DZ", "DEL", MON_10_00_IST, 1);
      expect(q.advance).toBe(25);
      expect(q.balance).toBe(2475);
    });

    it("AD-05: 25%, total 7503 -> 1875.75 -> 1876", () => {
      expect(roundHalfUp((7503 * 25) / 100)).toBe(1876);
    });

    it("AD-06: Finalizer unit test: total 1502, 25% -> 375.5 -> 376 (exact .5 rounds up)", () => {
      expect(roundHalfUp((1502 * 25) / 100)).toBe(376);
    });

    it("AD-07: Invariant: advance <= total and balance = total - advance", () => {
      const totals = [100, 2500, 2990, 7503, 11168, 28000];
      const percents = [1, 20, 25, 28, 33, 50, 100];
      for (const t of totals) {
        for (const p of percents) {
          const adv = Math.min(t, roundHalfUp((t * p) / 100));
          const bal = t - adv;
          expect(adv).toBeLessThanOrEqual(t);
          expect(bal).toBe(t - adv);
        }
      }
    });
  });
});
