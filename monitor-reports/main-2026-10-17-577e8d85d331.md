# Main branch verification — 577e8d85d331

- **Result:** FAIL
- **Commit:** [577e8d85d3314e3badff711a0a6e21e6e84c80c6](https://github.com/tarun1sisodia/ArenaAI/commit/577e8d85d3314e3badff711a0a6e21e6e84c80c6)
- **Checked at:** 2026-10-17T13:16:06Z
- **Workflow run:** [39035795590](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39035795590)

## Changed files

- M	admin/src/pages/ReviewsPage.tsx
- M	backend/src/modules/reviews/reviews.repository.ts
- M	react/src/pages/ReviewPage.tsx

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 267[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1611[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 163[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 166[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 59[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1605[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 802[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m19 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[32m306 passed[39m[22m[90m (306)[39m
[2m   Start at [22m 13:15:47
[2m   Duration [22m 8.09s[2m (transform 664ms, setup 0ms, collect 1.90s, tests 4.13s, environment 2ms, prepare 593ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (0.937978ms)
✔ IST today advances when UTC has crossed into a new IST date (0.143246ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (0.880982ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.206733ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.118329ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.240594ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (1.58769ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.307555ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.253753ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.144949ms)
✔ canonical catalogue & fallback regressions (9.732172ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.186344ms)
  ✔ derives the implemented content manifest path from the API base (0.279613ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.183568ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.310639ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.152761ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.360891ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (0.764626ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (2.059834ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (1.617986ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.15849ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (5.685485ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (2.181398ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.526035ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.19172ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.346604ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.288416ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.364391ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (1.540569ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.195105ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (7.654121ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (2.171142ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.187092ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.127763ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.149026ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.129135ms)
  ✔ validates Indian 10-digit mobile number format (0.267675ms)
  ✔ validates return date on or after pickup date (0.113521ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.501148ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.707519ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (5.62298ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.447226ms)
  ✔ preserves is_verified: false when server review is unverified (0.096396ms)
  ✔ never infers verification from booking_id, status, or social media links (0.079921ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.073572ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (1.394097ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 284.258565

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.011309ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.189006ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.135465ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (2.499779ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.505294ms)
  ✔ preserves a valid stored tier (0.110247ms)
✔ tour package base tier form normalization (1.505446ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (1.401589ms)
  ✔ 2. Initial state is strictly masked and empty (0.387746ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.11248ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.299803ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.13883ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.123166ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (3.406871ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 108.474799

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.543752ms)
  ✔ normalizes a trailing slash (0.111849ms)
  ✔ rejects preview hosts in release mode (0.263879ms)
  ✔ requires HTTPS for non-local origins (0.081814ms)
  ✔ allows HTTPS preview origins (0.074172ms)
  ✔ permits HTTP only on loopback in development (0.111639ms)
  ✔ rejects paths and credentials (0.100371ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.109926ms)
✔ canonical site origin (2.219605ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 69.900586
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (963 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 963 typed routes.
✅ [Manifest Builder] Snapshotted 0 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 0 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 0 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
✅ [Manifest Builder] Snapshotted 0 published local packages from https://skb-baghel-api-staging.onrender.com/api/v1/local-packages/manifest.
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:71
      throw new Error(`Catalog source ${redactCatalogUrl(url)} returned HTTP ${response.status}`);
            ^

Error: Catalog source https://skb-baghel-api-staging.onrender.com/api/v1/content/manifest returned HTTP 404
    at fetchCatalogJson (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:71:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async loadCatalogSource (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:85:14)
    at async buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:492:26)
    at async file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:503:1

Node.js v24.21.0
```
