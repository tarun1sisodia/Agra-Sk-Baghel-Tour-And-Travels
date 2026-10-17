# Main branch verification — 690bf21c6e30

- **Result:** FAIL
- **Commit:** [690bf21c6e30ec353783a84ca6820c774a65930c](https://github.com/tarun1sisodia/ArenaAI/commit/690bf21c6e30ec353783a84ca6820c774a65930c)
- **Checked at:** 2026-10-17T13:35:10Z
- **Workflow run:** [39037091200](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39037091200)

## Changed files

- A	backend/migrations/0044_allow_manual_outstation_without_route.sql

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 357[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1612[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 802[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 27[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 225[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 25[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 41[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 231[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 117[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1607[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m19 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[32m306 passed[39m[22m[90m (306)[39m
[2m   Start at [22m 13:34:47
[2m   Duration [22m 9.46s[2m (transform 816ms, setup 0ms, collect 2.43s, tests 4.46s, environment 2ms, prepare 782ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.128566ms)
✔ IST today advances when UTC has crossed into a new IST date (0.181958ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.160885ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.342886ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.221758ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.37925ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.241326ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (1.715073ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.263149ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.224041ms)
✔ canonical catalogue & fallback regressions (6.199226ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.184008ms)
  ✔ derives the implemented content manifest path from the API base (0.226675ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.203651ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.249018ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.129621ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.291801ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (0.924315ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (2.497949ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (1.767711ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.228868ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (7.62406ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (2.069767ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.353753ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.228878ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.407892ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.323258ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.388393ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.299763ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.242769ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (9.503226ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.302514ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.172265ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.125946ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.144534ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.181327ms)
  ✔ validates Indian 10-digit mobile number format (0.29118ms)
  ✔ validates return date on or after pickup date (0.153237ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.994008ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.714345ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (5.909959ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.601669ms)
  ✔ preserves is_verified: false when server review is unverified (0.124785ms)
  ✔ never infers verification from booking_id, status, or social media links (0.160968ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.129231ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (1.968617ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 333.428568

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.04947ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.184212ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.154788ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (2.622513ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.70418ms)
  ✔ preserves a valid stored tier (0.156031ms)
✔ tour package base tier form normalization (4.245159ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.741114ms)
  ✔ 2. Initial state is strictly masked and empty (1.488157ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.21015ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.425499ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.184393ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.252833ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (4.665751ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 138.04145

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.707865ms)
  ✔ normalizes a trailing slash (0.146577ms)
  ✔ rejects preview hosts in release mode (0.335785ms)
  ✔ requires HTTPS for non-local origins (0.149871ms)
  ✔ allows HTTPS preview origins (0.116352ms)
  ✔ permits HTTP only on loopback in development (0.145095ms)
  ✔ rejects paths and credentials (0.162841ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.163752ms)
✔ canonical site origin (3.127339ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 91.841258
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
