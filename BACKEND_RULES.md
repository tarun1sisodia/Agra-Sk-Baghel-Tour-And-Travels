# Master Backend Operating Rules & Architectural Standard — SK Baghel Tour & Travels

**Document Version:** 2.0.0 (Updated for production codebase)  
**Authority:** Single Source of Truth for all Backend Engineering, API Contracts, Database Models, Payment Flows, and Integrations.  
**Target Service:** `backend/` (Node.js LTS, TypeScript, Fastify, Zod, Supabase PostgreSQL via `pg` pool, Razorpay, Resend, WhatsApp Cloud API).  
**Applies To:** All AI agents, backend developers, and full-stack integrators.

---

## 1. Executive Summary & Purpose

This document is the **single authoritative operational rule** for the SK Baghel Tour & Travels backend. It contains all core directives, architectural boundaries, API contracts, database schemas, security guardrails, and integration protocols.

### Core Philosophy

1. **Financial Truth is Absolute:** The server is the sole financial authority. The client never determines fares, advances, or payment states.
2. **One Database Owner per Domain:** All transactional and content data lives in Supabase PostgreSQL (accessed via `pg` pool). MongoDB is not used in production scope.
3. **Scope is Explicit:** Customer website + admin panel. No driver app, no driver GPS, no live tracking, no WebSocket telemetry.
4. **Repository Pattern:** All DB access goes through the `Repositories` interface (`backend/src/db/types.ts`). Dual implementations: `postgres.ts` (production) and `memory.ts` (tests/dev without DB).

---

## 2. Document Registry & Precedence

| Priority | Document | Path | Scope |
|:---:|---|---|---|
| **1** | `BACKEND_RULES.md` | Root | **This file — supreme law** |
| **2** | `docs/PAYMENT_SYSTEM.md` | `docs/` | Razorpay zero-miss payment rules |
| **3** | `.agents/rules/PAYMENT_AGENT_RULES.md` | `.agents/rules/` | Financial security guardrails |
| **4** | `docs/backend/API.md` | `docs/backend/` | Route inventory |
| **5** | `docs/backend/ROUTE_AND_API_INVENTORY.md` | `docs/backend/` | Detailed route contracts |

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

### Law 8: Explicit Booking State Machine

```
draft → pending_payment → paid_confirmed → driver_assigned → in_transit → completed
                        ↘ cancelled
paid_confirmed / driver_assigned → refunded
```

- `paid_confirmed` = advance verified. Driver not yet assigned.
- `driver_assigned` = admin-only, manual, post-payment.
- Invalid transitions → `INVALID_TRIP_TRANSITION` (HTTP 400).

### Law 9: Publication Worker for Content Deploys

- When admin publishes content (routes, packages, monuments), a Cloudflare Pages deploy hook is fired via `PublicationWorker` (`modules/publishing/publication-worker.ts`).
- Hook URL is `PAGES_DEPLOY_HOOK_URL` env var.
- This triggers SSG re-build on Cloudflare Pages to update the customer site.

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
  | 'driver_assigned'
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
| `PATCH` | `/admin/bookings/:id/assign` | Assign driver (manual) |
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
Admin manually assigns driver → PATCH /api/v1/admin/bookings/:id/assign
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

## 12. Key Implementation Rules for Agents

1. **Never import `postgres.ts` directly in modules** — always receive `Repositories` via DI from `app.ts`.
2. **Never add new env vars** without adding them to `backend/src/config/env.ts` Zod schema first.
3. **Never add a new module** without registering it in `backend/src/app.ts`.
4. **Never write raw SQL** outside `backend/src/db/postgres.ts`.
5. **Never hardcode fares or vehicle prices** — all rates must come from the `fare-catalog` repository (admin-configurable).
6. **Test with memory.ts** — the memory implementation must be updated to match any new repository interface method added to `db/types.ts`.
7. **Review sharing links** use `CUSTOMER_SITE_URL` env var — currently `https://skbagheltravels-customer.coccoder999.workers.dev` for testing; will be `https://agraskbagheltourandtravels.com` for production.

---

## 13. Deployment

- **Platform:** Render (Node.js web service)
- **Build command:** `npm --prefix backend run build`
- **Start command:** `npm --prefix backend run start`
- **Config file:** `render.yaml` at repo root
- Full deployment spec: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## References

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Hosting, build commands, env vars
- [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) — Razorpay zero-miss payment spec
- [`.agents/rules/PAYMENT_AGENT_RULES.md`](.agents/rules/PAYMENT_AGENT_RULES.md) — Financial security rules
- [`docs/backend/API.md`](docs/backend/API.md) — API contract reference
- [`docs/backend/ROUTE_AND_API_INVENTORY.md`](docs/backend/ROUTE_AND_API_INVENTORY.md) — Full route inventory
- [`FRONTEND_RULES.md`](FRONTEND_RULES.md) — Frontend architectural standard
