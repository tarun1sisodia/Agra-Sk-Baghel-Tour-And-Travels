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
  return_at?: string | Date | null;
  flight_train_number?: string | null;
  special_notes?: string | null;
  fare_breakdown?: {
    lines?: Array<{ label?: string; amount?: number | string | null }>;
    messages?: string[];
    details?: {
      rate_per_km?: number;
      distance_km?: number;
      duration_minutes?: number;
      billable_km?: number;
      days?: number;
      effective_trip_type?: string;
    };
  } | null;
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

  const quoteLines = Array.isArray(booking.fare_breakdown?.lines)
    ? booking.fare_breakdown.lines
        .filter((line) => typeof line?.label === "string" && line.label.trim())
        .map((line) => `${line.label!.trim()}: ${formatInr(line.amount)}`)
    : [];
  const quoteDetails = booking.fare_breakdown?.details;
  const tripMetrics: string[] = [];
  if (typeof quoteDetails?.distance_km === "number" && Number.isFinite(quoteDetails.distance_km)) {
    tripMetrics.push(`Distance: ${quoteDetails.distance_km.toLocaleString("en-IN", { maximumFractionDigits: 1 })} km`);
  }
  if (typeof quoteDetails?.billable_km === "number" && Number.isFinite(quoteDetails.billable_km)) {
    tripMetrics.push(`Billable: ${quoteDetails.billable_km.toLocaleString("en-IN", { maximumFractionDigits: 1 })} km`);
  }
  if (typeof quoteDetails?.rate_per_km === "number" && Number.isFinite(quoteDetails.rate_per_km)) {
    tripMetrics.push(`Rate: ${formatInr(quoteDetails.rate_per_km)}/km`);
  }
  if (typeof quoteDetails?.duration_minutes === "number" && Number.isFinite(quoteDetails.duration_minutes)) {
    const duration = Math.max(0, Math.round(quoteDetails.duration_minutes));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    tripMetrics.push(`Duration: ${hours ? `${hours}h` : ""}${minutes ? ` ${minutes}m` : hours ? "" : "0m"}`);
  }
  if (typeof quoteDetails?.days === "number" && Number.isFinite(quoteDetails.days)) {
    tripMetrics.push(`Days: ${quoteDetails.days}`);
  }
  const fareNote = [
    quoteLines.length ? `Fare breakdown: ${quoteLines.join(" | ")}` : "",
    tripMetrics.join(" | "),
  ].filter(Boolean).join("\n") || "Fare agreed as per the approved booking quotation.";

  const journeyNotes: string[] = [];
  if (booking.return_at) {
    journeyNotes.push(`Return journey: ${formatPickupDateTime(booking.return_at)}`);
  }
  if (booking.flight_train_number?.trim()) {
    journeyNotes.push(`Flight / train reference: ${booking.flight_train_number.trim()}`);
  }
  const rawSpecialNotes = booking.special_notes?.trim() || "";
  if (rawSpecialNotes) {
    journeyNotes.push(`Special request: ${rawSpecialNotes.length > 220 ? `${rawSpecialNotes.slice(0, 217).trimEnd()}...` : rawSpecialNotes}`);
  }
  const quoteMessages = Array.isArray(booking.fare_breakdown?.messages)
    ? booking.fare_breakdown.messages.filter((message) => typeof message === "string" && message.trim()).slice(0, 2)
    : [];
  if (quoteMessages.length) {
    journeyNotes.push(`Quote notes: ${quoteMessages.join("; ").slice(0, 180)}`);
  }
  journeyNotes.push("Keep this voucher for reference. Please confirm pickup changes with dispatch; the balance is payable as agreed.");
  journeyNotes.push("This is a booking voucher and payment summary, not a GST tax invoice.");

  return {
    brandTitle: "SK BAGHEL TOUR & TRAVELS",
    brandSubtitle: "AGRA | CHAUFFEUR-DRIVEN TRAVEL",
    voucherTitle: "BOOKING VOUCHER",
    ticketId,
    statusBadge,
    bookingDateText,
    paymentIdText,
    securityBadge: "CUSTOMER COPY",
    sec1Title: "PASSENGER & CONTACT DETAILS",
    custNameLbl: "LEAD PASSENGER",
    customerName,
    custPhoneLbl: "CONTACT PHONE",
    customerPhone,
    custEmailLbl: "EMAIL ADDRESS",
    customerEmail,
    paxLbl: "PASSENGER / TRIP DETAILS",
    passengerInfo,
    sec2Title: "JOURNEY & VEHICLE DETAILS",
    srvLbl: "BOOKED SERVICE / ROUTE",
    serviceName: productName,
    vehLbl: "VEHICLE CLASS",
    vehicleName,
    pickTimeLbl: "PICKUP DATE & TIME",
    pickupTime: formatPickupDateTime(booking.pickup_at),
    pickAddrLbl: "PICKUP LOCATION",
    pickupAddress,
    dropAddrLbl: "DROP-OFF / DESTINATION",
    dropAddress,
    sec3Title: "FARE SUMMARY",
    fareTotLbl: "TOTAL AGREED FARE",
    fareTotalVal: formatInr(totalAmountNum),
    fareAdvLbl: "ADVANCE PAID",
    fareAdvVal: formatInr(advanceAmountNum),
    fareBalLbl: "BALANCE REMAINING",
    fareBalVal: formatInr(balanceAmountNum),
    fareNote,
    noticeTitle: "JOURNEY NOTES & SERVICE TERMS",
    noticeBody: journeyNotes.join("\n"),
    ftHelp: "24/7 BOOKING SUPPORT: +91 97628 17598 | bookings@agraskbagheltourandtravels.com",
    ftAddr: "Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001 | agraskbagheltourandtravels.com",
    ftDisc: "Keep this voucher for reference. Not a GST tax invoice. Confirm itinerary and pickup details with dispatch.",
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
