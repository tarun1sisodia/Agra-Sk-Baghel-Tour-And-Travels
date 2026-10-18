# Booking and Payment Integrity Audit — Consolidated

**Project:** SK Baghel Tour & Travels (`tarun1sisodia/ArenaAI`)
**Repository snapshot:** branch `main`, commit `87d5a06`
**Audit date:** 2026-10-18
**Mode:** Read-only source review. No application code changes, production writes, migrations, webhook replays, payments, or external submissions were performed.

## Executive summary

The immediate Zod error has a strong, concrete source explanation: the customer booking POST can be sent without `Content-Type: application/json`. The request helper’s default header is replaced by the booking caller’s own headers map, while the body remains a JSON string. Fastify’s text parser can therefore hand a string to a Zod schema expecting an object. The booking request fails before the payment-order endpoint or Razorpay Checkout is called.

The source contains two payment API families, but they do **not** register duplicate copies of the same route. The names in the attached report were reversed: `payment.*` is the newer provider-adapter module; `payments.*` is the Clean Fare checkout module. The current immediate customer booking screen uses Clean Fare routes (`/api/v1/bookings/:id/payment`, `/verify-payment`, `/api/v1/webhooks/razorpay`), while the authenticated resume screen calls the newer `/api/v1/payments/...` routes. This split still creates significant contract, state, webhook-configuration and admin reconciliation risk.

The attached report correctly called attention to admin/ledger alignment, webhook verification, order creation idempotency and monitoring. Some of its specific claims were not supported by current source. In particular, exact webhook raw-body preservation is implemented; global rate limiting is present; a webhook-first race does not leave the booking pending because the webhook handler itself updates booking state; and the booking advance is server-derived. The more specific admin risk is that payment listing can read core Clean Fare ledger fields through the shared generic repository, but supplemental method/reconciliation values can be null, and the current migration sequence drops `refunds` without recreating it even though the admin refund service queries/inserts that table. If that migration state is live, a refund can be sent to Razorpay and then fail to persist locally—an especially important staging verification item.

**This is not production certification.** I did not inspect the deployed commit, live schema/migration ledger, secrets, Razorpay dashboard, runtime logs, notification delivery, or current admin behavior. Dependencies are absent in the clone; tests/builds were not executed.

## 1. Reported failure: why Zod receives a string

### Source trace

- `react/src/services/cleanFareApi.ts:43-55`: `apiRequest()` creates default headers including JSON content type and then spreads `options` afterward.

- `cleanFareApi.ts:287-325`: `createBooking()` passes its own `headers` object and a `JSON.stringify(...)` body.

- `react/src/features/booking/clean/CleanBookingPage.tsx:541-565`: customer booking payload is an object, and `createBooking()` is called before checkout.

- `backend/src/modules/bookings/bookings.routes.ts:8-16`: `POST /api/v1/bookings` parses the request body as a Zod booking object.

The caller’s `headers` replaces the default headers object (including when it is `{}`). A string body without an explicit JSON content type is normally sent as text/plain by Fetch. Fastify then parses text as a string and the object schema reports `invalid_type`, `expected object`, `received string`. On this error path, `CleanBookingPage` does not proceed to `createBookingPayment()` or `Razorpay.open()`.

**Assessment:** High-confidence source diagnosis, but not a live packet capture. A browser Network trace showing the booking POST `Content-Type`, request body type and response/request ID would confirm the production occurrence. Do not share guest access tokens or payment/card information.

## 2. Payment architecture and flow actually represented in source

### Current immediate customer booking flow

`CleanBookingPage` → `POST /api/v1/bookings` → `POST /api/v1/bookings/:id/payment` → Razorpay Checkout → `POST /api/v1/bookings/:id/verify-payment` from the browser callback (best-effort) → redirect to booking confirmation, which reads/polls `GET /api/v1/bookings/:id`. The provider also posts webhook events to the legacy Clean Fare webhook route family.

Relevant files: `react/src/features/booking/clean/CleanBookingPage.tsx`, `react/src/services/cleanFareApi.ts`, `backend/src/modules/bookings/bookings.routes.ts`, `backend/src/modules/payments/payments.routes.ts`, `payments.service.ts`, and `payments.repository.ts`.

### Authenticated customer resume flow

`PaymentResumePage` → `POST /api/v1/payments/create-checkout` → Razorpay Checkout → `POST /api/v1/payments/:paymentId/verify` → `GET /api/v1/payments/:paymentId/status`. The provider webhook is `POST /api/v1/payments/webhooks/razorpay`.

Relevant files: `react/src/pages/PaymentResumePage.tsx`, `react/src/services/customerAuthApi.ts`, `backend/src/modules/payments/payment.routes.ts`, `payment.controller.ts`, `payment.service.ts`, and `backend/src/providers/adapters/razorpay.ts`.

### Route mounting distinction

`backend/src/app.ts` mounts both modules. The legacy generic/provider-adapter module (`payment.*`) is registered unconditionally. Clean Fare booking/payment routes (`bookings.*`, `payments.*`) are registered conditionally when the database pool and fare catalog are present. The route patterns are distinct: `/api/v1/payments/...` is not the same as `/api/v1/bookings/:id/payment` or `/api/v1/webhooks/razorpay`.

Thus, the attachment’s claim that the two modules collide on the same endpoint and inherently create duplicate Razorpay orders is **not supported** by these route definitions. The architectural split itself is real: different frontend entry points use different routes, services, event paths and payment-state vocabulary. The module naming in the attachment was reversed.

## 3. Consolidated findings

### P0 — Booking POST header merge can stop the flow before payments

See Section 1. The customer’s POST can arrive as text rather than JSON, producing the exact object-vs-string Zod failure. This is the direct failure candidate.

### Critical — Legacy Clean Fare webhook has a known fallback signing secret

`backend/src/modules/payments/payments.service.ts:157-176` uses `this.webhookSecret || "whsec_test_secret"`. If the deployed legacy webhook service is reachable with no configured secret, a caller who knows the public source can forge an HMAC and submit a fake capture. This is conditional on runtime configuration/routing, but the code must fail closed rather than use a literal fallback.

### Critical — Admin refund path may call Razorpay before failing local persistence

The newer `payment.service.ts:455-524` checks idempotency/eligibility, calls the provider refund at lines 483-494, and only afterward inserts a row through `trx.refunds.create()` at lines 496-508. The repository (`backend/src/db/postgres.ts:938-949`) inserts into `refunds`.

Migration `0038_fare_system_clean_rebuild.sql:14-17` drops `payments`, `raw_webhooks`, `refunds`, and booking-intent tables, then recreates a simpler Clean Fare payment ledger. Searches of migrations after 0038 show no recreation of `refunds`. Therefore, **if production has applied this migration sequence without out-of-band schema repair**, the external refund could succeed and the local insert fail. The operator could see an API error despite money having been refunded; retry behavior then needs careful handling. Verify actual production schema before any admin refund test or live refund.

### High — Legacy browser verification trusts a signature without a provider status/amount lookup

`payments.service.ts:115-155` validates the Razorpay order/payment HMAC, then marks the payment and booking captured via the repository. It does not call Razorpay to independently verify captured state, exact amount or currency. It also compares signature strings with ordinary inequality, not a timing-safe helper. By contrast, the newer adapter calls Razorpay’s payment API and checks the payment/order association, captured state, amount and currency. The immediate customer screen currently uses the weaker Clean Fare verification endpoint.

### High — Legacy webhook capture does not compare currency

`payments.service.ts:217-249` checks captured webhook amount against the ledger amount but does not compare webhook currency with INR. The newer provider-neutral service checks both amount and currency. The captured event must be checked against the exact stored order, payment, amount, currency and provider status before a booking transition.

### High — No ownership proof on the immediate Clean Fare payment endpoints

`backend/src/modules/payments/payments.routes.ts:104-108` routes payment-order creation and verification by booking ID without checking authenticated ownership or a guest token in those handlers. The amount is server-calculated, but knowing a booking ID can allow an unauthorized caller to request/retrieve checkout details or submit callback verification. The newer payment module has ownership checks but is not used by the immediate checkout page.

### High — Payment and booking contract duality can desynchronize customer, admin and provider state

The Clean Fare payment service stores `amount_paise`, `payment_webhook_events`, and changes booking status to `confirmed`. The newer provider-adapter flow expects provider-neutral fields/reconciliation, `raw_webhooks`/refund persistence, and `paid_confirmed`. Docs, customer entry points, admin finance and webhook configuration therefore need a canonical choice and explicit migration plan.

### High — Admin finance sees core payments but has field and schema risks

The attached report says admin will see zero Clean Fare payments because of schema incompatibility. That blanket conclusion is **not established**: the generic PostgreSQL repository queries the same `payments` table; `mapPayment()` accepts `amount_paise` and status, and `admin.service.ts:listPayments()` reads that repository. Core rows and totals can therefore be returned from the Clean Fare schema.

However, the Clean Fare schema does not hold all newer fields such as `payment_method`, `verified_at`, or `reconciliation_status`; `mapPayment()` defaults missing fields to null/defaults. The Finance page’s method breakdown may be empty, reconciliation visibility can be misleading, and the refund eligibility/processing path depends on newer status/booking states and refund storage. The confirmed high-risk schema defect is the missing `refunds` table after migration 0038, described above. Verify the running database before concluding whether this is already repaired outside the repo.

### High — Concurrent checkout creation can leave provider orders without matching ledger state

The Clean Fare service reuses an existing pending payment (`payments.service.ts:64-68`), so the attached report’s assertion that there is simply no idempotency is incomplete. But the provider order is created before the DB insert (`payments.service.ts:76-112`), and concurrent requests can both pass the existing-payment check. Migration 0038 has a partial unique index allowing one pending payment per booking, which can reject one insert after an additional external order was already created. That can leave an untracked provider order. Test concurrent calls and ensure provider creation plus durable idempotency/reconciliation handle this race.

### Medium — Confirmation email in legacy flow is best-effort rather than a durable outbox

The legacy verification/webhook service sends email inline and catches failures (`payments.service.ts:148-152, 251-256`). The booking/payment state may commit even when mail fails. The newer notification service has queue/dedupe/retry behavior, but the legacy Clean Fare flow does not use it. Confirm delivery, retry, and admin visibility for email and WhatsApp in the actual customer path.

### Medium — Webhook event retry/reconciliation can strand valid payments

The legacy handler stores an event before applying its effect; unknown orders remain unprocessed and return success (`payments.service.ts:192-214`). A duplicate ID can then be treated as already processed/seen without a demonstrated operational reprocessing route. Failures after persistence can strand state. Define durable event states and monitored retry/reconciliation.

### Medium — Public booking detail handler does not validate guest-token ownership

`backend/src/modules/bookings/bookings.routes.ts:66-90` reads a booking by ID/ticket and returns details without validating the supplied guest token, despite the client optionally sending `x-guest-token`. This is a booking PII exposure adjacent to payment security. Ensure ownership checks on booking detail and keep guest tokens out of URLs/logs.

### Medium — Customer/admin status vocabulary can disagree

Clean Fare writes `confirmed`; newer payment/admin/refund logic expects `paid_confirmed`. UI, admin filters, refund eligibility and lifecycle transitions can misinterpret payment state. Define and enforce one state model.

### Lower priority — Public errors expose provider response text

Legacy order creation includes a truncated Razorpay response body in an API error (`payments.service.ts:97-100`). Keep provider details in redacted server logs and return stable public error codes.

## 4. Reconciliation of the attached report’s additional claims

| Attached report claim | Result against current source |
| --- | --- |
| Two payment modules collide and cause duplicate orders/double charges | **Incorrect as stated.** Both modules mount, but route families differ. The customer immediate flow uses `payments.*`; authenticated resume uses `payment.*`. Architecture split is valid; route collision is not shown. |
| Admin sees zero Clean Fare payments | **Overstated.** Generic admin repository reads the shared `payments` table and maps core `amount_paise`/status. Missing supplemental columns default to null. Admin field coverage and refund persistence are concerns; “zero rows” is not established. |
| Raw webhook HMAC may use re-serialized parsed JSON because `rawBody` is absent | **Incorrect for current app wiring.** `registerRawBody()` in `backend/src/middlewares/rawBody.ts:3-38` installs a JSON buffer parser and sets `request.rawBody` before parsing. `app.ts:141` registers it. Legacy webhook then prefers that raw buffer. Preserve this behavior in future parser changes. |
| Browser verification race can leave captured webhook payment pending | **Incorrect as stated.** The webhook capture branch itself calls `processCaptured()` and updates booking status. Client verification can fail afterward without undoing webhook confirmation. Other retry/partial-failure cases still need tests. |
| No Razorpay order idempotency | **Partially correct.** The service reuses an existing pending row, and the DB partial unique index constrains pending rows. There is still a remote-order race because provider creation precedes ledger insertion; provider receipt is not a substitute for local idempotency. |
| Advance amount can be client-tampered | **Not supported by examined source.** The Clean Fare booking service recalculates/validates fare and persists the server result; the payment service uses persisted `advance_amount`. Still test request fields are ignored/rejected and booking snapshots are immutable to customers. |
| No rate limit on Clean Fare webhooks | **Incorrect as stated.** The app registers a global 120 requests/minute rate limit. The legacy webhook has no route-specific override, but is not unbounded in this configuration. Newer webhook route sets 500/minute per route. Review deployed proxy/IP handling and whether global rate-limit keys are suitable. |
| Secrets in environment variables are inherently unsafe / must be Cloudflare Secrets | **Not a source finding.** Environment variables are a normal secret-injection mechanism; security depends on the hosting platform, access, logs and rotation. The hard-coded fallback secret is the concrete code defect. |
| Legacy `payment.*` files are unused/dead | **Incorrect.** They are mounted and used by `PaymentResumePage` through `customerAuthApi.ts`. They are not the immediate checkout route, but are active in the authenticated resume path and admin service wiring. |

The attached report is dated 2025-04-05, while this review examines the repository snapshot above. Its code excerpts/line numbers and verdict should not be treated as current deployment evidence.

## 5. Booking, payment and admin API inventory

### Customer booking

| Method/path | Purpose | Backend handler | Frontend use |
| --- | --- | --- | --- |
| `POST /api/v1/bookings` (also `/bookings`) | Create Clean Fare booking after request validation/fare check. | `bookings.routes.ts` → `BookingsService.createBooking()` | `cleanFareApi.ts:createBooking()` from `CleanBookingPage.tsx`. |
| `GET /api/v1/bookings/:id` (also `/bookings/:id`) | Load detail by UUID or ticket ID. | `bookings.routes.ts` → `getBookingDetail()` | `fetchBookingById()` in `cleanFareApi.ts`; `BookingConfirmationPage.tsx`. |
| `POST /api/v1/bookings/draft` | Create draft and issue booking/ticket/guest access details. | `booking.routes.ts` → `booking.controller.ts` → `booking.service.ts` | `admin/src/lib/api.ts:createAdminBooking()` from `admin/src/pages/BookingsPage.tsx`; customer draft/intake flow where used. Not namespaced under admin. |
| `GET /api/v1/me/profile` | Own profile. | `booking.routes.ts` | `customerAuthApi.ts:getMyProfile()`. |
| `GET /api/v1/me/bookings` | List authenticated user’s bookings. | `booking.routes.ts` | `customerAuthApi.ts:listMyBookings()`; `MyBookingsPage.tsx`. |
| `GET /api/v1/me/bookings/:bookingId` | One authenticated booking. | `booking.routes.ts` | `customerAuthApi.ts:getMyBooking()`; `PaymentResumePage.tsx`. |
| `POST /api/v1/booking-intents` | Create resumable booking intent. | `booking-intent.routes.ts` | `customerAuthApi.ts:createBookingIntent()`. |
| `GET /api/v1/booking-intents/:id` | Recover intent with resume secret. | Same route/controller/service. | `customerAuthApi.ts:getBookingIntent()`. |
| `POST /api/v1/booking-intents/:id/finalize` | Finalize intent into booking. | Same route/controller/service. | `customerAuthApi.ts:finalizeBookingIntent()`. |

### Customer payment

| Method/path | Purpose | Backend handler | Frontend use |
| --- | --- | --- | --- |
| `POST /api/v1/bookings/:id/payment` (also `/bookings/:id/payment`) | Create/reuse Razorpay order using persisted advance; return public key/order/amount. | `payments.routes.ts` → Clean Fare `PaymentsService.getPaymentOrder()` | `cleanFareApi.ts:createBookingPayment()`; `CleanBookingPage.tsx` and `BookingConfirmationPage.tsx`. |
| `POST /api/v1/bookings/:id/verify-payment` (also `/bookings/:id/verify-payment`) | Receive Razorpay payment/order/signature and update payment/booking. | `payments.routes.ts` → Clean Fare `PaymentsService.verifyPayment()` | `cleanFareApi.ts:verifyBookingPayment()`; `CleanBookingPage.tsx`. |
| `POST /api/v1/webhooks/razorpay` (also `/webhooks/razorpay`, `/api/v1/webhooks/payment`, `/webhooks/payment`) | Signed provider events for Clean Fare flow. | `payments.routes.ts` → Clean Fare `PaymentsService.handleWebhook()` | Razorpay provider only. |
| `POST /api/v1/payments/create-checkout` | New provider-adapter checkout with ownership proof. | `payment.routes.ts` → generic `payment.service.ts` | `customerAuthApi.ts:createOwnerPaymentCheckout()`; `PaymentResumePage.tsx`. |
| `GET /api/v1/payments/:paymentId/status` | Protected reconciled payment status. | Same newer payment module. | `customerAuthApi.ts:getOwnerPaymentStatus()`; `PaymentResumePage.tsx`. |
| `POST /api/v1/payments/:paymentId/verify` | Server/provider verification of Checkout result. | Same newer payment module and Razorpay adapter. | `customerAuthApi.ts:verifyOwnerPayment()`; `PaymentResumePage.tsx`. |
| `POST /api/v1/payments/webhooks/:provider` (Razorpay literal) | Signed provider event for newer payment module. | `payment.routes.ts` → generic `payment.service.ts` | Provider only; distinct from `/api/v1/webhooks/razorpay`. |

### Admin booking/payment

| Method/path | Purpose | Backend handler | Admin UI use |
| --- | --- | --- | --- |
| `GET /api/v1/ops/admin/bookings` | Filter/list booking records. | `admin.routes.ts` → `admin.controller.ts:listBookings()` | `fetchAdminBookings()` in `admin/src/lib/api.ts`; `BookingsPage.tsx`, `DashboardPage.tsx`. |
| `POST /api/v1/ops/admin/bookings/:id/transition` | Role-gated state transition with expected version. | `admin.routes.ts` → controller → booking service transition. | `transitionAdminBooking()`; `BookingsPage.tsx`. |
| `POST /api/v1/ops/admin/bookings/:id/unmask` | Reveal customer contact for authorized dispatch role. | Admin controller/service. | `unmaskAdminBooking()`; `BookingsPage.tsx`. |
| `GET /api/v1/ops/admin/bookings/:id/unmask` | Alias for unmask operation. | Same controller. | No GET caller found; admin UI uses POST. |
| `GET /api/v1/ops/admin/payments` | List payment rows and totals. | Admin controller → `admin.service.ts:listPayments()` → generic repository. | `fetchAdminPayments()`; `FinancePage.tsx`, `DashboardPage.tsx`. |
| `POST /api/v1/ops/admin/refunds` | Request provider refund with reason/idempotency key; requires admin role. | Admin controller → newer `payment.service.ts:refund()`. | `refundAdminBooking()`; `FinancePage.tsx`. |
| `GET /api/v1/ops/admin/audit-logs` | Recent operations audit log. | Admin controller/service. | `fetchAdminAuditLogs()`; `DashboardPage.tsx`. |

There is no route in the inspected admin route list that directly marks a payment captured/paid. Payment capture is supposed to be established by provider verification/webhook; admin booking transitions are separate.

## 6. Other findings from source review

### Positive controls present

- Clean Fare customer booking amount is calculated server-side and payment order derives from persisted `advance_amount`.

- Razorpay order request uses INR and paise and includes booking/ticket notes.

- Newer adapter validates order response amount/currency; its verification path calls provider API and checks captured state, amount, currency and order association.

- Newer generic payment service uses booking ownership proof, timing-safe guest-token comparison, signed webhook verification with preserved raw body, event deduplication, transaction-based updates and `needs_review` for mismatch.

- Admin endpoints use server-side role checks and have endpoint-specific limits.

These controls do not imply the immediate customer checkout is using the newer adapter.

### Further test/operations coverage needed

1. Regression test authenticated and anonymous booking POSTs to assert JSON content type and object body.

1. Full staging transaction on the immediate customer path and authenticated resume path independently.

1. Wrong signature, non-captured state, order/payment mismatch, amount/currency mismatch, duplicate/concurrent events, late events, and provider outage tests.

1. Concurrent checkout requests and remote-order orphan recovery.

1. Confirm active Razorpay webhook URLs match each deployed path and correct secret without printing secrets.

1. Confirm live migration ledger includes compatible payment/refund/webhook tables; validate before testing admin refund.

1. Refund failure after external success, partial/full refunds, provider retries, refund webhooks, DB rollback and idempotent reattempt behavior.

1. Durable notification retry, dedupe, dead-letter/admin visibility for email and WhatsApp.

1. Ownership tests for booking detail, payment order creation, payment verification/status, and admin finance endpoints.

1. Rate-limit behavior behind the real reverse proxy, request IP extraction and provider retry behavior.

1. Backend/frontend typecheck, unit/contract/integration tests, builds and security scans in an environment with dependencies installed.

## 7. Recommended remediation order (not applied)

1. Preserve/merge `Content-Type: application/json` in `apiRequest()` and add the regression test.

1. Select one customer payment API contract and one state model; migrate customer checkout, resume, admin and webhooks to that canonical path before retiring duplicate code.

1. Fail production startup if required payment/webhook secrets are absent; remove literal fallback secrets.

1. Make payment capture contingent on server-authoritative provider status and exact order/payment/booking/amount/currency match; require ownership proof on customer routes.

1. Align migrations and repositories. Recreate/verify the refund and webhook persistence schema before allowing the admin refund endpoint; make external provider calls resilient to database persistence failure.

1. Add durable webhook/notification state machines, retries, reconciliation and alerting.

1. Execute the full staging scenarios above before any live readiness declaration.

## 8. Boundaries of this report

This is a source-code review of the specified commit. It does not verify the running service, active API deployment, customer-site bundle version, real Razorpay mode, environment secret values, Razorpay dashboard event settings, live database schema, current admin UI behavior, or outbound email/WhatsApp provider delivery. The attached document’s date is 2025-04-05 and its route conclusions are not used as current facts unless independently supported by the inspected source.