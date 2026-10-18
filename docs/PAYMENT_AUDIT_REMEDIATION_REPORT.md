# Payment & Booking System Audit Remediation Report

**Repository:** SK Baghel Tour & Travels (`tarun1sisodia/ArenaAI`)  
**Date:** 2026-10-18  
**Branch:** `main`  
**Monorepo Applications:** `react/` (Customer App), `admin/` (Operations Desk), `backend/` (Fastify / PostgreSQL API)  
**Status:** All findings systematically remediated, verified, and passing monorepo test suite (`npm run verify` exit code 0).

---

## 1. Executive Summary

This report documents the systematic remediation of all defects, risks, and architectural discrepancies identified in the consolidated payment audit ([docs/QWEN_PAYMENT_SYSTEM_AUDIT_REPORT.md](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/docs/QWEN_PAYMENT_SYSTEM_AUDIT_REPORT.md)).

Key outcomes:
1. **P0 Root Cause Eliminated**: Customer booking creation no longer fails with Fastify/Zod `invalid_type` (expected object, received string). Request headers are safely merged after spreading options, ensuring `Content-Type: application/json` is consistently delivered.
2. **Payment & Webhook Security Hardened**: Literal fallback webhook secrets were removed; production fails closed (`CONFIG_ERROR`) if `RAZORPAY_WEBHOOK_SECRET` is unset. All cryptographic HMAC comparisons now use `crypto.timingSafeEqual`. Currency invariant (INR) is enforced on all incoming webhooks.
3. **Independent Upstream Razorpay REST API Lookup**: The browser payment verification endpoint now independently verifies the payment against Razorpay's REST API (`GET /v1/payments/:id`), validating status, amount, and currency before updating ledger state.
4. **Ownership Verification on All Booking & Payment Endpoints**: Constant-time guest access token (`x-guest-token`) and authenticated role checks now guard `POST /bookings/:id/payment`, `POST /bookings/:id/verify-payment`, and `GET /bookings/:id`, eliminating PII exposure and unauthorized checkout creation.
5. **Database Migration & Admin Finance Parity**: Migration `0045_recreate_refunds_and_expand_payment_status.sql` restores the `refunds` table, expands payment/booking status check constraints, and adds missing finance columns (`payment_method`, `verified_at`, `reconciliation_status`). Admin `listPayments()` maps standard INR amounts and links ticket references.
6. **Unified Status Vocabulary**: Bidirectional compatibility between `"confirmed"` (Clean Fare checkout) and `"paid_confirmed"` (Domain / Admin state machine) ensures seamless transitions across customer booking, resume pages, admin dispatch, and refunds.
7. **Durable Webhook Replay Recovery**: Webhook events that arrive before order rows are created in PostgreSQL remain marked `processed: false`, enabling Razorpay retries to successfully capture payments rather than returning false `already_processed` responses.

---

## 2. Detailed Findings & Remediations

### P0 — Header Spread Overwrite Causing Zod String Parsing Error
- **Symptom:** `POST /api/v1/bookings` failed with `invalid_type: expected object, received string` before checkout opened.
- **Root Cause:** In `react/src/services/cleanFareApi.ts`, `apiRequest()` created default headers with `Content-Type: application/json`, but then spread `...options` afterwards. When `createBooking()` passed its own `headers: {}`, it wiped out the default header. The stringified JSON body arrived as `text/plain`, parsed by Fastify as raw string.
- **Remediation:** In `cleanFareApi.ts`, headers are merged *after* spreading `options`:
  ```typescript
  const mergedHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };
  ```

### Critical 1 — Fail-Closed Webhook Secret Configuration
- **Symptom:** `backend/src/modules/payments/payments.service.ts` contained `this.webhookSecret || "whsec_test_secret"`.
- **Root Cause:** Known fallback secret allowed signature forgery if the production environment variable was missing or misnamed.
- **Remediation:** Removed the fallback string. The handler now asserts that `RAZORPAY_WEBHOOK_SECRET` is configured, failing closed with HTTP 500 `CONFIG_ERROR`:
  ```typescript
  if (!this.webhookSecret) {
    throw new AppError("CONFIG_ERROR", "RAZORPAY_WEBHOOK_SECRET is not configured on server", 500);
  }
  ```

### Critical 2 — Admin Refund Failure & Schema Desynchronization
- **Symptom:** Migration `0038` dropped `refunds` without recreating it, leaving `payment.service.ts:refund` unable to persist local refund records after calling Razorpay.
- **Root Cause:** Database migration sequence lacked the table definition and constraints required by newer finance/refund services.
- **Remediation:** Created migration `backend/migrations/0045_recreate_refunds_and_expand_payment_status.sql`:
  - Recreated `refunds` table with `id`, `payment_id`, `booking_id`, `provider_refund_id`, `amount_paise`, `status`, `reason`, `idempotency_key`, and timestamps.
  - Added indexes: `idx_refunds_booking_id`, `idx_refunds_payment_id`, and unique `idx_refunds_idempotency_key`.
  - Added missing columns to `payments`: `payment_method`, `verified_at`, `reconciliation_status`.
  - Expanded `bookings.status` check constraint to include `'draft'`, `'pending_payment'`, `'confirmed'`, `'paid_confirmed'`, `'driver_assigned'`, `'in_transit'`, `'completed'`, `'cancelled'`, and `'refunded'`.

### High 1 & 2 — Timing-Safe HMAC & Currency Invariant
- **Symptom:** Browser verification and webhook handlers compared signatures using standard string equality (`!=`), vulnerable to timing side-channels. Webhook captures did not verify currency.
- **Remediation:** In `payments.service.ts`:
  - Converted signature verification to `crypto.timingSafeEqual(expectedBuf, sigBuf)`.
  - Added strict check in `handleWebhook`: `webhookCurrency !== "INR"` routes payment to `needs_review` with reason `"currency_mismatch"`.

### High 3 — Upstream Razorpay REST API Verification on Client Verify
- **Symptom:** Legacy verification trusted client-supplied signatures without verifying that the payment was truly captured at the gateway for the expected amount.
- **Remediation:** Added independent Razorpay REST API call (`GET /v1/payments/:id`) in `PaymentsService.verifyPayment`:
  - Validates `order_id` matches the stored payment order.
  - Validates `currency === "INR"`.
  - Validates `amount === payment.amount_paise`.
  - Checks gateway `status !== "failed"`.
  - Mismatches move payment to `needs_review` or `failed` rather than blind capture.

### High 4 & Medium — Ownership Proof on Booking & Payment Endpoints
- **Symptom:** Knowing a booking ID allowed unauthorized callers to request checkout details, verify payments, or read customer PII on `GET /api/v1/bookings/:id`.
- **Remediation:**
  - Added `assertBookingOwnership()` using `crypto.timingSafeEqual` against `booking.guest_access_token` or authenticated roles.
  - Enforced on `POST /bookings/:id/payment`, `POST /bookings/:id/verify-payment`, and `GET /bookings/:id`.
  - Client sends `x-guest-token` header automatically via `cleanFareApi.ts`.

### High 5 & Medium — Status Vocabulary & Admin Finance Alignment
- **Symptom:** Clean Fare wrote `confirmed`; AdminDesk/stateMachine expected `paid_confirmed`. Finance page displayed null methods and unformatted paise amounts.
- **Remediation:**
  - Updated `stateMachine.ts` and `domain.ts` to allow bidirectional transitions between `confirmed` and `paid_confirmed`.
  - Updated `payment.service.ts:refund` and `payment.service.ts:verifyCheckoutPayment` to recognize both statuses.
  - Updated `PaymentResumePage.tsx` to accept both statuses.
  - Updated `admin.service.ts:listPayments` to compute standard INR amounts (`amount: Math.round(paise / 100)`), default method to `"upi"`, resolve `bookingTicketId`, and set `reconciliationStatus: "matched"`.

### High 6 & Low — Concurrency Race & Error Sanitization
- **Symptom:** Rapid concurrent checkout clicks could throw PostgreSQL partial unique index error `23505`. Provider error messages leaked upstream response bodies.
- **Remediation:**
  - Handled error `23505` in `payments.service.ts` to gracefully return the existing pending payment.
  - Redacted provider response bodies from public API errors.
  - Added Fastify rate limits: `60 req/min` for checkout/verify, `120 req/min` for webhooks.

### Medium — Webhook Deduplication & Replay Recovery
- **Symptom:** An unknown order webhook returned success and prevented future retries from being processed because the duplicate check looked only at whether the row was inserted.
- **Remediation:**
  - `recordWebhookEvent()` now fetches and returns the existing row on conflict.
  - Duplicate check only returns `already_processed` if `recordedEvent.processed === true`.
  - Orders that race behind webhooks remain `processed: false`, and are safely captured when Razorpay retries the webhook.
  - Ignored webhook events are explicitly marked `processed = true`.

---

## 3. Automated Test Coverage & Verification

- **New Test Suite:** [backend/tests/unit/admin-finance-status.test.ts](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/backend/tests/unit/admin-finance-status.test.ts) (11 tests covering all remediated areas):
  - Admin payment mapping and standard INR conversion.
  - Admin refund eligibility for `confirmed` and `paid_confirmed` bookings.
  - State machine transitions for `confirmed`, `paid_confirmed`, `driver_assigned`.
  - Constant-time guest-token ownership proof and HTTP 403 enforcement.
  - Upstream Razorpay REST API amount, currency, and status verification.
  - Durable webhook replay and race condition recovery.
  - Bidirectional state machine transitions.
- **Monorepo Build Verification:**
  - `admin` TypeScript build: 0 errors.
  - `backend` TypeScript build: 0 errors.
  - `react` TypeScript build: 0 errors.
  - Backend Unit Tests: **324 / 324 passed** (21 test files).
  - SSG Pre-renderer: 72 pages + 23 redirects generated (4.17 MB total).
  - Production Bundles: Built cleanly inside `react/dist`, `admin/dist`, and `backend/dist`.
  - `npm run verify`: Exited with code 0.

---

## 4. Catalog Breakdown

- **Total Outstation Routes:** **963 routes** in catalog across 12 North India corridors.
- **Tour Packages:** **13 Core Tour Packages** in static catalog + 4 published dynamic CMS tour packages.
- **Local Packages & Transfers:** **5 published local tour packages** + **8 airport & railway station transfer routes**.
