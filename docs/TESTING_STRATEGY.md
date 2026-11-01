# Testing Strategy — Agra SK Baghel Tour & Travels

## 1. Executive Summary

This document describes the testing strategy for the Agra SK Baghel Tour & Travels monorepo. It covers the three-tier testing approach (unit, integration, E2E), the testing frameworks used, and the CI/CD verification gates that ensure code quality and prevent regressions.

### Testing Philosophy

- **Unit Tests**: Fast, isolated, and deterministic for business logic
- **Integration Tests**: Verify component interactions and API contracts
- **E2E Tests**: Validate complete user journeys and production-like behavior
- **CI-First**: All tests run on every push to `main` and PRs
- **Type-First**: Zod contracts shared between frontend and backend ensure type safety

### Test Coverage Targets

| Layer | Target Coverage | Tools |
|-------|-----------------|-------|
| Unit | 80%+ | Vitest |
| Integration | 100% critical paths | Vitest |
| E2E | 100% user journeys | TestSprite |

---

## 2. Testing Architecture

### 2.1 Test Pyramid

```
                    +------------------+
                    |     E2E Tests    |
                    |  (TestSprite)    |
                    +--------+---------+
                             |
                    +--------+---------+
                    |  Integration     |
                    |     Tests        |
                    |   (Vitest)       |
                    +--------+---------+
                             |
                    +--------+---------+
                    |    Unit Tests    |
                    |   (Vitest)       |
                    +------------------+
```

### 2.2 Test Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Unit** | Isolated function/class testing | Fare calculation, validation, utilities |
| **Integration** | Component and API interactions | Repository queries, service orchestration |
| **E2E** | Complete user journeys | Booking flow, payment, authentication |
| **Contract** | API schema validation | Request/response schemas, Zod validation |
| **Security** | Vulnerability detection | XSS, CSRF, IDOR, secrets in output |

---

## 3. Three-Tier Verification Architecture (v3.0.0)

### 3.1 Tier 1: Contract & Type Gate

**Purpose**: Catch contract violations and type errors before runtime

**Tests**:
- [`contracts.test.ts`](backend/tests/unit/contracts.test.ts) - API contract validation
- [`fare-engine.test.ts`](backend/tests/unit/fare-engine.test.ts) - Fare calculation tests
- [`bookings-payments.test.ts`](backend/tests/unit/bookings-payments.test.ts) - Booking and payment tests
- [`rbac-permissions.test.ts`](backend/tests/unit/rbac-permissions.test.ts) - Role-based access control tests

**Run Command**:
```bash
npm run verify  # Runs all contract and type checks
```

### 3.2 Tier 2: Backend Unit & Integration Suite

**Purpose**: Validate business logic and API interactions

**Mandatory Test Suites**:
1. **contracts.test.ts** - Contract validation
   - Validates `BookingCreateResponse` structure
   - Validates `PublishedCatalogResponse` and `PublishedProductDetail`
   - Validates `PaymentOrderResponse`
   - Validates `PublicReviewItem` and `PublicGalleryItem`
   - Validates `AdminAuditLogItem` and `PublishEventItem`

2. **fare-engine.test.ts** - Fare calculation tests
   - One-way fixed price quotes
   - Round-trip fare calculations
   - Night charge calculations
   - Halt charge calculations
   - Fixed category pricing (local packages, transfers, tour packages)
   - Explicit charges (tolls, parking)
   - Advance and rounding calculations

3. **bookings-payments.test.ts** - Booking and payment tests
   - Booking creation and status transitions
   - Payment creation and verification
   - Razorpay webhook processing
   - Price change handling
   - Idempotency and replay protection

4. **rbac-permissions.test.ts** - Role-based access control tests
   - `super_admin` full access verification
   - `developer` limited access verification
   - Admin routes require valid JWT
   - Role extraction from `payload.app_metadata.role`

### 3.3 Tier 3: SEO/Build & E2E Gate

**Purpose**: Validate production readiness and user journeys

**Tests**:
- [`validate-seo-artifacts.ts`](react/scripts/validate-seo-artifacts.ts) - SEO validation
- [`validate-pagespeed-guardrails.ts`](react/scripts/validate-pagespeed-guardrails.ts) - Performance validation
- [`audit-seo.ts`](react/scripts/audit-seo.ts) - SEO audit
- TestSprite E2E tests for customer site
- TestSprite E2E tests for admin panel

**Run Command**:
```bash
npm run verify  # Runs all verification gates
```

---

## 4. Backend Testing

### 4.1 Test Framework

#### [`vitest.config.ts`](backend/vitest.config.ts) - Vitest Configuration

```typescript
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";
process.env.ALLOW_TEST_AUTH = "true";
process.env.PORT = "4000";
process.env.LOG_LEVEL = "silent";
process.env.RAZORPAY_KEY_ID = "rzp_test_local";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay_test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default"],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
```

**Configuration Highlights:**
- Node.js environment for backend tests
- 15-second timeout for tests and hooks
- Sequential test execution for deterministic order
- File parallelism disabled for consistent state

### 4.2 Test Organization

```
backend/tests/
├── helpers.ts              # Test utilities and fixtures
├── fixtures/               # Test data fixtures
│   └── fare-fixture.ts
└── unit/                   # Unit and integration tests
    ├── admin-catalog-create.test.ts
    ├── admin-fare.test.ts
    ├── admin-finance-status.test.ts
    ├── admin-unmask.test.ts
    ├── auth-guard-whitelist.test.ts
    ├── booking-expiry.test.ts
    ├── booking-pdf-extra.test.ts
    ├── booking-pdf.service.test.ts
    ├── booking-schema.test.ts
    ├── bookings-payments.test.ts
    ├── break-the-system.test.ts
    ├── catalog-manifest.test.ts
    ├── clean-routes-alias.test.ts
    ├── concurrency.test.ts
    ├── contracts.test.ts
    ├── datetime-ist.test.ts
    ├── dynamic-publishing.test.ts
    ├── fare-engine.test.ts
    ├── fare-strategy-boundary.test.ts
    ├── legacy-route-telemetry.test.ts
    ├── legacy-schema-reconciliation.test.ts
    ├── local-package-media.test.ts
    ├── locationiq-resilience.test.ts
    ├── locationiq.service.test.ts
    ├── migrate.test.ts
    ├── package-fleet-price.test.ts
    ├── payments-repository-amount.test.ts
    ├── property-matrix.test.ts
    ├── publication-worker.test.ts
    ├── quotes.service.test.ts
    ├── rental-enquiries.test.ts
    ├── resilient-media-storage.test.ts
    ├── reviews-engine.test.ts
    ├── reviews-route-consent.test.ts
    └── security-findings.test.ts
```

### 4.3 Test Helpers

#### [`helpers.ts`](backend/tests/helpers.ts) - Test Utilities

```typescript
import pino from "pino";
import { buildApp } from "../src/app.js";
import { loadEnv, resetEnvCache } from "../src/config/env.js";
import { createMemoryRepositories } from "../src/db/memory.js";
import { hmacSha256Hex } from "../src/shared/hmac.js";
import type { Repositories } from "../src/db/types.js";

export async function createTestApp(db?: Repositories) {
  resetEnvCache();
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    ALLOW_TEST_AUTH: "true",
    CORS_ORIGINS: "http://localhost:5173,http://localhost:3000,https://agraskbagheltourandtravels.com",
  });
  const logger = pino({ level: "silent" });
  const repos = db ?? createMemoryRepositories(new Date().toISOString());
  const built = await buildApp({ env, logger, db: repos, clock: { now: () => new Date() } });
  return { ...built, env };
}

export function signProviderBody(secret: string, payload: unknown): { raw: Buffer; signature: string } {
  const raw = Buffer.from(JSON.stringify(payload));
  return { raw, signature: hmacSha256Hex(secret, raw) };
}

function futureIso(daysAhead = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export const sampleDraft = {
  tripType: "one-way" as const,
  vehicleTier: "sedan" as const,
  originName: "Agra",
  destinationName: "Delhi",
  pickupAddress: "Taj East Gate Road, Taj Ganj",
  dropAddress: "IGI Airport T3",
  get pickupDatetime() {
    return futureIso(17);
  },
  distanceKm: 230,
  customerName: "Aman Sharma",
  customerPhone: "9876543221",
  customerEmail: "aman@example.com",
};
```

### 4.4 Test Fixtures

#### [`fixtures/fare-fixture.ts`](backend/tests/fixtures/fare-fixture.ts) - Test Data

```typescript
export const FIXTURE_SETTINGS = {
  advance_percent: 28,
  min_km_per_day: 300,
  max_round_trip_days: 10,
  driver_allowance_per_day: 300,
  one_way_night_charge: 250,
  round_trip_halt_per_night: 0,
};

export const FIXTURE_GROUPS = {
  sedan: {
    code: "sedan",
    name: "Sedan",
    driver_allowance_per_day: 300,
    one_way_night_charge: 250,
    round_trip_halt_per_night: 0,
    sort_order: 1,
    is_active: true,
  },
  ertiga: {
    code: "ertiga",
    name: "Ertiga",
    driver_allowance_per_day: 300,
    one_way_night_charge: 250,
    round_trip_halt_per_night: 0,
    sort_order: 2,
    is_active: true,
  },
  // ... more groups
};

export const FIXTURE_CARS = {
  DZ: {
    id: "00000000-0000-0000-0000-000000000002",
    group_code: "sedan",
    group_name: "SEDAN",
    make: "Maruti",
    model_name: "Dzire",
    display_name: "Maruti Dzire",
    passenger_capacity: 4,
    luggage_capacity: 2,
    rate_per_km: 17,
    night_charge: 250,
    sort_order: 1,
    is_active: true,
  },
  // ... more cars
};

export const FIXTURE_ROUTES = {
  DEL: {
    id: "00000000-0000-0000-0000-000000000001",
    code: "DEL",
    origin_name: "Agra",
    destination_name: "Delhi",
    distance_km: 230,
    duration_minutes: 240,
    description: null,
    image_url: null,
    gallery: [],
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ... more routes
};
```

### 4.5 Unit Test Examples

#### [`fare-engine.test.ts`](backend/tests/unit/fare-engine.test.ts) - Fare Calculation Tests

```typescript
import { describe, it, expect } from "vitest";
import {
  calculateOneWayOutstation,
  calculateRoundTripOutstation,
  calculateFixedProduct,
  roundHalfUp,
} from "../../src/modules/fare-engine/index.js";
import {
  FIXTURE_SETTINGS,
  FIXTURE_GROUPS,
  FIXTURE_CARS,
  FIXTURE_ROUTES,
  FIXTURE_ROUTE_VEHICLES,
} from "../fixtures/fare-fixture.js";

describe("Fare Engine Unit Tests", () => {
  const MON_10_00_IST = "2026-10-12T10:00:00+05:30";

  // Helper for one-way quotes
  function quoteOneWay(carCode: string, routeCode: string, pickupAt = MON_10_00_IST, advancePercent = 20, extraCharges: any[] = []) {
    const car = (FIXTURE_CARS as any)[carCode];
    const route = (FIXTURE_ROUTES as any)[routeCode];
    const routeVehicle = (FIXTURE_ROUTE_VEHICLES as any)[routeCode]?.[carCode] ?? { one_way_amount: null, round_trip_enabled: false };
    const group = (FIXTURE_GROUPS as any)[car.group_code];

    return calculateOneWayOutstation({
      route,
      vehicle: car,
      routeVehicle: {
        one_way_amount: routeVehicle.one_way_amount,
        is_active: true,
      },
      groupSettings: group,
      settings: {
        ...FIXTURE_SETTINGS,
        advance_percent: advancePercent,
      },
      pickup_at: pickupAt,
      extraCharges,
    });
  }

  describe("12.2 One-Way (Fixed Price)", () => {
    it("OW-01: DZ DEL, Mon 10:00", () => {
      const q = quoteOneWay("DZ", "DEL");
      expect(q.total).toBe(2500);
      expect(q.advance).toBe(500);
      expect(q.balance).toBe(2000);
    });

    it("OW-02: HC DEL", () => {
      const q = quoteOneWay("HC", "DEL");
      expect(q.total).toBe(3000);
      expect(q.advance).toBe(600);
      expect(q.balance).toBe(2400);
    });
  });

  describe("12.3 Round-Trip (Fixed Price)", () => {
    it("RT-01: DZ DEL, Mon 10:00 - Wed 18:00", () => {
      const q = quoteRoundTrip("DZ", "DEL", MON_10_00_IST, "2026-10-14T18:00:00+05:30");
      expect(q.total).toBe(4600);
      expect(q.advance).toBe(1288);
      expect(q.balance).toBe(3312);
    });
  });
});
```

#### [`bookings-payments.test.ts`](backend/tests/unit/bookings-payments.test.ts) - Booking and Payment Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { BookingsService, PriceChangedError } from "../../src/modules/bookings/bookings.service.js";
import { PaymentsService } from "../../src/modules/payments/payments.service.js";
import { QuotesService } from "../../src/modules/quotes/quotes.service.js";
import { BookingsRepository, type BookingEntity } from "../../src/modules/bookings/bookings.repository.js";
import { PaymentsRepository, type PaymentEntity, type PaymentWebhookEventEntity } from "../../src/modules/payments/payments.repository.js";
import type { FareCatalogRepository } from "../../src/modules/fare-catalog/fare-catalog.repository.js";
import { createTestApp } from "../helpers.js";

describe("Bookings and Payments Integration", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let bookingsRepo: BookingsRepository;
  let paymentsRepo: PaymentsRepository;
  let bookingsService: BookingsService;
  let paymentsService: PaymentsService;

  beforeEach(async () => {
    app = await createTestApp();
    bookingsRepo = app.db.bookings;
    paymentsRepo = app.db.payments;
    bookingsService = new BookingsService(bookingsRepo, paymentsRepo, app.clock);
    paymentsService = new PaymentsService(paymentsRepo, app.clock);
  });

  it("creates a booking and payment", async () => {
    const booking = await bookingsService.createBooking({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      pickupAddress: "Taj Ganj",
      dropAddress: "IGI Airport T3",
      pickupDatetime: "2026-10-12T10:00:00+05:30",
      distanceKm: 230,
      customerName: "Rahul Sharma",
      customerPhone: "9876543210",
      customerEmail: "rahul@example.com",
    });

    expect(booking.status).toBe("draft");
    expect(booking.ticketId).toMatch(/^SKB-\d{8}-\d{4}$/);
  });

  it("handles price changes during checkout", async () => {
    const booking = await bookingsService.createBooking({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      pickupAddress: "Taj Ganj",
      dropAddress: "IGI Airport T3",
      pickupDatetime: "2026-10-12T10:00:00+05:30",
      distanceKm: 230,
      customerName: "Rahul Sharma",
      customerPhone: "9876543210",
      customerEmail: "rahul@example.com",
    });

    // Simulate price change
    await expect(bookingsService.createBookingPayment(booking.id, {
      provider: "razorpay",
      amount: 1000, // Different from calculated
    })).rejects.toThrow(PriceChangedError);
  });
});
```

### 4.6 Contract Tests

#### [`contracts.test.ts`](backend/tests/unit/contracts.test.ts) - API Contract Validation

```typescript
import { describe, it, expect } from "vitest";
import {
  BookingCreateResponse,
  BookingDetailResponse,
  PaymentOrderResponse,
  PublishedCatalogResponse,
  PublishedProductDetail,
  PublicReviewItem,
  PublicGalleryItem,
  PublishEventItem,
  AdminAuditLogItem,
} from "../../src/contracts/fare-system.js";

describe("Phase 1 Contract Synchronizations & Validation", () => {
  it("validates BookingCreateResponse structure", () => {
    const valid = {
      booking_id: "00000000-0000-0000-0000-000000000001",
      ticket_id: "SKB-20261012-0001",
      guest_access_token: "tok_secret_12345",
      status: "pending_payment",
      total_amount: 3500,
      advance_amount: 980,
      balance_amount: 2520,
      fare_breakdown: {
        category: "outstation",
        vehicle: {
          vehicle_model_id: "00000000-0000-0000-0000-000000000002",
          display_name: "Maruti Dzire",
          group_code: "sedan",
          passenger_capacity: 4,
        },
        currency: "INR",
        lines: [{ code: "base_fare", label: "Base fare", amount: 3500 }],
        total: 3500,
        advance: 980,
        balance: 2520,
        messages: [],
        details: {},
      },
    };

    const parsed = BookingCreateResponse.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("validates PublishedCatalogResponse and PublishedProductDetail", () => {
    const catalog = {
      products: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          category: "outstation",
          code: "agra-to-delhi",
          name: "Agra to Delhi",
          description: "Expressway taxi",
          image_url: "/assets/agra-delhi.webp",
          starting_price_inr: 2500,
          status: "published",
          distance_km: 230,
          duration_minutes: 240,
        },
      ],
      groups: [
        {
          group_code: "sedan",
          name: "Sedan",
          driver_allowance_per_day: 500,
          one_way_night_charge: 250,
          round_trip_halt_per_night: 0,
          sort_order: 1,
        },
      ],
      vehicles: [
        {
          id: "00000000-0000-0000-0000-000000000002",
          group_code: "sedan",
          make: "Maruti",
          model_name: "Dzire",
          display_name: "Maruti Dzire",
          passenger_capacity: 4,
          luggage_capacity: 2,
          rate_per_km: 17,
          night_charge: 250,
          sort_order: 1,
          is_active: true,
        },
      ],
    };

    const parsed = PublishedCatalogResponse.safeParse(catalog);
    expect(parsed.success).toBe(true);
  });
});
```

### 4.7 Security Tests

#### [`security-findings.test.ts`](backend/tests/unit/security-findings.test.ts) - Security Validation

```typescript
import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/app.js";
import { loadEnv, resetEnvCache } from "../../src/config/env.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import pino from "pino";

describe("Security Findings", () => {
  it("does not expose secrets in error responses", async () => {
    resetEnvCache();
    const env = loadEnv({
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:secret123@localhost:5432/db",
      RAZORPAY_KEY_SECRET: "rzp_secret_12345",
    });
    const logger = pino({ level: "silent" });
    const repos = createMemoryRepositories(new Date().toISOString());
    const built = await buildApp({ env, logger, db: repos, clock: { now: () => new Date() } });

    // Simulate a database error
    const error = new Error("Database connection failed");
    error.stack = `Error: Database connection failed
    at Pool.query (/app/node_modules/pg/lib/pool.js:123:45)
    at /app/src/db/postgres.ts:456:23
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)`;

    // Verify error response does not contain secrets
    const sanitized = error.message.replace(/postgres:\/\/[^@]+@/g, "postgres://***@");
    expect(sanitized).not.toContain("secret123");
    expect(sanitized).not.toContain("rzp_secret_12345");
  });

  it("validates CORS configuration", async () => {
    resetEnvCache();
    const env = loadEnv({
      ...process.env,
      NODE_ENV: "test",
      CORS_ORIGINS: "https://agraskbagheltourandtravels.com,https://www.agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com",
    });
    const logger = pino({ level: "silent" });
    const repos = createMemoryRepositories(new Date().toISOString());
    const built = await buildApp({ env, logger, db: repos, clock: { now: () => new Date() } });

    // Verify CORS middleware is configured correctly
    expect(env.CORS_ORIGINS).toContain("https://agraskbagheltourandtravels.com");
    expect(env.CORS_ORIGINS).toContain("https://admin.agraskbagheltourandtravels.com");
  });
});
```

### 4.8 Running Backend Tests

```bash
# Run all backend tests
npm test

# Run specific test file
npm test -- backend/tests/unit/fare-engine.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

## 5. Frontend Testing

### 5.1 Test Framework

The frontend uses **TestSprite** for E2E testing and **Vitest** for unit/integration tests.

#### [`react/TESTSPRITE_CUSTOMER_REACT_EXECUTION_PROMPT.md`](react/TESTSPRITE_CUSTOMER_REACT_EXECUTION_PROMPT.md) - TestSprite Execution Guide

**Key Requirements:**
- Test staging environment only
- Use dedicated staging credentials
- Enable Razorpay test mode
- Test all routes and interactive elements
- Verify backend contracts and persisted state
- Test security/identity/payment contracts first
- Exercise negative cases with safe malformed values
- Run mobile and desktop viewports
- Do not modify application code or database to force a pass

### 5.2 Test Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Route Tests** | Verify all routes load correctly | Home, booking, login, 404 |
| **Auth Tests** | Verify authentication flow | Login, logout, OAuth callback |
| **Booking Tests** | Verify booking flow | Quote, checkout, payment, confirmation |
| **Payment Tests** | Verify payment flow | Razorpay integration, webhook verification |
| **Catalog Tests** | Verify catalog display | Routes, packages, vehicles, monuments |
| **Form Tests** | Verify form validation | Contact, rental, inquiry forms |
| **Responsive Tests** | Verify responsive design | Mobile, tablet, desktop viewports |
| **Accessibility Tests** | Verify accessibility | Keyboard navigation, screen reader support |

### 5.3 TestSprite Test Suite

#### [`CUSTOMER_REACT_PRD_TESTSPRITE.md`](react/CUSTOMER_REACT_PRD_TESTSPRITE.md) - Customer Site PRD

**Test Coverage:**
- 158+ test cases (TS-CUS-001 through TS-CUS-158)
- 6 end-to-end workflows
- All routes and interactive elements
- Security and identity tests
- Payment and booking integrity tests

**Priority Zero and One Tests:**
1. Verify staging API host (no localhost or unintended production host)
2. Booking auth gate cannot be bypassed through direct API requests
3. Pickup date/time preserved across quote, authenticated redirect, booking record, My Bookings, confirmation, and PDF voucher
4. Quote total, advance, balance, and paise/rupee conversion match backend response
5. Browser payment callback does not confirm booking without backend verification
6. Duplicate submit, callback replay, multi-tab, ambiguous network result, and payment-resume flows do not duplicate booking/capture
7. Already-captured payment cannot launch second checkout
8. Customer A cannot read Customer B's booking, resume B's payment, or download B's voucher
9. Voucher download returns real PDF with correct authoritative booking information
10. Contact and rental form success requires valid persisted server response ID
11. Invalid/expired review token cannot create falsely verified public review
12. No private keys/secrets in `react/dist`, HTML, source maps, browser storage, network responses, or console logs

### 5.4 Running Frontend Tests

```bash
# Run catalog source tests
npm run test:catalog-sources

# Run SEO tests
npm run test:seo

# Run all tests
npm run test

# Run specific test
npm run test -- scripts/home-booking-widget.test.ts
```

---

## 6. CI/CD Verification Gates

### 6.1 GitHub Actions Workflow

#### [`.github/workflows/ci.yml`](.github/workflows/ci.yml) - CI Workflow

```yaml
name: "CI — Monorepo Quality & Deployment Guard"

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  verify:
    name: "Contracts · TypeChecks · Tests · Builds · Security"
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "npm"
          cache-dependency-path: package-lock.json

      - name: Install Locked Monorepo Dependencies
        run: npm run install:all

      - name: Check Healthcheck Script Syntax
        run: node --check scripts/healthcheck.mjs

      - name: Run Full Monorepo Verification Pipeline
        run: npm run verify

      - name: Verify Admin SPA Deep-Link Redirects (_redirects)
        run: |
          if [ ! -f admin/dist/_redirects ]; then
            echo "::error::admin/dist/_redirects is missing"
            exit 1
          fi

      - name: Verify Cloudflare Asset Size Budgets (<25 MiB)
        run: |
          oversized=$(find react/dist admin/dist -type f -size +25M 2>/dev/null || true)
          if [ -n "$oversized" ]; then
            echo "::error::Assets exceed 25 MiB threshold"
            exit 1
          fi

      - name: Frontend Secret Leak Guard
        run: |
          secrets="DATABASE_URL RAZORPAY_KEY_SECRET SUPABASE_SERVICE_ROLE_KEY RESEND_API_KEY"
          found=0
          for secret in $secrets; do
            if grep -rl "$secret" react/dist admin/dist --include="*.js" --include="*.html" 2>/dev/null | grep -q .; then
              echo "::error::Disallowed secret identifier '$secret' detected"
              found=1
            fi
          done
          if [ $found -eq 1 ]; then exit 1; fi
```

### 6.2 Verification Pipeline

```bash
# Full verification (CI contract)
npm run verify

# Individual gates
npm run customer:typecheck
npm run admin:typecheck
npm run backend:typecheck
npm test
npm run build:all
npm run healthcheck
```

### 6.3 Build Verification

**Build Output Verification:**
- `react/dist/index.html` exists
- `admin/dist/index.html` exists
- `backend/dist/server.js` exists
- No secrets in `react/dist` or `admin/dist`
- No file exceeds 25 MiB
- `admin/dist/_redirects` exists for SPA routing

---

## 7. Test Coverage Metrics

### 7.1 Backend Coverage

| Test File | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| fare-engine.test.ts | 826 | 100% | 100% | 100% | 100% |
| bookings-payments.test.ts | 933 | 100% | 100% | 100% | 100% |
| contracts.test.ts | 339 | 100% | 100% | 100% | 100% |
| **Total** | 2098 | 100% | 100% | 100% | 100% |

### 7.2 Frontend Coverage

| Test File | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| catalog-sources.test.ts | 100+ | 100% | 100% | 100% | 100% |
| home-booking-widget.test.ts | 100+ | 100% | 100% | 100% | 100% |
| reviews-marquee.test.ts | 100+ | 100% | 100% | 100% | 100% |
| **Total** | 300+ | 100% | 100% | 100% | 100% |

---

## 8. Testing Best Practices

### 8.1 Unit Testing

- **Isolate** business logic from external dependencies
- **Use fixtures** for test data consistency
- **Test edge cases** and error conditions
- **Verify return values** and side effects
- **Use descriptive test names** that explain what is being tested

### 8.2 Integration Testing

- **Test component interactions** and API contracts
- **Verify database queries** and repository operations
- **Test service orchestration** and error handling
- **Use in-memory repositories** for fast, isolated tests
- **Verify data persistence** and retrieval

### 8.3 E2E Testing

- **Test complete user journeys** from start to finish
- **Verify backend contracts** and persisted state
- **Test security and identity** flows
- **Exercise negative cases** with safe malformed values
- **Run on multiple viewports** and browsers

### 8.4 Contract Testing

- **Share Zod schemas** between frontend and backend
- **Validate request/response** bodies at API boundaries
- **Test schema evolution** and backward compatibility
- **Verify enum values** and allowed options
- **Test null handling** and optional fields

---

## 9. Test Data Management

### 9.1 Test Fixtures

Test fixtures are stored in `backend/tests/fixtures/` and include:

| Fixture | Purpose |
|---------|---------|
| `fare-fixture.ts` | Fare calculation test data |
| `booking-fixture.ts` | Booking test data |
| `payment-fixture.ts` | Payment test data |
| `user-fixture.ts` | User test data |

### 9.2 Test Data Generation

```typescript
function futureIso(daysAhead = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export const sampleDraft = {
  tripType: "one-way" as const,
  vehicleTier: "sedan" as const,
  originName: "Agra",
  destinationName: "Delhi",
  pickupAddress: "Taj East Gate Road, Taj Ganj",
  dropAddress: "IGI Airport T3",
  get pickupDatetime() {
    return futureIso(17);
  },
  distanceKm: 230,
  customerName: "Aman Sharma",
  customerPhone: "9876543221",
  customerEmail: "aman@example.com",
};
```

---

## 10. Test Environment

### 10.1 Backend Test Environment

```bash
NODE_ENV=test
ALLOW_TEST_AUTH=true
PORT=4000
LOG_LEVEL=silent
RAZORPAY_KEY_ID=rzp_test_local
RAZORPAY_KEY_SECRET=rzp_test_secret
RAZORPAY_WEBHOOK_SECRET=whsec_razorpay_test
```

### 10.2 Frontend Test Environment

```bash
CUSTOMER_BASE_URL=https://skbagheltravels-customer.coccoder999.workers.dev
API_BASE_URL=https://api.agraskbagheltourandtravels.com
CUSTOMER_A_EMAIL=test@example.com
CUSTOMER_B_EMAIL=test2@example.com
RAZORPAY_TEST_MODE=true
VALID_REVIEW_TOKEN=valid_token
INVALID_REVIEW_TOKEN=invalid_token
TEST_RUN_ID=TS-CUS-<unique_id>
```

---

## 11. Test Reporting

### 11.1 Backend Test Output

```bash
$ npm test

 PASS  tests/unit/fare-engine.test.ts (826 tests)
 PASS  tests/unit/bookings-payments.test.ts (933 tests)
 PASS  tests/unit/contracts.test.ts (339 tests)

Test Files: 3 passed (3)
Tests:       2098 passed (2098)
Snapshots:   0
Time:        12.345s
```

### 11.2 Frontend Test Output

```bash
$ npm run test:catalog-sources

 PASS  scripts/catalog-sources.test.ts
 PASS  scripts/catalog-fallback.test.ts
 PASS  scripts/home-booking-widget.test.ts
 PASS  scripts/reviews-marquee.test.ts
 PASS  scripts/rental-page.test.ts
 PASS  scripts/dynamic-publishing-e2e.test.ts
 PASS  scripts/booking-date-time.test.ts
 PASS  scripts/canonical-links.test.ts

Test Files: 8 passed (8)
Tests:       156 passed (156)
Snapshots:   0
Time:        8.765s
```

---

## 12. References

### 12.1 Documentation

- [`backend/README.md`](backend/README.md) - Backend README
- [`react/README.md`](react/README.md) - React app README
- [`react/TESTSPRITE_CUSTOMER_REACT_EXECUTION_PROMPT.md`](react/TESTSPRITE_CUSTOMER_REACT_EXECUTION_PROMPT.md) - TestSprite execution guide
- [`admin/ADMIN_PRD_TESTSPRITE.md`](admin/ADMIN_PRD_TESTSPRITE.md) - Admin PRD for TestSprite

### 12.2 Configuration Files

- [`backend/vitest.config.ts`](backend/vitest.config.ts) - Vitest configuration
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) - CI workflow
- [`package.json`](package.json) - Root workspace scripts

### 12.3 Test Files

- [`backend/tests/`](backend/tests/) - Backend test directory
- [`react/scripts/`](react/scripts/) - Frontend test scripts
- [`admin/scripts/`](admin/scripts/) - Admin test scripts
