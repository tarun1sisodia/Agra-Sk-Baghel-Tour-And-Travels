# Main branch verification — a1ad439f8286

- **Result:** PASS
- **Commit:** [a1ad439f828666c237b19ac363d67ca3138f0170](https://github.com/tarun1sisodia/ArenaAI/commit/a1ad439f828666c237b19ac363d67ca3138f0170)
- **Checked at:** 2026-10-11T14:04:15Z
- **Workflow run:** [38145595261](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38145595261)

## Changed files


## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1616[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 120[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1609[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 801[2mms[22m[39m

[2m Test Files [22m [1m[32m9 passed[39m[22m[90m (9)[39m
[2m      Tests [22m [1m[32m179 passed[39m[22m[90m (179)[39m
[2m   Start at [22m 14:03:36
[2m   Duration [22m 5.53s[2m (transform 277ms, setup 0ms, collect 521ms, tests 3.46s, environment 1ms, prepare 506ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts

▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.346128ms)
  ✔ derives the implemented content manifest path from the API base (0.276014ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.221152ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.165246ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 106.17404

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
[33mnode_modules/zod/v4/core/util.js (400:0): A comment

"// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle."

in "node_modules/zod/v4/core/util.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[33mnode_modules/zod/v4/core/regexes.js (74:0): A comment

"/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */"

in "node_modules/zod/v4/core/regexes.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[32m✓[39m 2545 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-D_AjMKF4.css                    [39m[1m[2m376.34 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mprices-CuO5rt3Z.js                    [39m[1m[2m  0.25 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mfleets-Bm1BgLTI.js                    [39m[1m[2m  0.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-NAIsnR3X.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-DeGg69bL.js           [39m[1m[2m  3.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-B1x9cUg0.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-CjeHsMnp.js     [39m[1m[2m  4.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-DDcBdRex.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-BdEXdGRK.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-XO8Rjh6n.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-AMUFscOq.js                [39m[1m[2m  6.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-BWmPHmd-.js              [39m[1m[2m  6.80 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-DmHnNxgw.js            [39m[1m[2m  7.08 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-COb4iSVl.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-ChSihtWj.js            [39m[1m[2m 11.00 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-Bg8uvmj0.js               [39m[1m[2m 11.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-D0udwhj7.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-BTRIT1Bo.js              [39m[1m[2m 13.88 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-DGKwIZzM.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-BGvcC1G2.js         [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-CxZhIeR2.js               [39m[1m[2m 22.24 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-CCTYbBN-.js           [39m[1m[2m 27.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-B-ttn-1S.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-BUbY_gIM.js                 [39m[1m[2m 29.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-CJ2jfr1Y.js         [39m[1m[2m 31.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-CkL5cHPp.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-DO_QeeQO.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-B_OH4MV8.js                [39m[1m[2m 46.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-PUaukjbX.js              [39m[1m[2m 70.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcleanFareApi-ha2nP1Dx.js              [39m[1m[2m 97.07 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-D_yMArIc.js                     [39m[1m[2m237.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-YjuurHFu.js            [39m[1m[2m352.50 kB[22m[1m[22m
[32m✓ built in 4.42s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
⚠️ SEO error [h1-count] /en/taxis/rent/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/agc-station-transfer/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/af-station-transfer/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/kheria-airport-transfer/: Expected exactly one H1, found 0.
⚠️ SEO error [h1-count] /en/transfers/delhi-igi-oneway-transfer/: Expected exactly one H1, found 0.
✅ Generated sitemap.xml (50 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://skbagheltravels-customer.coccoder999.workers.dev/sitemap.xml
✅ SSG Pre-Rendering Complete: 59 pages rendered + 14 redirects written (3.50 MB total) in 2.71s.

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
[2mdist/[22m[2massets/[22m[35mindex-B2w4Cm6H.css                     [39m[1m[2m 56.17 kB[22m[1m[22m[2m │ gzip: 10.53 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-KFtX_8XN.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-AimITl9x.js                [39m[1m[2m  1.32 kB[22m[1m[22m[2m │ gzip:  0.54 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-ZBd2uju6.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFleetPricingGrid-wj-MmpRz.js           [39m[1m[2m  2.30 kB[22m[1m[22m[2m │ gzip:  1.00 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-Dk-5p8ut.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-cTkK-xCf.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-Du2QuHGD.js         [39m[1m[2m  6.14 kB[22m[1m[22m[2m │ gzip:  2.21 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-nEjyh4G1.js                [39m[1m[2m  6.19 kB[22m[1m[22m[2m │ gzip:  2.34 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-Dc95jwd_.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-GNlqNTXN.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-7DuhuW1F.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-CLyV_1j-.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-CYCv92lE.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-Cd8UWhc5.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.98 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-CP1GfUAu.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-DkTZivqx.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.69 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-CTXfBF5T.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-Bi-z6_6J.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.80 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-6UUruYWe.js         [39m[1m[2m 18.29 kB[22m[1m[22m[2m │ gzip:  4.65 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-CSsZuqJG.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-CbuTN9xk.js               [39m[1m[2m 20.99 kB[22m[1m[22m[2m │ gzip:  6.28 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-DOygubfB.js              [39m[1m[2m 24.44 kB[22m[1m[22m[2m │ gzip:  8.53 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-DmHK_FsI.js           [39m[1m[2m 24.52 kB[22m[1m[22m[2m │ gzip:  7.48 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-DpEu0pGC.js                [39m[1m[2m 28.57 kB[22m[1m[22m[2m │ gzip:  8.36 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-D1zkiH8s.js                      [39m[1m[2m324.25 kB[22m[1m[22m[2m │ gzip: 88.97 kB[22m
[32m✓ built in 4.04s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
