import type { Env } from "../../config/env.js";
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newId, sha256Hex, timingSafeEqualString } from "../../shared/ids.js";
import { rupeesToPaise } from "../../shared/money.js";
import { assertTransition } from "../../shared/stateMachine.js";
import type {
  PaymentRecord,
  AuthUser,
} from "../../types/domain.js";
import type { PaymentProviderRegistry } from "../../providers/PaymentProvider.js";
import { assertBookingPayable } from "../bookings/booking.service.js";
import type { createNotificationService } from "../notifications/notification.service.js";
import type { CreatePaymentCheckoutRequest } from "./payment.schema.js";

// Allowed return/cancel URL origins - must be from our CORS list or relative
function isAllowedReturnUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS in production
    if (parsed.protocol !== "https:" && !parsed.hostname.includes("localhost")) {
      return false;
    }
    // Check against allowed origins or same domain
    return allowedOrigins.some((origin) => {
      try {
        const originUrl = new URL(origin);
        return parsed.hostname === originUrl.hostname || parsed.hostname.endsWith(`.${originUrl.hostname}`);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function createPaymentService(deps: {
  db: Repositories;
  clock: Clock;
  env: Env;
  providers: PaymentProviderRegistry;
  notifications: ReturnType<typeof createNotificationService>;
}) {
  return {
    async createCheckout(input: CreatePaymentCheckoutRequest, actor?: AuthUser | null) {
      const authorize = (booking: import("../../types/domain.js").BookingRecord) => {
        const ownerOk = Boolean(actor?.id && booking.userId === actor.id);
        const tokenOk = Boolean(!booking.userId && input.guestAccessToken && input.guestAccessToken.length >= 16 && booking.guestAccessToken.length === input.guestAccessToken.length && timingSafeEqualString(booking.guestAccessToken, input.guestAccessToken));
        if (!ownerOk && !tokenOk) throw Errors.notFound("BOOKING_NOT_FOUND", "The booking could not be found or verified.");
      };
      // Idempotent replay still requires ownership proof before returning checkout data.
      const existing = await deps.db.payments.getByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        const existingBooking = await deps.db.bookings.getById(existing.bookingId);
        if (!existingBooking) throw Errors.notFound("BOOKING_NOT_FOUND", "The booking could not be found or verified.");
        authorize(existingBooking);
        return toPublicCheckout(existing);
      }

      // Validate return URLs if provided to prevent open redirect
      const allowedOrigins = deps.env.CORS_ORIGINS.split(",").map((s) => s.trim());
      if (input.returnUrl && !isAllowedReturnUrl(input.returnUrl, allowedOrigins)) {
        throw Errors.validation([{ path: "returnUrl", message: "Return URL not allowed" }]);
      }
      if (input.cancelUrl && !isAllowedReturnUrl(input.cancelUrl, allowedOrigins)) {
        throw Errors.validation([{ path: "cancelUrl", message: "Cancel URL not allowed" }]);
      }

      // Use transaction to prevent race conditions on concurrent checkout creation
      return deps.db.transaction(async (trx) => {
        const booking = await trx.bookings.getByTicketId(input.ticketId);
        if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "The booking could not be found or verified.");
        authorize(booking);
        assertBookingPayable(booking);

        // Double-check idempotency inside transaction
        const insideExisting = await trx.payments.getByIdempotencyKey(input.idempotencyKey);
        if (insideExisting) {
          return toPublicCheckout(insideExisting);
        }

        const open = await trx.payments.getOpenByBookingId(booking.id);
        if (open && new Date(open.expiresAt).getTime() > deps.clock.now().getTime()) {
          return toPublicCheckout(open);
        }

        // Razorpay is INR only — amount is always in paise
        const amountMinor = rupeesToPaise(booking.advanceAmount);
        if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
          throw new AppError("INVALID_AMOUNT", "Invalid booking amount.", 500);
        }

        const adapter = deps.providers["razorpay"];
        if (!adapter) {
          throw new AppError("UNSUPPORTED_PROVIDER", "Razorpay payment provider not configured.", 400);
        }

        const checkout = await adapter.createCheckout({
          bookingId: booking.id,
          ticketId: booking.ticketId,
          amountMinor,
          currency: "INR",
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          returnUrl: input.returnUrl,
          cancelUrl: input.cancelUrl,
          idempotencyKey: input.idempotencyKey,
        });

        const now = toIso(deps.clock.now());
        if (booking.status === "draft") {
          assertTransition(booking.status, "pending_payment");
          await trx.bookings.update({
            ...booking,
            status: "pending_payment",
            updatedAt: now,
          });
        }

        const payment: PaymentRecord = {
          id: newId(),
          bookingId: booking.id,
          provider: "razorpay",
          providerOrderId: checkout.providerOrderId,
          providerPaymentId: null,
          checkoutSessionId: checkout.checkoutSessionId,
          checkoutUrl: checkout.checkoutUrl,
          publicClientToken: checkout.publicClientToken,
          amountMinor: checkout.amountMinor,
          currency: "INR",
          inrAmountPaise: amountMinor,
          status: "pending",
          paymentMethod: null,
          feeMinor: 0,
          taxMinor: 0,
          idempotencyKey: input.idempotencyKey,
          webhookEventId: null,
          reconciliationStatus: "pending",
          failureReason: null,
          verifiedAt: null,
          expiresAt: checkout.expiresAt,
          createdAt: now,
          updatedAt: now,
        };
        const created = await trx.payments.create(payment);
        return toPublicCheckout(created, booking.ticketId);
      });
    },

    async getStatus(paymentId: string, token?: string, actor?: AuthUser | null) {
      const payment = await deps.db.payments.getById(paymentId);
      if (!payment) throw Errors.notFound("PAYMENT_NOT_FOUND", "Payment not found.");
      const booking = await deps.db.bookings.getById(payment.bookingId);
      if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found for payment.");
      const ownerValid = Boolean(actor?.id && booking.userId === actor.id);
      const tokenValid = Boolean(!booking.userId && token && token.length >= 16 && booking.guestAccessToken.length === token.length && timingSafeEqualString(booking.guestAccessToken, token));
      if (!ownerValid && !tokenValid) throw Errors.unauthorized("Booking ownership proof is required.");
      return {
        paymentId: payment.id,
        ticketId: booking.ticketId,
        status: payment.status,
        reconciliationStatus: payment.reconciliationStatus,
        provider: payment.provider,
        currency: payment.currency,
        amountMinor: payment.amountMinor,
        bookingStatus: booking.status,
      };
    },

    async verifyCheckoutPayment(
      paymentId: string,
      input: { providerOrderId: string; providerPaymentId: string; signature: string },
      actor?: AuthUser | null,
    ) {
      const payment = await deps.db.payments.getById(paymentId);
      if (!payment) throw Errors.notFound("PAYMENT_NOT_FOUND", "Payment not found.");
      const booking = await deps.db.bookings.getById(payment.bookingId);
      if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found for payment.");
      if (!actor?.id || booking.userId !== actor.id) {
        throw Errors.unauthorized("Booking ownership proof is required.");
      }
      if (payment.providerOrderId !== input.providerOrderId) {
        throw Errors.validation([{ path: "providerOrderId", message: "Payment order does not match this payment." }]);
      }

      const adapter = deps.providers[payment.provider];
      const verified = await adapter.verifyCheckoutPayment(input);
      if (!verified || verified.status !== "captured") {
        return { paymentId: payment.id, status: verified?.status ?? "pending", bookingStatus: booking.status };
      }
      if (verified.amountMinor !== payment.amountMinor || verified.currency !== payment.currency) {
        throw new AppError("PAYMENT_AMOUNT_MISMATCH", "Payment amount or currency does not match the booking.", 409);
      }

      let shouldNotify = false;
      let confirmedBooking: Awaited<ReturnType<typeof deps.db.bookings.getById>> = null;
      await deps.db.transaction(async (trx) => {
        const freshPayment = await trx.payments.getById(payment.id);
        const freshBooking = await trx.bookings.getById(payment.bookingId);
        if (!freshPayment || !freshBooking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found for payment.");
        if (freshPayment.status === "captured" && (freshBooking.status === "paid_confirmed" || freshBooking.status === "confirmed")) return;
        if (["cancelled", "refunded"].includes(freshBooking.status)) {
          throw new AppError("BOOKING_NOT_PAYABLE", "This booking is no longer payable.", 409);
        }
        const now = toIso(deps.clock.now());
        await trx.payments.update({
          ...freshPayment,
          providerPaymentId: verified.providerPaymentId,
          status: "captured",
          paymentMethod: verified.paymentMethod,
          feeMinor: verified.feeMinor,
          taxMinor: verified.taxMinor,
          reconciliationStatus: "matched",
          verifiedAt: now,
          updatedAt: now,
        });
        if (freshBooking.status !== "paid_confirmed") {
          assertTransition(freshBooking.status, "paid_confirmed");
          confirmedBooking = await trx.bookings.update({
            ...freshBooking,
            status: "paid_confirmed",
            version: freshBooking.version + 1,
            updatedAt: now,
          });
          shouldNotify = true;
          if (freshBooking.promoCode) {
            try {
              const promo = await trx.promos.getByCode(freshBooking.promoCode);
              if (promo) await trx.promos.update({ ...promo, redemptionCount: promo.redemptionCount + 1 });
            } catch {
              // Non-critical: payment confirmation must not fail because of promo analytics.
            }
          }
        }
      });
      if (shouldNotify && confirmedBooking) await deps.notifications.queuePaymentConfirmed(confirmedBooking);
      return { paymentId: payment.id, status: "captured" as const, bookingStatus: "paid_confirmed" as const };
    },

    async reconcileWebhook(input: {
      provider: "razorpay";
      rawBody: Buffer;
      headers: Record<string, string | string[] | undefined>;
    }) {
      const adapter = deps.providers[input.provider];
      if (!adapter) {
        throw Errors.notFound("PROVIDER_NOT_FOUND", `Provider ${input.provider} not configured.`);
      }
      if (!adapter.verifyWebhook(input.rawBody, input.headers)) {
        throw Errors.unauthorized("Invalid provider webhook signature.");
      }

      let event;
      try {
        event = adapter.parseEvent(input.rawBody);
      } catch {
        throw new AppError("INVALID_WEBHOOK_PAYLOAD", "Webhook payload could not be parsed.", 400);
      }

      // Validate event has required fields
      if (!event.providerOrderId || !event.eventId) {
        throw new AppError("INVALID_WEBHOOK_PAYLOAD", "Webhook missing required fields.", 400);
      }

      const stored = await deps.db.webhooks.record({
        id: newId(),
        provider: input.provider,
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.raw,
        payloadHash: sha256Hex(input.rawBody),
        processed: false,
        receivedAt: toIso(deps.clock.now()),
      });
      if (!stored.created && stored.record.processed) {
        return { duplicate: true, status: "already_processed" as const };
      }

      const payment =
        (event.status === "refunded" && event.providerPaymentId
          ? await deps.db.payments.getByProviderPaymentId(event.providerPaymentId)
          : null) ??
        (await deps.db.payments.getByProviderOrderId(event.providerOrderId));
      if (!payment) {
        // Unknown order - could be race where webhook arrives before checkout creation
        // Return 200 to prevent provider retry storm, but log for investigation
        return { duplicate: false, status: "unknown_order" as const };
      }

      if (event.status === "failed") {
        await deps.db.payments.update({
          ...payment,
          status: "failed",
          webhookEventId: event.eventId,
          reconciliationStatus: "matched",
          failureReason: event.eventType,
          updatedAt: toIso(deps.clock.now()),
        });
        await deps.db.webhooks.markProcessed(event.eventId);
        return { duplicate: false, status: "failed" as const };
      }

      if (event.status === "refunded") {
        await deps.db.transaction(async (trx) => {
          const now = toIso(deps.clock.now());
          const freshPayment = await trx.payments.getById(payment.id);
          const booking = await trx.bookings.getById(payment.bookingId);
          if (!freshPayment || !booking) return;

          await trx.payments.update({
            ...freshPayment,
            status: "refunded",
            webhookEventId: event.eventId,
            reconciliationStatus: "matched",
            updatedAt: now,
          });

          const bookingRefunds = await trx.refunds.listByBookingId(booking.id);
          const refund = (event.providerRefundId
            ? await trx.refunds.getByProviderRefundId(event.providerRefundId)
            : null) ?? bookingRefunds.find((item) => item.paymentId === freshPayment.id && item.status === "pending");
          if (refund && refund.status !== "processed") {
            await trx.refunds.update({
              ...refund,
              providerRefundId: event.providerRefundId ?? refund.providerRefundId,
              status: "processed",
            });
          }

          // Cancellation already moves the booking to cancelled; a later
          // provider refund must not attempt an invalid cancelled -> refunded
          // transition. Other paid bookings become refunded here.
          if (["paid_confirmed", "in_transit"].includes(booking.status)) {
            assertTransition(booking.status, "refunded");
            await trx.bookings.update({
              ...booking,
              status: "refunded",
              version: booking.version + 1,
              updatedAt: now,
            });
          }
        });
        await deps.db.webhooks.markProcessed(event.eventId);
        return { duplicate: false, status: "refunded" as const };
      }

      if (event.status !== "captured") {
        await deps.db.webhooks.markProcessed(event.eventId);
        return { duplicate: false, status: "ignored" as const };
      }

      // An order-level event does not identify the captured payment needed for
      // refunds and ledger linkage. Wait for payment.captured (or another
      // event with a provider payment ID) before confirming the booking.
      if (!event.providerPaymentId) {
        await deps.db.webhooks.markProcessed(event.eventId);
        return { duplicate: false, status: "pending" as const };
      }

      // Strict amount and currency check - prevents amount tampering
      const amountOk = event.amountMinor === payment.amountMinor;
      const currencyOk = event.currency === payment.currency;
      if (!amountOk || !currencyOk) {
        await deps.db.payments.update({
          ...payment,
          status: "needs_review",
          webhookEventId: event.eventId,
          reconciliationStatus: "needs_review",
          failureReason: `amount/currency mismatch event=${event.amountMinor} ${event.currency} order=${payment.amountMinor} ${payment.currency}`,
          updatedAt: toIso(deps.clock.now()),
        });
        await deps.db.webhooks.markProcessed(event.eventId);
        return { duplicate: false, status: "needs_review" as const };
      }

      // Transaction with optimistic locking to prevent double confirmation
      let shouldNotify = false;
      let bookingForNotify: Awaited<ReturnType<typeof deps.db.bookings.getById>> = null;
      await deps.db.transaction(async (trx) => {
        const freshPayment = await trx.payments.getById(payment.id);
        const booking = await trx.bookings.getById(payment.bookingId);
        if (!freshPayment || !booking) return;
        // Idempotent: if already captured and confirmed, do nothing
        if (freshPayment.status === "captured" && booking.status === "paid_confirmed") {
          return;
        }
        // Prevent confirming if booking is already cancelled/refunded
        if (["cancelled", "refunded"].includes(booking.status)) {
          return;
        }
        const now = toIso(deps.clock.now());
        await trx.payments.update({
          ...freshPayment,
          providerPaymentId: event.providerPaymentId,
          status: "captured",
          paymentMethod: event.paymentMethod,
          feeMinor: event.feeMinor,
          taxMinor: event.taxMinor,
          webhookEventId: event.eventId,
          reconciliationStatus: "matched",
          verifiedAt: now,
          updatedAt: now,
        });
        if (booking.status !== "paid_confirmed") {
          assertTransition(booking.status, "paid_confirmed");
          const updated = await trx.bookings.update({
            ...booking,
            status: "paid_confirmed",
            version: booking.version + 1,
            updatedAt: now,
          });
          bookingForNotify = updated;
          shouldNotify = true;

          // Increment promo redemption count if promo was used
          if (booking.promoCode) {
            const consumed = await trx.promos.consume(booking.promoCode);
            if (!consumed) {
              throw Errors.conflict("PROMO_UNAVAILABLE", "The applied promo code is no longer available.");
            }
          }
        }
      });

      if (shouldNotify && bookingForNotify) {
        await deps.notifications.queuePaymentConfirmed(bookingForNotify);
      } else {
        const booking = await deps.db.bookings.getById(payment.bookingId);
        if (booking && booking.status === "paid_confirmed") {
          // Already notified? Ensure at least one notification attempt exists
          const existing = await deps.db.notifications.getByDedupeKey(`whatsapp:payment:${booking.id}`);
          if (!existing) {
            await deps.notifications.queuePaymentConfirmed(booking);
          }
        }
      }
      await deps.db.webhooks.markProcessed(event.eventId);
      return { duplicate: false, status: "captured" as const };
    },

    async refund(input: {
      bookingId: string;
      reason: string;
      idempotencyKey: string;
      actorId: string;
    }) {
      if (!input.reason || input.reason.trim().length < 5) {
        throw Errors.validation([{ path: "reason", message: "Reason must be at least 5 characters" }]);
      }

      const existing = await deps.db.refunds.getByIdempotencyKey(input.idempotencyKey);
      if (existing) return existing;

      return deps.db.transaction(async (trx) => {
        const insideExisting = await trx.refunds.getByIdempotencyKey(input.idempotencyKey);
        if (insideExisting) return insideExisting;

        const booking =
          (await trx.bookings.getById(input.bookingId).catch(() => null)) ??
          (await trx.bookings.getByTicketId(input.bookingId).catch(() => null));
        if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
        if (booking.status !== "paid_confirmed" && (booking.status as string) !== "confirmed") {
          throw Errors.conflict("REFUND_NOT_ELIGIBLE", "Booking is not eligible for refund.");
        }

        // Check for existing refunds to prevent double refund
        const existingRefunds = await trx.refunds.listByBookingId(booking.id);
        const alreadyRefunded = existingRefunds.find((r) => r.status === "processed");
        if (alreadyRefunded) {
          throw Errors.conflict("ALREADY_REFUNDED", "Booking has already been refunded.");
        }

        const payments = await trx.payments.listByBookingId(booking.id);
        const captured = payments.find((item) => item.status === "captured");
        if (!captured?.providerPaymentId) {
          throw Errors.conflict("REFUND_NOT_ELIGIBLE", "No captured payment exists for this booking.");
        }

        const adapter = deps.providers[captured.provider];
        if (!adapter) {
          throw new AppError("PROVIDER_NOT_CONFIGURED", "Payment provider not configured for refund.", 500);
        }

        const result = await adapter.refund({
          providerPaymentId: captured.providerPaymentId,
          amountMinor: captured.amountMinor,
          currency: captured.currency,
          reason: input.reason.trim(),
          idempotencyKey: input.idempotencyKey,
        });

        const now = toIso(deps.clock.now());
        const refund = await trx.refunds.create({
          id: newId(),
          paymentId: captured.id,
          bookingId: booking.id,
          providerRefundId: result.providerRefundId,
          amountMinor: captured.amountMinor,
          currency: captured.currency,
          reason: input.reason.trim(),
          status: result.status === "processed" ? "processed" : "pending",
          idempotencyKey: input.idempotencyKey,
          createdAt: now,
        });

        if (result.status === "processed") {
          await trx.payments.update({
            ...captured,
            status: "refunded",
            updatedAt: now,
          });
          assertTransition(booking.status, "refunded");
          await trx.bookings.update({
            ...booking,
            status: "refunded",
            version: booking.version + 1,
            updatedAt: now,
          });
        }
        return refund;
      });
    },
  };
}


function toPublicCheckout(payment: PaymentRecord, ticketId?: string) {
  return {
    paymentId: payment.id,
    ticketId,
    provider: payment.provider,
    providerOrderId: payment.providerOrderId,
    checkoutUrl: payment.checkoutUrl,
    publicClientToken: payment.publicClientToken,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    expiresAt: payment.expiresAt,
    status: payment.status,
  };
}

export function assertNoClientAmount(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const record = body as Record<string, unknown>;
  // Strip any client-provided monetary fields to enforce server-authoritative amounts
  const forbidden = ["amount", "advanceAmount", "amountMinor", "totalFare", "baseFare", "balanceAmount"];
  for (const key of forbidden) {
    if (key in record) delete record[key];
  }
}
