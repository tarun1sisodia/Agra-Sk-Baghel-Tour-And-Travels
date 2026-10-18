import type { BookingStatus } from "../types/domain.js";
import { AppError } from "./errors.js";

const ALLOWED: Record<BookingStatus, readonly BookingStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["paid_confirmed", "confirmed", "cancelled"],
  paid_confirmed: ["confirmed", "driver_assigned", "in_transit", "completed", "refunded", "cancelled"],
  confirmed: ["paid_confirmed", "driver_assigned", "in_transit", "completed", "refunded", "cancelled"],
  driver_assigned: ["in_transit", "completed", "refunded", "cancelled"],
  in_transit: ["completed", "refunded"],
  completed: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new AppError(
      "INVALID_TRIP_TRANSITION",
      `Cannot transition booking from ${from} to ${to}.`,
      400,
      { from, to },
    );
  }
}

