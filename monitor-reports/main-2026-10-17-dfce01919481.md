# Main branch verification — dfce01919481

- **Result:** PASS
- **Commit:** [dfce01919481f05b498db210cd2138c992a2b1fd](https://github.com/tarun1sisodia/ArenaAI/commit/dfce01919481f05b498db210cd2138c992a2b1fd)
- **Checked at:** 2026-10-17T21:42:56Z
- **Workflow run:** [39071992831](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39071992831)

## Changed files

- M	backend/src/app.ts
- M	backend/src/modules/payments/payments.service.ts
- M	backend/tests/unit/bookings-payments.test.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	docs/project/04_PROGRESS_TRACKER.md
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/services/cleanFareApi.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.217879ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.153371ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (4.727954ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 145.225986

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.851315ms)
  ✔ normalizes a trailing slash (0.241635ms)
  ✔ rejects preview hosts in release mode (0.419713ms)
  ✔ requires HTTPS for non-local origins (0.15229ms)
  ✔ allows HTTPS preview origins (0.156436ms)
  ✔ permits HTTP only on loopback in development (0.176737ms)
  ✔ rejects paths and credentials (0.179821ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.133912ms)
✔ canonical site origin (3.639051ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 101.101141
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (1841 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 2717 typed routes.
✅ [Manifest Builder] Snapshotted 891 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 4 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 5 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
✅ [Manifest Builder] Snapshotted 5 published local packages from https://skb-baghel-api-staging.onrender.com/api/v1/local-packages/manifest.
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
[32m✓[39m 2560 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m    4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-Bkxsj1V8.css                    [39m[1m[2m  371.04 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m    0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m    0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-men0jot8.js  [39m[1m[2m    1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36museLocationIQ-lgJ0Yhvd.js             [39m[1m[2m    2.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-Dld2qU_W.js           [39m[1m[2m    3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-jW6yoj7u.js             [39m[1m[2m    4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-DtB7dmie.js     [39m[1m[2m    4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-DYYcAtoL.js              [39m[1m[2m    5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-KaV3EBXU.js          [39m[1m[2m    5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mReviewPage-BzloR3O5.js                [39m[1m[2m    5.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-BzF_svrm.js                 [39m[1m[2m    6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-yjQe-YEV.js            [39m[1m[2m    7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-D3lJUjVR.js              [39m[1m[2m   10.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m   10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-Dr9kvza6.js         [39m[1m[2m   10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-DjEK4Heg.js            [39m[1m[2m   11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m   11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-CAXGueLH.js   [39m[1m[2m   11.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-CoCuTkjl.js                   [39m[1m[2m   12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-C6Z9s8uo.js             [39m[1m[2m   14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-8Aowuian.js         [39m[1m[2m   14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-CDEREBjI.js              [39m[1m[2m   16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentDetailPage-DJVD1WoK.js        [39m[1m[2m   17.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-C0YGWCjL.js                [39m[1m[2m   19.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLocalPackageDetailPage-C32b6zvs.js    [39m[1m[2m   19.63 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTransferDetailPage-BfIxvbfT.js        [39m[1m[2m   20.83 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-DChEtIWg.js               [39m[1m[2m   21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-Kb0q8_uH.js           [39m[1m[2m   27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-12qZnRhc.js         [39m[1m[2m   28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-KhC4cvem.js                [39m[1m[2m   31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-DKt8jAPS.js         [39m[1m[2m   32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-CnO8yWLO.js               [39m[1m[2m   32.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-B8mSNXTR.js                 [39m[1m[2m   33.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-D4nsMKxg.js                 [39m[1m[2m   35.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-CjZL8UF9.js                [39m[1m[2m   54.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-Dt_CVL1l.js              [39m[1m[2m   71.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m  129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m  192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m  224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-CxWiGkK5.js            [39m[1m[33m  857.55 kB[39m[22m
[2mdist/[22m[2massets/[22m[36mindex-Dk1EBvjx.js                     [39m[1m[33m1,471.61 kB[39m[22m
[33m
(!) Some chunks are larger than 600 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 4.06s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (1810 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 1819 pages rendered + 23 redirects written (117.00 MB total) in 9.17s.
SEO artifact checks passed: 1842 HTML files, 1810 sitemap URLs, canonical origin https://agraskbagheltourandtravels.com.

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
[2mdist/[22m[2massets/[22m[35mindex-D8exf5AQ.css                     [39m[1m[2m 58.47 kB[22m[1m[22m[2m │ gzip: 10.89 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-BBOo7Viy.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-DxGhRKKj.js                [39m[1m[2m  1.37 kB[22m[1m[22m[2m │ gzip:  0.55 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-XiXa2Fo-.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-JUHUW31j.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-CdMKUFqJ.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-BEW3vyWv.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-Da7Wf8CU.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-h1xRjfWC.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-DSHI4OGH.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-DVnBvouV.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-vVzZpVjo.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  3.00 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-CAwS-Pv1.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-DU5revmF.js         [39m[1m[2m  9.13 kB[22m[1m[22m[2m │ gzip:  2.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-B0dAruly.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-DV5ky0O-.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.70 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-DzTOEOwX.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-wsD2A6gA.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.81 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-dxWlVDFl.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-BOigywEP.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-Bh8WXVaU.js               [39m[1m[2m 22.86 kB[22m[1m[22m[2m │ gzip:  6.70 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-oKFyqpFD.js           [39m[1m[2m 25.44 kB[22m[1m[22m[2m │ gzip:  7.74 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-B6SpOP3T.js              [39m[1m[2m 27.55 kB[22m[1m[22m[2m │ gzip:  9.41 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-DnoW_iX2.js                [39m[1m[2m 28.78 kB[22m[1m[22m[2m │ gzip:  8.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-DKbRS9TZ.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-B5EBkSgv.js                [39m[1m[2m 42.91 kB[22m[1m[22m[2m │ gzip: 15.09 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-Bj7SCSeC.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Oh0PCTUB.js               [39m[1m[2m221.81 kB[22m[1m[22m[2m │ gzip: 69.00 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-BHs_FmaP.js                      [39m[1m[2m328.80 kB[22m[1m[22m[2m │ gzip: 89.91 kB[22m
[32m✓ built in 3.43s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
