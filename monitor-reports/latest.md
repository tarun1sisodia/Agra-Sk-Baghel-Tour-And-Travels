# Main branch verification — 599c48abb87d

- **Result:** FAIL
- **Commit:** [599c48abb87dcd0020d186a8ed1f0fa1cfb9e91a](https://github.com/tarun1sisodia/ArenaAI/commit/599c48abb87dcd0020d186a8ed1f0fa1cfb9e91a)
- **Checked at:** 2026-10-16T17:56:35Z
- **Workflow run:** [38943371097](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38943371097)

## Changed files

- M	.github/workflows/ci-customer.yml
- M	.github/workflows/main-monitor.yml
- M	package.json

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  slug: [1mnull[22m,
  sourceVersion: [1mnull[22m,
  releaseState: [32m'release_deployed'[39m,
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{ eventId: [32m'619726d7-75fb-45df-a07a-e4776ca4c075'[39m } deployment verification succeeded; event finalized

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 502[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 40[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1616[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 318[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 53[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 321[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 119[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 162[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1608[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 801[2mms[22m[39m

[2m Test Files [22m [1m[32m18 passed[39m[22m[90m (18)[39m
[2m      Tests [22m [1m[32m301 passed[39m[22m[90m (301)[39m
[2m   Start at [22m 17:56:11
[2m   Duration [22m 11.18s[2m (transform 1.02s, setup 0ms, collect 3.10s, tests 4.95s, environment 3ms, prepare 1.02s)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts

▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.664204ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.55199ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.303807ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.560435ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (2.064521ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.426135ms)
✔ canonical catalogue & fallback regressions (7.865481ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (2.091832ms)
  ✔ derives the implemented content manifest path from the API base (0.377054ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.346216ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.630265ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.244747ms)
✔ catalog source resolution (P0-T03 / P0-T04) (5.889505ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (1.343295ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (3.234524ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (2.6485ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.242582ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (9.380186ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (2.229828ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.544816ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.248193ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.520871ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.458676ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.630285ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.4502ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.666874ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (8.772632ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.56574ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.348671ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.248654ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.343291ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.242653ms)
  ✔ validates Indian 10-digit mobile number format (0.350344ms)
  ✔ validates return date on or after pickup date (0.170197ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.891563ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.433709ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (6.893828ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (1.278255ms)
  ✔ preserves is_verified: false when server review is unverified (0.246169ms)
  ✔ never infers verification from booking_id, status, or social media links (0.25703ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.343261ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (7.263668ms)
ℹ tests 36
ℹ suites 6
ℹ pass 36
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 354.755849

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.842005ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.362777ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.336949ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (4.624586ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.910548ms)
  ✔ preserves a valid stored tier (0.171651ms)
✔ tour package base tier form normalization (2.69146ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (1.290617ms)
  ✔ 2. Initial state is strictly masked and empty (2.641147ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.265876ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.5738ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.325387ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.380761ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (7.928879ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 188.927531

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.99196ms)
  ✔ normalizes a trailing slash (0.197699ms)
  ✔ rejects preview hosts in release mode (0.485566ms)
  ✔ requires HTTPS for non-local origins (0.179835ms)
  ✔ allows HTTPS preview origins (0.163204ms)
  ✔ permits HTTP only on loopback in development (0.215962ms)
  ✔ rejects paths and credentials (0.253894ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.175387ms)
✔ canonical site origin (4.338021ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 119.202592
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
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:374
            throw new Error(`[Manifest Builder] Published tour package "${item.name || item.slug || item.packageCode}" is missing a valid cover image. Generic fallbacks are forbidden in release builds.`);
                  ^

Error: [Manifest Builder] Published tour package "Golden Triangle Tour (3 Days / 2 Nights)" is missing a valid cover image. Generic fallbacks are forbidden in release builds.
    at file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:374:19
    at Array.map (<anonymous>)
    at buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:370:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:485:1

Node.js v24.21.0
```
