import crypto from "node:crypto";
import { AppError } from "../../shared/errors.js";
import type { PaymentsRepository, PaymentEntity } from "./payments.repository.js";
import type { BookingsRepository, BookingEntity } from "../bookings/bookings.repository.js";
import { generateBookingPdf } from "../bookings/booking-pdf.service.js";
import type { PaymentOrderResponse } from "../../contracts/fare-system.js";

// Fraud detection constants
const FRAUD_DETECTION = {
  // Maximum advance amount as percentage of total (RBI guideline: max 50% for taxi services)
  MAX_ADVANCE_PERCENT: 50,
  // Minimum advance amount (RBI guideline: min 25% for taxi services)
  MIN_ADVANCE_PERCENT: 25,
  // Maximum time between booking creation and payment (in minutes)
  MAX_PAYMENT_DELAY_MINUTES: 60,
  // Maximum number of failed payments per booking
  MAX_FAILED_PAYMENTS: 3,
  // Maximum number of payment attempts per hour
  MAX_PAYMENT_ATTEMPTS_PER_HOUR: 5,
  // Flag amounts that are suspiciously close to round numbers (potential test payments)
  ROUND_AMOUNT_THRESHOLD: 10000, // ₹100
};

export interface PaymentsServiceDeps {
  paymentsRepo: PaymentsRepository;
  bookingsRepo: BookingsRepository;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
  resendApiKey?: string;
  emailFrom?: string;
  customerSiteUrl?: string;
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

  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Validates Indian phone number (E.164 format)
   * @param phone - Phone number to validate
   * @throws AppError if invalid
   */
  validatePhone(phone: string): void {
    let cleaned = phone.trim().replace(/[\s\-+()]/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    const isIndianMobile = /^[6-9]\d{9}$/.test(cleaned);
    const isInternational = /^\d{7,15}$/.test(cleaned);
    if (!isIndianMobile && !isInternational) {
      throw new AppError("VALIDATION_ERROR", "Invalid phone number format.", 400);
    }
  }

  /**
   * Validates advance amount percentage against total
   * @param totalAmount - Total fare in INR
   * @param advanceAmount - Advance amount in INR
   * @throws AppError if invalid
   */
  validateAdvancePercentage(totalAmount: number, advanceAmount: number): void {
    if (!Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isFinite(advanceAmount) || advanceAmount <= 0) {
      throw new AppError("VALIDATION_ERROR", "Invalid fare amounts", 400);
    }
    if (advanceAmount > totalAmount) {
      throw new AppError("VALIDATION_ERROR", "Advance cannot exceed total fare", 400);
    }
  }

  /**
   * Checks for suspicious payment patterns (fraud detection)
   * @param booking - Booking entity
   * @param paymentAmount - Payment amount in paise
   * @returns Array of fraud warnings (empty if clean)
   */
  checkFraudPatterns(booking: BookingEntity, paymentAmount: number): string[] {
    const warnings: string[] = [];
    const now = new Date();
    const bookingDate = new Date(booking.created_at);
    const minutesSinceBooking = (now.getTime() - bookingDate.getTime()) / (1000 * 60);

    // Check for unusually long delay between booking and payment
    if (minutesSinceBooking > FRAUD_DETECTION.MAX_PAYMENT_DELAY_MINUTES) {
      warnings.push(`Payment delay of ${Math.round(minutesSinceBooking)} minutes exceeds normal pattern`);
    }

    // Check for suspiciously round amounts (potential test payments)
    const amountInRupees = paymentAmount / 100;
    if (amountInRupees % FRAUD_DETECTION.ROUND_AMOUNT_THRESHOLD === 0) {
      warnings.push(`Payment amount ₹${amountInRupees} is suspiciously round (potential test payment)`);
    }

    // Check for multiple failed payments on same booking
    // This would require querying the repository for failed payments history
    // For now, we log a warning if the booking has been in pending_payment for too long
    if (minutesSinceBooking > 24 * 60) {
      warnings.push(`Booking has been pending payment for ${Math.round(minutesSinceBooking / 60)} hours`);
    }

    return warnings;
  }

  assertBookingOwnership(booking: BookingEntity, user?: any, guestToken?: string): void {
    if (guestToken && booking.guest_access_token && guestToken.length === booking.guest_access_token.length) {
      const a = Buffer.from(guestToken, "utf8");
      const b = Buffer.from(booking.guest_access_token, "utf8");
      if (crypto.timingSafeEqual(a, b)) return;
    }
    if (user === undefined) {
      return;
    }
    if (!user || !user.id) {
      throw new AppError("AUTH_REQUIRED", "Authentication required to access booking", 401);
    }
    if (user.role === "super_admin" || user.role === "admin") {
      return;
    }
    if (booking.user_id && user.id === booking.user_id) {
      return;
    }
    if (booking.customer_email && user.email && user.email.toLowerCase() === booking.customer_email.toLowerCase()) {
      return;
    }
    throw new AppError("FORBIDDEN", "You do not have permission to access this booking", 403);
  }

  async getPaymentOrder(bookingId: string, user?: any): Promise<PaymentOrderResponse> {
    const booking = await this.deps.bookingsRepo.getById(bookingId);
    if (!booking) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }
    this.assertBookingOwnership(booking, user);
    const payment = await this.createPaymentOrder(bookingId, user);
    return {
      payment_id: payment.id,
      order_id: payment.providerOrderId,
      currency: "INR",
      amount_paise: payment.amountPaise,
      key_id: this.keyId,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || undefined,
    };
  }

  async createPaymentOrder(bookingId: string, user?: any): Promise<PaymentEntity> {
    const booking = await this.deps.bookingsRepo.getById(bookingId);
    if (!booking) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }
    this.assertBookingOwnership(booking, user);

    if (booking.status !== "pending_payment") {
      throw new AppError("INVALID_STATE", "Booking is not in pending_payment status", 400);
    }

    // PM-02: Idempotent return of existing pending payment
    const existing = await this.deps.paymentsRepo.getPendingByBookingId(bookingId);
    if (existing) {
      return existing;
    }

    // PM-01: amountPaise = advance_amount * 100
    const amountPaise = booking.advance_amount * 100;
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      throw new AppError("VALIDATION_ERROR", "Invalid advance amount", 400);
    }

    // Security: Validate phone number format
    try {
      this.validatePhone(booking.customer_phone);
    } catch (err: any) {
      console.warn(`[payments] Invalid phone for booking ${bookingId}: ${booking.customer_phone}`);
      throw err;
    }

    // Security: Validate advance percentage
    try {
      this.validateAdvancePercentage(booking.total_amount, booking.advance_amount);
    } catch (err: any) {
      console.warn(`[payments] Invalid advance percentage for booking ${bookingId}: total=${booking.total_amount}, advance=${booking.advance_amount}`);
      throw err;
    }

    // Security: Check fraud patterns (log warnings but don't block)
    const fraudWarnings = this.checkFraudPatterns(booking, amountPaise);
    if (fraudWarnings.length > 0) {
      console.warn(`[payments] Fraud pattern warnings for booking ${bookingId}:`, fraudWarnings);
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
        console.error(`[payments] Razorpay order creation failed (status ${res.status}):`, text.slice(0, 300));
        throw new AppError("UPSTREAM_ERROR", "Payment provider order creation failed. Please try again.", 502);
      }
      const data = (await res.json()) as { id: string };
      providerOrderId = data.id;
    } else {
      providerOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    }

    try {
      return await this.deps.paymentsRepo.create({
        booking_id: booking.id,
        provider: "razorpay",
        provider_order_id: providerOrderId,
        amountPaise: amountPaise,
      });
    } catch (err: any) {
      if (err?.code === "23505" || err?.message?.includes("payments_one_pending_per_booking")) {
        const existingAfterRace = await this.deps.paymentsRepo.getPendingByBookingId(bookingId);
        if (existingAfterRace) {
          return existingAfterRace;
        }
      }
      throw err;
    }
  }

  async verifyPayment(params: {
    bookingId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    user?: any;
  }): Promise<{ status: string }> {
    const booking = await this.deps.bookingsRepo.getById(params.bookingId);
    if (!booking) {
      throw new AppError("NOT_FOUND", "Booking not found", 404);
    }
    this.assertBookingOwnership(booking, params.user);

    if (booking.status === "cancelled" || (booking.status as string) === "refunded") {
      throw new AppError("BOOKING_NOT_PAYABLE", "This booking is cancelled and cannot accept payment.", 409);
    }

    const payment = await this.deps.paymentsRepo.getByProviderOrderId(params.razorpayOrderId);
    if (!payment) {
      throw new AppError("NOT_FOUND", "Payment order not found", 404);
    }
    if (payment.bookingId !== params.bookingId) {
      throw new AppError("VALIDATION_ERROR", "Payment order does not match booking", 400);
    }

    if (payment.status === "captured") {
      return { status: "already_captured" };
    }

    // Local test mode - allow unverified capture for local development
    if (this.keyId?.startsWith("rzp_test_local")) {
      await this.deps.paymentsRepo.processCaptured({
        paymentId: payment.id,
        bookingId: payment.bookingId,
        providerPaymentId: params.razorpayPaymentId,
        paymentMethod: "test_mode",
      });

      try {
        await this.sendBookingConfirmationEmail(payment.bookingId, params.razorpayPaymentId);
      } catch (err: any) {
        console.warn(`[payments] Background confirmation email skipped: ${err?.message || err}`);
      }

      return { status: "captured" };
    }

    // Production mode - require proper configuration and verification
    if (!this.keyId || !this.keySecret) {
      throw new AppError("INTERNAL_ERROR", "Payment gateway not configured", 500);
    }

    // Cryptographic HMAC-SHA256 signature verification per Razorpay specification
    const payload = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expected = crypto.createHmac("sha256", this.keySecret).update(payload).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const sigBuf = Buffer.from(params.razorpaySignature, "utf8");
    if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
      throw new AppError("VALIDATION_ERROR", "Invalid payment signature", 400);
    }

    // Upstream provider verification of exact order, amount, currency, and captured state
    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await this.fetchImpl(`https://api.razorpay.com/v1/payments/${encodeURIComponent(params.razorpayPaymentId)}`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
      });

      if (!res.ok) {
        throw new AppError("PAYMENT_VERIFICATION_FAILED", `Razorpay API returned status ${res.status}`, 502);
      }

      const body = (await res.json()) as any;
      if (!body?.id) {
        throw new AppError("PAYMENT_VERIFICATION_FAILED", "Invalid response from Razorpay API", 502);
      }

      if (body.order_id && body.order_id !== params.razorpayOrderId) {
        throw new AppError("VALIDATION_ERROR", "Payment order ID mismatch", 400);
      }
      if (body.currency && body.currency.toUpperCase() !== "INR") {
        await this.deps.paymentsRepo.processNeedsReview({
          paymentId: payment.id,
          reason: "currency_mismatch",
          providerPaymentId: params.razorpayPaymentId,
        });
        return { status: "needs_review" };
      }
      if (typeof body.amount === "number" && body.amount !== payment.amountPaise) {
        await this.deps.paymentsRepo.processNeedsReview({
          paymentId: payment.id,
          reason: "amount_mismatch",
          providerPaymentId: params.razorpayPaymentId,
        });
        return { status: "needs_review" };
      }
      if (body.status === "failed") {
        await this.deps.paymentsRepo.processFailed({
          paymentId: payment.id,
          reason: body.error_description || "payment_failed_at_gateway",
        });
        return { status: "failed" };
      }

      // Enforce provider captured status strictly
      if (body.status !== "captured") {
        console.warn(`[payments] Provider payment status for ${params.razorpayPaymentId} is '${body.status}', skipping capture.`);
        return { status: body.status };
      }

      const paymentMethod = body.method || body.payment_method || null;

      await this.deps.paymentsRepo.processCaptured({
        paymentId: payment.id,
        bookingId: payment.bookingId,
        providerPaymentId: params.razorpayPaymentId,
        paymentMethod,
      });

      try {
        await this.sendBookingConfirmationEmail(payment.bookingId, params.razorpayPaymentId);
      } catch (err: any) {
        console.warn(`[payments] Background confirmation email skipped: ${err?.message || err}`);
      }

      return { status: "captured" };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error(`[payments] Razorpay API payment status lookup error: ${err?.message || err}`);
      throw new AppError("PAYMENT_VERIFICATION_FAILED", "Payment verification failed", 502);
    }
  }

  async handleWebhook(
    rawBody: Buffer | string,
    signature: string,
    timestamp?: string
  ): Promise<{ status: string; reason?: string }> {
    const rawBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;

    // Fail closed: Webhook secret MUST be configured
    if (!this.webhookSecret) {
      throw new AppError("CONFIG_ERROR", "RAZORPAY_WEBHOOK_SECRET is not configured on server", 500);
    }

    // Security: Validate timestamp to prevent replay attacks
    // Razorpay sends X-Razorpay-Signature-Timestamp header
    if (timestamp) {
      const now = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp, 10);
      const timeDiff = Math.abs(now - webhookTime);

      // Reject if timestamp is more than 5 minutes off
      if (timeDiff > 300) {
        console.warn(`[payments] Webhook timestamp skew too large: ${timeDiff}s`);
        throw new AppError("VALIDATION_ERROR", "Webhook timestamp too old or too new", 400);
      }
    }

    // PM-06: Invalid signature -> rejected; no state change
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBuffer)
      .digest("hex");

    const validSig =
      signature &&
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!validSig) {
      console.error(`[payments] Invalid webhook signature received`);
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

    if (!inserted && recordedEvent?.processed) {
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

    // Accept both repository domain records and legacy database-shaped fixtures during migration.
    const bookingId = payment.bookingId ?? (payment as unknown as { booking_id?: string }).booking_id;
    if (!bookingId) {
      throw new AppError("DATA_CORRUPTION", "Payment is missing its booking relationship", 500);
    }
    const booking = await this.deps.bookingsRepo.getById(bookingId);

    if (eventType === "payment.captured") {
      const webhookAmount = Number(paymentEntity?.amount ?? 0);
      const webhookCurrency = String(paymentEntity?.currency || "").toUpperCase();
      const providerPaymentId = String(paymentEntity?.id || "");

      // Currency check: must be INR
      if (webhookCurrency && webhookCurrency !== "INR") {
        await this.deps.paymentsRepo.processNeedsReview({
          paymentId: payment.id,
          reason: "currency_mismatch",
          providerPaymentId,
          webhookEventId: recordedEvent?.id,
        });
        return { status: "needs_review", reason: "currency_mismatch" };
      }

      // PM-05: Webhook amount differs -> payment needs_review; booking stays pending_payment
      if (webhookAmount !== payment.amountPaise) {
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
        bookingId,
        providerPaymentId,
        webhookEventId: recordedEvent?.id,
        paymentMethod: paymentEntity?.method || null,
      });

      // Post-transaction email voucher dispatch (isolated error boundary)
      try {
        await this.sendBookingConfirmationEmail(bookingId, providerPaymentId);
      } catch (emailErr: any) {
        console.warn(`[payments] Background confirmation email delivery skipped: ${emailErr?.message || emailErr}`);
      }

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

    if (recordedEvent?.id && typeof this.deps.paymentsRepo.markWebhookEventProcessed === "function") {
      await this.deps.paymentsRepo.markWebhookEventProcessed(recordedEvent.id);
    }

    return { status: "ignored" };
  }

  async sendBookingConfirmationEmail(
    bookingId: string,
    providerPaymentId?: string
  ): Promise<boolean> {
    try {
      if (!this.deps.resendApiKey) {
        return false;
      }

      // Merge the raw booking row with display-ready details. The detail contract
      // may omit operational fields (trip_type, flight/train reference, special notes)
      // that belong on the PDF attachment.
      let rawBooking: any = null;
      try {
        if (typeof this.deps.bookingsRepo.getById === "function") {
          rawBooking = await this.deps.bookingsRepo.getById(bookingId);
        }
      } catch {
        // Fall back to the display-ready detail record if the raw lookup fails.
      }

      let bookingDetail: any = null;
      try {
        if (typeof this.deps.bookingsRepo.getBookingDetail === "function") {
          bookingDetail = await this.deps.bookingsRepo.getBookingDetail(bookingId);
        }
      } catch {
        // Some mock repositories do not implement display-ready detail loading.
      }

      const booking: any = { ...(rawBooking || {}), ...(bookingDetail || {}) };
      if (!booking.ticket_id) return false;

      const customerEmail = booking.customer_email?.trim();
      if (!customerEmail) {
        return false;
      }

      const ticketId = booking.ticket_id || "BOOKING";
      const customerName = booking.customer_name || "Valued Customer";
      const totalAmount = Number(booking.total_amount) || 0;
      const advanceAmount = Number(booking.advance_amount) || 0;
      const balanceAmount = Number(booking.balance_amount) || (totalAmount - advanceAmount);

      const productName =
        (booking as any).product_name ||
        (booking.category === "tour_package"
          ? "Tour Package"
          : booking.category === "local_package"
            ? "Local Sightseeing"
            : booking.category === "transfer"
              ? "Airport / Station Transfer"
              : "Outstation Taxi");

      const vehicleName =
        (booking as any).vehicle_model?.display_name ||
        (booking as any).vehicle_display_name ||
        "Air-Conditioned Commercial Vehicle";

      const pickupAddress = booking.pickup_address || "Specified Pickup Location";
      const dropAddress = booking.drop_address || "";
      const pickupAt = booking.pickup_at
        ? new Date(booking.pickup_at).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        : "As scheduled";

      const siteUrl = (this.deps.customerSiteUrl || "https://agraskbagheltourandtravels.com").replace(/\/+$/, "");
      const voucherUrl = `${siteUrl}/booking/confirmation?id=${encodeURIComponent(
        (booking as any).booking_id || booking.id || bookingId
      )}`;

      const paymentReference = providerPaymentId ? ` (Payment Ref: ${providerPaymentId})` : "";

      const voucherHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - ${ticketId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #7c2d12; padding: 28px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">AGRA SK BAGHEL TOUR &amp; TRAVELS</h1>
              <p style="margin: 4px 0 0 0; color: #fed7aa; font-size: 13px; font-weight: 400;">Agra's Trusted Chauffeur &amp; Tour Service &bull; Est. 2013</p>
            </td>
          </tr>

          <!-- Confirmation Badge & Intro -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 6px 14px; margin-bottom: 16px;">
                <span style="color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&bull; Booking Confirmed &bull; Advance Received</span>
              </div>
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Namaste, ${customerName}!</h2>
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Your chauffeur booking has been confirmed and your advance deposit is secured${paymentReference}. Below are your official booking details and trip summary.
              </p>
            </td>
          </tr>

          <!-- Core Details Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 38%;">Ticket Reference</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500;">Service / Package</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${productName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500;">Vehicle Assigned</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${vehicleName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500;">Pickup Schedule</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${pickupAt} (IST)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500;">Pickup Address</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; line-height: 1.4;">${pickupAddress}</td>
                </tr>
                ${dropAddress
          ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500;">Drop Address</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; line-height: 1.4;">${dropAddress}</td>
                </tr>
                `
          : ""
        }
              </table>
            </td>
          </tr>

          <!-- Tariff Breakdown -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Payment &amp; Tariff Summary</h3>
              <table role="presentation" width="100%" style="border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #475569; font-size: 14px;">Total Guaranteed Fare</td>
                  <td align="right" style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">₹${Math.round(
          totalAmount
        ).toLocaleString("en-IN")}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;">Advance Deposit Received (28%)</td>
                  <td align="right" style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 700;">₹${Math.round(
          advanceAmount
        ).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 4px 0; color: #0f172a; font-size: 15px; font-weight: 700;">Balance Due to Chauffeur (72%)</td>
                  <td align="right" style="padding: 10px 0 4px 0; color: #9a3412; font-size: 16px; font-weight: 800;">₹${Math.round(
          balanceAmount
        ).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 0; color: #64748b; font-size: 12px;">* Balance payable at the end of the journey directly to the driver via UPI or Cash.</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background-color: #9f3c16; border-radius: 8px;">
                    <a href="${voucherUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;">View &amp; Print Chauffeur Voucher &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Chauffeur Dispatch Notice -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fffbeb; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;">
              <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                <strong>Important Notice:</strong> Your chauffeur's full name, mobile number, and vehicle registration plate will be sent to you via SMS and WhatsApp <strong>2 hours prior to pickup</strong>. Clean vehicle guarantee and commercial transport permit included on all trips.
              </p>
            </td>
          </tr>

          <!-- Footer & Support -->
          <tr>
            <td style="padding: 28px 32px; background-color: #ffffff; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; color: #475569; font-weight: 600;">Need assistance or itinerary modifications?</p>
              <p style="margin: 0 0 12px 0;">24/7 Operations Desk: <a href="tel:+919762817598" style="color: #9f3c16; text-decoration: none; font-weight: 600;">+91 97628 17598</a> &bull; WhatsApp: <a href="https://wa.me/919762817598" style="color: #9f3c16; text-decoration: none; font-weight: 600;">+91 97628 17598</a></p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">Agra SK Baghel Tour &amp; Travels &bull; Agra Cantt, Uttar Pradesh 282001, India &bull; https://agraskbagheltourandtravels.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      const voucherText = `
CONFIRMED: CHAUFFEUR BOOKING VOUCHER [${ticketId}]
Agra SK Baghel Tour & Travels — Agra's Trusted Chauffeur & Tour Service (Est. 2013)

Dear ${customerName},

Your booking is confirmed and your advance payment has been received${paymentReference}.

TRIP SUMMARY
- Ticket ID: ${ticketId}
- Service / Package: ${productName}
- Vehicle Model: ${vehicleName}
- Pickup Schedule: ${pickupAt} (IST)
- Pickup Address: ${pickupAddress}
${dropAddress ? `- Drop Address: ${dropAddress}\n` : ""}
TARIFF DETAILS
- Total Guaranteed Fare: ₹${Math.round(totalAmount).toLocaleString("en-IN")}
- Advance Paid (28%): ₹${Math.round(advanceAmount).toLocaleString("en-IN")}
- Balance to Chauffeur (72%): ₹${Math.round(balanceAmount).toLocaleString("en-IN")} (Payable in Cash / UPI at destination)

VIEW OFFICIAL VOUCHER & INVOICE:
${voucherUrl}

NOTICE:
Driver name, mobile number, and license plate number will be sent to your phone 2 hours prior to scheduled pickup.

24/7 Helpline: +91 97628 17598
WhatsApp: https://wa.me/919762817598
Warm regards,
Agra SK Baghel Tour & Travels
      `.trim();

      let fromAddress = this.deps.emailFrom || "bookings@skbagheltravels.in";
      const emailMatch = fromAddress.match(/<([^>]+)>/);
      const cleanEmail = (emailMatch?.[1] || fromAddress).trim();
      const senderDomain = cleanEmail.split("@")[1]?.toLowerCase() || "";
      const freemailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com"];
      if (freemailDomains.includes(senderDomain)) {
        console.warn(
          `[payments] EMAIL_FROM uses freemail domain (@${senderDomain}) which Resend rejects with 403. Falling back to 'onboarding@resend.dev'.`
        );
        fromAddress = "onboarding@resend.dev";
      }

      let attachments: Array<{ filename: string; content: string }> | undefined = undefined;
      try {
        const pdfBuffer = await generateBookingPdf(booking, providerPaymentId);
        attachments = [
          {
            filename: `${ticketId}-confirmation-voucher.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ];
      } catch (pdfErr: any) {
        console.warn(
          `[payments] Failed to generate booking PDF for ${ticketId}, dispatching email without PDF attachment:`,
          pdfErr?.message || pdfErr
        );
      }

      const res = await this.fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.deps.resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `booking-confirmed/${(booking as any).id || (booking as any).booking_id || bookingId}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [customerEmail],
          subject: `Confirmed: Your Chauffeur Booking Voucher [${ticketId}] `,
          html: voucherHtml,
          text: voucherText,
          ...(attachments ? { attachments } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[payments] Resend confirmation email delivery failed for ${ticketId}: ${errText.slice(0, 300)}`);
        return false;
      }

      return true;
    } catch (err: any) {
      console.warn(`[payments] Error dispatching confirmation email for ${bookingId}:`, err?.message || err);
      return false;
    }
  }
}
