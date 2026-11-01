# Payment Security — Agra SK Baghel Tour & Travels

**Document Version:** 3.0.0  
**Status:** Production Security Implementation  
**Last Updated:** 2026-11-01  
**Canonical Reference:** [`docs/PAYMENT_SYSTEM.md`](PAYMENT_SYSTEM.md)

---

## 1. Trust Boundaries

| Zone | Components | Secrets Allowed |
|------|------------|-----------------|
| **Frontend (Untrusted)** | `react/`, `admin/`, Razorpay `checkout.js` | `VITE_RAZORPAY_KEY_ID` (public key only) |
| **Backend (Trusted)** | Fastify API, Webhook Handler | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| **Database (Trusted)** | Supabase PostgreSQL | Masked PII in public APIs; RLS enabled |
| **Razorpay (External)** | Payment Gateway | Razorpay internal signing keys |

---

## 2. Mandatory Security Controls Implemented

### 2.1 Timing-Safe Webhook HMAC-SHA256 Verification
- Raw request bytes are captured by `backend/src/middlewares/rawBody.ts` before JSON parsing.
- Signature is verified using `crypto.timingSafeEqual`:

```typescript
const expectedSignature = crypto
  .createHmac("sha256", this.webhookSecret)
  .update(rawBuffer)
  .digest("hex");

const isValid =
  Boolean(signature) &&
  expectedSignature.length === signature.length &&
  crypto.timingSafeEqual(Buffer.from(expectedSignature, "utf8"), Buffer.from(signature, "utf8"));

if (!isValid) {
  throw new AppError("VALIDATION_ERROR", "Invalid webhook signature", 400);
}
```

### 2.2 Strict `captured` Status & Reconciliation Enforcement
- In `verifyPayment()`, after verifying `razorpay_signature`, the server queries `GET https://api.razorpay.com/v1/payments/${razorpayPaymentId}`:
  - If `body.status === "failed"`, marks payment `failed`.
  - If `body.status !== "captured"`, **does not** call `processCaptured()` (prevents premature confirmation on `authorized` or `created` states).
  - Extracts `body.method` (`upi`, `card`, `netbanking`, `wallet`) and passes it to `processCaptured()` so `reconciliation_status = 'matched'`, `verified_at = NOW()`, and `payment_method` are always recorded.

### 2.3 Amount & Currency Integrity (`amount_paise`)
- Compares gateway `amount` (in Paise) against `payment.amount_paise` (`booking.advance_amount * 100`) and `currency === "INR"`.
- Any mismatch routes the payment to `processNeedsReview({ reason: "amount_mismatch" | "currency_mismatch" })` and leaves the booking unconfirmed.

### 2.4 Booking Ownership & IDOR Prevention
- `GET /api/v1/bookings/:id`, `POST /api/v1/payments/create-order`, and `GET /api/v1/bookings/:id/pdf` verify that the caller is either:
  1. Authenticated `super_admin`,
  2. Authenticated customer whose `user.id === booking.user_id`, OR
  3. Guest providing the exact cryptographic `x-guest-token` matching `booking.guest_access_token`.

---

## 3. PCI-DSS SAQ-A & RBI Compliance
- **Zero PAN/CVV Handling:** Card numbers, CVV, and UPI PINs are entered exclusively inside Razorpay's hosted iframe (`https://checkout.razorpay.com`).
- **Audit Trail:** Every webhook payload is logged immutably in `payment_webhook_events` and every admin refund is logged in `admin_audit_logs`.
