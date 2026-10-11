import crypto from "node:crypto";
import { AppError } from "../../shared/errors.js";
import type { PaymentsRepository, PaymentEntity } from "./payments.repository.js";
import type { BookingsRepository } from "../bookings/bookings.repository.js";

export interface PaymentsServiceDeps {
  paymentsRepo: PaymentsRepository;
  bookingsRepo: BookingsRepository;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
  fetchImpl?: typeof fetch;
}

export class PaymentsService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private fetchImpl: typeof fetch;

  constructor(private deps: PaymentsServiceDeps) {
    this.keyId = (deps.razorpayKeyId || "").trim();
    this.keySecret = (deps.razorpayKeySecret || "").trim();
    this.webhookSecret = (deps.razorpayWebhookSecret || "").trim();
    this.fetchImpl = deps.fetchImpl ?? fetch;
  }

  async createPaymentOrder(bookingId: string): Promise<PaymentEntity> {
    const booking = await this.deps.bookingsRepo.getById(bookingId);
    if (!booking) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }

    if (booking.status !== "pending_payment") {
      throw new AppError("INVALID_STATE", "Booking is not in pending_payment status", 400);
    }

    // PM-02: Idempotent return of existing pending payment
    const existing = await this.deps.paymentsRepo.getPendingByBookingId(bookingId);
    if (existing) {
      return existing;
    }

    // PM-01: amount_paise = advance_amount * 100
    const amountPaise = booking.advance_amount * 100;
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      throw new AppError("VALIDATION_ERROR", "Invalid advance amount", 400);
    }

    let providerOrderId: string;
    if (this.keyId && this.keySecret && !this.keyId.startsWith("rzp_test_local")) {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await this.fetchImpl("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: booking.ticket_id,
          payment_capture: 1,
          notes: {
            booking_id: booking.id,
            ticket_id: booking.ticket_id,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new AppError("UPSTREAM_ERROR", `Razorpay order creation failed: ${text.slice(0, 200)}`, 502);
      }
      const data = (await res.json()) as { id: string };
      providerOrderId = data.id;
    } else {
      providerOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    }

    return this.deps.paymentsRepo.create({
      booking_id: booking.id,
      provider: "razorpay",
      provider_order_id: providerOrderId,
      amount_paise: amountPaise,
    });
  }

  async handleWebhook(
    rawBody: Buffer | string,
    signature: string
  ): Promise<{ status: string; reason?: string }> {
    const rawBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;

    // PM-06: Invalid signature -> rejected; no state change
    const secret = this.webhookSecret || "whsec_test_secret";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBuffer)
      .digest("hex");

    const validSig =
      signature &&
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!validSig) {
      throw new AppError("VALIDATION_ERROR", "Invalid webhook signature", 400);
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBuffer.toString("utf8"));
    } catch {
      throw new AppError("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const eventId = String(payload.id || payload.event_id || "");
    const eventType = String(payload.event || "");
    if (!eventId || !eventType) {
      throw new AppError("VALIDATION_ERROR", "Missing event metadata", 400);
    }

    // PM-04: Deduplication in payment_webhook_events
    const { inserted, event: recordedEvent } = await this.deps.paymentsRepo.recordWebhookEvent({
      provider: "razorpay",
      event_id: eventId,
      event_type: eventType,
      payload,
      processed: false,
    });

    if (!inserted) {
      return { status: "already_processed" };
    }

    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const providerOrderId = String(paymentEntity?.order_id || orderEntity?.id || "");

    const payment = await this.deps.paymentsRepo.getByProviderOrderId(providerOrderId);
    // PM-07: Webhook for unknown order -> event stored, processed = false, nothing else changes
    if (!payment) {
      return { status: "order_not_found" };
    }

    const booking = await this.deps.bookingsRepo.getById(payment.booking_id);

    if (eventType === "payment.captured") {
      const webhookAmount = Number(paymentEntity?.amount ?? 0);
      const providerPaymentId = String(paymentEntity?.id || "");

      // PM-05: Webhook amount differs -> payment needs_review; booking stays pending_payment
      if (webhookAmount !== payment.amount_paise) {
        await this.deps.paymentsRepo.processNeedsReview({
          paymentId: payment.id,
          reason: "amount_mismatch",
          providerPaymentId,
          webhookEventId: recordedEvent?.id,
        });
        return { status: "needs_review", reason: "amount_mismatch" };
      }

      // PM-08: Webhook after booking was cancelled -> payment needs_review; booking stays cancelled
      if (booking?.status === "cancelled") {
        await this.deps.paymentsRepo.processNeedsReview({
          paymentId: payment.id,
          reason: "booking_cancelled",
          providerPaymentId,
          webhookEventId: recordedEvent?.id,
        });
        return { status: "needs_review", reason: "booking_cancelled" };
      }

      // PM-03: Matching amount and valid state -> payment captured, booking confirmed, one transaction
      await this.deps.paymentsRepo.processCaptured({
        paymentId: payment.id,
        bookingId: payment.booking_id,
        providerPaymentId,
        webhookEventId: recordedEvent?.id,
      });
      return { status: "captured" };
    }

    if (eventType === "payment.failed") {
      // PM-10: Failed webhook -> payment failed; booking stays pending_payment
      await this.deps.paymentsRepo.processFailed({
        paymentId: payment.id,
        reason: paymentEntity?.error_description || "payment_failed",
        webhookEventId: recordedEvent?.id,
      });
      return { status: "failed" };
    }

    return { status: "ignored" };
  }
}
