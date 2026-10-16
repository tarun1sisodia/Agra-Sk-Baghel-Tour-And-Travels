# Backend Progress — SK Baghel Tour & Travels

**Document status:** Working tracker  
**Last reviewed:** 2026-09-14  
**Related plan:** [PLAN.md](PLAN.md)

> This file intentionally uses the requested filename `PROGESS.md`. If the project later standardizes spelling, create a compatibility link or rename it with repository approval.

## Overall Status

| Area | Status | Notes |
|---|---|---|
| Architecture | Complete | Dual-database strategy and phased rollout are documented |
| Project scaffold | Complete | `backend/` Fastify + TypeScript strict service with health, CI, Docker |
| Supabase schema | Implemented | Migrations 0001-0011 applied on live Supabase; drivers & vehicles dropped |
| Fare engine | Complete | Pure engine ported with unit tests; customer vehicle tiers preserved |
| Booking flow | Complete | Draft booking, `AGR-YYYYMMDD-XXXX`, immutable fare snapshot, masked retrieval |
| Razorpay integration | Implemented (sandbox) | Provider-neutral checkout, HMAC webhooks, idempotency, amount/currency checks |
| Admin operations | Implemented | Booking listing, filters, refunds, audit log (purged driver/vehicle fleet models) |
| Catalog / reviews | Implemented | Draft/publish/archive, moderated reviews, unpublished content hidden |
| MongoDB optional workloads | Deferred | Location cache and raw webhooks live in PostgreSQL/memory for Phase 1 |
| Notifications | Implemented | Queued WhatsApp/email with dedupe; no-op adapters when credentials absent |
| Production deployment | Not started | Hosting, live webhooks, monitoring, and rollback still required |

## Current Milestone

**Milestone:** Complete Fleet Pricing Rewiring Across Whole Website & Dedicated Quote APIs (Phases 1–15).  
**Completion target:** Single pricing authority (`fare_rules`, `tour_packages`, `local_packages`), zero client math, normalized customer contract (`FleetPriceOption`), dedicated quote endpoints, and 100% test pass rate (`npm run verify`).

## Completed

- [x] Defined Supabase PostgreSQL as the financial and operational system of record.
- [x] Defined MongoDB Atlas as the high-throughput telemetry and document store for the scale phase.
- [x] Specified the Razorpay advance, webhook, signature, and idempotency rules.
- [x] Documented public, operations, and driver API routes.
- [x] Created phase, plan, bug register, API, model, and system-flow documents.
- [x] Initialize the `backend/` repository structure.
- [x] Add environment validation and health endpoints.
- [x] Create and apply Supabase migrations (SQL committed; apply with `npm run migrate`).
- [x] Port and test the fare engine.
- [x] Implement booking draft and ticket generation.
- [x] Implement Razorpay test-mode order and webhook flows (HMAC adapters + contract tests).
- [x] Add contract tests for routes and state transitions.
- [x] Provision live Supabase instance, applied all 10 SQL migrations, and seeded catalog.
- [x] Applied migration `0011_drop_vehicles_and_drivers.sql` to live Supabase DB; dropped tables `drivers` & `vehicles`.
- [x] Purged all driver and physical vehicle models, repositories, and state transitions from backend codebase.
- [x] Dissolved `dispatch/` module into `admin/` module (`GET /api/v1/ops/admin/bookings` and `POST /api/v1/ops/admin/refunds`).
- [x] Verified full build, typecheck, lint, and test suite pass (31/31 tests passing).
- [x] **Phase 0 Fleet Pricing Audit:** Completed and committed 6 comprehensive audit documents (`CURRENT_SYSTEM_AUDIT.md`, `PRICE_FLOW_AUDIT.md`, `PRICE_SOURCE_MATRIX.md`, `CUSTOMER_RENDERING_AUDIT.md`, `BOOKING_PRICE_AUDIT.md`, `MIGRATION_PLAN.md`).
- [x] **Phase 1 Master Plan & Supermemory Ingestion:** Created `docs/FLEET_PRICING_MASTER_IMPLEMENTATION_PLAN.md` with complete 8-part testing matrix; ingested all architecture, rules, and audit artifacts into Supermemory container `sk_baghel_travels`.
- [x] **Phase 2 Fleet Master Normalization:** Extended C-ENUM-001 (v0.1.1) in `contracts/enums/vehicle-tiers.ts` with snake_case aliases (`innova_crysta`, `tempo_traveller`) and compound forms (`tempo-12`, `tempo-16`), added `normalizeFleetCode`, synced byte-identical generated copies to `backend/`, `admin/`, and `react/`, unified `react/src/services/api.ts` `mapVehicleTier`, and validated with 9/9 contract tests passing and 0 sync drift.

- [x] **Phase 3:** Route Fare Rule Source Normalization (PostgreSQL `fare_rules` as single rate authority & catalog manifest canonical database reads: eliminated static `CATALOG_RAW_DATA` and `VEHICLES` baseline from `catalog.service.ts`, eliminated synthetic reverse routes, eliminated invented multiplier fares, derived manifest from canonical published DB records via `FareCatalogRepository`, missing vehicle fares set to `null`, unit test in `catalog-manifest.test.ts` passing, `npm run verify` green).
- [x] **Phase 4:** Route Fleet-Price Resolver (<300km forced round-trip + ₹500 DA, >=300km per-km + ₹500 DA; verified across complete 9-case DIST-01..DIST-09 boundary matrix in `fare-strategy-boundary.test.ts` with 9/9 tests green).
- [x] **Phase 5:** Package Fleet-Price Resolver (`tour_packages.fleet_prices` fixed pricing across all 5 vehicle tiers; route distance/allowance isolation verified with 20/20 tests green in `package-fleet-price.test.ts`).
- [x] **Phase 6:** Normalized Customer Contract (`FleetPriceOption` & `FleetPriceOptionSchema` in `contracts/fleet-pricing.ts`, synced byte-identical to `backend/src/contracts/`, `admin/src/contracts/`, and `react/src/contracts/`, zero drift, 10/10 contract tests green).
- [x] **Phase D.2:** Connected Catalog Publishing to Verified Releases (Outbox `site_publish_events` durable enqueuing on all admin mutations, metadata-enriched deploy hook requests, fail-closed multi-table resolution & explicit archive verification in `PublicationWorker`, real production imports in `dynamic-publishing-e2e.test.ts`, all unit/integration tests passing, `npm run verify` green).

## Next Actions

- [ ] **Phase 7–10:** Customer Surfaces Rewiring (Homepage, Routes, Monuments, Packages).
- [x] **Phase 11:** Fix Package Booking Flow (`booking.service.ts` lookup bug #18 resolved across code & UUID lookups in dedicated `tour_packages`).
- [ ] **Phase 12:** Dedicated Authoritative Quote Endpoints (`POST /quotes/route`, `POST /quotes/package`).
- [ ] **Phase 13–15:** Revalidation, Full Verification (`npm run verify`), and Decommission of legacy client math.

## Change Log

| Date | Change | Owner |
|---|---|---|
| 2026-10-16 | Completed Phase D.2: Connected Catalog Publishing to Verified Releases (Migration `0042_widen_publish_events_entity_id.sql`, outbox repo `publishEvents`, domain service hooks in catalog/tour-packages/local-packages/transfer-routes/routes, hardened fail-closed worker verification for detail page, CDN images, sitemap presence & archive exclusion, real production tests, `npm run verify` green). | Antigravity AI |
| 2026-10-16 | Completed Phase 6: Shared Customer Price Contract — `FleetPriceOption` (Contract C-FLEET-PRICING-001 v0.2.0 in `contracts/fleet-pricing.ts`, synced byte-identical to backend, admin, react; 10 contract tests green; 3 typechecks clean). Reconciled Phase 4 & Phase 5 completion. | Antigravity AI |
| 2026-10-16 | Completed Phase 5: Tour Package Fleet Pricing & Route Rate Isolation (`resolvePackageFleetPrice` in `tour-package.calculator.ts`, 20/20 unit tests green in `package-fleet-price.test.ts`). | Antigravity AI |
| 2026-10-16 | Completed Phase 4: Route Fleet-Price Distance Boundary Resolver & Test Matrix Invariants (`DIST-01`..`DIST-09` in `fare-strategy-boundary.test.ts`, 9/9 tests green). | Antigravity AI |
| 2026-10-15 | Completed Live Homepage Booking Integration & Admin Review Moderation Pipeline: canonical catalog & group wiring, smart outstation & local tour handoff to /book.html, completed-ticket verification for reviews, 204 unit tests green, npm run verify green | Antigravity AI |
| 2026-10-12 | Completed Phase 3: Route Fare Rule Source Normalization & Catalog Manifest Cleanup — eliminated static baseline, synthetic reverse routes, and multiplier fares from `catalog.service.ts`; wired `FareCatalogRepository`; 192 backend unit tests passing, `npm run verify` green | Antigravity AI |
| 2026-10-11 | Completed Route & API Inventory Monorepo Migration: Clean canonical `/api/v1` routes, Customer & Admin rewired, Zero client fare math, 179/179 tests passing, `npm run verify` green | Antigravity AI |
| 2026-10-08 | Completed Phase 2: Fleet Master Normalization (Contract C-ENUM-001 v0.1.1) across contracts, backend, admin, and react | Antigravity AI |
| 2026-10-08 | Authored `docs/FLEET_PRICING_MASTER_IMPLEMENTATION_PLAN.md` with 8-part testing matrix, completed Phase 0 audit ingestion into Supermemory | Antigravity AI |
| 2026-09-13 | Created the documentation baseline from the master architecture plan | Manus AI |
| 2026-09-14 | Implemented `backend/` service: fare engine, bookings, payments, dispatch, catalog, reviews, tests | Arena Agent |
| 2026-09-14 | Connected live Supabase PostgreSQL & MongoDB Atlas, applied all 10 migrations, and seeded base data | Antigravity AI |
| 2026-09-14 | Purged drivers & vehicles from database and backend codebase per client instructions; 100% test pass | Antigravity AI |
| 2026-09-15 | Phase H1: Added HTTP/3 Alt-Svc, Timing-Allow-Origin, Link preload headers, verification suite | Antigravity AI |
| 2026-09-15 | Phase H2: Applied migration 0012 (partial/covering/trigram indexes), added poolConfig for PgBouncer port 6543, ConcurrencyError optimistic locking & row locks | Antigravity AI |
| 2026-09-27 | Live catalog: migration 0018 (type → text + trip commercial fields + inline media), public `GET /api/v1/catalog` (+type/tripType filters), `GET /api/v1/media/:id` immutable serve, `GET /api/v1/fleet`; admin CRUD for name/price/distance/availability/stops/tripType; gallery policy (place = multi-image, others = 1 cover) enforced server-side; audit logging on catalog update + media delete; 6 new integration tests (67 total green) | Arena Agent |
| 2026-09-27 | Fleet-first booking flow: 4-step wizard (Vehicle → **Choose Trip** → Booking Form → Confirmation). New step lists ALL trips (live catalog + curated fallback, deduped by slug) with search bar, trip-type filter chips, live availability badges ("Only N left" / "On request") and per-vehicle pricing. Fleet/Vehicle-detail "Book" CTAs land directly on trip selection (`?vehicle=…&step=2`). **SK Concierge** booking agent (BookingAssistant) guides each step, offers quick picks (Most booked / Family / Best value / Sunrise), and hands off to the WhatsApp desk with trip+vehicle+date prefilled. Submit now registers a real desk draft booking (`POST /api/v1/bookings/draft`) and shows the desk ticket ID on the voucher, with graceful local-reference fallback. Voucher gains a "Booked Trip" row. | Arena Agent |
| 2026-09-27 | **Re-integrated onto main's F1–F5 batch** (server-authoritative fares, booking rewrite, 982-route manifest): merged origin/main resolving 9 conflicts — backend catalog keeps the live-trip CMS CRUD + media policy AND gains main's manifest/status/republish routes with bumpManifest hooks; fares keep public `/api/v1/fleet` and adopt the F1/F2 engine with catalogue-derived distance; admin CatalogPage keeps full-trip CRUD and grafts main's "Republish site data" control + manifest strip. Booking flow re-mounted on main's architecture: **no client fare arithmetic (F3 rule)** — the trip-selection step now configures the booking engine (mode/package/route) and displays the desk's server quote (total + advance token); step map is 1 route & vehicle, 2 choose trip, 3 guest details & fare review, 4 voucher. SK Concierge feeds on serverFare numbers. Fleet/vehicle-detail CTAs (`&step=2`) land on the trip step. Full verify green: 90 backend tests (13 files), 3 builds + SSG 37 pages; live E2E verified manifest (964 routes), CMS catalog, fare quotes (local ₹2850/₹800; one-way Delhi→Agra sedan ₹2200/165 km), draft ticket AGR-20260927-0869, and admin republish (v4, 8 packages). | Arena Agent |
| 2026-09-27 | **Phase 1: Production Security & Integrity Controls**: (1.1) Mandatory Razorpay production credentials & adapter prohibition; (1.2) Public media visibility checks (SEC-004); (1.3) Active DB fare engine overrides & package sync; (1.4) Unique-active fare rule partial index & transactional activation; (1.5) Full booking & payment lifecycle integration test suite; (1.6) Device token registration ownership lockdown (SEC-005); (1.7) Pre-deploy migrations in Render release phase + Docker entrypoint; (1.8) Deployment readiness health check (`/ready`) returning 503 on DB degradation. | Antigravity AI |
| 2026-09-27 | **Phase 2: Source-of-Truth Convergence & Dynamic Catalog Manifest**: (2.1–2.4) Manifest compiler excludes draft/archived routes; published DB routes override baseline corridors; packages load real published media cover images; (2.5–2.6) Client bounded cache envelope with 10-minute TTL, conditional ETag validation (`If-None-Match`), HTTP 304 handling, and stale status indicator; (2.7) Manifest route prioritized over static route in `App.tsx`. | Antigravity AI |
| 2026-09-27 | **Phase 3 — Step 3.1: Secure LocationIQ Proxy & Caching**: Server-held secret architecture via `/api/v1/locations/autocomplete`, rate limits (60/min), input/output sanitization & bounds (8 items, 200 char max), 30-day locationCache TTL in PostgreSQL/memory, graceful static catalog fallback, client hook dual envelope parser, unit test suite (5/5 passing). | Antigravity AI |
| 2026-10-04 | Canonical booking-selection integrity: additive migration `0023` (pending deployment), nullable route-only fields, authoritative typed selection through quotes/bookings, safe own-profile endpoint, customer/admin type-aware summaries, and end-to-end coverage. Root `npm run verify` passed; no live data or schema was changed. | Manus AI |


## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

Progress is measured against [1] and the work breakdown in [PLAN.md](PLAN.md).
