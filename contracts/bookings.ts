import type { VehicleTier } from "./vehicle-tiers.js";
import type { TripType } from "./trip-types.js";
import type { FareSnapshot } from "./fares.js";

export type BookingStatus =
  | "draft"
  | "pending_payment"
  | "paid_confirmed"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "upi" | "card" | "netbanking" | "paypal";
export type PaymentProvider = "razorpay" | "paypal" | "card";
export type PaymentStatus = "captured" | "refunded" | "partially_refunded" | "pending" | "failed" | "needs_review";

export type CanonicalBookingSelection =
  | { kind: "outstation"; id: string; tripType: "one-way" | "round-trip"; originName: string; destinationName: string; name?: string }
  | { kind: "local"; id: string; source?: string; slug?: string; tripType: "local-tour" | "airport-transfer"; localPackageKey?: string; pickupLocation: string; transferTarget?: string; name?: string }
  | { kind: "package"; id: string; source?: string; slug: string; name?: string };

export interface Booking {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  origin: string;
  destination: string;
  originName?: string;
  destinationName?: string;
  bookingSelection?: CanonicalBookingSelection | null;
  selectedCatalogItemId?: string | null;
  pickupDateTime: string;
  pickupDatetime?: string;
  returnDateTime?: string | null;
  returnDatetime?: string | null;
  distanceKm: number;
  tripType: TripType | string;
  vehicleTier: VehicleTier | string;
  status: BookingStatus;
  version: number;
  notes?: string;
  specialNotes?: string;
  createdAt: string;
  fare: FareSnapshot;
}

export interface Payment {
  id: string;
  bookingTicketId: string;
  provider: PaymentProvider;
  method: PaymentMethod | null;
  providerPaymentId: string | null;
  providerOrderId: string;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  webhookEventId: string | null;
  reconciliationStatus: "pending" | "matched" | "needs_review";
  amount: number;
  status: PaymentStatus;
  capturedAt: string | null;
}
