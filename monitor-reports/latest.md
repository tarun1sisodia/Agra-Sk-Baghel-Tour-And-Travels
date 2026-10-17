# Main branch verification — 59aa3d18d660

- **Result:** PASS
- **Commit:** [59aa3d18d6600d1a811241821768723d9f467d97](https://github.com/tarun1sisodia/ArenaAI/commit/59aa3d18d6600d1a811241821768723d9f467d97)
- **Checked at:** 2026-10-17T09:14:20Z
- **Workflow run:** [39020242042](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39020242042)

## Changed files


## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
✔ tour package base tier form normalization (3.169556ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.939591ms)
  ✔ 2. Initial state is strictly masked and empty (1.777142ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.237393ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.46145ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.225059ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.184253ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (5.3177ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 193.867771

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (1.023107ms)
  ✔ normalizes a trailing slash (0.205633ms)
  ✔ rejects preview hosts in release mode (0.464746ms)
  ✔ requires HTTPS for non-local origins (0.21503ms)
  ✔ allows HTTPS preview origins (0.171279ms)
  ✔ permits HTTP only on loopback in development (0.223086ms)
  ✔ rejects paths and credentials (0.275784ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.190365ms)
✔ canonical site origin (4.467735ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 115.897433
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
✅ [Manifest Builder] Snapshotted 24 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 10 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 5 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
✅ [Manifest Builder] Snapshotted 4 published local packages from https://skb-baghel-api-staging.onrender.com/api/v1/local-packages/manifest.
✅ [Manifest Builder] Snapshotted content manifest (5 sections) from https://skb-baghel-api-staging.onrender.com/api/v1/content/manifest.
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
[32m✓[39m 2559 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-DrWDDtHH.css                    [39m[1m[2m370.22 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-DCg_Cemn.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36museLocationIQ-q9-1LAPL.js             [39m[1m[2m  2.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-ijRsnJyR.js           [39m[1m[2m  3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-XvDLxcsz.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-YQgTWl_7.js     [39m[1m[2m  4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-BF5HCOFD.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-BfMBKViA.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-DgRDZfxa.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-E_OU_-2J.js            [39m[1m[2m  7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-bO9R6wf1.js              [39m[1m[2m  9.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-DJeFL7Am.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-C7t_hmwN.js            [39m[1m[2m 11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-DKv8EJRO.js   [39m[1m[2m 11.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-C_hcOPcL.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-nqjjnVAe.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-DAaE-i1i.js         [39m[1m[2m 14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-e3J-tkje.js              [39m[1m[2m 16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentDetailPage-CtsmfOyZ.js        [39m[1m[2m 17.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-D9UYGqhw.js                [39m[1m[2m 19.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLocalPackageDetailPage-EXnsRsfW.js    [39m[1m[2m 19.63 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTransferDetailPage-W7lGIMMU.js        [39m[1m[2m 20.83 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-BJYkWrAi.js               [39m[1m[2m 21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-B5Rwleq3.js           [39m[1m[2m 27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-BsMDg_bC.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-C3DrsbmA.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-K6xkwOwu.js               [39m[1m[2m 32.00 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-D6WfW77r.js         [39m[1m[2m 32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-BZsfIL5C.js                 [39m[1m[2m 33.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-BnyJ3JxS.js                 [39m[1m[2m 35.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-DOPfCbDj.js                [39m[1m[2m 54.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-DD0BOjxP.js              [39m[1m[2m 71.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-Cm2_ZEqa.js            [39m[1m[2m353.04 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-Clbv5p2X.js                     [39m[1m[2m375.89 kB[22m[1m[22m
[32m✓ built in 4.68s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (71 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 80 pages rendered + 23 redirects written (4.65 MB total) in 3.06s.
SEO artifact checks passed: 102 HTML files, 71 sitemap URLs, canonical origin https://agraskbagheltourandtravels.com.

> sk-baghel-tour-travels@0.1.0 admin:build
> npm --prefix admin run build


> skb-admin@0.1.0 build
> tsc --noEmit && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2457 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                                    [39m[1m[2m  1.63 kB[22m[1m[22m[2m │ gzip:  0.63 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-CIcIjEgS.css                     [39m[1m[2m 57.84 kB[22m[1m[22m[2m │ gzip: 10.83 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-eSsnTAWA.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-BmxCW6zM.js                [39m[1m[2m  1.37 kB[22m[1m[22m[2m │ gzip:  0.55 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-Dn6rvHbP.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-DH_tVYoh.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-Cou2E6oy.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-CuCg4Q67.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-DSkUgb6H.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-C4xwrMIv.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-ChuTvLAq.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-BFvzjJCY.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-CIEf4bXX.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  3.00 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-KnN0AB05.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-BV3EwYbw.js         [39m[1m[2m  9.13 kB[22m[1m[22m[2m │ gzip:  2.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-BsDGgMwD.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-BEx311u9.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.70 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-CZI1vfXy.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-Dp7JTeJ4.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.81 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-DaheM51O.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-CRxALp0z.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-C_i54QbD.js               [39m[1m[2m 21.89 kB[22m[1m[22m[2m │ gzip:  6.54 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-C4dj_Y5U.js           [39m[1m[2m 25.44 kB[22m[1m[22m[2m │ gzip:  7.74 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-BDsCgQ-W.js              [39m[1m[2m 26.77 kB[22m[1m[22m[2m │ gzip:  9.14 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-DlZmNxqG.js                [39m[1m[2m 28.77 kB[22m[1m[22m[2m │ gzip:  8.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-DKbRS9TZ.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-CK8Yo_sF.js                [39m[1m[2m 42.67 kB[22m[1m[22m[2m │ gzip: 15.00 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-Bj7SCSeC.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Oh0PCTUB.js               [39m[1m[2m221.81 kB[22m[1m[22m[2m │ gzip: 69.00 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-N8T6LeDF.js                      [39m[1m[2m325.99 kB[22m[1m[22m[2m │ gzip: 89.50 kB[22m
[32m✓ built in 4.28s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
