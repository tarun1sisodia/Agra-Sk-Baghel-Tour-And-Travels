# Project Architecture — Agra SK Baghel Tour & Travels

**Document Version:** 1.0.0  
**Status:** Production-Ready Monorepo Architecture  
**Last Updated:** 2026-10-31

---

## 1. Executive Summary

This document describes the **correct, production-grade architecture** for building a full-stack travel booking platform like Agra SK Baghel Tour & Travels. It synthesizes lessons from 861 commits of real-world development, identifying both what worked and what failed, and presents a clean, maintainable, and scalable architecture.

### Architecture Philosophy

| Principle | Correct Approach | What Failed Before |
|-----------|------------------|-------------------|
| **Data Authority** | Server-authoritative fares, payments, and state | Client-side fare manipulation |
| **Single Source of Truth** | PostgreSQL as the only database | MongoDB confusion, dual-write conflicts |
| **Build Is Deployment** | Static SSG with Cloudflare Pages | Dynamic rendering, hydration mismatches |
| **Type Safety** | Shared contracts across frontend/backend | Type drift, runtime errors |
| **Security** | Zero secrets in frontend bundles | Environment variable leakage |
| **Testing** | E2E-first with automated verification | Manual QA, regression bugs |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Cloudflare Pages                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   Customer Site      │  │   Admin Panel        │  │   Static Assets  │  │
│  │   (react/dist)       │  │   (admin/dist)       │  │   (Cloudflare)   │  │
│  │   - SSG Pre-rendered │  │   - SPA              │  │   - Images       │  │
│  │   - 31 Public Pages  │  │   - Protected Routes │  │   - Fonts        │  │
│  │   - SEO-Optimized    │  │   - Dashboard        │  │   - PDFs         │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └──────────────────┘  │
└─────────────┼─────────────────────────┼─────────────────────────────────────┘
              │                         │
              │ HTTPS + CORS            │ HTTPS
              ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Backend API                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Node.js + Fastify + TypeScript                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Controllers (Validation + Auth)                               │  │   │
│  │  │  └────────────────────────────────────────────────────────────┘  │   │
│  │  │  Services (Business Logic)                                       │  │   │
│  │  │  └────────────────────────────────────────────────────────────┘  │   │
│  │  │  Repositories (Database Access)                                  │  │   │
│  │  │  └────────────────────────────────────────────────────────────┘  │   │
│  │  │  Fare Engine (Pure Functions)                                    │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              │ PostgreSQL (Supabase)
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Database Layer                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Tables:                                                             │   │
│  │  - bookings, payments, refunds                                       │   │
│  │  - routes, packages, monuments                                       │   │
│  │  - fleet, vehicle_tiers, fare_rules                                  │   │
│  │  - users, profiles, sessions                                         │   │
│  │  - reviews, inquiries, webhooks                                      │   │
│  │  - location_cache, publication_outbox                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend (Customer Site & Admin)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | React | 19.1.1 | Component library |
| **Build Tool** | Vite | 7.1.3 | SSG + HMR |
| **Styling** | TailwindCSS | 4.3.3 | Design tokens |
| **Animations** | Framer Motion | 13.4.4 | Micro-interactions |
| **Icons** | Lucide React | 1.48.0 | SVG icon system |
| **Type Safety** | TypeScript | 5.9.2 | Type checking |
| **Validation** | Zod | 4.6.5 | Schema validation |

### 3.2 Backend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 22+ | JavaScript runtime |
| **Framework** | Fastify | 5.6.0 | HTTP server |
| **Database** | PostgreSQL | 8.16.3 | Primary data store |
| **Auth** | Supabase | 2.57.4 | JWT verification |
| **Payments** | Razorpay | 2.9.8 | Payment processing |
| **Email** | Resend | - | Transactional emails |
| **PDF** | @pdfme/generator | 6.2.6 | Booking vouchers |
| **Validation** | Zod | 3.25.76 | Schema validation |
| **Logging** | Pino | 9.9.5 | Structured logging |
| **Testing** | Vitest | 3.2.4 | Unit + integration tests |

### 3.3 Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| **CDN/Hosting** | Cloudflare Pages | Static site delivery |
| **API Hosting** | Render / VPS | Backend API |
| **Database** | Supabase PostgreSQL | Data persistence |
| **Storage** | Cloudflare R2 + Supabase | Multi-tier media storage |
| **Monitoring** | Cloudflare Analytics | Traffic + uptime |

---

## 4. Monorepo Structure

```
ArenaAI/
├── react/                          # Customer website (SSG)
│   ├── src/
│   │   ├── pages/                  # 31 page components
│   │   ├── components/             # Reusable UI components
│   │   ├── features/               # Feature-level composites
│   │   ├── layouts/                # Route layouts
│   │   ├── auth/                   # Supabase Auth integration
│   │   ├── services/               # API client functions
│   │   ├── contracts/              # Shared Zod schemas
│   │   ├── styles/                 # Design tokens + globals
│   │   ├── data.ts                 # Static vehicle/route data
│   │   ├── fares.ts                # Client fare calculator
│   │   └── config.ts               # Frontend constants
│   ├── public/                     # Static assets
│   └── scripts/                    # Build-time scripts
│
├── admin/                          # Operations desk (SPA)
│   ├── src/
│   │   ├── pages/                  # Admin pages
│   │   ├── components/             # Admin UI components
│   │   ├── services/               # API clients
│   │   └── auth/                   # Admin authentication
│   └── public/
│
├── backend/                        # API server
│   ├── src/
│   │   ├── app.ts                  # Fastify factory
│   │   ├── server.ts               # Entry point
│   │   ├── config/                 # Environment + logger
│   │   ├── db/                     # Repository layer
│   │   ├── middlewares/            # Auth + error handling
│   │   ├── modules/                # Domain modules
│   │   │   ├── fare-engine/        # Pure fare calculation
│   │   │   ├── bookings/           # Booking domain
│   │   │   ├── payments/           # Payment domain
│   │   │   ├── catalog/            # Route/package management
│   │   │   └── publishing/         # Content deployment
│   │   └── tests/                  # Test suite
│   ├── migrations/                 # SQL migrations
│   └── scripts/                    # CLI utilities
│
├── contracts/                      # Shared type definitions
│   ├── catalog.ts
│   ├── fares.ts
│   ├── fleet-pricing.ts
│   ├── tour-packages.ts
│   └── scripts/sync-contracts.ts
│
├── docs/                           # Documentation
│   ├── DEPLOYMENT.md
│   ├── PAYMENT_SYSTEM.md
│   ├── CUSTOMER_SITE_PRD.md
│   └── admin/
│
├── scripts/                        # Root-level utilities
│   ├── dev-all.mjs
│   ├── healthcheck.mjs
│   └── verify-monorepo-pipeline.mjs
│
└── package.json                    # Root workspace config
```

---

## 5. Data Flow Architecture

### 5.1 Booking Flow

```
┌──────────────┐
│   Customer   │
│   Browser    │
└──────┬───────┘
       │ 1. Search routes/packages
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Customer Site (SSG)                                            │
│  - Pre-rendered pages hydrate                                   │
│  - Dynamic data fetched via API                                 │
└──────┬──────────────────────────────────────────────────────────┘
       │ 2. GET /api/catalog/routes
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                    │
│  - Validate request (Zod)                                       │
│  - Query PostgreSQL (Repositories)                              │
│  - Return filtered catalog                                      │
└──────┬──────────────────────────────────────────────────────────┘
       │ 3. SELECT * FROM routes WHERE is_active = true
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                            │
│  - Routes, packages, fleet data                                 │
│  - Indexed for performance                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Payment Flow

```
┌──────────────┐
│   Customer   │
│   Browser    │
└──────┬───────┘
       │ 1. POST /api/bookings (draft)
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                    │
│  - Create booking draft (pending_payment)                       │
│  - Recalculate fare (server-authoritative)                      │
│  - Create Razorpay Order                                        │
│  - Return order_id + amount                                     │
└──────┬──────────────────────────────────────────────────────────┘
       │ 2. INSERT INTO bookings (draft)
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                            │
│  - Booking record created                                       │
└─────────────────────────────────────────────────────────────────┘
       │
       │ 3. Razorpay Checkout (hosted)
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Razorpay Gateway                                               │
│  - Hosted payment page                                          │
│  - User completes payment                                       │
└──────┬──────────────────────────────────────────────────────────┘
       │ 4. Webhook: payment.captured
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                    │
│  - Verify HMAC signature                                        │
│  - Mark booking paid_confirmed                                  │
│  - Send confirmation email                                      │
│  - Generate PDF voucher                                         │
└──────┬──────────────────────────────────────────────────────────┘
       │ 5. UPDATE bookings SET status = 'paid_confirmed'
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                            │
│  - Booking status updated                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Build & Deployment Pipeline

### 6.1 CI/CD Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Actions CI/CD                              │
│                                                                             │
│  Push to main/design/homepage/feat/*                                      │
│                    │                                                        │
│                    ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Quality Gate (quality.yml)                                          │   │
│  │  - Typecheck (React, Admin, Backend)                                 │   │
│  │  - Backend unit tests                                                │   │
│  │  - Catalog source validation                                         │   │
│  │  - SEO artifact validation                                           │   │
│  │  - Build verification                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Deploy to Provider                                                  │   │
│  │  - Cloudflare Pages (Customer + Admin)                               │   │
│  │  - Render (Backend API)                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Build Contract

Every build **must**:

1. Write output **only** to `react/dist`, `admin/dist`, `backend/dist`
2. Generate `react/public/sitemap.xml` (versioned mirror)
3. **Never** commit `dist/`, `node_modules/`, or `.env*` files
4. **Never** include secrets in frontend bundles

### 6.3 Verification Command

```bash
npm run verify
```

This runs:
- `contracts:check` — Contract sync verification
- `customer:typecheck` — React typecheck
- `admin:typecheck` — Admin typecheck
- `backend:typecheck` — Backend typecheck
- `customer:validate-config` — Config validation
- `test` — Backend unit tests + catalog validation
- `customer:seo` — SEO artifact validation
- `build:all` — Production builds (x3)

---

## 7. Database Schema Architecture

### 7.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `bookings` | Trip reservations | id, customer_id, status, fare_paise, trip_type |
| `payments` | Payment records | id, booking_id, razorpay_order_id, amount_paise |
| `refunds` | Refund tracking | id, payment_id, amount_paise, reason |
| `routes` | Outstation routes | id, name, origin, destination, distance_km |
| `packages` | Tour packages | id, name, duration_days, inclusions |
| `monuments` | Sightseeing spots | id, name, location, entry_fee |
| `fleet` | Vehicle inventory | id, name, tier, capacity, is_active |
| `vehicle_tiers` | Pricing tiers | id, name, base_fare, per_km_rate |
| `fare_rules` | Dynamic pricing | id, version, effective_from, rules_json |
| `users` | Authentication | id, email, role, google_sub |
| `profiles` | User profiles | id, user_id, phone, display_name |
| `reviews` | Customer reviews | id, booking_id, rating, media_urls |
| `inquiries` | Contact form submissions | id, name, email, message |
| `webhooks` | Webhook events | id, event_id, processed_at |
| `location_cache` | Geocoding cache | id, query, lat, lng, cached_at |
| `publication_outbox` | Content deployment | id, entity_type, entity_id, published_at |

### 7.2 Indexing Strategy

- **Primary keys**: UUID v4 (`gen_random_uuid()`)
- **Foreign keys**: Indexed on all `*_id` columns
- **Status indexes**: `CREATE INDEX idx_bookings_status ON bookings(status)`
- **Timestamp indexes**: `CREATE INDEX idx_bookings_created_at ON bookings(created_at)`
- **Unique constraints**: `UNIQUE (razorpay_order_id)`, `UNIQUE (email)`

### 7.3 Row-Level Security (RLS)

```sql
-- Only admin can see unmasked PII
CREATE POLICY admin_pii_access ON users
  USING (role = 'admin');

-- Customers can only see their own bookings
CREATE POLICY customer_booking_access ON bookings
  USING (customer_id = auth.uid());

-- Public can see active routes/packages
CREATE POLICY public_active_access ON routes
  USING (is_active = true AND is_archived = false);
```

---

## 8. API Architecture

### 8.1 RESTful Design Principles

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/catalog/routes` | List active routes | Public |
| `GET` | `/api/catalog/packages` | List tour packages | Public |
| `GET` | `/api/catalog/fleet` | List active vehicles | Public |
| `POST` | `/api/bookings` | Create booking draft | Customer |
| `POST` | `/api/payments/razorpay/checkout` | Create Razorpay order | Customer |
| `POST` | `/api/webhooks/razorpay` | Webhook handler | Verified HMAC |
| `GET` | `/api/bookings/:id` | Get booking details | Customer/Admin |
| `PUT` | `/api/bookings/:id` | Update booking | Customer |
| `DELETE` | `/api/bookings/:id` | Cancel booking | Customer |
| `GET` | `/api/admin/bookings` | List all bookings | Admin |
| `PUT` | `/api/admin/bookings/:id/assign-driver` | Assign driver | Admin |

### 8.2 Error Handling

```typescript
// Canonical error format
{
  "error": {
    "code": "INVALID_TRIP_TRANSITION",
    "message": "Cannot transition from 'draft' to 'completed'",
    "details": {
      "current_status": "draft",
      "requested_status": "completed"
    }
  }
}
```

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_INPUT` | Validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid auth |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate submission |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | External service down |

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
┌──────────────┐
│   Customer   │
│   Browser    │
└──────┬───────┘
       │ 1. Click "Sign in with Google"
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Supabase Auth)                                       │
│  - Initiate PKCE flow                                           │
│  - Redirect to Google OAuth                                     │
└──────┬──────────────────────────────────────────────────────────┘
       │ 2. Google redirects back with code
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (Supabase Auth)                                        │
│  - Exchange code for tokens                                     │
│  - Create/lookup user in auth.users                             │
│  - Return JWT to frontend                                       │
└──────┬──────────────────────────────────────────────────────────┘
       │ 3. Store JWT in localStorage
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend                                                       │
│  - Attach JWT to subsequent requests                            │
│  - Verify token on backend via Supabase                         │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Payment Security

| Rule | Implementation |
|------|----------------|
| **No client fare truth** | Server recalculates all fares |
| **HMAC verification** | Razorpay webhook signature verified |
| **Idempotency** | Webhook deduplication via `event_id` |
| **Secrets never in frontend** | Environment variables only in backend |
| **Zero-trust webhooks** | Raw body preserved for HMAC |

### 9.3 Data Protection

| Data Type | Protection Method |
|-----------|-------------------|
| **PII (phone, email)** | Masked in public responses |
| **Payment secrets** | Environment variables only |
| **JWT tokens** | 1-hour expiry, refresh flow |
| **Database credentials** | Supabase service role key only in backend |

---

## 10. Performance Optimization

### 10.1 SSG Pre-rendering

- All 31 customer pages pre-render to static HTML
- Dynamic data hydrates after page load
- No hydration mismatches (server/client match)

### 10.2 Image Optimization

| Format | Use Case |
|--------|----------|
| **WebP** | Modern browsers |
| **AVIF** | Next-gen browsers |
| **JPEG** | Fallback for older browsers |

### 10.3 Code Splitting

- Route-based code splitting
- Vendor chunk isolation
- Lazy-loaded components

### 10.4 Database Optimization

- Connection pooling (`pg.Pool`)
- Query indexing
- Caching (`location_cache` table)
- Read replicas (future)

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
                    ┌─────────────────────────┐
                    │   E2E Tests (TestSprite)│
                    │   - Browser automation  │
                    │   - Real user flows     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Integration Tests      │
                    │  - API endpoint tests   │
                    │  - Database integration │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Unit Tests (Vitest)   │
                    │   - Pure functions      │
                    │   - Service layer       │
                    └─────────────────────────┘
```

### 11.2 Test Coverage

| Layer | Test Type | Coverage Target |
|-------|-----------|-----------------|
| **Frontend** | E2E | 100% user flows |
| **API** | Integration | 100% endpoints |
| **Business Logic** | Unit | 100% fare engine |
| **Database** | Contract | All queries |

### 11.3 Test Commands

```bash
# Run all tests
npm test

# Run backend tests
npm --prefix backend test

# Run catalog validation
npm --prefix react run test:catalog-sources

# Run E2E tests (TestSprite)
testsprite test run <id>
```

---

## 12. SEO & Performance Standards

### 12.1 Google Search Console Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Canonical URLs** | `<link rel="canonical">` on every page |
| **Meta descriptions** | 150-160 characters, unique per page |
| **OpenGraph tags** | `og:title`, `og:description`, `og:image` |
| **Schema.org** | JSON-LD for LocalBusiness, Product |
| **Sitemap** | `/sitemap.xml` with all public URLs |
| **Robots.txt** | Allow all, disallow admin paths |

### 12.2 PageSpeed Insights Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| **LCP** | < 2.5s | Critical CSS inlining, LCP preload |
| **FID** | < 100ms | Minimize main thread work |
| **CLS** | < 0.1 | Image size attributes, reserved space |
| **TTI** | < 3.8s | Code splitting, lazy loading |

### 12.3 SEO Tools

| Tool | Purpose |
|------|---------|
| **Google Search Console** | Crawl errors, search performance |
| **PageSpeed Insights** | Performance audit |
| **Rich Results Test** | Schema validation |
| **Screaming Frog** | Site crawl analysis |

---

## 13. Deployment Checklist

### 13.1 Pre-Deployment

- [ ] All tests pass (`npm run verify`)
- [ ] Typecheck passes (x3)
- [ ] Build succeeds (x3)
- [ ] SEO artifacts validated
- [ ] Pagespeed guardrails pass
- [ ] Environment variables set (backend)
- [ ] Database migrations applied

### 13.2 Deployment Steps

```bash
# Deploy customer site
npm run deploy:customer

# Deploy admin panel
npm run deploy:admin

# Verify deployment
curl -fsS https://agraskbagheltourandtravels.com/health
curl -fsS https://admin.agraskbagheltourandtravels.com/health
curl -fsS https://api.agraskbagheltourandtravels.com/ready
```

### 13.3 Post-Deployment

- [ ] Customer site loads at production URL
- [ ] Admin panel loads at admin URL
- [ ] API health check passes
- [ ] Database connection verified
- [ ] Payment webhook endpoint accessible

---

## 14. Maintenance & Operations

### 14.1 Monitoring

| Metric | Alert Threshold |
|--------|-----------------|
| **API Error Rate** | > 1% over 5min |
| **Page Load Time** | > 5s P95 |
| **Database Connections** | > 80% pool capacity |
| **Payment Failure Rate** | > 5% |

### 14.2 Backup Strategy

- **Database**: Daily snapshots (Supabase)
- **Storage**: R2 versioning enabled
- **Configuration**: Git-tracked

### 14.3 Rollback Plan

1. Identify failed deployment commit
2. Revert to previous stable commit
3. Redeploy affected services
4. Verify health checks pass

---

## 15. Conclusion

This architecture represents the **correct, production-grade approach** for building a full-stack travel booking platform. It synthesizes lessons from 861 commits of real-world development, identifying both what worked and what failed.

### Key Takeaways

1. **Server-authoritative** fares and payments prevent fraud
2. **SSG pre-rendering** ensures SEO and performance
3. **Shared contracts** (Zod) prevent type drift
4. **Zero secrets in frontend** bundles
5. **Comprehensive testing** catches regressions early
6. **Database as single source of truth** prevents data conflicts

### Next Steps

1. Read [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for deployment instructions
2. Read [`BACKEND_RULES.md`](BACKEND_RULES.md) for backend development
3. Read [`FRONTEND_RULES.md`](FRONTEND_RULES.md) for frontend development
4. Read [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) for payment integration

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-10-31  
**Author:** Agra SK Baghel Tour & Travels Engineering Team
