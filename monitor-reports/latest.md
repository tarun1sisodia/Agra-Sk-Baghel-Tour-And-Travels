# Main branch verification — 289e5bcba787

- **Result:** FAIL
- **Commit:** [289e5bcba7876d9b38b5b89edd29dafbb9a407b3](https://github.com/tarun1sisodia/ArenaAI/commit/289e5bcba7876d9b38b5b89edd29dafbb9a407b3)
- **Checked at:** 2026-10-20T03:39:51Z
- **Workflow run:** [39365333657](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39365333657)

## Changed files

- M	backend/src/app.ts
- M	backend/src/config/env.ts
- M	backend/src/modules/bookings/bookings.repository.ts
- M	backend/src/modules/bookings/bookings.service.ts
- M	backend/src/server.ts
- M	react/public/release.json
- M	react/scripts/dynamic-publishing-e2e.test.ts
- A	react/src/features/booking/clean/BookingPaymentCountdownModal.tsx
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/pages/BookingConfirmationPage.tsx

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 204[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 23[2mms[22m[39m
[90mstderr[2m | tests/unit/admin-finance-status.test.ts[2m > [22m[2mAdmin Finance Visibility & Booking Status Alignment[2m > [22m[2mpayments.service: Durable Webhook Retry & Idempotency[2m > [22m[2msafeguards booking creation when user_id is not present in profiles
[22m[39m[bookings] Profile auto-provision attempt for non-existent-user-id: violates foreign key constraint on auth.users

 [32m✓[39m tests/unit/admin-finance-status.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 104[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 35[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1615[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-pdf.service.test.ts [2m([22m[2m19 tests[22m[2m)[22m[33m 439[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 260[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 66[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 260[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 97[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 136[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1609[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-schema.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m

[2m Test Files [22m [1m[32m22 passed[39m[22m[90m (22)[39m
[2m      Tests [22m [1m[32m344 passed[39m[22m[90m (344)[39m
[2m   Start at [22m 03:39:06
[2m   Duration [22m 34.43s[2m (transform 1.24s, setup 0ms, collect 25.32s, tests 5.45s, environment 3ms, prepare 1.13s)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.447705ms)
✔ IST today advances when UTC has crossed into a new IST date (0.243704ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.294262ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.583463ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.284587ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (0.526996ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (5.903923ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.605081ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.434905ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.346965ms)
✔ canonical catalogue & fallback regressions (12.210241ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.815782ms)
  ✔ derives the implemented content manifest path from the API base (0.378407ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.383315ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.353954ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.204157ms)
✔ catalog source resolution (P0-T03 / P0-T04) (5.031645ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (2.944622ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (1.601986ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (3.169173ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.278575ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (10.026477ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (1.942159ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.369839ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.215336ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.481426ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.587523ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.529767ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.37936ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.246006ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (6.705337ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.550897ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.291209ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.249644ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.388464ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.262246ms)
  ✔ validates Indian 10-digit mobile number format (0.486218ms)
  ✔ validates return date on or after pickup date (0.192183ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (1.092615ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (0.875397ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (8.033092ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.715164ms)
  ✔ preserves is_verified: false when server review is unverified (0.152592ms)
  ✔ never infers verification from booking_id, status, or social media links (0.150502ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.185987ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (2.443329ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 428.422257

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.418301ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.266988ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.229758ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (3.561885ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.994561ms)
  ✔ preserves a valid stored tier (0.181196ms)
✔ tour package base tier form normalization (2.751871ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (1.125205ms)
  ✔ 2. Initial state is strictly masked and empty (1.641936ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.179955ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.526701ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.21811ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.199354ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (7.082524ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 166.329827

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.914286ms)
  ✔ normalizes a trailing slash (0.202772ms)
  ✔ rejects preview hosts in release mode (0.412396ms)
  ✔ requires HTTPS for non-local origins (0.163612ms)
  ✔ allows HTTPS preview origins (0.162306ms)
  ✔ permits HTTP only on loopback in development (0.185794ms)
  ✔ rejects paths and credentials (0.169304ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.201548ms)
✔ canonical site origin (3.763222ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 105.43
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts && node --experimental-strip-types scripts/generate-release.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/catalog-sources.ts:106
      throw new Error(
            ^

Error: Production catalog source points at skb-baghel-api-staging.onrender.com. Set production VITE_API_BASE_URL (or ALLOW_STAGING_CATALOG=1 only for an explicit preview/staging experiment).
    at assertNoSilentStagingFallback (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/catalog-sources.ts:106:13)
    at assertFailClosedCatalogEnv (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/catalog-sources.ts:126:3)
    at buildRouteCatalogAndManifest (file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:70:3)
    at file:///home/runner/work/ArenaAI/ArenaAI/react/scripts/build-manifest.ts:583:7
    at ModuleJob.run (node:internal/modules/esm/module_job:561:25)
    at async node:internal/modules/esm/loader:647:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.21.0
```
