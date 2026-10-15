# Main branch verification — 40706c7e7f91

- **Result:** PASS
- **Commit:** [40706c7e7f91cf40cf2a1f61de7689223be75854](https://github.com/tarun1sisodia/ArenaAI/commit/40706c7e7f91cf40cf2a1f61de7689223be75854)
- **Checked at:** 2026-10-15T13:10:46Z
- **Workflow run:** [38740288944](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38740288944)

## Changed files

- M	admin/src/components/admin/StatusBadge.tsx
- M	admin/src/contracts/fare-system.ts
- M	admin/src/lib/api.ts
- M	admin/src/lib/types.ts
- M	admin/src/pages/ReviewsPage.tsx
- M	backend/src/contracts/fare-system.ts
- M	backend/src/db/postgres.ts
- M	backend/src/modules/reviews/review.routes.ts
- M	backend/src/modules/reviews/reviews.repository.ts
- M	backend/src/modules/reviews/reviews.routes.ts
- M	backend/src/modules/reviews/reviews.service.ts
- M	backend/tests/unit/reviews-engine.test.ts
- M	contracts/fare-system.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	docs/project/PROGRESS.md
- M	react/src/components/home/HomeBookingWidget.tsx
- M	react/src/components/home/ReviewsMarquee.tsx
- M	react/src/contracts/fare-system.ts
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/services/api.ts
- M	react/src/services/catalog.ts
- M	react/src/services/catalogManifest.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 114[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 162[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1609[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 804[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m

[2m Test Files [22m [1m[32m13 passed[39m[22m[90m (13)[39m
[2m      Tests [22m [1m[32m204 passed[39m[22m[90m (204)[39m
[2m   Start at [22m 13:10:03
[2m   Duration [22m 8.42s[2m (transform 930ms, setup 0ms, collect 2.15s, tests 3.94s, environment 2ms, prepare 765ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts scripts/catalog-fallback.test.ts

▶ canonical catalogue & fallback regressions
  ✔ loadPublishedPackages never falls back to static mock packages (1.089939ms)
  ✔ ReviewsMarquee does not import synthetic fallbackReviews (0.230732ms)
  ✔ RoutesPage does not fallback to staticCatalogRoutes (0.313808ms)
  ✔ FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty (1.208441ms)
  ✔ ServicesPage separates editorial copy from live fleet facts (0.281406ms)
✔ canonical catalogue & fallback regressions (4.771596ms)
▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.573523ms)
  ✔ derives the implemented content manifest path from the API base (0.312144ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.332892ms)
  ✔ enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files (0.344615ms)
✔ catalog source resolution (P0-T03 / P0-T04) (4.354476ms)
ℹ tests 9
ℹ suites 2
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 134.75188

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

[Manifest Builder] No VITE_API_BASE_URL/CATALOG_API_URL; using the local static catalog only (not a release build).
✅ [Manifest Builder] Emitted public/routes-manifest.json (963 routes) from backend catalog.
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
[32m✓[39m 2549 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-CjMcS682.css                    [39m[1m[2m381.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mprices-CuO5rt3Z.js                    [39m[1m[2m  0.25 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mfleets-Bm1BgLTI.js                    [39m[1m[2m  0.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-CnLbtIh_.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-na0k26tt.js           [39m[1m[2m  3.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-CfrqpXJm.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-z-nEk3-M.js     [39m[1m[2m  4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-D6c186tI.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-ZLxFu1ox.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-Cm7NXtGC.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-wU1FRu9n.js                [39m[1m[2m  6.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-PO-8yixY.js            [39m[1m[2m  7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons--spl11uJ.js              [39m[1m[2m  8.03 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-D9T4dmPi.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-CnYurxGn.js            [39m[1m[2m 11.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-Djup8rVL.js   [39m[1m[2m 11.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-a7YUUmj1.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-DAo6HZC9.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-t7fn2XPb.js         [39m[1m[2m 14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-NU6OpPtd.js              [39m[1m[2m 16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-Cq26xGeN.js               [39m[1m[2m 21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-DU24LB6e.js               [39m[1m[2m 24.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-BY5EEHQO.js           [39m[1m[2m 27.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-Cs3W1AnT.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-DAYTBdV9.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-Cq82knaE.js         [39m[1m[2m 32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-B4EiEzHv.js                 [39m[1m[2m 32.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-BIC-HNqJ.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-BiIEsf1x.js                [39m[1m[2m 48.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-O_w7Mgg6.js              [39m[1m[2m 70.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-CCpWhkOr.js            [39m[1m[2m349.46 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-B6IPGuFu.js                     [39m[1m[2m358.82 kB[22m[1m[22m
[32m✓ built in 4.66s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (50 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://skbagheltravels-customer.coccoder999.workers.dev/sitemap.xml
✅ SSG Pre-Rendering Complete: 59 pages rendered + 14 redirects written (3.34 MB total) in 2.87s.

> sk-baghel-tour-travels@0.1.0 admin:build
> npm --prefix admin run build


> skb-admin@0.1.0 build
> tsc --noEmit && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2407 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                                    [39m[1m[2m  1.63 kB[22m[1m[22m[2m │ gzip:  0.62 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-Bd2tgWBH.css                     [39m[1m[2m 57.39 kB[22m[1m[22m[2m │ gzip: 10.74 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-DBNa52RG.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-DXxyDZvI.js                [39m[1m[2m  1.37 kB[22m[1m[22m[2m │ gzip:  0.55 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-RMOuYgU5.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-uZaEml9g.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-D0MZyBDL.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-DrFMwY9F.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-DyBfAQ02.js         [39m[1m[2m  6.14 kB[22m[1m[22m[2m │ gzip:  2.22 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-Dfs3UmEJ.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-C7jv_NRg.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-x6SySqPf.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-M-ijyyNK.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-yU2q3efO.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-CMZXI4P0.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.98 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-CPmZEesx.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-p1SlY-yT.js                [39m[1m[2m 10.03 kB[22m[1m[22m[2m │ gzip:  3.23 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-BDpWiVCW.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.69 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-CU07Zd_D.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-BtVsQPvR.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.80 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-BP5IonZy.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-BkZllnKu.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-BQigwPhm.js               [39m[1m[2m 20.99 kB[22m[1m[22m[2m │ gzip:  6.28 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-Dti7r3zG.js              [39m[1m[2m 24.58 kB[22m[1m[22m[2m │ gzip:  8.55 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-CLbdotr-.js           [39m[1m[2m 24.63 kB[22m[1m[22m[2m │ gzip:  7.54 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-DT8MnXi0.js                [39m[1m[2m 28.57 kB[22m[1m[22m[2m │ gzip:  8.36 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-D2O0fp-t.js                      [39m[1m[2m325.30 kB[22m[1m[22m[2m │ gzip: 89.34 kB[22m
[32m✓ built in 4.17s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
