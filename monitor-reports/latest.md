# Main branch verification — 96b23138560e

- **Result:** FAIL
- **Commit:** [96b23138560ec314e6ca3093b9c709d161005da7](https://github.com/tarun1sisodia/ArenaAI/commit/96b23138560ec314e6ca3093b9c709d161005da7)
- **Checked at:** 2026-10-17T12:59:08Z
- **Workflow run:** [39034606244](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39034606244)

## Changed files

- M	backend/.env.example
- M	backend/src/app.ts
- M	backend/src/config/env.ts
- M	backend/src/modules/reviews/reviews.service.ts
- M	docs/DEPLOYMENT.md
- A	react/functions/review/[[token]].ts
- M	react/public/manus-routes.json
- M	react/scripts/prerender.ts
- M	react/src/app/App.tsx
- M	react/src/app/ServerApp.tsx
- A	react/src/pages/ReviewPage.tsx
- M	react/src/services/cleanFareApi.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 515[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 43[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1617[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 803[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 37[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 327[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 35[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 61[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 330[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 116[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 161[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1610[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m

[2m Test Files [22m [1m[32m19 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[32m306 passed[39m[22m[90m (306)[39m
[2m   Start at [22m 12:58:41
[2m   Duration [22m 11.76s[2m (transform 1.15s, setup 0ms, collect 3.34s, tests 5.00s, environment 3ms, prepare 1.12s)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.450615ms)
✔ IST today advances when UTC has crossed into a new IST date (0.243052ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.827294ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.423126ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.312911ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.541255ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.378453ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (1.711769ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.426763ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.33362ms)
✔ canonical catalogue & fallback regressions (8.647121ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (2.679386ms)
  ✔ derives the implemented content manifest path from the API base (0.448423ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.352826ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.620883ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.246998ms)
✔ catalog source resolution (P0-T03 / P0-T04) (6.775765ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (1.451616ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (2.895558ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (2.792657ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.256036ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (9.485107ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (2.324929ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.569918ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.277074ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.53824ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.396026ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.62997ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.536155ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.478268ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (8.609862ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.457347ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.31215ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.289508ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.429367ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.256697ms)
  ✔ validates Indian 10-digit mobile number format (0.515448ms)
  ✔ validates return date on or after pickup date (0.205161ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.937952ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (2.773361ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (9.439212ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.957238ms)
  ✔ preserves is_verified: false when server review is unverified (0.211032ms)
  ✔ never infers verification from booking_id, status, or social media links (0.177309ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.191646ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (3.021963ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 466.582894

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.30789ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.278727ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.234876ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (3.42411ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (1.089143ms)
  ✔ preserves a valid stored tier (0.250585ms)
✔ tour package base tier form normalization (3.311391ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (1.089694ms)
  ✔ 2. Initial state is strictly masked and empty (1.665774ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.198699ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.51137ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.287073ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.234807ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (5.889729ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 199.219682

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (1.282752ms)
  ✔ normalizes a trailing slash (0.219077ms)
  ✔ rejects preview hosts in release mode (0.648484ms)
  ✔ requires HTTPS for non-local origins (0.492665ms)
  ✔ allows HTTPS preview origins (0.282415ms)
  ✔ permits HTTP only on loopback in development (0.269991ms)
  ✔ rejects paths and credentials (0.25306ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.177259ms)
✔ canonical site origin (5.640216ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 124.408863
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
