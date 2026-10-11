# Main branch verification — 19e335663698

- **Result:** PASS
- **Commit:** [19e335663698496c0e68ee86975b6f39c3c93a87](https://github.com/tarun1sisodia/ArenaAI/commit/19e335663698496c0e68ee86975b6f39c3c93a87)
- **Checked at:** 2026-10-11T03:14:29Z
- **Workflow run:** [38107669106](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38107669106)

## Changed files

- A	Admin Frontend Rewire Plan.md
- A	admin-customer-fare-test-cases.md
- M	admin/src/App.tsx
- M	admin/src/components/admin/Sidebar.tsx
- M	admin/src/contracts/fare-system.ts
- M	admin/src/pages/AuditPage.tsx
- A	admin/src/pages/ExtraChargesPage.tsx
- A	admin/src/pages/FareSettingsPage.tsx
- A	admin/src/pages/PublishingPage.tsx
- A	admin/src/pages/RoundTripRatesPage.tsx
- M	admin/src/pages/RoutesPage.tsx
- A	admin/src/pages/VehiclesPage.tsx
- A	admin/src/services/cleanAdminApi.ts
- M	backend/src/app.ts
- M	backend/src/contracts/fare-system.ts
- M	backend/src/modules/admin/fare-admin.routes.ts
- M	backend/src/modules/admin/fare-admin.service.ts
- M	backend/src/modules/bookings/booking.controller.ts
- M	backend/src/modules/bookings/booking.routes.ts
- M	backend/src/modules/catalog/catalog.routes.ts
- M	backend/src/modules/fare-catalog/fare-catalog.repository.ts
- A	backend/src/modules/fare-catalog/fare-catalog.routes.ts
- M	backend/src/modules/payments/payments.routes.ts
- M	backend/src/modules/quotes/quotes.routes.ts
- M	backend/src/modules/reviews/reviews.routes.ts
- A	backend/tests/unit/clean-routes-alias.test.ts
- A	backend/tests/unit/contracts.test.ts
- M	contracts/fare-system.ts
- A	customer-frontend-rewire-plan.md
- M	docs/agent/02_CHANGE_LEDGER.md
- A	docs/backend/ROUTE_AND_API_INVENTORY.md
- M	docs/project/PROGRESS.md
- M	react/src/app/App.tsx
- M	react/src/app/ServerApp.tsx
- M	react/src/contracts/fare-system.ts
- M	react/src/features/booking/BookingPage.tsx
- A	react/src/features/booking/clean/CleanBookingPage.tsx
- A	react/src/features/booking/clean/bookingTypes.ts
- A	react/src/features/booking/clean/dateTime.ts
- A	react/src/pages/ProductDetailPage.tsx
- A	react/src/services/cleanFareApi.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text

 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 41[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 115[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 5[2mms[22m[39m

[2m Test Files [22m [1m[32m9 passed[39m[22m[90m (9)[39m
[2m      Tests [22m [1m[32m179 passed[39m[22m[90m (179)[39m
[2m   Start at [22m 03:13:53
[2m   Duration [22m 2.32s[2m (transform 278ms, setup 0ms, collect 524ms, tests 253ms, environment 2ms, prepare 518ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts

▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.61095ms)
  ✔ derives the implemented content manifest path from the API base (0.261047ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.223857ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.615513ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 116.113702

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types scripts/test-seo-lifecycle.ts

SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts

[Manifest Builder] No VITE_API_BASE_URL/CATALOG_API_URL; using the local static catalog only (not a live release).
✅ [Manifest Builder] Emitted public/routes-manifest.json (2060 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 963 typed routes.
[Manifest Builder] Preserved existing snapshot at /home/runner/work/ArenaAI/ArenaAI/react/src/data/generated-published-catalog.json because the remote source was not fetched.
[Manifest Builder] Preserved existing snapshot at /home/runner/work/ArenaAI/ArenaAI/react/src/data/generated-published-routes.json because the remote source was not fetched.
[Manifest Builder] Preserved existing snapshot at /home/runner/work/ArenaAI/ArenaAI/react/src/data/generated-published-tour-packages.json because the remote source was not fetched.
[Manifest Builder] Preserved existing snapshot at /home/runner/work/ArenaAI/ArenaAI/react/src/data/generated-published-transfer-routes.json because the remote source was not fetched.
[Manifest Builder] Preserved existing snapshot at /home/runner/work/ArenaAI/ArenaAI/react/src/data/generated-published-local-packages.json because the remote source was not fetched.
[Manifest Builder] Preserved existing snapshot at /home/runner/work/ArenaAI/ArenaAI/react/src/data/generated-published-content.json because the remote source was not fetched.
[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[33mnode_modules/zod/v4/core/regexes.js (74:0): A comment

"/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */"

in "node_modules/zod/v4/core/regexes.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[33mnode_modules/zod/v4/core/util.js (400:0): A comment

"// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle."

in "node_modules/zod/v4/core/util.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[32m✓[39m 2545 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-D_AjMKF4.css                    [39m[1m[2m376.34 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mprices-CuO5rt3Z.js                    [39m[1m[2m  0.25 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mfleets-Bm1BgLTI.js                    [39m[1m[2m  0.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-DojGkX7P.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-EdTeH8RJ.js           [39m[1m[2m  3.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-B1x9cUg0.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-BH7AXSPf.js     [39m[1m[2m  4.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-CrnJc2ht.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-B4Fz8M-J.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-aYlca7Fe.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-SBXa8Dhn.js                [39m[1m[2m  6.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-BWmPHmd-.js              [39m[1m[2m  6.80 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-CzATba7b.js            [39m[1m[2m  7.08 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-Cg5Rqqdp.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-DgNcLj6w.js            [39m[1m[2m 11.00 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-DqKNMg4k.js               [39m[1m[2m 11.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-C1QrWn6y.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-5ELNDT7N.js              [39m[1m[2m 13.88 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-CuFPPNUg.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-CzFqWjcA.js         [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-Dx_LHl5x.js               [39m[1m[2m 22.24 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-ChnPg9nP.js           [39m[1m[2m 27.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-DMSFQ5XU.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-D6vvy8qC.js                 [39m[1m[2m 29.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-DF2YxFkf.js         [39m[1m[2m 31.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-CkL5cHPp.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-BipfhJ7W.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-BGHG1PIB.js                [39m[1m[2m 46.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-B5k39y2B.js              [39m[1m[2m 70.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcleanFareApi-BnoPr5p6.js              [39m[1m[2m 96.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-5T8ktJNK.js                     [39m[1m[2m237.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-YjuurHFu.js            [39m[1m[2m352.50 kB[22m[1m[22m
[32m✓ built in 4.48s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
⚠️ SEO error [h1-count] /en/taxis/rent/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/agc-station-transfer/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/af-station-transfer/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/kheria-airport-transfer/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/delhi-igi-oneway-transfer/: Expected exactly one H1, found 0.
✅ Generated sitemap.xml (50 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://skbagheltravels-customer.coccoder999.workers.dev/sitemap.xml
✅ SSG Pre-Rendering Complete: 59 pages rendered + 14 redirects written (3.50 MB total) in 2.74s.

> sk-baghel-tour-travels@0.1.0 admin:build
> npm --prefix admin run build


> skb-admin@0.1.0 build
> tsc --noEmit && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2406 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                                    [39m[1m[2m  1.63 kB[22m[1m[22m[2m │ gzip:  0.63 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-D0K7QGkD.css                     [39m[1m[2m 56.06 kB[22m[1m[22m[2m │ gzip: 10.52 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-C3wpeitc.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-MQbb5Oye.js                [39m[1m[2m  1.32 kB[22m[1m[22m[2m │ gzip:  0.54 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog--XzH29iP.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFleetPricingGrid-BT98bJdO.js           [39m[1m[2m  2.30 kB[22m[1m[22m[2m │ gzip:  1.00 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-B_O_I06P.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-Doec68xl.js  [39m[1m[2m  2.66 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-DmmVJWIe.js         [39m[1m[2m  6.14 kB[22m[1m[22m[2m │ gzip:  2.21 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-RmDHPGbD.js                [39m[1m[2m  6.19 kB[22m[1m[22m[2m │ gzip:  2.34 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-RVu6g4KV.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-Cj4qz7vA.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.06 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-VaNvzxtu.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-vdPbS3nw.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-_T5qx5ni.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-DaixODXE.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.98 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-BhGOH5WK.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-xwDIK7oK.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.69 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-CZaJbGvE.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-rg7Q3dL0.js                 [39m[1m[2m 15.25 kB[22m[1m[22m[2m │ gzip:  4.42 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-CmQ-2Hg_.js         [39m[1m[2m 18.28 kB[22m[1m[22m[2m │ gzip:  4.65 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-rm5mkQed.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-DoS7BO8Q.js               [39m[1m[2m 20.99 kB[22m[1m[22m[2m │ gzip:  6.28 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-DOygubfB.js              [39m[1m[2m 24.44 kB[22m[1m[22m[2m │ gzip:  8.53 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-HaByZiGn.js           [39m[1m[2m 24.52 kB[22m[1m[22m[2m │ gzip:  7.49 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-BRM2TZRb.js                [39m[1m[2m 28.57 kB[22m[1m[22m[2m │ gzip:  8.36 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-tI3JaBs3.js                      [39m[1m[2m324.25 kB[22m[1m[22m[2m │ gzip: 88.97 kB[22m
[32m✓ built in 4.05s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
