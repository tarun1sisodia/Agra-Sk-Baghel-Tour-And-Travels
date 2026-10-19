# Main branch verification — 5b655e1c93af

- **Result:** PASS
- **Commit:** [5b655e1c93afd113dc2286cb0ce9ef3626519b0e](https://github.com/tarun1sisodia/ArenaAI/commit/5b655e1c93afd113dc2286cb0ce9ef3626519b0e)
- **Checked at:** 2026-10-19T17:08:52Z
- **Workflow run:** [39291267238](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39291267238)

## Changed files

- M	backend/src/modules/fares/catalog.data.json
- M	backend/src/modules/publishing/publication-worker.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	docs/project/04_PROGRESS_TRACKER.md
- M	react/package.json
- M	react/public/_headers
- A	react/public/release.json
- M	react/public/routes-manifest.json
- M	react/scripts/build-manifest.ts
- A	react/scripts/generate-release.ts
- M	react/src/app/App.tsx
- M	react/src/app/ServerApp.tsx
- M	react/src/components/chrome/Header.tsx
- M	react/src/components/chrome/ThemeToggle.tsx
- M	react/src/components/home/FleetSection.tsx
- M	react/src/data/generated-catalog.json
- M	react/src/layouts/SiteLayout.tsx
- M	react/src/main.tsx

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.19345ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (4.954044ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 186.544084

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (1.034931ms)
  ✔ normalizes a trailing slash (0.183362ms)
  ✔ rejects preview hosts in release mode (0.457283ms)
  ✔ requires HTTPS for non-local origins (0.222575ms)
  ✔ allows HTTPS preview origins (0.202448ms)
  ✔ permits HTTP only on loopback in development (0.218097ms)
  ✔ rejects paths and credentials (0.252642ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.2413ms)
✔ canonical site origin (4.488315ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 115.007498
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts && node --experimental-strip-types scripts/generate-release.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (1840 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 1840 typed routes.
✅ [Manifest Builder] Snapshotted 890 published catalog items for SSG.
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
[2mdist/[22m[2massets/[22m[35mindex-C7pWO9bB.css                    [39m[1m[2m  372.03 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m    0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m    0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage--aV_b50A.js  [39m[1m[2m    1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36museLocationIQ-zK51zLdb.js             [39m[1m[2m    2.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-COWMxAX4.js           [39m[1m[2m    3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-D1UCZh16.js             [39m[1m[2m    4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-B2v53Les.js     [39m[1m[2m    4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-DjvOcyB4.js              [39m[1m[2m    5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-fXbeLSB1.js          [39m[1m[2m    5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mReviewPage-BBjJa1iK.js                [39m[1m[2m    5.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-CgNOiX_0.js                 [39m[1m[2m    6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-DRskPzZq.js            [39m[1m[2m    7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m   10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-BG9pEVzI.js         [39m[1m[2m   10.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-BriE8vhx.js              [39m[1m[2m   10.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-B1gDrSuk.js            [39m[1m[2m   11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m   11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-DUXYF_BS.js                   [39m[1m[2m   12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-CgySQPMt.js             [39m[1m[2m   14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-Db_qcC__.js         [39m[1m[2m   14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-1MCoHkE2.js   [39m[1m[2m   15.85 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-BtlixeZH.js              [39m[1m[2m   16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentDetailPage-B3TOoyTR.js        [39m[1m[2m   17.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLocalPackageDetailPage-DWbmFzBA.js    [39m[1m[2m   19.63 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-CWdoWaU9.js                [39m[1m[2m   20.46 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTransferDetailPage-CMduPMMh.js        [39m[1m[2m   20.83 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-D1NYWWT7.js               [39m[1m[2m   21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-Dq6vcQyc.js           [39m[1m[2m   27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-BLLMm2at.js         [39m[1m[2m   28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-GitULId2.js                [39m[1m[2m   31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-C6mZE9FY.js         [39m[1m[2m   32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-C2Xt-sYq.js                 [39m[1m[2m   35.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-BRjAYY-D.js               [39m[1m[2m   36.62 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-CyX1qpvn.js                 [39m[1m[2m   40.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-C4rmiYFW.js                [39m[1m[2m   54.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-B1BCh20O.js              [39m[1m[2m   71.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m  129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m  192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m  224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-CdaV7Pl-.js            [39m[1m[2m  567.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-Cv2Z-cuj.js                     [39m[1m[33m1,475.95 kB[39m[22m
[33m
(!) Some chunks are larger than 600 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 4.92s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (1809 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 1818 pages rendered + 23 redirects written (117.08 MB total) in 12.91s.
SEO artifact checks passed: 1841 HTML files, 1809 sitemap URLs, canonical origin https://agraskbagheltourandtravels.com.
✅ [Release] Emitted release.json (ID: rel-1792429714717-5b655e1, SHA: 5b655e1)

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
[2mdist/[22m[2massets/[22m[35mindex-80RSRJPp.css                     [39m[1m[2m 59.52 kB[22m[1m[22m[2m │ gzip: 11.01 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-BDJVKSk-.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-Dgp1t81U.js                [39m[1m[2m  1.47 kB[22m[1m[22m[2m │ gzip:  0.57 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-B8TtYPjk.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-lGG02mwE.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-BJeXa4jj.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-8V7Vn_jj.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-Df4OLgxO.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.44 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-6qcfP80J.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-az45n1XL.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-CQqGLss2.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-vV2mgZkI.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  3.00 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-3w2VtsKu.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-BcyjUHeP.js         [39m[1m[2m  9.13 kB[22m[1m[22m[2m │ gzip:  2.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-BiUF5vVE.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-CTTluWA6.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.70 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-vPzWoO0D.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.81 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-HWhpDXxy.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-CgOm6D63.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-BHAYIoDc.js               [39m[1m[2m 23.37 kB[22m[1m[22m[2m │ gzip:  6.74 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-ClW8XOmG.js           [39m[1m[2m 25.44 kB[22m[1m[22m[2m │ gzip:  7.74 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-B6SpOP3T.js              [39m[1m[2m 27.55 kB[22m[1m[22m[2m │ gzip:  9.41 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-BYS8IsBK.js                [39m[1m[2m 28.78 kB[22m[1m[22m[2m │ gzip:  8.41 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-CgiUMMMM.js               [39m[1m[2m 36.41 kB[22m[1m[22m[2m │ gzip:  8.66 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-DKbRS9TZ.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-BuDnG3MO.js                [39m[1m[2m 42.61 kB[22m[1m[22m[2m │ gzip: 15.04 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-Bj7SCSeC.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Oh0PCTUB.js               [39m[1m[2m221.81 kB[22m[1m[22m[2m │ gzip: 69.00 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-CBxFzvXP.js                      [39m[1m[2m328.63 kB[22m[1m[22m[2m │ gzip: 89.89 kB[22m
[32m✓ built in 4.33s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
