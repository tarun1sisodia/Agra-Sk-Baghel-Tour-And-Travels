import { describe, expect, it } from "vitest";
import {
  buildBookingPdfInput,
  formatInr,
  formatPickupDateTime,
  generateBookingPdf,
  type BookingPdfSourceData,
} from "../../src/modules/bookings/booking-pdf.service.js";

const realisticBooking: BookingPdfSourceData = {
  id: "b1000000-0000-0000-0000-000000000001",
  ticket_id: "AGR-20261019-9999",
  customer_name: "Tarun Sisodia",
  customer_phone: "+91 97628 17598",
  customer_email: "tarun@example.com",
  category: "outstation",
  product_name: "Agra to Delhi Airport Transfer",
  vehicle_model: { display_name: "Maruti Suzuki Dzire (AC Sedan)" },
  passenger_count: 3,
  trip_type: "one_way",
  pickup_at: "2026-10-25T06:30:00.000Z",
  pickup_address: "Hotel ITC Mughal, Fatehabad Road, Tajganj, Agra, UP 282001",
  drop_address: "Terminal 3, Indira Gandhi International Airport, New Delhi 110037",
  total_amount: 3500,
  advance_amount: 980,
  balance_amount: 2520,
  fare_breakdown: {
    lines: [
      { label: "Base fare", amount: 2800 },
      { label: "Driver allowance", amount: 700 },
    ],
    messages: ["Toll charges included as quoted"],
    details: {
      rate_per_km: 14,
      distance_km: 195,
      billable_km: 200,
      duration_minutes: 240,
      effective_trip_type: "one_way",
    },
  },
  status: "confirmed",
  created_at: "2026-10-19T10:00:00.000Z",
};

describe("booking-pdf extra edge coverage", () => {
  it("rounds fractional INR amounts and groups large values in the Indian format", () => {
    expect(formatInr(12.49)).toBe("Rs. 12");
    expect(formatInr(12.5)).toBe("Rs. 13");
    expect(formatInr("1234567890123.49")).toBe("Rs. 12,34,56,78,90,123");
    expect(formatInr("1234567890123.51")).toBe("Rs. 12,34,56,78,90,124");
  });

  it("formats a UTC pickup instant in Asia/Kolkata with the expected IST time", () => {
    expect(formatPickupDateTime("2026-01-15T00:15:00.000Z")).toBe("15 Jan 2026, 05:45 am (IST)");
  });

  it("uses stable voucher fallbacks when nullable optional booking fields are null", () => {
    const input = buildBookingPdfInput({
      ...realisticBooking,
      customer_name: null,
      customer_phone: null,
      customer_email: null,
      product_name: null,
      vehicle_model: { display_name: null },
      vehicle_display_name: null,
      passenger_count: null,
      trip_type: null,
      pickup_at: null,
      pickup_address: null,
      drop_address: null,
      total_amount: null,
      advance_amount: null,
      balance_amount: null,
      status: null,
      created_at: null,
      return_at: null,
      flight_train_number: null,
      special_notes: null,
      fare_breakdown: null,
    });

    expect(input.ticketId).toBe("AGR-20261019-9999");
    expect(input.customerName).toBe("Valued Customer");
    expect(input.customerPhone).toBe("Not specified");
    expect(input.customerEmail).toBe("Not specified");
    expect(input.passengerInfo).toBe("1 Passenger  |  Standard Itinerary");
    expect(input.pickupTime).toBe("As scheduled");
    expect(input.pickupAddress).toBe("Specified Pickup Location");
    expect(input.dropAddress).toBe("As per agreed itinerary");
    expect(input.fareTotalVal).toBe("Rs. 0");
    expect(input.fareAdvVal).toBe("Rs. 0");
    expect(input.fareBalVal).toBe("Rs. 0");
  });

  it("keeps a special note of exactly 220 characters without truncating it", () => {
    const note = "x".repeat(220);
    const input = buildBookingPdfInput({ ...realisticBooking, special_notes: note });

    expect(input.noticeBody).toContain(`Special request: ${note}`);
    expect(input.noticeBody).not.toContain(`${"x".repeat(217)}...`);
  });

  it("truncates a 221-character special note at the documented boundary", () => {
    const note = "x".repeat(221);
    const input = buildBookingPdfInput({ ...realisticBooking, special_notes: note });
    const expected = `Special request: ${"x".repeat(217)}...`;

    expect(input.noticeBody).toContain(expected);
    expect(input.noticeBody).not.toContain(`Special request: ${note}`);
  });

  it("generates a valid PDF when booking text fields are very long", async () => {
    const pdfBuffer = await generateBookingPdf({
      ...realisticBooking,
      customer_name: "Passenger ".repeat(30),
      customer_email: `${"traveller".repeat(20)}@example.com`,
      product_name: "Agra to Delhi airport transfer service ".repeat(25),
      pickup_address: "Pickup landmark, Fatehabad Road, Agra ".repeat(35),
      drop_address: "Terminal 3, Indira Gandhi International Airport, New Delhi ".repeat(35),
      flight_train_number: "DL123-".repeat(30),
      special_notes: "Please call the passenger before arrival. ".repeat(35),
      fare_breakdown: {
        ...realisticBooking.fare_breakdown,
        messages: ["Toll charges included. ".repeat(30)],
      },
    });

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString("utf-8")).toBe("%PDF");
  });
});
