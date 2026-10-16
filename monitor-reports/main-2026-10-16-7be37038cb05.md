# Main branch verification — 7be37038cb05

- **Result:** FAIL
- **Commit:** [7be37038cb05110cae96bdfdcc7a4051e6de7ebe](https://github.com/tarun1sisodia/ArenaAI/commit/7be37038cb05110cae96bdfdcc7a4051e6de7ebe)
- **Checked at:** 2026-10-16T18:09:05Z
- **Workflow run:** [38944989280](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38944989280)

## Changed files

- A	backend/migrations/0043_restore_public_content_baselines.sql
- M	backend/src/db/dossier-types.ts
- M	backend/src/db/postgres.ts
- A	backend/tests/unit/local-package-media.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{ eventId: [32m'4cdf66ff-90ab-4680-9d0b-87eeae8c5038'[39m } deployment verification succeeded; event finalized

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 313[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1611[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 802[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 187[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 44[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 191[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 76[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 91[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1607[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m19 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[32m302 passed[39m[22m[90m (302)[39m
[2m   Start at [22m 18:08:45
[2m   Duration [22m 9.03s[2m (transform 815ms, setup 0ms, collect 2.29s, tests 4.29s, environment 2ms, prepare 705ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts

▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (3.999374ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.374344ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.19899ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.283838ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.251148ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.268524ms)
✔ canonical catalogue & fallback regressions (8.009405ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.080147ms)
  ✔ derives the implemented content manifest path from the API base (0.240212ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.161003ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.309637ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.117898ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.012508ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (0.820787ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (1.870027ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (1.49346ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.153932ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (5.50316ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (1.334741ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.412722ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.156726ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.351579ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.253492ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.298219ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.336868ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.174273ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (4.690536ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (0.814226ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.220362ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.131929ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.215815ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.125209ms)
  ✔ validates Indian 10-digit mobile number format (0.363538ms)
  ✔ validates return date on or after pickup date (0.102525ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.541065ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.521025ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (4.266136ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.872985ms)
  ✔ preserves is_verified: false when server review is unverified (0.176677ms)
  ✔ never infers verification from booking_id, status, or social media links (0.169896ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.3719ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (3.50466ms)
ℹ tests 36
ℹ suites 6
ℹ pass 36
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 231.198946

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (0.981328ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.187492ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.139661ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (2.405744ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.65035ms)
  ✔ preserves a valid stored tier (0.154523ms)
✔ tour package base tier form normalization (1.756045ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.931364ms)
  ✔ 2. Initial state is strictly masked and empty (1.268681ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.133862ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.335005ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.178289ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.145879ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (3.926525ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 120.420916

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.721837ms)
  ✔ normalizes a trailing slash (0.156406ms)
  ✔ rejects preview hosts in release mode (0.340202ms)
  ✔ requires HTTPS for non-local origins (0.107121ms)
  ✔ allows HTTPS preview origins (0.091598ms)
  ✔ permits HTTP only on loopback in development (0.123797ms)
  ✔ rejects paths and credentials (0.136155ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.095764ms)
✔ canonical site origin (2.804574ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 79.184983
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (971 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 971 typed routes.
✅ [Manifest Builder] Snapshotted 10 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 2 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 2 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:436
            throw new Error(`[Manifest Builder] Published local tour "${item.name || item.slug || item.packageCode}" is missing a valid cover image. Generic fallbacks are forbidden in release builds.`);
                  ^

Error: [Manifest Builder] Published local tour "Agra Sightseeing (8 Hours / 80 KM)" is missing a valid cover image. Generic fallbacks are forbidden in release builds.
    at file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:436:19
    at Array.map (<anonymous>)
    at buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:432:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:485:1

Node.js v24.21.0
```
