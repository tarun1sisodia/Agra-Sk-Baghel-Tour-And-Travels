# Main branch verification — 5c157412071e

- **Result:** FAIL
- **Commit:** [5c157412071e499d79ee0ec072709d862b12bb55](https://github.com/tarun1sisodia/ArenaAI/commit/5c157412071e499d79ee0ec072709d862b12bb55)
- **Checked at:** 2026-10-19T17:44:14Z
- **Workflow run:** [39296496682](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39296496682)

## Changed files

- M	backend/src/modules/publishing/publication-worker.ts
- M	backend/src/modules/reviews/reviews.repository.ts
- M	backend/src/modules/reviews/reviews.service.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	docs/project/04_PROGRESS_TRACKER.md
- M	react/scripts/build-manifest.ts
- M	react/scripts/catalog-sources.ts
- M	react/scripts/generate-sitemap.ts
- M	react/scripts/validate-site-config.ts
- M	react/src/components/home/ReviewsMarquee.tsx
- A	react/src/data/generated-published-reviews.json

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  eventId: [32m'ev-title-mismatch'[39m,
  expectedTitle: [32m'Updated Sunrise Taj Tour'[39m
} Detail page does not yet reflect published title

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: returns false if cover image returns HTTP 404
[22m[39m{
  eventId: [32m'ev-img-fail'[39m,
  imageUrl: [32m'https://agraskbagheltourandtravels.com/assets/packages/broken-cover.webp'[39m,
  status: [33m404[39m
} Cover image not reachable

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: returns false if customer site origin check fails or throws
[22m[39m{ eventId: [32m'ev-health-fail'[39m, status: [33m503[39m } Customer site origin responded with error

 [32m✓[39m tests/unit/publication-worker.test.ts [2m([22m[2m22 tests[22m[2m)[22m[32m 20[2mms[22m[39m
[90mstdout[2m | tests/unit/dynamic-publishing.test.ts[2m > [22m[2mPhase D — Dynamic Catalog Publishing & SEO Integration[2m > [22m[2mdispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls
[22m[39m{
  eventId: [32m'514cbb45-cb83-4940-a95c-4271de2fc31c'[39m,
  entityType: [32m'tour_package'[39m,
  eventType: [32m'published'[39m,
  target: [32m'https://api.cloudflare.com/client/v4/page...[redacted]'[39m
} dispatching deploy hook

[90mstdout[2m | tests/unit/dynamic-publishing.test.ts[2m > [22m[2mPhase D — Dynamic Catalog Publishing & SEO Integration[2m > [22m[2mdispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls
[22m[39m[catalog-release] {
  correlationId: [32m'514cbb45-cb83-4940-a95c-4271de2fc31c'[39m,
  reason: [32m'tour_package-published'[39m,
  entityType: [32m'tour_package'[39m,
  entityId: [32m'77777777-7777-4777-8777-777777777777'[39m,
  slug: [1mnull[22m,
  sourceVersion: [1mnull[22m,
  releaseState: [32m'release_queued'[39m,
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{
  eventId: [32m'514cbb45-cb83-4940-a95c-4271de2fc31c'[39m,
  deploymentRef: [32m'deploy-123'[39m
} deploy hook accepted; publication status moved to triggered

[90mstdout[2m | tests/unit/dynamic-publishing.test.ts[2m > [22m[2mPhase D — Dynamic Catalog Publishing & SEO Integration[2m > [22m[2mdispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls
[22m[39m[catalog-release] {
  correlationId: [32m'514cbb45-cb83-4940-a95c-4271de2fc31c'[39m,
  reason: [32m'tour_package-published'[39m,
  entityType: [32m'tour_package'[39m,
  entityId: [32m'77777777-7777-4777-8777-777777777777'[39m,
  slug: [1mnull[22m,
  sourceVersion: [1mnull[22m,
  releaseState: [32m'release_deployed'[39m,
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{ eventId: [32m'514cbb45-cb83-4940-a95c-4271de2fc31c'[39m } deployment verification succeeded; event finalized

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 281[2mms[22m[39m
[90mstderr[2m | tests/unit/bookings-payments.test.ts[2m > [22m[2mSection 12.12: Booking and payment (BK-01 to PM-10)[2m > [22m[2mEM-03: sendBookingConfirmationEmail returns false without crashing when Resend returns HTTP 500
[22m[39m[payments] Resend confirmation email delivery failed for AGR-20261019-5102: Internal Resend Server Error

 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 141[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 18[2mms[22m[39m
[90mstderr[2m | tests/unit/admin-finance-status.test.ts[2m > [22m[2mAdmin Finance Visibility & Booking Status Alignment[2m > [22m[2mpayments.service: Durable Webhook Retry & Idempotency[2m > [22m[2msafeguards booking creation when user_id is not present in profiles
[22m[39m[bookings] Profile auto-provision attempt for non-existent-user-id: violates foreign key constraint on auth.users

 [32m✓[39m tests/unit/admin-finance-status.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 76[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1614[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-pdf.service.test.ts [2m([22m[2m19 tests[22m[2m)[22m[33m 304[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 174[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 46[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 185[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 68[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 93[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1610[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 803[2mms[22m[39m
 [32m✓[39m tests/unit/booking-schema.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m22 passed[39m[22m[90m (22)[39m
[2m      Tests [22m [1m[32m344 passed[39m[22m[90m (344)[39m
[2m   Start at [22m 17:43:47
[2m   Duration [22m 25.53s[2m (transform 877ms, setup 0ms, collect 18.01s, tests 4.75s, environment 2ms, prepare 817ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.094122ms)
✔ IST today advances when UTC has crossed into a new IST date (0.220768ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (2.12497ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.243146ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.113748ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.228858ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (3.108894ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.326674ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.252515ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.186215ms)
✔ canonical catalogue & fallback regressions (8.522378ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.201913ms)
  ✔ derives the implemented content manifest path from the API base (0.24696ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.297635ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.19945ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.114705ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.317996ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (0.894519ms)
  ✖ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (1.53212ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (1.919322ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.170569ms)
✖ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (7.336787ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (1.439058ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.597803ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.231833ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.361732ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.319309ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.305494ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.238523ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.203534ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (6.657023ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (0.853755ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.249446ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.119873ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.252018ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.167109ms)
  ✔ validates Indian 10-digit mobile number format (0.280856ms)
  ✔ validates return date on or after pickup date (0.126937ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.592511ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.426783ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (4.379758ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.4541ms)
  ✔ preserves is_verified: false when server review is unverified (0.116648ms)
  ✔ never infers verification from booking_id, status, or social media links (0.098917ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.094024ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (1.5834ms)
ℹ tests 40
ℹ suites 6
ℹ pass 39
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 333.425711

✖ failing tests:

test at scripts/dynamic-publishing-e2e.test.ts:31:3
✖ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (1.53212ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  
  6 !== 5
  
      at TestContext.<anonymous> (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/dynamic-publishing-e2e.test.ts:59:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1402:25)
      at Suite.processPendingSubtests (node:internal/test_runner/test:974:18)
      at Test.postRun (node:internal/test_runner/test:1542:19)
      at Test.run (node:internal/test_runner/test:1467:12)
      at async Promise.all (index 0)
      at async Suite.run (node:internal/test_runner/test:1905:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 6,
    expected: 5,
    operator: 'strictEqual',
    diff: 'simple'
  }
```
