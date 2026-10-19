import { generate } from "@pdfme/generator";
import { text, line, rectangle } from "@pdfme/schemas";
import { bookingVoucherTemplate, type BookingPdfInputData } from "./booking-pdf.template.js";

export interface BookingPdfSourceData {
  id?: string;
  ticket_id?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  category?: string | null;
  product_name?: string | null;
  vehicle_model?: { display_name?: string | null } | null;
  vehicle_display_name?: string | null;
  passenger_count?: number | null;
  trip_type?: string | null;
  pickup_at?: string | Date | null;
  pickup_address?: string | null;
  drop_address?: string | null;
  total_amount?: number | string | null;
  advance_amount?: number | string | null;
  balance_amount?: number | string | null;
  status?: string | null;
  created_at?: string | Date | null;
}

export function formatInr(val: number | string | null | undefined): string {
  const num = typeof val === "number" ? val : parseFloat(String(val || "0"));
  if (isNaN(num)) return "Rs. 0";
  return `Rs. ${Math.round(num).toLocaleString("en-IN")}`;
}

export function formatPickupDateTime(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return "As scheduled";
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return "As scheduled";
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " (IST)";
  } catch {
    return "As scheduled";
  }
}

export function formatBookingDate(dateVal: string | Date | null | undefined): string {
  if (!dateVal) {
    const now = new Date();
    return now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return "Current";
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Current";
  }
}

export function buildBookingPdfInput(
  booking: BookingPdfSourceData,
  paymentId?: string
): BookingPdfInputData {
  const ticketId = booking.ticket_id || "BOOKING";
  const customerName = (booking.customer_name || "Valued Customer").trim();
  const customerPhone = (booking.customer_phone || "Not specified").trim();
  const customerEmail = (booking.customer_email || "Not specified").trim();

  const totalAmountNum = Number(booking.total_amount) || 0;
  const advanceAmountNum = Number(booking.advance_amount) || 0;
  const balanceAmountNum =
    booking.balance_amount !== null && booking.balance_amount !== undefined
      ? Number(booking.balance_amount)
      : Math.max(0, totalAmountNum - advanceAmountNum);

  const statusRaw = (booking.status || "confirmed").toLowerCase();
  const isConfirmed = statusRaw === "confirmed" || statusRaw === "paid_confirmed";
  const statusBadge = isConfirmed ? "CONFIRMED & ADVANCE SECURED" : `STATUS: ${statusRaw.toUpperCase()}`;

  const passengerCount = booking.passenger_count ? Number(booking.passenger_count) : 1;
  const tripTypeRaw = booking.trip_type ? String(booking.trip_type).replace(/_/g, "-") : "";
  const tripTypeFormatted =
    tripTypeRaw === "round-trip"
      ? "Round Trip"
      : tripTypeRaw === "one-way"
      ? "One-Way"
      : tripTypeRaw
      ? tripTypeRaw.charAt(0).toUpperCase() + tripTypeRaw.slice(1)
      : "Standard Itinerary";
  const passengerInfo = `${passengerCount} Passenger${passengerCount > 1 ? "s" : ""}  |  ${tripTypeFormatted}`;

  const productName =
    booking.product_name ||
    (booking.category === "tour_package"
      ? "Tour Package"
      : booking.category === "local_package"
      ? "Local Sightseeing"
      : booking.category === "transfer"
      ? "Airport / Station Transfer"
      : "Outstation Taxi");

  const vehicleName =
    booking.vehicle_model?.display_name ||
    booking.vehicle_display_name ||
    "Air-Conditioned Commercial Vehicle";

  const pickupAddress = (booking.pickup_address || "Specified Pickup Location").trim();
  const dropAddress = (booking.drop_address || "As per agreed itinerary").trim();

  const bookingDateText = `Booked: ${formatBookingDate(booking.created_at)}`;
  const paymentIdText = paymentId
    ? `Payment Ref: ${paymentId}`
    : isConfirmed
    ? "Payment: Advance Secured"
    : "Payment: Pending";

  return {
    ticketId,
    statusBadge,
    bookingDateText,
    paymentIdText,
    customerName,
    customerPhone,
    customerEmail,
    passengerInfo,
    serviceName: productName,
    vehicleName,
    pickupTime: formatPickupDateTime(booking.pickup_at),
    pickupAddress,
    dropAddress,
    fareTotalVal: formatInr(totalAmountNum),
    fareAdvVal: formatInr(advanceAmountNum),
    fareBalVal: formatInr(balanceAmountNum),
  };
}

export async function generateBookingPdf(
  booking: BookingPdfSourceData,
  paymentId?: string
): Promise<Buffer> {
  const input = buildBookingPdfInput(booking, paymentId);
  const pdfBytes = await generate({
    template: bookingVoucherTemplate,
    inputs: [input as any],
    plugins: { text, line, rectangle },
  });
  return Buffer.from(pdfBytes);
}

export class BookingPdfService {
  async generate(booking: BookingPdfSourceData, paymentId?: string): Promise<Buffer> {
    return generateBookingPdf(booking, paymentId);
  }
}
