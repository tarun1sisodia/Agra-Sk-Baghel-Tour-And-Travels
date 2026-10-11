import type { QuoteLine, QuoteResponse, VehicleGroupCode } from "../../../contracts/fare-system.js";
import { resolveApplicableExtraCharges, type ExtraChargeRow } from "../extra-charges.js";
import { finalizeQuote } from "../finalizer.js";

export interface CalculateFixedProductInput {
  category: "local_package" | "transfer" | "tour_package";
  productId: string;
  vehicle: {
    id: string;
    display_name: string;
    passenger_capacity: number;
    group_code: VehicleGroupCode;
  };
  fixedAmount: number; // from fare_rules (category + vehicle + product)
  advancePercent: number;
  extraCharges: ExtraChargeRow[];
}

export function calculateFixedProduct(input: CalculateFixedProductInput): QuoteResponse {
  if (!input.fixedAmount || input.fixedAmount <= 0) {
    throw new Error("VEHICLE_NOT_AVAILABLE");
  }

  const lines: QuoteLine[] = [
    {
      code: "base_fare",
      label: "Base Fare",
      amount: input.fixedAmount,
    },
  ];

  const extrasResult = resolveApplicableExtraCharges({
    category: input.category,
    vehicleGroupCode: input.vehicle.group_code,
    productId: input.productId,
    extraCharges: input.extraCharges,
  });

  lines.push(...extrasResult.lines);

  return finalizeQuote({
    category: input.category,
    vehicle: {
      vehicle_model_id: input.vehicle.id,
      display_name: input.vehicle.display_name,
      group_code: input.vehicle.group_code,
      passenger_capacity: input.vehicle.passenger_capacity,
    },
    lines,
    messages: extrasResult.messages,
    advancePercent: input.advancePercent,
    details: {},
  });
}
