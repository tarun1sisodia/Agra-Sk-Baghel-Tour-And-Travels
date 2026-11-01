import type { VehicleTier } from "./vehicle-tiers.js";
import type { TripType } from "./trip-types.js";

export interface FareSnapshot {
  baseFare: number; // INR Rupees (whole number)
  nightAllowance: number; // INR Rupees (whole number)
  driverAllowance: number; // INR Rupees (whole number)
  tollsTaxes: number; // INR Rupees (whole number)
  promoDiscount: number; // INR Rupees (whole number)
  discountAmount?: number; // INR Rupees (whole number)
  totalFare: number; // INR Rupees (whole number)
  advancePaid: number; // INR Rupees (whole number)
  advanceAmount?: number; // INR Rupees (whole number)
  balancePayable: number; // INR Rupees (whole number)
  balanceAmount?: number; // INR Rupees (whole number)
  currency?: "INR"; // Always INR
  fareVersion?: string;
  label?: string;
  duration?: string;
  distanceKm?: number;
  billedKm?: number;
  tripType?: string;
  vehicleTier?: string;
  promoCode?: string | null;
  promoValid?: boolean;
}

export interface CalculateFareInput {
  tripType: TripType | string;
  vehicleTier: VehicleTier | string;
  distanceKm?: number;
  packageCode?: string;
  routeCode?: string;
  promoCode?: string;
  pickupDatetime?: string;
  returnDatetime?: string;
  pickupTime?: string;
  returnTime?: string;
}

export interface CalculateFareResponse {
  fare: FareSnapshot;
  breakdown?: Record<string, unknown>;
}
