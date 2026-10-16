# Main branch verification — 0c19c2ffacaf

- **Result:** FAIL
- **Commit:** [0c19c2ffacaf3cedb31ce691f9e797d8823eeb56](https://github.com/tarun1sisodia/ArenaAI/commit/0c19c2ffacaf3cedb31ce691f9e797d8823eeb56)
- **Checked at:** 2026-10-16T21:36:38Z
- **Workflow run:** [38970405182](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38970405182)

## Changed files

- M	admin/package-lock.json
- M	admin/package.json
- M	admin/src/contracts/fare-system.ts
- M	admin/src/lib/api.ts
- M	admin/src/lib/env.ts
- M	admin/src/pages/DashboardPage.tsx
- M	admin/src/pages/ReviewsPage.tsx
- M	backend/scripts/seed-canonical-catalog.ts
- M	backend/src/contracts/fare-system.ts
- M	backend/src/db/dossier-seeds.ts
- M	backend/src/modules/fare-catalog/fare-catalog.repository.ts
- M	backend/src/modules/quotes/quotes.service.ts
- M	backend/src/modules/tour-packages/tour-packages.service.ts
- M	contracts/fare-system.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	react/public/sitemap.xml
- M	react/src/app/App.tsx
- M	react/src/components/home/HomeBookingWidget.tsx
- M	react/src/contracts/fare-system.ts
- M	react/src/data/generated-published-local-packages.json
- M	react/src/data/parity.ts
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/pages/RentalPage.tsx
- M	react/src/templates/MonumentTemplate.tsx

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{ eventId: [32m'78fcafb5-0ed9-4fb2-95ba-ec6be9ee3515'[39m } deployment verification succeeded; event finalized

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 363[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1613[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 215[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 49[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 217[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 112[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1607[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m19 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[32m306 passed[39m[22m[90m (306)[39m
[2m   Start at [22m 21:36:18
[2m   Duration [22m 9.67s[2m (transform 936ms, setup 0ms, collect 2.62s, tests 4.46s, environment 2ms, prepare 806ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.084362ms)
✔ IST today advances when UTC has crossed into a new IST date (0.228212ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.069951ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.40059ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.222028ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.452975ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.287757ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (1.616916ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.409186ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.481695ms)
✔ canonical catalogue & fallback regressions (7.137211ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.369121ms)
  ✔ derives the implemented content manifest path from the API base (0.287205ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.207582ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.339736ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.158428ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.812135ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (1.110908ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (2.780008ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (2.347581ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.215648ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (8.140196ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (1.500923ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.413527ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.16856ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.335566ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.283658ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.454057ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.395441ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.329979ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (5.738767ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.132264ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.254906ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.221936ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.238708ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.207353ms)
  ✔ validates Indian 10-digit mobile number format (0.288226ms)
  ✔ validates return date on or after pickup date (0.192141ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.994551ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.440244ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (7.628038ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.61014ms)
  ✔ preserves is_verified: false when server review is unverified (0.152969ms)
  ✔ never infers verification from booking_id, status, or social media links (0.117996ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.113193ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (1.957249ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 351.701935

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.163351ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.242319ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.214707ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (3.125023ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.688239ms)
  ✔ preserves a valid stored tier (0.172934ms)
✔ tour package base tier form normalization (2.054627ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.656193ms)
  ✔ 2. Initial state is strictly masked and empty (1.18314ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.160377ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.369817ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.176091ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.128803ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (3.705897ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 144.498304

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.671202ms)
  ✔ normalizes a trailing slash (0.156613ms)
  ✔ rejects preview hosts in release mode (0.347701ms)
  ✔ requires HTTPS for non-local origins (0.137613ms)
  ✔ allows HTTPS preview origins (0.101759ms)
  ✔ permits HTTP only on loopback in development (0.136938ms)
  ✔ rejects paths and credentials (0.124599ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.097674ms)
✔ canonical site origin (2.912784ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 94.670499
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (973 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 973 typed routes.
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:71
      throw new Error(`Catalog source ${redactCatalogUrl(url)} returned HTTP ${response.status}`);
            ^

Error: Catalog source https://skb-baghel-api-staging.onrender.com/api/v1/catalog returned HTTP 502
    at fetchCatalogJson (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:71:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:317:23)
    at async file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:485:1

Node.js v24.21.0
```
