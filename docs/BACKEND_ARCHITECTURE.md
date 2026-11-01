# Backend Architecture Documentation — SK Baghel Tour & Travels

**Document Version:** 3.0.0  
**Status:** Production Fastify 5 Architecture  
**Last Updated:** 2026-11-01

---

## 1. Executive Summary

The SK Baghel Tour & Travels backend is built with **Fastify 5.6.0** on **Node.js 22 LTS**, using **Supabase PostgreSQL** via `pg.Pool` for persistence, **Zod** for contract validation, and an **L1 In-Memory Cache** for sub-millisecond quote and catalog performance.

### Key Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Server-Authoritative 5-Step Fares** | Client never determines prices; all fare math runs in pure functions on the server. |
| **Standardized Integer Money** | Business tables store whole INR Rupees (`INT`). Gateway tables (`payments`, `refunds`) store integer Paise (`BIGINT`). |
| **L1 In-Memory Speed Layer** | Catalog, fleet, and fare settings are cached in memory (`TTL = 300s`) and invalidated instantly on Admin writes. |
| **Non-Blocking Webhooks (<40ms)** | Payment webhooks commit DB state and enqueue notification jobs; PDF generation and emails run asynchronously. |
| **No Driver Assignment** | Bookings transition from `paid_confirmed` → `in_transit` → `completed` directly via Admin status updates. |
| **Two Staff Roles Only** | RBAC enforces `super_admin` (full access) and `developer` (content, catalog, fleet, media, SEO, publishing). |

---

## 2. Fastify Server Lifecycle & Background Workers (`server.ts`)

The server entry point initializes:
1. **Environment Validation (`config/env.ts`)**: Fails fast at startup if any required variable is missing.
2. **Database Pool (`db/poolConfig.ts`)**: `pg.Pool` with `keepAlive: true`, `max: 20`, `min: 2`, `statement_timeout: 5000`.
3. **L1 Cache Warmup (`shared/cache.ts`)**: Preloads published catalog, vehicle groups, models, and fare settings at startup.
4. **Three Non-Blocking Background Workers (`unref()` timers)**:
   - **Notification Worker (15s interval)**: Generates `@pdfme/generator` A4 PDF vouchers and sends Resend emails + WhatsApp messages for `queued` jobs in `notification_jobs`.
   - **Publication Worker (15s interval)**: Processes `pending` events in `publishing_outbox`, invalidates L1 cache, and triggers `PAGES_DEPLOY_HOOK_URL`.
   - **Booking Expiry Worker (60s interval)**: Auto-cancels bookings stuck in `pending_payment` beyond `PAYMENT_PENDING_EXPIRY_MINUTES` (30 minutes).

---

## 3. Middleware Chain (`app.ts`)

Registered in strict order:
1. **`@fastify/compress`**: Brotli and Gzip compression for responses > 1KB.
2. **`@fastify/cors`**: Restricted strictly to `CORS_ORIGINS`.
3. **`@fastify/helmet`**: CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
4. **`@fastify/rate-limit`**: Route-scoped rate limiting.
5. **`registerRequestId`**: Propagates or generates `X-Request-Id`.
6. **`registerRawBody`**: Preserves raw `Buffer` on `/api/v1/payments/webhooks/razorpay` for HMAC-SHA256 verification while blocking prototype pollution (`__proto__`, `constructor`).
7. **`registerNetworkHeaders`**: Injects security and cache-control headers.
8. **`authenticateRequest` (`authGuard.ts`)**: Verifies Supabase JWT via cached JWKS (or symmetric fallback) and extracts `app_metadata.role`.
9. **`registerErrorHandler`**: Formats `ZodError` (PII-sanitized `400`) and `AppError` into canonical JSON responses.

---

## 4. Role-Based Access Control (`middlewares/roleGuard.ts`)

```typescript
import type { FastifyRequest } from "fastify";
import { Errors } from "../shared/errors.js";
import { ADMIN_ROLES, type UserRole } from "../contracts/index.js";

export const SUPER_ADMIN_ONLY: readonly UserRole[] = ["super_admin"] as const;
export const CONTENT_AND_SEO_ROLES: readonly UserRole[] = ADMIN_ROLES; // ["super_admin", "developer"]

export function requireRole(request: FastifyRequest, allowedRoles: readonly UserRole[]): void {
  const user = request.user;
  if (!user) {
    throw Errors.unauthorized("Authentication is required.");
  }
  if (user.role === "super_admin") {
    return;
  }
  if (!allowedRoles.includes(user.role)) {
    throw Errors.forbidden("Insufficient role permissions for this endpoint.");
  }
}
```

---

## 5. Booking State Machine (`shared/stateMachine.ts`)

Because there is **no driver assignment**, the state machine enforces:

```typescript
import type { BookingStatus } from "../contracts/index.js";
import { AppError } from "./errors.js";

const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["paid_confirmed", "confirmed", "cancelled"],
  paid_confirmed: ["confirmed", "in_transit", "completed", "refunded", "cancelled"],
  confirmed: ["paid_confirmed", "in_transit", "completed", "refunded", "cancelled"],
  in_transit: ["completed", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      "INVALID_TRIP_TRANSITION",
      `Cannot transition booking from '${from}' to '${to}'.`,
      400,
      { from, to }
    );
  }
}
```

---

## 6. L1 In-Memory Cache Architecture (`shared/cache.ts`)

To avoid hitting PostgreSQL on every customer quote or catalog load:

```typescript
export class L1MemoryCache<T> {
  private entry: { value: T; expiresAt: number; version: number } | null = null;
  private versionCounter = 1;

  constructor(private readonly ttlMs: number = 300_000) {}

  async getOrLoad(loader: () => Promise<T>): Promise<{ data: T; version: number }> {
    const now = Date.now();
    if (this.entry && this.entry.expiresAt > now) {
      return { data: this.entry.value, version: this.entry.version };
    }
    const value = await loader();
    this.versionCounter += 1;
    this.entry = { value, expiresAt: now + this.ttlMs, version: this.versionCounter };
    return { data: value, version: this.versionCounter };
  }

  invalidate(): void {
    this.entry = null;
    this.versionCounter += 1;
  }
}
```

- **Read Path:** `GET /api/v1/catalog` and `POST /api/v1/quotes/options` read from `catalogMemoryCache.getOrLoad(...)`.
- **Write Invalidation:** Every Admin `POST`, `PATCH`, `PUT`, or `DELETE` on routes, packages, transfers, vehicles, fare rules, or settings calls `catalogMemoryCache.invalidate()` immediately after the DB transaction commits.

---

## 7. Pure 5-Step Fare Engine (`modules/fare-engine/`)

All monetary values are calculated in **whole integer INR Rupees (`Math.round`)**:
1. **Base Fare (`base_fare`)**: Fixed route/package/transfer amount OR `billable_km * rate_per_km` (with `1.85x` same-day round-trip multiplier, `300 km/day` multi-day floor, and `<300 km` forced round-trip for `tempo_traveller` group).
2. **Trip Allowances (`driver_allowance` + `halt_charge`)**: Multi-day driver allowance (`days * driver_allowance_per_day`) + multi-day round-trip night halt (`(days - 1) * round_trip_halt_per_night`).
3. **Tolls & State Taxes (`toll_charge`)**: `0` when `toll_included = true`, else `toll_amount_inr + sum(interstate_charges)`.
4. **GST (`gst_tax`)**: `round(taxable_subtotal * (gst_percent / 100))` (18% default).
5. **28% Advance & 72% Driver Balance**:
   - `advance = min(total, max(500, round((total * 0.28) / 100) * 100))`
   - `balance = total - advance` (Collected directly by driver on trip completion).
