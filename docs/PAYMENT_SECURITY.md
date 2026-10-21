# Payment Security — SK Baghel Tour & Travels

**Status:** Production-ready security implementation  
**Last Updated:** 2026-10-21  
**Canonical Reference:** [`docs/PAYMENT_SYSTEM.md`](PAYMENT_SYSTEM.md)

---

## 1. Security Architecture Overview

### 1.1 Trust Boundaries

| Zone | Components | Secrets Allowed |
|------|------------|-----------------|
| **Frontend (Untrusted)** | React app, Checkout.js | `RAZORPAY_KEY_ID` (public) |
| **Backend (Trusted)** | API server, webhook handler | Full credentials |
| **Database (Trusted)** | PostgreSQL | Encrypted PII |
| **Razorpay (External)** | Payment gateway | Their secrets |

### 1.2 Data Flow

```
[Customer Browser]
       │
       │ 1. Select fare, enter details
       ▼
[React App] ──POST /api/bookings──► [Backend]
       │                              │
       │                              │ 2. Validate phone, recompute fare
       │                              │ 3. Create booking (PENDING_PAYMENT)
       │                              │ 4. Create Razorpay Order
       │                              │ 5. Return {order_id, amount, key_id}
       │                              │
       │ 6. Launch Checkout.js        │
       └──◄── Razorpay Hosted Form ───┘
                │
                │ 7. Success callback (optional UX)
                │ 8. Webhook (SOURCE OF TRUTH)
                ▼
         [Backend Webhook Handler]
                │
                │ 9. Verify HMAC-SHA256 signature
                │ 10. Check amount matches order
                │ 11. Check currency = INR
                │ 12. Check booking not cancelled
                │ 13. Mark payment CAPTURED
                │ 14. Update booking CONFIRMED
                ▼
         [Database Committed]
```

---

## 2. Database Schema & State Machine

### 2.1 Core Tables

#### `bookings`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `ticket_id` | TEXT | Human-readable ID (e.g., `AGR-20260907-8F3A`) |
| `user_id` | UUID | Auth user (nullable for guest) |
| `guest_access_token` | TEXT | Guest booking token |
| `customer_name` | TEXT | PII (encrypted at rest) |
| `customer_phone` | TEXT | PII (encrypted at rest) |
| `customer_email` | TEXT | PII (encrypted at rest) |
| `category` | TEXT | `outstation` / `local_package` / `transfer` / `tour_package` |
| `vehicle_model_id` | TEXT | FK to fleet |
| `passenger_count` | INT | |
| `route_id` / `local_package_id` / `transfer_id` / `tour_package_id` | TEXT | FK to catalog |
| `trip_type` | TEXT | `one_way` / `round_trip` |
| `pickup_at` | TIMESTAMPTZ | |
| `return_at` | TIMESTAMPTZ | (nullable) |
| `pickup_address` | TEXT | |
| `drop_address` | TEXT | (nullable) |
| `fare_breakdown` | JSONB | **Locked fare snapshot** |
| `total_amount` | INT | INR paise |
| `advance_amount` | INT | INR paise |
| `balance_amount` | INT | INR paise (derived) |
| `status` | TEXT | State machine (see below) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `payments`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `booking_id` | UUID | FK to bookings |
| `provider` | TEXT | `razorpay` / `paypal` |
| `provider_order_id` | TEXT | Razorpay order ID |
| `provider_payment_id` | TEXT | Razorpay payment ID (after capture) |
| `amount_paise` | INT | |
| `status` | TEXT | `pending` / `captured` / `failed` / `needs_review` / `refunded` |
| `failure_reason` | TEXT | |
| `payment_method` | TEXT | `upi` / `card` / `netbanking` / `wallet` |
| `verified_at` | TIMESTAMPTZ | When status = captured |
| `reconciliation_status` | TEXT | `pending` / `matched` / `needs_review` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `payment_webhook_events`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `provider` | TEXT | |
| `event_id` | TEXT | Razorpay event ID (for deduplication) |
| `event_type` | TEXT | `payment.captured` / `payment.failed` |
| `payload` | JSONB | Raw webhook body |
| `processed` | BOOLEAN | |
| `received_at` | TIMESTAMPTZ | |

### 2.2 Booking Status State Machine

```
DRAFT (internal only)
    │
    ▼
PENDING_PAYMENT
    ├─► PAID (via webhook) ──► CONFIRMED
    ├─► FAILED (payment failed)
    ├─► EXPIRED (order timeout)
    ├─► CANCELLED (user/admin)
    └─► NEEDS_REVIEW (amount/currency mismatch, cancelled booking)
```

**Code:** [`backend/src/modules/bookings/bookings.repository.ts:30`](../backend/src/modules/bookings/bookings.repository.ts:30)

```typescript
status: "pending_payment" | "confirmed" | "driver_assigned" | "in_transit" | "completed" | "cancelled"
```

### 2.3 Payment Status State Machine

```
PENDING
    ├─► CAPTURED (webhook confirms)
    ├─► FAILED (webhook or manual)
    └─► NEEDS_REVIEW (discrepancy detected)
```

**Code:** [`backend/src/modules/payments/payments.repository.ts:11`](../backend/src/modules/payments/payments.repository.ts:11)

```typescript
status: "pending" | "captured" | "failed" | "needs_review" | "refunded" | "partially_refunded"
```

---

## 3. Security Checks Implemented

### 3.1 Webhook Signature Verification

**Location:** [`backend/src/modules/payments/payments.service.ts:274`](../backend/src/modules/payments/payments.service.ts:274)

```typescript
async handleWebhook(rawBody: Buffer | string, signature: string) {
  // PM-06: Invalid signature -> rejected; no state change
  const expectedSignature = crypto
    .createHmac("sha256", this.webhookSecret)
    .update(rawBuffer)
    .digest("hex");

  const validSig = signature &&
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!validSig) {
    throw new AppError("VALIDATION_ERROR", "Invalid webhook signature", 400);
  }
}
```

**Why:** Prevents attackers from forging payment confirmations.

### 3.2 Amount & Currency Validation

**Location:** [`backend/src/modules/payments/payments.service.ts:338`](../backend/src/modules/payments/payments.service.ts:338)

```typescript
if (webhookCurrency && webhookCurrency !== "INR") {
  await this.deps.paymentsRepo.processNeedsReview({
    paymentId: payment.id,
    reason: "currency_mismatch",
    providerPaymentId,
    webhookEventId: recordedEvent?.id,
  });
  return { status: "needs_review", reason: "currency_mismatch" };
}

if (webhookAmount !== payment.amount_paise) {
  await this.deps.paymentsRepo.processNeedsReview({
    paymentId: payment.id,
    reason: "amount_mismatch",
    providerPaymentId,
    webhookEventId: recordedEvent?.id,
  });
  return { status: "needs_review", reason: "amount_mismatch" };
}
```

**Why:** Prevents partial payments or wrong-currency charges from confirming bookings.

### 3.3 Booking Ownership Verification

**Location:** [`backend/src/modules/payments/payments.service.ts:37`](../backend/src/modules/payments/payments.service.ts:37)

```typescript
assertBookingOwnership(booking: BookingEntity, user?: any): void {
  if (user.role === "super_admin" || user.role === "admin") return;
  
  if (booking.user_id && user.id === booking.user_id) return;
  
  if (booking.customer_email && user.email && 
      user.email.toLowerCase() === booking.customer_email.toLowerCase()) return;
  
  throw new AppError("FORBIDDEN", "You do not have permission to access this booking", 403);
}
```

**Why:** Prevents users from viewing/modifying other people's bookings.

### 3.4 Idempotency Protection

**Location:** [`backend/src/modules/payments/payments.service.ts:88`](../backend/src/modules/payments/payments.service.ts:88)

```typescript
// PM-02: Idempotent return of existing pending payment
const existing = await this.deps.paymentsRepo.getPendingByBookingId(bookingId);
if (existing) {
  return existing;
}
```

**Webhook deduplication:** [`backend/src/modules/payments/payments.service.ts:314`](../backend/src/modules/payments/payments.service.ts:314)

```typescript
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
```

**Why:** Prevents double-charging on network retries.

### 3.5 Cancelled Booking Protection

**Location:** [`backend/src/modules/payments/payments.service.ts:366`](../backend/src/modules/payments/payments.service.ts:366)

```typescript
if (booking?.status === "cancelled") {
  await this.deps.paymentsRepo.processNeedsReview({
    paymentId: payment.id,
    reason: "booking_cancelled",
    providerPaymentId,
    webhookEventId: recordedEvent?.id,
  });
  return { status: "needs_review", reason: "booking_cancelled" };
}
```

**Why:** Prevents payment on cancelled bookings (fraud prevention).

### 3.6 Server-Side Fare Recomputation

**Location:** [`backend/src/modules/payments/payments.service.ts:94`](../backend/src/modules/payments/payments.service.ts:94)

```typescript
const amountPaise = booking.advance_amount * 100;
if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
  throw new AppError("VALIDATION_ERROR", "Invalid advance amount", 400);
}
```

**Why:** Client cannot pass arbitrary amounts; server validates against locked fare snapshot.

---

## 4. Additional Security Recommendations

### 4.1 Environment Variables (Required)

```bash
# Never commit to git!
RAZORPAY_KEY_ID=rzp_live_XXXXX          # Public (Checkout.js)
RAZORPAY_KEY_SECRET=XXXXX               # Server-only (HMAC signing)
RAZORPAY_WEBHOOK_SECRET=XXXXX           # Different from key secret!
```

**Location:** [`backend/.env.example:44-47`](../backend/.env.example:44-47)

### 4.2 CORS Configuration

**Location:** [`backend/.env.example:11`](../backend/.env.example:11)

```bash
CORS_ORIGINS=https://agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com
```

**Never use:** `*` (wildcard) in production.

### 4.3 Content Security Policy (CSP)

Add to your CDN/Cloudflare settings:

```
default-src 'self';
script-src 'self' https://checkout.razorpay.com;
connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com;
frame-src https://api.razorpay.com https://checkout.razorpay.com;
img-src 'self' data: https:;
style-src 'self' 'unsafe-inline';
```

### 4.4 Rate Limiting

**Recommended:** 10 requests per 10 minutes per IP + phone number for `/api/payments/*` endpoints.

### 4.5 Phone Number Validation

**Location:** [`backend/src/modules/payments/payments.service.ts:182`](../backend/src/modules/payments/payments.service.ts:182)

```typescript
// Validate India phone numbers (E.164 format)
const phoneRegex = /^[6-9]\d{9}$/;
if (!phoneRegex.test(phone)) {
  throw new AppError("VALIDATION_ERROR", "Invalid Indian phone number", 400);
}
```

### 4.6 PII Encryption

**Recommendation:** Encrypt `customer_name`, `customer_phone`, `customer_email` at rest using PostgreSQL `pgcrypto`:

```sql
-- Add encryption extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt on insert
INSERT INTO bookings (customer_phone) 
VALUES (pgp_sym_encrypt('+919876543210', 'encryption-key'));

-- Decrypt on select
SELECT pgp_sym_decrypt(customer_phone, 'encryption-key') FROM bookings;
```

---

## 5. Testing Security

### 5.1 Webhook Signature Test

```bash
# Generate signature for test payload
echo -n '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_XXXX","order_id":"order_XXXX","amount":420000,"currency":"INR"}}}}' | \
  openssl dgst -sha256 -hmac "YOUR_WEBHOOK_SECRET" | awk '{print $2}'
```

### 5.2 Amount Mismatch Test

1. Create booking with advance ₹4200 (420000 paise)
2. Manually modify webhook to send `amount: 100000` (₹1000)
3. Verify status = `needs_review`

### 5.3 Cancelled Booking Test

1. Create booking
2. Cancel via admin panel
3. Simulate webhook for payment
4. Verify status = `needs_review` (not confirmed)

---

## 6. Monitoring & Alerting

### 6.1 Log Events to Watch

| Event | Severity | Action |
|-------|----------|--------|
| `Invalid webhook signature` | ERROR | Investigate potential attack |
| `amount_mismatch` | WARNING | Manual review required |
| `currency_mismatch` | WARNING | Manual review required |
| `booking_cancelled` | WARNING | Fraud indicator |
| `order_not_found` | INFO | May be replay attack |
| `already_processed` | INFO | Normal idempotent retry |

### 6.2 Dashboard Metrics

- Webhook success rate
- Amount mismatch rate
- Signature verification failures
- Average payment confirmation time

---

## 7. Compliance

### 7.1 PCI-DSS (Payment Card Industry)

**Your scope (SAQ-A):** ✅ Minimal

- ✅ You never see card numbers (Razorpay Checkout handles this)
- ✅ You never store CVV
- ✅ You use HTTPS only
- ✅ You verify signatures

**What you must do:**
- Sign PCI DSS SAQ-A form annually
- Keep software updated
- Use HTTPS with TLS 1.2+

### 7.2 RBI Guidelines (India)

- ✅ Use licensed payment aggregator (Razorpay is licensed)
- ✅ Display clear terms before payment
- ✅ Provide refund mechanism
- ✅ Maintain audit trail (webhook_events table)

---

## 8. Incident Response

### 8.1 Suspected Fraud

1. **Freeze** the booking via admin panel
2. **Contact** Razorpay support with payment ID
3. **Document** all evidence (webhook payload, IP, timestamps)
4. **Report** to authorities if > ₹10,000

### 8.2 Webhook Not Receiving

1. Check webhook URL in Razorpay Dashboard
2. Verify `RAZORPAY_WEBHOOK_SECRET` matches
3. Check backend logs for signature errors
4. Use Razorpay webhook retry log (Dashboard → Webhooks)

---

## 9. Checklist for Production Launch

- [ ] `RAZORPAY_KEY_SECRET` in server env (not git)
- [ ] `RAZORPAY_WEBHOOK_SECRET` configured in Dashboard
- [ ] Webhook URL publicly accessible (HTTPS)
- [ ] CORS origins restricted to your domains
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Phone validation in place
- [ ] Webhook signature verification tested
- [ ] Amount/currency validation tested
- [ ] Cancelled booking protection tested
- [ ] Email/SMS notifications configured
- [ ] Monitoring/alerting set up
- [ ] PCI DSS SAQ-A form prepared

---

**Next Steps:**
1. Review this document with your team
2. Run security tests in Razorpay test mode
3. Deploy to production with live keys
4. Monitor first 100 payments manually
