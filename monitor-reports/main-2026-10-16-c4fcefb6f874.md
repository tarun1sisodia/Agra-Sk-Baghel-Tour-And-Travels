# Main branch verification — c4fcefb6f874

- **Result:** FAIL
- **Commit:** [c4fcefb6f87428bee0f8459420bd2e074a1f5ea6](https://github.com/tarun1sisodia/ArenaAI/commit/c4fcefb6f87428bee0f8459420bd2e074a1f5ea6)
- **Checked at:** 2026-10-16T17:02:24Z
- **Workflow run:** [38936442633](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38936442633)

## Changed files

- M	admin/src/lib/api.ts
- M	backend/src/db/postgres.ts
- M	backend/src/modules/catalog/catalog.schema.ts
- M	backend/src/modules/catalog/catalog.service.ts
- M	backend/src/types/domain.ts
- M	backend/tests/unit/legacy-schema-reconciliation.test.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	react/src/components/catalog/LiveCatalogSection.tsx
- M	react/src/pages/LivePackageDetailPage.tsx
- M	react/src/services/catalog.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  reason: [32m'tour_package-published'[39m,
  entityType: [32m'tour_package'[39m,
  entityId: [32m'77777777-7777-4777-8777-777777777777'[39m,
  slug: [1mnull[22m,
  sourceVersion: [1mnull[22m,
  releaseState: [32m'release_deployed'[39m,
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{ eventId: [32m'6168207c-4859-4863-be8f-239a0050c357'[39m } deployment verification succeeded; event finalized

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 493[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 40[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1617[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 305[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 51[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 319[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 115[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 159[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1609[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 801[2mms[22m[39m

[2m Test Files [22m [1m[32m18 passed[39m[22m[90m (18)[39m
[2m      Tests [22m [1m[32m301 passed[39m[22m[90m (301)[39m
[2m   Start at [22m 17:02:03
[2m   Duration [22m 11.04s[2m (transform 1.01s, setup 0ms, collect 3.04s, tests 4.91s, environment 3ms, prepare 997ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts

▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.510251ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.713618ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.328967ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.549049ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (1.992776ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.428183ms)
✔ canonical catalogue & fallback regressions (7.646425ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.610228ms)
  ✔ derives the implemented content manifest path from the API base (0.300373ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.28825ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.371447ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.215133ms)
✔ catalog source resolution (P0-T03 / P0-T04) (4.578734ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (1.411546ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (3.353587ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (3.127003ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.311484ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (10.201104ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (2.215964ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.60274ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.268303ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.484007ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.429536ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.603953ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.532018ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.498965ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (8.374509ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.44009ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.272932ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.229701ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.347421ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.281928ms)
  ✔ validates Indian 10-digit mobile number format (0.443882ms)
  ✔ validates return date on or after pickup date (0.184686ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (1.098368ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.924754ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (7.667143ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (1.303264ms)
  ✔ preserves is_verified: false when server review is unverified (0.257963ms)
  ✔ never infers verification from booking_id, status, or social media links (0.284533ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (2.714769ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (6.971799ms)
ℹ tests 36
ℹ suites 6
ℹ pass 36
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 349.032626

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.738069ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.309941ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.280085ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (4.248735ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.969468ms)
  ✔ preserves a valid stored tier (0.179517ms)
✔ tour package base tier form normalization (2.804387ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (3.13686ms)
  ✔ 2. Initial state is strictly masked and empty (0.514214ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.182322ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.737933ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.315271ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.344025ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (8.759692ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 179.824996

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (1.019391ms)
  ✔ normalizes a trailing slash (0.183434ms)
  ✔ rejects preview hosts in release mode (0.438412ms)
  ✔ requires HTTPS for non-local origins (0.237104ms)
  ✔ allows HTTPS preview origins (0.1602ms)
  ✔ permits HTTP only on loopback in development (0.215183ms)
  ✔ rejects paths and credentials (0.210786ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.248015ms)
✔ canonical site origin (4.270866ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 116.827655
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/catalog-sources.ts:105
    throw new Error(
          ^

Error: Fail-closed catalog build is missing required source URLs (ROUTE_CATALOG_MANIFEST_URL, TOUR_PACKAGES_MANIFEST_URL, TRANSFER_ROUTES_MANIFEST_URL, LOCAL_PACKAGES_MANIFEST_URL, CONTENT_MANIFEST_URL). Set VITE_API_BASE_URL or each *MANIFEST_URL. Refusing to default to skb-baghel-api-staging.onrender.com.
    at assertFailClosedCatalogEnv (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/catalog-sources.ts:105:11)
    at buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:57:3)
    at file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:485:7
    at ModuleJob.run (node:internal/modules/esm/module_job:561:25)
    at async node:internal/modules/esm/loader:647:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.21.0
```
