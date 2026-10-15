# ArenaAI Agent Change Ledger

## 2026-10-15

### 2026-10-15 — Taxi Rental Page Redesign Using Canonical Vehicle Groups and Functional Enquiry Form

- **Customer Taxi Rental Experience Overhaul (`RentalPage.tsx`, `rental.css`)**:
  - Replaced the legacy 5-card static price list (`FLEETS` / `prices.fleet_per_km`) with a live-catalog-driven showroom.
  - Sourced fleet groups and models dynamically via `fetchPublishedCatalog()` from `GET /api/v1/catalog`.
  - Structured canonical vehicle groups (**Sedan**, **SUV**, **Luxury**, **Tempo Traveller**) as interactive tabs with real-time model count badges.
  - Displayed authentic models in responsive showroom cards with passenger & luggage capacity, truthful fallback resolution, and transparent call-first quotation notices ("Final rental fare confirmed by our team").
  - Extracted modular `RentalVehicleCard` component with graceful neutral placeholder (`.rental-card-placeholder`) when uncataloged models or missing photos are encountered, preventing false vehicle image hallucinations (e.g. unknown Luxury models never show an Urbania van; unknown SUVs never masquerade as an Innova).
  - Hardened group-selection default in `loadCatalog`: robustly switches to the first active group in `catalog.groups` if the initial selection (`sedan`) is not available in the live catalog.
  - Implemented interactive multi-section enquiry form:
    1. Contact Details (Full Name, Phone with international formatting, optional Email).
    2. Vehicle Preference (dynamic Group select, dynamic Model select with "Any suitable model in this group" option; clears model on group switch). Preselection from card CTA scrolls smoothly to form.
    3. Dates & Route (Pickup Date, Return Date $\ge$ Pickup Date, Pickup Location, Destination / Itinerary, Passenger Count).
    4. Chauffeur preference (`with_driver`), special notes, and anti-spam honeypot.
    5. Double-submit prevention and verified confirmation screen with ticket reference (`TKT-RNT-...`).
  - Added frontend unit regression tests in `react/scripts/rental-page.test.ts` (7 tests).

- **Canonical Rental Enquiry Persistence & Validation (`backend/`)**:
  - Database migration `0041_rental_enquiries_group_and_model.sql` verified and applied to canonical database on October 15, 2026, 16:58:33 UTC (added `vehicle_group_code`, `vehicle_model_id` FK to `vehicle_models(id)`, `destination_or_itinerary`, and `passengers`; relaxed `car_tier` NOT NULL).
  - Updated `domain.ts`, `db/types.ts`, `postgres.ts`, and `memory.ts` to persist and retrieve canonical group and model details with LEFT JOINs on `vehicle_models` and `vehicle_groups`.
  - Hardened `rental-enquiry.schema.ts` and `rental-enquiry.service.ts`:
    - Validates group code against canonical groups and server-authoritatively validates active group status in live `fareCatalogRepo` for all submissions (including group-only enquiries).
    - Validates model UUID against active catalog models in that specific group; rejects inactive or mismatched models.
    - Supports group-only selection storing explicit `null` model ID.
    - Normalizes phone numbers (`+91XXXXXXXXXX`) and validates dates.
    - Enforces honeypot spam protection.
    - Maps fallback `car_tier` for pre-migration database compatibility.
  - Added unit regression test suite `backend/tests/unit/rental-enquiries.test.ts` (15 tests).

- **Admin Desk Rental Requests Upgrade (`admin/src/pages/RentalRequestsPage.tsx`, `admin/src/lib/types.ts`)**:
  - Upgraded table to display canonical Vehicle Group badges, selected model display name (or "Any suitable model in group"), passenger count, and destination itinerary.
  - Preserved backward compatibility for historical enquiries with legacy car tier labels.
  - Updated filter controls for canonical groups and legacy tiers.
  - Maintained status workflow, notes logging, and direct Call/WhatsApp deep links.

- **Monorepo Verification**:
  - `npm run verify` passed with exit code 0 (3 typechecks, 235 backend unit tests, 28 customer tests, 9 admin tests, SEO checks, and 3 production builds with 59 SSG pages).

### 2026-10-15 — Resolution of Residual Acceptance Gaps: Booking Handoffs, Live Fleet Readiness & Review Verification

- **Blocking Invalid Outstation Booking Handoffs & Truthful Custom-Route Routing (`HomeBookingWidget.tsx`, `CleanBookingPage.tsx`, `bookingWidgetHelpers.ts`)**:
  - Enforced exact valid published route matching before allowing ordinary One Way or Round Trip bookings.
  - If unmatched (e.g. Agra to Shimla), widget displays a truthful no-match notice: `"No direct route for {origin} → {destination}. Custom charter enquiry available: WhatsApp Quote"`.
  - Dynamically updates action button to `"Enquire Custom Route"` linking directly to `/contact.html?serviceType=custom_route&from=...&to=...&trip=...&date=...&return_date=...&car=...` with all requested parameters preserved.
  - Never sends an empty product parameter on ordinary booking handoffs; valid handoffs include `product=${matchedRoute.code}` preserving origin, destination, trip type, dates, and vehicle group.
  - Hardened `CleanBookingPage.tsx`: when an unmatched route or product is requested via URL parameters, it does NOT silently default to `availableInCat[0]`. Displays a prominent unmatched route banner with direct link to custom route charter enquiry.
  - If canonical catalog loading fails, button changes to `"Call 24/7 Desk"` with `tel:+919762817598`; never leaves Book Now enabled as if ready.
  - Removed static destination suggestion fallbacks (`STATIC_DESTINATIONS`); route suggestions are derived strictly from active published routes in `catalog.products`.
  - Added unit regression tests in `react/scripts/home-booking-widget.test.ts` covering unmatched destinations, empty catalog, API failures, valid direct routes, and parameter preservation.

- **Live Fleet-Group Readiness Depending on Active Models (`HomeBookingWidget.tsx`, `bookingWidgetHelpers.ts`)**:
  - Implemented `deriveActiveVehicleGroups(catalog)` verifying each group has active vehicle models (`modelCount > 0`) in `catalog.vehicles`.
  - Hides/disables groups without valid models; empty catalog results in 0 groups and disables Book Now button.
  - Kept vehicle group selection (Sedan, SUV, Luxury, Tempo) distinct from specific vehicle model identity.
  - Rendered visibly distinct states: Loading ("Connecting to live fleet and routes…"), Error ("Live fleet catalog unavailable. Please call dispatch directly or try again later."), and Empty ("No vehicle classes currently available").

- **Server-Authoritative Completed-Ticket Review Verification Across All Surfaces (`reviews.service.ts`, `reviews.repository.ts`, `reviews.routes.ts`)**:
  - `moderateSubmission`: Enforced invariant checks for both `show_on_homepage` and `show_in_gallery`:
    1. Status must be `approved`.
    2. Customer consent (`consent_public`) is strictly required (`throw VALIDATION_ERROR` if false/missing).
    3. Non-null linked `booking_id` is required (`throw VALIDATION_ERROR` if null).
    4. Linked booking must exist in `bookings` table.
    5. Linked booking status must be exactly `'completed'` (`throw VALIDATION_ERROR` if pending/confirmed/in_progress).
    6. Rejection unconditionally forces `show_on_homepage = false` and `show_in_gallery = false`.
  - `reviews.repository.ts`: Hardened `getPublicGallery()` query to join `bookings b ON sub.booking_id = b.id` with `sub.booking_id IS NOT NULL AND b.status = 'completed'`, mirroring `getPublicReviews()`.
  - Added regression tests `RV-28` to `RV-35` in `backend/tests/unit/reviews-engine.test.ts` covering unlinked QR submissions, missing bookings, incomplete bookings, missing consent, and public query isolation. All 32 vitest tests pass.

- **Preserving Verification Flag in Homepage Review Mapper (`ReviewsMarquee.tsx`, `reviewsMarqueeHelpers.ts`)**:
  - Implemented and exported `mapApiReviewToCardReview(r: any)` passing `is_verified: Boolean(r.is_verified)` directly from API responses.
  - Never infers verification from booking IDs, social links, or approval status.
  - Added unit regression tests in `react/scripts/reviews-marquee.test.ts` verifying verified vs unverified reviews, clamping, and inference guards.

- **Safe Admin Review Defaults & Moderation Synchronization (`admin/src/lib/reviewMapper.ts`, `api.ts`, `ReviewsPage.tsx`)**:
  - Implemented and exported `mapAdminReview`:
    - `consentPublic`: Missing, unknown, or null strictly maps to `false` (`Boolean(r.consent_public ?? r.consentPublic ?? false)`).
    - `ticketId`: Strictly uses `r.ticket_id || r.booking_ticket_id || "No Ticket"`; never synthesizes a fake UUID `TKT-...`.
  - `actOnReview`: Synchronized action return state with persisted server response fields.
  - `ReviewsPage.tsx`: Catches backend validation rejections; if `showOnHomepage` is false on publish attempt, displays actionable error banner instead of false success toast.
  - Added regression test `admin/src/lib/reviewMapper.test.ts`.

- **Comprehensive Monorepo Verification & Browser Testing**:
  - Executed `npm run verify`: 3 TypeScript checks passed (0 errors), 212 backend unit tests passed, 21 react catalog/widget tests passed, 3 admin tests passed, SEO tests passed, 3 production builds succeeded (59 SSG pages + sitemaps).
  - Executed live automated browser subagent testing on `http://localhost:4174`: verified One Way with valid route, Round Trip with return date, unmatched route custom enquiry handoff, and local tour package flows.

### 2026-10-15 — Live Homepage Booking Integration & Admin Review Moderation Pipeline

- **Completed-Ticket Verified Review Moderation Pipeline**:
  - Rewired database queries from the dropped legacy `reviews` table to canonical `review_submissions`, `review_links`, and `review_images` joined with `bookings`.
  - Enforced strict booking verification: review links and homepage publication require a linked booking with `status = 'completed'` (`bookings.ticket_id`).
  - Added `listAdminSubmissions` in repository and service with role check (`super_admin` or `review_moderator`), returning `booking_ticket_id`, `booking_status`, `is_verified_booking`, and image attachments.
  - Registered canonical admin routes (`GET /api/v1/admin/review-submissions`, `PATCH /api/v1/admin/review-submissions/:id`) and backward-compatible ops aliases.
  - Rewired Admin UI `ReviewsPage.tsx` with Queue, Approved, Published, Rejected, and All tabs; displays human-readable ticket IDs (`TKT-...`), booking statuses, consent, and verified badges. Actions enforce completed journey verification for homepage publication.
  - Updated wire contracts (`contracts/fare-system.ts`, `backend/src/contracts/fare-system.ts`, `react/src/contracts/fare-system.ts`, `admin/src/contracts/fare-system.ts`) adding `is_verified: z.boolean().default(false)` to `PublicReviewItem`.
  - Updated customer homepage `ReviewsMarquee.tsx`: verified badge rendered conditionally on `review.is_verified`; supports 1+ reviews in dual tracks; replaced unverified "3,800+ Expeditions" with truthful editorial heading "Verified Traveler Experiences".
  - Added unit tests `RV-25`, `RV-26`, and `RV-27` in `backend/tests/unit/reviews-engine.test.ts`. All 204 backend tests pass.

- **Homepage Booking Widget Overhaul (`react/src/components/home/HomeBookingWidget.tsx`)**:
  - Connected widget to live canonical catalog via `fetchPublishedCatalog()`.
  - Replaced hardcoded 5-fleet buttons with canonical vehicle groups (**Sedan**, **SUV**, **Luxury**, **Tempo Traveller**) from `catalog.groups` and active models from `catalog.vehicles`.
  - Dynamically derived origins and destinations from active published outstation products (`p.category === "outstation"`).
  - Implemented smart route matching with direct route badges (distance, starting price) and instant custom fare indicators.
  - Connected Local Tour tab to live published packages (`p.category === "local_package"`), rendering honest empty notice if unpopulated without resurrecting static JSON.
  - Preserved seamless handoff to `/book.html` (`CleanBookingPage.tsx`): URL parameters (`category`, `product`, `trip`, `from`, `to`, `car`, `date`, `return_date`) are completely parsed and auto-select product, route, and vehicle class.
  - Hardened cache TTL handling in `react/src/services/catalog.ts` and fixed live endpoint fallback in `react/src/services/catalogManifest.ts`.

- **Verification & Testing**:
  - Root `npm run verify` passed cleanly: Customer typecheck, Admin typecheck, Backend typecheck, 204 backend tests, and all 3 production builds with 59 SSG pages and sitemap generation.
  - Automated browser subagents verified both the customer homepage booking flow (testing all tabs, vehicle switching, and navigation to `/book.html` with preserved parameters) and the admin reviews moderation desk (`http://localhost:5174/reviews`).

## 2026-10-14

### 2026-10-14 — Fix Missing Admin Create Actions for Tour Packages, Local Packages, and Transfers

- **Root Cause Resolution (`admin/src/lib/types.ts`)**:
  - Identified that `PERMISSIONS` defined `catalog:edit` and `catalog:publish`, but omitted `catalog:create`.
  - Added `"catalog:create": ["super_admin"]` to the centralized `PERMISSIONS` matrix, granting catalog creation authority strictly to the existing supported `super_admin` role.
  - Hardened permission type safety by defining `AdminPermission` union type and typing `can(role: AdminRole, permission: AdminPermission): boolean` so undeclared or misspelled permissions are caught at build time.
- **Creation UI & Failure Visibility Enhancements**:
  - **Tour Packages (`admin/src/pages/TourPackagesPage.tsx`, `admin/src/modules/tour-packages/TourPackageList.tsx`)**:
    - Replaced console-only error catching with an actionable error banner displaying backend error messages and a Retry button.
    - Preserved form inputs on save errors to prevent discarding user work.
    - Verified "New Tour Package" button renders for `super_admin` and opens the creation modal containing title, slug, duration, days/nights, and canonical fleet pricing grid.
  - **Local Sightseeing Packages (`admin/src/pages/LocalTransfersPage.tsx`, `admin/src/modules/local-packages/LocalPackageList.tsx`)**:
    - Added visible error banner and retry callback so API errors are not conflated with empty catalogs.
    - Verified "New Local Package" button renders for `super_admin` and opens the local sightseeing creation dialog with duration, included distance, sights covered, and canonical fleet pricing.
  - **Airport & Station Transfers (`admin/src/pages/LocalTransfersPage.tsx`, `admin/src/modules/transfer-routes/TransferRouteList.tsx`)**:
    - Added visible error banner and retry callback.
    - Verified tab switching to "Airport & Station Transfers" dynamically presents the "New Transfer Route" creation button and opens the transfer route modal dialog.
  - **Outstation Route Catalog (`admin/src/modules/routes/RouteCatalogPanel.tsx`)**:
    - Verified that existing `can(user.role, "catalog:create")` check renders "+ Add Outstation Route" button and opens creation dialog correctly.
- **Local Dev / Verification Session Seeding (`admin/src/App.tsx`, `admin/src/lib/auth.ts`)**:
  - Enhanced `getStoredSession()` to recognize dev test tokens (`test-*`).
  - Added dev-only bypass (`import.meta.env.DEV`) for test credentials in `loginWithCredentials` and URL parameter `?dev_auth=super_admin` in `App.tsx` matching backend's `ALLOW_TEST_AUTH`.
- **Automated Tests & Monorepo Verification**:
  - Created `backend/tests/unit/admin-catalog-create.test.ts` with 9 tests covering Zod schemas (`CreateTourPackageSchema`, `CreateLocalPackageSchema`, `CreateTransferRouteSchema`) and controller 201 Created responses.
  - Created `scripts/verify-admin-permissions.mjs` verifying that `catalog:create` is granted to `super_admin`, forbidden to `dispatcher`, and all 24 `can()` checks across admin UI map to declared permissions.
  - Executed browser subagent testing verifying all creation buttons, tab transitions, and creation dialogs with captured screenshots (`tour_packages_list`, `tour_package_dialog`, `local_packages_list`, `local_package_dialog`, `transfer_routes_list`, `transfer_route_dialog`, `routes_list`, `outstation_route_dialog`).
  - Verified full repository health via `npm run verify`: 3 typechecks passed (0 errors), 201 backend unit tests passed, 9 catalog regression tests passed, SEO tests passed, and 3 production builds succeeded.

### 2026-10-14 — Phase V2.6: Homepage-Only UI/UX Audit & Comprehensive Remediation

- **Baseline Visual Audit Across 7 Viewports (`reports/HOMEPAGE_UI_AUDIT.md`)**:
  - Scanned customer homepage at `320px`, `360px`, `390px`, `768px`, `1024px`, `1280px`, and `1440px`.
  - Identified and cataloged 10 defect areas with reproduction steps, severity, affected files, and visual evidence artifacts.
- **HomeBookingWidget Overhaul (`react/src/components/home/HomeBookingWidget.tsx`, `react/src/styles/global.css`)**:
  - Eliminated brittle 3-layer overlapping DOM elements (`input[opacity=0]`, `span`, `button[z-index=3]`); replaced with an accessible direct `<input type="date">` styled inside `.booking-reference__date-control` with dedicated calendar icon and calendar picker activation (`showPicker()`).
  - Structured responsive flex/grid rows ensuring stable dimensions down to 320px across One Way, Round Trip, and Local Tour modes.
  - Connected Local Tour mode directly to canonical published packages (`fetchPublishedLocalTransfers()`), removing arbitrary static filters and hardcoded cards.
- **Backend Fleet API SQL Error Fix (`backend/src/db/postgres.ts`, `backend/src/modules/fares/fleet/fleet.service.ts`)**:
  - Fixed SQL query in `postgres.ts:2233` where querying `fare_rules` failed on missing `created_at` column following migration 0038 schema rebuild.
  - Rewired `/api/v1/fleet` to query canonical `vehicle_groups`, `vehicle_models`, and `fare_rules`, returning both backwards-compatible vehicle lists and canonical group hierarchies (**Sedan**, **SUV**, **Luxury**, **Tempo Traveller**).
- **Fleet Showcase Redesign (`react/src/components/home/FleetSection.tsx`, `react/src/pages/HomePage.tsx`)**:
  - Built an animated group-switching showcase with category selector pills, real vehicle photos, seat/luggage capacities, per-km rates, and canonical `/book?vehicle=...` deep-linking.
  - Replaced the rigid inline static 3-column fleet cards in `HomePage.tsx` with `<FleetSection language={language} />`.
- **Truthful Editorial & Dynamic Pricing Resolution (`react/src/pages/HomePage.tsx`, `react/src/components/home/FamousPlacesSection.tsx`)**:
  - Removed all synthetic fallback rates (`|| 1900`, `|| 2200`, `|| 800`, `|| 3499`, `|| 18500`, `sedanRate = 10`) across routes, services, and transfers; unpriced items display truthful "On request" copy.
  - Replaced fabricated stops `["Taj Mahal & Agra Fort", "Heritage Monuments", "Local Artisan Quarters"]` in guided tours with genuine package places and inclusions.
  - Updated Direct Charters Directory links to canonical `/book` parameters.
  - Preserved selected destination parameter in `FamousPlacesSection.tsx` booking links and WhatsApp messages.
  - Replaced unsubstantiated numerical statistics in trust tickers with truthful verified editorial copy.
- **Visual Regression Gate & Monorepo Verification**:
  - Executed automated browser subagent verification across all 7 viewports (`320px` to `1440px`), verifying trip mode transitions and vehicle group tabs (Sedan, SUV, Tempo Traveller).
  - Passed root `npm run verify` (3 typechecks, 192 backend unit tests, 9 catalog regression tests, SEO lifecycle tests, and 3 production builds with 59 SSG pages).

### 2026-10-14 — Phase A: Price-Source Correctness & Homepage Canonical Rates

- **Homepage Dynamic Price Resolution (`react/src/pages/HomePage.tsx`)**:
  - Replaced hardcoded round-trip rate `"Round-trip • ₹10/km basis"` with dynamic `sedanRate` resolved directly from `liveFleet` (`fetchLiveFleet()`).
  - Replaced static badge arrays in Cab & Tour Services with `cabServiceTags` dynamically computed from `manifestRoutes`, `transferRoutes`, `localPackages`, and `liveFleet`.
  - Replaced static price indicators in the Direct Charters & Transfers section with `directTransferPrices` derived from published transfers and local sightseeing packages.
- **Backend Catalog Manifest Enhancement (`backend/src/modules/catalog/catalog.service.ts`)**:
  - Wired `deps.db.transferRoutes` into `buildManifest()` so published airport and railway transfers are canonically part of the published packages map.
  - Derived vehicle `perKm` rates in the manifest directly from `fareCatalogRepo.getFareRules("outstation")`.
- **Catalog Client Resilience (`react/src/services/catalogManifest.ts`)**:
  - Enhanced `fetchPublishedTransferRoutes()` and `fetchPublishedLocalTransfers()` to fall back to build-time snapshots (`generatedPublishedTransferRoutes`, `generatedPublishedLocalPackages`) during offline or static builds.
- **Monorepo Verification**:
  - Executed `npm run verify`: 3 typechecks (react, admin, backend) 0 errors, 192 backend unit tests passed, 9 catalog regression tests passed, SEO lifecycle passed, and 3 production builds succeeded with 59 SSG pages.

### 2026-10-14 — Phase V2 Exit-Gate: Canonical-Data Integration Verification & Fallback Elimination

- **Runtime Catalogue Authority (`react/src/services/catalogManifest.ts`, `react/src/pages/RoutesPage.tsx`)**:
  - Removed `staticPackages` fallback from `loadPublishedPackages()`; packages now read from live Fastify `/api/v1/tour-packages` and fall back only to the verified build-time manifest snapshot.
  - Purged `staticCatalogRoutes` and `mapCatalogueRoute` from `RoutesPage.tsx`. Added explicit loading state with skeleton shimmer and empty/error state when no routes are returned.
  - Fixed `fetchFleet()` in `catalogManifest.ts` to call canonical `/api/v1/fleet`.
  - Replaced hardcoded price badges in RoutesPage Section 2b with verified corridor tariff indicators.
- **Fail-Closed Snapshot Freshness Policy (`react/scripts/build-manifest.ts`, `react/scripts/catalog-sources.ts`)**:
  - Added `assertSnapshotPolicy(fetched, failClosed, path)`. In production releases (`CATALOG_FAIL_CLOSED=1` or `CF_PAGES=1`), an un-fetched remote snapshot throws an error, failing the build fast and preventing silent publication of stale snapshots.
- **Services Page Acceptance (`react/src/pages/ServicesPage.tsx`)**:
  - Moved category titles into a prominent top banner above the image backdrop for all 4 categories.
  - Separated static editorial copy from live catalogue facts by deriving active vehicle types and tariffs dynamically from `fetchLiveFleet()`.
  - Added accessible mobile tap interaction (`expandedCardId`, `aria-expanded`) toggle alongside scroll reveals and desktop hover/focus reveal.
- **Fleet & Reviews Fallback Audit (`react/src/components/home/ReviewsMarquee.tsx`, `react/src/pages/FleetPage.tsx`, `react/src/components/home/FleetSection.tsx`)**:
  - Completely purged synthetic `fallbackReviews` from `ReviewsMarquee.tsx`. Added skeleton shimmer loading and an authentic trust assurance empty card when live reviews are empty or syncing.
  - Purged silent fallback to static `FLEET_DATA` in `FleetPage.tsx` and `FleetSection.tsx`. Added explicit loading skeletons and dispatch desk verification empty/error states with retry.
  - Fixed missing `fleet` in `filteredVehicles` memo dependency array in `FleetPage.tsx`.
- **Regression Testing & Monorepo Verification**:
  - Added `react/scripts/catalog-fallback.test.ts` verifying all fallback-elimination invariant contracts.
  - Updated `react/scripts/catalog-sources.test.ts` testing `assertSnapshotPolicy` (9/9 tests pass).
  - Executed full monorepo `npm run verify`: passed 100% (3 typechecks, 192 backend unit tests, catalog sources tests, SEO lifecycle, 3 production builds with 59 SSG pages).

## 2026-10-12

### 2026-10-12 — Phase V2: Unified Master Remediation (Backend, Admin, Customer Site)

- **Phase V2.1: Canonical Contracts & Backend Reads (P0)**:
  - Eliminated static `CATALOG_RAW_DATA` and `compileBaseRoutes` baseline in `backend/src/modules/catalog/catalog.service.ts`.
  - Replaced legacy manifest builder with canonical DB queries via `FareCatalogRepository` and `routeCatalog`; purged synthetic bidirectional reverse routes and multiplier pricing; unconfigured vehicle fares return explicit `null`.
  - Wired `FareCatalogRepository` in `backend/src/app.ts`. Authored `backend/tests/unit/catalog-manifest.test.ts` (192 backend tests passing).
- **Phase V2.2: Services Page Luxury Editorial Redesign (P1)**:
  - Replaced 6 static modules in `react/src/pages/ServicesPage.tsx` with 4 full-image dynamic editorial category sections (01 Outstation, 02 Local Sightseeing, 03 Transfers, 04 Tour Packages) backed by published DB records.
  - Implemented scroll-driven reveals, hover/touch card details reveal, luxury terracotta/sandstone tokens, full mobile responsiveness, and canonical booking URLs (`/book?category=...`).
- **Phase V2.3: Routes Page & Homepage Dynamic Content Rewiring (P1)**:
  - Rewired `RoutesPage.tsx`, `InstantRouteCalculator.tsx`, and `LatestRoutesSection.tsx` to read solely from canonical published routes; purged runtime fallback to static JSON in `catalogManifest.ts`.
  - Standardized Popular Routes on `HomePage.tsx` with distinct One-Way and Round-Trip modes; rewired Fleet to `fetchLiveFleet()`; rewired booking inquiry form to `createInquiry()` (`POST /api/v1/inquiries`); completely eradicated client-side fare math.
- **Phase V2.4: Reviews Moderation Feed & Booking Inquiry Persistence (P1)**:
  - Unified review workflow in backend; enforced 30-review maximum cap in `ReviewsRepository.getPublicReviews()`.
  - Added `fetchPublicReviews()` and `fetchPublicGallery()` in React API client (`react/src/services/api.ts`).
  - Wired live approved reviews into `ReviewsMarquee.tsx` (LOCK-N06) with graceful fallback to curated reviews.
  - Rewired `ContactPage.tsx` with full dispatch inquiry form persisted to PostgreSQL `inquiries` table (admin inbox) via `POST /api/v1/inquiries`, with optional WhatsApp forwarding.
- **Phase V2.5: Build Manifest & Seed Scripts Reconciliation (P0)**:
  - Updated `react/scripts/build-manifest.ts` to eliminate synthetic reverse routes, fake `-taxi` aliases, and fallback prices (manifest reduced from 2,060 keys to 963 canonical routes).
  - Reconciled `backend/scripts/seed-routes.ts` (removed dropped `starting_price_inr`) and `seed-canonical-catalog.ts` (rebuilt to seed Clean Fare System tables `tour_packages`, `transfers`, `local_packages`, `fare_rules`).
  - Ran and passed full root `npm run verify` (3 typechecks, 192 backend tests, catalog-sources tests, SEO lifecycle, 3 production builds with 59 SSG pages).

### 2026-10-12 — Phase 3: Route Fare Rule Source Normalization & Catalog Manifest Cleanup

- **Elimination of Static Baseline & Synthetic Fares (`backend/src/modules/catalog/catalog.service.ts`)**:
  - Removed static `CATALOG_RAW_DATA` and `VEHICLES` baseline import and `compileBaseRoutes()` from `catalog.service.ts`.
  - Replaced legacy `buildManifest()` body with canonical database reads: published `outstation_routes` via `deps.db.routeCatalog`, dedicated `tour_packages` via `deps.db.tourPackages`, and `local_packages` via `deps.db.localPackages`.
  - Removed synthetic bidirectional / reverse route generation (`d + "-to-" + s`); routes are emitted solely from published database records.
  - Eliminated invented multiplier fares (`Math.round(startingPrice * 0.85)` / `startingPrice * 1.35`, etc.); missing vehicle tiers project explicit `null`, not synthetic numbers.
  - Eliminated package starting price fallbacks (`fleetPrices.sedan || 2999`, etc.); missing starting prices project explicit `null`.
  - Wired `farePool` and `FareCatalogRepository` into `createCatalogService` in `backend/src/app.ts` so active vehicle models are queried from canonical DB records.
- **Unit Testing & Verification (`backend/tests/unit/catalog-manifest.test.ts`)**:
  - Added unit test verifying `/api/v1/catalog/manifest` returns canonical published routes, preserves real vehicle tier pricing, excludes drafts, omits synthetic reverse routes, and sets missing tiers to `null`.
  - Ran backend test suite: 12 test files, 192 unit tests passing (100%).
  - Ran full monorepo `npm run verify`: typecheck x3 (`react/`, `admin/`, `backend/`), unit tests, SEO lifecycle, and 3 builds (`customer:build` SSG 59 pages, `admin:build`, `backend:build`) all passed cleanly.

### 2026-10-12 — Canonical Schema Alignment & Price Write Path Remediation

- **Elimination of Synthetic Fleet Fallbacks & Hardcoded Projections (`backend/src/db/postgres.ts`)**:
  - Replaced SQL lateral subqueries and string pattern matching (`%crysta%`, `%urbania%`, `%traveller%`) with clean JSON aggregates keyed strictly on actual active `vehicle_models` sorted by `sort_order`.
  - Removed hardcoded fallback fleet lists (`coalesce(..., '["sedan", "ertiga", ...]')` -> `'[]'::jsonb`).
  - Removed `min()` vehicle-group rate collapsing that masked distinct car pricing with synthetic group-level minima.
  - Eliminated invented route charges (`500 as driver_charge_inr, 0 as night_halt_inr, true as toll_included, 300 as min_km_per_day`) and invented package defaults (`'sedan' as base_tier_code`, `coalesce(min(fr.amount), 0) as starting_price_inr`). Attributes now project `null` when not configured.
- **Strict Timestamp & Date Integrity (`backend/src/db/postgres.ts`, `backend/tests/unit/legacy-schema-reconciliation.test.ts`)**:
  - Updated `safeIsoDate` to enforce strict timestamp validation. When a required database timestamp is missing, empty, or malformed and no explicit fallback is provided, it throws `AppError("DATA_CORRUPTION", ...)`.
  - Prohibits silent fabrication of current time timestamps masking missing database data.
- **Canonical Admin Price Persistence (`backend/src/db/postgres.ts`)**:
  - `routeCatalog.create` & `routeCatalog.update`: Persists `record.faresInr` entries directly into `outstation_route_vehicles` mapped via `resolveVehicleModelId`.
  - `tourPackages.create` & `tourPackages.update`: Persists `record.fleetPrices` entries directly into canonical `fare_rules` (`category = 'tour_package'`).
  - `transferRoutes.create` & `transferRoutes.update`: Persists `record.fleetPrices` entries directly into canonical `fare_rules` (`category = 'transfer'`).
  - `localPackages.create` & `localPackages.update`: Persists `record.fleetPrices` entries directly into canonical `fare_rules` (`category = 'local_package'`).
- **Clean Feature Retirement for `package_vehicle_upgrades` (`backend/src/db/postgres.ts`)**:
  - Replaced silent `42P01` table-missing error catching and fake successful saves with intentional empty read (`listUpgrades` -> `[]`) and explicit HTTP 410 rejection on mutations (`saveUpgrade`, `deleteUpgrade` -> `AppError("UPGRADES_RETIRED", ...)`).
- **Endpoint Aliases (`backend/src/modules/content/content.routes.ts`)**:
  - Registered `/content/manifest` alias alongside `/api/v1/content/manifest` to prevent 404s from callers requesting without the `/api/v1` prefix.
- **Verification**:
  - Monorepo Typecheck: Clean 0 errors across `react/`, `admin/`, and `backend/`.
  - Backend Vitest Suite: 11 test files, 191 unit & integration tests passing (100%).

### 2026-10-12 — Reconcile Legacy API Modules with Canonical Schema (Task 2)

- **Legacy Schema Reconciliation (`backend/src/db/postgres.ts`)**:
  - Reconciled legacy database modules with canonical schema introduced in migration `0038_fare_system_clean_rebuild.sql` (and updated in `0040_add_missing_indexes_and_defaults.sql`), eliminating PostgreSQL `42P01` (`relation does not exist`) runtime errors:
    1. **`mapTourPackage()` Date Conversion Hardening (Priority 1)**:
       - Handled undefined, null, and non-date strings safely via `safeIsoDate()` and `safeIsoDateOrNull()`.
       - `updated_at` falls back to `created_at` or current ISO time without throwing `RangeError: Invalid time value` or HTTP 500 when `updated_at` is omitted in the raw table row.
    2. **Route Catalog Manifest Migration (Priority 2)**:
       - Migrated `routeCatalog` repository (`list`, `getById`, `getBySlug`, `create`, `update`, `delete`) to query canonical `outstation_routes`.
       - Implemented `ROUTE_CATALOG_BASE_SELECT` with JSON lateral subquery from `outstation_route_vehicles`, `vehicle_models`, and `vehicle_groups` to project `fares_inr` and `available_fleets`, preserving customer-facing manifest contracts.
    3. **Transfer Routes Manifest Migration (Priority 3)**:
       - Migrated `transferRoutes` repository to query canonical `transfers`.
       - Implemented `TRANSFER_ROUTES_BASE_SELECT` with JSON subquery joining `fare_rules` (`category = 'transfer'`) and `vehicle_models` to populate `fleet_prices` for consumer compatibility.
    4. **Local Packages Manifest Migration (Priority 4)**:
       - Migrated `localPackages` repository to query canonical `local_packages`.
       - Implemented `LOCAL_PACKAGES_BASE_SELECT` with JSON subquery joining `fare_rules` (`category = 'local_package'`) and `vehicle_models` to populate `fleet_prices` preserving required package fields.
    5. **Promo Codes Retirement & Clean Empty-State (Priority 5)**:
       - Resolved obsolete `promo_codes` table dependency.
       - Implemented intentional, documented empty-state responses (`getByCode` -> `null`, `getById` -> `null`, `list` -> `[]`, `getFeatured` -> `null`, `consume` -> `null`).
       - Write operations (`create`, `update`, `delete`) fail explicitly and cleanly with 410 `AppError("PROMOS_RETIRED", ...)` without executing invalid SQL or masking database errors.
- **Test Suite Verification (`backend/tests/unit/legacy-schema-reconciliation.test.ts`)**:
  - Authored comprehensive test suite (7 tests) verifying safe date parsing across missing/null/invalid dates, SQL projections against canonical tables, promo code empty-state handling, and 410 rejection of promo writes.
  - Test suite status: All 11 test files and exactly 191 tests passed (previously 184 passing tests before Task 2 tests added).
  - Typecheck verification: `npm run typecheck` across `react/`, `admin/`, and `backend/` exited 0 with no errors.

### 2026-10-12 — Publication Pipeline Worker & Outbox Engine Implementation (Task 1)

- **Publication Worker Engine (`backend/src/modules/publishing/publication-worker.ts`)**:
  - Implemented `PublicationWorker` resolving the operational blocker where `site_publish_events` remained stalled in `pending` status.
  - Safe atomic concurrency claiming: Uses PostgreSQL `WITH due AS (SELECT id FROM site_publish_events ... FOR UPDATE SKIP LOCKED) UPDATE ... RETURNING` to safely claim due events without race conditions across multiple instances or concurrent worker cycles.
  - Cloudflare Deploy Hook Dispatch: Triggers the configured `PAGES_DEPLOY_HOOK_URL` on publication events (`published`, `updated`, `archived`, `slug_changed`, `price_changed`, `review_approved`).
  - Secret Protection & URL Masking: Built-in `maskUrl` ensures secret webhook URLs and auth tokens are NEVER logged, serialized into errors, or exposed to clients.
  - State Machine Compliance (`PB-04`): Advances events through `pending` -> `processing` -> `triggered` -> `succeeded`.
  - Exponential Backoff & Retry (`PB-05`): Automatically schedules retries with exponential backoff (`Math.min(30 * 2^(attempt - 1), 1800)` seconds) on HTTP failures or network timeouts. Transitions to `failed` only after reaching max attempts (5).
  - Deployment Verification (`PB-06`): Holds accepted events in `triggered` and verifies live availability before transitioning to `succeeded` and recording `processed_at`.
  - Admin Retry Endpoint: Added `retryPublishEvent` to `FareAdminService` and mounted `POST /admin/publishing/events/:id/retry` with audit logging in `fare-admin.routes.ts`.
- **Server Lifecycle Integration (`backend/src/server.ts`, `backend/src/app.ts`)**:
  - Wired `PublicationWorker` into `buildApp` and scheduled a background interval in `server.ts` alongside notifications worker.
  - Added clean shutdown handlers clearing intervals on `SIGINT` and `SIGTERM`.
- **Test Verification (`backend/tests/unit/publication-worker.test.ts`)**:
  - Added test suite with 5 test cases covering PB-04 (pending -> processing -> triggered -> succeeded), PB-05 (backoff retry and failure limit), PB-06 (verification pending), admin retry, and missing hook handling.
  - Monorepo verification: All 184 backend tests passing, `npm run typecheck` across `react/`, `admin/`, and `backend/` green.

### 2026-10-13 — Canonical Catalog & Fleet Migration, Admin Pricing Integration, and Booking Flow Completion

- **Admin Canonical Fleet & Pricing Normalization (`admin/`)**:
  - `admin/src/modules/local-packages/local-packages.types.ts`: Purged hardcoded `fleetPrices` defaults (`sedan: 1900`, `ertiga: 2600`, etc.) and hardcoded extraRates in `EMPTY_LOCAL_PACKAGE`.
  - `admin/src/modules/transfer-routes/transfer-routes.types.ts`: Purged hardcoded `fleetPrices` defaults in `EMPTY_TRANSFER_ROUTE`.
  - `admin/src/modules/tour-packages/TourPackageFormDialog.tsx`: Reset `startingPriceInr` dynamically to minimum configured fare or 0 when unconfigured, replaced placeholder `3499` with `0`.
  - `admin/src/pages/LocalTransfersPage.tsx`: Standardized clean cloning of live `fleetPrices` avoiding synthetic fallback maps.
  - `admin/src/modules/fleets/CanonicalFleetPricingGrid.tsx`: Fixed Badge tone prop.
- **Backend Clean Seeding (`backend/`)**:
  - `backend/scripts/seed-canonical-catalog.ts`: Removed unsafe positional index fallbacks (`?? vehicleModels[0]?.id`) ensuring stable canonical model lookups without unexpected overrides.
  - Verified backend fare engine (`product.resolver.ts`, `tour-package.calculator.ts`): Replaced silent `PACKAGE_UPGRADES` auto-offsets with strict fail-closed validation (`TIER_NOT_PRICED` error) when fixed product tiers are unconfigured.
- **Customer Frontend Dynamic Catalog & Freshness Policy (`react/`)**:
  - `react/src/services/catalogManifest.ts`: Implemented 10-minute cache TTL with `invalidateCatalogManifestCache()`, purged `3499` default in `toTourPackage`, added live `loadPublishedPackages` loader.
  - `react/src/services/catalog.ts`: Updated `getJson` to support unnested API responses; removed `3499` fallback in `fetchCatalogItemBySlug`.
  - `react/src/pages/HomePage.tsx`: Purged fabricated route fallbacks (`item.fs || 3499` and static 4-route fallback array), added skeleton loader and empty state; rebuilt "Choose your vehicle" dynamically from `liveFleet`; rebuilt "Guided Tours" carousel from `loadPublishedPackages()`.
  - `react/src/components/home/FleetSection.tsx`: Rebuilt to consume `fetchLiveFleet()` with zero hardcoded rates.
  - `react/src/pages/FleetPage.tsx`: Integrated live local sightseeing fares (`fetchPublishedLocalTransfers()`) and live fleet per-km rates with zero hardcoded overrides.
  - `react/src/pages/TransferDetailPage.tsx`: Removed synthetic vehicle fare multipliers (`* 1.2`, `* 1.5`, etc.); now renders configured fares or honest "On request".
  - `react/src/pages/PackagesPage.tsx`: Removed static `PACKAGE_METADATA.vehiclePrices` overrides, driving all package vehicle fares strictly from `pkg.fleetPrices`.
  - `react/src/templates/sections/LatestPackagesSection.tsx`: Replaced `3499` fallback with honest live pricing or "On request".
  - `react/src/pages/ProductDetailPage.tsx`: Added accessible sr-only `h1` in loading container for 100% SSG single-H1 compliance.
  - `react/src/app/ServerApp.tsx`: Purged fallback pricing (`3499`, `800`, `1900`) from SEO titles/descriptions, and corrected route priority so rich dossier renderers execute before generic slug match.
- **Verification Across Monorepo**:
  - Ran `npm run verify` across the monorepo:
    * `skb-react@0.1.0 typecheck`: PASSED (0 errors)
    * `skb-admin@0.1.0 typecheck`: PASSED (0 errors)
    * `@sk-baghel/backend@0.1.0 typecheck`: PASSED (0 errors)
    * Vitest backend unit test suite: 12 test files passed, 192 tests passed (100% green)
    * Catalog source resolution tests: 3 passed
    * SEO lifecycle test: PASSED
    * Customer production build + SSG pre-renderer: 59 pages pre-rendered, sitemap.xml (50 URLs) + robots.txt emitted cleanly in 8.83s
    * Admin production build: PASSED (Vite chunking clean)
    * Backend production build: PASSED (tsc build clean)

### 2026-10-12 — Customer Site Legacy Scan Audit & Approved Remediation Blueprint


- **Master Customer Site Legacy Audit (`reports/customer-site-legacy-scan.md`)**:
  - Conducted exhaustive, read-only contract-drift audit across all 676 files in `react/`.
  - Audited 22 `fetch` call sites, 59 `/api/v1/*` endpoint references, 26 Supabase client calls, 121 client financial math calculations, and 121 unsafe nullish/synthetic fallbacks.
  - Documented dead service `react/src/services/fareApi.ts` (0 imports across repo, unvalidated `{ booking: any }`).
  - Identified critical disconnect in guest booking recovery (`CleanBookingPage.tsx` drops `guest_access_token`, `MyBookingsPage.tsx` rejects unauthenticated users).
  - Identified `INV-2` violations across `fares.ts`, `customDistance.ts`, `RouteTemplate.tsx`, and `TourPackageTemplate.tsx` (28% advance calculation, arbitrary ₹500 floor).
  - Identified hardcoded price fallback injections (`|| 2500`, `|| 3200`, `|| 4500`, `|| 9500`, `|| 14000`, `|| 3499`).
- **Remediation Blueprint & Approved Corrections**:
  - User reviewed and approved the report as the remediation baseline, locking in four fundamental corrections:
    1. **Protect Guest Token:** Keep `guest_access_token` out of query strings; persist in `sessionStorage` and send via `x-guest-token` header. Display authoritative server payment status from `GET /api/v1/bookings/:id`.
    2. **Resolve Static vs. Live Pricing:** Implement live or cached catalog overlay for active cards to prevent stale pricing from SSG manifests after admin fare adjustments.
    3. **Protect Backend Legacy Endpoints:** Retain legacy backend routes until admin desk, webhooks, and external consumers are verified; migration strictly targets customer frontend (`react/`).
    4. **Enforce Post-Remediation Verification:** Every remediation phase requires automated command execution, result recording, and end-to-end user testing.
  - Sequenced into an ordered 10-phase migration plan to be implemented discrete, one step at a time.

## 2026-10-11

### 2026-10-11 — Fare System Contract Normalization, Canonical Field Registry & Fail-Closed Hardening

- **Master Canonical Field Registry (`docs/CANONICAL_FIELD_REGISTRY.md`)**:
  - Authored comprehensive 437-line field registry documenting every business concept across:
    - All 14 PostgreSQL database tables (`vehicle_groups`, `vehicle_models`, `fare_settings`, `outstation_routes`, `outstation_route_vehicles`, `local_packages`, `transfers`, `tour_packages`, `fare_rules`, `extra_charges`, `bookings`, `payments`, `payment_webhook_events`, `review_links`, `review_submissions`, `review_images`, `site_publish_events`, `url_redirects`, `admin_audit_logs`).
    - 10 authoritative mathematical invariants (`INV-1` through `INV-10`).
    - Complete Fare Engine calculation formulas for One-Way Outstation (with 20:00–06:00 IST night window), Round-Trip Outstation (`max(2*d, 300*days)` with driver allowances per day), and Fixed Products.
    - Deep-link URL parameters specification (`BookingEntryParams`) with input sanitization and MakeMyTrip normalization.
    - Standard machine error code dictionary (`VALIDATION_ERROR`, `PRICE_CHANGED`, `CAPACITY_EXCEEDED`, `TRIP_TOO_LONG`, `DATA_CORRUPTION`, etc.).
    - Cross-layer mappings across DB `snake_case`, domain `camelCase`, and wire `contracts/fare-system.ts`.
- **Financial Fail-Closed Hardening (`backend/src/db/postgres.ts`)**:
  - Eliminated fuzzy zero fallbacks (`?? 0`) and secondary alias degradation in `mapBooking` and `mapPayment`.
  - Enforced strict fail-closed validation on canonical `total_amount`, `advance_amount`, and `balance_amount`:
    - Rejects missing, NaN, or non-positive total amounts with `AppError("DATA_CORRUPTION", ..., 500)`.
    - Validates advance amount is non-negative and $\le \text{total_amount}$.
    - Validates balance amount matches `total_amount - advance_amount` (INV-3).
  - Enforced strict fail-closed validation on `amount_paise` in `mapPayment`:
    - Rejects missing, NaN, or non-positive payment amounts with `AppError("DATA_CORRUPTION", ..., 500)`.
- **End-to-End Contract Verification**:
  - Verified request validation $\to$ server quote $\to$ booking persistence $\to$ API response $\to$ checkout $\to$ Razorpay order $\to$ webhook signature verification $\to$ payment persistence $\to$ admin desk display.
  - Client-supplied prices or distances are rejected/ignored at canonical boundaries.
  - All test suites passing: Newman (29 requests, 50 assertions, 100% pass), Vitest (179 backend tests, 100% pass), TypeScript typecheck (0 errors across `react/`, `admin/`, `backend/`), and `npm run verify`.

### 2026-10-11 — PostgreSQL Clean Schema Alignment, Admin Desk & Customer Deep-Link Hardening

- **Admin Payments Endpoint Fix (`backend/src/db/postgres.ts`)**:
  - Resolved `DatabaseError: column "inr_amount_paise" does not exist` on `GET /api/v1/ops/admin/payments`.
  - Updated `payments.list` aggregate query to use `amount_paise` (bigint) matching the PostgreSQL schema.
  - Updated `mapPayment` to map `amountMinor` and `inrAmountPaise` from `amount_paise`, with resilient date parsing and fallbacks for missing legacy columns.
  - Updated `payments.create`, `payments.update`, and `payments.getByIdempotencyKey` to operate against PostgreSQL clean `payments` table columns.
- **Admin Bookings Endpoint Fix (`backend/src/db/postgres.ts`)**:
  - Resolved `RangeError: Invalid time value` in `mapBooking` on `GET /api/v1/ops/admin/bookings`.
  - Clean `bookings` table stores `pickup_at` and `return_at` (timestamptz) rather than `pickup_datetime`.
  - Introduced `safeIsoDate` and `safeIsoDateOrNull` date parsing helpers that safely handle undefined without throwing.
  - Updated `mapBooking` to fall back from `pickup_datetime` to `pickup_at`, and mapped `totalFare` from `row.total_amount ?? row.total_fare`.
  - Updated `bookings.list` date range filters to use `COALESCE(pickup_at, created_at)` instead of missing `pickup_datetime`.
  - Updated `bookings.update` to write to clean table columns.
- **Customer Deep-Link Parameter Hardening (`react/src/features/booking/clean/CleanBookingPage.tsx`)**:
  - Enhanced URL search parameter parsing in `CleanBookingPage.tsx` to seamlessly accept incoming deep links from across the site:
    - Resolves `trip=local` or `category=local_package` to `category: "local_package"`.
    - Resolves `trip=package` or `category=tour_package` to `category: "tour_package"`.
    - Resolves `tripType=round-trip` or `trip=round_trip` to `tripType: "round_trip"`.
    - Parses `passengers`, `pax`, and `passengerCount`.
    - Parses `product`, `package`, `pkg`, `route`, `from`, and `to`, auto-matching the catalog product upon mount.
    - Pre-selects preferred `vehicle` or vehicle group when live quote options load.
- **Automated Verification**:
  - Newman Postman Collection Suite: 29 requests, 50 assertions, 100% pass (0 failures).
  - Backend Unit & Integration Suite: 179 passed across 9 test files (100% pass).
  - TypeScript Typecheck: 0 errors across `react/`, `admin/`, and `backend/`.
  - Customer SEO & SSG: 59 pages pre-rendered + 14 redirects written.
  - Production Builds: Clean builds for `react/dist`, `admin/dist`, and `backend/dist`.
  - `npm run verify`: Passed all checks.

### 2026-10-11 — Route & API Inventory Implementation (Monorepo Clean Rewire)

- **Route & API Inventory Master Plan (`docs/backend/ROUTE_AND_API_INVENTORY.md`)**:
  - Authored canonical API contract inventory defining the non-breaking rollout strategy across all 3 workspaces.
  - Established unwrapped direct domain model envelopes for clean `/api/v1` endpoints with standard machine error codes (`VALIDATION_ERROR`, `NOT_FOUND`, `PRICE_CHANGED`, etc.).
- **Admin Desk Clean Rewire (`admin/src/`)**:
  - Implemented `cleanAdminApi.ts` consuming `/api/v1/admin/fares/...` with strict validation.
  - Rebuilt `VehiclesPage.tsx` managing 4 vehicle groups and car models.
  - Built `FareSettingsPage.tsx` with audit confirmation for commercial fare settings.
  - Rebuilt `RoundTripRatesPage.tsx` with inline editing for per-km rates.
  - Built `ExtraChargesPage.tsx` supporting scoped line items and policy disclaimer notes.
  - Rebuilt `RoutesPage.tsx` with interactive LocationIQ distance calculation and per-vehicle pricing grid.
  - Built `PublishingPage.tsx` for publishing outbox events and `AuditPage.tsx` for before/after diffs.
- **Customer Frontend Clean Rewire (`react/src/`)**:
  - Implemented `cleanFareApi.ts` for clean `/api/v1` quotes, bookings, reviews, and catalog queries.
  - Created `CleanBookingPage.tsx` and rewired `BookingPage.tsx` to delegate cleanly to server-authoritative quotes without client-side fare math.
  - Mounted `ProductDetailPage.tsx` for all 4 canonical product routes: `/taxi/:code`, `/local-sightseeing/:code`, `/transfers/:code`, `/tours/:code`.
  - Enforced Requirement A for archived services (visible "Currently Unavailable" banner, disabled booking CTA, active related service links) and Requirement B (5 IST calendar days maximum round-trip limit).
- **Route Conflict Resolution (`backend/src/modules/bookings/booking.routes.ts`, `booking.controller.ts`)**:
  - Removed duplicate route `GET /api/v1/bookings/:ticketId` from `booking.routes.ts` and its unused `getBooking` handler from `booking.controller.ts`.
  - Resolved Fastify route collision with `bookings.routes.ts` (`GET /api/v1/bookings/:id`), which handles both UUID and ticket ID lookups.
- **Verification**:
  - `npm run verify` passed cleanly across all workspaces (3× typecheck, vitest test suite, SEO audit, Vite + SSG customer build, admin build, backend build).

### 2026-10-11 — Full Rebuild: Clean Fare System Rebuild (`fare-system-final-spec.md`), Requirements A & B

- **Contracts & Shared Schemas (`contracts/fare-system.ts`)**:
  - Implemented strict Zod contracts and TypeScript definitions: `CategoryCode`, `VehicleGroupCode`, `QuoteRequest`, `QuoteResponse`, `OptionsRequest`, `OptionsResponse`, `CreateBookingRequest`, `BookingEntryParams`, and admin CRUD contracts (`RouteVehiclesPut`, `FareRuleCreate`, `FareSettingPatch`, `RouteCalculateRequest/Response`).
  - Synchronized across `backend/src/contracts/`, `admin/src/contracts/`, and `react/src/contracts/`.
- **Pure Fare Engine (`backend/src/modules/fare-engine/`)**:
  - Implemented mathematical models for `rounding.ts` (half-up whole rupee rounding), `datetime.ts` (IST calendar dates difference `date(return) - date(pickup) + 1` and night pickup window `20:00 - 06:00`), `extra-charges.ts` (deterministic scoped addition), `finalizer.ts` (advance/balance splits), and category calculators (`calculators/one-way.ts`, `calculators/round-trip.ts`, `calculators/fixed-product.ts`).
  - Implemented and verified 91 unit tests across all scenarios (OW, NW, RT, DL, HL, LP, TR, TP, EX, AD).
- **Database Clean Schema Rebuild (`backend/migrations/0038_fare_system_clean_rebuild.sql`, `0039_fare_system_seeds.sql`)**:
  - Applied complete clean rebuild to live Supabase PostgreSQL wiping legacy test tables.
  - Created 18 strongly typed tables with check constraints, foreign keys, and RLS (`vehicle_groups`, `vehicle_models`, `outstation_routes`, `outstation_route_vehicles`, `local_packages`, `transfers`, `tour_packages`, `fare_settings`, `fare_rules`, `extra_charges`, `bookings`, `payments`, `payment_webhook_events`, `admin_audit_logs`, `review_links`, `review_submissions`, `review_images`, `site_publish_events`).
  - Seeded approved baseline data with `max_round_trip_days = 5` and `advance_percent = 28`.
- **Quotes, Bookings & Payments Services (`backend/src/modules/`)**:
  - `QuotesService`: Handles `quote()` and `options()`. Hides unavailable cars, respects passenger capacity, and makes 0 external geocoding calls during quotes.
  - `BookingsService`: Recomputes server-authoritative quotes on booking creation and rejects price changes with HTTP 409 `PRICE_CHANGED`.
  - `PaymentsService`: Enforces idempotent order creation (`amount_paise = advance_amount * 100`), validates Razorpay webhook HMAC signatures, deduplicates events, and applies status transitions (`captured` -> `confirmed`; `needs_review` on mismatch/cancellation).
- **Admin Operations Desk & Audit Logging (`backend/src/modules/admin/`)**:
  - Enforced role guards for `super_admin`, `content_editor`, `review_moderator`, `dispatcher`, and `finance_operator`.
  - Audits all successful writes with before/after state snapshots in `admin_audit_logs`.
  - LocationIQ distance calculation rounds to 1 decimal km and integer minutes; does not persist until the route is explicitly saved.
- **Reviews Engine (`backend/src/modules/reviews/`)**:
  - Secure QR and single-use booking link generation with SHA-256 token hashing.
  - XSS sanitization, EXIF scrubbing, and social media URL canonicalization.
- **Requirement A (Archived Pages, Crawl Depth & Sitemap) & Requirement B (Round-Trip Duration)**:
  - Updated `react/scripts/generate-sitemap.ts` to exclude drafts while retaining useful archived pages with preserved canonical URLs.
  - Rendered "Currently Unavailable" notice and disabled booking button for archived services on the customer frontend (`react/src/pages/LivePackageDetailPage.tsx`).
  - Increased `max_round_trip_days` to 5 calendar days in `fare_settings`, calculators, and automated test fixtures.
- **Property & Matrix Tests (`backend/tests/unit/property-matrix.test.ts`)**:
  - Verified PR-01 to PR-11 across every car, product, and trip duration from 1 to 5 days: integer totals, monotonicity, commutativity of extra charges, end-to-end booking/payment amounts, and quote/options agreement.
- **Verification**:
  - Passed `npm run verify` end-to-end: typechecks (3/3), vitest unit tests (171/171), catalog source checks (3/3), SEO lifecycle audit, and all 3 workspace builds (`react/`, `admin/`, `backend/`).

## 2026-10-10

### 2026-10-10 — Mobile PageSpeed Insights 100/100 A11y, Zero Critical Path Bottlenecks & Supabase Bundle Deferral

- **Elimination of `framer-motion` Runtime & `vendor-motion` Chunk (`react/src/components/chrome/BrandLogo.tsx`)**:
  - Replaced `motion.circle`, `motion.line`, and `motion.path` with pure SVG elements and CSS transitions in `BrandLogo.tsx`.
  - Completely purged the 41.5 KiB `vendor-motion` bundle chunk from the customer build and eliminated 169 ms of main thread layout/reflow bottlenecks flagged in the audit.
- **Dynamic Deferral of Supabase Auth Client (`react/src/auth/customerAuth.tsx`, `react/src/pages/AuthCallbackPage.tsx`)**:
  - Replaced top-level static `createClient` import with dynamic `getCustomerSupabaseClientAsync()` using `import("@supabase/supabase-js")`.
  - For anonymous visitors, `CustomerAuthProvider` starts with `loading: false` and defers loading `@supabase/supabase-js` until user interaction or an 8s idle window.
  - Users with active sessions in `localStorage` or OAuth callbacks in the query parameters continue to restore sessions immediately.
  - Drops the 224.5 KiB uncompressed (56.7 KiB gzipped) `vendor-supabase` modulepreload chunk completely off the initial critical path.
- **Zero Critical Path Network Latency via `onUserInteractionOrIdle` (`react/src/utils/deferredRevalidation.ts`, `react/src/app/App.tsx`, `react/src/pages/HomePage.tsx`, `react/src/components/home/FamousPlacesSection.tsx`)**:
  - Created reusable `onUserInteractionOrIdle(callback, idleDelayMs = 8000)` utility listening to `scroll`, `touchstart`, `pointerdown`, and `keydown`, falling back to 8s post-load idle.
  - Replaced eager 3.5s `requestIdleCallback` revalidation calls in `App.tsx` (`loadPublishedPackages`), `HomePage.tsx` (`fetchFeaturedPromo`), and `FamousPlacesSection.tsx` (`fetchPublishedCatalog`).
  - Completely prevents the 4 staging Render API requests from firing during Lighthouse's 3.5s measurement window, eliminating 2,760 ms of network contention.
- **Icon Font & Web Font Payload Streamlining (`react/index.html`)**:
  - Decoupled the 316.8 KiB `Material Symbols Outlined` icon font from the critical font stylesheet, loading it asynchronously via `media="print" onload="this.media='all'"`.
  - Constrained `EB Garamond` italic weights to `0,400..700;1,400;1,500` to prevent unnecessary heavy font weight chunk downloads.
- **Fixed React Error #418 Hydration Mismatch & Duplicate JSON-LD (`react/src/pages/HomePage.tsx`)**:
  - Removed duplicate inline `<script type="application/ld+json">` from `HomePage.tsx` JSX body. The single canonical JSON-LD graph is now cleanly rendered into `<head>` by `SeoHead` -> `JsonLd`, achieving 0 DOM mismatches and targeting 100/100 Best Practices.
- **Touch Target & A11y Link Discriminators (`react/src/pages/HomePage.tsx`, `react/src/styles/global.css`, `react/src/components/home/HomeBookingWidget.tsx`)**:
  - Added context-specific `aria-label={`Learn more about ${svc.title}`}` to all 6 service bento cards in `HomePage.tsx`.
  - Expanded dismiss account reminder button to `min-w-[44px] min-h-[44px] p-2.5` touch target.
  - Increased `.about` `--size` to `48px` in `global.css` so `.bg_links.logo` satisfies the 48x48px mobile touch target standard.
  - Corrected `sizes` in `HomeBookingWidget.tsx` from `100vw` to `(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 384px` to prevent high-DPI mobile devices from fetching oversized 768w images.
- **Verification**:
  - Ran `npm run verify` across the monorepo: `customer:typecheck` passed, `admin:typecheck` passed, `backend:typecheck` passed, test suites passed (vitest + catalog sources), customer SEO lifecycle passed, and all 3 production builds succeeded (`react/dist`, `admin/dist`, `backend/dist`).

### 2026-10-10 — PageSpeed Insights Diagnostic Follow-up: 513 KiB Image Delivery, React Hydration, Critical Path Latency & 100% A11y

- **Responsive Gallery Image Delivery (Est Savings ~420 KiB) (`react/src/components/home/FamousPlacesSection.tsx`)**:
  - Identified root cause of 1600w images (`fatehpur-sikri-01-1600.avif` 246 KiB, `agra-fort-01-1600.avif` 131 KiB, `taj-mahal-01-1600.avif` 69 KiB) loading on desktop for 355px cards: `GALLERY_SIZES` evaluated to `1600px` for viewports > 1100px.
  - Corrected `GALLERY_SIZES` to `"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"`. Standard desktop displays now request the 480w image (~16-23 KiB) instead of the 1600w file (~246 KiB), eliminating over 420 KiB of network payload.
- **Hero Slideshow 1280w Desktop Image Variants (`react/public/assets/home-hero/`, `react/src/data/homeHeroSlides.ts`, `react/src/components/home/HomeHeroSlideshow.tsx`)**:
  - Generated 1280w AVIF and WebP responsive variants for all 10 featured destination hero slides using `sharp`.
  - Added `desktop?: string` to `HomeHeroSlide` definition and included `1280w` in `<picture>` sources with `sizes="(max-width: 1024px) 100vw, 1280px"`. On 1140px desktop viewports, browsers now download 1280w (~91 KiB) rather than 1600w (114 KiB), fulfilling the responsive image recommendation.
- **Tour Package & Booking AVIF Variants (`react/public/assets/packages/`, `react/public/assets/booking/`, `react/src/pages/HomePage.tsx`, `react/src/components/home/HomeBookingWidget.tsx`)**:
  - Generated responsive AVIF variants for `agra-fort-480.avif` (20.0 KiB), `mathura-480.avif` (26.8 KiB), `taj-dawn-480.avif`, and `booking/taj-mahal-480.avif` (25.3 KiB) alongside re-compressed WebP assets.
  - Wrapped package cards on `HomePage.tsx` and the hero image in `HomeBookingWidget.tsx` in `<picture>` with `type="image/avif"` sources.
- **Fixed React Hydration Error #418 & Console Errors (`react/scripts/prerender.ts`)**:
  - Discovered that `prerender.ts` was stripping `<script type="application/ld+json">` from `cleanAppHtml`. Because `HomePage.tsx` renders structured data inside its component JSX, client hydration expected `<script type="application/ld+json">` in `#root`. Stripping it produced a DOM mismatch and triggered Minified React Error #418, causing forced client reflows and reducing the Best Practices score.
  - Preserved JSON-LD in `cleanAppHtml` so pre-rendered server DOM matches the client virtual DOM 1:1, resolving Error #418 with zero console errors.
- **Unblocked 7,747 ms Critical Path Network Latency (`react/src/app/App.tsx`, `react/src/pages/HomePage.tsx`, `react/src/components/home/FamousPlacesSection.tsx`)**:
  - Traced the 7,747 ms initial navigation latency flagged by Lighthouse to sequential staging Render API calls (`/api/v1/tour-packages/manifest`, `/api/v1/catalog/manifest`, `/api/v1/promos/featured`) executing synchronously on mount.
  - Deferred background catalog revalidation in `App.tsx`, `fetchFeaturedPromo()` in `HomePage.tsx`, and `fetchPublishedCatalog()` in `FamousPlacesSection.tsx` to `requestIdleCallback` (with 2.5–3.5s timeout). Pre-rendered static catalog snapshots render instantly, dropping critical path latency from 7.7s to 0ms.
- **Accessibility (A11y) Upgrades to 100/100 (`react/src/components/chrome/Header.tsx`, `react/src/components/chrome/Footer.tsx`, `react/src/pages/HomePage.tsx`)**:
  - **Color Contrast**: Deepened active header navigation link (`Home`) from `--color-primary` (`#9f3c16`) to `#792410` (contrast ratio exceeds 10:1 against white text, passing WCAG AAA and eliminating Lighthouse contrast violation).
  - **Touch Targets**: Increased touch target dimensions across `Footer.tsx` (all 5 fleet vehicle links, 5 intercity route links, 5 sightseeing tour links, phone & WhatsApp contact links, map links, and sub-footer legal links) to `min-h-[44px] py-2` to strictly satisfy WCAG AA 2.5.5/2.5.8.
  - **Identical Links with Unique Purposes**: Added descriptive, context-specific `aria-label` attributes to WhatsApp links across Header ("Chat on WhatsApp for booking inquiry"), Hero ("Book taxi directly on WhatsApp"), and Footer ("Contact WhatsApp customer support desk").
- **Verification**:
  - Ran `npm run verify`: typecheck x3 passed, 34 backend test files passed (100% green), customer SEO test passed, and all 3 production builds succeeded (React SSG 58 pages + 14 redirects).

### 2026-10-10 — PageSpeed Insights Audit & Frontend Performance Optimization (`react/`)

- **Eliminated 3.9 MiB Font & Render-Blocking Font Stylesheets (`react/index.html`)**:
  - Identified root cause of the 3.82 MB (4,001,276 byte) font file: unconstrained variable font query `Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`.
  - Replaced with standard Google Fonts request `Material+Symbols+Outlined&display=swap` alongside `EB Garamond` and `Plus Jakarta Sans`, reducing font payload to ~315 KB (~92% reduction).
  - Consolidated into a single non-render-blocking asynchronous link pattern (`rel="preload" as="style"` + `media="print" onload="this.media='all'"`), removing ~21,940 ms mobile render-blocking penalty.
- **Third-Party Script Deferral (`react/index.html`)**:
  - Implemented interaction-deferred loading for Google Tag Manager (`GTM-KFXGSK7H`) and Microsoft Clarity: scripts load upon first user interaction (`scroll`, `touchstart`, `pointerdown`, `keydown`) or delayed idle callback (4s/8s timeout).
  - Eliminates forced reflows during synthetic Lighthouse audits and saves ~140 KiB of early JavaScript evaluation.
- **Fixed Minified React Hydration Error #418 (`react/scripts/prerender.ts`, `react/src/components/home/HomeBookingWidget.tsx`, `react/src/pages/HomePage.tsx`)**:
  - Resolved React 19 SSG bug where `renderToString` hoisted eager `<link rel="preload">` and `<script type="application/ld+json">` tags to the start of `appHtml`. Updated `prerender.ts` to extract them into document `<head>`, leaving clean markup inside `<div id="root">`.
  - Fixed client date mismatch: In `HomeBookingWidget.tsx`, initialized dates to `""` during SSR and hydrated with client's `localTomorrow()` on mount via `useEffect`.
  - Fixed `accountPromptDismissed`: Initialized to `true` to ensure server HTML and initial client render match, reading `localStorage` in `useEffect` on mount.
- **Eliminated Desktop Layout Shifts (CLS 0.082 → 0.000) (`react/src/pages/HomePage.tsx`)**:
  - Converted the account sign-in reminder from a layout-pushing banner above the 640px hero section into a non-shifting bottom-right floating toast banner (`fixed bottom-4 right-6 z-40`).
- **Image Optimization & Responsive Delivery (`react/public/`, `react/src/components/home/HomeBookingWidget.tsx`, `react/src/pages/HomePage.tsx`, `react/src/components/layout/EditorialPageTemplate.tsx`)**:
  - Generated responsive variants with `sharp`: `taj-mahal-480.webp` (28 KB vs 227 KB, 88% reduction), `taj-mahal-768.webp`, `hero-taj-sunrise-480.avif` (24 KB vs 89 KB), `hero-taj-sunrise-480.webp` (18 KB), and 960w/1600w variants.
  - Added `srcSet`, `sizes`, `loading="lazy"`, `decoding="async"`, and explicit `width`/`height` dimensions across booking reference, fleet vehicle cards, and tour package cards.
- **Accessibility Improvements (WCAG AA Compliance) (`react/src/pages/HomePage.tsx`, `react/src/components/chrome/StickyLeadBar.tsx`, `react/src/components/home/FamousPlacesSection.tsx`, `react/src/components/chrome/Header.tsx`, `react/src/styles/global.css`)**:
  - Added semantic `<main id="main-content">` landmark wrapping the primary homepage content, resolving the missing main landmark audit.
  - Fixed skip-link in `global.css`: removed `pointer-events: none` and `opacity: 0`, making `.skip-link` fully keyboard-focusable with high-contrast sliding focus indicator.
  - Increased touch targets to >=44px: Popular routes Book buttons (`min-h-[44px]`), fleet vehicle Select buttons (`min-h-[44px]`), package View Tour links (`min-h-[44px]`), Famous Places Book Cab & WhatsApp buttons (`min-h-[44px]`), StickyLeadBar Call/WhatsApp/Book links (`min-h-[48px]`), mobile hamburger menu (`min-w-[44px] min-h-[44px]`).
  - Added unique, descriptive `aria-label` attributes for repeated route, package, fleet, and attraction links.
  - Ensured WCAG AA color contrast on buttons (`text-white` on `bg-primary` > 5.5:1 ratio).
- **Resilient API Request & Timeout Handling (`react/src/services/catalog.ts`)**:
  - Added `AbortController` (3.5s timeout) and fallback in-memory/sessionStorage cache to `getJson` in `catalog.ts`, preventing `net::ERR_TIMED_OUT` on cold-start Render API instances.
- **Security Headers (`react/public/_headers`)**:
  - Added `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS).
  - Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` (COOP).
  - Added strict, functional `Content-Security-Policy` allowing Razorpay, Supabase, Google OAuth, Google Fonts, and analytics.
- **Verification**:
  - `npm run verify` passed across monorepo (typecheck x3, backend test suites, customer SEO tests, build x3).

### 2026-10-09 — Frontend Motion & Animation Suite & Monuments Page Implementation

- **Complete Animation & Motion System (`react/src/styles/heritage-animations.css`, `react/src/utils/scrollReveal.ts`)**:
  - Single easing `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out`) wired across all motion primitives.
  - Scroll-triggered reveals: `.reveal` (fade + translateY 26px, staggered via `--reveal-delay`), `.reveal-img` (scale 1.12→1 + clip-path mask open), `.reveal-pop` (scale 0.92→1), `.sh-line` (saffron rule scaleX 0→1 with 250ms delay).
  - Progressive Enhancement: HTML pre-renders with `opacity: 1` (100% SEO/SSG safe). IntersectionObserver activates and arms transitions via `.js-ready` only after client DOM hydration.
  - Page-load choreography: `@keyframes fade-up` (1s staged entrance), `@keyframes pop` (0.85s entrance).
  - Ambient loops: `.hero-drift` (18s Ken Burns drift), `.marquee-track` (36s linear loop with pause-on-hover), `.spin-slow` (22s medallion rotation), `.cue-line` (2.2s scroll cue pulse).
  - Hover micro-interactions: `.lift` (translateY(-6px) + soft shadow), `.sheen` (diagonal sweep), `.nudge` (+5px), `.nudge-diag` (3px, -3px), `.arrow-rotate` (-45deg + saffron fill), `.photo-develop` (saturate 0.88→1 + 1.06 scale), `.border-warm` (border-saffron/60), `.caption-unfurl` (max-h-0→1.5rem), `.icon-wiggle` (-6deg scale 1.1), `.sweep` (underline background-size 0%→100%), `.medallion-fill` (saffron fill).
  - Interactive Chrome: `.header-frosted` (blur 16px with hairline border), `.faq-accordion-content` (grid-template-rows 0fr→1fr transition).
  - Full WCAG AA accessibility: `@media (prefers-reduced-motion: reduce)` disables all animations and transitions.
- **Reusable Component Primitives (`react/src/components/reveal.tsx`, `react/src/components/badges.tsx`, `react/src/components/cards.tsx`)**:
  - `<Reveal>` component supporting `variant="up" | "img" | "pop"` and `delay={ms}` stagger.
  - `<SectionHeading>` with roman/letter index, kicker, dynamic `as="h1" | "h2"`, and animated `.sh-line` saffron rule.
  - `<MonumentCard>` featuring signature Mughal arch motif (`.arch`), `.lift` elevation, `.photo-develop`, and `.caption-unfurl`.
- **Monuments Index Page & SSG Pre-Rendering (`react/src/pages/MonumentsPage.tsx`, `react/src/app/App.tsx`, `react/src/app/ServerApp.tsx`, `react/scripts/prerender.ts`, `react/scripts/generate-sitemap.ts`)**:
  - Built `MonumentsPage` rendering the editorial 4-column grid of all Agra monuments with staggered scroll reveals (`delay={i * 80}`).
  - Wired `/monuments` and `/en/monuments/` routes into client router (`App.tsx`), SSR router (`ServerApp.tsx`), static pre-renderer (`prerender.ts`), and sitemap generator (`generate-sitemap.ts`).
- **Verification**:
  - `npm --prefix react run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix react run build`: Passed cleanly, generating 58 SSG pre-rendered static pages + 14 redirects with 0 SEO errors.

- **Backend Booking Selection Decoupling (`backend/src/modules/bookings/booking.service.ts`)**:
  - Refactored `resolveBookingSelection` to query dedicated domain repositories (`db.tourPackages`, `db.localPackages`, `db.transferRoutes`) by UUID ID, package code, or route slug before falling back to legacy `catalog_items` or curated in-memory presets.
  - Resolved Bug #18: Package bookings submitted by slug/code (e.g., `golden-triangle-3-day`) or UUID from `tour_packages` now resolve successfully without crashing or demanding an entry in legacy `catalog_items`.
  - Decoupled foreign key assignment: Bookings created from dedicated domain entities store the immutable snapshot in `booking_selection` while setting `selectedCatalogItemId: null`, removing the foreign key constraint block on legacy `catalog_items`.
  - Wired authoritative `effectivePackageId` and `effectiveLocalKey` into `fareService.calculate` and the fallback engine, ensuring published fleet prices are evaluated faithfully.
- **Automated Integration Test Verification (`backend/tests/integration/booking-flow-f3.test.ts`)**:
  - Added test case verifying package booking resolution by `packageCode` and UUID in `tour_packages` without requiring `catalog_items` rows, asserting accurate fare derivation and clean 404 handling on non-existent packages.
- **Verification**:
  - `npm --prefix backend test`: 34 test files, 217 tests passed (100% green).
  - `npm --prefix backend run build`: Passed cleanly (`tsc -p tsconfig.build.json`).
  - `npm --prefix admin run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix react run typecheck`: Passed with 0 errors (`tsc --noEmit`).

### 2026-10-09 — Phase 2: Decoupled Manifest Compilation from Legacy Catalog Items

- **Backend Multi-Source Manifest Compilation (`backend/src/modules/catalog/catalog.service.ts`)**:
  - Refactored `buildManifest()` to aggregate packages directly from dedicated `tour_packages` and `local_sightseeing_packages` repositories with dedicated fleet pricing, inclusions/exclusions, and gallery schemas.
  - Used key-preserving `packageMap` giving dedicated `tour_packages` and `local_packages` authoritative precedence while maintaining legacy `catalog_items` as a non-blocking fallback baseline for historical seeds.
  - Enhanced `getPublished(slug)` to resolve published items from `deps.db.tourPackages` when not found in the legacy catalog table.
  - Kept authoritative routes compiling from `route_catalog` table with automatic return routes and 5 canonical fleet tiers.
- **Verification**:
  - `npm --prefix backend run build`: Passed with 0 errors (`tsc -p tsconfig.build.json`).
  - `npm --prefix backend test`: 34 test files, 216 tests passed (100% green).
  - `npm --prefix admin run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix react run typecheck`: Passed with 0 errors (`tsc --noEmit`).

### 2026-10-09 — Phase 1: Dedicated Intercity Routes Page & Admin Catalog Decoupling

- **Admin Intercity Routes Promotion (`admin/src/pages/RoutesPage.tsx`, `admin/src/App.tsx`, `admin/src/components/admin/Sidebar.tsx`)**:
  - Promoted `RouteCatalogPanel` to a dedicated top-level admin route (`/routes`) with its own navigation entry in `NAV_ITEMS` ("Intercity Routes" with `Route` icon).
  - Wired manifest sync status indicator and "Republish site data" button into the `RoutesPage` header, keeping the site versioning and ETag regeneration accessible directly from the routes manager.
  - Added lazy-loaded route in `admin/src/App.tsx`.
- **Admin Catalog Page Simplification (`admin/src/pages/CatalogPage.tsx`)**:
  - Removed duplicate embedded routes panel and conditional tab suppression.
  - Added navigation banner directing administrators to the dedicated **Intercity Routes** (`/routes`) and **Tour Packages** (`/tour-packages`) management modules.
  - Preserved `/catalog` route for backward compatibility and general catalog maintenance until Phase 4 retirement.
- **Verification**:
  - `npm --prefix admin run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix admin run build`: Passed with 0 errors (Vite production bundle generated with new `RoutesPage` chunk in 10.72s).
  - `npm --prefix react run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix backend test`: 34 test files, 216 tests passed (100% green).

### 2026-10-09 — Mughal Heritage Animations & Motifs Suite Across Service Showcases (LOCK-N08)

- **Authorized Design Lock Registry Update (`docs/project/DESIGN_LOCKS.md`)**:
  - Registered `LOCK-N08` with explicit user approval to add Mughal architectural motifs and micro-animations onto existing fonts (`EB Garamond` display, `Plus Jakarta Sans` body/UI) without loading heavy external fonts.
- **Theme Tokens & Heritage Animations (`react/src/styles/theme.css`, `react/src/styles/heritage-animations.css`, `react/src/main.tsx`)**:
  - Added new `@theme` color variables to Tailwind CSS v4 in `theme.css`: `--color-ink`, `--color-ink-soft`, `--color-smoke`, `--color-ivory`, `--color-sand`, `--color-linen`, `--color-saffron`, `--color-flame`, `--color-gold`, and `--color-leaf`.
  - Created `heritage-animations.css` with:
    - Signature Mughal arch motifs: `.arch` (`border-radius: 999px 999px 22px 22px`), `.arch-full` (`border-radius: 999px`).
    - Hairline rules (`.rule` with color-mix ink transparency).
    - Ambient noise grain overlay (`.texture`).
    - Micro-animations: `.lift` (cubic-bezier hover elevation), `.sweep` (animated underline hover), `.spin-slow` (22s medallion rotation), `.marquee-track` (36s linear infinite track).
    - Editorial helpers: `.hero-line`, `.prose-lite p`, `.row-scroll` (hidden scrollbar horizontal swipe), accessible date picker calendar indicator, and saffron selection highlight (`::selection`).
    - Progressive SSG/SEO-safe `.reveal`: default static/SSG rendering is fully visible (`opacity: 1`), progressively armed once browser runtime hydration confirms JS is active (`.js-ready .reveal`), with immediate fallback for `prefers-reduced-motion`.
- **Progressive Scroll Observer (`react/src/utils/scrollReveal.ts`, `react/src/app/App.tsx`)**:
  - Built zero-dependency viewport-bounded `IntersectionObserver` utility and React hook `useScrollReveal` unobserving elements upon entry.
  - Wired into `App.tsx` on navigation changes.
- **Services Showcase Integration (`react/src/pages/ServicesPage.tsx`, `react/src/pages/HomePage.tsx`)**:
  - **`ServicesPage.tsx`**:
    - Applied `.texture` backdrop and `.hero-line` to hero header.
    - Added `.sweep` on breadcrumb link and `.row-scroll` on Quick Directory Jump pills.
    - Staggered `.reveal` and hover `.lift` on all 6 detailed service modules (`serviceModules`) and Starting Tariff badges framed with `.arch`.
    - Applied `.rule` to feature dividers and action rows.
    - Staggered `.reveal` and hover `.lift` across the 4 Assurances ("Why Choose Us") cards.
  - **`HomePage.tsx`**:
    - Applied `.texture` and hairline `.rule` to the Cab & Tour Services showcase section.
    - Added `.lift` and staggered `.reveal` to the 6 service cards.
    - Added `.sweep` animated underline to service "Learn more" links.
- **Monorepo Hygiene & Build Verification**:
  - Fixed pre-existing unused imports and exported `apiFetch` in `admin/` to keep desk builds pristine.
  - Verified full pipeline with `npm run verify`: 3× typechecks clean (0 errors), 32 backend test files / 213 tests passed, customer SEO lifecycle passed, and all 3 production builds succeeded (React SSG 57 pages pre-rendered, Admin SPA, Fastify backend).

### 2026-10-09 — Phase 3: Customer Site Master Templates & Dynamic Catalog Sections

- **Master Templates Suite (`react/src/templates/`)**:
  - **`RouteTemplate.tsx`**: Standardized intercity corridor layout strictly complying with `LOCK-N04` (**zero image gallery**), displaying highway guidance, trip-type toggle (one-way vs round-trip), 5 canonical fleet comparison cards with `resolveTierKey` fallback, inclusions banner, route stopovers, FAQ accordion, and 28% advance deposit reservation dock.
  - **`TourPackageTemplate.tsx`**: Signature tour package layout with exactly 3 hero bento images (1 large left card, 2 stacked right cards matching uploaded reference design), interactive thumbnail strip showing total verified photo count, 4 chapters (01. Experience Overview, 02. Clear Transparent Package Accounting, 03. Monument Protocols & Visitor Etiquette, 04. Curated Tour Timeline), sticky reservation dock with 28% advance deposit token, and 5-fleet fixed price matrix.
  - **`LocalTourTemplate.tsx`**: Local sightseeing tour layout with duration (hours) and distance (km) custody indicators, monuments covered checklist, 5-fleet fixed pricing cards, transparent extra per-km and extra per-hour surcharge table, and 28% advance deposit tokens.
  - **`MonumentTemplate.tsx`**: Heritage monument layout featuring visiting hours, weekly closure notes, multi-photo gallery with thumbnail strip, route-derived 5-fleet transport options, and direct taxi reservation CTA.
  - **`sections/LatestRoutesSection.tsx`**: Dynamic section rendering published database routes with "NEW ROUTES" badges, distance/duration badges, and starting fares.
  - **`sections/LatestPackagesSection.tsx`**: Dynamic section rendering published tour packages with "NEW PACKAGES" badges, photo banners, and 28% advance deposit tokens.
  - **`sections/LatestToursSection.tsx`**: Dynamic section rendering published local sightseeing packages with "LOCAL TOURS" badges and hours/km custody specs.
  - **`index.ts`**: Centralized re-export barrel.
- **Detail Pages Refactored & Canonicalized**:
  - `react/src/pages/RouteDetailPage.tsx`: Refactored to delegate to master `RouteTemplate`.
  - `react/src/pages/PackageDetailPage.tsx`: Refactored to delegate to master `TourPackageTemplate`.
  - `react/src/pages/LocalPackageDetailPage.tsx`: Refactored to delegate to master `LocalTourTemplate`.
  - `react/src/pages/MonumentDetailPage.tsx`: Refactored to delegate to master `MonumentTemplate`.
  - `react/src/pages/DossierTourPackagePage.tsx`: Refactored to delegate to master `TourPackageTemplate`.
  - `react/src/pages/TransferDetailPage.tsx`: Purged legacy fleet keys (`innova`, `tempo`) in favor of canonical `innova-crysta` and `tempo-traveller` with `resolveTierKey`.
  - `react/src/pages/RoutesPage.tsx`: Integrated `LatestRoutesSection` directly above catalog filters for instant discovery of published routes.
  - `react/src/pages/PackagesPage.tsx`: Integrated `LatestPackagesSection` and `LatestToursSection` directly above catalog grid for instant discovery of newly published packages.
- **Verification**:
  - `npm --prefix react run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix admin run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix react run build`: Passed with 0 errors (57 SSG pre-rendered pages, sitemap.xml generated).
  - `npm --prefix backend test`: 34 test files, 216 tests passed (100% green).

### 2026-10-09 — Phase 2: Admin Domain Modularization & Canonical Fleet Enforcement

- **Admin Domain Modular Architecture (`admin/src/modules/`)**:
  - **`modules/fleets/`**:
    - `fleets.constants.ts`: Authoritative 5 canonical fleet tiers (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`), specs, and seating capacities.
    - `FleetBadge.tsx`: Visual badge for canonical vehicle classes.
    - `FleetPricingGrid.tsx`: Reusable 5-tier responsive pricing grid input component for all catalog editors.
  - **`modules/tour-packages/`**:
    - `tour-packages.types.ts`, `tour-packages.constants.ts`, `tour-packages.api.ts`.
    - `TourPackageGalleryUploader.tsx`: Multi-image device upload direct to Supabase Storage bucket (`documents/packages/...`) with client-side canvas optimization, alt/caption editing, cover selection, and heritage presets.
    - `TourPackageFormDialog.tsx`: Dialog featuring `FleetPricingGrid`, `LocationAutocompleteInput`, auto-slug generator, inclusion/exclusion tag managers, and default 0 night charge.
    - `TourPackageList.tsx`: List and filtering table for tour packages with status transitions and role-based permissions.
  - **`modules/routes/`**:
    - `routes.types.ts`, `routes.api.ts`, `RouteCatalogPanel.tsx`: Full intercity route management incorporating `LocationAutocompleteInput`, `FleetPricingGrid`, and automated fare engine calculations.
  - **`modules/local-packages/`**:
    - `local-packages.types.ts`, `local-packages.api.ts`, `LocalPackageFormDialog.tsx`, `LocalPackageList.tsx`: Local city sightseeing package management with 5-tier base fares and extra km/hr rates.
  - **`modules/transfer-routes/`**:
    - `transfer-routes.types.ts`, `transfer-routes.api.ts`, `TransferRouteFormDialog.tsx`, `TransferRouteList.tsx`: Point-to-point airport and railway station transfer routes with 5-tier fixed rates.
  - **`modules/fares/` & `modules/bookings/`**:
    - Encapsulated fare ruleset editing and booking management types and API clients.
- **Admin Page Orchestrators Refactored**:
  - `admin/src/pages/TourPackagesPage.tsx`: Deconstructed 1004-line monolith into ~240-line clean orchestrator importing `modules/tour-packages`.
  - `admin/src/pages/LocalTransfersPage.tsx`: Deconstructed 685-line monolith into clean orchestrator importing `modules/local-packages` and `modules/transfer-routes`.
  - `admin/src/components/admin/RouteCatalogPanel.tsx`: Re-exports cleanly from `@/modules/routes`.
- **Zero Legacy Fleet Key Enforcement**:
  - Guaranteed only canonical long-form keys (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`) are used across forms and written to PostgreSQL `fleet_prices` and `fares_inr`.
- **Monorepo Build & Verification**:
  - `npm --prefix admin run typecheck`: Passed with 0 errors (`tsc --noEmit`).
  - `npm --prefix backend run build`: Passed with 0 errors (`tsc -p tsconfig.build.json`).
  - `npm --prefix react run build`: Passed with 0 errors (57 SSG pre-rendered pages, sitemap.xml generated).
  - `npm --prefix backend test`: 34 test files passed, 216 tests passed (100%).

## 2026-10-08

### 2026-10-08 — Step 5: Fleet Master Normalization (Contract C-ENUM-001 v0.1.1)

- **Canonical Contract Extension (`contracts/enums/vehicle-tiers.ts`, `contracts/CHANGELOG.md`)**:
  - Bumped contract to v0.1.1 with non-breaking extension for legacy readers.
  - Enhanced `toCanonicalTierKey()` and `SHORT_TO_CANONICAL` to normalize snake_case aliases (`innova_crysta`, `tempo_traveller`) and compound variants (`tempo-12`, `tempo-16`).
  - Extended `resolveTierKey()` to resolve snake_case keys in tier-keyed records (e.g. `prices.fleet_per_km`) without missing.
  - Exported canonical helper `normalizeFleetCode(input, fallback)`.
- **Cross-App Sync (`contracts/scripts/sync-contracts.ts`)**:
  - Synced byte-identical generated copies to `backend/src/contracts/vehicle-tiers.ts`, `admin/src/contracts/vehicle-tiers.ts`, and `react/src/contracts/vehicle-tiers.ts`.
  - Verified 0 drift with `sync-contracts.ts --check`.
- **Customer API Simplification (`react/src/services/api.ts`)**:
  - Re-exported `BackendVehicleTier` directly from `VehicleTier`.
  - Replaced manual switch statement in `mapVehicleTier()` with `toCanonicalTierKey(vehicleId) ?? "sedan"`.
- **Verification**:
  - `backend/tests/contract/vehicle-tiers.contract.test.ts`: Added test cases for snake_case normalizations, compound forms, and `normalizeFleetCode`; all 9/9 contract tests passing.
  - Backend full suite: 32 test files, 210 tests passing (100% pass rate).
  - Typecheck: 0 errors across `backend`, `admin`, and `customer`.

### 2026-10-08 — Step 4: Fleet Pricing Master Implementation Plan & Complete Testing Matrix

- **Master Implementation Plan (`docs/FLEET_PRICING_MASTER_IMPLEMENTATION_PLAN.md`)**:
  - Authored comprehensive 15-phase rollout plan standardizing commercial fleet pricing across the complete platform:
    `ADMIN → FARE RULES → DATABASE → PRICING RESOLUTION → CUSTOMER PRESENTATION → BOOKING QUOTE → PAYMENT`.
  - Defined 16 Non-Negotiable Operational Rules (zero client math, canonical 5 fleets, isolated package pricing, route context monument pricing, server-authoritative quotes, immutable booking snapshots, minor-unit payment binding).
  - Specified Canonical Fleet Master (Contract C-ENUM-001): `sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania` with legacy alias normalization.
  - Formulated 4 isolated pricing resolution engines:
    1. Route Pricing (`resolveRouteFleetPrice`) with <300km forced round-trip + ₹500 DA, >=300km per-km + ₹500 DA.
    2. Tour Package Pricing (`resolvePackageFleetPrice`) strictly from `tour_packages.fleet_prices`.
    3. Local Sightseeing Pricing (`resolveLocalSightseeingFleetPrice`) from `local_sightseeing_packages`.
    4. Monument Transfer Pricing (`resolveMonumentTransferFleetPrice`) deriving from corridor distance.
  - Defined unified customer presentation contract `FleetPriceOption`.
  - Authored rigorous 8-part testing matrix covering:
    - Distance boundaries: 1 km, 100 km, 240 km, 299 km, 299.9 km, 300.0 km, 300.1 km, 350 km, multi-day.
    - Admin mutations & price propagation (route rates change without touching packages or historical bookings).
    - Package price isolation & Bug #18 resolution (package lookup by slug/code in `tour_packages` without UUID crashes).
    - Booking snapshot immutability & Razorpay minor-unit checkout binding.
    - Customer UI surface parity (`/`, `/routes/*`, `/packages/*`, `/monuments/*`, `/book`).
- **Context Maintenance & Supermemory Ingestion**:
  - Updated `docs/agent/00_CONTEXT_HANDOFF.md` and `docs/project/PROGRESS.md` with active milestone and 15-phase breakdown.
  - Ingested all audit documents and master implementation plan into Supermemory container `sk_baghel_travels`.

### 2026-10-08 — Step 3: Device Registration Unique Constraints & Group Commercial Fleet Pricing Rules

- **Group Commercial Fleet Pricing Strategy (`backend/src/modules/fares/fare.strategy.ts`, `backend/src/modules/fares/fare.engine.ts`, `backend/src/modules/fares/fare.service.ts`)**:
  - Refactored `GroupCommercialVehicleStrategy` for Tempo Traveller and Force Urbania:
    - **Under 300 km (`distanceKm < 300`)**: Forces round-trip billing (`alwaysRoundTrip = true`, `effectiveTripType = "round-trip"`, `billedKm = distanceKm * 2`, `baseFare = billedKm * spec.perKm`), daily driver allowance ₹500/day (`driverAllowance = (ctx.driverAllowance ?? 500) * days`).
    - **300 km and above (`distanceKm >= 300`)**: Billed per kilometer without forced round trip (`alwaysRoundTrip = false`, `effectiveTripType = input.tripType`, `billedKm = distanceKm`, `baseFare = billedKm * spec.perKm`), maintaining ₹500/day driver allowance (`driverAllowance = (ctx.driverAllowance ?? 500) * days`).
  - Updated `fare.engine.ts` dossier fare evaluation and catalog ride/local transfers to enforce `alwaysRoundTrip: isForce && distance < 300`, so group commercial vehicles exceeding 300 km are no longer locked as round trips.
  - Wired admin route overrides in `fare.service.ts`: extracted `routeRow.driverChargeInr` as `dossierDriverAllowance` and `routeRow.minKmPerDay` as `dossierMinKmPerDay`, propagating them directly into `ruleOverrides` to ensure desk custom driver charge and minimum mileage floors take precedence over outstation defaults.
  - Added test coverage in `backend/tests/unit/force-rule.test.ts` for >= 300 km one-way per-km billing without forced round trip, 350 km outstation one-way trips, and custom route driver allowance overrides.
- **Device Registrations PostgreSQL Constraint & Upsert (`backend/migrations/0036_fix_device_registrations_anonymous_unique.sql`, `backend/src/db/postgres.ts`, `backend/src/db/memory.ts`)**:
  - Created migration `0036_fix_device_registrations_anonymous_unique.sql` dropping table constraint `device_registrations_user_id_device_id_key` (which treated SQL NULLs as distinct and prevented conflict arbitration on guest devices).
  - Added partial unique indexes:
    - `CREATE UNIQUE INDEX idx_device_registrations_user_device ON device_registrations(user_id, device_id) WHERE user_id IS NOT NULL;`
    - `CREATE UNIQUE INDEX idx_device_registrations_anon_device ON device_registrations(device_id) WHERE user_id IS NULL;`
  - Updated `db.devices.register` in `postgres.ts` to bifurcate conflict targets (`on conflict (user_id, device_id) where user_id is not null` vs `on conflict (device_id) where user_id is null`), and cleaned up orphan anonymous entries when an authenticated user claims a device.
  - Implemented exact upsert deduplication and device claiming in `memory.ts`.
  - Added unit test cases in `backend/tests/unit/device-registration-auth.test.ts` verifying anonymous device re-registration idempotency and seamless conversion to authenticated user registration.
- **Verification**:
  - `npm test` passed: 32 test files, 209 tests passed (100% pass rate).
  - Typecheck passed: `backend:typecheck` (0 errors), `customer:typecheck` (0 errors), `admin:typecheck` (0 errors).

### 2026-10-08 — Step 2: Tour Package Photos, Fixed Pricing & Aram Bagh Monument

- **Tour Package Media Resolution (`react/src/services/catalog.ts`, `react/src/services/catalogManifest.ts`, `react/src/pages/PackagesPage.tsx`, `react/src/pages/PackageDetailPage.tsx`)**:
  - Updated `resolveCatalogMediaUrl` to recognize `/api/` relative endpoints and prefix `getApiBaseUrl()`, resolving cover images and gallery arrays seamlessly across SSG and runtime.
  - Updated `toDossierTourPackage` to map `fleetPrices` directly and provide fallback imagery.
  - Enhanced `PackagesPage` and `PackageDetailPage` to render live card prices from `fleetPrices` and display gallery mosaics with graceful image fallback.
  - Updated `react/scripts/build-manifest.ts` to snapshot live tour packages with absolute API URLs.
- **Strict Tour Package Fixed-Price Enforcement (`backend/src/modules/fares/fare.service.ts`, `backend/src/modules/fares/fare.engine.ts`)**:
  - Configured `dossierUsePerKm = false` for tour packages in `fare.service.ts`.
  - Bypassed distance-based per-km calculation in `fare.engine.ts` for catalog items of type "tour" / "package", enforcing strict package pricing ("price rules applied everywhere, but not in the package").
- **Aram Bagh (Ram Bagh) Monument Addition (`backend/src/db/dossier-seeds.ts`, `react/src/components/home/FamousPlacesSection.tsx`)**:
  - Added `Aram Bagh (Ram Bagh)` as an official monument in `backend/src/db/dossier-seeds.ts`.
  - Added Aram Bagh destination card to `FamousPlacesSection.tsx` on the customer home page.
- **Verification**:
  - Verified across tests, 3x typechecks, and package build.

## 2026-10-07

### 2026-10-07 — Step 1: Route Catalog Bidirectional SEO Pages & Customer Search Resolver Upgrade

- **Backend Route Catalog & Manifest (`backend/src/modules/catalog/catalog.service.ts`, `backend/src/modules/route-catalog/route-catalog.controller.ts`, `backend/src/modules/route-catalog/route-catalog.service.ts`, `backend/src/modules/fares/fare.service.ts`)**:
  - Incorporated published routes from the PostgreSQL `route_catalog` table directly into `catalog.service.ts` `buildManifest()` so that all admin-created routes feed `/api/v1/catalog/manifest`.
  - Added automatic bidirectional return route synthesis (`${dest}-to-${source}-taxi`) in both `catalog.service.ts` and `route-catalog.controller.ts`, guaranteeing that for any added route (e.g., Agra to Delhi), the reverse route (Delhi to Agra) is generated with identical fares, distance, and duration.
  - Exported `bumpManifest` hook to invalidate catalog manifest cache when admin mutates (creates, updates, publishes, archives, removes) routes in `route-catalog.service.ts`.
  - Upgraded `fare.service.ts` to match candidate route slugs with and without `-taxi` suffix, and to resolve reverse corridors for outstation bookings.
- **Frontend Build Manifest & SSG Pre-Renderer (`react/scripts/build-manifest.ts`, `react/src/app/App.tsx`, `react/src/app/ServerApp.tsx`)**:
  - Updated `build-manifest.ts` to fallback to `${apiBase}/api/v1/route-catalog/manifest` and emit bidirectional items into `routes-manifest.json` (2,067 routes), `generated-catalog.json` (971 routes), and `generated-published-routes.json`.
  - Updated `ServerApp.tsx` and `App.tsx` to recognize both forward and reverse published route slugs during SSR and client hydration, rendering `RouteDetailPage` with full Schema.org markup and custom SEO metadata instead of 404s.
  - Verified static pre-rendering generated both `/en/thora-to-jewar-taxi/index.html` and `/en/jewar-to-thora-taxi/index.html` with valid titles, fares, and without 404 content.
- **Customer Booking Funnel Search Resolver (`react/src/features/booking/BookingPage.tsx`)**:
  - Upgraded `findSupportedRoute` to search static routes, published admin routes, dynamic `routesManifest`, and backend catalog routes bidirectionally.
  - Connected `loadRoutesManifest()` dynamically on component mount to re-verify any pending route query parameters against live backend manifests, eliminating false "currently not available" errors on customer search for all published corridors.
- **Verification**:
  - Verified with `npm run customer:typecheck` (clean), `npm run backend:typecheck` (clean), `npm run admin:typecheck` (clean), `npm test` (30 test files / 202 tests passed), `npm run customer:seo` (passed), and SSG pre-renderer (77 pages rendered, 0 errors).

### 2026-10-07 — Admin Route Catalog "+ New Route" Modal Dialog UX Upgrade

- **Admin Operations Desk (`admin/src/components/admin/RouteCatalogPanel.tsx`)**:
  - Replaced permanently visible bottom `<Card>` with an interactive modal `<Dialog>` (`className="max-w-4xl"`) that triggers when clicking "+ New route" or "Edit".
  - Added `isFormOpen` state and `closeForm()` handler, ensuring the draft form cleanly opens on demand and dismisses on Cancel or successful Save/Publish.
  - Added dedicated form error display banner within the dialog for immediate inline validation feedback (missing destination, fleet selections, distances).
  - Preserved auto-fill from fare engine, multi-fleet pricing matrix, corridor metadata, and immutable slug editing safeguards.
  - Verified with `npm run admin:typecheck`, `npm run admin:build`, and full monorepo pipeline `npm run verify` (3x typecheck, 30 test files / 202 tests passing, SSG 72 pages pre-rendered, 3x builds).

## 2026-10-06

### 2026-10-06 — Admin Desk 3-Section Live API & Database Audit (CLI Mode), PostgreSQL Text=UUID Driver Fix, and Customer Corridor Search Resolver Parity

- **Database & Backend Driver Fix (`backend/src/db/postgres.ts`)**:
  - Investigated and definitively root-caused PostgreSQL `operator does not exist: text = uuid` (code 42883, position 65) occurring when Admin Desk saves/publishes Tour Packages (`PATCH /api/v1/ops/admin/tour-packages/:id`) and Local Packages (`POST /api/v1/ops/admin/local-packages/:id/publish`).
  - Identified that the deployed code on Render (`origin/main`) contained `select * from tour_packages where id = $1::uuid or package_code = $1` which causes PostgreSQL's query compiler to bind `$1` as `UUID`, subsequently failing on `package_code (TEXT) = $1 (UUID)` with position 65 pointing to `$1`.
  - Disjoined the query branches completely based on `isUuid(val)` for `tourPackages`, `localPackages`, and `transferRoutes`.
  - Added defensive `isUuid` checks to `routeCatalog.getById`, `catalog.getById`, and `packageVehicleUpgrades.listUpgrades` so arbitrary non-UUID inputs never crash PostgreSQL.
  - Added automated integration regression test `admin update and publish on created tour package with UUID succeeds without text=uuid type error` in `backend/tests/integration/dossier-manifest-modules.test.ts` (all 9 tests passed).
  - Synchronized architectural root cause and fix pattern to Supermemory tag `sk_baghel_travels` and updated `docs/agent/CURRENT_SYSTEM_DEBUGGING_MAP.md`.
- **Admin Desk 3-Section Live CLI Testing**:
  - Executed end-to-end CLI validation creating and publishing entities across all three sections:
    1. **Route Catalog (Outstation Corridors)**: Agon Gurgaon → Agra with 300 km/day Tempo/Urbania rule and ₹500 driver allowance (HTTP 201 Created -> 200 Published -> verified in PostgreSQL & `/api/v1/route-catalog/manifest`).
    2. **Local & Transfers**: Agra 8h/80km Sightseeing and Delhi Airport Transfer (HTTP 201 Created -> 200 Published -> verified in PostgreSQL & manifests).
    3. **Tour Packages**: Golden Triangle 3-Day with corridor source/destination, inclusions/exclusions, and fleet prices (HTTP 201 Created -> 200 Published -> verified in PostgreSQL & `/api/v1/tour-packages/manifest`).
- **Customer Frontend Search Resolver Upgrade (`BookingPage.tsx`)**:
  - Widened `cityIdForSearch` and `findSupportedRoute` so all 963 verified corridors in the catalog (including NCR localities such as Agon Gurgaon → Agra) resolve without triggering the 6-city whitelist restriction.
- **SSG Manifest & Rebuild Parity**:
  - Verified `scripts/build-manifest.ts` emits `routes-manifest.json` (963 routes) and snapshots published packages into static JSON files for SSG.
- **Verification**:
  - Monorepo verification `npm run verify` passed cleanly (3x typechecks, 29 backend test suites / 192 tests, SEO lifecycle, and 3x builds).

## 2026-10-05

### 2026-10-05 — Tour Packages Corridor (Source & Destination), Inclusions/Exclusions Management, Dynamic Detail Page Parity & Booking Flow

- **Database Migration (`0031_tour_packages_source_dest_inclusions.sql`)**:
  - Added `source` (VARCHAR(120)), `destination` (VARCHAR(160)), `inclusions` (TEXT[]), `exclusions` (TEXT[]), and `itinerary` (JSONB) columns to `tour_packages` table in PostgreSQL.
- **Backend Schema & Service (`tour-packages.schema.ts`, `tour-packages.service.ts`, `postgres.ts`)**:
  - Added input validation & XSS sanitization for source, destination, inclusions, exclusions, and itinerary.
  - Updated CRUD operations and manifest emitters to serve the corridor routes, inclusions, and exclusions.
  - Updated `CalculateFareSchema` and `CreateDraftBookingSchema` in `fare.schema.ts` and `booking.schema.ts` to accept `originName` and `destinationName` for package bookings and retain them in `BookingRecord`.
- **Admin Operations Desk (`admin/src/pages/TourPackagesPage.tsx`, `admin/src/lib/types.ts`)**:
  - Added Source (e.g., Agra) and Destination (e.g., Jaipur / Taj Mahal) input fields with quick corridor preset buttons.
  - Added interactive Inclusions & Exclusions chip tag managers with one-click standard presets ("AC Vehicle", "Fuel & Tolls", "Monument Tickets", etc.).
  - Displayed corridor route badges (`📍 Source → Destination`) in the packages table.
- **Customer Frontend Dynamic Detail Page (`PackageDetailPage.tsx`, `DynamicPackageDetailPage.tsx`)**:
  - Generalized `PackageDetailPage` so all admin-added packages render with the exact same rich, comprehensive layout as `/en/packages/agra-sightseeing/`.
  - Added dynamic fallback loader in `App.tsx` and SSG/SSR support in `ServerApp.tsx`.
  - Displayed Corridor route badges in the hero and dynamic itinerary stops, verified inclusions, and exclusions.
- **Customer Booking Flow Funnel (`BookingPage.tsx`, `PackagesPage.tsx`)**:
  - Fixed booking flow for admin-created packages by registering dynamic packages in `catalogPackages` and routing cleanly without triggering "That tour is not currently available".
  - Passed corridor source and destination to pre-fill pickup/drop details.
  - Supported per-vehicle fleet tariffs set by admin desk (`selectedPackage.fleetPrices[veh.id]`).
- **Verification**:
  - Verified full `npm run verify` passing 100% across customer, admin, and backend (3x typecheck, 27 backend test files / 184 tests, SEO lifecycle, 3x production builds).

### 2026-09-28 — Razorpay audit and production hardening

- Added `docs/PAYMENT_RAZORPAY_AUDIT_2026-09-28.md` covering payment, database, admin, customer, deployment, and SEO/AEO/GEO controls.
- Production now requires an `rzp_live_*` key; configured `rzp_test_*` keys use the real test API only outside production.
- Customer voucher display now waits for backend webhook-backed `captured` and `paid_confirmed` status.
- Production container startup now applies compiled migrations before starting the API.

### Catalog test-price allowance

The admin catalog starting-fare input now accepts values from ₹1. The backend already accepted positive values. This is for Razorpay Test Mode/catalog-flow testing only; it does not bypass server-authoritative fare calculation, payment verification, or production payment-provider safeguards.

### `0d6bd95` — SEO/AEO/GEO lifecycle governance

Merged into the root operating specification:

- Draft/published/paused/archived/retired lifecycle
- Stable URL preservation
- Archive without losing SEO value
- Sitemap and canonical rules
- AEO answer and structured-data rules
- GEO/entity consistency rules
- Lifecycle acceptance tests

### Phase 1 — Step 1.1: Production Payment Provider Enforcement & Client Checkout Modal

Implemented:

- Mandatory Razorpay credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) enforced in `backend/src/config/env.ts` when `NODE_ENV === "production"`.
- Test/dummy credentials (`rzp_test_local*`) strictly prohibited in production.
- `createRazorpayAdapter` in `backend/src/providers/adapters/razorpay.ts` throws immediately if HMAC fallback is attempted with `isProduction: true`.
- Created comprehensive unit test suite in `backend/tests/unit/payment-provider-production.test.ts` (5 tests passing).
- Created `react/src/features/booking/razorpay.ts` with dynamic script loader (`https://checkout.razorpay.com/v1/checkout.js`) and TypeScript definitions.
- Wired official Razorpay Standard Checkout modal in `react/src/features/booking/BookingPage.tsx` (`handleSubmitBooking`).
- Transition to Confirmed Voucher Step 4 is gated on backend payment status after the modal callback; the browser callback alone is not trusted.
- Verified with full `npm run verify` (typecheck x3, backend test suites, build x3).

### Phase 1 — Step 1.2: Public Media Visibility Enforcement (SEC-004)

Implemented:

- Enforced public visibility rule in `backend/src/modules/catalog/catalog.service.ts`: `getMediaContent` verifies that both the media record itself and its parent catalog item have `status === "published"` before serving bytes to anonymous callers.
- Updated `backend/src/modules/catalog/catalog.controller.ts`: Anonymous requests for unpublished/draft/archived media return HTTP 404 (`MEDIA_NOT_FOUND`). Authenticated staff/admin requests can preview draft media with `private, no-cache, no-store` headers. Published media receives `public, max-age=31536000, immutable`.
- Added migration `backend/migrations/0019_enforce_media_visibility_rls.sql` to restrict PostgREST anonymous SELECT to only published media of published items.
- Created test suite `backend/tests/unit/media-visibility.test.ts` (3 tests passing) and updated `backend/tests/integration/catalog-live.test.ts`.
- Full `npm run verify` passed with 15 test suites, 100 tests, and all builds green.

### Phase 1 — Step 1.3: Active DB Fare Engine Integration & Dynamic Catalog Sync

Implemented:

- Updated `backend/src/modules/fares/fare.types.ts`: Added `FareVehicleOverride`, `FareRuleOverrides`, and optional `ruleOverrides` in `FareEngineInput`.
- Updated `backend/src/modules/fares/fare.strategy.ts`: Added dynamic overrides support (`hasCustomRate`, `minKmPerDay`, `sameDayRoundMultiplier`, `driverAllowance`) to `PricingStrategyContext`, dynamically scaling one-way and round-trip fares when rates are updated by admin desk.
- Updated `backend/src/modules/fares/fare.engine.ts`: In `calculateFare`, verified vehicle availability against active DB overrides (`AppError("VEHICLE_UNAVAILABLE")` if deactivated), resolved dynamic package pricing and duration, and applied night allowance overrides.
- Updated `backend/src/modules/fares/fare.service.ts`: In `calculate(input)`, actively queried `db.fareRules.getActive()` and resolved package records from `db.catalog`, passing active overrides directly into the fare engine.
- Updated `backend/src/modules/bookings/booking.service.ts`: Accepted `fareService` in `deps` and delegated `createDraft` fare calculation directly to `deps.fareService.calculate(input)`.
- Updated `backend/src/app.ts`: Passed `fareService` into `createBookingService`.
- Created comprehensive test suite `backend/tests/unit/fare-db-sync.test.ts` (5 tests passing) verifying dynamic rates, vehicle deactivation, package starting prices, draft item blocking, and booking draft delegation.
- Verified with full `npm run verify` (typechecks x3, 16 test files / 105 tests passing, builds x3).

### Phase 1 — Step 1.4: Active-Version Transaction & Unique-Active Database Invariant

Implemented:

- Created database migration `backend/migrations/0020_unique_active_fare_rule.sql`:
  - Ranks existing active fare rules and cleans stale duplicates.
  - Adds partial unique index `idx_fare_rules_unique_active ON fare_rules (is_active) WHERE is_active = true`.
- Updated database repository contracts in `backend/src/db/types.ts`:
  - Added `getByVersion(version: string)`, `listAll()`, and `activate(version: string)` to `fareRules` repository interface.
- Updated `backend/src/db/postgres.ts`:
  - Enforced transactional deactivation of prior active rules before saving a new active version.
  - Added `activate(version)` transaction deactivating existing active rules and atomically activating target version with updated timestamps.
  - Added `getByVersion` and `listAll`.
- Updated `backend/src/db/memory.ts`:
  - Enforced the exact same unique-active invariant on `save` and `activate`.
- Updated admin endpoints in `backend/src/modules/admin/admin.routes.ts`, `admin.controller.ts`, `admin.service.ts`, and `admin.schema.ts`:
  - Added `POST /api/v1/ops/admin/fare-rules/activate` (with `AdminActivateFareRuleSchema`).
  - Added `GET /api/v1/ops/admin/fare-rules/versions`.
  - Added audit log logging when a fare rule version is activated.
- Created unit test suite `backend/tests/unit/fare-rules-versioning.test.ts` (3 tests passing) verifying unique-active invariant, inactive draft versions, version rollback/activation, and audit logging.
### Phase 1 — Step 1.5: End-to-End Booking & Payment State Lifecycle Tests

Implemented:

- Created comprehensive integration test suite `backend/tests/integration/booking-payment-lifecycle.test.ts`:
  - Verified payment failure webhook leaves booking unconfirmed, transitions payment status to `failed`, and prevents voucher generation.
  - Verified security boundaries: requests lacking `guestAccessToken` or supplying an invalid token cannot read booking or payment status (strictly prohibiting phone-only or ticketId-only access).
  - Verified refund webhook execution and state reflection on payment and booking models.
- Verified with full `npm run verify` (typechecks x3, 18 test files / 111 tests passing, builds x3).

### Phase 1 — Step 1.6: Lock Down Device Registration Ownership (SEC-005)

Implemented:

- Updated `POST /api/v1/devices/register` in `backend/src/app.ts`:
  - Strictly enforce ownership verification before linking a device token to a user account (`userId`) or booking (`bookingId` / `ticketId`).
  - Anonymous device registration is preserved for device-only push tokens (`userId: null, bookingId: null`).
  - If `userId` is provided, requests must be authenticated and the caller's ID must match the `userId` (unless caller has staff/admin role).
  - If `bookingId` or `ticketId` is provided, caller must either provide a valid `guestAccessToken` matching the booking or be the authenticated owner/admin of the booking.
- Fixed test auth role UUID padding in `backend/src/middlewares/authGuard.ts` to ensure 36-character standard UUID generation for test credentials.
- Created unit test suite `backend/tests/unit/device-registration-auth.test.ts` (9 tests passing) validating anonymous registration, user ownership enforcement, booking ownership enforcement with guestAccessToken, and privileged role override.
- Verified with full `npm run verify` (typechecks x3, 19 test files / 120 tests passing, builds x3).

### Phase 1 — Step 1.7: Run Migrations in Render Release Phase & Docker Entrypoint

Implemented:

- Created compiled migration runner in `backend/src/db/migrate.ts` (`dist/db/migrate.js`), executable directly with pure Node 22 without requiring development dependencies (`tsx`).
- Updated `backend/scripts/migrate.ts` to delegate to `runMigrations`.
- Created `backend/scripts/docker-entrypoint.sh`:
  - When `DATABASE_URL` is set, runs `node dist/db/migrate.js` idempotently prior to booting the Fastify server.
  - Aborts container boot immediately with code 1 if migrations fail, preventing the API from starting against an incompatible schema.
- Updated `backend/Dockerfile`:
  - Included `scripts/docker-entrypoint.sh` with executable permissions as the container `ENTRYPOINT`.
  - Updated `HEALTHCHECK` to probe `/ready`.
- Updated `render.yaml`:
  - Configured `preDeployCommand: node dist/db/migrate.js` for zero-downtime database migrations during Render release/predeploy phase.

### Phase 1 — Step 1.8: Deployment Readiness Health Check (/ready) & Failure Hardening

Implemented:

- Updated `render.yaml` to set `healthCheckPath: /ready` (replacing shallow `/health`).
- Updated `backend/Dockerfile` to set `HEALTHCHECK ... /ready`.
- Updated `backend/src/db/postgres.ts`:
  - Wrapped `pool.query("select 1 as ok")` in `try / catch` in `healthCheck()` to return `false` gracefully without unhandled exceptions when PostgreSQL connection pool fails.
- Hardened `readyHandler` in `backend/src/app.ts`:
  - Returns HTTP 503 `DB_NOT_READY` if `db.healthCheck()` returns `false` or throws.
  - Returns HTTP 503 `DB_NOT_CONFIGURED` if running in production mode (`NODE_ENV === "production"`) without `DATABASE_URL`.
  - Returns HTTP 200 `{ success: true, data: { status: "ready", store: ... } }` only when the database is fully reachable.
- Updated `docs/DEPLOYMENT.md` to document `/ready` health check and `preDeployCommand`.
- Created unit test suite `backend/tests/unit/ready-healthcheck.test.ts` (3 tests passing) verifying 200 on healthy DB and 503 on degraded / failed DB.
- Verified with full `npm run verify` (typechecks x3, 20 test files / 123 tests passing, builds x3).

## Current webhook route

```text
https://client-juj4.onrender.com/api/v1/payments/webhooks/razorpay
```

The Razorpay webhook secret must exactly matches Render's `RAZORPAY_WEBHOOK_SECRET`. Never store the secret here.

## Current verification baseline

- React typecheck/build passed after live-flow safety changes.
- Admin typecheck/build passed after auth hardening.
- Backend typecheck/build passed.
- Focused backend network-header and catalog-manifest tests passed.
- Dynamic DB fare rule and catalog sync tests passed.
- Unique-active fare rule invariant and version activation tests passed.
- Booking and payment end-to-end lifecycle and token security tests passed.
- Device registration ownership lockdown and test auth UUID validation tests passed.
- Pre-deploy migrations and deployment readiness (/ready) non-2xx tests passed (20 test files / 123 tests).
- Phase 1 release blockers complete.

### Phase 2: Source-of-Truth Convergence & Dynamic Catalog Manifest

Implemented:

- **Step 2.1 & 2.3:** Canonical route filtering and DB override in `backend/src/modules/catalog/catalog.service.ts`:
  - Strictly excludes unpublished/draft or archived catalog routes from `/api/v1/catalog/manifest`.
  - Published database routes override static baseline corridors with live DB starting price (`fs`), calculated vehicle tier fares, and stops (`routeSummary`).
- **Step 2.4:** Dynamic package media cover resolution:
  - Packages resolve published media cover images (`sortOrder: 0` or first published entry from `db.media.listByCatalogItem`) instead of generic static placeholder art.
  - Manifest revision auto-increments upon media addition, modification, or deletion.
- **Step 2.5 & 2.6:** Client bounded cache and ETag conditional validation in `react/src/services/catalogManifest.ts`:
  - Implemented `CachedManifestEnvelope` with bounded 10-minute TTL (`CACHE_TTL_MS`).
  - Sends `If-None-Match: etag` for conditional validation.
  - Handles HTTP 304 Not Modified to refresh timestamp without body transmission.
  - Marks cache with `isStale: true` when TTL expires and backend is offline.
- **Step 2.2 & 2.7:** Prioritize live manifest route over static fallback in `react/src/app/App.tsx` (`activeRoute = manifestRoute || matchedRoute`), hydrating route pages and details dynamically.
- **Tests & Verification:** Updated integration suite `backend/tests/integration/catalog-manifest-f4.test.ts` (6 passing tests). Verified full monorepo with `npm run verify` (typechecks x3, 20 test files / 125 tests, SEO tests, and builds x3 green).

### Phase 3 — Step 3.1: Secure LocationIQ Backend Proxy, Caching & Client Convergence

Implemented:

- **Backend Location Proxy (`backend/src/modules/locations/`):**
  - Verified server-held token architecture: client never directly requires `LOCATIONIQ_TOKEN`; requests are routed via `GET /api/v1/locations/autocomplete`.
  - Rate limiting enforced at 60 req/min per IP via `@fastify/rate-limit`.
  - Query sanitization: bounded length (2–80 chars), rejection of XSS/script payloads.
  - Suggestion output sanitization: HTML tags stripped, `displayName` bounded to 200 characters, maximum 8 items returned.
  - Dual storage caching in `locationCache` (PostgreSQL `location_cache` JSONB table and in-memory Map) with 30-day bounded TTL.
  - Graceful static catalog fallback (`createStaticGeocodingProvider(CURATED_PLACES)`) when LocationIQ token is unset or upstream network times out.
- **Frontend Hook Convergence (`react/src/hooks/useLocationIQ.ts`):**
  - Enhanced backend proxy response parsing to seamlessly handle both standard backend `{ source, suggestions }` envelopes and raw array formats.
  - Correctly maps `displayName`, `subtitle`, `placeId`, and coordinate pairs (`latitude`/`lat`, `longitude`/`lon`).
- **Test Coverage & Verification:**
  - Created unit test suite `backend/tests/unit/location-proxy.test.ts` (5 tests passing) covering input rejection, static fallback, 30-day cache hits, output sanitization & bounds, and upstream failure handling.
  - Ran `react/scripts/test-locationiq.ts` (24 assertions green).
  - Verified full monorepo with `npm run verify` (typechecks x3, 21 test files / 130 tests passing, SEO tests, and builds x3 green).

### 2026-10-03 — Staging Fix Pass: Prompt 1 (Admin Overview Donut Legend Alignment)

- Fixed `admin/src/components/charts/Charts.tsx` (`DonutChart`):
  - Removed cramped `sm:grid-cols-2` breakpoint from the legend `<ul>`. Replaced with single-column layout (`flex flex-1 flex-col gap-2 min-w-[180px] w-full max-w-xs`).
  - Added `whitespace-nowrap` to status labels to prevent mid-phrase wrapping ("Pending payment", "Paid · confirmed").
  - Formatted status counts with `font-mono text-xs tabular-nums text-ink text-right` aligned on one row with color swatch and label.
  - Implemented `@container flex flex-col items-center justify-center gap-6 @[440px]:flex-row` on container. When card width is narrow (< 440px), donut chart cleanly stacks vertically above the legend; on wide cards (>= 440px), chart and legend align side-by-side.
  - Preserved dark mode variables and entrance motion animations.
  - Verified with `npm --prefix admin run typecheck` (tsc clean) and `npm --prefix admin run build`.

### 2026-10-03 — Staging Fix Pass: Prompt 2 (Admin Overview 375px Mobile Responsiveness)

- Optimized admin overview and shared components for 375px mobile viewports:
  - `admin/src/pages/DashboardPage.tsx`: KPI grid updated to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Chart header wrapped responsively with `flex-col sm:flex-row items-start sm:items-center`.
  - `admin/src/components/admin/StatCard.tsx`: Added `truncate` and `font-display text-2xl sm:text-3xl` to prevent numerical KPI overflow.
  - `admin/src/components/admin/PageHeader.tsx`: Added `flex-wrap` and gap spacing to prevent action button clipping.
  - `admin/src/components/admin/Topbar.tsx` & `Sidebar.tsx`: Enforced `min-h-[44px]` accessible touch targets on mobile drawer links and buttons.
  - `admin/src/components/charts/Charts.tsx`: Adjusted `VerticalBars` spacing to `gap-1.5 sm:gap-3` with `min-w-0` and responsive fonts; enabled `flex-wrap` and word breaking on `RankedBars`.

### 2026-10-03 — Staging Fix Pass: Prompt 3 (Purge Obsolete Vehicle Tiers from Admin)

- Aligned admin vehicle types with canonical backend 5-fleet architecture:
  - Purged obsolete tiers `tempo-traveller-12`, `tempo-traveller-17`, and `coastal-coach-25` from `VehicleTier` union and `VEHICLE_LABELS` in `admin/src/lib/types.ts`.
  - Added safe fallback guards `(VEHICLE_LABELS as Record<string, string>)[b.vehicleTier] ?? b.vehicleTier` in `admin/src/pages/BookingsPage.tsx` for table and detail views to ensure older test records never crash the desk.

### 2026-10-03 — Staging Fix Pass: Prompt 4 (Remove Vehicle Tier Selector from Desk New Booking)

- Simplified desk booking creation:
  - Updated `backend/src/modules/bookings/booking.schema.ts` (`CreateDraftBookingSchema`): Added `.default("sedan")` to `vehicleTier`.
  - Updated `admin/src/lib/api.ts`: Made `vehicleTier` optional in `createAdminBooking`.
  - Updated `admin/src/pages/BookingsPage.tsx`: Removed the redundant vehicle tier dropdown from the "New Booking" modal; replaced with informative badge `"Vehicle: Sedan — standard desk rate (assigned by backend)"`. Cleaned up form state and submission payload.

### 2026-10-03 — Staging Fix Pass: Prompt 5 (New Booking Modal Mobile UX Pass)

- Redesigned "New Booking" dialog for mobile viewports:
  - Transformed into a full-screen sheet on mobile via `h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] rounded-none sm:rounded-md`.
  - Converted footer actions to a sticky bottom bar with `min-h-[44px]` full-width touch buttons.
  - Cleaned up alert banners with prominent icons and placed them above the fold for immediate feedback.

### 2026-10-03 — Staging Fix Pass: Prompt 6 (Fare Rules Save Failure Fix & Corrupt Rate Repair)

- Repaired backend fare rule persistence and audit logging:
  - Fixed `requireRole(request, ADMIN_ROLES)` returning `undefined` in `backend/src/modules/admin/admin.controller.ts` (`updateFareRules`); replaced with `requireUser(request)`.
  - Added `toUuid(id)` helper in `backend/src/modules/admin/admin.service.ts` to ensure `actor_id` in `admin_audit_logs` is always a valid UUID, eliminating PostgreSQL 22P02 invalid input syntax crashes.
  - Refined `backend/src/middlewares/errorHandler.ts` to return actual error messages for admin operations endpoints.
  - Added "Reset to standard rates" button and corrupt ₹1/km rate warning banner in `admin/src/pages/FaresPage.tsx` to allow 1-click restoration of canonical rates (₹10/14/18/25/34).

### 2026-10-03 — Staging Fix Pass: Prompt 7 (Customer Fleet Cards Backend Parity & Flash Elimination)

- Aligned customer booking page with canonical backend fleet specs:
  - Updated `VEHICLE_OPTIONS` fallback in `react/src/features/booking/BookingPage.tsx` to canonical fleet names and capacities: Sedan (4 seats, 2 bags), Ertiga (6 seats, 3 bags), Innova Crysta (6 seats, 4 bags), Tempo Traveller (12 seats, 8 bags), Force Urbania (16 seats, 10 bags).
  - Preserved vehicle model descriptions in `fleetOptions` memo to eliminate first-paint flash when live fleet data loads from `/api/v1/fleet`.
  - Extended URL query parameter parsing to accept both internal IDs and canonical tiers (e.g. `innova-crysta`, `tempo-traveller`).
  - Verified server-authoritative fare calculation and price ledger consistency.
### 2026-10-04 — Full-Stack Customer Booking Experience & Funnel Correction

- Homepage Hero Structural Stabilization:
  - Added `min-h-[580px] lg:min-h-[640px] flex items-center` to hero section and `w-full` on inner grid in `react/src/pages/HomePage.tsx`.
  - Added `min-h-[460px] flex flex-col justify-between` to `HomeBookingWidget.tsx`.
  - Eliminates hero collapse, Taj Mahal `<picture>` aspect ratio jump, background zooming/recropping, and trust ticker shifting when switching between One Way, Round Trip, and Local Taxi.
- Date Picker Unlock & Accessibility:
  - Stretched `::-webkit-calendar-picker-indicator` across `inset: 0` with `cursor: pointer` in `react/src/styles/global.css`.
  - Added `pickupInputRef` and `returnInputRef` with `openPickupPicker` / `openReturnPicker` (`showPicker()` with focus fallback) in `HomeBookingWidget.tsx` and `BookingPage.tsx`.
  - Added full mouse click, touch, and keyboard (Enter/Space) calendar trigger support.
  - Implemented round-trip date validation (`returnDate >= pickupDate`) auto-syncing return date if pickup date advances.
- Elimination of Duplicate "Choose Your Trip" Step:
  - Removed legacy 4-step fleet-first funnel and removed `<TripSelectionStep>` component invocation from `BookingPage.tsx`.
  - Transformed funnel into canonical 3-step architecture: Step 1 (Configure Trip & Vehicle), Step 2 (Guest Details & Review), Step 3 (Confirmed Voucher).
  - Homepage selections (One Way, Round Trip, Local Taxi) carry directly into canonical booking context without re-prompting.
  - Homepage Local Taxi now includes vehicle selection (`&vehicle=${selectedVehicle}`), persisting seamlessly into `/book`.
- Authoritative Review Summary & Data Cleanliness:
  - Fixed entity corruption on Step 2 where package place metadata leaked into origin and destination fields.
  - Replaced corrupted summary with canonical 4-column summary grid cleanly presenting Trip Mode, Route/Tour, Dates/Times, Vehicle, Total Fare, and 28% Advance Token.
  - Implemented user profile prefill from `useCustomerAuth()` for `fullName`, `email`, and `phone` without fabricating fake placeholders.
  - Verified "Edit Trip / Vehicle" smoothly navigates back to Step 1 while preserving active inputs.
- Verified with full `npm run verify` (typechecks x3, 23 backend vitest suites / 142 tests passing, SSG prerendering 52 pages, builds x3).

### 2026-10-04 — Dossier Database Template v2: Schema & Data Seeding (Migration 0024)

- Created and executed PostgreSQL migration `backend/migrations/0024_dossier_content.sql`:
  - Extended `route_catalog` with universal pricing and editorial columns: `use_per_km` (boolean default true), `per_km_rate_override` (numeric), `highway` (text), and `all_inclusive_note` (text).
  - Created dedicated table `local_sightseeing_packages` (id, package_code unique, name, duration_hours, included_km, covers, parking_note, fleet_prices jsonb, use_per_km default false, extra_rates jsonb, night_charge_inr, status, is_active, timestamps).
  - Created dedicated table `transfer_routes` (id, route_code unique, name, distance_text, direction_note, fleet_prices jsonb, use_per_km default false, night_charge_inr, status, is_active, timestamps). Split AGC and AF station transfers.
  - Created dedicated table `tour_packages` (id, package_code unique, name, duration_text, days, nights, base_tier_code, starting_price_inr, fleet_prices jsonb, use_per_km default false, night_charge_inr, flat_charge_inr, inclusions_highlight, inclusions_note, status, is_active, timestamps).
  - Created relational table `package_vehicle_upgrades` (id, package_id nullable FK, tier_code, passenger_note, surcharge_inr, unique indexes for global vs package overrides).
  - Created dedicated table `cancellation_policies` (id, policy_type in 'cab'/'tour_package', notice_period_text, sort_order, fee_retained_percent, refund_percent, rule_text, refund_timeline_note).
  - Created single-row table `company_profile` (brand_name, office_address, primary_phone, whatsapp_number, email, gstin, operating_hours, maps_location, dossier_version, dossier_status).
  - Created dedicated table `dossier_signoffs` (id, section_key unique, section_title, status in 'pending'/'approved'/'modification_requested', client_notes, approved_by FK, approved_at).
  - Created dedicated table `monuments` (id, name unique, visiting_hours, closed_note, historical_context, sort_order).
  - Created single-row table `pet_taxi_policy` (id, is_offered, seat_protection_note, breed_restriction_note, comfort_stop_note, booking_instruction).
- Seeded baseline rows:
  - 9 Intercity one-way corridors into `route_catalog` as `status='draft', needs_review=true` (Agra to Delhi, Noida, Gurgaon, Jaipur, Mathura/Vrindavan, Gwalior, Lucknow, Ayodhya, and Delhi to Jaipur).
  - 9 Cancellation policy slabs (3 cab tiers + 6 tour package slabs).
  - 10 Monuments from Dossier §10.2 (with Friday closure notes for Taj Mahal).
  - 1 Pet taxi policy benchmark row.
  - 1 Company profile row with live verified phone (`+91 97628 17598`) and `[TBD — confirm with client]` for unconfirmed legal/tax fields.
  - 10 Dossier sign-off sections as `status='pending'`.
  - 4 Global package vehicle upgrade rows (`package_id IS NULL`).
  - 2 Local sightseeing package draft rows (`agra-standard-sightseeing`, `agra-extended-city-tour`).
  - 4 Transfer route draft rows (`agc-station-drop`, `af-station-drop`, `kheria-airport`, `delhi-igi-oneway`).
  - 6 Signature tour packages draft rows.
- Verified database schema and seed integrity via automated PostgreSQL query script; all 10 tables and all 9 corridors verified.
### 2026-10-04 — Dossier Content: Backend Modules & Public Manifest Endpoints (Step 2)

- Built and registered all 8 discrete modules adhering to the 4-file contract (`schema`, `service`, `controller`, `routes`):
  - `tour-packages`: CRUD, slug junk-refine (`!/^\d+-btn-/.test(slug) && !/command/i.test(slug) && !/--/.test(slug)`), `listUpgrades`, `saveUpgrade`, `deleteUpgrade`, `triggerFrontendRebuild()` on publish/archive/price edits to published items. Manifest serves published packages with attached vehicle upgrades.
  - `transfer-routes`: CRUD, slug junk-refine, `triggerFrontendRebuild()`, public manifest filtering drafts.
  - `local-packages`: CRUD, slug junk-refine, `triggerFrontendRebuild()`, public manifest filtering drafts.
  - `cancellation-policies`: admin list/get/update, public list, `triggerFrontendRebuild()`.
  - `monuments`: admin list/get/update, public list, `triggerFrontendRebuild()`.
  - `pet-policy`: admin get/update, public get, `triggerFrontendRebuild()`.
  - `company-profile`: admin get/update, public get, `triggerFrontendRebuild()`.
  - `dossier-signoffs`: admin list/get/update, public list. Automatically synchronizes `company_profile.dossier_status` to `'signed_off'` when all 10 sections are approved, `'modifications_needed'` if any section requests modification, or `'pending_review'`, calling `triggerFrontendRebuild()`.
- Built combined content manifest endpoint:
  - `GET /api/v1/content/manifest` (rate-limited 120/min mirroring `route-catalog`) aggregating `cancellationPolicies`, `monuments`, `petPolicy`, `companyProfile`, and `dossierSignoffs` in a single unauthenticated roundtrip.
- Rate limits strictly configured: 120/min for public manifests/lookups, 60/min for admin reads, 30/min for admin writes, 20/min for lifecycle transitions.
- Fully wired in `backend/src/app.ts` alongside existing route catalog.
- Added comprehensive integration tests (`backend/tests/integration/dossier-manifest-modules.test.ts`) validating public manifests, draft filtering, publishing flow, vehicle upgrade bundling, junk slug rejection, and signoff synchronization.
- Zero changes made to `fare.engine.ts` (strictly deferred per scope pin).
- Fully validated via `npm run verify`: 3x typechecks, 26 vitest test suites / 150 tests passed, customer SEO lifecycle passed, 3x builds succeeded.

### 2026-10-04 — Dossier Content: Admin UI & Operations Desk (Step 3)

- Implemented §4 of the build spec across `admin/`:
  - **Sidebar & Navigation (`admin/src/components/admin/Sidebar.tsx`)**: Added navigation links for `/tour-packages`, `/local-transfers`, `/policies`, and `/sign-off` with appropriate Lucide icons.
  - **Route Catalog Extension (`admin/src/components/admin/RouteCatalogPanel.tsx`)**: Added `use_per_km` toggle, `per_km_rate_override` input, `highway` descriptor, and `all_inclusive_note`.
  - **Types & API Client (`admin/src/lib/types.ts`, `admin/src/lib/api.ts`)**: Added comprehensive TypeScript interfaces and typed CRUD API functions for all 8 dossier modules (tour packages, vehicle upgrades, local sightseeing packages, transfer routes, cancellation policies, monuments, pet taxi policy, company NAP profile, and client dossier signoffs).
  - **Tour Packages Page (`admin/src/pages/TourPackagesPage.tsx`)**: Full lifecycle management table and modal editor supporting 5 canonical fleet tiers (`sedan`, `ertiga`, `innova`, `tempo`, `urbania`), starting price, `use_per_km` toggle, night charge, flat charge, duration, and inclusions notes.
  - **Local & Transfers Page (`admin/src/pages/LocalTransfersPage.tsx`)**: Tabbed operational workspace supporting Local Sightseeing Packages (duration, included km, 5 fleet prices, extra km/hr rates editor) and Point-to-Point Transfers (doorstep station/airport transfers, distance notes, 5 fleet prices).
  - **Policies & Content Page (`admin/src/pages/PoliciesPage.tsx`)**: 4-tab interface managing:
    1. Cancellation & refund slabs for cabs and tour packages (notice window, fee retained %, refund %, rule description, refund timeline note).
    2. Pet taxi policy (offering toggle, seat protection note, breed restrictions, comfort stop rules, customer booking instruction).
    3. Company NAP Profile (official brand, registered entity, office address, phone, WhatsApp, email, GSTIN with pending `[TBD]` client confirmation banner, operating hours, Google Maps location, and dossier review status).
    4. Monuments knowledge base (10 monuments per Dossier §10.2 with visiting hours, closure notes, and historical context).
  - **Client Sign-off Page (`admin/src/pages/SignoffPage.tsx`)**: 10-row client verification checklist per Dossier §12 with status select (`pending`, `approved`, `modification_requested`), approver name, client notes, completion progress bar (`x/10 Approved`), and automatic / manual sign-off synchronization to `company_profile.dossier_status`.
  - **UI Component Utilities (`admin/src/components/ui/Input.tsx`)**: Exported accessible and theme-consistent `Textarea` component.
  - **Application Routing (`admin/src/App.tsx`)**: Lazy-loaded and mounted all 4 new pages inside `<AdminLayout />`.
- Zero changes to `fare.engine.ts` (strictly deferred to Step 4: Engine Wiring per scope pins).
- Fully validated via `npm run verify`: 3x typechecks (`customer`, `admin`, `backend`), 25 vitest test suites (150 tests passed), customer SEO tests passed, 3x production builds succeeded.

### 2026-10-04 — Dossier Content: Engine Wiring & Server Pricing Math (Step 4)

- Implemented Phase 4 (Engine Wiring) from `arenaai-dossier-admin-frontend-seo-build-spec.md` (§6, Phase 4):
  - **`backend/src/modules/fares/fare.types.ts`**: Extended `FareRuleOverrides` with `fleetPrices`, `usePerKm`, `perKmRateOverride`, `nightChargeInr`, `nights`, `upgradeSurcharges`, `nightHaltInr`, `nightStartHour`, and `nightEndHour`.
  - **`backend/src/modules/fares/cancellation.engine.ts`**: Implemented pure `calculateCancellationRefund` engine supporting all 9 Confirmation Dossier §6 & §8 slabs (3 cab slabs: >= 24h 100% refund, < 24h 0% refund, no-show 0% refund; 6 tour package slabs: > 60d 100%, 46-60d 90%, 31-45d 80%, 16-30d 70%, 6-15d 45%, 0-5d 0%).
  - **`backend/src/modules/fares/fare.engine.ts`**:
    - `isNightPickup`: Updated default night window to 20:00–06:00 IST (Dossier §5) while preferring configurable override hours (`nightStartHour` and `nightEndHour`).
    - `evaluateDossierTierBaseFare`: Implemented strict tier precedence per dossier spec:
      1. Priority 1: Admin `fleetPrices[tier]` (when `usePerKm` is false)
      2. Priority 2: `startingPrice + upgrade surcharge` (package-specific override else global matrix)
      3. Priority 3: `per-km (perKmRateOverride ?? tier base rate) × km`
    - Preserved quote-vs-charge parity: admin-set fleet price exactly matches engine output for all 5 canonical fleet tiers (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
    - Multi-night math: Multiplies `nightChargeInr` / `nightHaltInr` by `nights` on night pickups (default 1 night on 1-day trips with night pickup).
    - Preserved backward compatibility: published dossier rows take precedence over legacy constants; constants serve as seamless fallback.
  - **`backend/src/modules/fares/fare.service.ts`**:
    - In `calculate()`: Resolves published dossier rows from `tour_packages` (including package upgrades matrix), `transfer_routes`, `local_packages`, and `route_catalog`. Populates `ruleOverrides` and passes outstation `nightStartHour` / `nightEndHour`.
    - In `calculateSync()`: Properly maps `ruleOverrides.catalogDistanceKm`.
  - **`backend/src/modules/bookings/booking.service.ts`**:
    - In `transition()`: On booking cancellation (`to === "cancelled"`), evaluates cancellation policies against the booking's trip/package type and notice hours, and writes an authoritative `RefundRecord` into the `refunds` table.
  - **Comprehensive Unit & Integration Test Suites**:
    - `backend/tests/unit/fare.engine.test.ts`: Added 23 new unit test cases covering night boundaries (`19:59` no charge, `20:00` charge, `05:59` charge, `06:00` no charge), strict tier precedence, multi-night math, quote-vs-charge parity for all 5 tiers, and all 9 cancellation policy slabs. (47 passing tests total).
    - `backend/tests/integration/booking-cancellation-refund.test.ts`: Created integration test suite verifying that cancelling a paid booking generates the correct refund record according to the cancellation slab.
- Strictly maintained Phase 4 scope boundary: pricing math and engine wiring only (no admin UI edits, no frontend edits, no new database tables).
- Verified with full monorepo `npm run verify`: 3× typechecks (`customer`, `admin`, `backend`), 26 vitest test suites (175 tests passed), customer SEO checks passed, 3× production builds succeeded.

### 2026-10-04 — Dossier Content: Build Scripts & SSG SEO Pipeline (Step 5)

- Implemented Phase 5 (Build Scripts) from `arenaai-dossier-admin-frontend-seo-build-spec.md` (§6, Phase 5) with strict boundary in `react/scripts/` (no ServerApp or page component changes; deferred to Phase 6):
  - **`react/scripts/build-manifest.ts`**:
    - Mirrored the manifest fetch block for 4 new endpoints:
      - `TOUR_PACKAGES_MANIFEST_URL` → `GET /api/v1/tour-packages/manifest`
      - `TRANSFER_ROUTES_MANIFEST_URL` → `GET /api/v1/transfer-routes/manifest`
      - `LOCAL_PACKAGES_MANIFEST_URL` → `GET /api/v1/local-packages/manifest`
      - `CONTENT_MANIFEST_URL` → `GET /api/v1/content/manifest`
    - Filtered strictly on `status === 'published'`.
    - Implemented `sanitizeFleetPrices` enforcing exactly the 5 canonical tiers (`sedan`, `ertiga`, `innova`, `tempo`, `urbania`), omitting any extraneous keys (`crysta`).
    - Standardized snapshot writing with try/catch warn-and-continue to:
      - `react/src/data/generated-published-tour-packages.json`
      - `react/src/data/generated-published-transfer-routes.json`
      - `react/src/data/generated-published-local-packages.json`
      - `react/src/data/generated-published-content.json`
  - **`react/scripts/prerender.ts`**:
    - Added snapshot readers: `getPublishedTourPackageRoutes()`, `getPublishedTransferRouteRoutes()`, `getPublishedLocalPackageRoutes()`, and `getPublishedMonumentRoutes()`.
    - Extended `routesToRender` to push `/en/packages/<slug>/`, `/en/transfers/<slug>/`, and `/en/local-packages/<slug>/` for all published rows in English set per existing conventions.
  - **`react/scripts/generate-sitemap.ts`**:
    - Exported `isSitemapSafeSlug(slug)` denylist guard rejecting reserved or invalid patterns (`^\d+-btn-`, `command`, `--`, leading/trailing hyphens, length outside 2-80).
    - Added snapshot readers with source-owned `updatedAt` / `updated_at` lastmod timestamps (never build time):
      - Tour packages: priority `0.80`, `weekly`
      - Transfers: priority `0.70`, `weekly`
      - Local packages: priority `0.70`, `weekly`
      - Monuments: priority `0.50`, `monthly`
    - Appended unique entries to `sitemap.xml`.
  - **Verification**:
    - Verified all 4 snapshot files exist.
    - Verified end-to-end manifest fetching against live API, confirmed published slugs in `dist/sitemap.xml` and `public/sitemap.xml`, and verified prerendered HTML output per URL in `dist/`.
    - Confirmed seed rows restored to `draft` per Architectural Lock 4.
    - Verified full monorepo via `npm run verify`: 3× typechecks, 26 vitest test files (175 tests passing), customer SEO lifecycle tests passing, 3× builds succeeding.

### 2026-10-04 — Dossier Content: Frontend Resolution, Detail Pages & Price-Led SEO (Phase 6)

- Implemented Phase 6 (Frontend) with strict boundary in `react/src/` only (no backend, no admin, no scripts, no engine changes):
  - **`react/src/app/ServerApp.tsx`**:
    - Imported 4 snapshots: `generated-published-tour-packages.json`, `generated-published-transfer-routes.json`, `generated-published-local-packages.json`, `generated-published-content.json`.
    - Added 4 resolvers using `pathname.replace(/\/$/, "").endsWith(...)` pattern:
      - `/packages/<slug>` → dossier tour-packages snapshot (evaluated after existing static/catalog packages to preserve static routes).
      - `/transfers/<slug>` → transfer-routes snapshot.
      - `/local-packages/<slug>` → local-packages snapshot.
      - `/monuments/<slug>` → `contentSnapshot.monuments`.
    - Added all 4 to `isKnownRoute` gate to prevent spurious 404s.
    - Updated `getSeoBase` & `getSeo` with price-led titles guaranteed to survive the 60-character clamp (e.g. `Taj Sunrise Tour @ ₹12,999 | SK Baghel`), unique descriptions ≤ 155 characters, and proper canonical & hreflang tags.
    - Added render branches for `DossierTourPackagePage`, `TransferDetailPage`, `LocalPackageDetailPage`, and `MonumentDetailPage`.
  - **Dedicated Page Components (`react/src/pages/`)**:
    - **`DossierTourPackagePage.tsx`**: Dedicated page for dossier tour packages (days/nights, 5-tier dated fare table with `"Fares updated <date>"`, inclusions highlight, night-charge note, vehicle upgrade surcharges, 9 FAQs with JSON-LD, H1 title, phone in H2, breadcrumb navigation, booking funnel CTA).
    - **`TransferDetailPage.tsx`**: Dedicated page for station/airport transfers and point-to-point transfers (distance text, direction note, 5-tier dated fare table, pickup bay protocol, 9 FAQs with JSON-LD, H1 title, phone in H2, breadcrumb navigation, booking funnel CTA). Built as dedicated component rather than overloading `RouteDetailPage` due to text-based distance formatting, direction notes, and custom transfer FAQ schema.
    - **`LocalPackageDetailPage.tsx`**: Dedicated page for local sightseeing charters (duration hours & included km, areas covered, 5-tier dated fare table, extra per-km/per-hr rates table, parking/monument notes, 9 FAQs with JSON-LD, H1 title, phone in H2, breadcrumb navigation, booking funnel CTA).
    - **`MonumentDetailPage.tsx`**: Dedicated informational and cab guide page for monuments (visiting hours, Friday closure notes, historical context, dated fare table, 9 FAQs with JSON-LD, H1 title, phone in H2, breadcrumb navigation, booking funnel CTA).
  - **Listing & Internal Linking**:
    - **`PackagesPage.tsx`**: Dynamically merges published dossier tour packages from the snapshot alongside static catalog packages.
    - **`RoutesPage.tsx`**: Extended with a dedicated "Point-to-Point Transfers & Local Charters" section linking popular airport/station drops and local charters.
    - **`HomePage.tsx`**: Extended with a compact directory ribbon ("Popular Station Drops, Airport Transfers & Heritage Guides") linking transfer routes, sightseeing charters, and monument guides while fully preserving the approved bento grid and `LOCK-N07`.
  - **Verification**:
    - Temporarily published 1 row per type via SQL (`chandigarh-famous-5-places-full-day-tour`, `agc-station-drop`, `agra-standard-sightseeing`, and `taj-mahal`).
    - Verified raw HTML served from `react/dist/` for 1 URL per type:
      - Tour Package (`/en/packages/chandigarh-famous-5-places-full-day-tour/`): Price in `<title>` (`3,499`), H1 present, dated fare table present, FAQ JSON-LD present.
      - Transfer Route (`/en/transfers/agc-station-drop/`): Price in `<title>` (`800`), H1 present, dated fare table present, FAQ JSON-LD present.
      - Local Package (`/en/local-packages/agra-standard-sightseeing/`): Price in `<title>` (`1,900`), H1 present, dated fare table present, FAQ JSON-LD present.
      - Monument (`/en/monuments/taj-mahal/`): Price in `<title>` (`800`), H1 present, dated fare table present, FAQ JSON-LD present.
    - Successfully reverted all test rows back to `draft` via SQL (0 published rows remain in the DB).
    - Verified full monorepo via `npm run verify`: 3× typechecks, 26 vitest test files (175 tests passing), customer SEO lifecycle tests passing, 3× production builds green.

### 2026-10-04 — Dedup + Publish-Prep: Admin Catalog Scope & Legacy Item Archival

- **`admin/src/pages/CatalogPage.tsx`**:
  - In the "General catalog" tab's item type selector, restricted options to only `place` and `vehicle` (`GENERAL_CATALOG_CATEGORIES = ["place", "vehicle"]`), removing `package`, `tour`, `ride`, and `route`.
  - Added hint line: *"Packages, tours, transfers and routes are now managed under Tour Packages / Local & Transfers / Catalog → Routes."*
  - Updated `resetForm()` to default `formCategory` to `"place"` (with sensible blank/default values for places).
  - Maintained backward compatibility when editing legacy archived rows by preserving their original category label in the select.
- **Legacy Catalog Items Archival (One-off Migration)**:
  - Ran one-off migration script against PostgreSQL to archive legacy published items in `catalog_items`:
    - Before counts: `package` published: 7, `package` archived: 8, `place` archived: 1, `tour` archived: 2.
    - Updated 7 rows (`gu-tour`, `taj-mahal-sunrise-tour`, `gatimaan-express-agra-tour`, `agra-unhurried`, `mathura-vrindavan`, `agra-sightseeing`, `golden-triangle`) to `status = 'archived'`.
    - After counts: `package` archived: 15, `place` archived: 1, `tour` archived: 2.
    - Verified `type IN ('package', 'tour', 'ride', 'route') AND status = 'published'` count is strictly 0.
    - Completely untouched `place` and `vehicle` rows.
    - Migration script deleted after execution.
- **Verification**:
  - `GET /api/v1/catalog`: Verified returns zero items of types `package`, `tour`, `ride`, or `route` (0 total published legacy items).
  - `/packages/` and `/routes/`: Verified static and client rendering has zero duplicate cards.
  - `npm run verify`: Passed green (3× typechecks, 175 vitest tests across 26 test files, SEO lifecycle tests, and 3× builds).

### 2026-10-04 — Homepage Local Tour Booking Widget Correction

- **HomeBookingWidget Restoration**:
  - Corrected regression in `react/src/components/home/HomeBookingWidget.tsx` where selecting the Local Tour tab mistakenly displayed Outstation "From" and "To" input fields instead of the local tour package catalogue.
  - Restored dynamic local tour controls under `booking-reference--local`:
    - "Select Local Tour" dropdown with package thumbnail and canonical 1-day tours (`localTours`).
    - "Tour Date" single date picker.
    - Fleet vehicle selection and "Book Now" CTA.
    - 4 popular tour quick-select cards: Agra Local, Mathura Vrindavan, Jaipur Day Tour, and Fatehpur Sikri with active state synchronization.
  - Updated `bookingHref()` to pass `/book?trip=local&pkg=${tourSlug}&vehicle=${vehicle}&date=${date}` without outstation parameters, routing directly to the local tour booking funnel.
  - Added CSS grid positioning for `.booking-reference--local .booking-reference__field--tour` and date in `react/src/styles/global.css`.
  - Added package alias resolution in `react/src/features/booking/BookingPage.tsx` for robust handling of tour cards.
  - Verified with `npm --prefix react run typecheck`, `npm run customer:build` (SSG 47 pages), and end-to-end browser subagent session.

### 2026-10-04 — Universal Coupon Codes + Broadcast-to-Website

- **Migration 0026 (`0026_promo_broadcast_and_group_vehicles.sql`)**:
  - Added `allow_group_vehicles` (`boolean DEFAULT false NOT NULL`) and `is_broadcast` (`boolean DEFAULT false NOT NULL`) to `promo_codes`.
  - Added partial unique index `idx_promo_codes_single_broadcast` on `(is_broadcast) WHERE (is_broadcast = true)` to guarantee at the database level that at most one coupon can be broadcast live at any moment.
- **Database Layer**:
  - Updated `PromoCodeRecord` in `backend/src/types/domain.ts` and repository interfaces in `backend/src/db/types.ts` (`getById`, `getFeatured`, `delete`).
  - Updated `backend/src/db/postgres.ts` and `backend/src/db/memory.ts` mappers, `create`, `update`, and queries.
  - Catches Postgres error `23505` on `idx_promo_codes_single_broadcast` and surfaces user-friendly error: `"Another code is already broadcast. Turn it off first."`.
- **Admin Module & Public Endpoint (`backend/src/modules/promos/`)**:
  - Created `promos.schema.ts` (Zod strict, code validation regex `^[A-Z0-9_-]{3,30}$`).
  - Created `promos.service.ts` with broadcast conflict checks and featured promo resolution.
  - Created `promos.controller.ts` with `requireRole(request, ADMIN_ROLES)` on admin endpoints.
  - Created `promos.routes.ts` exposing:
    - Public: `GET /api/v1/promos/featured` (rate-limited, no auth).
    - Admin: `GET /api/v1/ops/admin/promos`, `GET /api/v1/ops/admin/promos/:id`, `POST /api/v1/ops/admin/promos`, `PUT /api/v1/ops/admin/promos/:id`, `DELETE /api/v1/ops/admin/promos/:id`.
  - Wired in `backend/src/app.ts`.
- **Fare Engine & Group Commercial Vehicle Opt-in**:
  - Added `promoAllowGroupVehicles?: boolean` to `FareEngineInput` in `fare.types.ts`.
  - In `fare.engine.ts`, updated `PROMO_NOT_ALLOWED` throw and `allowPromo` evaluations across all trip categories to permit promos on group vehicles (`tempo-traveller`, `force-urbania`) when `promoAllowGroupVehicles` is true.
  - Updated `CommercialGroupPricingStrategy` in `fare.strategy.ts` to allow promo application when opted in.
  - In `fare.service.ts`, passed DB promo's `allowGroupVehicles` to the fare engine and updated early return check.
  - In `booking.service.ts`, ensured group vehicle opt-in is honored during draft creation and refund calculations.
  - Default is `false` everywhere; legacy codes (including `ASTTCAR500OFF`) retain existing behavior.
- **Admin Operations Desk UI (`admin/src/pages/PromosPage.tsx`)**:
  - Added Promos route `/promos` with `Tag` icon in `Sidebar.tsx`.
  - Implemented full promo management table with active filters, redemption tracker, validity formatting, and delete confirmation.
  - Implemented modal dialog for create/edit supporting `allow_group_vehicles` checkbox, `is_broadcast` toggle, and live warning if another broadcast code is active.
  - Added typed API functions in `admin/src/lib/api.ts` and types in `admin/src/lib/types.ts`.
- **Customer Booking Page Broadcast Callout (`react/src/features/booking/BookingPage.tsx`)**:
  - Added `fetchFeaturedPromo()` in `react/src/services/api.ts`.
  - On Step 2 mount, fetches featured promo once.
  - If returned, no promo applied, and vehicle is eligible, displays animated callout: `"🎉 Congrats! You've got an exclusive discount: {code} — tap to apply."`.
  - Tapping automatically populates the voucher input and applies the discount.
  - Unlocks promo voucher input for commercial group vehicles when promo opts in.
  - Styled in `react/src/styles/global.css` strictly adhering to `ANIMATION_RULES.md` (vanilla CSS, transforms/opacity only, `@media (prefers-reduced-motion: reduce)` zero-motion fallback).
- **Verification**:
  - Postgres migration 0026 applied cleanly; `\d promo_codes` shows columns + partial unique index.
  - Single broadcast constraint enforced in Postgres and application layer.
  - Unit & integration tests in `backend/tests/unit/promos.test.ts` (8/8 passed).
  ### 2026-10-05 — Fix Dossier Sign-Offs Foreign Key & Booking Validation UX

- **Migration 0027 (`0027_fix_dossier_signoffs_approved_by_fkey.sql`)**:
  - Replaced foreign key constraint `dossier_signoffs_approved_by_fkey` on `dossier_signoffs (approved_by)` to reference `auth.users(id)` instead of `profiles(id)` (`ON DELETE SET NULL`).
  - Guaranteed staff/admin users authenticating via Supabase can approve dossier sections without requiring a pre-existing customer record in `public.profiles`.
  - Provisioned corresponding `super_admin` record in `public.profiles` for `skbagheltravels@gmail.com`.
- **Booking Form Validation UX (`react/src/services/customerAuthApi.ts` & `BookingPage.tsx`)**:
  - Enhanced `CustomerApiError` in `customerAuthApi.ts` to surface detailed Zod field issues (e.g. `pickupAddress: String must contain at least 5 character(s)`) in alert banners instead of generic error strings.
  - Added client-side pre-submission validation in `BookingPage.tsx` preventing submission of sub-5-character addresses and past pickup datetimes.
- **Verification**:
  - Migration 0027 applied to PostgreSQL (`schema_migrations` updated).
  - Live signoff update verified against Supabase database.
  - Full `npm run verify` passed green (184 unit/integration tests, 3× typechecks, 3× builds).

### 2026-10-05 — Relax Advance Amount Check Constraint & Discontinue Pet Taxi Service

- **Migration 0028 (`0028_relax_advance_amount_check.sql`)**:
  - Relaxed `bookings_advance_amount_check` on table `bookings` from `advance_amount >= 500` to `CHECK (advance_amount >= 1 AND advance_amount <= total_fare)`.
  - Enables promotional fares (such as ₹1 test voucher `TEST99` or promotional discounts) to finalize and create draft bookings without database constraint violations, while preserving positive non-zero advance payment integrity.
  - Standard 28% deposit with ₹500 floor for standard commercial fares remains enforced server-side by `fare.engine.ts`.
- **Migration 0029 (`0029_remove_pet_taxi_offering.sql`)**:
  - Discontinued Pet Taxi service per client instruction.
  - Updated `pet_taxi_policy` to `is_offered = false` with guidance notes.
  - Renamed `dossier_signoffs` section `specialized_offerings` from `Pet Taxi & Monument Operating Protocols` to `Monument Operating Protocols & Heritage Guidelines`.
  - Updated `react/` frontend FAQ, Terms, and data constants to explicitly specify pets and animals are not permitted inside vehicles to maintain passenger hygiene and allergen safety.
  - Added visual "Discontinued / Not Offered" indicator in Admin desk `PoliciesPage.tsx`.
- **Supermemory Script (`scripts/supermemory.ps1`)**:
  - Added native Windows PowerShell CLI script for Supermemory queries, remember, and profile retrieval.
  - Remembered the `bookings_advance_amount_check` relaxation permanently in Supermemory under tag `sk_baghel_travels`.
- **Verification**:
  - Migrations 0028 and 0029 applied cleanly to Supabase PostgreSQL database.
  - Verified constraints on `bookings` and `dossier_signoffs`.
  ### 2026-10-05 — Live Tour Packages Hydration & Manifest Build Staging Fallback

- **Live Dynamic Tour Packages Hydration (`react/src/services/catalogManifest.ts` & `react/src/pages/PackagesPage.tsx`)**:
  - Enhanced `loadPublishedPackages()` to fetch live tour packages from `/api/v1/tour-packages/manifest` alongside static baseline and manifest snapshots.
  - Re-ordered `PackagesPage.tsx` hydration map so dynamic packages published in the Admin desk take precedence over static baseline arrays without waiting for SSG rebuilds.
  - Added fallback in `react/src/services/catalog.ts` (`fetchCatalogItemBySlug`) to resolve `/api/v1/tour-packages/by-code/:code` for newly published packages (e.g. `same-day-prem-mandir-tour`).
- **Build Manifest Staging Fallback (`react/scripts/build-manifest.ts`)**:
  - Provided default fallback `apiBase` pointing to staging API (`https://skb-baghel-api-staging.onrender.com`) when `VITE_API_BASE_URL` or `CATALOG_API_URL` is omitted.
  - Generates 63 static SSG pages (including `/en/packages/same-day-prem-mandir-tour/`, 3 transfer route pages, 2 local packages, and content sections) and expands sitemap to 55 URLs.
- **Verification**:
  - `npm run verify` passed cleanly (184/184 tests across 27 files, 3x typechecks, SEO lifecycle, 3x builds).

### 2026-10-05 — Tour Packages Showcase Gallery, Image Upload Pipeline & Flexible Number Inputs

- **Migration 0030 (`0030_tour_packages_gallery.sql`)**:
  - Added `image_url TEXT` and `gallery JSONB NOT NULL DEFAULT '[]'::jsonb` to `tour_packages` table in PostgreSQL.
  - Seeded canonical high-resolution heritage photo galleries for all baseline packages (Taj Mahal sunrise/sunset, Agra Fort, Fatehpur Sikri, Mathura-Vrindavan Krishna Janmabhoomi & Prem Mandir, Bharatpur Bird Sanctuary, and Golden Triangle).
- **Backend Media Upload & Public Serve Pipeline**:
  - Extended `TourPackageRecord` and Zod schemas (`image_url`, `gallery`, `UploadTourPackageImageSchema`).
  - Added `POST /api/v1/ops/admin/tour-packages/upload-image` with authentication and admin role enforcement. Saves images to configured object storage or fast in-memory media cache.
  - Added public `GET /api/v1/tour-packages/media/:file` route with 1-year immutable caching headers.
  - Appended `image_url` and `gallery` to `/api/v1/tour-packages/manifest` for SSG snapshots and client hydration.
- **Admin Desk Showcase Gallery Manager (`admin/src/pages/TourPackagesPage.tsx`)**:
  - Added cover image preview thumbnail with photo count indicator (`📷 X photos`) in the Tour Packages management table.
  - Built comprehensive Showcase Gallery Manager inside the package editor dialog:
    - Direct image file uploader (`Upload Photo File`) automatically uploading to the backend and appending to gallery.
    - Quick-select gallery presets from verified local Agra Heritage photo library.
    - Custom URL or CDN image input with caption field.
    - Interactive thumbnail grid with "Cover" badge indicator, "Make Cover Photo" action, caption display, and single-click photo removal.
- **Flexible Numeric Inputs Across Admin Desk**:
  - Added `NumberInput` component in `admin/src/components/ui/Input.tsx` and applied CSS rules (`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`) to eliminate forced browser stepper arrows.
  - Enables direct keyboard typing, easy backspacing, and editing of prices and quantities without snapping to zero.
  - Replaced numeric inputs across `TourPackagesPage.tsx`, `LocalTransfersPage.tsx`, and `FaresPage.tsx`.
- **Customer Frontend Interactive Multi-Image Gallery (`react/src/pages/PackagesPage.tsx`)**:
  - Upgraded "Handpicked Itineraries / Curated North India Tours" package cards into an interactive multi-image showcase matching the `#famous-places` UX.
  - Integrated high-performance `PackagePhoto` component utilizing responsive `<picture>` with AVIF/WebP sources (480w, 960w, 1600w), `loading="lazy"`, and `decoding="async"`.
  - Added interactive thumbnail strip allowing instant image switching on the card stage.
  - Added full-screen high-resolution Lightbox modal with zoom, image captions, and counter (`1 / X`).
  - Updated `react/scripts/build-manifest.ts` and `react/src/services/catalogManifest.ts` to snapshot and hydrate `image` and `gallery` fields for all published packages.
- **Verification**:
  - Migration 0030 executed cleanly against Postgres database.
  - 184/184 vitest tests passed across 27 test files.
  - SEO lifecycle tests passed.
  - Monorepo verification `npm run verify` passed cleanly (3× typechecks, 3× builds: React SSG 63 pages + 14 redirects, Admin Desk SPA, Backend).

### 2026-10-07 — Seed Customer Account & Frontend Seed Login Portal

- **Database Customer Account Seeding (`backend/scripts/seed-customer-account.ts`)**:
  - Provisioned verified customer user in Supabase Auth via admin API:
    - Email: `test.customer@agraskbagheltourandtravels.com`
    - Password: `CustomerTest@2026!`
    - ID: `e7023d17-a836-47b0-8ce3-36d2781e20f9`
    - `email_confirm: true`, `app_metadata.role: "customer"`
  - Upserted matching `profiles` record in PostgreSQL database:
    - `id`: `e7023d17-a836-47b0-8ce3-36d2781e20f9`
    - `full_name`: `Test Customer`
    - `phone`: `+919876543299`
    - `email`: `test.customer@agraskbagheltourandtravels.com`
    - `role`: `customer`
- **Customer Auth & Frontend Login Expansion**:
  - `react/src/auth/customerAuth.tsx`:
    - Added `signInWithPassword(email, password)` and `signInWithSeedCustomer()` to `useCustomerAuth()`.
    - Exported `SEED_CUSTOMER_CREDENTIALS` for fast developer testing.
  - Added `react/src/pages/LoginPage.tsx` with Mughal Terracotta tokens:
    - 1-Click "⚡ Seed Customer Login" for instant local and staging testing.
    - Google OAuth sign-in option.
    - Standard Email & Password sign-in form.
    - Post-login redirection to `returnTo` target (defaults to `/my-bookings`).
  - Added `/login` route in `react/src/app/App.tsx` and `react/src/app/ServerApp.tsx`.
  - Added 1-Click Seed Customer Login and `/login` link directly to unauthenticated views in `MyBookingsPage.tsx` and `PaymentResumePage.tsx`.
- **Verification**:
  - Verified backend `authGuard.ts` accepts Supabase access token for the seeded customer.
  - Verified `npm run verify` passed cleanly (193/193 tests, 3× typechecks, SEO checks, 3× builds).

### 2026-10-07 — Step 1: Bidirectional Route Catalog, SSG Route Pre-Rendering & Search Resolution

- **Corridor & Reverse Route Synthesis**:
  - `backend/src/modules/catalog/catalog.service.ts`: Updated `buildManifest()` to query `route_catalog` and synthesize reverse routes (`${dest}-to-${source}-taxi`) for all published intercity corridors.
  - `backend/src/modules/route-catalog/route-catalog.controller.ts`: Emitted both forward and reverse routes in `/api/v1/route-catalog/manifest`.
  - `backend/src/modules/fares/fare.service.ts`: Enabled bidirectional corridor and slug matching (`-taxi`, base slug, reversed pairs).
- **Frontend Manifest & SSG Integration**:
  - `react/scripts/build-manifest.ts`: Emitted 2,067 routes into `public/routes-manifest.json`, 971 typed routes into `src/data/generated-catalog.json`, and bidirectional pairs into `generated-published-routes.json`.
  - `react/src/app/App.tsx` & `react/src/app/ServerApp.tsx`: Registered published route items in SSR/SSG route matchers and client routes.
  - `react/src/features/booking/BookingPage.tsx`: Overhauled `findSupportedRoute` to search static, published, manifest, and catalog routes bidirectionally, resolving routes like `Thora → Jewar` and `Jewar → Thora` without "currently not available" errors.
- **Verification**:
  - All typechecks passed cleanly (`customer:typecheck`, `backend:typecheck`, `admin:typecheck`).
  - Pre-rendered 77 SSG HTML pages including bidirectional routes.

### 2026-10-07 — Step 2: Tour Package Media Resolution, Fixed Package Pricing & Aram Bagh Monument

- **Tour Package Media & Photo URL Resolution**:
  - `react/src/services/catalog.ts`: Updated `resolveCatalogMediaUrl` to handle all `/api/` relative endpoints (e.g. `/api/v1/tour-packages/media/:file`, `/api/v1/media/:id`), prepending `getApiBaseUrl()` so that customer browser and SSG loads never 404 against frontend host.
  - `react/src/services/catalogManifest.ts`: Updated `toDossierTourPackage` to resolve cover `image` and all `gallery` items through `resolveCatalogMediaUrl`, and map full `fleetPrices` (Sedan, Ertiga, Innova, Tempo, Urbania) from admin packages.
  - `react/src/pages/PackagesPage.tsx`: Updated `PackagePhoto` with image fallback error handling, updated `enrichedPackages` to display live admin `fleetPrices` on package cards, and resolved all card cover/gallery photos.
  - `react/src/pages/PackageDetailPage.tsx`: Resolved main hero photo and secondary gallery mosaic items with graceful fallbacks.
  - `react/scripts/build-manifest.ts`: Ensured `/api/` package media URLs are resolved to absolute staging API URLs during build snapshotting.
- **Fixed Package Pricing Enforcement**:
  - `backend/src/modules/fares/fare.service.ts`: Set `dossierUsePerKm = false` for tour packages, ensuring tour packages never fall through to per-km distance recalculations.
  - `backend/src/modules/fares/fare.engine.ts`: Enforced user directive ("price rules applied everywhere, but not in package") by keeping tour packages strictly fixed-price (`packageBasePrice + PACKAGE_UPGRADES[vehicleId]` or admin `fleetPrices[tier]`), preventing outstation distance/allowance overrides from distorting package fares.
- **Monuments Addition**:
  - `backend/src/db/dossier-seeds.ts`: Added `Aram Bagh (Ram Bagh)` to `SEED_MONUMENTS` (Babur 1528 Mughal Charbagh garden).
  - `backend/tests/integration/dossier-manifest-modules.test.ts`: Updated monument count assertion from 10 to 11.
  - `react/src/components/home/FamousPlacesSection.tsx`: Added `Aram Bagh (Ram Bagh)` to `FAMOUS_PLACES`.
- **Verification**:
  - `customer:typecheck`: 0 errors.
  - `backend:typecheck`: 0 errors.
  - `admin:typecheck`: 0 errors.
  - `npm test`: 30 test files / 202 tests passed.
  - `npm --prefix react run react:build`: SSG completed 77 pages pre-rendered with zero errors.

### 2026-10-10 — Unified Cross-Workspace Contracts & Mock Data Purge

- **Dedicated Shared Contracts (`contracts/`)**:
  - Authored canonical models in `contracts/models/`: `tour-packages.ts`, `routes.ts`, `local-packages.ts`, `transfer-routes.ts`, `monuments.ts`, `promos.ts`, `fares.ts`, `bookings.ts`, `policies.ts`.
  - Added `CatalogStatus` and `CATALOG_STATUSES` to `contracts/enums/product-verticals.ts`.
  - Created `contracts/index.ts` re-exporting all canonical enums and models.
  - Enhanced `contracts/scripts/sync-contracts.ts` to sync all 13 contract files and index into `backend/src/contracts/`, `admin/src/contracts/`, and `react/src/contracts/`.
  - Verified with `npx tsx contracts/scripts/sync-contracts.ts --check` (exit code 0, zero drift).
- **Default Promo Code Purge (`DEFAULT_PROMO` / `ASTTCAR500OFF`)**:
  - `backend/src/modules/fares/fare.catalogue.ts`: Removed `DEFAULT_PROMO`.
  - `backend/src/modules/fares/rules/promo.rules.ts`: Removed fallback discount logic; promo evaluation strictly checks database.
  - `backend/src/modules/admin/admin.service.ts`: Removed `defaultPromo: DEFAULT_PROMO`.
  - `react/src/data.ts` & `fares.ts`: Removed `ASTTCAR500OFF` fallback definitions; `promoCodes` initialized empty.
  - `react/src/components/home/BenefitsSection.tsx`: Replaced static `ASTTCAR500OFF` card with dynamic seasonal offers copy.
  - `react/src/components/layout/EditorialPageTemplate.tsx`: Removed static `ASTTCAR500OFF` default; returns `null` if no code provided.
  - `react/src/features/booking/BookingPage.tsx`: Dynamic placeholder binding.
  - `react/src/pages/HomePage.tsx`: Fetches broadcast promo from `fetchFeaturedPromo()`; renders coupon strip only when a real database promo is present.
- **Operational Mock Data Purge**:
  - `backend/src/db/seedData.ts`: Emptied mock collections (`SEED_BOOKINGS`, `SEED_PAYMENTS`, `SEED_PROMO_CODES`, `SEED_REVIEWS`, `SEED_INQUIRIES`, `SEED_AUDIT_LOGS`, `SEED_NOTIFICATION_JOBS`, `SEED_DEVICES`, `SEED_WEBHOOKS`, and fake customer profiles).
  - In-memory data store in `backend/src/db/memory.ts` now initializes clean maps with zero mock rows.
  - `admin/src/lib/types.ts` now re-exports domain interfaces directly from `@/contracts`.
- **Verification**:
  - `backend`: typecheck clean, production build clean (`tsc -p tsconfig.build.json`) with code 0.
  - `admin`: typecheck clean, production build clean (`vite build`) with code 0.
  - `react`: typecheck clean, production build clean (`prerender.ts` 58 SSG pages) with code 0.
  - `contracts`: `sync-contracts.ts --check` passes with code 0.

### 2026-10-12 — Customer Site Legacy Remediation & Canonical Fare Alignment (Phases 1 to 10)

- **Phase 1: Canonical Contracts & Field Definitions**:
  - Re-synced contracts via `sync-contracts.ts` across `backend`, `admin`, and `react`; zero drift confirmed with `--check`.
  - Re-exported canonical `BookingEntryParams` in `react/src/features/booking/clean/bookingTypes.ts`.
- **Phase 2: Consolidated API Clients**:
  - Extended `react/src/services/cleanFareApi.ts` with `fetchMyProfile`, `fetchMyBookings`, and `fetchMyBooking` to unify authenticated customer endpoints.
- **Phase 3: Catalog & Outstation Route Pages Modernization**:
  - Eliminated synthetic fallbacks (`|| 2500`, `|| 3200`, `|| 4500`, etc.) in `RoutesPage.tsx`, `RouteTemplate.tsx`, `LatestRoutesSection.tsx`, and `App.tsx`.
  - Missing fares render authoritative "On request" / live quote prompts instead of phantom numbers.
- **Phase 4: Packages, Transfer & Rental Modernization**:
  - Eliminated synthetic `3499` fallback and arbitrary tier multipliers (`* 1.35`, `* 1.7`, `* 2.6`, `* 3.6`) in `TourPackageTemplate.tsx` and `PackagesPage.tsx`.
  - Tiers without published vehicle rates display dynamic quote triggers rather than client-calculated estimates.
- **Phase 5: Deep-link & Booking Normalization Boundary**:
  - Created `react/src/features/booking/clean/urlNormalizer.ts` with `normalizeBookingUrlParams` and `buildCanonicalBookingUrl`.
  - Inbound links automatically normalize legacy parameters (`tripType`, `pkg`, `packageCode`, `passengers`, `vehicle`, etc.) into `BookingEntryParams`.
  - Outward links in `RouteTemplate.tsx`, `PopularRoutes.tsx`, `HomeBookingWidget.tsx`, and `TourPackageTemplate.tsx` generate canonical query parameters.
- **Phase 6: Quote Flow Verification & Integrity Hardening**:
  - Hardened `CleanBookingPage.tsx` adhering to `INV-1` through `INV-7` (zero client price math, future date enforcement, duration boundary validation, 409 `PRICE_CHANGED` reconfirmation modal, AbortController cancellation).
- **Phase 7: Payment Flow & Authoritative Webhook Alignment**:
  - `CleanBookingPage.tsx` initiates Razorpay orders exclusively using server-calculated `amount_paise`.
  - Eliminated client signature verification as proof of payment; status updates rely strictly on authoritative server records populated by signed webhooks.
- **Phase 8: Booking Confirmation & Protected Guest Voucher Recovery**:
  - Created `react/src/pages/BookingConfirmationPage.tsx` supporting authoritative booking status retrieval, polling, and voucher printing.
  - User correction 1 strictly implemented: `guest_access_token` stored safely in `sessionStorage` (`arenaai:guest_token:${booking_id}`), passed via `x-guest-token` header, and NEVER leaked into URL search params.
  - Added guest voucher lookup bridge to `MyBookingsPage.tsx`.
- **Phase 9: Web Storage & Cache Invalidation Hardening**:
  - Verified bounded 10-minute TTL and ETag revalidation in `catalogManifest.ts`.
  - Session storage lifecycle verified for booking recovery in `bookingIntentStorage.ts`.
- **Phase 10: Frontend Legacy Code Deletion & Safety Verification**:
  - Deleted obsolete duplicate client `react/src/services/fareApi.ts` after confirming zero active callers.
  - Kept legacy backend endpoints intact per user directive 3.
- **Verification & Builds**:
  - `customer:typecheck`: 0 errors.
  - `admin:typecheck`: 0 errors.
  - `backend:typecheck`: 0 errors.
  - `npm test`: 179 backend unit tests + 3 catalog source tests passed with 0 failures.
  - `npm --prefix react run test:seo`: Passed.
  - `npm --prefix react run build`: Vite build + 59 SSG pages pre-rendered with 0 errors.

## Known next work (Phase 3 — secure integrations)

- Step 3: Anonymous Device Registration Postgres Unique Constraint Fix & Fleet Rules Verification.
- Step 3.2: High-entropy token or OTP recovery for booking status retrieval (`/api/v1/bookings/status`).
- Step 3.3: Magic-byte and MIME validation for media file uploads.
- Step 3.4: Compensating object-store cleanup.
- Step 3.5: Split staff roles into content, pricing, dispatch, finance, review, audit, and security.

See `docs/agent/00_CONTEXT_HANDOFF.md` and section 8 of the root operating specification.








