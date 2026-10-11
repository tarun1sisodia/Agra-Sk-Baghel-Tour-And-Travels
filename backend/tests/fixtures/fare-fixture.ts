import type { VehicleGroupCode } from "../../src/contracts/fare-system.js";

export const FIXTURE_SETTINGS = {
  advance_percent: 20,
  min_km_per_day: 300,
  max_round_trip_days: 5, // newly approved limit
  night_start_hour: 20,
  night_end_hour: 6,
};

export interface GroupFixture {
  code: VehicleGroupCode;
  driver_allowance_per_day: number;
  one_way_night_charge: number;
  round_trip_halt_per_night: number;
}

export const FIXTURE_GROUPS: Record<VehicleGroupCode, GroupFixture> = {
  sedan: {
    code: "sedan",
    driver_allowance_per_day: 500,
    one_way_night_charge: 250,
    round_trip_halt_per_night: 0,
  },
  suv: {
    code: "suv",
    driver_allowance_per_day: 500,
    one_way_night_charge: 300,
    round_trip_halt_per_night: 0,
  },
  luxury: {
    code: "luxury",
    driver_allowance_per_day: 500,
    one_way_night_charge: 500,
    round_trip_halt_per_night: 0,
  },
  tempo_traveller: {
    code: "tempo_traveller",
    driver_allowance_per_day: 700,
    one_way_night_charge: 400,
    round_trip_halt_per_night: 0,
  },
};

export interface CarFixture {
  id: string;
  code: string;
  display_name: string;
  group_code: VehicleGroupCode;
  passenger_capacity: number;
  rate_per_km: number;
}

export type CarCode = "DZ" | "HC" | "ER" | "IC" | "FO" | "CA" | "VE" | "T12" | "T17" | "UR";

export const FIXTURE_CARS: Record<CarCode, CarFixture> = {
  DZ: { id: "10000000-0000-0000-0000-000000000001", code: "DZ", display_name: "Maruti Dzire", group_code: "sedan", passenger_capacity: 4, rate_per_km: 10 },
  HC: { id: "10000000-0000-0000-0000-000000000002", code: "HC", display_name: "Honda City", group_code: "sedan", passenger_capacity: 4, rate_per_km: 13 },
  ER: { id: "10000000-0000-0000-0000-000000000003", code: "ER", display_name: "Maruti Ertiga", group_code: "suv", passenger_capacity: 6, rate_per_km: 14 },
  IC: { id: "10000000-0000-0000-0000-000000000004", code: "IC", display_name: "Innova Crysta", group_code: "suv", passenger_capacity: 7, rate_per_km: 18 },
  FO: { id: "10000000-0000-0000-0000-000000000005", code: "FO", display_name: "Toyota Fortuner", group_code: "suv", passenger_capacity: 7, rate_per_km: 28 },
  CA: { id: "10000000-0000-0000-0000-000000000006", code: "CA", display_name: "Toyota Camry", group_code: "luxury", passenger_capacity: 4, rate_per_km: 40 },
  VE: { id: "10000000-0000-0000-0000-000000000007", code: "VE", display_name: "Toyota Vellfire", group_code: "luxury", passenger_capacity: 6, rate_per_km: 45 },
  T12: { id: "10000000-0000-0000-0000-000000000008", code: "T12", display_name: "Force Traveller 12-seater", group_code: "tempo_traveller", passenger_capacity: 12, rate_per_km: 25 },
  T17: { id: "10000000-0000-0000-0000-000000000009", code: "T17", display_name: "Force Traveller 17-seater", group_code: "tempo_traveller", passenger_capacity: 17, rate_per_km: 28 },
  UR: { id: "10000000-0000-0000-0000-000000000010", code: "UR", display_name: "Force Urbania 13-seater", group_code: "tempo_traveller", passenger_capacity: 13, rate_per_km: 34 },
};

export interface RouteFixture {
  id: string;
  code: string;
  origin_name: string;
  destination_name: string;
  distance_km: number;
  duration_minutes: number;
}

export type RouteCode = "DEL" | "MAT" | "JAI" | "GWA" | "LKO" | "ODD";

export const FIXTURE_ROUTES: Record<RouteCode, RouteFixture> = {
  DEL: { id: "20000000-0000-0000-0000-000000000001", code: "agra-to-delhi", origin_name: "Agra", destination_name: "Delhi", distance_km: 230.0, duration_minutes: 240 },
  MAT: { id: "20000000-0000-0000-0000-000000000002", code: "agra-to-mathura", origin_name: "Agra", destination_name: "Mathura", distance_km: 58.0, duration_minutes: 60 },
  JAI: { id: "20000000-0000-0000-0000-000000000003", code: "agra-to-jaipur", origin_name: "Agra", destination_name: "Jaipur", distance_km: 240.0, duration_minutes: 270 },
  GWA: { id: "20000000-0000-0000-0000-000000000004", code: "agra-to-gwalior", origin_name: "Agra", destination_name: "Gwalior", distance_km: 119.5, duration_minutes: 150 },
  LKO: { id: "20000000-0000-0000-0000-000000000005", code: "agra-to-lucknow", origin_name: "Agra", destination_name: "Lucknow", distance_km: 335.0, duration_minutes: 330 },
  ODD: { id: "20000000-0000-0000-0000-000000000006", code: "agra-to-test", origin_name: "Agra", destination_name: "Test", distance_km: 410.3, duration_minutes: 420 },
};

// Route vehicles: one_way_amount (null means not offered one-way), round_trip_enabled
export const FIXTURE_ROUTE_VEHICLES: Record<string, Record<string, { one_way_amount: number | null; round_trip_enabled: boolean }>> = {
  DEL: {
    DZ: { one_way_amount: 2500, round_trip_enabled: true },
    HC: { one_way_amount: 3100, round_trip_enabled: true },
    ER: { one_way_amount: 3600, round_trip_enabled: true },
    IC: { one_way_amount: 4500, round_trip_enabled: true },
    FO: { one_way_amount: 6800, round_trip_enabled: true },
    CA: { one_way_amount: 9800, round_trip_enabled: true },
    VE: { one_way_amount: 11000, round_trip_enabled: true },
    T12: { one_way_amount: 7500, round_trip_enabled: true },
    T17: { one_way_amount: 8500, round_trip_enabled: true },
    UR: { one_way_amount: 11000, round_trip_enabled: true },
  },
  MAT: {
    DZ: { one_way_amount: 1200, round_trip_enabled: true },
    ER: { one_way_amount: 1700, round_trip_enabled: true },
    IC: { one_way_amount: 2300, round_trip_enabled: true },
    T12: { one_way_amount: 3800, round_trip_enabled: true },
  },
  JAI: {
    DZ: { one_way_amount: 2900, round_trip_enabled: true },
    ER: { one_way_amount: 4100, round_trip_enabled: true },
    IC: { one_way_amount: 5300, round_trip_enabled: true },
    UR: { one_way_amount: 12000, round_trip_enabled: true },
    CA: { one_way_amount: null, round_trip_enabled: true }, // round trip only
    T17: { one_way_amount: null, round_trip_enabled: true }, // round trip only
  },
  GWA: {
    DZ: { one_way_amount: 1700, round_trip_enabled: true },
    HC: { one_way_amount: 2100, round_trip_enabled: true },
  },
  LKO: {
    DZ: { one_way_amount: 4200, round_trip_enabled: true },
    ER: { one_way_amount: 5600, round_trip_enabled: true },
    T12: { one_way_amount: 9800, round_trip_enabled: true },
  },
  ODD: {
    HC: { one_way_amount: null, round_trip_enabled: true }, // round trip only
  },
};

// Fixed products and their car prices
export const FIXTURE_FIXED_PRODUCTS = {
  local_package: {
    "L-8H": {
      id: "30000000-0000-0000-0000-000000000001",
      code: "8-hours-80-km",
      prices: { DZ: 1900, ER: 2600, IC: 3200, UR: 6000 },
    },
    "L-FD": {
      id: "30000000-0000-0000-0000-000000000002",
      code: "full-day",
      prices: { DZ: 2800, ER: 3600 },
    },
  },
  transfer: {
    "T-CANTT": {
      id: "40000000-0000-0000-0000-000000000001",
      code: "agra-cantt-transfer",
      prices: { DZ: 500, ER: 800, IC: 1000 },
    },
    "T-AIRPORT": {
      id: "40000000-0000-0000-0000-000000000002",
      code: "agra-airport-transfer",
      prices: { DZ: 600, IC: 1100 },
    },
    "T-IGI": {
      id: "40000000-0000-0000-0000-000000000003",
      code: "delhi-igi-transfer",
      prices: { DZ: 3200, IC: 5200, UR: 9500 },
    },
  },
  tour_package: {
    "P-SUNRISE": {
      id: "50000000-0000-0000-0000-000000000001",
      code: "taj-sunrise-tour",
      prices: { DZ: 1500, ER: 2200, IC: 2800, UR: 5500 },
    },
    "P-GOLDEN": {
      id: "50000000-0000-0000-0000-000000000002",
      code: "golden-triangle-tour",
      prices: { DZ: 12500, IC: 22000 },
    },
    "P-MATHURA": {
      id: "50000000-0000-0000-0000-000000000003",
      code: "mathura-vrindavan-tour",
      prices: { DZ: 2400, IC: 3800 },
    },
  },
};
