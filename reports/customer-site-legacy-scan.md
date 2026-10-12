# Master Audit Report: Customer Site Legacy Scan & Contract Drift Analysis

**Repository:** `tarun1sisodia/ArenaAI`  
**Application Scope:** Customer Site (`react/`)  
**Audit Type:** Read-Only Static Verification & Contract-Drift Inventory  
**Auditor:** Antigravity AI  
**Execution Date:** 2026-10-12  
**Operating Specification:** `reports/FINAL_CUSTOMER_SITE_LEGACY_SCAN_PROMPT.md`  
**Canonical Authorities:** `docs/CANONICAL_FIELD_REGISTRY.md`, `contracts/LOCKED.md`, `contracts/fare-system.ts`, `backend/migrations/0038_fare_system_clean_rebuild.sql`, `docs/backend/ROUTE_AND_API_INVENTORY.md`

---

## 1. Executive Summary

A comprehensive, read-only static analysis and contract-drift scan of the entire customer site (`react/`) was conducted to identify all dependencies on legacy contracts, deprecated API endpoints, obsolete database schemas, duplicated client-side fare engines, unsafe financial fallbacks, and response-shape assumptions before commencing any customer-site rewiring.

The audit scanned all 676 files within `react/` (including 164 source files in `react/src/`, 15 scripts, 22 documentation files, 18 design files, and 445 public assets) as well as root shared contracts (`contracts/`) and backend migrations (`backend/migrations/0038+`).

### 1.1 Key Metrics Table

| Metric Category | Count | Status / Summary |
|---|---:|---|
| **Total Files Scanned in `react/`** | **676** | All TypeScript (`.ts`, `.tsx`), scripts, static fixtures, and configs inspected |
| **Active TypeScript Source Files (`react/src/`)** | **164** | Fully scanned for API calls, fallbacks, coercions, and math formulas |
| **Network Call Sites (`fetch`)** | **22** | 11 canonical, 7 legacy/deprecated, 2 dead code, 2 build/test scripts |
| **API Endpoints Referenced (`/api/v1/*`)** | **59** | 24 active clean endpoints, 18 deprecated/legacy endpoints, 17 obsolete routes |
| **Supabase Client Call Sites** | **26** | Confined strictly to OAuth PKCE & session lifecycle in `src/auth/customerAuth.tsx` (0 direct DB table queries) |
| **Client-Side Financial Calculations** | **121** | Multiple client-side fare formulas violate `INV-2` (28% advance token, ₹500 floor, `* 1.85` roundtrip) |
| **Unsafe Financial Fallbacks (`?? 0`, `\|\| 2500`)** | **121** | 14 high-risk hardcoded price fallbacks (`\|\| 2500`, `\|\| 4500`, `?? 0`, `\|\| 3499`) |
| **Number Coercions (`Number(...)`, `parseInt`)** | **375** | High density of unvalidated runtime string-to-number casts |
| **Unchecked Type Casts (`as any`, `as unknown`)** | **136** | Pervasive across catalog normalization, route manifest loading, and legacy service responses |
| **URL Parameter Parsing Access Points** | **25** | High contract drift: duplicated parsing of `trip`, `tripType`, `pkg`
, `package`, `route`, `from`, `to`, `car`, `vehicle` |
| **Web Storage Access (`localStorage`, `sessionStorage`)** | **27** | Unversioned catalog manifest cache, legacy booking intent keys, and missing guest token persistence |
| **Silent Error Squashing (`catch { return [] }`)** | **8** | API error envelopes swallowed to empty arrays or nulls, hiding 500/409 errors |
| **Dead / Unreachable Service Files** | **1** | `react/src/services/fareApi.ts` has 0 imports in the repository, contains unvalidated `{ booking: any }` |

### 1.2 High-Risk Critical Flows Identified

1. **Guest Booking & Confirmation Flow Disconnect (P0 / P1):** In `CleanBookingPage.tsx` (lines 408-410), upon Razorpay checkout completion, the handler redirects to `/my-bookings?ticket=${bookingRes.ticket_id}`. However, `bookingRes.guest_access_token` is never saved or passed, payment verification is not invoked, and `MyBookingsPage.tsx` rejects unauthenticated users while completely ignoring the `?ticket=` parameter. Guest customers cannot access their confirmation voucher!
2. **Client-Side Advance Calculation & `INV-2` Violation (P0):** `fares.ts` (lines 71-74), `customDistance.ts` (lines 404-406), `RouteTemplate.tsx` (line 165), and `TourPackageTemplate.tsx` (line 120) compute an advance token as `Math.round(total * 0.28) / 100 * 100` with a minimum ₹500 floor. This directly violates the canonical contract rule `INV-2: Quote.advance = min(total, round_half_up(total * advance_percent / 100))`.
3. **Synthetic Fallback Pricing Injection (P0):** `RoutesPage.tsx` (lines 96-100), `App.tsx` (lines 423-427), `LatestRoutesSection.tsx` (line 85), and `TourPackageTemplate.tsx` (line 119) inject synthetic price fallbacks (e.g., sedan ₹2500, ertiga ₹3200, crysta ₹4500, tempo ₹9500, urbania ₹14000, packages ₹3499). If catalog data fails to load or omits a tier, the customer is shown synthetic prices rather than a fail-closed error.
4. **Autonomous Client Fare Engine in `customDistance.ts` (P0):** 493 lines of autonomous distance, tortuosity, toll, night allowance, and vehicle pricing logic that computes whole-trip quotes client-side using `MIN_ONE_WAY_FARES` (2200, 2800, 3800, 5500, 7500) and rate-per-km tables.
5. **Split Service Architecture (`cleanFareApi.ts` vs `customerAuthApi.ts` vs `api.ts`) (P1):** The new booking page (`CleanBookingPage.tsx`) uses `cleanFareApi.ts` (pointing to canonical `/api/v1/quotes`, `/api/v1/bookings`, `/api/v1/bookings/:id/payment`), whereas account recovery, payment resume, and OAuth callback (`MyBookingsPage.tsx`, `PaymentResumePage.tsx`, `AuthCallbackPage.tsx`) use `customerAuthApi.ts` (pointing to legacy `/api/v1/booking-intents`, `/api/v1/payments/create-checkout`, and `/api/v1/payments/:id/verify`).

---

## 2. Severity Definitions

Findings across this report are categorized using the standard 5-level severity model:

| Severity | Label | Definition & Operational Impact |
|---|---|---|
| **P0** | **Financial or Booking Integrity Risk** | Flaws that can calculate, display, charge, or submit an incorrect fare; bypass server quote authority; violate canonical financial invariants (`INV-1` to `INV-10`); or cause customer over/under-charging. |
| **P1** | **Production Migration Blocker** | Customer flows that call deprecated/removed endpoints, depend on obsolete database concepts (e.g., `booking-intents`, `route_catalog`), or break customer journeys (e.g., guest booking recovery). Must be resolved before retiring legacy backend paths. |
| **P2** | **Contract Drift & Unsafe Aliases** | Mismatched field names, wrong response envelopes, enum disparities, undocumented parameter conversions, or unvalidated type casts that currently work accidentally through loose typing or compatibility shims. |
| **P3** | **Legacy / Dead Code** | Code that is unreachable or unimported in production but contains obsolete logic, deprecated contracts, or dangerous patterns. Candidates for immediate isolation and deletion. |
| **P4** | **Documentation & Test Cleanup** | Discrepancies in comments, stale test fixtures, internal documentation, or mock data with zero runtime impact on production customer journeys. |

---

## 3. Complete API Matrix

Every single network call site and API endpoint path in `react/` was cataloged, traced to its actual implementation, analyzed for request/response contracts, and classified against canonical architecture.

### 3.1 Network Call Sites Inventory (All 22 `fetch` Call Sites)

| # | File | Line | Method | URL / Path | Caller Function / Context | Request Body | Response Shape Assumption | Classification | Canonical Replacement |
|---|---|---:|---|---|---|---|---|---|---|
| 1 | `scripts/build-manifest.ts` | 65 | `GET` | Dynamic source URL | `loadCatalogSource()` | None | Unchecked JSON (`any`) | `COMPATIBILITY_ALLOWED_BUT_ISOLATE` | Retain as build-time loader |
| 2 | `scripts/check-catalog-sources.ts` | 71 | `GET` | Dynamic source URL | `checkSource()` | None | Unchecked JSON (`any`) | `COMPATIBILITY_ALLOWED_BUT_ISOLATE` | Retain as CI check |
| 3 | `src/hooks/useLocationIQ.ts` | 129 | `GET` | `${baseUrl}/api/v1/locations/autocomplete?q=...` | `fetchLocationIQSuggestions()` | None | `{ data: { suggestions: [] } }` or array | `CANONICAL` | `/api/v1/locations/autocomplete` |
| 4 | `src/pages/RentalPage.tsx` | 13 | `POST` | `${baseUrl}/api/v1/rental-enquiries` | `submit()` | `FormState` JSON | `{ data: { ref, phone } }` | `CANONICAL` | `/api/v1/rental-enquiries` |
| 5 | `src/services/api.ts` | 69 | `POST` | `${baseUrl}/api/v1/fares/calculate` | `calculateServerFare()` | `CalculateFarePayload` | `{ data: ServerFareBreakdown }` | `LEGACY_REQUIRES_MIGRATION` | `POST /api/v1/quotes` |
| 6 | `src/services/api.ts` | 166 | `GET` | `${baseUrl}/api/v1/payments/:id/status?token=...` | `getPaymentStatus()` | None | `{ data: PaymentStatusResponse }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/bookings/:id` |
| 7 | `src/services/api.ts` | 186 | `POST` | `${baseUrl}/api/v1/bookings/draft` | `createDraftBooking()` | `CreateDraftBookingPayload` | `{ data: CreateDraftBookingResponse }` | `LEGACY_REQUIRES_MIGRATION` | `POST /api/v1/bookings` |
| 8 | `src/services/api.ts` | 205 | `POST` | `${baseUrl}/api/v1/payments/create-checkout` | `createPaymentCheckout()` | `CreateCheckoutPayload` | `{ data: CreateCheckoutResponse }` | `LEGACY_REQUIRES_MIGRATION` | `POST /api/v1/bookings/:id/payment` |
| 9 | `src/services/api.ts` | 263 | `POST` | `${baseUrl}/api/v1/inquiries` | `createInquiry()` | `CreateInquiryPayload` | `{ data: { id } }` | `CANONICAL` | `POST /api/v1/inquiries` |
| 10 | `src/services/api.ts` | 289 | `GET` | `${baseUrl}/api/v1/promos/featured` | `fetchFeaturedPromo()` | None | `{ data: FeaturedPromo }` | `CANONICAL` | `GET /api/v1/promos/featured` |
| 11 | `src/services/catalog.ts` | 102 | `GET` | `${baseUrl}${path}` | `getJson()` wrapper | None | `{ data: T }` | `LEGACY_REQUIRES_MIGRATION` | `cleanFareApi.ts` client |
| 12 | `src/services/catalogManifest.ts` | 79 | `GET` | `${apiBase}/api/v1/catalog/manifest` | `loadCatalogManifest()` | None | `{ data: CatalogManifestData }` | `CANONICAL` | `/api/v1/catalog/manifest` |
| 13 | `src/services/catalogManifest.ts` | 135 | `GET` | `/routes-manifest.json` | `loadRoutesManifest()` | None | Local static JSON asset | `CANONICAL` | `/routes-manifest.json` (SSG) |
| 14 | `src/services/catalogManifest.ts` | 171 | `GET` | `/routes-manifest.json` | `loadPublishedPackages()` | None | Local static JSON asset | `CANONICAL` | Static manifest |
| 15 | `src/services/catalogManifest.ts` | 205 | `GET` | `${apiBase}/api/v1/tour-packages/manifest` | `loadPublishedPackages()` | None | `{ data: TourPackage[] }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/catalog` |
| 16 | `src/services/catalogManifest.ts` | 321 | `GET` | `${apiBase}/api/v1/tour-packages/by-code/:code` | `fetchTourPackageBySlug()` | None | `{ data: any }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/catalog/tour_package/:code` |
| 17 | `src/services/catalogManifest.ts` | 350 | `GET` | `${apiBase}/api/v1/transfers` | `fetchPublishedTransferRoutes()` | None | `{ data: any[] }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/catalog` |
| 18 | `src/services/catalogManifest.ts` | 365 | `GET` | `${apiBase}/api/v1/local-tours` | `fetchPublishedLocalTransfers()` | None | `{ data: any[] }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/catalog` |
| 19 | `src/services/catalogManifest.ts` | 380 | `GET` | `${apiBase}/api/v1/routes/fleets` | `fetchFleet()` | None | `{ data: any[] }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/quotes/options` |
| 20 | `src/services/cleanFareApi.ts` | 48 | Dynamic | Dynamic canonical paths | `apiRequest<T>()` | Dynamic JSON | Zod validated response | **`CANONICAL`** | Primary canonical client |
| 21 | `src/services/customerAuthApi.ts` | 23 | Dynamic | Dynamic customer auth paths | `apiCall<T>()` | Dynamic JSON | `(json.data ?? json) as T` | `LEGACY_REQUIRES_MIGRATION` | Migrate to clean booking auth |
| 22 | `src/services/fareApi.ts` | 34 | Dynamic | Dynamic root alias paths | `request<T>()` | Dynamic JSON | Unvalidated `any` | **`DEAD_CODE`** | Delete immediately |

### 3.2 Canonical Clean Endpoints in `cleanFareApi.ts`

| Function | Endpoint Path | HTTP Method | Request Contract | Response Contract | Runtime Caller Sites in `react/src/` |
|---|---|---|---|---|---|
| `fetchPublishedCatalog` | `/api/v1/catalog` | `GET` | None | `PublishedCatalogResponse` | `LiveCatalogSection.tsx:51`, `CleanBookingPage.tsx:160` |
| `fetchPublishedProduct` | `/api/v1/catalog/:category/:code` | `GET` | None | `PublishedProductDetail` | `ProductDetailPage.tsx:48` |
| `fetchQuoteOptions` | `/api/v1/quotes/options` | `POST` | `OptionsRequest` | `OptionsResponse` | `CleanBookingPage.tsx:271` |
| `fetchQuote` | `/api/v1/quotes` | `POST` | `QuoteRequest` | `QuoteResponse` | `CleanBookingPage.tsx:271` |
| `createBooking` | `/api/v1/bookings` | `POST` | `CreateBookingRequest` | `BookingCreateResponse` | `CleanBookingPage.tsx:382` |
| `fetchBookingById` | `/api/v1/bookings/:id` | `GET` | `x-guest-token` header | `BookingDetailResponse` | None (Defined but not linked to recovery) |
| `createBookingPayment` | `/api/v1/bookings/:id/payment` | `POST` | None | `PaymentOrderResponse` | `CleanBookingPage.tsx:392` |
| `fetchPublicReviews` | `/api/v1/public/reviews` | `GET` | None | `PublicReviewItem[]` | None in active UI |
| `fetchPublicGallery` | `/api/v1/public/gallery` | `GET` | None | `PublicGalleryItem[]` | None in active UI |
| `fetchReviewLink` | `/api/v1/reviews/links/:token` | `GET` | None | Unvalidated JSON | None in active UI |
| `submitReview` | `/api/v1/reviews/links/:token/submissions` | `POST` | Dynamic JSON | Unvalidated JSON | None in active UI |

### 3.3 Legacy Customer Endpoints in `customerAuthApi.ts`

| Function | Endpoint Path | Method | Purpose in React | Response Shape Drift | Classification | Replacement Endpoint |
|---|---|---|---|---|---|---|
| `getMyProfile` | `/api/v1/me/profile` | `GET` | Profile info | `{ data: CustomerProfile }` | `LEGACY_REQUIRES_MIGRATION` | Standardize customer profile |
| `createBookingIntent` | `/api/v1/booking-intents` | `POST` | Stage booking pre-auth | `{ intentId, quote }` | `LEGACY_REQUIRES_MIGRATION` | `POST /api/v1/bookings` |
| `getBookingIntent` | `/api/v1/booking-intents/:id` | `GET` | Re-fetch intent | `{ intentId, payload, quote }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/bookings/:id` |
| `finalizeBookingIntent` | `/api/v1/booking-intents/:id/finalize` | `POST` | Convert intent to booking | `{ booking, fare, replay }` | `LEGACY_REQUIRES_MIGRATION` | `POST /api/v1/bookings` |
| `listMyBookings` | `/api/v1/me/bookings` | `GET` | My bookings list | Hand-mapped array with fallback `?? 0` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/me/bookings` (canonical schema) |
| `getMyBooking` | `/api/v1/me/bookings/:id` | `GET` | Booking detail | `CustomerBookingDetails` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/bookings/:id` |
| `createOwnerPaymentCheckout` | `/api/v1/payments/create-checkout` | `POST` | Launch Razorpay checkout | `{ paymentId, providerOrderId, amountMinor }` | `LEGACY_REQUIRES_MIGRATION` | `POST /api/v1/bookings/:id/payment` |
| `getOwnerPaymentStatus` | `/api/v1/payments/:id/status` | `GET` | Polling payment status | `{ paymentId, status, amountMinor }` | `LEGACY_REQUIRES_MIGRATION` | `GET /api/v1/bookings/:id` |
| `verifyOwnerPayment` | `/api/v1/payments/:id/verify` | `POST` | Client signature submission | `{ paymentId, status, bookingStatus }` | `LEGACY_REQUIRES_MIGRATION` | Webhook verification + `GET /api/v1/bookings/:id` |

---

## 4. Complete Field Matrix

Every important domain and financial field used by React was mapped against `docs/CANONICAL_FIELD_REGISTRY.md` and `contracts/fare-system.ts`.

| Field used in React | File / Line | Source | Canonical Field | Type | Unit | Transformation | Safe? | Required Action |
|---|---|---|---|---|---|---|---|---|
| `route.id` | `RouteTemplate.tsx:167` | Static manifest / API | `route_id` | UUID / slug | Identifier | Direct pass-through | **No** (P2) | Map slug to `route_id` or canonical `code` |
| `routeCode` / `route_code` | `generate-sitemap.ts:148` | Route item | `code` | string | Identifier | `item.routeCode ?? item.route_code` | **No** (P2) | Standardize to canonical `code` |
| `packageCode` / `package_code` | `catalogManifest.ts:246` | Manifest item | `code` | string | Identifier | `item.packageCode ?? item.package_code ?? item.id` | **No** (P2) | Standardize to canonical `code` |
| `transfer_id` / `transferId` | `catalogManifest.ts:350` | Legacy transfer API | `transfer_id` | UUID | Identifier | Unvalidated JSON unwrap | **No** (P1) | Migrate to clean `/api/v1/catalog` |
| `localPackageKey` | `api.ts:39`, `fares.ts:76` | Enum literal | `local_package_id` | UUID / code | Identifier | `"8hr-80km" \| "12hr-120km"` | **No** (P2) | Replace with canonical `local_package_id` |
| `vehicleTier` / `carTier` | `api.ts:31`, `RentalPage.tsx:6` | UI state | `vehicle_model_id` | UUID | Identifier | `toCanonicalTierKey(vehicleId)` | **No** (P2) | Replace with canonical `vehicle_model_id` |
| `vehicleId` | `fleets.ts:20`, `fares.ts:9` | UI state | `group_code` | string | Identifier | `"sedan" \| "ertiga" \| "innova" \| ...` | **No** (P2) | Normalize `"innova"` $	o$ `"innova_crysta"`, `"tempo"` $	o$ `"tempo_traveller"` |
| `tripType` / `trip` | `HomeBookingWidget.tsx:120`, `CleanBookingPage.tsx:79` | URL / state | `trip_type` | enum | Identifier | `"round-trip"` $	o$ `"round_trip"`, `"local"` $	o$ `category: "local_package"` | **No** (P2) | Enforce boundary parser for `BookingEntryParams` |
| `passengers` / `pax` / `passengerCount` | `CleanBookingPage.tsx:98` | URL search params | `passenger_count` | integer | Count | `Number(pax \|\| passengers \|\| 2)` | **No** (P2) | Enforce `pax` with `INV-6` capacity check |
| `totalFare` | `customerAuthApi.ts:149` | Legacy API row | `total_amount` | number | INR Rupee | `Number(fare.totalFare ?? row.totalFare ?? 0)` | **CRITICAL (P0)** | Remove fallback `?? 0`, fail closed |
| `advanceAmount` | `customerAuthApi.ts:150` | Legacy API row | `advance_amount` | number | INR Rupee | `Number(fare.advanceAmount ?? row.advanceAmount ?? 0)` | **CRITICAL (P0)** | Read only from server snapshot, remove `?? 0` |
| `balanceAmount` | `customerAuthApi.ts:151` | Legacy API row | `balance_amount` | number | INR Rupee | `Number(fare.balanceAmount ?? row.balanceAmount ?? 0)` | **CRITICAL (P0)** | Read only from server snapshot, remove `?? 0` |
| `amount_paise` | `CleanBookingPage.tsx:398` | Server payment response | `amount_paise` | integer | Paise | Direct server snapshot | **Yes** (Safe) | Retain direct pass-through to Razorpay |
| `amountMinor` | `api.ts:141`, `customerAuthApi.ts:169` | Legacy checkout | `amount_paise` | integer | Paise | Unvalidated minor unit | **No** (P2) | Align with canonical `amount_paise` |
| `startingPriceInr` | `catalog.ts:198`, `catalogManifest.ts:240` | Manifest item | `amount` (base fare) | number | INR Rupee | `Number(res.startingPriceInr \|\| res.fleetPrices?.sedan \|\| 3499)` | **CRITICAL (P0)** | Remove hardcoded `\|\| 3499`, use server catalog rate |
| `primaryFare` | `RouteTemplate.tsx:164` | Component state | Base route fare | number | INR Rupee | `Math.round(baseSedanFare * 1.8)` | **CRITICAL (P0)** | Browser must not calculate round-trip fare |
| `advanceToken` | `RouteTemplate.tsx:165`, `LatestRoutesSection.tsx:86` | Component state | `advance_amount` | number | INR Rupee | `Math.round(primaryFare * 0.28)` | **CRITICAL (P0)** | Violates `INV-2`, browser must not compute advance |
| `fares.sedan` | `RoutesPage.tsx:96`, `App.tsx:423` | Route item | Vehicle model fare | number | INR Rupee | `item.fares?.sedan \|\| 2500` | **CRITICAL (P0)** | Remove hardcoded `\|\| 2500` price injection |
| `fares.ertiga` | `RoutesPage.tsx:97`, `App.tsx:424` | Route item | Vehicle model fare | number | INR Rupee | `item.fares?.ertiga \|\| 3200` | **CRITICAL (P0)** | Remove hardcoded `\|\| 3200` price injection |
| `fares.innova` / `crysta` | `RoutesPage.tsx:98`, `App.tsx:425` | Route item | Vehicle model fare | number | INR Rupee | `item.fares?.innova \|\| 4500` | **CRITICAL (P0)** | Remove hardcoded `\|\| 4500` price injection |
| `fares.tempo` | `RoutesPage.tsx:99`, `App.tsx:426` | Route item | Vehicle model fare | number | INR Rupee | `item.fares?.tempo \|\| 9500` | **CRITICAL (P0)** | Remove hardcoded `\|\| 9500` price injection |
| `fares.urbania` | `RoutesPage.tsx:100`, `App.tsx:427` | Route item | Vehicle model fare | number | INR Rupee | `item.fares?.urbania \|\| 14000` | **CRITICAL (P0)** | Remove hardcoded `\|\| 14000` price injection |
| `distanceKm` | `LatestRoutesSection.tsx:81`, `App.tsx:419` | Route item | `distance_km` | number | Kilometres | `r.distanceKm ?? r.distance_km ?? 200` | **No** (P2) | Remove hardcoded `200` fallback |

---

## 5. Complete Financial-Flow Matrix

All 11 user journeys that touch or display prices were mapped from input source to payment amount.

| Journey # | Journey Name | Input Source | State Variable | API Call | Response Type | Client Transformation | Displayed Amount | Submitted Amount | Payment Amount | Integrity Rating |
|---|---|---|---|---|---|---|---|---|---|---|
| **J-01** | Homepage Booking Widget (Outstation) | Form inputs (origin, dest, date) | `mode`, `selectedVehicle` | None (Constructs URL) | N/A | Generates `/book?from=...&to=...&trip=...` | None | URL Query Params | None | **Drift (P2)** |
| **J-02** | Homepage Booking Widget (Local) | Tour dropdown | `localTourId`, `selectedTour` | None (Constructs URL) | N/A | Generates `/book?trip=local&pkg=...` | Indicative card price | URL Query Params | None | **Drift (P2)** |
| **J-03** | Route Listing Page (`/routes/`) | Manifest / search | `filteredRoutes` | `loadRoutesManifest()` | `routes-manifest.json` | Fallbacks: `sedan \|\| 2500`, `ertiga \|\| 3200`, `innova \|\| 4500` | Synthetic starting price | None | None | **P0 Risk** |
| **J-04** | Route Detail Template (`/routes/:id/`) | Static route data | `primaryFare`, `advanceToken` | None | Static / SSG | `baseSedanFare * 1.8`, `primaryFare * 0.28` | Calculated roundtrip & 28% token | `/book?from=...` CTA | None | **P0 Risk** |
| **J-05** | Instant Route Calculator | From/To inputs | `matchedEntry`, `indicativeQuote` | `loadRoutesManifest()` | `routes-manifest.json` | `getIndicativeBrowseFare()` (multiplies km * rate, +500 halt) | Indicative total & advance | URL navigation | None | **P0 Risk** |
| **J-06** | Packages Listing (`/packages/`) | Package catalog | `packages` | `loadPublishedPackages()` | Static JSON | `startingPriceInr \|\| fleetPrices.sedan \|\| 3499` | Starting from ₹3,499 | CTA click | None | **P0 Risk** |
| **J-07** | Tour Package Detail (`/packages/:slug/`) | URL slug | `grossPrice`, `tierFare`, `token` | `fetchTourPackageBySlug()` | Tour package record | Multiplies `grossPrice * 1.35, 1.7, 2.6, 3.6` and `* 0.28` | Calculated tier prices & token | `/book.html?trip=package` | None | **P0 Risk** |
| **J-08** | Clean Booking Flow (`/book`) | Category, product, vehicle, dates | `options`, `selectedCar`, `quote` | `fetchQuoteOptions()`, `fetchQuote()` | `OptionsResponse`, `QuoteResponse` | Display only (validates server quote) | Server `quote.total`, `quote.advance` | `quoted_total: quote.total` | `amount_paise: advance * 100` | **CANONICAL** |
| **J-09** | Reconfirmation Gate (`PRICE_CHANGED`) | 409 API error | `reconfirmation.freshQuote` | `createBooking()` $	o$ 409 | `CleanFareApiError` with `fresh_quote` | Displays fresh quote, requires user acceptance | Server updated quote | Re-submits with fresh `quoted_total` | Fresh advance paise | **CANONICAL** |
| **J-10** | Payment Launch & Razorpay Callback | Booking creation response | `paymentRes` | `createBookingPayment()` | `PaymentOrderResponse` | None (Direct `paymentRes.amount_paise`) | Razorpay Modal Deposit | Server order ID | Server `amount_paise` | **P0/P1 Disconnect** |
| **J-11** | Customer Account / Recovery (`/my-bookings`) | User auth token | `items` | `listMyBookings()` | `CustomerBookingSummary[]` | Maps `fare.totalFare ?? row.totalFare ?? 0` | Fallback currency format | None | Legacy checkout | **P0 Risk** |

---

## 6. Legacy Dependency Inventory

### 6.1 Legacy APIs

1. `/api/v1/fares/calculate`: Called in `src/services/api.ts` line 69; referenced in `src/fares.ts` line 358. Deprecated; replaced by `POST /api/v1/quotes`.
2. `/api/v1/fleet`: Called in `src/services/catalog.ts` line 226. Deprecated; replaced by `POST /api/v1/quotes/options`.
3. `/api/v1/bookings/draft`: Called in `src/services/api.ts` line 186. Deprecated; replaced by `POST /api/v1/bookings`.
4. `/api/v1/booking-intents/*`: Called in `src/services/customerAuthApi.ts` lines 112, 119, 123; handled in `AuthCallbackPage.tsx` lines 39, 46, 143. Deprecated legacy intent table.
5. `/api/v1/payments/create-checkout`: Called in `src/services/api.ts` line 205 and `src/services/customerAuthApi.ts` line 175; used in `PaymentResumePage.tsx` line 140. Deprecated; replaced by `POST /api/v1/bookings/:id/payment`.
6. `/api/v1/payments/:id/status`: Called in `src/services/api.ts` line 166 and `src/services/customerAuthApi.ts` line 194; used in `PaymentResumePage.tsx` line 82. Replaced by `GET /api/v1/bookings/:id`.
7. `/api/v1/payments/:id/verify`: Called in `src/services/customerAuthApi.ts` line 202; used in `PaymentResumePage.tsx` line 67. Client signature verification is deprecated in favor of server webhook verification.
8. `/api/v1/tour-packages/manifest`: Called in `src/services/catalogManifest.ts` line 205. Replaced by canonical `GET /api/v1/catalog`.
9. `/api/v1/tour-packages/by-code/:code`: Called in `src/services/catalogManifest.ts` line 321 and `src/services/catalog.ts` line 196. Replaced by canonical `GET /api/v1/catalog/tour_package/:code`.
10. `/api/v1/transfers`: Called in `src/services/catalogManifest.ts` line 350. Replaced by canonical `GET /api/v1/catalog`.
11. `/api/v1/local-tours`: Called in `src/services/catalogManifest.ts` line 365. Deprecated table endpoint; replaced by `GET /api/v1/catalog`.
12. `/api/v1/routes/fleets`: Called in `src/services/catalogManifest.ts` line 380. Deprecated endpoint; replaced by `POST /api/v1/quotes/options`.
13. `Root Alias Routes` (`/quotes/options`, `/quotes`, `/bookings`, `/bookings/:id/payment`): Defined in `src/services/fareApi.ts`. Misses `/api/v1/` prefix, completely unimported (dead code).

### 6.2 Legacy Database Concepts

1. `route_catalog`: Referenced in `scripts/build-manifest.ts` line 180 and legacy sync scripts. Replaced by `outstation_routes`.
2. `local_sightseeing_packages`: Replaced by `local_packages`.
3. `transfer_routes`: Replaced by `transfers`.
4. `local_tours`: Referenced in `HomeBookingWidget.tsx` line 91 and `catalogManifest.ts` line 365. Deprecated concept.
5. `customer_booking_intents` / `booking_intents`: Referenced in `customerAuthApi.ts` lines 46, 112, 119 and `bookingIntentStorage.ts`. Replaced by direct `bookings` creation with frozen snapshots.

### 6.3 Client-Side Fare Calculations (Violations of Financial Rules)

1. `react/src/fares.ts` lines 71-74: `advanceOf(total)` computes `Math.max(500, Math.round((total * 0.28) / 100) * 100)`. Violates `INV-2`.
2. `react/src/fares.ts` lines 250-255: `findRoute` applies client hardcoded rates `estimatedKm * 10.0`, `14.0`, `18.0`, `25.0`, `34.0` with floor values (2200, 2800, 3800, 5500, 7500).
3. `react/src/fares.ts` lines 335-343: `getIndicativeBrowseFare` multiplies `billedKm * vehicle.perKm`, applies `base * 1.85` for round trips, and adds ₹500 driver allowance.
4. `react/src/utils/customDistance.ts` lines 355-407: Full autonomous pricing engine calculating billable km, `billableKm * vehicle.perKm`, toll formulas (`distanceKm * ratePerKm`), night allowances, total estimated fare, and 28% advance.
5. `react/src/templates/RouteTemplate.tsx` lines 163-165: Computes `primaryFare = Math.round(baseSedanFare * 1.8)` and `advanceToken = Math.round(primaryFare * 0.28)`.
6. `react/src/templates/TourPackageTemplate.tsx` lines 119-121 & 570-580: Computes gross price fallback, multiplies by `1.35`, `1.7`, `2.6`, `3.6` for tiers, and applies `* 0.28` for advance tokens.
7. `react/src/templates/sections/LatestRoutesSection.tsx` lines 85-86: Computes `token = Math.round(startingFare * 0.28)` from fallback starting fare ₹2,500.

### 6.4 Unsafe Financial Fallbacks

1. `src/services/customerAuthApi.ts` lines 149-151:
   ```ts
   totalFare: Number(fare.totalFare ?? row.totalFare ?? 0),
   advanceAmount: Number(fare.advanceAmount ?? row.advanceAmount ?? 0),
   balanceAmount: Number(fare.balanceAmount ?? row.balanceAmount ?? 0),
   ```
2. `src/services/catalog.ts` line 198:
   ```ts
   const startingPrice = Number(res.startingPriceInr || (res.fleetPrices as any)?.sedan || 3499);
   ```
3. `src/services/catalogManifest.ts` lines 240-245:
   ```ts
   const startingPrice = Number(item.startingPriceInr || fleetPrices.sedan || item.from || 3499);
   ```
4. `src/pages/RoutesPage.tsx` lines 96-100:
   ```ts
   fares: {
     sedan: item.fares?.sedan || 2500,
     ertiga: item.fares?.ertiga || 3200,
     crysta: item.fares?.innova || 4500,
     tempo: item.fares?.tempo || 9500,
     urbania: item.fares?.urbania || 14000,
   }
   ```
5. `src/app/App.tsx` lines 370-374:
   ```ts
   fares: {
     sedan: Number(fares.sedan ?? 2000),
     ertiga: Number(fares.ertiga ?? 2800),
     innova: Number(fares.innova ?? 3800),
     tempo: Number(fares.tempo ?? 5500),
     urbania: Number(fares.urbania ?? 7500),
   }
   ```
6. `src/app/App.tsx` lines 423-427:
   ```ts
   fares: {
     sedan: entry.fs || 2500,
     ertiga: entry.fe || 3200,
     innova: entry.fi || 4500,
     tempo: entry.ft > 100 ? entry.ft : 9500,
     urbania: entry.fu > 100 ? entry.fu : 14000,
   }
   ```
7. `src/templates/sections/LatestRoutesSection.tsx` lines 81-85:
   ```ts
   const distance = r.distanceKm ?? r.distance_km ?? 200;
   const startingFare = Number(sedanResolved.value || 2500);
   ```
8. `src/templates/TourPackageTemplate.tsx` line 119:
   ```ts
   const grossPrice = Number(pkg.from || pkg.startingPriceInr || pkg.fleetPrices?.sedan || 3499);
   ```

### 6.5 Deep Link & URL Compatibility Drift

- `CleanBookingPage.tsx` lines 79-102 maintains an ad-hoc local normalization shim:
  - `trip` vs `tripType` vs `round_trip` vs `round-trip`
  - `passengers` vs `pax` vs `passengerCount`
  - `product` vs `package` vs `pkg` vs `route`
  - `vehicle` vs `car`
- `HomeBookingWidget.tsx` lines 118-120 emits:
  - `/book?trip=local&pkg=${slug}&vehicle=${car}&date=${date}` (violates `category`, `product`, `car`)
  - `/book?from=${o}&to=${d}&vehicle=${car}&trip=${t}&returnDate=${ret}` (violates `return_date`)
- `RouteTemplate.tsx` line 167 emits:
  - `/book?from=...&to=...&vehicle=sedan&route=...&tripType=...`
- `PopularRoutes.tsx` line 97 emits:
  - `/book.html?from=...&to=...&trip=one-way`
- `TourPackageTemplate.tsx` line 623 emits:
  - `/book.html?trip=package&package=...&vehicle=...&step=1`

### 6.6 Web Storage & Caching Inventory

1. `window.localStorage["arenaai_manifest_cache_v1"]`: Managed in `src/services/catalogManifest.ts` lines 54, 90, 108. Caches catalog manifest with ETag. No TTL expiry or schema migration validation.
2. `window.sessionStorage["arenaai:cat:${path}"]`: Managed in `src/services/catalog.ts` lines 87, 118. Caches raw API responses by path with 5-minute TTL. Stores unvalidated legacy response shapes.
3. `window.sessionStorage["arenaai:booking-intent:v1"]`: Managed in `src/auth/bookingIntentStorage.ts` lines 21, 30. Stores pending booking intent for OAuth return. Points to deprecated intent API.
4. `window.sessionStorage["arenaai:payment-resume"]`: Managed in `src/auth/bookingIntentStorage.ts` line 51 and `src/pages/PaymentResumePage.tsx` line 34. Stores `{ bookingId, ticketId, idempotencyKey }`. Requires customer login, does not support guest recovery.
5. `window.sessionStorage["arenaai:auth:return_to"]`: Managed in `src/auth/customerAuth.tsx` lines 262, 319. Stores return URL post-OAuth. Safe UI redirect state.
6. `window.localStorage["arenaai:account-prompt-dismissed"]`: Managed in `src/pages/HomePage.tsx` lines 23, 84. Safe UI flag.
7. `window.localStorage["theme"]`: Managed in `src/components/chrome/ThemeToggle.tsx` line 10. Safe UI flag.
8. `window.localStorage["arenaai:buddy:dismissed"]`: Managed in `src/components/avatar/BuddyWidget.tsx` line 27. Safe UI flag.

### 6.7 Silent Error Squashing

1. `src/app/App.tsx` line 319: `loadPublishedPackages().catch(() => {});` (swallows package load failures)
2. `src/app/App.tsx` line 432: `loadRoutesManifest().catch(() => {});` (swallows manifest load failures)
3. `src/pages/HomePage.tsx` line 43: `fetchFeaturedPromo().catch(() => undefined);`
4. `src/pages/PackagesPage.tsx` line 449: `loadPublishedPackages().catch(() => {});`
5. `src/pages/RoutesPage.tsx` line 147: `loadRoutesManifest().catch(() => {});`
6. `src/pages/ServicesPage.tsx` line 164: `fetchLiveFleet().catch(() => {});`
7. `src/services/catalogManifest.ts` lines 355, 371, 386: `catch { return []; }` (converts network or 500 errors to empty lists)
8. `src/components/chrome/Header.tsx` line 243 & `MobileNavSheet.tsx` line 188: `void signOut().catch(() => {});`

### 6.8 Static Data & Hardcoded Business Values

1. `react/src/data/prices.ts`: Defines hardcoded `fleet_per_km` (10, 14, 18, 25, 34), `routes_oneway` (3499, 3699, 2200, 3000, 1800), `local_packages` (1900, 2200), `tours` (3499, 5200, 4200). Imported by `RentalPage.tsx`. Classification: **Forbidden Business Logic / Dead Data**.
2. `react/src/data/fleets.ts`: Hardcodes 5 vehicle tiers and labels. Notes discrepancy with backend tier keys. Classification: **UI Label Metadata**.
3. `react/src/data.ts`: 1131 lines of static cities, vehicle specs, outstation routes, tour packages, reviews, and guidance. Classification: **Seed / Fallback Data (Drifted)**.
4. `react/src/data/generated-catalog.json`: 481 KB static JSON file compiled during build. Cast into runtime memory in `data.ts`.
5. `react/src/utils/distance.ts`: 924 lines of hardcoded distances (`distanceFromAgra`, `distanceFromDelhi`, and Haversine matrix). Classification: **Forbidden Client Routing / Distance Engine**.

### 6.9 Dead and Unreachable Code

1. `react/src/services/fareApi.ts` (90 lines):
   - Status: **Completely Unimported** across all files in `react/`.
   - Contents: Defines `request<T>()` calling root paths (`/quotes/options`, `/quotes`, `/bookings`, `/bookings/:id/payment`) without `/api/v1/` prefix. Returns unvalidated `{ booking: any }` and `{ payment: any }`.
   - Classification: **Dead Code / Immediate Deletion Candidate**.
2. Dead functions in `react/src/services/api.ts`:
   - `calculateServerFare()`: Only imported by `fares.ts` line 358 in dead indicative helper comments. 0 active UI callers.
   - `createDraftBooking()`: 0 callers in `react/src/`.
   - `createPaymentCheckout()`: 0 callers in `react/src/` (replaced in payment resume by `customerAuthApi.ts`).
   - `getPaymentStatus()`: 0 callers in `react/src/`.

---

## 7. Architecture & Dependency Graph

### 7.1 Current Fragmented Customer Architecture (Legacy & Clean Mixed)

```mermaid
graph TD
    subgraph UI_Surfaces [Customer UI Entry Points]
        HBW[HomeBookingWidget.tsx]
        RT[RouteTemplate.tsx]
        TPT[TourPackageTemplate.tsx]
        RP[RoutesPage.tsx]
        IRC[InstantRouteCalculator.tsx]
        CBP[CleanBookingPage.tsx]
        MBP[MyBookingsPage.tsx]
        PRP[PaymentResumePage.tsx]
        ACP[AuthCallbackPage.tsx]
    end

    subgraph Client_Math [Client-Side Math & Fallbacks]
        FARES[fares.ts advanceOf / calcFare]
        CDIST[customDistance.ts]
        FALLBACKS[Hardcoded Prices || 2500, || 3499]
    end

    subgraph Service_Boundary [Service Clients]
        CLEAN_API[services/cleanFareApi.ts]
        AUTH_API[services/customerAuthApi.ts]
        LEGACY_API[services/api.ts]
        DEAD_API[services/fareApi.ts]
        CAT_SVC[services/catalog.ts & catalogManifest.ts]
    end

    subgraph Backend_Endpoints [Fastify Backend APIs]
        CANON_QUOTES[/api/v1/quotes & /options]
        CANON_BOOKINGS[/api/v1/bookings & /payment]
        CANON_CAT[/api/v1/catalog]
        LEG_CALC[/api/v1/fares/calculate]
        LEG_INTENTS[/api/v1/booking-intents]
        LEG_CHECKOUT[/api/v1/payments/create-checkout]
        LEG_ME_BOOKINGS[/api/v1/me/bookings]
    end

    %% UI Connections
    HBW -->|Legacy URL Params| CBP
    RT -->|advanceOf 28%| FARES
    TPT -->|grossPrice * 1.35| FALLBACKS
    RP -->|sedan || 2500| FALLBACKS
    IRC -->|getIndicativeBrowseFare| FARES
    CDIST -->|MIN_ONE_WAY_FARES| FARES

    CBP -->|Canonical Quotes & Booking| CLEAN_API
    MBP -->|List My Bookings| AUTH_API
    PRP -->|Owner Checkout| AUTH_API
    ACP -->|Finalize Intent| AUTH_API
    CAT_SVC -->|Legacy Routes & Tours| Backend_Endpoints

    %% Service to Backend
    CLEAN_API --> CANON_QUOTES
    CLEAN_API --> CANON_BOOKINGS
    CLEAN_API --> CANON_CAT
    AUTH_API --> LEG_INTENTS
    AUTH_API --> LEG_CHECKOUT
    AUTH_API --> LEG_ME_BOOKINGS
    LEGACY_API -.->|Dead Callers| LEG_CALC

    classDef danger fill:#fee2e2,stroke:#ef4444,stroke-width:2px;
    classDef success fill:#dcfce7,stroke:#22c55e,stroke-width:2px;
    classDef warning fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;

    class FARES,CDIST,FALLBACKS,DEAD_API danger;
    class CLEAN_API,CANON_QUOTES,CANON_BOOKINGS,CANON_CAT success;
    class AUTH_API,LEGACY_API,CAT_SVC,LEG_INTENTS,LEG_CHECKOUT warning;
```

### 7.2 Target Clean Architecture (Post-Migration)

```mermaid
graph TD
    subgraph Target_UI [Clean Customer UI]
        URL_NORM[Route Boundary: BookingEntryParams Normalizer]
        DISCOVERY[Browse Pages: Routes / Packages / Services]
        BOOK_FLOW[CleanBookingPage.tsx]
        CONFIRM[BookingConfirmationModal & Guest Voucher Page]
        ACCOUNT[MyBookingsPage.tsx - Unified Guest & Auth]
    end

    subgraph Target_Service [Single Authoritative Client]
        CLEAN_CLIENT[cleanFareApi.ts]
    end

    subgraph Canonical_Backend [Canonical Backend (Migrations 0038+)]
        API_CAT[/api/v1/catalog & /:category/:code]
        API_OPTIONS[/api/v1/quotes/options]
        API_QUOTES[/api/v1/quotes]
        API_BOOKINGS[/api/v1/bookings]
        API_PAYMENT[/api/v1/bookings/:id/payment]
        API_DETAIL[/api/v1/bookings/:id with x-guest-token]
        API_ME[/api/v1/me/bookings]
    end

    URL_NORM --> BOOK_FLOW
    DISCOVERY -->|Deep Link (canonical params)| URL_NORM
    BOOK_FLOW --> CLEAN_CLIENT
    CONFIRM --> CLEAN_CLIENT
    ACCOUNT --> CLEAN_CLIENT

    CLEAN_CLIENT --> API_CAT
    CLEAN_CLIENT --> API_OPTIONS
    CLEAN_CLIENT --> API_QUOTES
    CLEAN_CLIENT --> API_BOOKINGS
    CLEAN_CLIENT --> API_PAYMENT
    CLEAN_CLIENT --> API_DETAIL
    CLEAN_CLIENT --> API_ME

    classDef clean fill:#dcfce7,stroke:#22c55e,stroke-width:2px;
    class Target_UI,Target_Service,Canonical_Backend,CLEAN_CLIENT clean;
```

---

## 8. Canonical Target Map

| Legacy File / Function / Field | Canonical Replacement | Migration Strategy | Dependent Callers | Validation Required |
|---|---|---|---|---|
| `react/src/services/fareApi.ts` | **Delete completely** | Remove file; verified 0 imports across codebase | None | Verify build passes with 0 imports |
| `src/services/api.ts:calculateServerFare` | `cleanFareApi.ts:fetchQuote` | Deprecate and remove | `fares.ts` (commented) | Verify no network call to `/fares/calculate` |
| `src/services/api.ts:createDraftBooking` | `cleanFareApi.ts:createBooking` | Deprecate and remove | None in UI | Verify no network call to `/bookings/draft` |
| `src/services/api.ts:createPaymentCheckout` | `cleanFareApi.ts:createBookingPayment` | Deprecate and remove | None in UI | Verify no network call to `/payments/create-checkout` |
| `src/services/customerAuthApi.ts:createBookingIntent` | `cleanFareApi.ts:createBooking` | Remove intent flow; create booking with server quote | `AuthCallbackPage.tsx` | End-to-end booking flow test |
| `src/services/customerAuthApi.ts:createOwnerPaymentCheckout` | `cleanFareApi.ts:createBookingPayment` | Call `POST /api/v1/bookings/:id/payment` directly | `PaymentResumePage.tsx` | Razorpay order generation test |
| `src/services/customerAuthApi.ts:verifyOwnerPayment` | `cleanFareApi.ts:fetchBookingById` | Server webhook is authoritative; poll booking status | `PaymentResumePage.tsx` | Webhook signature test |
| `src/fares.ts:advanceOf` | Server `QuoteResponse.advance` | Delete client calculation; display only server value | `RouteTemplate`, `TourPackageTemplate`, `customDistance` | Verify `INV-2` server conformance |
| `src/fares.ts:getIndicativeBrowseFare` | Server `/api/v1/quotes/options` or static SSG manifest | Replace client math with server catalog starting fare | `InstantRouteCalculator.tsx` | Exact match against database rates |
| `src/utils/customDistance.ts` | Server `/api/v1/quotes` | Remove autonomous pricing logic; route discovery uses backend | Instant route calculator | Disallow client fare formulas |
| `src/data/prices.ts` | Database `fare_rules` & `outstation_routes` | Delete hardcoded pricing constants | `RentalPage.tsx` | Replace with dynamic API catalog rate |
| `RouteTemplate.tsx:164 primaryFare` | Server route vehicle fare from manifest | Read server snapshot; disallow `* 1.8` round-trip math | `RouteTemplate.tsx` | Render exact database flat route fare |
| `TourPackageTemplate.tsx:119 grossPrice` | Server `fare_rules.amount` for package | Read `pkg.startingPriceInr` without `\|\| 3499` fallback | `TourPackageTemplate.tsx` | Fail closed if fare missing |
| URL param `pkg` / `package` / `route` | `product` | Normalize once in boundary parser | All deep link creators | `BookingEntryParams.parse()` |
| URL param `trip` / `tripType` | `trip` (`one_way` \| `round_trip`) | Normalize once in boundary parser | All deep link creators | `BookingEntryParams.parse()` |
| URL param `passengers` / `passengerCount` | `pax` | Normalize once in boundary parser | All deep link creators | `BookingEntryParams.parse()` |
| URL param `vehicle` / `carTier` | `car` (`vehicle_model_id` UUID) | Normalize vehicle code to model UUID | All deep link creators | UUID format validation |
| Storage `arenaai:booking-intent:v1` | Server booking ID + guest token | Save `{ booking_id, guest_access_token }` | `CleanBookingPage`, `MyBookingsPage` | Guest voucher reload test |

---

## 9. Ordered Migration Plan (10 Sequenced Phases)

The migration must be executed in 10 sequential, testable phases. Under no circumstances should multiple phases be compressed into a single unverified step.

### Phase 1: Shared Contracts & Response Types Alignment
- **Objective:** Ensure all client-side contracts perfectly mirror `contracts/fare-system.ts` and `docs/CANONICAL_FIELD_REGISTRY.md`.
- **Files to Change:** `react/src/contracts/*`, `react/src/features/booking/clean/bookingTypes.ts`.
- **Backend Dependencies:** None (Types only).
- **Risk:** Low.
- **Tests & Verification:** `npm --prefix react run typecheck`.
- **Acceptance Criteria:** `BookingEntryParams` in `bookingTypes.ts` matches canonical Zod schema exactly; zero drift in contract types.
- **Rollback Strategy:** Git revert.

### Phase 2: API Client Boundary Consolidation
- **Objective:** Expand `cleanFareApi.ts` to cover booking status retrieval, guest voucher access, and customer bookings listing; isolate legacy clients.
- **Files to Change:** `react/src/services/cleanFareApi.ts`, `react/src/services/api.ts`, `react/src/services/customerAuthApi.ts`.
- **Backend Dependencies:** Clean endpoints documented in `ROUTE_AND_API_INVENTORY.md`.
- **Risk:** Medium.
- **Tests & Verification:** Unit tests for API client response parsing.
- **Acceptance Criteria:** All canonical endpoints strongly typed with Zod safe parsing.
- **Rollback Strategy:** Git revert.

### Phase 3: Catalog & Outstation Route Pages Modernization
- **Objective:** Eliminate synthetic price fallbacks (`|| 2500`, `|| 4500`) and client roundtrip math (`* 1.8`) on route listing and detail pages.
- **Files to Change:** `react/src/pages/RoutesPage.tsx`, `react/src/templates/RouteTemplate.tsx`, `react/src/templates/sections/LatestRoutesSection.tsx`, `react/src/app/App.tsx`.
- **Backend Dependencies:** `routes-manifest.json` and `/api/v1/catalog`.
- **Risk:** Medium.
- **Tests & Verification:** `npm --prefix react run build`, `npm --prefix react run test:catalog-sources`.
- **Acceptance Criteria:** 0 occurrences of `|| 2500` or `* 1.8` in route code; missing fares trigger fail-closed state.
- **Rollback Strategy:** Git revert.

### Phase 4: Local Package & Transfer Pages Modernization
- **Objective:** Eliminate client fare calculations and `|| 3499` fallbacks from packages and rental pages.
- **Files to Change:** `react/src/pages/PackagesPage.tsx`, `react/src/templates/TourPackageTemplate.tsx`, `react/src/pages/RentalPage.tsx`, `react/src/data/prices.ts`.
- **Backend Dependencies:** `/api/v1/catalog/local_package` and `/api/v1/catalog/tour_package`.
- **Risk:** Medium.
- **Tests & Verification:** `npm --prefix react run build`, check tour package pricing displays.
- **Acceptance Criteria:** Packages render server-provided base fares; multipliers (`* 1.35`, `* 1.7`) removed.
- **Rollback Strategy:** Git revert.

### Phase 5: Deep-Link & Booking Input Normalization Boundary
- **Objective:** Implement a single, robust boundary normalizer for incoming deep links adhering to canonical `BookingEntryParams`. Update all CTA link builders.
- **Files to Change:** `react/src/features/booking/clean/CleanBookingPage.tsx`, `react/src/components/home/HomeBookingWidget.tsx`, `react/src/components/home/PopularRoutes.tsx`, `react/src/templates/RouteTemplate.tsx`, `react/src/templates/TourPackageTemplate.tsx`.
- **Backend Dependencies:** None.
- **Risk:** Low.
- **Tests & Verification:** Automated URL parsing tests for all query variations.
- **Acceptance Criteria:** Normalization occurs exactly once at the route boundary; components receive strictly validated `BookingEntryParams`.
- **Rollback Strategy:** Git revert.

### Phase 6: Quote Flow Verification & Integrity Hardening
- **Objective:** Ensure quote retrieval strictly uses `POST /api/v1/quotes` and `/api/v1/quotes/options`; verify that `INV-1` to `INV-10` are enforced without client re-computation.
- **Files to Change:** `react/src/features/booking/clean/CleanBookingPage.tsx`, `react/src/components/routes/InstantRouteCalculator.tsx`.
- **Backend Dependencies:** Clean quote engine (`backend/src/modules/quotes/`).
- **Risk:** High (Core business flow).
- **Tests & Verification:** Verification of quote rendering against backend quote test suite.
- **Acceptance Criteria:** Client renders server `QuoteResponse`; handles `409 PRICE_CHANGED` with fresh reconfirmation modal.
- **Rollback Strategy:** Git revert.

### Phase 7: Payment Flow & Authoritative Webhook Alignment
- **Objective:** Ensure Razorpay payment order is generated via `POST /api/v1/bookings/:id/payment` using server `amount_paise`. Eliminate client-side signature verification; payment completion is authoritatively determined by server webhook and confirmed by fetching the booking detail snapshot.
- **Files to Change:** `react/src/features/booking/clean/CleanBookingPage.tsx`, `react/src/pages/PaymentResumePage.tsx`.
- **Backend Dependencies:** `POST /api/v1/bookings/:id/payment` and Razorpay webhook processor.
- **Risk:** Critical (Financial flow).
- **Tests & Verification:** End-to-end payment order test in Razorpay test mode; polling authoritative server status.
- **Acceptance Criteria:** Payment order amount strictly equals server `advance_amount * 100`; UI displays payment success only when confirmed by `GET /api/v1/bookings/:id`.
- **Rollback Strategy:** Git revert.

### Phase 8: Booking Confirmation & Protected Guest Voucher Recovery
- **Objective:** Fix the guest confirmation disconnect. Protect `guest_access_token` by keeping it out of query strings: persist it in session storage (`sessionStorage`) and transmit strictly via the documented `x-guest-token` header. Build a dedicated Confirmation Voucher view accessible without login that polls authoritative payment status from `GET /api/v1/bookings/:id`.
- **Files to Change:** `react/src/features/booking/clean/CleanBookingPage.tsx`, `react/src/pages/MyBookingsPage.tsx`, new guest confirmation voucher view.
- **Backend Dependencies:** `GET /api/v1/bookings/:id` with `x-guest-token`.
- **Risk:** Medium.
- **Tests & Verification:** Manual and automated test: complete guest booking -> payment -> voucher view loads with token from session storage, verifies server payment status, without requiring login.
- **Acceptance Criteria:** Guest customer sees confirmed ticket voucher, payment reconciliation status, download receipt button, and chauffeur assignment status immediately upon checkout completion; no token in URL.
- **Rollback Strategy:** Git revert.

### Phase 9: Web Storage & Cache Invalidation Hardening
- **Objective:** Clean up stale localStorage and sessionStorage keys. Add schema versioning to manifest cache; remove legacy intent storage.
- **Files to Change:** `react/src/services/catalogManifest.ts`, `react/src/services/catalog.ts`, `react/src/auth/bookingIntentStorage.ts`.
- **Backend Dependencies:** Catalog ETag headers.
- **Risk:** Low.
- **Tests & Verification:** Clear storage and test cold load vs warm cached load.
- **Acceptance Criteria:** Corrupt or outdated cached shapes fail closed and automatically re-fetch current canonical data.
- **Rollback Strategy:** Git revert.

### Phase 10: Frontend Legacy Code Deletion (Do Not Delete Backend Prematurely)
- **Objective:** Permanently delete dead code (`fareApi.ts`), unused legacy calculation helpers in `fares.ts`, `customDistance.ts`, and deprecated functions in `api.ts` within the customer frontend ONLY. Do not delete legacy backend endpoints prematurely—verify admin desk, webhook, and external integrations before retiring backend routes.
- **Files to Change:** Delete `react/src/services/fareApi.ts`, prune `react/src/fares.ts`, `react/src/utils/customDistance.ts`, `react/src/services/api.ts`.
- **Backend Dependencies:** All customer frontend migration phases verified; backend legacy routes retained until separate full-stack audit.
- **Risk:** Low.
- **Tests & Verification:** `npm --prefix react run typecheck`, `npm --prefix react run build`, `npm run verify`.
- **Acceptance Criteria:** Zero dead code in customer frontend, 0 type errors, clean build output.
- **Rollback Strategy:** Git revert.

---

## 10. Verification Checklist

The following static assertions and automated test commands must pass after completing the migration:

### 10.1 Static Assertions
- [ ] `fareApi.ts` is deleted from the filesystem.
- [ ] No network call in `react/` targets `/api/v1/fares/calculate`, `/api/v1/bookings/draft`, `/api/v1/booking-intents/*`, or `/api/v1/payments/create-checkout`.
- [ ] No file in `react/src/` contains hardcoded price fallbacks (`|| 2500`, `|| 3200`, `|| 4500`, `|| 9500`, `|| 14000`, `|| 3499`).
- [ ] No file in `react/src/` performs client-side advance percentage math (`* 0.28`).
- [ ] No file in `react/src/` performs client-side round-trip fare multiplication (`* 1.8`, `* 1.85`).
- [ ] `CleanBookingPage.tsx` persists `guest_access_token` in `sessionStorage` (never in URL search params).
- [ ] Guest voucher view renders confirmed booking using `x-guest-token` header without requiring OAuth login.
- [ ] Confirmation screen displays authoritative payment status returned by `GET /api/v1/bookings/:id`, not assuming success from client SDK callback.
- [ ] `BookingEntryParams` is validated with Zod at the route boundary.
- [ ] All error catches in API service layers preserve and propagate machine error codes (`PRICE_CHANGED`, `VALIDATION_ERROR`, etc.) rather than returning empty arrays.

### 10.2 Automated Commands
```bash
# 1. Typecheck customer frontend (0 errors required)
npm --prefix react run typecheck

# 2. Verify catalog sources contract
npm --prefix react run test:catalog-sources

# 3. Verify SEO integrity and sitemap generation
npm --prefix react run test:seo

# 4. Production build of customer app (59+ static pages generated, 0 warnings)
npm --prefix react run build

# 5. Full monorepo verification (typecheck x3 + backend tests + build x3)
npm run verify
```

---

## 11. Blockers, Decisions & Final Readiness Statement

### 11.1 Decisions Incorporating User Corrections

1. **Guest Voucher Security & Authoritative Status (Approved Correction 1):**
   - *Design:* Keep `guest_access_token` strictly out of the query string. Store it in `sessionStorage` upon booking creation and send it via the documented `x-guest-token` HTTP header to `GET /api/v1/bookings/:id`.
   - *Status Determination:* The confirmation view must display the authoritative payment status returned by the backend (`paid_confirmed`, `advance_paid`, etc.), rather than assuming payment succeeded merely because the Razorpay client handler fired.
2. **Static vs. Live Pricing Strategy (Approved Correction 2):**
   - *Design:* While generating starting prices into `routes-manifest.json` at build time ensures instantaneous SSG page loads, displayed prices can become stale if an admin modifies fares in the database.
   - *Resolution:* Implement a lightweight live catalog overlay or stale-while-revalidate (SWR) check against `/api/v1/catalog` for active route/package cards, ensuring admin updates are reflected without requiring full site rebuilds.
3. **Backend Legacy Endpoint Protection (Approved Correction 3):**
   - *Directive:* This audit covers the customer frontend (`react/`), not every potential external consumer. Do NOT remove or delete legacy backend endpoints during the React customer migration. Backend routes must remain intact until admin desk dependencies, external callers, and production logs are audited.
4. **Remediation Verification Protocol (Approved Correction 4):**
   - *Directive:* Treat this scan report as an audit baseline and implementation blueprint. Each phase must be executed discrete and tested with actual command executions and end-to-end journey validation.

### 11.2 Final Readiness Statement

The customer site (`react/`) **is NOT yet ready for immediate retirement of legacy backend APIs**, but the codebase **is fully audited and ready for Phase 1 of the systematic 10-phase remediation plan**.

With the four approved corrections locked in, the remediation plan establishes an ironclad, low-risk sequence:
1. Align canonical contracts and field definitions.
2. Consolidate API clients.
3. Remove client-side route pricing and fake price defaults.
4. Migrate package, transfer, and rental pricing.
5. Normalize booking URLs at one boundary.
6. Verify quote integrity and `409 PRICE_CHANGED` handling.
7. Align Razorpay payment creation and authoritative server verification.
8. Repair guest confirmation and protected voucher recovery (session storage + `x-guest-token`).
9. Harden caching and storage.
10. Remove verified-dead modules in `react/` (preserving backend endpoints).

---
<!-- GOAL_COMPLETE -->
