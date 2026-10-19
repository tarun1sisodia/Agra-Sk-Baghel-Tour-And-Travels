import { describe, it, expect } from "vitest";
import {
  generateBookingPdf,
  formatInr,
  formatPickupDateTime,
  formatBookingDate,
  buildBookingPdfInput,
} from "../../src/modules/bookings/booking-pdf.service.js";

describe("BookingPdfService Unit Tests", () => {
  const sampleBooking = {
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
      messages: [],
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

  describe("Formatting helpers", () => {
    it("formatInr formats numbers into Indian currency string", () => {
      expect(formatInr(3500)).toBe("Rs. 3,500");
      expect(formatInr("12500")).toBe("Rs. 12,500");
      expect(formatInr(0)).toBe("Rs. 0");
      expect(formatInr(null)).toBe("Rs. 0");
      expect(formatInr(undefined)).toBe("Rs. 0");
      expect(formatInr("invalid")).toBe("Rs. 0");
    });

    it("formatPickupDateTime formats date to IST", () => {
      const formatted = formatPickupDateTime("2026-10-25T06:30:00.000Z");
      expect(formatted).toContain("IST");
      expect(formatted).toContain("Oct");
      expect(formatted).toContain("2026");

      expect(formatPickupDateTime(null)).toBe("As scheduled");
      expect(formatPickupDateTime("not-a-date")).toBe("As scheduled");
    });

    it("formatBookingDate formats ISO string or falls back cleanly", () => {
      const formatted = formatBookingDate("2026-10-19T10:00:00.000Z");
      expect(formatted).toContain("Oct");
      expect(formatted).toContain("2026");

      const current = formatBookingDate(null);
      expect(current.length).toBeGreaterThan(0);
    });
  });

  describe("buildBookingPdfInput", () => {
    it("populates all required voucher fields correctly", () => {
      const input = buildBookingPdfInput(sampleBooking, "pay_Razorpay12345");
      expect(input.ticketId).toBe("AGR-20261019-9999");
      expect(input.customerName).toBe("Tarun Sisodia");
      expect(input.customerPhone).toBe("+91 97628 17598");
      expect(input.customerEmail).toBe("tarun@example.com");
      expect(input.serviceName).toBe("Agra to Delhi Airport Transfer");
      expect(input.vehicleName).toBe("Maruti Suzuki Dzire (AC Sedan)");
      expect(input.passengerInfo).toContain("3 Passengers");
      expect(input.passengerInfo).toContain("One-Way");
      expect(input.fareTotalVal).toBe("Rs. 3,500");
      expect(input.fareAdvVal).toBe("Rs. 980");
      expect(input.fareBalVal).toBe("Rs. 2,520");
      expect(input.statusBadge).toBe("CONFIRMED & ADVANCE SECURED");
      expect(input.paymentIdText).toBe("Payment Ref: pay_Razorpay12345");
      expect(input.brandTitle).toBe("SK BAGHEL TOUR & TRAVELS");
      expect(input.voucherTitle).toBe("BOOKING VOUCHER");
      expect(input.sec1Title).toBe("PASSENGER & CONTACT DETAILS");
      expect(input.custNameLbl).toBe("LEAD PASSENGER");
      expect(input.sec2Title).toBe("JOURNEY & VEHICLE DETAILS");
      expect(input.pickAddrLbl).toBe("PICKUP LOCATION");
      expect(input.sec3Title).toBe("FARE SUMMARY");
      expect(input.fareNote).toContain("Base fare: Rs. 2,800");
      expect(input.fareNote).toContain("Distance: 195 km");
      expect(input.noticeBody).toContain("not a GST tax invoice");
      expect(input.ftHelp).toContain("+91 97628 17598");
      expect(input.ftAddr).toContain("Agra, Uttar Pradesh 282001");
    });


    it("derives trip type from quote details when the booking detail omits trip_type", () => {
      const { trip_type: _tripType, ...bookingWithoutTripType } = sampleBooking;
      const input = buildBookingPdfInput({
        ...bookingWithoutTripType,
        fare_breakdown: {
          ...sampleBooking.fare_breakdown,
          details: {
            ...sampleBooking.fare_breakdown.details,
            effective_trip_type: "round_trip",
          },
        },
      });
      expect(input.passengerInfo).toContain("Round Trip");
    });

    it("includes return journey, flight/train reference, and special requests", () => {
      const detailedBooking = {
        ...sampleBooking,
        trip_type: "round_trip",
        return_at: "2026-10-26T12:30:00.000Z",
        flight_train_number: "DL 123",
        special_notes: "Call passenger on arrival.",
        fare_breakdown: {
          ...sampleBooking.fare_breakdown,
          messages: ["Toll charges included as quoted"],
        },
      };
      const input = buildBookingPdfInput(detailedBooking);
      expect(input.noticeBody).toContain("Return journey:");
      expect(input.noticeBody).toContain("Flight / train reference: DL 123");
      expect(input.noticeBody).toContain("Special request: Call passenger on arrival.");
      expect(input.noticeBody).toContain("Toll charges included as quoted");
    });

    it("handles pending payment status properly", () => {
      const pendingBooking = {
        ...sampleBooking,
        status: "pending_payment",
      };
      const input = buildBookingPdfInput(pendingBooking);
      expect(input.statusBadge).toBe("STATUS: PENDING_PAYMENT");
      expect(input.paymentIdText).toBe("Payment: Pending");
    });

    it("computes balance fallback when balance_amount is null", () => {
      const bookingNoBal = {
        ...sampleBooking,
        total_amount: 5000,
        advance_amount: 1400,
        balance_amount: null,
      };
      const input = buildBookingPdfInput(bookingNoBal);
      expect(input.fareBalVal).toBe("Rs. 3,600");
    });

    it("handles sparse or missing fields gracefully without throwing", () => {
      const sparseBooking = {
        ticket_id: "AGR-SPARSE-1",
      };
      const input = buildBookingPdfInput(sparseBooking);
      expect(input.ticketId).toBe("AGR-SPARSE-1");
      expect(input.customerName).toBe("Valued Customer");
      expect(input.customerPhone).toBe("Not specified");
      expect(input.customerEmail).toBe("Not specified");
      expect(input.passengerInfo).toContain("1 Passenger");
      expect(input.fareTotalVal).toBe("Rs. 0");
      expect(input.brandTitle).toBe("SK BAGHEL TOUR & TRAVELS");
      expect(input.sec1Title).toBe("PASSENGER & CONTACT DETAILS");
      expect(input.noticeBody).toContain("not a GST tax invoice");
    });
  });

  describe("generateBookingPdf", () => {
    it("generates a valid binary PDF buffer starting with %PDF signature", async () => {
      const pdfBuffer = await generateBookingPdf(sampleBooking, "pay_TestPayment999");
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);

      // PDF signature verification: '%PDF'
      const headerSignature = pdfBuffer.subarray(0, 4).toString("utf-8");
      expect(headerSignature).toBe("%PDF");
    });

    it("handles very long addresses without throwing or crashing", async () => {
      const longAddressBooking = {
        ...sampleBooking,
        pickup_address:
          "Apartment 1402, Tower B, Supertech Eco Village 1, Near Gaur City 2, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh 201306, Landmark: Opposite Ryan International School",
        drop_address:
          "Suite 804, The Leela Palace Hotel, Diplomatic Enclave, Chanakyapuri, Africa Avenue, New Delhi, Delhi 110023, India",
      };
      const pdfBuffer = await generateBookingPdf(longAddressBooking);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 4).toString("utf-8")).toBe("%PDF");
    });
  });

  describe("GET /api/v1/bookings/:id/pdf HTTP Route", () => {
    it("returns 404 when booking is not found", async () => {
      const Fastify = (await import("fastify")).default;
      const { registerBookingsRoutes } = await import("../../src/modules/bookings/bookings.routes.js");
      const app = Fastify();
      const mockService = {
        getBookingById: async () => null,
        getBookingByTicketId: async () => null,
      } as any;
      registerBookingsRoutes(app, mockService);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/bookings/non-existent-id/pdf",
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe("NOT_FOUND");
    });

    it("returns 401 when user is unauthenticated and guest token is missing", async () => {
      const Fastify = (await import("fastify")).default;
      const { registerBookingsRoutes } = await import("../../src/modules/bookings/bookings.routes.js");
      const app = Fastify();
      const mockService = {
        getBookingById: async () => sampleBooking,
        getBookingByTicketId: async () => null,
      } as any;
      registerBookingsRoutes(app, mockService);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/bookings/${sampleBooking.id}/pdf`,
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("AUTH_REQUIRED");
    });

    it("returns 403 when user is authenticated but neither owner nor admin", async () => {
      const Fastify = (await import("fastify")).default;
      const { registerBookingsRoutes } = await import("../../src/modules/bookings/bookings.routes.js");
      const app = Fastify();
      app.addHook("preHandler", async (req) => {
        (req as any).user = { id: "intruder-user-id", role: "customer", email: "other@example.com" };
      });
      const mockService = {
        getBookingById: async () => ({
          ...sampleBooking,
          user_id: "legitimate-owner-id",
          customer_email: "tarun@example.com",
        }),
        getBookingByTicketId: async () => null,
      } as any;
      registerBookingsRoutes(app, mockService);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/bookings/${sampleBooking.id}/pdf`,
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe("FORBIDDEN");
    });

    it("returns 200 with PDF stream when authenticated owner requests", async () => {
      const Fastify = (await import("fastify")).default;
      const { registerBookingsRoutes } = await import("../../src/modules/bookings/bookings.routes.js");
      const app = Fastify();
      app.addHook("preHandler", async (req) => {
        (req as any).user = { id: "legitimate-owner-id", role: "customer", email: "tarun@example.com" };
      });
      const mockService = {
        getBookingById: async () => ({
          ...sampleBooking,
          user_id: "legitimate-owner-id",
        }),
        getBookingByTicketId: async () => null,
      } as any;
      registerBookingsRoutes(app, mockService);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/bookings/${sampleBooking.id}/pdf`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain(`${sampleBooking.ticket_id}-confirmation-voucher.pdf`);
      expect(res.rawPayload.subarray(0, 4).toString("utf-8")).toBe("%PDF");
    });

    it("rejects unauthenticated requests even if a query token is supplied", async () => {
      const Fastify = (await import("fastify")).default;
      const { registerBookingsRoutes } = await import("../../src/modules/bookings/bookings.routes.js");
      const app = Fastify();
      const mockService = {
        getBookingById: async () => ({
          ...sampleBooking,
          guest_access_token: "guest-secret-token-xyz",
        }),
        getBookingByTicketId: async () => null,
      } as any;
      registerBookingsRoutes(app, mockService);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/bookings/${sampleBooking.id}/pdf?token=guest-secret-token-xyz`,
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("AUTH_REQUIRED");
    });

    it("returns 200 with PDF stream when authenticated super_admin requests", async () => {
      const Fastify = (await import("fastify")).default;
      const { registerBookingsRoutes } = await import("../../src/modules/bookings/bookings.routes.js");
      const app = Fastify();
      app.addHook("preHandler", async (req) => {
        (req as any).user = { id: "admin-uuid-1", role: "super_admin", email: "admin@agraskbagheltourandtravels.com" };
      });
      const mockService = {
        getBookingById: async () => ({
          ...sampleBooking,
          user_id: "other-customer-id",
        }),
        getBookingByTicketId: async () => null,
      } as any;
      registerBookingsRoutes(app, mockService);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/bookings/${sampleBooking.id}/pdf`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.rawPayload.subarray(0, 4).toString("utf-8")).toBe("%PDF");
    });
  });
});
