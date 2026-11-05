/**
 * Maps a raw ops/admin bookings API item to the admin Booking interface.
 *
 * Extracted from `lib/api.ts` so the response→Booking adapter (including the
 * issue #129 vehicle-tier fix) is pure and unit-testable under
 * `node --experimental-strip-types --test`, mirroring `reviewMapper.ts`.
 *
 * Vehicle tier: resolved through `resolveFleetBucket`, which reads the actual
 * vehicle field(s) — `vehicleTier`, the additive `vehicleModel`, and legacy
 * `vehicle` / `vehicle_model` shapes — and normalizes model keys, group codes
 * and aliases into dashboard buckets. Missing/unknown vehicle data is never
 * silently classified as Sedan.
 */
import type { Booking, BookingStatus, TripType } from "./types";
import { resolveFleetBucket } from "./vehicleTierCounts.ts";

export function mapAdminBooking(b: any): Booking {
  return {
    id: b.id,
    ticketId: b.ticketId || b.id,
    customerName: b.customerName || "Customer",
    customerPhone: b.customerPhone || "",
    customerEmail: b.customerEmail || "",
    origin: b.originName || b.origin || "",
    destination: b.destinationName || b.destination || "",
    bookingSelection: b.bookingSelection ?? null,
    selectedCatalogItemId: b.selectedCatalogItemId ?? null,
    pickupDateTime: b.pickupDatetime || b.pickupDateTime || new Date().toISOString(),
    returnDateTime: b.returnDatetime || b.returnDateTime || null,
    distanceKm: Number(b.distanceKm) || 0,
    tripType: (b.tripType as TripType) || "one-way",
    vehicleTier: resolveFleetBucket(b),
    status: (b.status as BookingStatus) || "pending_payment",
    version: Number(b.version) || 1,
    notes: b.specialNotes || b.notes || "",
    createdAt: b.createdAt || new Date().toISOString(),
    fare: {
      baseFare: Number(b.baseFare ?? b.totalFare) || 0,
      nightAllowance: Number(b.nightAllowance) || 0,
      driverAllowance: Number(b.driverAllowance) || 0,
      tollsTaxes: 0,
      promoDiscount: Number(b.discountAmount) || 0,
      totalFare: Number(b.totalFare) || 0,
      advancePaid: Number(b.advanceAmount) || 0,
      balancePayable: Math.max(0, (Number(b.totalFare) || 0) - (Number(b.advanceAmount) || 0)),
    },
  };
}
