import type { QuoteLine, QuoteResponse, VehicleGroupCode } from "../../../contracts/fare-system.js";
import { calculateIstCalendarDays } from "../datetime.js";
import { resolveApplicableExtraCharges, type ExtraChargeRow } from "../extra-charges.js";
import { finalizeQuote } from "../finalizer.js";
import { roundHalfUp } from "../rounding.js";

export interface CalculateRoundTripInput {
  route: {
    id: string;
    distance_km: number;
    duration_minutes?: number | null;
  };
  vehicle: {
    id: string;
    display_name: string;
    passenger_capacity: number;
    group_code: VehicleGroupCode;
  };
  routeVehicle: {
    round_trip_enabled: boolean;
    is_active: boolean;
  };
  ratePerKm: number; // from fare_rules (outstation)
  groupSettings: {
    driver_allowance_per_day: number;
    round_trip_halt_per_night: number;
  };
  settings: {
    advance_percent: number;
    min_km_per_day: number;
    max_round_trip_days: number;
  };
  pickup_at: string | Date;
  return_at: string | Date;
  extraCharges: ExtraChargeRow[];
}

export function calculateRoundTripOutstation(input: CalculateRoundTripInput): QuoteResponse {
  if (!input.routeVehicle.is_active || !input.routeVehicle.round_trip_enabled) {
    throw new Error("VEHICLE_NOT_AVAILABLE");
  }

  if (!input.ratePerKm || input.ratePerKm <= 0) {
    throw new Error("VEHICLE_NOT_AVAILABLE");
  }

  const pickupDate = new Date(input.pickup_at);
  const returnDate = new Date(input.return_at);

  if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime()) || returnDate <= pickupDate) {
    throw new Error("VALIDATION_ERROR");
  }

  const days = calculateIstCalendarDays(pickupDate, returnDate);
  if (days <= 0) {
    throw new Error("VALIDATION_ERROR");
  }

  if (days > input.settings.max_round_trip_days) {
    throw new Error("TRIP_TOO_LONG");
  }

  const nights = days - 1;
  const distanceKm = input.route.distance_km;
  const billableKm = Math.max(2 * distanceKm, input.settings.min_km_per_day * days);
  const baseFare = roundHalfUp(billableKm * input.ratePerKm);

  const lines: QuoteLine[] = [
    {
      code: "base_fare",
      label: "Base Fare",
      amount: baseFare,
    },
  ];

  // Driver allowance (every round trip, same day included)
  const allowance = input.groupSettings.driver_allowance_per_day * days;
  if (allowance > 0) {
    lines.push({
      code: "driver_allowance",
      label: `Driver Allowance (${days} days)`,
      amount: allowance,
    });
  }

  // Night halt charge (round trips per night)
  const halt = input.groupSettings.round_trip_halt_per_night * nights;
  if (halt > 0) {
    lines.push({
      code: "halt_charge",
      label: `Night Halt Charge (${nights} nights)`,
      amount: halt,
    });
  }

  // Explicit extra charges
  const extrasResult = resolveApplicableExtraCharges({
    category: "outstation",
    vehicleGroupCode: input.vehicle.group_code,
    productId: input.route.id,
    extraCharges: input.extraCharges,
  });

  lines.push(...extrasResult.lines);

  return finalizeQuote({
    category: "outstation",
    vehicle: {
      vehicle_model_id: input.vehicle.id,
      display_name: input.vehicle.display_name,
      group_code: input.vehicle.group_code,
      passenger_capacity: input.vehicle.passenger_capacity,
    },
    lines,
    messages: extrasResult.messages,
    advancePercent: input.settings.advance_percent,
    details: {
      rate_per_km: input.ratePerKm,
      distance_km: distanceKm,
      duration_minutes: input.route.duration_minutes ?? undefined,
      billable_km: billableKm,
      days,
      effective_trip_type: "round_trip",
    },
  });
}
