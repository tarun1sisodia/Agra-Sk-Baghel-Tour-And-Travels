import crypto from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import Fastify from "fastify";
import { createAdminService } from "../../src/modules/admin/admin.service.js";
import { createPaymentService } from "../../src/modules/payments/payment.service.js";
import { PaymentsService } from "../../src/modules/payments/payments.service.js";
import { canTransition, assertTransition } from "../../src/shared/stateMachine.js";
import { registerBookingsRoutes } from "../../src/modules/bookings/bookings.routes.js";
import type { BookingRecord, PaymentRecord, RefundRecord } from "../../src/types/domain.js";

describe("Admin Finance Visibility & Booking Status Alignment", () => {
  describe("admin.service: listPayments", () => {
    it("maps payments with amount in INR, resolved ticketId, fallback capturedAt and reconciliationStatus", async () => {
      const mockBooking: BookingRecord = {
        id: "bkg-123",
        ticketId: "SKB-20261018-0001",
        userId: null,
        guestAccessToken: "token-123",
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        bookingSelection: null,
        selectedCatalogItemId: null,
        pickupAddress: "Taj Ganj",
        dropAddress: null,
        pickupDatetime: "2026-10-18T10:00:00Z",
        returnDatetime: null,
        flightTrainNumber: null,
        distanceKm: 240,
        customerName: "Rohan Sharma",
        customerPhone: "+919876543210",
        customerEmail: "rohan@example.com",
        baseFare: 4500,
        nightAllowance: 0,
        driverAllowance: 0,
        discountAmount: 0,
        promoCode: null,
        totalFare: 4500,
        advanceAmount: 1260,
        balanceAmount: 3240,
        fareRulesVersion: "2.0",
        fareSnapshot: {} as any,
        status: "confirmed",
        version: 1,
        specialNotes: null,
        packageId: null,
        createdAt: "2026-10-18T04:00:00.000Z",
        updatedAt: "2026-10-18T04:05:00.000Z",
      };

      const mockPayment: PaymentRecord = {
        id: "pay-123",
        bookingId: "bkg-123",
        provider: "razorpay",
        providerOrderId: "order_rzp_123",
        providerPaymentId: "pay_rzp_456",
        checkoutSessionId: null,
        checkoutUrl: null,
        publicClientToken: null,
        amountMinor: 126000,
        currency: "INR",
        inrAmountPaise: 126000,
        status: "captured",
        paymentMethod: null,
        feeMinor: 2500,
        taxMinor: 450,
        idempotencyKey: "order_rzp_123",
        webhookEventId: "evt_123",
        reconciliationStatus: "pending",
        failureReason: null,
        verifiedAt: null,
        expiresAt: "2026-10-18T05:00:00.000Z",
        createdAt: "2026-10-18T04:01:00.000Z",
        updatedAt: "2026-10-18T04:02:00.000Z",
      };

      const mockDb = {
        payments: {
          list: vi.fn().mockResolvedValue({
            items: [mockPayment],
            total: 1,
            totalCapturedPaise: 126000,
            totalRefundedPaise: 0,
          }),
        },
        bookings: {
          getById: vi.fn().mockResolvedValue(mockBooking),
        },
      } as any;

      const adminService = createAdminService({ db: mockDb });
      const res = await adminService.listPayments({});

      expect(res.total).toBe(1);
      expect(res.totalCapturedPaise).toBe(126000);
      expect(res.items).toHaveLength(1);

      const item = res.items[0]!;
      // Amount in INR: 126000 paise = ₹1260
      expect(item.amount).toBe(1260);
      expect(item.amountPaise).toBe(126000);
      // Resolved ticket ID from booking
      expect(item.bookingTicketId).toBe("SKB-20261018-0001");
      // Method fallback for razorpay
      expect(item.method).toBe("upi");
      // Fallback capturedAt from updatedAt when verifiedAt is null
      expect(item.capturedAt).toBe("2026-10-18T04:02:00.000Z");
      // Captured payments with pending reconciliation auto-match
      expect(item.reconciliationStatus).toBe("matched");
    });
  });

  describe("stateMachine: confirmed status transitions", () => {
    it("allows valid lifecycle transitions from confirmed status", () => {
      expect(canTransition("confirmed", "driver_assigned")).toBe(true);
      expect(canTransition("confirmed", "in_transit")).toBe(true);
      expect(canTransition("confirmed", "completed")).toBe(true);
      expect(canTransition("confirmed", "refunded")).toBe(true);
      expect(canTransition("confirmed", "cancelled")).toBe(true);
      expect(() => assertTransition("confirmed", "refunded")).not.toThrow();
    });

    it("rejects invalid transitions from confirmed", () => {
      expect(canTransition("confirmed", "draft")).toBe(false);
      expect(canTransition("confirmed", "pending_payment")).toBe(false);
      expect(() => assertTransition("confirmed", "draft")).toThrow();
    });
  });

  describe("payment.service: refund eligibility for confirmed bookings", () => {
    it("successfully refunds a booking in 'confirmed' status", async () => {
      const mockBooking: BookingRecord = {
        id: "bkg-conf-1",
        ticketId: "SKB-20261018-CONF",
        userId: null,
        guestAccessToken: "tok-conf",
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Jaipur",
        bookingSelection: null,
        selectedCatalogItemId: null,
        pickupAddress: "Agra Cantt",
        dropAddress: null,
        pickupDatetime: "2026-10-19T08:00:00Z",
        returnDatetime: null,
        flightTrainNumber: null,
        distanceKm: 240,
        customerName: "Aman Gupta",
        customerPhone: "+919876543211",
        customerEmail: "aman@example.com",
        baseFare: 5000,
        nightAllowance: 0,
        driverAllowance: 0,
        discountAmount: 0,
        promoCode: null,
        totalFare: 5000,
        advanceAmount: 1400,
        balanceAmount: 3600,
        fareRulesVersion: "2.0",
        fareSnapshot: {} as any,
        status: "confirmed" as any,
        version: 1,
        specialNotes: null,
        packageId: null,
        createdAt: "2026-10-18T05:00:00Z",
        updatedAt: "2026-10-18T05:05:00Z",
      };

      const mockPayment: PaymentRecord = {
        id: "pay-conf-1",
        bookingId: "bkg-conf-1",
        provider: "razorpay",
        providerOrderId: "order_conf_1",
        providerPaymentId: "pay_conf_1",
        checkoutSessionId: null,
        checkoutUrl: null,
        publicClientToken: null,
        amountMinor: 140000,
        currency: "INR",
        inrAmountPaise: 140000,
        status: "captured",
        paymentMethod: "upi",
        feeMinor: 2800,
        taxMinor: 504,
        idempotencyKey: "order_conf_1",
        webhookEventId: null,
        reconciliationStatus: "matched",
        failureReason: null,
        verifiedAt: "2026-10-18T05:06:00Z",
        expiresAt: "2026-10-18T06:00:00Z",
        createdAt: "2026-10-18T05:01:00Z",
        updatedAt: "2026-10-18T05:06:00Z",
      };

      let updatedBookingStatus: string | null = null;
      let updatedPaymentStatus: string | null = null;
      let createdRefund: RefundRecord | null = null;

      const trx = {
        refunds: {
          getByIdempotencyKey: vi.fn().mockResolvedValue(null),
          listByBookingId: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockImplementation(async (record: RefundRecord) => {
            createdRefund = record;
            return record;
          }),
        },
        bookings: {
          getById: vi.fn().mockResolvedValue(mockBooking),
          getByTicketId: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockImplementation(async (b: BookingRecord) => {
            updatedBookingStatus = b.status;
            return b;
          }),
        },
        payments: {
          listByBookingId: vi.fn().mockResolvedValue([mockPayment]),
          update: vi.fn().mockImplementation(async (p: PaymentRecord) => {
            updatedPaymentStatus = p.status;
            return p;
          }),
        },
      };

      const mockDb = {
        refunds: {
          getByIdempotencyKey: vi.fn().mockResolvedValue(null),
        },
        transaction: vi.fn().mockImplementation(async (fn: any) => fn(trx)),
      } as any;

      const mockRazorpay = {
        refund: vi.fn().mockResolvedValue({
          providerRefundId: "rfnd_rzp_999",
          status: "processed",
        }),
      } as any;

      const paymentService = createPaymentService({
        db: mockDb,
        clock: { now: () => new Date() } as any,
        env: {} as any,
        providers: { razorpay: mockRazorpay } as any,
        notifications: {} as any,
      });

      const result = await paymentService.refund({
        bookingId: "bkg-conf-1",
        reason: "Customer requested cancellation within free window",
        idempotencyKey: "idem_rfnd_123",
        actorId: "admin-actor-1",
      });

      expect(mockRazorpay.refund).toHaveBeenCalledWith({
        providerPaymentId: "pay_conf_1",
        amountMinor: 140000,
        currency: "INR",
        reason: "Customer requested cancellation within free window",
        idempotencyKey: "idem_rfnd_123",
      });

      expect(updatedPaymentStatus).toBe("refunded");
      expect(updatedBookingStatus).toBe("refunded");
      expect(createdRefund).not.toBeNull();
      expect(result.providerRefundId).toBe("rfnd_rzp_999");
    });

    it("rejects refund when booking is in pending_payment state", async () => {
      const mockBooking = {
        id: "bkg-pend-1",
        status: "pending_payment",
      } as any;

      const trx = {
        refunds: {
          getByIdempotencyKey: vi.fn().mockResolvedValue(null),
        },
        bookings: {
          getById: vi.fn().mockResolvedValue(mockBooking),
          getByTicketId: vi.fn().mockResolvedValue(null),
        },
      };

      const mockDb = {
        refunds: {
          getByIdempotencyKey: vi.fn().mockResolvedValue(null),
        },
        transaction: vi.fn().mockImplementation(async (fn: any) => fn(trx)),
      } as any;

      const paymentService = createPaymentService({
        db: mockDb,
        clock: { now: () => new Date() } as any,
        env: {} as any,
        providers: { razorpay: {} } as any,
        notifications: {} as any,
      });

      await expect(
        paymentService.refund({
          bookingId: "bkg-pend-1",
          reason: "Customer cancellation request",
          idempotencyKey: "idem_pend_1",
          actorId: "admin-actor-1",
        })
      ).rejects.toThrow("Booking is not eligible for refund.");
    });
  });

  describe("bookings.routes: mandatory customer authentication & ownership proof", () => {
    it("enforces authentication (401) and ownership checks (403/200) on GET /api/v1/bookings/:id", async () => {
      const app = Fastify();
      const mockBooking = {
        id: "00000000-0000-0000-0000-000000000099",
        ticket_id: "SKB-20261018-9999",
        user_id: "00000000-0000-4000-a000-000000000001",
        customer_email: "customer@example.com",
        status: "confirmed",
      };

      const mockBookingsService = {
        createBooking: vi.fn(),
        getBookingById: vi.fn().mockResolvedValue(mockBooking),
        getBookingByTicketId: vi.fn().mockResolvedValue(null),
      } as any;

      let authUser: any = undefined;
      app.addHook("onRequest", async (req) => {
        (req as any).user = authUser;
      });

      registerBookingsRoutes(app, mockBookingsService);

      // 1. Missing authentication -> 401 AUTH_REQUIRED
      authUser = undefined;
      const resUnauth = await app.inject({
        method: "GET",
        url: "/api/v1/bookings/00000000-0000-0000-0000-000000000099",
      });
      expect(resUnauth.statusCode).toBe(401);
      expect(resUnauth.json().error).toBe("AUTH_REQUIRED");

      // 2. Different user without matching id or email -> 403 FORBIDDEN
      authUser = { id: "00000000-0000-4000-a000-999999999999", role: "customer", email: "other@example.com" };
      const resForbidden = await app.inject({
        method: "GET",
        url: "/api/v1/bookings/00000000-0000-0000-0000-000000000099",
      });
      expect(resForbidden.statusCode).toBe(403);
      expect(resForbidden.json().error).toBe("FORBIDDEN");

      // 3. Authenticated owner user -> 200
      authUser = { id: "00000000-0000-4000-a000-000000000001", role: "customer", email: "customer@example.com" };
      const resOwner = await app.inject({
        method: "GET",
        url: "/api/v1/bookings/00000000-0000-0000-0000-000000000099",
      });
      expect(resOwner.statusCode).toBe(200);
      expect(resOwner.json().booking.ticket_id).toBe("SKB-20261018-9999");

      // 4. Admin role -> 200
      authUser = { id: "admin-id-1", role: "admin", email: "admin@example.com" };
      const resAdmin = await app.inject({
        method: "GET",
        url: "/api/v1/bookings/00000000-0000-0000-0000-000000000099",
      });
      expect(resAdmin.statusCode).toBe(200);
      expect(resAdmin.json().booking.ticket_id).toBe("SKB-20261018-9999");
    });
  });

  describe("PaymentsService.verifyPayment: upstream Razorpay provider verification", () => {
    const keySecret = "secret_rzp_test_123456";
    const keyId = "rzp_live_testkey123";
    const orderId = "order_rzp_upstream_001";
    const paymentId = "pay_rzp_upstream_001";
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const mockBooking = {
      id: "bkg-up-1",
      ticketId: "SKB-20261018-UP1",
      guestAccessToken: "guest_tok_up1",
    };

    const mockPayment = {
      id: "pay-entity-1",
      bookingId: "bkg-up-1",
      amountPaise: 50000,
      status: "pending",
    };

    it("successfully captures when signature and upstream Razorpay API payment details match", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: paymentId,
          order_id: orderId,
          amount: 50000,
          currency: "INR",
          status: "captured",
          method: "upi",
        }),
      });

      const mockPaymentsRepo = {
        getByProviderOrderId: vi.fn().mockResolvedValue(mockPayment),
        processCaptured: vi.fn().mockResolvedValue(undefined),
        processNeedsReview: vi.fn(),
        processFailed: vi.fn(),
      } as any;

      const mockBookingsRepo = {
        getById: vi.fn().mockResolvedValue(mockBooking),
      } as any;

      const service = new PaymentsService({
        paymentsRepo: mockPaymentsRepo,
        bookingsRepo: mockBookingsRepo,
        razorpayKeyId: keyId,
        razorpayKeySecret: keySecret,
        razorpayWebhookSecret: "whsec_test",
        fetchImpl: mockFetch as any,
      });

      const res = await service.verifyPayment({
        bookingId: "bkg-up-1",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
      });

      expect(res.status).toBe("captured");
      expect(mockPaymentsRepo.processCaptured).toHaveBeenCalledWith({
        paymentId: "pay-entity-1",
        bookingId: "bkg-up-1",
        providerPaymentId: paymentId,
        paymentMethod: "upi",
      });
      expect(mockPaymentsRepo.processNeedsReview).not.toHaveBeenCalled();
    });

    it("does not call processCaptured when upstream payment status is authorized", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: paymentId,
          order_id: orderId,
          amount: 50000,
          currency: "INR",
          status: "authorized",
          method: "card",
        }),
      });

      const mockPaymentsRepo = {
        getByProviderOrderId: vi.fn().mockResolvedValue(mockPayment),
        processCaptured: vi.fn(),
        processNeedsReview: vi.fn(),
        processFailed: vi.fn(),
      } as any;

      const mockBookingsRepo = {
        getById: vi.fn().mockResolvedValue(mockBooking),
      } as any;

      const service = new PaymentsService({
        paymentsRepo: mockPaymentsRepo,
        bookingsRepo: mockBookingsRepo,
        razorpayKeyId: keyId,
        razorpayKeySecret: keySecret,
        razorpayWebhookSecret: "whsec_test",
        fetchImpl: mockFetch as any,
      });

      const res = await service.verifyPayment({
        bookingId: "bkg-up-1",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
      });

      expect(res.status).toBe("authorized");
      expect(mockPaymentsRepo.processCaptured).not.toHaveBeenCalled();
    });

    it("rejects payment verification if the booking is cancelled", async () => {
      const mockPaymentsRepo = {
        getByProviderOrderId: vi.fn().mockResolvedValue(mockPayment),
        processCaptured: vi.fn(),
      } as any;

      const mockBookingsRepo = {
        getById: vi.fn().mockResolvedValue({ ...mockBooking, status: "cancelled" }),
      } as any;

      const service = new PaymentsService({
        paymentsRepo: mockPaymentsRepo,
        bookingsRepo: mockBookingsRepo,
        razorpayKeyId: keyId,
        razorpayKeySecret: keySecret,
        razorpayWebhookSecret: "whsec_test",
      });

      await expect(
        service.verifyPayment({
          bookingId: "bkg-up-1",
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          razorpaySignature: signature,
        })
      ).rejects.toThrow("This booking is cancelled and cannot accept payment.");

      expect(mockPaymentsRepo.processCaptured).not.toHaveBeenCalled();
    });

    it("moves payment to needs_review when upstream currency is not INR", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: paymentId,
          order_id: orderId,
          amount: 50000,
          currency: "USD",
          status: "captured",
        }),
      });

      const mockPaymentsRepo = {
        getByProviderOrderId: vi.fn().mockResolvedValue(mockPayment),
        processCaptured: vi.fn(),
        processNeedsReview: vi.fn().mockResolvedValue(undefined),
        processFailed: vi.fn(),
      } as any;

      const mockBookingsRepo = {
        getById: vi.fn().mockResolvedValue(mockBooking),
      } as any;

      const service = new PaymentsService({
        paymentsRepo: mockPaymentsRepo,
        bookingsRepo: mockBookingsRepo,
        razorpayKeyId: keyId,
        razorpayKeySecret: keySecret,
        razorpayWebhookSecret: "whsec_test",
        fetchImpl: mockFetch as any,
      });

      const res = await service.verifyPayment({
        bookingId: "bkg-up-1",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
      });

      expect(res.status).toBe("needs_review");
      expect(mockPaymentsRepo.processNeedsReview).toHaveBeenCalledWith({
        paymentId: "pay-entity-1",
        reason: "currency_mismatch",
        providerPaymentId: paymentId,
      });
      expect(mockPaymentsRepo.processCaptured).not.toHaveBeenCalled();
    });

    it("moves payment to needs_review when upstream amount does not match ledger amount", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: paymentId,
          order_id: orderId,
          amount: 1000, // Expected 50000
          currency: "INR",
          status: "captured",
        }),
      });

      const mockPaymentsRepo = {
        getByProviderOrderId: vi.fn().mockResolvedValue(mockPayment),
        processCaptured: vi.fn(),
        processNeedsReview: vi.fn().mockResolvedValue(undefined),
        processFailed: vi.fn(),
      } as any;

      const mockBookingsRepo = {
        getById: vi.fn().mockResolvedValue(mockBooking),
      } as any;

      const service = new PaymentsService({
        paymentsRepo: mockPaymentsRepo,
        bookingsRepo: mockBookingsRepo,
        razorpayKeyId: keyId,
        razorpayKeySecret: keySecret,
        razorpayWebhookSecret: "whsec_test",
        fetchImpl: mockFetch as any,
      });

      const res = await service.verifyPayment({
        bookingId: "bkg-up-1",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
      });

      expect(res.status).toBe("needs_review");
      expect(mockPaymentsRepo.processNeedsReview).toHaveBeenCalledWith({
        paymentId: "pay-entity-1",
        reason: "amount_mismatch",
        providerPaymentId: paymentId,
      });
      expect(mockPaymentsRepo.processNeedsReview).toHaveBeenCalledWith({
        paymentId: "pay-entity-1",
        reason: "amount_mismatch",
        providerPaymentId: paymentId,
      });
      expect(mockPaymentsRepo.processCaptured).not.toHaveBeenCalled();
    });
  });

  describe("payments.service: Durable Webhook Retry & Idempotency", () => {
    it("handles race where webhook arrives before order, and recovers on retry", async () => {
      const webhookSecret = "whsec_test_secret_1234567890";
      const eventId = "evt_race_retry_101";
      const orderId = "order_race_101";
      const paymentId = "pay_race_101";

      const webhookPayload = {
        id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 50000,
              currency: "INR",
            },
          },
        },
      };
      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto.createHmac("sha256", webhookSecret).update(Buffer.from(rawBody)).digest("hex");

      const webhookEvents = new Map<string, any>();
      let orderExists = false;

      const mockPaymentsRepo = {
        recordWebhookEvent: vi.fn().mockImplementation(async (data: any) => {
          const key = `${data.provider}:${data.event_id}`;
          if (webhookEvents.has(key)) {
            return { inserted: false, event: webhookEvents.get(key) };
          }
          const ev = { id: "ev-1", ...data, processed: data.processed || false };
          webhookEvents.set(key, ev);
          return { inserted: true, event: ev };
        }),
        markWebhookEventProcessed: vi.fn().mockImplementation(async (id: string) => {
          for (const ev of webhookEvents.values()) {
            if (ev.id === id) ev.processed = true;
          }
        }),
        getByProviderOrderId: vi.fn().mockImplementation(async (oid: string) => {
          if (!orderExists || oid !== orderId) return null;
          return {
            id: "pay-db-1",
            booking_id: "bkg-db-1",
            amount_paise: 50000,
            status: "pending",
          };
        }),
        processCaptured: vi.fn().mockImplementation(async (params: any) => {
          if (params.webhookEventId) {
            for (const ev of webhookEvents.values()) {
              if (ev.id === params.webhookEventId) ev.processed = true;
            }
          }
        }),
        processNeedsReview: vi.fn().mockImplementation(async (params: any) => {
          if (params.webhookEventId) {
            for (const ev of webhookEvents.values()) {
              if (ev.id === params.webhookEventId) ev.processed = true;
            }
          }
        }),
      } as any;

      const mockBookingsRepo = {
        getById: vi.fn().mockResolvedValue({
          id: "bkg-db-1",
          status: "pending_payment",
        }),
      } as any;

      const service = new PaymentsService({
        paymentsRepo: mockPaymentsRepo,
        bookingsRepo: mockBookingsRepo,
        razorpayKeyId: "rzp_test_1",
        razorpayKeySecret: "secret_1",
        razorpayWebhookSecret: webhookSecret,
      });

      // 1. Initial attempt: Webhook arrives before order is saved in DB
      const res1 = await service.handleWebhook(rawBody, signature);
      expect(res1.status).toBe("order_not_found");
      expect(webhookEvents.get("razorpay:" + eventId)?.processed).toBe(false);

      // 2. Order is now inserted in DB
      orderExists = true;

      // 3. Razorpay retries webhook with same event_id
      const res2 = await service.handleWebhook(rawBody, signature);
      expect(res2.status).toBe("captured");
      expect(mockPaymentsRepo.processCaptured).toHaveBeenCalledWith(expect.objectContaining({
        paymentId: "pay-db-1",
        bookingId: "bkg-db-1",
        providerPaymentId: paymentId,
        webhookEventId: "ev-1",
      }));
      expect(webhookEvents.get("razorpay:" + eventId)?.processed).toBe(true);

      // 4. Duplicate webhook after successful processing returns already_processed
      const res3 = await service.handleWebhook(rawBody, signature);
      expect(res3.status).toBe("already_processed");
    });

    it("allows bidirectional transition between confirmed and paid_confirmed", () => {
      expect(() => assertTransition("confirmed", "paid_confirmed")).not.toThrow();
      expect(() => assertTransition("paid_confirmed", "confirmed")).not.toThrow();
    });

    it("safeguards booking creation when user_id is not present in profiles", async () => {
      let insertedUserId: any = "NOT_CALLED";
      const mockPool = {
        query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
          if (sql.includes("SELECT id FROM profiles")) {
            return { rows: [] }; // Profile does not exist
          }
          if (sql.includes("INSERT INTO profiles")) {
            throw new Error("violates foreign key constraint on auth.users");
          }
          if (sql.includes("INSERT INTO bookings")) {
            insertedUserId = params[1];
            return {
              rows: [{
                id: "bkg-safe-1",
                ticket_id: params[0],
                user_id: params[1],
                guest_access_token: params[2],
                customer_name: params[3],
                customer_phone: params[4],
                customer_email: params[5],
                fare_breakdown: {},
                total_amount: 2500,
                advance_amount: 700,
                balance_amount: 1800,
                passenger_count: 2,
                status: "pending_payment",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }],
            };
          }
          return { rows: [] };
        }),
      } as any;

      const { BookingsRepository } = await import("../../src/modules/bookings/bookings.repository.js");
      const repo = new BookingsRepository(mockPool);

      const booking = await repo.create({
        ticket_id: "AGR-20261018-TEST",
        user_id: "non-existent-user-id",
        guest_access_token: "tok_123",
        customer_name: "Test Customer",
        customer_phone: "+919876543299",
        customer_email: "test.customer@agraskbagheltourandtravels.com",
        category: "outstation",
        vehicle_model_id: "sedan",
        passenger_count: 2,
        pickup_at: new Date().toISOString(),
        pickup_address: "Taj Mahal Agra",
        fare_breakdown: {} as any,
        total_amount: 2500,
        advance_amount: 700,
      });

      expect(booking.id).toBe("bkg-safe-1");
      // Must have fallen back to null user_id so database FK constraint is never violated
      expect(insertedUserId).toBeNull();
    });
  });
});
