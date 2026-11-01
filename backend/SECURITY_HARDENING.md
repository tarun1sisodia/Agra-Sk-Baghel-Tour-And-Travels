# Security Hardening & Edge Cases — Agra SK Baghel Backend

This document describes the security hardening and edge-case handling implemented in response to audit findings that the backend was not following edge cases discussed on Medium, Reddit, and other forums, and was not securely written.

## 1. Authentication & Authorization

### Issues Found
- JWT role extraction trusted `user_metadata.role` and `payload.role` which are client-writable in Supabase. Attacker could escalate to dispatcher/super_admin.
- Test auth (`Bearer test-<role>`) could be left enabled in production.
- No validation of `sub` claim, token length, or issuer.
- `requireUser` did not validate principal id.

### Fixes
- Only trust `app_metadata.role` which is server-controlled via service role.
- Validate `sub` exists, token length <=2048, issuer check for Supabase JWKS.
- `ALLOW_TEST_AUTH` must be false in production; env loader throws if true in prod.
- `requireUser` validates id exists.
- Timing-safe comparison for guest tokens.

## 2. Booking Access & Privacy (DPDP Act 2023)

### Issues
- `phonesMatch` allowed last4 suffix matching, enabling brute-force enumeration of bookings via 10k guesses.
- `BookingAccessQuerySchema` allowed `phoneLast4` param.
- Driver PII revealed to phone-only verifiers.
- No sanitization of free-text fields (XSS).

### Fixes
- `phonesMatch` now requires exact match after normalization (handles +91 vs without, but not suffix).
- Removed `phoneLast4` from query schema; only full phone regex allowed.
- `projectBooking` only reveals driver contact to token holders or admins, not phone verifiers.
- Added `sanitizeText` that strips HTML tags and control chars for name, address, notes, inquiries, reviews, catalog.
- Masking: `maskPhone` and `maskEmail` applied by default; unmask only for admin.

## 3. Fare Engine Edge Cases

### Issues Discussed on Medium/Reddit
- Night allowance window documented as 22:00-05:00 but code used 20-6.
- No validation for NaN/Infinity distance.
- No cap on return date (could be years later).
- Promo codes not validated for expiry, active flag, max redemptions.
- Advance calculation could exceed total or be non-finite.

### Fixes
- `OUTSTATION_RULES` night window corrected to 22-5 per spec.
- `hourInIst` wrapped in try/catch, returns false on invalid datetime instead of crashing.
- `calculateFare` validates finite distance, max 5000 km, return not more than 30 days after pickup.
- `applyPromo` validates format `^[A-Z0-9_-]{3,30}$`, checks isActive, validFrom/validTo, maxRedemptions.
- `advanceOf` validates finite, positive, ensures never exceeds total.
- `calendarDaysInclusiveIst` caps at 31 days.
- Tempo/Urbania 300 km minimum enforced outside corridors.
- Added `isOverlapping` check for driver assignments.

## 4. Payment Security

### Issues
- Client-submitted amounts could be trusted (test showed sending amount:1).
- No transaction around checkout creation, allowing race to create duplicate payments.
- ReturnUrl/CancelUrl open redirect.
- Webhook amount mismatch not flagged.
- Duplicate webhook could cause double fulfillment.
- Refund double-spend.
- No promo redemption tracking.

### Fixes
- `assertNoClientAmount` strips all monetary fields before Zod parsing.
- Zod schemas use `.strip()` to remove unknown money fields.
- Checkout creation wrapped in transaction with SELECT FOR UPDATE on open payments, double-check idempotency inside transaction.
- `isAllowedReturnUrl` validates return/cancel URLs against CORS origins and requires HTTPS.
- Webhook verification uses timing-safe HMAC over raw body, rawBody preserved via custom parser that also prevents prototype pollution (`__proto__` check via hasOwnProperty).
- Amount and currency strict equality check; mismatch sets `needs_review` and does not confirm booking.
- Webhook dedup via `eventId` unique index, returns 200 duplicate without side effects.
- Unknown order returns 200 with status unknown_order to avoid retry storm.
- Refund: transaction, idempotency check inside tx, check existing processed refunds to prevent double refund, validate reason length.
- Promo redemption count incremented atomically after payment captured.
- FX rates validated 0-1, finite.

## 5. Dispatch & Driver Assignment

### Issues
- BUG-009: driver could be assigned to overlapping trips.
- No vehicle active check.
- No tier compatibility check.
- Version conflict only checked in service, not in DB WHERE clause.
- Driver contact shared even if not police verified.

### Fixes
- Implemented `isOverlapping` and query driver bookings with status driver_assigned/in_transit to detect overlap, throw 409 DRIVER_OVERLAP.
- Check vehicle.isActive, throw VEHICLE_INACTIVE.
- Tier compatibility: vehicle tier must be >= booking tier (sedan < ertiga < innova < tempo < urbania), prevents downgrade.
- Postgres update uses `WHERE id=$1 AND version=$3-1` optimistic locking.
- `notifyDriver` requires policeVerified true.
- Audit logs for assign and notify-driver with requestId.

## 6. Input Validation & Injection

- All Zod schemas strict or strip, with regex for promo, name, phone, email, storagePath.
- `SafeNameSchema` regex `^[a-zA-Z\s.'-]+$` prevents injection.
- `SafeAddressSchema` and `SafeNotesSchema` reject `<script|javascript:|on\w+=`.
- `storagePath` rejects `..`, `//`, leading `/` to prevent path traversal.
- Review text rejects repeated char spam `/(.)\1{9,}/` and HTML.
- Location query sanitized, length 2-80, rejects script.
- Body limit 1MB, rawBody max 1MB.
- Prototype pollution prevented via hasOwnProperty check in rawBody parser.

## 7. Rate Limiting & Brute Force

- Per-route rate limits: fares 60/min, bookings draft 30/min, checkout 20/min, inquiries 5/min, reviews 10/min, admin 20-60/min.
- Webhooks allowlisted from rate limit but still require HMAC.
- Booking voucher endpoint 60/min to mitigate token brute force.
- Error response includes requestId from actual request, not hardcoded.

## 8. Security Headers & CORS

- Helmet enabled with HSTS in production (maxAge 1 year).
- CORS origin validation via function that checks exact match against allowlist, rejects unknown origins.
- Allowed headers explicitly listed including webhook signature headers.
- No wildcard origin with credentials.

## 9. Logging & Secrets

- Pino redaction paths include all sensitive keys: authorization, cookie, token, secret, signature, phone, email, guestAccessToken, idempotencyKey, webhook signatures.
- Error handler sanitizes Zod details (only path, message, code) and hides 500 details in production.
- Env loader validates production requires DATABASE_URL, SUPABASE_URL, SERVICE_ROLE_KEY, JWT secret, Razorpay secrets if key set, and CORS origins must be HTTPS.
- No secrets in code, only env.

## 10. Transactions & Concurrency

- Postgres transaction uses `REPEATABLE READ` isolation.
- `getById` uses `FOR UPDATE` when inside transaction to lock row.
- `getOpenByBookingId` uses `FOR UPDATE`.
- Memory repo uses promise-chain lock for tests to simulate serializable.
- Ticket generation retry 8 times with unique constraint.

## 11. Notifications

- Dedupe key prevents duplicate WhatsApp/email.
- Max attempts 3, marks failed after.
- Queued jobs only where attempt <3.
- Phone validation before send, email validation, timeout 5s via AbortController.
- Payload sanitization: slice text to 100 chars for WhatsApp variables.

## 12. Location & External Providers

- LocationIQ provider validates token length, query length, timeout 2.5s via AbortController, slices results to 8, sanitizes displayName.
- Fallback to static curated places if provider fails.
- Cache TTL 30 days, key normalized lowercased.

## 13. Promo & Catalog

- Promo codes uppercase normalized, regex alphanumeric dash underscore.
- Catalog slug regex `^[a-z0-9-]{2,80}$`.
- Media sortOrder max 1000, storagePath validated.

## 14. Tests Added

- Contract test: rejects last4 bypass, expects 400.
- Contract test: rejects past pickup, XSS in notes.
- Unit test: promo invalid format, non-finite distance, return >30 days, tempo 300km minimum, night edge cases 04:59 vs 05:01.
- Privacy test: exact phone match only, last4 must fail, country code normalization.

## 15. Remaining Open Items

- BUG-007 LocationIQ monitoring: add metrics.
- BUG-010 Notification retry queue: now has retry but needs BullMQ for scale.
- BUG-011 Refund audit: now has idempotency but needs finance approval workflow.

## Verification

All 38 tests pass after hardening:
- `npx vitest run` 38 passed.

Production checklist:
- Env validation throws if insecure CORS or missing secrets.
- No test auth in prod.
- HSTS enabled.
- Body limit enforced.
