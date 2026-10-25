import {
  type VehicleId,
  type Vehicle,
  vehicles,
  outstationRules,
} from "../data";
import {
  type VerifiedDestination,
  resolveDistance,
  haversineRoadDistanceKm,
  findDestinationByIdOrName,
  VERIFIED_DESTINATIONS,
} from "./distance";

export interface GeoLocationPoint {
  name: string;
  lat?: number;
  lon?: number;
  address?: string;
  isVerified?: boolean;
}

export type CustomLocationInput =
  | string
  | GeoLocationPoint
  | {
      display_name: string;
      lat: string | number;
      lon: string | number;
      address?: Record<string, string>;
    };

export interface CustomRouteEstimate {
  from: GeoLocationPoint;
  to: GeoLocationPoint;
  distanceKm: number;
  durationHours: number;
  durationFormatted: string;
  highwayDescription: string;
  terrainType: "plains" | "expressway" | "ghat_hills" | "local_city";
  isDirectKnownRoute: boolean;
}

export interface VehicleFareEstimate {
  vehicleId: VehicleId;
  vehicleName: string;
  vehicleClass: string;
  seatingCapacity: number;
  luggageBags: number;
  perKmRate: number;
  billableKm: number;
  baseFare: number;
  estimatedTolls: number;
  nightAllowance: number;
  totalEstimatedFare: number;
  advanceDeposit: number;
  remainingChauffeurBalance: number;
  totalFormatted: string;
  advanceFormatted: string;
  remainingFormatted: string;
  fareBreakdown: {
    distanceChargeText: string;
    tollsPolicyText: string;
    driverAllowanceText: string;
    advancePolicyText: string;
  };
}

export interface CustomTripEstimateResult {
  route: CustomRouteEstimate;
  tripType: "one-way" | "round";
  days: number;
  departureTime?: string;
  isNightPickup: boolean;
  vehicleEstimates: Record<VehicleId, VehicleFareEstimate>;
  recommendedVehicle: VehicleFareEstimate;
}

export interface CustomEstimateOptions {
  tripType?: "one-way" | "round";
  days?: number;
  pickupTime?: string;
  preferredVehicleId?: VehicleId;
}

/** Minimum one-way base fares for outstation bookings */
const MIN_ONE_WAY_FARES: Partial<Record<VehicleId, number>> = {
  sedan: 2200,
  ertiga: 2800,
  innova: 3800,
  tempo: 5500,
  urbania: 7500,
};

/**
 * Normalizes varied location input types (plain string, LocationIQ object, or GeoLocationPoint)
 * into a structured GeoLocationPoint.
 */
export function normalizeLocationInput(
  input: CustomLocationInput,
  fallbackName = "Location"
): GeoLocationPoint {
  if (typeof input === "string") {
    const clean = input.trim();
    const verified = findDestinationByIdOrName(clean);
    if (verified) {
      return {
        name: verified.name,
        lat: verified.lat,
        lon: verified.lon,
        address: verified.desc,
        isVerified: true,
      };
    }
    return { name: clean || fallbackName, isVerified: false };
  }

  // Handle LocationIQ suggestion object or GeoLocationPoint
  const lat =
    input.lat != null && input.lat !== "" ? Number(input.lat) : undefined;
  const lon =
    input.lon != null && input.lon !== "" ? Number(input.lon) : undefined;

  let name = fallbackName;
  let address: string | undefined;

  if ("display_name" in input && typeof input.display_name === "string") {
    const parts = input.display_name.split(",").map((s) => s.trim());
    name = parts.slice(0, 2).join(", ");
    address = input.display_name;
  } else if ("name" in input && typeof input.name === "string") {
    name = input.name;
    address = input.address;
  }

  // Check if coordinates or name match a verified catalog destination
  const verified = findDestinationByIdOrName(name);
  if (verified && (!lat || !lon)) {
    return {
      name: verified.name,
      lat: verified.lat,
      lon: verified.lon,
      address: verified.desc,
      isVerified: true,
    };
  }

  return {
    name,
    lat: Number.isFinite(lat) ? lat : undefined,
    lon: Number.isFinite(lon) ? lon : undefined,
    address,
    isVerified: !!verified,
  };
}

/**
 * Detects whether a destination is located in a mountainous/ghat terrain
 * (such as Himachal Pradesh, Uttarakhand hills, or Kashmir).
 */
export function isHillyTerrain(
  point: GeoLocationPoint,
  verifiedDest?: VerifiedDestination | null
): boolean {
  if (verifiedDest?.category === "hill_station") return true;

  const nameLower = (point.name + " " + (point.address || "")).toLowerCase();
  const hillKeywords = [
    "shimla",
    "manali",
    "mussoorie",
    "nainital",
    "rishikesh",
    "dharamsala",
    "kullu",
    "solang",
    "kasol",
    "chamba",
    "dalhousie",
    "kasauli",
    "lansdowne",
    "ranikhet",
    "almora",
    "mandi",
  ];

  if (hillKeywords.some((kw) => nameLower.includes(kw))) return true;

  // Latitudinal check for North Indian Himalayan belt
  if (point.lat && point.lat > 30.1 && point.lon && point.lon > 76.5 && point.lon < 80.5) {
    return true;
  }

  return false;
}

/**
 * Checks if a pickup time string (HH:MM) falls into the night allowance window (20:00 to 06:00).
 */
export function checkIsNightPickup(timeStr?: string): boolean {
  if (!timeStr) return false;
  const hour = parseInt(timeStr.split(":")[0], 10);
  if (Number.isNaN(hour)) return false;
  return hour >= outstationRules.nightStartHour || hour < outstationRules.nightEndHour;
}

/**
 * Formats duration in hours to a readable human string (e.g. "3 hrs 45 mins").
 */
export function formatEstimatedDuration(hours: number): string {
  if (hours <= 0) return "0 mins";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes} mins`;
  }
  if (minutes === 0) {
    return `${wholeHours} ${wholeHours === 1 ? "hr" : "hrs"}`;
  }
  return `${wholeHours} ${wholeHours === 1 ? "hr" : "hrs"} ${minutes} mins`;
}

/**
 * Estimates highway route distance (km), duration (hours), and terrain characteristics
 * between any two custom locations, using GPS coordinates, LocationIQ results,
 * or verified destination fallbacks.
 */
export function estimateCustomRoute(
  originInput: CustomLocationInput,
  destInput: CustomLocationInput
): CustomRouteEstimate {
  const from = normalizeLocationInput(originInput, "Agra (Taj Ganj Hub)");
  const to = normalizeLocationInput(destInput, "Destination");

  // 1. Same origin and destination -> Local City Tour
  if (
    from.name.toLowerCase() === to.name.toLowerCase() &&
    (from.lat === to.lat || from.lat == null || to.lat == null)
  ) {
    return {
      from,
      to,
      distanceKm: 80,
      durationHours: 8,
      durationFormatted: "8 hrs / 80 km (City Tour)",
      highwayDescription: "Agra Heritage City Circuit & Ring Road",
      terrainType: "local_city",
      isDirectKnownRoute: true,
    };
  }

  const fromVerified = findDestinationByIdOrName(from.name);
  const toVerified = findDestinationByIdOrName(to.name);

  // 2. Both points match verified catalogue destinations -> Use exact ground-truth matrix
  if (fromVerified && toVerified) {
    const matrixRes = resolveDistance(fromVerified.id, toVerified.id);
    const isHills = isHillyTerrain(to, toVerified) || isHillyTerrain(from, fromVerified);
    return {
      from,
      to,
      distanceKm: matrixRes.distanceKm,
      durationHours: matrixRes.durationHours,
      durationFormatted: matrixRes.durationFormatted,
      highwayDescription: matrixRes.highwayVia,
      terrainType: isHills ? "ghat_hills" : matrixRes.highwayVia.toLowerCase().includes("expressway") ? "expressway" : "plains",
      isDirectKnownRoute: matrixRes.isDirectRoute,
    };
  }

  // 3. Exact coordinates available for both points -> Haversine calculation with terrain-aware tortuosity
  if (
    from.lat != null &&
    from.lon != null &&
    to.lat != null &&
    to.lon != null
  ) {
    const isHills = isHillyTerrain(to, toVerified) || isHillyTerrain(from, fromVerified);
    const tortuosityFactor = isHills ? 1.45 : 1.28;
    const roadKm = haversineRoadDistanceKm(
      from.lat,
      from.lon,
      to.lat,
      to.lon,
      tortuosityFactor
    );

    // Speed calculation based on terrain
    const avgSpeedKmh = isHills ? 32 : roadKm > 150 ? 65 : 48;
    const durationHours = Number((roadKm / avgSpeedKmh).toFixed(2));
    const formatted = formatEstimatedDuration(durationHours);

    const highwayDesc = isHills
      ? "Himalayan Foothills & Mountain Ghat Road"
      : roadKm > 180
      ? "National Highway / Expressway Corridor"
      : "State Highway & Regional Connecting Road";

    return {
      from,
      to,
      distanceKm: roadKm,
      durationHours,
      durationFormatted: `${formatted} (${roadKm} km)`,
      highwayDescription: highwayDesc,
      terrainType: isHills ? "ghat_hills" : "plains",
      isDirectKnownRoute: false,
    };
  }

  // 4. One point has coordinates and the other matches verified destination (e.g. Agra hub)
  const defaultHub = VERIFIED_DESTINATIONS[0]; // Agra
  const knownLat = from.lat ?? defaultHub.lat;
  const knownLon = from.lon ?? defaultHub.lon;
  const targetLat = to.lat ?? (toVerified ? toVerified.lat : defaultHub.lat + 1.2);
  const targetLon = to.lon ?? (toVerified ? toVerified.lon : defaultHub.lon + 0.8);

  const isHills = isHillyTerrain(to, toVerified);
  const roadKm = haversineRoadDistanceKm(knownLat, knownLon, targetLat, targetLon, isHills ? 1.42 : 1.28);
  const speed = isHills ? 35 : 60;
  const hours = Number((roadKm / speed).toFixed(2));

  return {
    from,
    to,
    distanceKm: roadKm,
    durationHours: hours,
    durationFormatted: `${formatEstimatedDuration(hours)} (${roadKm} km)`,
    highwayDescription: isHills ? "Scenic Hill Highway" : "Interstate Highway Corridor",
    terrainType: isHills ? "ghat_hills" : "plains",
    isDirectKnownRoute: false,
  };
}

/**
 * Calculates itemized fare estimate for a specific vehicle tier over custom distance.
 */
export function estimateVehicleFare(
  vehicle: Vehicle,
  routeEstimate: CustomRouteEstimate,
  options: CustomEstimateOptions = {}
): VehicleFareEstimate {
  const {
    tripType = "one-way",
    days = 1,
    pickupTime,
  } = options;

  const isNight = checkIsNightPickup(pickupTime);
  const distanceKm = routeEstimate.distanceKm;
  const isTempoOrUrbania = vehicle.id === "tempo" || vehicle.id === "urbania";

  // 1. Billable Distance Logic
  let billableKm: number;
  if (routeEstimate.terrainType === "local_city") {
    billableKm = 80;
  } else if (tripType === "round") {
    // 300 km/day minimum rule for round trips
    const minKmRequired = days * outstationRules.minKmPerDay;
    billableKm = Math.max(minKmRequired, distanceKm * 2);
  } else {
    // One-Way outstation:
    // Tempo / Urbania commercial vehicles mandate return garage billing if outstation
    if (isTempoOrUrbania && distanceKm > 60) {
      billableKm = Math.round(distanceKm * 1.75);
    } else {
      billableKm = Math.max(60, distanceKm);
    }
  }

  // 2. Base Distance Fare
  const minFare = MIN_ONE_WAY_FARES[vehicle.id] || 2200;
  let baseFare = Math.round(billableKm * vehicle.perKm);
  if (tripType === "one-way" && routeEstimate.terrainType !== "local_city") {
    baseFare = Math.max(minFare, baseFare);
  }

  // 3. Estimated Tolls & State Permits
  // Expressway tolls average ₹1.70 - ₹2.20 per km for cars, higher for vans
  let estimatedTolls = 0;
  if (routeEstimate.terrainType === "local_city") {
    estimatedTolls = 0; // City parking included in local package
  } else if (routeEstimate.highwayDescription.toLowerCase().includes("expressway")) {
    const ratePerKm = isTempoOrUrbania ? 2.5 : 1.7;
    estimatedTolls = Math.round(distanceKm * ratePerKm);
  } else {
    const ratePerKm = isTempoOrUrbania ? 1.8 : 1.2;
    estimatedTolls = Math.round(distanceKm * ratePerKm);
  }
  // Round tolls to nearest ₹50
  estimatedTolls = Math.max(150, Math.round(estimatedTolls / 50) * 50);

  // 4. Driver Night Allowance
  const nightAllowanceRate = isTempoOrUrbania
    ? outstationRules.nightAllowanceTempo
    : outstationRules.nightAllowanceCab;
  const nightAllowance = isNight ? nightAllowanceRate : 0;

  // 5. Total Estimated Fare
  const totalEstimatedFare = baseFare + (tripType === "one-way" ? estimatedTolls : 0) + nightAllowance;

  // 6. 28% Advance Deposit (Min ₹500, rounded to ₹100, capped at total)
  const rawAdvance = Math.max(500, Math.round((totalEstimatedFare * 0.28) / 100) * 100);
  const advanceDeposit = Math.min(totalEstimatedFare, rawAdvance);
  const remainingChauffeurBalance = Math.max(0, totalEstimatedFare - advanceDeposit);

  // Explanatory breakdown text for transparency
  const distanceChargeText =
    tripType === "round"
      ? `${billableKm} km @ ₹${vehicle.perKm}/km (${days} day${days > 1 ? "s" : ""} min 300 km/day)`
      : `${billableKm} km @ ₹${vehicle.perKm}/km`;

  const tollsPolicyText =
    tripType === "one-way"
      ? `Approx. ₹${estimatedTolls} (Expressway tolls & state entry permits included in one-way fare)`
      : `Tolls & parking billed at actual receipts during round-trip journey`;

  const driverAllowanceText = isNight
    ? `₹${nightAllowance} Night Allowance applied (Pickup between 20:00 and 06:00)`
    : `Driver day allowance & fuel included`;

  const advancePolicyText = `₹${advanceDeposit.toLocaleString("en-IN")} online booking lock-in (28%); balance ₹${remainingChauffeurBalance.toLocaleString("en-IN")} paid directly to chauffeur`;

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleClass: vehicle.klass,
    seatingCapacity: vehicle.seats,
    luggageBags: vehicle.bags,
    perKmRate: vehicle.perKm,
    billableKm,
    baseFare,
    estimatedTolls,
    nightAllowance,
    totalEstimatedFare,
    advanceDeposit,
    remainingChauffeurBalance,
    totalFormatted: `₹${totalEstimatedFare.toLocaleString("en-IN")}`,
    advanceFormatted: `₹${advanceDeposit.toLocaleString("en-IN")}`,
    remainingFormatted: `₹${remainingChauffeurBalance.toLocaleString("en-IN")}`,
    fareBreakdown: {
      distanceChargeText,
      tollsPolicyText,
      driverAllowanceText,
      advancePolicyText,
    },
  };
}

/**
 * Master Trip & Fare Estimator:
 * Calculates route distance, driving duration, terrain classification, and itemized fare quotes
 * for all 5 vehicle tiers (Sedan, Ertiga, Innova Crysta, Tempo Traveller, Force Urbania)
 * for unlisted custom addresses, LocationIQ search results, or verified hubs.
 */
export function estimateCustomTrip(
  originInput: CustomLocationInput,
  destInput: CustomLocationInput,
  options: CustomEstimateOptions = {}
): CustomTripEstimateResult {
  const route = estimateCustomRoute(originInput, destInput);
  const tripType = options.tripType || "one-way";
  const days = Math.max(1, options.days || 1);
  const isNight = checkIsNightPickup(options.pickupTime);

  const vehicleEstimates: Record<VehicleId, VehicleFareEstimate> = {} as Record<
    VehicleId,
    VehicleFareEstimate
  >;

  for (const v of vehicles) {
    vehicleEstimates[v.id] = estimateVehicleFare(v, route, {
      tripType,
      days,
      pickupTime: options.pickupTime,
    });
  }

  const preferred = options.preferredVehicleId || "sedan";
  const recommendedVehicle = vehicleEstimates[preferred] || vehicleEstimates.sedan;

  return {
    route,
    tripType,
    days,
    departureTime: options.pickupTime,
    isNightPickup: isNight,
    vehicleEstimates,
    recommendedVehicle,
  };
}
