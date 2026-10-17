# Main branch verification — c3c55fdb93cc

- **Result:** FAIL
- **Commit:** [c3c55fdb93cc705fb69c98692bf7c1ae6a985002](https://github.com/tarun1sisodia/ArenaAI/commit/c3c55fdb93cc705fb69c98692bf7c1ae6a985002)
- **Checked at:** 2026-10-17T13:39:55Z
- **Workflow run:** [39037417963](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39037417963)

## Changed files

- M	admin/src/lib/api.ts
- M	admin/src/pages/BookingsPage.tsx
- M	backend/src/modules/bookings/booking.schema.ts
- A	backend/tests/unit/booking-schema.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1613[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 802[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 218[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 25[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 48[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 236[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 116[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1608[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-schema.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m20 passed[39m[22m[90m (20)[39m
[2m      Tests [22m [1m[32m310 passed[39m[22m[90m (310)[39m
[2m   Start at [22m 13:39:32
[2m   Duration [22m 9.63s[2m (transform 850ms, setup 0ms, collect 2.45s, tests 4.48s, environment 2ms, prepare 828ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.024156ms)
✔ IST today advances when UTC has crossed into a new IST date (0.174959ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.118355ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.337149ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.195048ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.388855ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.239244ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (1.744551ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.276919ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.2698ms)
✔ canonical catalogue & fallback regressions (6.573076ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.353533ms)
  ✔ derives the implemented content manifest path from the API base (0.270059ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.228899ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.415645ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.178464ms)
✔ catalog source resolution (P0-T03 / P0-T04) (4.04827ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (1.076643ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (2.655279ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (3.24358ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.197682ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (8.837397ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (1.368434ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.25018ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.174268ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.319192ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.244602ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.35121ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.241347ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.170522ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (7.878127ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (0.879781ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.22967ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.18247ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.294857ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.143182ms)
  ✔ validates Indian 10-digit mobile number format (0.264752ms)
  ✔ validates return date on or after pickup date (0.120208ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.604815ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.535112ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (4.785261ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.559889ms)
  ✔ preserves is_verified: false when server review is unverified (0.119817ms)
  ✔ never infers verification from booking_id, status, or social media links (0.118666ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.130493ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (1.898049ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 344.183601

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.001021ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.192034ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.180728ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (2.450115ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.904288ms)
  ✔ preserves a valid stored tier (0.151945ms)
✔ tour package base tier form normalization (2.43314ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.760966ms)
  ✔ 2. Initial state is strictly masked and empty (1.25731ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.152365ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.377098ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.2097ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.156111ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (4.116421ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 144.778123

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.850889ms)
  ✔ normalizes a trailing slash (0.149811ms)
  ✔ rejects preview hosts in release mode (0.410087ms)
  ✔ requires HTTPS for non-local origins (0.14829ms)
  ✔ allows HTTPS preview origins (0.130784ms)
  ✔ permits HTTP only on loopback in development (0.164313ms)
  ✔ rejects paths and credentials (0.19603ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.135901ms)
✔ canonical site origin (3.539307ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 95.071414
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (965 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 965 typed routes.
✅ [Manifest Builder] Snapshotted 13 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 3 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 4 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
✅ [Manifest Builder] Snapshotted 5 published local packages from https://skb-baghel-api-staging.onrender.com/api/v1/local-packages/manifest.
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
