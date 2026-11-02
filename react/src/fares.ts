import {
  type City,
  type Vehicle,
  type VehicleId,
  type Route,
  type TourPackage,
  type FareByVehicle,
  cities,
  vehicles,
  routes,
  packages,
  promoCodes,
  outstationRules,
} from "@/data";

/**
 * Calculates tomorrow's date formatted as `YYYY-MM-DD` in the user's local timezone.
 * Avoids `toISOString().slice(0, 10)` which evaluates in UTC and yields the previous day
 * for users in UTC+ offsets (such as IST UTC+05:30) between midnight and 05:30 AM.
 */
export function localTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Resolves a city by ID from the canonical catalogue or generates a clean fallback.
 */
export function cityLookup(id: string): City {
  const found = cities.find((c) => c.id === id);
  if (found) return found;
  const clean = String(id || "").replace(/-/g, " ");
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return { id, name: capitalized, code: "LOC" };
}

/**
 * Resolves vehicle metadata by ID.
 */
export function vehicleLookup(id: VehicleId): Vehicle | undefined {
  return vehicles.find((v) => v.id === id);
}

/**
 * Resolves a route by ID.
 */
export function routeLookup(id: string): Route | undefined {
  return routes.find((r) => r.id === id);
}

/**
 * Resolves a tour package by either ID or slug.
 */
export function packageLookup(idOrSlug: string): TourPackage | undefined {
  return packages.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

/**
 * Formats a numeric rupee amount into Indian currency format (e.g. ₹3,499).
 */
export function formatInr(amount: number): string {
  return "₹" + Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/**
 * Computes advance booking deposit required to lock in a driver & vehicle.
 * Formula: 28% of total, rounded to the nearest ₹100, minimum ₹500, capped at total.
 */
export function advanceOf(total: number): number {
  const raw = Math.max(500, Math.round((total * 0.28) / 100) * 100);
  return Math.min(total, raw);
}

export type LocalPackageKey = "8hr-80km" | "12hr-120km" | "airport-transfer";

export type LocalPackageDefinition = {
  key: LocalPackageKey;
  label: string;
  duration: string;
  km: number;
  fares: FareByVehicle;
};

export const localPackages: Record<LocalPackageKey, LocalPackageDefinition> = {
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

/**
 * Verifies if vehicle seating capacity accommodates passenger count.
 */
export function fitsPassengers(vehicle: Vehicle, passengers: number): boolean {
  return vehicle.seats >= passengers;
}

/**
 * Night allowance constants: flat fee for outstation pickups after 8:00 PM (20:00–06:00).
 * Standard: ₹300 for passenger cabs, ₹500 for Tempo Travellers and Urbanias.
 */
export const NIGHT_ALLOWANCE = outstationRules.nightAllowanceCab;
export const NIGHT_ALLOWANCE_TEMPO = outstationRules.nightAllowanceTempo;

export function getNightAllowance(vehicleId: VehicleId): number {
  return vehicleId === "tempo" || vehicleId === "urbania"
    ? NIGHT_ALLOWANCE_TEMPO
    : NIGHT_ALLOWANCE;
}

/**
 * Checks whether a pickup time string (HH:MM) falls in the night allowance window (20:00 to 06:00).
 */
export function isNightTime(time?: string): boolean {
  if (!time) return false;
  const hour = Number(String(time).split(":")[0]);
  if (Number.isNaN(hour)) return false;
  return hour >= outstationRules.nightStartHour || hour < outstationRules.nightEndHour;
}

export type PromoResult = {
  valid: boolean;
  discount: number;
  finalTotal: number;
  desc?: string;
};

/**
 * Validates and applies a promotional discount coupon.
 */
export function applyPromo(code: string | undefined, total: number): PromoResult {
  if (!code) return { valid: false, discount: 0, finalTotal: total };
  const clean = String(code).trim().toUpperCase();
  const rule = promoCodes[clean];
  if (rule && total >= rule.minTotal) {
    const discount = Math.min(rule.discount, total);
    return { valid: true, discount, finalTotal: total - discount, desc: rule.desc };
  }
  return { valid: false, discount: 0, finalTotal: total };
}

/**
 * Distance reference matrix for dynamic outstation fare calculation between searched destinations.
 */
const DIST_MAP: Record<string, number> = {
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
  amritsar: 680,
  udaipur: 640,
  jodhpur: 570,
  ajmer: 380,
  nainital: 340,
  corbett: 380,
  dholpur: 55,
  alwar: 160,
};

/**
 * Resolves a route between origin and destination:
 * 1. If origin === destination, returns a local sightseeing route.
 * 2. If direct route exists in catalogue, returns it.
 * 3. If reverse route exists in catalogue, returns it adapted to the requested direction.
 * 4. Otherwise, calculates dynamic outstation distance and per-km fares using the DIST_MAP matrix.
 */
export function findRoute(from: string, to: string): Route | null {
  if (!from || !to) return null;
  const cleanFrom = from.trim().toLowerCase();
  const cleanTo = to.trim().toLowerCase();

  if (cleanFrom === cleanTo) {
    const existing = routes.find((r) => r.from === cleanFrom && r.to === cleanTo && r.kind === "local");
    if (existing) return existing;
    return {
      id: `${cleanFrom}-local`,
      from: cleanFrom,
      to: cleanTo,
      kind: "local",
      localLabel: `${cityLookup(cleanFrom).name} Sightseeing & Local Tour`,
      duration: "8 hrs / 80 km",
      km: 80,
      fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 },
    };
  }

  const direct = routes.find((r) => r.from === cleanFrom && r.to === cleanTo);
  if (direct) return direct;

  const reverse = routes.find((r) => r.from === cleanTo && r.to === cleanFrom);
  if (reverse) {
    return {
      ...reverse,
      id: `${cleanFrom}-to-${cleanTo}`,
      from: cleanFrom,
      to: cleanTo,
    };
  }

  // Dynamic outstation distance estimation
  const d1 = DIST_MAP[cleanFrom] != null ? DIST_MAP[cleanFrom] : 100;
  const d2 = DIST_MAP[cleanTo] != null ? DIST_MAP[cleanTo] : 250;
  const estimatedKm = Math.max(60, Math.abs(d1 - d2) || d1 + d2 || 250);
  const hrs = Math.max(1, Math.round(estimatedKm / 55));
  const durStr = `${hrs}–${hrs + 1} hrs (${estimatedKm} km)`;

  return {
    id: `${cleanFrom}-to-${cleanTo}`,
    from: cleanFrom,
    to: cleanTo,
    kind: "one-way",
    duration: durStr,
    km: estimatedKm,
    fares: {
      sedan: Math.round(Math.max(2200, estimatedKm * 10.0)),
      ertiga: Math.round(Math.max(2800, estimatedKm * 14.0)),
      innova: Math.round(Math.max(3800, estimatedKm * 18.0)),
      tempo: Math.round(Math.max(5500, estimatedKm * 25.0)),
      urbania: Math.round(Math.max(7500, estimatedKm * 34.0)),
    },
  };
}

export type CalcFareParams = {
  routeId?: string;
  from?: string;
  to?: string;
  vehicleId: VehicleId;
  tripType?: "one-way" | "round";
  packageId?: string;
  localPackageKey?: LocalPackageKey;
  time?: string;
  promoCode?: string;
};

export type FareQuote = {
  total: number;
  advance: number;
  remaining: number;
  label: string;
  duration: string;
  km: number | null;
  tripType: "one-way" | "round" | "local" | "package";
  vehicle: Vehicle;
  pack?: TourPackage;
  route?: Route;
  origin?: City;
  dest?: City;
  nightFee: number;
  roundMultiplier: boolean;
  promo: PromoResult;
  isIndicative?: boolean;
};

/**
 * Shared indicative browse-time fare helper for display purposes (cards, calculators).
 * Conforms to backend catalogue & Force vehicle round-trip rule (no 300km floor).
 * Final binding fares come from the Clean v2 quote/options endpoints.
 */
export function getIndicativeBrowseFare(
  entry: {
    km: number;
    fh?: number;
    fs?: number;
    fe?: number;
    fi?: number;
    ft?: number;
    fu?: number;
    fares?: Partial<Record<VehicleId, number>>;
  },
  vehicleId: VehicleId,
  tripType: "one-way" | "round" = "one-way"
): {
  total: number;
  advance: number;
  remaining: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  isIndicative: true;
} | null {
  const vehicle = vehicleLookup(vehicleId) || vehicles[0];
  const isForce = Boolean(vehicle.alwaysRoundTrip);
  const distanceKm = entry.km || 100;
  const billedKm = isForce ? (tripType === "round" ? distanceKm : distanceKm * 2) : distanceKm;

  let base = 0;
  if (entry.fares && entry.fares[vehicleId]) {
    base = entry.fares[vehicleId]!;
  } else if (vehicleId === "sedan" && entry.fs) {
    base = entry.fs;
  } else if (vehicleId === "ertiga" && entry.fe) {
    base = entry.fe;
  } else if (vehicleId === "innova" && entry.fi) {
    base = entry.fi;
  } else if (vehicleId === "tempo" && entry.ft) {
    base = entry.ft;
  } else if (vehicleId === "urbania" && entry.fu) {
    base = entry.fu;
  }

  if (base <= 0) {
    return null;
  }

  let total = base;
  if (isForce) {
    total = base + 500; // Driver allowance ₹500
  } else if (tripType === "round") {
    total = Math.round(base * 1.85);
  }

  const advance = advanceOf(total);
  return {
    total,
    advance,
    remaining: total - advance,
    billedKm,
    alwaysRoundTrip: isForce,
    isIndicative: true,
  };
}

/**
 * Lightweight indicative browse quote helper.
 * Final binding fares must be retrieved from the Clean v2 quote/options endpoints.
 */
export function calcFare(params: CalcFareParams): FareQuote | null {
  const {
    routeId,
    from,
    to,
    vehicleId,
    tripType = "one-way",
    packageId,
    localPackageKey,
  } = params;

  const vehicle = vehicleLookup(vehicleId) || vehicles[0];

  if (packageId) {
    const pack = packageLookup(packageId);
    if (!pack) return null;
    const total = pack.from;
    const advance = advanceOf(total);
    return {
      total,
      advance,
      remaining: total - advance,
      label: pack.name,
      duration: pack.duration,
      km: null,
      tripType: "package",
      vehicle,
      pack,
      nightFee: 0,
      roundMultiplier: false,
      promo: { valid: false, discount: 0, finalTotal: total },
      isIndicative: true,
    };
  }

  if (localPackageKey && localPackages[localPackageKey]) {
    const lp = localPackages[localPackageKey];
    const total = lp.fares[vehicle.id] ?? lp.fares.sedan;
    if (total == null || total <= 0) return null;
    const advance = advanceOf(total);
    return {
      total,
      advance,
      remaining: total - advance,
      label: lp.label,
      duration: lp.duration,
      km: lp.km,
      tripType: "local",
      vehicle,
      nightFee: 0,
      roundMultiplier: false,
      promo: { valid: false, discount: 0, finalTotal: total },
      isIndicative: true,
    };
  }

  const route = routeId ? routeLookup(routeId) : from && to ? findRoute(from, to) : null;
  if (!route) return null;

  const indicative = getIndicativeBrowseFare(
    { km: route.km, fares: route.fares },
    vehicleId,
    tripType
  );
  if (!indicative) return null;

  const origin = cityLookup(route.from);
  const dest = cityLookup(route.to);

  return {
    total: indicative.total,
    advance: indicative.advance,
    remaining: indicative.remaining,
    label: route.kind === "local" ? (route.localLabel ?? `${origin.name} Local Tour`) : `${origin.name} → ${dest.name}`,
    duration: route.duration,
    km: route.km,
    tripType: route.kind === "local" ? "local" : tripType,
    nightFee: 0,
    roundMultiplier: indicative.alwaysRoundTrip,
    vehicle,
    route,
    origin,
    dest,
    promo: { valid: false, discount: 0, finalTotal: indicative.total },
    isIndicative: true,
  };
}
