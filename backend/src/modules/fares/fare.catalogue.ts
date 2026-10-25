import type { InternalVehicleId, VehicleTier } from "../../types/domain.js";
import { toCanonicalTierKey } from "../../contracts/vehicle-tiers.js";

export type FareByVehicle = Record<InternalVehicleId, number>;

export type VehicleSpec = {
  id: InternalVehicleId;
  tier: VehicleTier;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  alwaysRoundTrip: boolean;
};

export type RouteFare = {
  id: string;
  from: string;
  to: string;
  km: number;
  duration: string;
  kind: "one-way" | "local";
  localLabel?: string;
  fares: FareByVehicle;
};

export type TourPackageFare = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  from: number;
};

export const FARE_RULES_VERSION_DEFAULT = "2026-09-13";

export const OUTSTATION_RULES = {
  minKmPerDay: 300,
  nightAllowanceCab: 300,
  nightAllowanceTempo: 500,
  // Spec: night allowance applies when travel occurs between 22:00 and 05:00 IST
  nightStartHour: 22,
  nightEndHour: 5,
  sameDayRoundMultiplier: 1.85,
} as const;

export const VEHICLES: readonly VehicleSpec[] = [
  { id: "sedan", tier: "sedan", name: "Sedan", seats: 4, bags: 2, perKm: 10, alwaysRoundTrip: false },
  { id: "ertiga", tier: "ertiga", name: "Ertiga", seats: 6, bags: 3, perKm: 14, alwaysRoundTrip: false },
  { id: "innova", tier: "innova-crysta", name: "Innova Crysta", seats: 6, bags: 4, perKm: 18, alwaysRoundTrip: false },
  { id: "tempo", tier: "tempo_traveller", name: "Tempo Traveller", seats: 12, bags: 8, perKm: 25, alwaysRoundTrip: true },
  { id: "urbania", tier: "urbania-13", name: "Force Urbania", seats: 16, bags: 10, perKm: 34, alwaysRoundTrip: true },
];

export const PACKAGE_UPGRADES: Record<InternalVehicleId, number> = {
  sedan: 0,
  ertiga: 800,
  innova: 1800,
  tempo: 3500,
  urbania: 5500,
};

export const LOCAL_PACKAGES: Record<
  "8hr-80km" | "12hr-120km" | "airport-transfer",
  { key: string; label: string; duration: string; km: number; fares: FareByVehicle }
> = {
  "8hr-80km": {
    key: "8hr-80km",
    label: "Agra Sightseeing (8 Hours / 80 KM)",
    duration: "8 hrs / 80 km",
    km: 80,
    fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 },
  },
  "12hr-120km": {
    key: "12hr-120km",
    label: "Agra Extended Tour (12 Hours / 120 KM)",
    duration: "12 hrs / 120 km",
    km: 120,
    fares: { sedan: 2200, ertiga: 2950, innova: 3100, tempo: 6500, urbania: 8500 },
  },
  "airport-transfer": {
    key: "airport-transfer",
    label: "Airport / Station Pickup & Drop",
    duration: "Point to Point",
    km: 40,
    fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 },
  },
};

export const AIRPORT_TRANSFERS: Record<string, { name: string; km: number; fares: FareByVehicle }> = {
  "agra-station": {
    name: "Agra Cantt / Fort Railway Station Transfer",
    km: 20,
    fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 },
  },
  "agra-airport": {
    name: "Agra Kheria Airport (AGR) Transfer",
    km: 20,
    fares: { sedan: 900, ertiga: 1050, innova: 1250, tempo: 2400, urbania: 3800 },
  },
  "delhi-airport": {
    name: "Delhi IGI Airport (DEL) Direct Transfer",
    km: 225,
    fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 8500, urbania: 11500 },
  },
};

import catalogData from "./catalog.data.json" with { type: "json" };

export const CATALOG_RAW_DATA = catalogData as Record<string, any>;

export const ROUTES: readonly RouteFare[] = Object.values(catalogData).map((r: any) => ({
  id: r.id,
  from: r.from,
  to: r.to,
  km: r.km,
  duration: r.duration,
  kind: r.kind,
  localLabel: r.localLabel,
  fares: r.fares,
}));


export const PACKAGES: readonly TourPackageFare[] = [
  { id: "agra-day", slug: "agra-sightseeing", name: "Same Day Agra Taj Mahal Tour", duration: "1 day", from: 3499 },
  { id: "taj-sunrise", slug: "taj-mahal-sunrise-tour", name: "Taj Mahal Sunrise Tour", duration: "1 day", from: 12999 },
  { id: "mathura-vrindavan", slug: "mathura-vrindavan", name: "Mathura & Vrindavan Darshan", duration: "1 day", from: 4200 },
  { id: "gatimaan-express", slug: "gatimaan-express-agra-tour", name: "Same Day Agra by Gatimaan Train", duration: "1 day", from: 14999 },
  { id: "agra-fort-day", slug: "agra-unhurried", name: "Agra Overnight Experience", duration: "2 days / 1 night", from: 7800 },
  { id: "golden-triangle", slug: "golden-triangle", name: "Golden Triangle Tour", duration: "3 days / 2 nights", from: 18500 },
];


export const DIST_MAP: Record<string, number> = {
  agra: 0,
  delhi: 210,
  jaipur: 240,
  mathura: 58,
  vrindavan: 64,
  gwalior: 120,
  lucknow: 335,
  ayodhya: 470,
  varanasi: 600,
  prayagraj: 480,
  haridwar: 370,
  rishikesh: 390,
  dehradun: 420,
  chandigarh: 450,
  shimla: 580,
  manali: 750,
  "fatehpur-sikri": 40,
  bharatpur: 56,
  noida: 190,
  gurgaon: 210,
  gurugram: 210,
  amritsar: 680,
  udaipur: 640,
  jodhpur: 570,
  ajmer: 380,
  nainital: 340,
  corbett: 380,
  dholpur: 55,
  alwar: 160,
};

export const CURATED_PLACES: readonly { id: string; name: string; city: string; state: string }[] = [
  { id: "agra", name: "Agra", city: "Agra", state: "Uttar Pradesh" },
  { id: "delhi", name: "Delhi", city: "Delhi", state: "Delhi" },
  { id: "jaipur", name: "Jaipur", city: "Jaipur", state: "Rajasthan" },
  { id: "mathura", name: "Mathura", city: "Mathura", state: "Uttar Pradesh" },
  { id: "vrindavan", name: "Vrindavan", city: "Vrindavan", state: "Uttar Pradesh" },
  { id: "gwalior", name: "Gwalior", city: "Gwalior", state: "Madhya Pradesh" },
  { id: "lucknow", name: "Lucknow", city: "Lucknow", state: "Uttar Pradesh" },
  { id: "noida", name: "Noida", city: "Noida", state: "Uttar Pradesh" },
  { id: "gurgaon", name: "Gurugram", city: "Gurugram", state: "Haryana" },
  { id: "taj-mahal", name: "Taj Mahal East Gate", city: "Agra", state: "Uttar Pradesh" },
  { id: "agra-cantt", name: "Agra Cantt Railway Station", city: "Agra", state: "Uttar Pradesh" },
  { id: "agra-fort-station", name: "Agra Fort Railway Station", city: "Agra", state: "Uttar Pradesh" },
  { id: "agra-airport", name: "Agra Airport (Kheria)", city: "Agra", state: "Uttar Pradesh" },
  { id: "delhi-igi", name: "Delhi IGI Airport", city: "Delhi", state: "Delhi" },
  { id: "new-delhi-station", name: "New Delhi Railway Station", city: "Delhi", state: "Delhi" },
];

export function slugifyPlace(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isGroupExceptionVehicle(tierOrName?: string | null): boolean {
  if (!tierOrName) return false;
  try {
    const spec = vehicleSpec(tierOrName);
    return Boolean(spec.alwaysRoundTrip);
  } catch {
    const id = toInternalVehicleId(tierOrName);
    const found = VEHICLES.find((v) => v.id === id);
    return Boolean(found?.alwaysRoundTrip);
  }
}

export function toInternalVehicleId(tier: string): InternalVehicleId {
  const clean = (tier || "").trim().toLowerCase();
  if (clean === "tempo-traveller" || clean.includes("tempo")) {
    return "tempo";
  }
  if (clean === "urbania" || clean.includes("urbania") || clean.includes("force")) {
    return "urbania";
  }
  if (clean === "innova-crysta" || clean.includes("innova") || clean.includes("crysta")) {
    return "innova";
  }
  if (clean === "ertiga" || clean.includes("ertiga")) {
    return "ertiga";
  }
  return "sedan";
}

export function toVehicleTier(id: InternalVehicleId): VehicleTier {
  // Single source of truth: C-ENUM-001 (contracts/enums/vehicle-tiers.ts).
  const canonical = toCanonicalTierKey(id);
  if (!canonical) {
    throw new Error(`Unknown vehicle tier id: ${id}`);
  }
  return canonical;
}

export function vehicleSpec(tier: string): VehicleSpec {
  const id = toInternalVehicleId(tier);
  const found = VEHICLES.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown vehicle tier: ${tier}`);
  }
  return found;
}

export function nightAllowanceFor(tier: string): number {
  const id = toInternalVehicleId(tier);
  return id === "tempo" || id === "urbania"
    ? OUTSTATION_RULES.nightAllowanceTempo
    : OUTSTATION_RULES.nightAllowanceCab;
}

