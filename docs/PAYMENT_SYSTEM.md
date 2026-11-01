# Payment System Specification — SK Baghel Tour & Travels

**Document Version:** 3.0.0  
**Status:** Production Specification (Fastify 5 + PostgreSQL + React 19 + Razorpay)  
**Gateway:** Razorpay (India — Sole Payment Provider)  
**Last Updated:** 2026-11-01

---

## 1. Core Financial Rules

1. **Two-Part Fare Model (28% Online Advance / 72% Driver Cash Balance):**
   - **28% Advance Now (`bookings.advance_amount` in INR / `payments.amount_paise` in Paise):** Charged online via Razorpay Checkout to lock vehicle custody and confirm the booking (`paid_confirmed`).
   - **72% Balance on Completion (`bookings.balance_amount` in INR):** Paid directly by the customer to the chauffeur upon trip completion. No second online payment order is created.
   - **Admin Completion:** When the trip finishes, `super_admin` updates the booking status to `completed` and marks `balance_collected_by_driver = true` in the Admin panel.
2. **Standardized Units:**
   - `bookings.total_fare`, `bookings.advance_amount`, and `bookings.balance_amount` are stored in **whole integer INR Rupees (`INT`)**.
   - `payments.amount_paise` and `refunds.amount_paise` are stored in **integer Indian Paise (`BIGINT`)**, where:
     ```ts
     const amount_paise = booking.advance_amount * 100;
     ```
3. **Zero Client Trust:**
   - The browser may **initiate** checkout, but a browser return URL or client callback **never** marks a booking `paid_confirmed` without cryptographic signature verification AND server-side Razorpay capture confirmation.

---

## 2. End-to-End Payment Architecture

```
[Customer React App (react/)]
        │
        │ 1. POST /api/v1/bookings (quote + customer details)
        ▼
[Fastify Backend API (backend/)]
        │  - Recomputes fare via 5-Step Fare Engine
        │  - Verifies quoted_total === server.total
        │  - Inserts booking (status = 'pending_payment', advance_amount, balance_amount)
        │
        │ 2. POST /api/v1/payments/create-order (booking_id + Idempotency-Key)
        ▼
[PaymentsService]
        │  - Reuses existing open 'pending' payment if present (idempotent)
        │  - Calls Razorpay Orders API: amount = advance_amount * 100 (INR paise), payment_capture = 1
        │  - Inserts payments row (status = 'pending', amount_paise, provider_order_id)
        │  - Returns { payment_id, order_id, amount_paise, currency: 'INR', key_id }
        ▼
[Razorpay Checkout.js (Loaded on-demand on /booking)]
        │  - Customer completes UPI / Card / Netbanking payment
        ├──► (A) Browser Callback: POST /api/v1/payments/verify
        │        - Verifies HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
        │        - Calls GET https://api.razorpay.com/v1/payments/:id
        │        - Enforces body.status === 'captured', body.amount === payment.amount_paise, body.currency === 'INR'
        │        - Runs atomic processCaptured() transaction
        │
        └──► (B) Razorpay Webhook (SOURCE OF TRUTH): POST /api/v1/payments/webhooks/razorpay
                 - Verifies X-Razorpay-Signature against raw request Buffer (RAZORPAY_WEBHOOK_SECRET)
                 - Deduplicates via payment_webhook_events(event_id)
                 - Validates amount_paise, currency === 'INR', and booking.status !== 'cancelled'
                 - Runs atomic processCaptured() transaction (< 40ms)
                 - Enqueues async PDF Voucher + Resend Email + WhatsApp notification job
```

---

## 3. Atomic Database Capture & Reconciliation (`processCaptured`)

When either `verifyPayment()` (after confirming `body.status === 'captured'` with Razorpay's API) or `handleWebhook()` (`payment.captured` / `order.paid`) succeeds, `paymentsRepo.processCaptured()` executes inside a single PostgreSQL `BEGIN ... COMMIT` transaction with row-level `FOR UPDATE` locks:

```sql
BEGIN;

-- 1. Lock payment & booking rows
SELECT id, status, amount_paise, booking_id FROM payments WHERE id = $1 FOR UPDATE;
SELECT id, status, cancelled_at FROM bookings WHERE id = $2 FOR UPDATE;

-- 2. Update payment with full reconciliation metadata
UPDATE payments
SET
  status = 'captured',
  provider_payment_id = $3,
  payment_method = COALESCE($4, payment_method),
  reconciliation_status = 'matched',
  verified_at = NOW(),
  updated_at = NOW()
WHERE id = $1;

-- 3. Transition booking to paid_confirmed ONLY if not cancelled
UPDATE bookings
SET
  status = 'paid_confirmed',
  updated_at = NOW()
WHERE id = $2
  AND status IN ('draft', 'pending_payment')
  AND cancelled_at IS NULL;

-- 4. Mark webhook event processed (if triggered by webhook)
UPDATE payment_webhook_events
SET processed = TRUE
WHERE id = $5;

COMMIT;
```

**Discrepancy Guard (`processNeedsReview`):**
- If `webhookAmount !== payment.amount_paise`, `webhookCurrency !== 'INR'`, or `booking.status === 'cancelled'`, the transaction marks `payments.status = 'needs_review'` and `payments.reconciliation_status = 'needs_review'` with `failure_reason`, leaving the booking unconfirmed for `super_admin` inspection.

---

## 4. Real-World Payment Scenarios Handled

1. **Happy Path:** Customer pays via UPI → Webhook / Verify confirms `captured` → Booking becomes `paid_confirmed` → Async worker emails PDF voucher.
2. **Double Click / Network Retry:** Client sends same `Idempotency-Key` or requests order for a booking that already has a `pending` payment → Backend returns the existing `provider_order_id` without creating a duplicate Razorpay order.
3. **Customer Closes Browser Tab Mid-Payment:** Webhook arrives independently, marks booking `paid_confirmed`, and triggers the confirmation email + WhatsApp voucher.
4. **Authorized But Not Captured (`status === 'authorized'`):** `verifyPayment()` sees `body.status !== 'captured'` and returns `{ status: 'authorized' }` without confirming the booking; waits for `payment.captured` webhook.
5. **Payment on Expired/Cancelled Booking:** After 30 minutes of inactivity, the expiry worker cancels `pending_payment` bookings. If a late payment webhook arrives for a `cancelled` booking, `processNeedsReview` flags it as `booking_cancelled` for refund review instead of reviving a cancelled trip.
6. **Duplicate / Out-of-Order Webhooks:** `payment_webhook_events(event_id)` unique constraint ensures duplicate webhook deliveries return `200 OK` (`{ status: 'already_processed' }`) with zero state mutation.
7. **Admin Refund (`POST /api/v1/admin/payments/:id/refund`):** Restricted to `super_admin`. Calls Razorpay Refunds API with an idempotency key, records row in `refunds`, and transitions booking to `refunded`.
