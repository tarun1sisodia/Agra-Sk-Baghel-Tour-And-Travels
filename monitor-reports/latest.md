# Main branch verification — feb4a751d655

- **Result:** FAIL
- **Commit:** [feb4a751d6550723ce0a6f1ed9fca12f02612f17](https://github.com/tarun1sisodia/ArenaAI/commit/feb4a751d6550723ce0a6f1ed9fca12f02612f17)
- **Checked at:** 2026-10-20T04:09:48Z
- **Workflow run:** [39367938987](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39367938987)

## Changed files

- M	backend/src/config/env.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	react/public/release.json
- M	react/public/robots.txt
- M	react/public/sitemap.xml
- M	react/scripts/prerender.ts
- M	react/scripts/site-origin.test.ts
- M	react/scripts/validate-seo-artifacts.ts
- M	react/scripts/validate-site-config.ts
- M	react/src/config/siteOrigin.ts
- M	react/src/pages/PackagesPage.tsx

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 210[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m)[22m[32m 22[2mms[22m[39m
[90mstderr[2m | tests/unit/admin-finance-status.test.ts[2m > [22m[2mAdmin Finance Visibility & Booking Status Alignment[2m > [22m[2mpayments.service: Durable Webhook Retry & Idempotency[2m > [22m[2msafeguards booking creation when user_id is not present in profiles
[22m[39m[bookings] Profile auto-provision attempt for non-existent-user-id: violates foreign key constraint on auth.users

 [32m✓[39m tests/unit/admin-finance-status.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 110[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 37[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1615[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 801[2mms[22m[39m
 [32m✓[39m tests/unit/booking-pdf.service.test.ts [2m([22m[2m19 tests[22m[2m)[22m[33m 445[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 37[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 280[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 54[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 293[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 111[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 152[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1609[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-schema.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m

[2m Test Files [22m [1m[32m22 passed[39m[22m[90m (22)[39m
[2m      Tests [22m [1m[32m344 passed[39m[22m[90m (344)[39m
[2m   Start at [22m 04:09:02
[2m   Duration [22m 34.94s[2m (transform 1.06s, setup 0ms, collect 25.28s, tests 5.57s, environment 4ms, prepare 1.25s)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts scripts/home-booking-widget.test.ts scripts/reviews-marquee.test.ts scripts/rental-page.test.ts scripts/dynamic-publishing-e2e.test.ts scripts/booking-date-time.test.ts

✔ IST today stays correct late in the UTC day (1.3686ms)
✔ IST today advances when UTC has crossed into a new IST date (0.208388ms)
▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.867218ms)
  ✔ booking API response and outbound request validation fails closed instead of passing invalid payloads downstream (0.469795ms)
  ✔ route parity allows unavailable vehicle fares but rejects routes without any positive fare (0.294369ms)
  ✔ RentalPage uses English copy and does not fabricate a confirmation reference (1.537734ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.449347ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.425472ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (0.496274ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.770105ms)
✔ canonical catalogue & fallback regressions (11.056164ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.683275ms)
  ✔ derives the implemented content manifest path from the API base (0.317782ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.310789ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.43508ms)
  ✔ treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed (0.216644ms)
✔ catalog source resolution (P0-T03 / P0-T04) (4.959779ms)
▶ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)
  ✔ 1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria (2.371357ms)
  ✔ 2. Fail-closed release build invariants: missing source or stale snapshot strictly fails (1.256231ms)
  ✔ 3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains (2.366678ms)
  ✔ 4. Canonical detail route format contract for packages, local tours, and transfers (0.189744ms)
✔ Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract) (8.078888ms)
▶ HomeBookingWidget — Fleet readiness & Route matching regressions
  ✔ deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups (2.62564ms)
  ✔ deriveActiveVehicleGroups hides groups with 0 active models in live catalog (0.414492ms)
  ✔ deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity (0.27373ms)
  ✔ parseRouteCities parses valid corridor names without falling back to hardcoded cities (0.449568ms)
  ✔ findMatchingOutstationRoute returns exact route for published corridor and null for unmatched (0.422487ms)
  ✔ buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry (0.592012ms)
  ✔ buildBookingHref preserves route, trip type, dates, and group preference during valid handoff (0.425693ms)
  ✔ buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference (0.312382ms)
✔ HomeBookingWidget — Fleet readiness & Route matching regressions (9.648933ms)
▶ Taxi Rental Page — Cano nical Fleet & Form Invariants
  ✔ calculates active models count dynamically from live vehicle catalogue (1.391352ms)
  ✔ selecting a vehicle model preserves the exact model UUID and canonical group code (0.262409ms)
  ✔ changing vehicle group clears incompatible selected vehicle model (0.240768ms)
  ✔ resolves realistic fallback images without hallucinating vehicle identities (0.371693ms)
  ✔ robustly defaults to first active group if current selection is not available in catalog (0.217826ms)
  ✔ validates Indian 10-digit mobile number format (0.355863ms)
  ✔ validates return date on or after pickup date (0.176719ms)
  ✔ ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage (0.860193ms)
  ✔ header & mobile nav normalizeNavPath correctly highlights Taxi Rental link (1.919306ms)
✔ Taxi Rental Page — Cano nical Fleet & Form Invariants (7.841496ms)
▶ ReviewsMarquee — is_verified mapper & badge preservation
  ✔ preserves is_verified: true when server indicates verified review (0.846947ms)
  ✔ preserves is_verified: false when server review is unverified (0.20952ms)
  ✔ never infers verification from booking_id, status, or social media links (0.173223ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.173864ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (2.780289ms)
ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 455.479485

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts src/modules/tour-packages/tour-packages.constants.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.538616ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.339242ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.276034ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (3.942314ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (1.024178ms)
  ✔ preserves a valid stored tier (0.240107ms)
✔ tour package base tier form normalization (3.367673ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (1.135124ms)
  ✔ 2. Initial state is strictly masked and empty (0.539255ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.202727ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.791314ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.242782ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.219389ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (6.649245ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 167.153642

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (1.04138ms)
  ✔ normalizes a trailing slash (0.229086ms)
  ✔ rejects non-approved hosts in release mode (0.441382ms)
  ✔ requires HTTPS for non-local origins (0.238925ms)
  ✔ allows HTTPS preview origins (0.190715ms)
  ✔ permits HTTP only on loopback in development (0.219599ms)
  ✔ rejects paths and credentials (0.317972ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.293948ms)
✔ canonical site origin (5.641308ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 118.326019
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

Node.js v24.22.0
```
