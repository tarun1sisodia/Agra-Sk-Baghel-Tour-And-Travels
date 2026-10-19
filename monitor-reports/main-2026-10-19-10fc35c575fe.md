# Main branch verification — 10fc35c575fe

- **Result:** PASS
- **Commit:** [10fc35c575fe8d883e97ede936f79d4f57d9e106](https://github.com/tarun1sisodia/ArenaAI/commit/10fc35c575fe8d883e97ede936f79d4f57d9e106)
- **Checked at:** 2026-10-19T09:43:08Z
- **Workflow run:** [39231874083](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39231874083)

## Changed files

- A	backend/src/modules/bookings/booking-pdf.service.ts
- A	backend/src/modules/bookings/booking-pdf.template.ts
- M	backend/src/modules/bookings/bookings.routes.ts
- M	backend/src/modules/payments/payments.service.ts
- A	backend/tests/unit/booking-pdf.service.test.ts
- M	backend/tests/unit/bookings-payments.test.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- M	react/src/pages/BookingConfirmationPage.tsx
- M	react/src/services/cleanFareApi.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.26343ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.166298ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (6.068772ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 166.443933

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.901698ms)
  ✔ normalizes a trailing slash (0.235377ms)
  ✔ rejects preview hosts in release mode (0.43222ms)
  ✔ requires HTTPS for non-local origins (0.144411ms)
  ✔ allows HTTPS preview origins (0.190286ms)
  ✔ permits HTTP only on loopback in development (0.171037ms)
  ✔ rejects paths and credentials (0.167085ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.177416ms)
✔ canonical site origin (3.846825ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 116.842478
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
[33mnode_modules/zod/v4/core/regexes.js (74:0): A comment

"/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */"

in "node_modules/zod/v4/core/regexes.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[33mnode_modules/zod/v4/core/util.js (400:0): A comment

"// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle."

in "node_modules/zod/v4/core/util.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[32m✓[39m 2560 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m    4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-DHCEWLuS.css                    [39m[1m[2m  371.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m    0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m    0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-CdB1eW8o.js  [39m[1m[2m    1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36museLocationIQ-D3Oi64p4.js             [39m[1m[2m    2.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-DV-P5IX1.js           [39m[1m[2m    3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-I8w8tDqR.js             [39m[1m[2m    4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-CIcRsett.js     [39m[1m[2m    4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-CyE6BkY6.js              [39m[1m[2m    5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-By0jLwAV.js          [39m[1m[2m    5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mReviewPage-D9c7BU3z.js                [39m[1m[2m    5.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-DnUa7Ccd.js                 [39m[1m[2m    6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-D650kbSz.js            [39m[1m[2m    7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m   10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-DGHyZtwF.js         [39m[1m[2m   10.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-BriE8vhx.js              [39m[1m[2m   10.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-CKj6NCRM.js            [39m[1m[2m   11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m   11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-Dzo81Bd3.js                   [39m[1m[2m   12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-BgvWGNI6.js             [39m[1m[2m   14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-RJi0RkhZ.js         [39m[1m[2m   14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-DA4-A-It.js   [39m[1m[2m   15.89 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-CdrMs_mv.js              [39m[1m[2m   16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentDetailPage-BQki8juN.js        [39m[1m[2m   17.36 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-LJTSVr5w.js                [39m[1m[2m   19.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLocalPackageDetailPage-C_gRCu1b.js    [39m[1m[2m   19.63 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTransferDetailPage-DdFF7Nog.js        [39m[1m[2m   20.83 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-DybHdOlb.js               [39m[1m[2m   21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-B8iqbzXs.js           [39m[1m[2m   27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-CdfxSNvq.js         [39m[1m[2m   28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-GitULId2.js                [39m[1m[2m   31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-BY19X0ea.js         [39m[1m[2m   32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-CR8pypSV.js                 [39m[1m[2m   33.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-BODFZYyF.js                 [39m[1m[2m   35.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-zmIDGfBz.js               [39m[1m[2m   36.62 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-BgwfsLHV.js                [39m[1m[2m   54.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-CzuEoWf8.js              [39m[1m[2m   71.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m  129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m  192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m  224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-BXPcppCk.js            [39m[1m[33m  857.56 kB[39m[22m
[2mdist/[22m[2massets/[22m[36mindex-CJbKnaLW.js                     [39m[1m[33m1,473.52 kB[39m[22m
[33m
(!) Some chunks are larger than 600 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 4.50s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (1810 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 1819 pages rendered + 23 redirects written (117.00 MB total) in 11.77s.
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
[2mdist/[22m[2massets/[22m[36mTable-M_2e6lrZ.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-CP5uhow5.js                [39m[1m[2m  1.47 kB[22m[1m[22m[2m │ gzip:  0.57 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-7083mFEk.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.95 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-UO2twhro.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-Cv_ZMCOW.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-DC7X34XG.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-CX0Xp9T9.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-xeUwBWX7.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-CzdbfdR1.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-wtkL3Ixa.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-C89Lw-G5.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  3.00 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-BUf-SFKe.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-BwvpyVoJ.js         [39m[1m[2m  9.13 kB[22m[1m[22m[2m │ gzip:  2.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-BCc93abu.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-B9d-EUrK.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.70 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-BCRGfb67.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-c630Zls6.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.81 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-B7o7Fw0u.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-DWuu5Zrl.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-pQeOvBpu.js               [39m[1m[2m 23.37 kB[22m[1m[22m[2m │ gzip:  6.74 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-DV53q3Q2.js           [39m[1m[2m 25.44 kB[22m[1m[22m[2m │ gzip:  7.74 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-B6SpOP3T.js              [39m[1m[2m 27.55 kB[22m[1m[22m[2m │ gzip:  9.41 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-Dtwm1mOu.js                [39m[1m[2m 28.78 kB[22m[1m[22m[2m │ gzip:  8.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-DKbRS9TZ.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-C51bk3sU.js                [39m[1m[2m 42.91 kB[22m[1m[22m[2m │ gzip: 15.09 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-Bj7SCSeC.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Oh0PCTUB.js               [39m[1m[2m221.81 kB[22m[1m[22m[2m │ gzip: 69.00 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-PYUwuZuI.js                      [39m[1m[2m328.61 kB[22m[1m[22m[2m │ gzip: 89.86 kB[22m
[32m✓ built in 3.75s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
