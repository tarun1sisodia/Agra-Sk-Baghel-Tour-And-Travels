import type { QuoteLine, QuoteResponse, CategoryCode, VehicleGroupCode } from "../../contracts/fare-system.js";
import { roundHalfUp } from "./rounding.js";

export interface FinalizeQuoteInput {
  category: CategoryCode;
  vehicle: {
    vehicle_model_id: string;
    display_name: string;
    group_code: VehicleGroupCode;
    passenger_capacity: number;
  };
  lines: QuoteLine[];
  messages: string[];
  advancePercent: number;
  details: {
    rate_per_km?: number;
    distance_km?: number;
    duration_minutes?: number;
    billable_km?: number;
    days?: number;
    effective_trip_type?: "one_way" | "round_trip";
  };
}

export function finalizeQuote(input: FinalizeQuoteInput): QuoteResponse {
  if (input.lines.length === 0) {
    throw new Error("EMPTY_QUOTE_LINES");
  }

  const total = input.lines.reduce((sum, line) => sum + line.amount, 0);
  if (total <= 0) {
    throw new Error("INVALID_TOTAL_AMOUNT");
  }

  const advance = Math.min(total, roundHalfUp((total * input.advancePercent) / 100));
  const balance = total - advance;

  return {
    category: input.category,
    vehicle: input.vehicle,
    currency: "INR",
    lines: input.lines,
    total,
    advance,
    balance,
    messages: input.messages,
    details: input.details,
  };
}
