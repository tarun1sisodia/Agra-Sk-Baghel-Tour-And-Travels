# Main branch verification — 73f9541d8704

- **Result:** FAIL
- **Commit:** [73f9541d87043e3dbf2b4efb756dccce4cc35f5a](https://github.com/tarun1sisodia/ArenaAI/commit/73f9541d87043e3dbf2b4efb756dccce4cc35f5a)
- **Checked at:** 2026-10-17T06:17:02Z
- **Workflow run:** [39009275338](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39009275338)

## Changed files

- A	ArenaAI_Client_Production_Setup_Guide.md
- A	ArenaAI_Live_Site_Manual_QA_Test_Plan (1).md
- M	admin/src/contracts/fare-system.ts
- M	backend/scripts/migrate.ts
- A	backend/scripts/qa-admin-contract-insert.ts
- M	backend/src/contracts/fare-system.ts
- M	contracts/fare-system.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- A	qr_google.png
- M	react/src/app/App.tsx
- M	react/src/contracts/fare-system.ts
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/features/booking/clean/urlNormalizer.ts
- M	react/src/pages/FleetPage.tsx
- M	react/src/pages/PackagesPage.tsx
- M	react/src/pages/TransferDetailPage.tsx
- M	react/src/templates/LocalTourTemplate.tsx
- M	react/src/templates/sections/LatestPackagesSection.tsx
- M	react/src/templates/sections/LatestToursSection.tsx
- M	scripts/dev-all.mjs

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 295[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1610[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 802[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 176[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 41[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 174[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 64[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 84[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1606[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 802[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m19 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[32m306 passed[39m[22m[90m (306)[39m
[2m   Start at [22m 06:16:43
[2m   Duration [22m 8.55s[2m (transform 749ms, setup 0ms, collect 2.17s, tests 4.20s, environment 2ms, prepare 653ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.017629ms)
✔ IST today advances when UTC has crossed into a new IST date (0.173661ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.0119ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.329946ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.191007ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.285439ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.182264ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (1.909249ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.22638ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.293141ms)
✔ canonical catalogue & fallback regressions (6.151323ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.316098ms)
  ✔ derives the implemented content manifest path from the API base (0.26583ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.194062ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.316716ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.129725ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.383865ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (0.75185ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (2.374287ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (1.471762ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.141192ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (5.826705ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (1.328276ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.229224ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.136675ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.248754ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.235514ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.25265ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.258469ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (1.692794ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (7.585068ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (0.77209ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.176025ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.118047ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.143836ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.140091ms)
  ✔ validates Indian 10-digit mobile number format (0.581584ms)
  ✔ validates return date on or after pickup date (0.104688ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (1.459142ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.308164ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (4.970468ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.665159ms)
  ✔ preserves is_verified: false when server review is unverified (0.182284ms)
  ✔ never infers verification from booking_id, status, or social media links (0.155383ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.129194ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (2.14317ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 289.596647

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.088496ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.189424ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.187462ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (2.552786ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.549155ms)
  ✔ preserves a valid stored tier (0.131327ms)
✔ tour package base tier form normalization (1.715799ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (2.038804ms)
  ✔ 2. Initial state is strictly masked and empty (0.465329ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.182113ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.459491ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.173471ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.302023ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (4.744329ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 106.883432

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.539992ms)
  ✔ normalizes a trailing slash (0.134412ms)
  ✔ rejects preview hosts in release mode (0.341553ms)
  ✔ requires HTTPS for non-local origins (0.101703ms)
  ✔ allows HTTPS preview origins (0.094342ms)
  ✔ permits HTTP only on loopback in development (0.124217ms)
  ✔ rejects paths and credentials (0.097547ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.109274ms)
✔ canonical site origin (2.504102ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 70.962974
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
✅ [Manifest Builder] Snapshotted 23 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 10 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 4 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:436
            throw new Error(`[Manifest Builder] Published local tour "${item.name || item.slug || item.packageCode}" is missing a valid cover image. Generic fallbacks are forbidden in release builds.`);
                  ^

Error: [Manifest Builder] Published local tour "Agra Fort & Mughal Heritage Circuit" is missing a valid cover image. Generic fallbacks are forbidden in release builds.
    at file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:436:19
    at Array.map (<anonymous>)
    at buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:432:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:485:1

Node.js v24.21.0
```
