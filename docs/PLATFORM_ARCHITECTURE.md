# Platform Architecture Guide — Agra SK Baghel Tour & Travels

**Document Version:** 3.0.0  
**Status:** Canonical Platform Specification  
**Last Updated:** 2026-11-01

---

## 1. Executive Summary

This document defines the complete platform architecture for **Agra SK Baghel Tour & Travels** — a database-driven travel business management platform with an SEO-first public website.

**Platform Vision:**
- **Customer Experience Platform (`react/`)**: SEO-optimized public website (SSG + client hydration) for discovery, instant server quotes, booking, and 28% advance payments.
- **Admin Control Panel (`admin/`)**: Business operating system for content, catalog, SEO, operations, trip completion, and financial reconciliation.
- **Backend Platform (`backend/`)**: High-speed Fastify 5 API enforcing server-authoritative pricing, booking state transitions, Razorpay webhooks, L1 in-memory caching, and async workers.
- **Central Data Platform**: Supabase PostgreSQL (`pg.Pool`) as the single source of truth.

**Core Architectural Laws:**
1. **Database-Driven Publishing:** Admin creates/edits content → Database stores draft → Validation → Publication Outbox → L1 Cache invalidation + Cloudflare Pages rebuild. Zero developer involvement required for content updates.
2. **Server-Authoritative Pricing & Integer Money:**
   - Client never determines prices.
   - All Catalog, Fare, Promo, and Booking amounts in PostgreSQL and APIs are **whole integer INR Rupees (`INTEGER`)**.
   - All Razorpay Gateway amounts (`payments.amount_paise`, `refunds.amount_paise`) are **integer Indian Paise (`BIGINT`, `advance_amount * 100`)**.
3. **No Driver Assignment Step:**
   - Customer pays **28% Advance** online via Razorpay (`paid_confirmed`).
   - Remaining **72% Balance** is paid directly to the chauffeur upon trip completion.
   - `super_admin` updates trip progress (`paid_confirmed` → `in_transit` → `completed` with `balance_collected_by_driver`) directly in the Admin panel.
4. **Shared Contracts (`contracts/*.ts`):** Single source of truth synced across `backend/`, `admin/`, and `react/`.
5. **Two Staff Roles Only:** `super_admin` (full platform access) and `developer` (content, catalog, fleet, media, SEO, and publishing access only).

---

## 2. Platform Components

### 2.1 Customer Experience Platform (`react/`)

| Module | Functional Requirements |
|--------|------------------------|
| Homepage | Hero search dock, featured packages, corridors, fleet showroom, static verified reviews marquee |
| Routes | Outstation corridor catalog and individual route detail pages (`/routes`, `/routes/:slug`) |
| Tours | Curated day and multi-day tour packages with itineraries and inclusions (`/packages`, `/packages/:slug`) |
| Local & Transfers | Hourly/km city slabs (`8hr-80km`, `12hr-120km`) and airport/railway station transfers |
| Fleet | 4 canonical vehicle groups (`sedan`, `suv`, `luxury`, `tempo_traveller`) + 10 canonical models |
| Monuments | Agra, Mathura, Vrindavan, and Fatehpur Sikri sightseeing guide (`/monuments`, `/monuments/:slug`) |
| Booking & Quotes | 5-step booking funnel with server-authoritative 5-step fare calculation & 28% advance split |
| Payments | On-demand Razorpay Checkout, server verification, webhook confirmation, and A4 PDF voucher download |
| Customer Accounts | Supabase Auth + Google OAuth, My Bookings (`/my-bookings`), and guest token continuity (`x-guest-token`) |
| Reviews | Tokenized verified customer review submission (`/review/:token`) |
| Support & Legal | Contact form, Call-first rental enquiries (`/rental`), FAQ, Terms, Privacy, and Cancellation policies |

### 2.2 Admin Control Panel (`admin/`)

| Module | Allowed Roles | Capabilities |
|--------|---------------|-------------|
| Overview Dashboard | `super_admin` | Revenue, bookings, enquiries, and operational metrics |
| Booking Management | `super_admin` | Search, filter, transition status (`paid_confirmed` → `in_transit` → `completed`), record driver cash collection |
| Payment & Refunds | `super_admin` | Razorpay transactions, reconciliation status (`matched` / `needs_review`), and full/partial refunds |
| Promotions | `super_admin` | Promo codes, min order totals, group-vehicle rules, and broadcast banners |
| Reviews Studio | `super_admin` | Generate customer review links, moderate submissions, and publish to website |
| Lead Management | `super_admin` | General contact inquiries and call-first rental enquiries |
| Configuration & Policies | `super_admin` | Global `fare_settings` (28% advance, 18% GST, 300 km/day), company profile, cancellation & pet policies |
| Audit Center | `super_admin` | Immutable audit trail (`admin_audit_logs`) of all administrative actions |
| Tour Management | `super_admin`, `developer` | Tour packages, itineraries, inclusions, and per-vehicle tier pricing |
| Route Management | `super_admin`, `developer` | Outstation routes, distances, tolls, interstate charges, and vehicle pricing |
| Local & Transfer Management | `super_admin`, `developer` | Local sightseeing slabs (`8hr-80km`, `12hr-120km`) and airport/station transfers |
| Fleet & Fare Catalog | `super_admin`, `developer` | Vehicle groups, vehicle models, capacities, per-km rates, and allowances |
| Monument Management | `super_admin`, `developer` | Sightseeing monuments, visiting hours, entry fees, and galleries |
| Media Library | `super_admin`, `developer` | Upload and manage optimized WebP/AVIF assets in Supabase Storage / Cloudflare R2 |
| SEO Control Center | `super_admin`, `developer` | Per-URL metadata (`seo_metadata`), canonicals, JSON-LD, and 301/302 redirects (`seo_redirects`) |
| Publishing Center | `super_admin`, `developer` | Outbox queue (`publishing_outbox`), L1 cache purge, and Cloudflare Pages deploy triggers |

---

## 3. Canonical Contract Specifications (`contracts/`)

All contracts live in root `contracts/` and sync via `npx tsx contracts/scripts/sync-contracts.ts`.

| Contract File | Contract ID | Primary Exports |
|---------------|-------------|-----------------|
| `contracts/product-verticals.ts` | `C-ENUM-004` | `PRODUCT_VERTICALS`, `CATALOG_STATUSES`, `USER_ROLES` (`super_admin`, `developer`, `customer`), `ADMIN_ROLES` |
| `contracts/vehicle-tiers.ts` | `C-ENUM-001` | `VEHICLE_GROUPS` (`sedan`, `suv`, `luxury`, `tempo_traveller`), `VEHICLE_MODELS`, `VEHICLE_TIERS`, `toCanonicalTierKey` |
| `contracts/trip-types.ts` | `C-ENUM-002` | `TRIP_TYPES` (`one-way`, `round-trip`, `local-tour`, `airport-transfer`), `OUTSTATION_TRIP_TYPES` |
| `contracts/local-package-keys.ts` | `C-ENUM-003` | `LOCAL_PACKAGE_KEYS` (`8hr-80km`, `12hr-120km`), `toCanonicalLocalPackageKey` |
| `contracts/fare-system.ts` | `C-FARE-SYS-001` | `QuoteRequest`, `QuoteResponse`, `OptionsRequest`, `OptionsResponse`, `CreateBookingRequest`, `BookingCreateResponse`, `BookingDetailResponse`, `PaymentOrderResponse`, `PublishedCatalogResponse`, `SeoMetadataItem`, `SeoRedirectItem` |
| `contracts/bookings.ts` | `C-BOOKING-001` | `BOOKING_STATUSES` (no `driver_assigned`), `PAYMENT_PROVIDERS` (`razorpay`), `Booking`, `Payment`, `AdminUpdateBookingStatusSchema` |
| `contracts/fares.ts` | `C-FARE-001` | `FareSnapshot`, `CalculateFareInput`, `CalculateFareResponse` |
| `contracts/fleet-pricing.ts` | `C-FLEET-PRICING-001` | `FleetPriceOptionSchema`, `FleetPriceOption` |
| `contracts/catalog.ts` | `C-CATALOG-001` | `PublicCatalogItem`, `CatalogItem`, `CreateCatalogItemInput`, `UpdateCatalogItemInput` |
| `contracts/routes.ts` | `C-ROUTE-001` | `RouteItem`, `CreateRouteInput`, `UpdateRouteInput` |
| `contracts/tour-packages.ts` | `C-TOUR-001` | `TourPackageItem`, `CreateTourPackageInput`, `UpdateTourPackageInput` |
| `contracts/local-packages.ts` | `C-LOCAL-001` | `LocalPackageItem`, `CreateLocalPackageInput`, `UpdateLocalPackageInput` |
| `contracts/transfer-routes.ts` | `C-TRANSFER-001` | `TransferRouteItem`, `CreateTransferRouteInput`, `UpdateTransferRouteInput` |
| `contracts/monuments.ts` | `C-MONUMENT-001` | `MonumentItem`, `CreateMonumentInput`, `UpdateMonumentInput` |
| `contracts/policies.ts` | `C-POLICY-001` | `CancellationPolicyItem`, `PetPolicyItem`, `CompanyProfileItem`, `DossierSignoffItem` |
| `contracts/promos.ts` | `C-PROMO-001` | `PromoCodeItem`, `CreatePromoCodeInput`, `PromoValidateRequest`, `PromoValidateResponse` |

---

## 4. High-Speed Data Flow & Caching Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Cloudflare Edge CDN & Pages (Global <15ms)                │
│  - Pre-rendered SSG HTML + Static Catalog Snapshot (Zero-Spinner Hydration) │
│  - Edge Cache (s-maxage=300, stale-while-revalidate=86400) for GET Catalog  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS (/api/v1/*)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Fastify 5 Backend API (Render)                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ L1 In-Memory Catalog & Fare Cache (TTL: 5m, Instant Admin Purge)      │  │
│  │ -> Serves POST /api/v1/quotes & GET /api/v1/catalog in < 1ms (0 I/O) │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Transactional Write Path (Bookings, Payments, Admin CRUD)            │  │
│  │ -> Non-blocking Razorpay Webhook (< 40ms commit)                      │  │
│  │ -> Async Outbox Workers (PDF Voucher, Resend Email, WhatsApp, Deploy) │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ pg.Pool (keepAlive, Single-Roundtrip SQL)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL (Single Source of Truth)               │
└─────────────────────────────────────────────────────────────────────────────┘
```
