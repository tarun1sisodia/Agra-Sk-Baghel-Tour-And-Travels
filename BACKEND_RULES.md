# Master Backend Operating Rules & Architectural Standard — Agra SK Baghel Tour & Travels

**Document Version:** 3.0.0 (Production Clean-Room Standard)
**Authority:** Single Source of Truth for all Backend Engineering, API Contracts, Database Models, Payment Flows, Performance Standards, and Integrations.
**Target Service:** `backend/` (Node.js 22 LTS, TypeScript, Fastify 5, Zod, Supabase PostgreSQL via `pg` pool, Razorpay, Resend, WhatsApp Cloud API).
**Applies To:** All AI agents, backend developers, and full-stack integrators.

---

## 1. Executive Summary & Purpose

This document is the **single authoritative operational rule** for the Agra SK Baghel Tour & Travels backend. It contains all core directives, architectural boundaries, API contracts, database schemas, security guardrails, and integration protocols.

### Core Philosophy

1. **Financial Truth is Absolute:** The server is the sole financial authority. The client never determines fares, advances, or payment states.
2. **Standardized Integer Money:**
   - All Catalog, Fare, Promo, and Booking amounts in PostgreSQL and APIs are **whole integer INR Rupees (`INTEGER`)**.
   - All Razorpay Gateway amounts in `payments` and `refunds` are **integer Indian Paise (`BIGINT`, `amount_paise = advance_amount * 100`)**.
   - Never use `FLOAT`, `REAL`, or `NUMERIC` for currency.
3. **One Database Owner per Domain:** All transactional and content data lives in Supabase PostgreSQL (accessed via `pg.Pool`). MongoDB and Redis are not used.
4. **Explicit Operational Scope (No Driver Assignment):**
   - Customer website + Admin panel only. No driver app, no driver GPS, no driver assignment step.
   - Customer pays a **28% Advance** online via Razorpay (`paid_confirmed`).
   - Customer pays the remaining **72% Balance** directly to the driver upon trip completion.
   - `super_admin` updates the trip status (`paid_confirmed` → `in_transit` → `completed`) directly in the Admin panel.
5. **Two Staff Roles Only (`user_role_enum`):**
   - `super_admin`: Full access to all platform modules (Bookings, Payments, Refunds, Catalog, Fares, Promos, Reviews, SEO, Publishing, Settings, Audit Logs).
   - `developer`: Access strictly limited to Content, Catalog (Routes, Tours, Local Packages, Transfers, Fleet, Monuments), Media Library, SEO Control Center, and Publishing.
   - `customer`: Public authenticated user (or guest via `x-guest-token`).

---

## 2. Document Registry & Precedence

| Priority | Document | Path | Scope |
|:---:|---|---|---|
| **1** | `BACKEND_RULES.md` | Root | **This file — supreme backend law** |
| **2** | `docs/PLATFORM_ARCHITECTURE.md` | `docs/` | Complete platform & contract specification |
| **3** | `docs/DATABASE_SCHEMA.md` | `docs/` | Authoritative PostgreSQL DDL & indexing |
| **4** | `docs/BACKEND_ARCHITECTURE.md` | `docs/` | Fastify internals, repositories, workers |
| **5** | `docs/PAYMENT_SYSTEM.md` | `docs/` | Razorpay zero-miss payment & webhook rules |
| **6** | `docs/RBAC.md` | `docs/` | `super_admin` vs `developer` permission matrix |

---

## 3. The 10 Golden Laws of the Backend

### Law 1: Single Database — Supabase PostgreSQL via `pg` Pool

- **Supabase PostgreSQL** (accessed via `pg.Pool` — NOT the Supabase JS SDK for data queries) is the **system of record** for all data.
- The Supabase JS client (`backend/src/config/supabase.ts`) is used **only** for Supabase Auth JWT verification and Storage uploads.
- Raw `pg` pool queries are used for all data read/write operations (`backend/src/db/postgres.ts`).
- MongoDB is not active in production scope. LocationIQ results are cached in the PostgreSQL `location_cache` table via the `locationCache` repository.

### Law 2: Server-Authoritative Fares (Zero Client Trust)

- The frontend may display a local fare estimate for UX, but the server **ignores** any client-submitted fare totals.
- The server always recalculates fares using the modular fare engine at `backend/src/modules/fare-engine/`.
- **Advance Deposit Formula:**
  ```
  advanceAmount = max(500, round(totalFare × 0.28 / 100) × 100)
  ```
- Night allowance applies for travel between 22:00–05:00 (vehicle-tier specific rate).
- Outstation/multi-day: 300 km/day minimum charge enforced.
- Fare rule version is stored in `FARE_RULES_VERSION` env var (default: `"2026-09-13"`) and stamped on every booking.

### Law 3: Provider-Verified Payment Confirmation (Razorpay Only)

- Razorpay is the **only** active payment provider. No PayPal, no card processor.
- A browser redirect or client callback **never** marks a booking `paid_confirmed`.
- Only a verified Razorpay webhook HMAC event or server-side API verification marks a booking paid.
- Raw request body must be preserved by `rawBody.ts` middleware for HMAC verification.

### Law 4: Strict Idempotency & Replay Defense

- Every webhook, payment, refund, and booking transition carries an idempotency key.
- Webhook events are deduplicated via `webhooks.hasEvent(eventId)` before any processing.
- Duplicate webhook → return `HTTP 200 OK` immediately, no side effects.

### Law 5: Thin Controllers, Pure Domain Layer

- **Controllers** parse + validate (Zod), authenticate, delegate to Service, format response.
- **Services** contain business logic and call repositories.
- **Repositories** (`Repositories` interface in `db/types.ts`) contain all database I/O.
- **Fare engine** (`modules/fare-engine/`) is pure functions — zero I/O, zero framework deps.
- Controllers MUST NOT contain SQL, fare math, or payment secrets.

### Law 6: Repository Interface Contract

All database access goes through `Repositories` (defined in `backend/src/db/types.ts`). There are two implementations:
- `createPostgresRepositories()` → `backend/src/db/postgres.ts` (production)
- `createMemoryRepositories()` → `backend/src/db/memory.ts` (tests/dev)

Pass `Repositories` via dependency injection from `app.ts`. Never import `postgres.ts` directly in modules.

### Law 7: Privacy by Design (DPDP Act 2023)

- Public responses mask customer phone (`+91 98**** **21`) and email (`s****@gmail.com`).
- Unmasked data only for authenticated admins or verified booking owners.
- Driver contact visible only to verified customer + admin.
- Zero secrets, tokens, or credentials in logs (Pino redaction configured).

### Law 8: Explicit Booking State Machine (No Driver Assignment)

```
draft → pending_payment → paid_confirmed → in_transit → completed
                        ↘ cancelled
paid_confirmed / in_transit → cancelled | refunded
```

- `paid_confirmed` = 28% advance verified; 72% balance payable to driver upon completion.
- `in_transit` = `super_admin` marks trip active in Admin panel.
- `completed` = `super_admin` marks trip completed and records `balance_collected_by_driver = true`.
- Invalid transitions throw `AppError("INVALID_TRIP_TRANSITION", ..., 400)`.

### Law 9: Publication Outbox Worker for Content Deploys

- When `super_admin` or `developer` publishes content (routes, packages, transfers, monuments, SEO), an event is written to `publishing_outbox`.
- `PublicationWorker` (`modules/publishing/publication-worker.ts`) invalidates the Fastify in-memory catalog cache and fires `PAGES_DEPLOY_HOOK_URL` to trigger a Cloudflare Pages rebuild.

### Law 10: Disciplined Vertical Slice Implementation

```
Zod Schema → Pure Engine Rules → Service → Repository → Controller → Routes
```

Always verify: happy path, invalid inputs, unauthorized calls, duplicate submissions, provider outages.

---

## 4. Repository & Directory Architecture

```
backend/
├── src/
│   ├── app.ts                    # Fastify factory — registers all modules & middleware
│   ├── server.ts                 # Process startup, graceful shutdown, port binding
│   ├── config/
│   │   ├── env.ts                # Zod-validated env (fails fast at startup)
│   │   ├── supabase.ts           # Supabase JS client (Auth + Storage only)
│   │   └── logger.ts             # Pino structured logger with secret redaction
│   ├── db/
│   │   ├── types.ts              # Repositories interface (single DB contract)
│   │   ├── postgres.ts           # Production pg.Pool implementation (~2600 lines)
│   │   ├── memory.ts             # In-memory implementation for tests (~1600 lines)
│   │   ├── migrate.ts            # Migration runner
│   │   ├── poolConfig.ts         # pg.Pool configuration
│   │   ├── dossier-types.ts      # Content domain TypeScript types
│   │   ├── dossier-seeds.ts      # Seed data for content tables
│   │   ├── route-catalog-types.ts
│   │   ├── seedData.ts
│   │   └── concurrency.ts
│   ├── middlewares/
│   │   ├── authGuard.ts          # Supabase JWT verification → req.user
│   │   ├── rawBody.ts            # Preserves raw Buffer for Razorpay HMAC
│   │   ├── requestId.ts          # Injects X-Request-Id
│   │   ├── networkHeaders.ts     # Security headers
│   │   └── errorHandler.ts       # Canonical error formatter
│   ├── modules/                  # 26 feature domain modules
│   │   ├── fare-engine/          # Pure modular fare calculator
│   │   │   ├── calculators/      # Per-trip-type calculation logic
│   │   │   ├── datetime.ts       # Night allowance detection
│   │   │   ├── extra-charges.ts  # Driver allowance, tolls
│   │   │   ├── finalizer.ts      # Advance/balance split
│   │   │   ├── rounding.ts       # ₹50 rounding
│   │   │   └── index.ts
│   │   ├── fares/                # HTTP wrapper (fare.controller, fare.service, fare.routes)
│   │   ├── fare-catalog/         # Admin-editable per-km fare rates in DB
│   │   ├── bookings/             # Booking draft creation & voucher retrieval
│   │   ├── booking-intents/      # Pre-booking intent capture
│   │   ├── payments/             # Razorpay checkout creation & webhook handler
│   │   ├── quotes/               # Quote generation
│   │   ├── reviews/              # Customer review submission & moderation
│   │   ├── inquiries/            # Lead capture for custom tours
│   │   ├── rental-enquiries/     # Self-drive/rental enquiry flow
│   │   ├── locations/            # LocationIQ proxy with PostgreSQL cache
│   │   ├── routes/               # Outstation route catalog (admin + public)
│   │   ├── transfer-routes/      # Airport/station transfer catalog
│   │   ├── tour-packages/        # Multi-day tour packages
│   │   ├── local-packages/       # Local sightseeing packages
│   │   ├── catalog/              # Generic CMS catalog items
│   │   ├── monuments/            # Monument content
│   │   ├── cancellation-policies/
│   │   ├── pet-policy/
│   │   ├── company-profile/      # Brand/contact info (admin-editable)
│   │   ├── dossier-signoffs/     # Client approval tracking
│   │   ├── promos/               # Promo code management
│   │   ├── content/              # Content manifest endpoint
│   │   ├── notifications/        # Resend email + WhatsApp Cloud API
│   │   ├── publishing/           # PublicationWorker — Cloudflare Pages deploy hook
│   │   └── admin/                # Admin CRUD, role enforcement, fare admin
│   ├── providers/
│   │   ├── PaymentProvider.ts    # Payment provider interface
│   │   ├── GeocodingProvider.ts  # LocationIQ provider (with static fallback)
│   │   ├── MessagingProvider.ts  # Resend + WhatsApp adapters + noop stubs
│   │   └── adapters/
│   │       └── razorpay.ts       # Razorpay SDK adapter
│   ├── shared/
│   │   ├── clock.ts              # Mockable system clock
│   │   ├── ids.ts                # Ticket ID generation (AGR-YYYYMMDD-XXXX)
│   │   ├── errors.ts             # AppError class + error catalog
│   │   └── privacy.ts            # Phone/email masking utilities
│   ├── contracts/                # Shared Zod schemas with frontend contracts/
│   └── types/
│       └── domain.ts             # Core domain TypeScript types
├── tests/
│   ├── unit/                     # Pure logic tests (zero I/O)
│   └── integration/              # Supertest + in-memory DB tests
├── migrations/                   # Versioned PostgreSQL DDL files
├── .env.example
└── package.json
```

---

## 5. Environment Variables

All vars validated by Zod at startup in `backend/src/config/env.ts`. Missing required vars cause a hard crash.

```bash
# Server
NODE_ENV=development|staging|production
PORT=4000
API_BASE_URL=http://localhost:4000
LOG_LEVEL=info
FARE_RULES_VERSION=2026-09-13

# CORS (comma-separated origin list)
CORS_ORIGINS=http://localhost:5173,https://agraskbagheltourandtravels.com,...

# Customer site URL (used in email links, review links)
CUSTOMER_SITE_URL=https://agraskbagheltourandtravels.com

# Auth
CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS=false   # true = login required for bookings
ALLOW_TEST_AUTH=true                             # auto-true in dev/test

# Supabase (PostgreSQL + Auth + Storage)
DATABASE_URL=postgresql://...                    # Direct pg connection string
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...                    # Admin operations
SUPABASE_JWT_SECRET=...                          # JWT verification
CATALOG_MEDIA_BUCKET=documents                   # Supabase Storage bucket

# S3-compatible storage (Supabase Storage S3 endpoint)
S3_ENDPOINT=https://xxx.supabase.co/storage/v1/s3
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

# Razorpay (sole payment provider)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# LocationIQ
LOCATIONIQ_TOKEN=...

# Notifications
RESEND_API_KEY=re_...
EMAIL_FROM=bookings@agraskbagheltourandtravels.com
ADMIN_EMAIL=admin@agraskbagheltourandtravels.com
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_TEMPLATE_PAYMENT=skb_payment_confirmed

# Publishing
PAGES_DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...
PAYMENT_PENDING_EXPIRY_MINUTES=30
```

---

## 6. Domain Data Types

The canonical domain types live in `backend/src/types/domain.ts` and `backend/src/db/dossier-types.ts`. Key types:

### Booking Status Enum
```typescript
type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid_confirmed'
  | 'in_transit'
  | 'completed'
  | 'cancelled'
  | 'refunded';
```

### Vehicle Groups (Canonical)
The canonical fleet groups used throughout the system (in `CanonicalVehicleGroup` type):
- `sedan` — Dzire/Etios (4 seats)
- `ertiga` — Ertiga/XL6 (6 seats)
- `innova-crysta` — Innova Crysta (7 seats)
- `tempo-traveller` — Force Traveller (12–16 seats)
- `urbania` — Force Urbania (17–19 seats)

### Content Status Enum (for catalog content)
```typescript
type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
```

### Ticket ID Format
```
AGR-YYYYMMDD-XXXX   (e.g., AGR-20261020-3847)
```
Generated by `backend/src/shared/ids.ts`.

---

## 7. API Route Overview

Base URL: `/api/v1`

All responses conform to:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; requestId: string; details?: any[] };
}
```

### Public Routes (no auth)

| Method | Path | Rate Limit | Description |
|---|---|---|---|
| `GET` | `/health` | None | Liveness probe |
| `GET` | `/ready` | None | Readiness probe (DB check) |
| `POST` | `/api/v1/fares/calculate` | 60/min | Server fare calculation |
| `GET` | `/api/v1/locations/autocomplete` | 60/min | LocationIQ proxy + PostgreSQL cache |
| `POST` | `/api/v1/bookings/draft` | 30/min | Create booking draft |
| `GET` | `/api/v1/bookings/:ticketId` | 60/min | Masked booking voucher |
| `POST` | `/api/v1/payments/create-order` | 20/min | Create Razorpay order for advance |
| `POST` | `/api/v1/payments/webhook` | Signature only | Razorpay webhook receiver |
| `POST` | `/api/v1/inquiries` | 5/min | Custom tour inquiry |
| `POST` | `/api/v1/rental-enquiries` | 5/min | Rental/self-drive enquiry |
| `POST` | `/api/v1/reviews` | 10/min | Submit review for moderation |
| `GET` | `/api/v1/content/manifest` | 60/min | Published content manifest (SSG) |
| `GET` | `/api/v1/routes` | 60/min | Published outstation routes |
| `GET` | `/api/v1/routes/:slug` | 60/min | Single route detail |
| `GET` | `/api/v1/tour-packages` | 60/min | Published tour packages |
| `GET` | `/api/v1/tour-packages/:slug` | 60/min | Single tour package |
| `GET` | `/api/v1/local-packages` | 60/min | Published local packages |
| `GET` | `/api/v1/transfer-routes` | 60/min | Published transfer routes |
| `GET` | `/api/v1/monuments` | 60/min | Monuments list |
| `GET` | `/api/v1/cancellation-policies` | 60/min | Active cancellation policies |
| `GET` | `/api/v1/company-profile` | 60/min | Brand contact info |
| `GET` | `/api/v1/promos/featured` | 60/min | Active featured promo |
| `GET` | `/api/v1/fare-catalog` | 60/min | Published fare catalog (per-km rates) |

### Admin Routes (`/api/v1/admin/` — require Admin JWT)

| Method | Path | Description |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/admin/routes` | Outstation route CRUD |
| `GET/POST/PATCH/DELETE` | `/admin/tour-packages` | Tour package CRUD |
| `GET/POST/PATCH/DELETE` | `/admin/local-packages` | Local package CRUD |
| `GET/POST/PATCH/DELETE` | `/admin/transfer-routes` | Transfer route CRUD |
| `GET/PATCH` | `/admin/monuments` | Monument management |
| `GET/PATCH` | `/admin/cancellation-policies` | Policy management |
| `GET/PATCH` | `/admin/pet-policy` | Pet taxi policy |
| `GET/PATCH` | `/admin/company-profile` | Company info |
| `GET/PATCH` | `/admin/dossier-signoffs` | Client approval tracking |
| `GET/POST/PATCH/DELETE` | `/admin/promos` | Promo code management |
| `GET` | `/admin/bookings` | Paginated bookings list |
| `PATCH` | `/admin/bookings/:id/status` | Update trip status (super_admin only) |
| `POST` | `/admin/refunds` | Initiate Razorpay refund |
| `GET` | `/admin/reviews` | Reviews queue |
| `POST` | `/admin/reviews/:id/approve` | Approve review |
| `POST` | `/admin/reviews/:id/reject` | Reject review |
| `POST` | `/admin/reviews/:id/publish` | Publish approved review |
| `GET/POST/PATCH/DELETE` | `/admin/fare-catalog` | Fare rate admin |
| `GET` | `/admin/inquiries` | Inquiry management |
| `GET` | `/admin/rental-enquiries` | Rental enquiry management |
| `GET` | `/admin/audit-logs` | Audit log viewer |
| `POST` | `/admin/catalog/:id/media` | Attach media to catalog item |
| `POST` | `/admin/publish` | Trigger Cloudflare Pages deploy |

---

## 8. Fare Engine Architecture

The fare engine lives in `backend/src/modules/fare-engine/` and is a set of **pure functions** (zero I/O):

```
fare-engine/
├── index.ts                  # Public API: calculateFare(input) → FareResult
├── calculators/              # Per-trip-type strategy functions
├── datetime.ts               # Night window detection (22:00–05:00)
├── extra-charges.ts          # Driver allowance, state tolls, hill charges
├── finalizer.ts              # Compute advance (28%) and balance (72%)
└── rounding.ts               # Round to nearest ₹50
```

The `fares` module (`modules/fares/`) wraps the engine: calls `fare-catalog` repository to get admin-configured per-km rates, then calls `fare-engine/index.ts`.

---

## 9. Payment Flow (Razorpay)

```
Customer fills form
       ↓
POST /api/v1/bookings/draft       → Server recalculates fare + advance; creates booking
       ↓
POST /api/v1/payments/create-order → Creates Razorpay order (amount = advance_amount_paise)
       ↓
Frontend opens Razorpay checkout
       ↓
Razorpay fires webhook → POST /api/v1/payments/webhook
  1. Preserve raw body (rawBody middleware)
  2. Verify HMAC: sha256(rawBody, RAZORPAY_WEBHOOK_SECRET)
  3. Idempotency check: webhooks.hasEvent(event.id)
  4. Verify payment amount matches bookings.advance_amount × 100
  5. DB transaction:
     - payments.update(status = 'captured', razorpay_payment_id, verified_at)
     - bookings.update(status = 'paid_confirmed')
  6. Enqueue notification jobs (email PDF + WhatsApp)
       ↓
Customer browser polls GET /api/v1/bookings/:ticketId until paid_confirmed
       ↓
super_admin updates trip status in Admin panel → paid_confirmed → in_transit → completed
```

### Webhook Verification
```typescript
import crypto from "crypto";

export function verifyRazorpayWebhook(
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret || !rawBody) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8")
  );
}
```

---

## 10. Notifications Architecture

`backend/src/modules/notifications/notification.service.ts` wraps two providers:

1. **Resend** (`providers/MessagingProvider.ts` → `createResendEmailProvider`) — Transactional email with PDF booking voucher attachment.
2. **WhatsApp Cloud API** (`createWhatsAppProvider`) — Booking confirmation message using template `skb_payment_confirmed`.

Notifications are enqueued as jobs in `notifications` repository table and processed asynchronously. Noop stubs (`createNoopEmail`, `createNoopMessaging`) are used when API keys are absent.

---

## 11. Content Publishing Pipeline

When admin publishes any content entity:
1. Admin calls publish endpoint → backend enqueues a `PublishEventRecord` in `publish_events` table.
2. `PublicationWorker` (`modules/publishing/publication-worker.ts`) polls the queue and fires `PAGES_DEPLOY_HOOK_URL`.
3. Cloudflare Pages triggers a new SSG build of `react/` which pulls fresh content from the backend.

---

## 12. High-Performance Backend Engineering Standards

This section defines non-negotiable performance guardrails for all backend services.

### 12.1 L1 In-Memory Catalog/Fare Cache

- **Catalog Cache**: `backend/src/modules/catalog/catalog.service.ts` caches published catalog in Fastify server instance memory.
- **Fare Cache**: `backend/src/modules/fare-catalog/fare-catalog.service.ts` caches active fare rules in memory.
- **Invalidation**: Both caches are cleared on `publishing_outbox` event via `PublicationWorker`.
- **Never serve stale data**: Cache TTL = 0 (on-demand refresh only).

### 12.2 Non-Blocking Razorpay Webhooks

- **Webhook handler** (`backend/src/modules/payments/webhook.controller.ts`) MUST NOT block on external calls.
- **Async notification enqueue**: Email/WhatsApp notifications enqueued via `notifications` repository; processed by `NotificationWorker`.
- **Idempotency first**: `webhooks.hasEvent(eventId)` checked BEFORE any state change.

### 12.3 Single-Roundtrip SQL

- **No N+1 queries**: All related data fetched in one query via `JOIN` or `array_agg`.
- **Repository methods** (`backend/src/db/postgres.ts`) never call other repository methods.
- **Batch operations**: `bookings.list()` returns all required fields in one query.

### 12.4 Cloudflare Edge Caching

- **Static assets**: `react/dist/` served via Cloudflare Pages with 1-year cache.
- **Content manifest**: `/api/v1/content/manifest` cached at edge for 60 seconds.
- **SSG rebuild**: `PublicationWorker` fires `PAGES_DEPLOY_HOOK_URL` on every content publish.

---

## 13. Key Implementation Rules for Agents

1. **Never import `postgres.ts` directly in modules** — always receive `Repositories` via DI from `app.ts`.
2. **Never add new env vars** without adding them to `backend/src/config/env.ts` Zod schema first.
3. **Never add a new module** without registering it in `backend/src/app.ts`.
4. **Never write raw SQL** outside `backend/src/db/postgres.ts`.
5. **Never hardcode fares or vehicle prices** — all rates must come from the `fare-catalog` repository (admin-configurable).
6. **Test with memory.ts** — the memory implementation must be updated to match any new repository interface method added to `db/types.ts`.
7. **Review sharing links** use `CUSTOMER_SITE_URL` env var — currently `https://skbagheltravels-customer.coccoder999.workers.dev` for testing; will be `https://agraskbagheltourandtravels.com` for production.

---

## 14. Deployment

- **Platform:** Render (Node.js web service)
- **Build command:** `npm --prefix backend run build`
- **Start command:** `npm --prefix backend run start`
- **Config file:** `render.yaml` at repo root
- Full deployment spec: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## 11. Resilient UX: The 10 Mandatory States

**Authority:** [`contracts/ux-states.ts`](../contracts/ux-states.ts) — Canonical contract | [`docs/RESILIENT_UX_10_STATES_SPEC.md`](./RESILIENT_UX_10_STATES_SPEC.md) — Full specification

Every Agra SK Baghel Tour & Travels backend **MUST** support the 10 resilient UX states through API contracts and error handling.

### 11.1 Error Response Format

All API errors **MUST** return the `ActionableErrorEnvelope` structure:

```json
{
  "code": "PAYMENT_DECLINED",
  "title": "Payment Declined by Bank",
  "fault_owner": "bank_gateway",
  "explanation": "Your bank or UPI app declined the transaction. No money was deducted.",
  "how_to_fix": "Try another UPI ID, use a different card, or retry below.",
  "primary_action": "try_alternate_payment",
  "primary_action_label": "Try Another Payment Method",
  "field_fixes": [],
  "request_id": "req_12345"
}
```

### 11.2 Error Fault Classification

| Fault Owner | HTTP Status | Description | Recovery Action |
|-------------|-------------|-------------|-----------------|
| `user_input` | 400 | Validation / missing field | `fix_inline_fields` |
| `bank_gateway` | 402 | Bank declined / UPI timeout | `try_alternate_payment` |
| `network` | 503 | Service unavailable | `reload_page` |
| `auth_session` | 401 | Expired JWT / guest token | `reauthenticate_keep_draft` |
| `server` | 500 | Internal API / DB issue | `contact_whatsapp_desk` |

### 11.3 Recovery Action Labels

| Action | Label |
|--------|-------|
| `retry_payment_method` | "Retry Payment" |
| `try_alternate_payment` | "Try Another Payment Method" |
| `refresh_live_fare` | "Refresh Live Fare" |
| `reauthenticate_keep_draft` | "Sign In to Keep Draft" |
| `fix_inline_fields` | "Fix Field Errors" |
| `switch_to_lite_mode` | "Switch to Lite Mode" |
| `contact_whatsapp_desk` | "Contact WhatsApp Desk" |
| `reload_page` | "Reload Page" |

### 11.4 Field Fix Support

For validation errors, include `field_fixes` in the response:

```json
{
  "code": "VALIDATION_ERROR",
  "title": "Please Fix Field Errors",
  "fault_owner": "user_input",
  "explanation": "Some fields need correction before we can proceed.",
  "how_to_fix": "Please correct the fields marked below.",
  "primary_action": "fix_inline_fields",
  "primary_action_label": "Fix Field Errors",
  "field_fixes": [
    {
      "field": "email",
      "issue": "Invalid email format",
      "specific_fix": "Enter a valid email with a domain (e.g., user@gmail.com)"
    },
    {
      "field": "phone",
      "issue": "Invalid phone number",
      "specific_fix": "Enter a 10-digit Indian phone number (e.g., 9876543210)"
    }
  ]
}
```

### 11.5 Request ID

Every error response **MUST** include a `request_id` for debugging:

```typescript
import { randomUUID } from "node:crypto";

const requestId = randomUUID();
// Include in error response and logs
```

### 11.6 Implementation Requirements

- **Contract:** Import from `contracts/ux-states.ts` (never duplicate)
- **Error Handling:** Use `classifyErrorFault()` and `resolveRecoveryAction()`
- **Field Fixes:** Include `field_fixes` for validation errors
- **Logging:** Log `request_id` for traceability
- **Testing:** Backend tests for each error scenario

---

## References

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Hosting, build commands, env vars
- [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) — Razorpay zero-miss payment spec
- [`.agents/rules/PAYMENT_AGENT_RULES.md`](.agents/rules/PAYMENT_AGENT_RULES.md) — Financial security rules
- [`docs/backend/API.md`](docs/backend/API.md) — API contract reference
- [`docs/backend/ROUTE_AND_API_INVENTORY.md`](docs/backend/ROUTE_AND_API_INVENTORY.md) — Full route inventory
- [`FRONTEND_RULES.md`](FRONTEND_RULES.md) — Frontend architectural standard
- [`contracts/ux-states.ts`](../contracts/ux-states.ts) — Resilient UX contract
- [`docs/RESILIENT_UX_10_STATES_SPEC.md`](./RESILIENT_UX_10_STATES_SPEC.md) — Full 10-state specification
