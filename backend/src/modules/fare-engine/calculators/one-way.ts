import type { QuoteLine, QuoteResponse, VehicleGroupCode } from "../../../contracts/fare-system.js";
import { isPickupInNightWindow } from "../datetime.js";
import { resolveApplicableExtraCharges, type ExtraChargeRow } from "../extra-charges.js";
import { finalizeQuote } from "../finalizer.js";

export interface CalculateOneWayInput {
  route: {
    id: string;
    distance_km?: number | null;
    duration_minutes?: number | null;
  };
  vehicle: {
    id: string;
    display_name: string;
    passenger_capacity: number;
    group_code: VehicleGroupCode;
  };
  routeVehicle: {
    one_way_amount: number | null;
    is_active: boolean;
  };
  groupSettings: {
    one_way_night_charge: number;
  };
  settings: {
    advance_percent: number;
    night_start_hour: number;
    night_end_hour: number;
  };
  pickup_at: string | Date;
  extraCharges: ExtraChargeRow[];
}

export function calculateOneWayOutstation(input: CalculateOneWayInput): QuoteResponse {
  if (!input.routeVehicle.is_active || input.routeVehicle.one_way_amount === null || input.routeVehicle.one_way_amount <= 0) {
    throw new Error("VEHICLE_NOT_AVAILABLE");
  }

  const baseFare = input.routeVehicle.one_way_amount;
  const lines: QuoteLine[] = [
    {
      code: "base_fare",
      label: "Base Fare",
      amount: baseFare,
    },
  ];

  // Night charge evaluation (pickup time in IST)
  const isNight = isPickupInNightWindow(
    input.pickup_at,
    input.settings.night_start_hour,
    input.settings.night_end_hour
  );

  if (isNight && input.groupSettings.one_way_night_charge > 0) {
    lines.push({
      code: "night_charge",
      label: "Night Pickup Charge",
      amount: input.groupSettings.one_way_night_charge,
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
      distance_km: input.route.distance_km ?? undefined,
      duration_minutes: input.route.duration_minutes ?? undefined,
      effective_trip_type: "one_way",
    },
  });
}
