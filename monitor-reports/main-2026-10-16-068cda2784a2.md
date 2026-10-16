# Main branch verification — 068cda2784a2

- **Result:** PASS
- **Commit:** [068cda2784a2c116b6067cc9aee7ef0991d8dfe3](https://github.com/tarun1sisodia/ArenaAI/commit/068cda2784a2c116b6067cc9aee7ef0991d8dfe3)
- **Checked at:** 2026-10-16T20:59:04Z
- **Workflow run:** [38966007420](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38966007420)

## Changed files

- M	react/scripts/catalog-fallback.test.ts
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/services/cleanFareApi.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
✔ Admin Review Mapper — Safety & Invariant Guarantees (2.374793ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.480094ms)
  ✔ preserves a valid stored tier (0.108464ms)
✔ tour package base tier form normalization (1.416177ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.91458ms)
  ✔ 2. Initial state is strictly masked and empty (1.651231ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.164088ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.331661ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.134473ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.076796ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (4.290694ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 110.941071

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.677763ms)
  ✔ normalizes a trailing slash (0.15229ms)
  ✔ rejects preview hosts in release mode (0.336607ms)
  ✔ requires HTTPS for non-local origins (0.111258ms)
  ✔ allows HTTPS preview origins (0.08596ms)
  ✔ permits HTTP only on loopback in development (0.110507ms)
  ✔ rejects paths and credentials (0.105189ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.085599ms)
✔ canonical site origin (2.7172ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78.074174
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
✅ [Manifest Builder] Snapshotted 12 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 3 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 2 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
✅ [Manifest Builder] Snapshotted 2 published local packages from https://skb-baghel-api-staging.onrender.com/api/v1/local-packages/manifest.
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
[32m✓[39m 2553 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-nD9DR1WP.css                    [39m[1m[2m370.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-B69QaG1I.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-CJNAfEXE.js           [39m[1m[2m  3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-XvDLxcsz.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-BRM9dsMy.js     [39m[1m[2m  4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-CPmVd9Z3.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-BPXzE2nU.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-DQ0KOcJH.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-C2uaBn09.js            [39m[1m[2m  7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-bO9R6wf1.js              [39m[1m[2m  9.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-BtdIkATw.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-BlsifNuD.js            [39m[1m[2m 11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-B494hdvA.js   [39m[1m[2m 11.99 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-BkQ7Fqa6.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-DTW6_K9j.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-BOHU9qZu.js         [39m[1m[2m 14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-Cjfbw3hM.js              [39m[1m[2m 16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-Cnv50Sub.js                [39m[1m[2m 19.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-DsxnDMQd.js               [39m[1m[2m 21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-D-8RsLUM.js               [39m[1m[2m 27.21 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-DPPG9S6R.js           [39m[1m[2m 27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-BIuPDp9H.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-C3DrsbmA.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-BleGWovm.js         [39m[1m[2m 32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-D3jiTAig.js                 [39m[1m[2m 32.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-6_3Gqnkq.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-DfCpOf1p.js                [39m[1m[2m 61.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-DsDTYCVe.js              [39m[1m[2m 70.40 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-C08woeLg.js                     [39m[1m[2m352.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-Cm2_ZEqa.js            [39m[1m[2m353.04 kB[22m[1m[22m
[32m✓ built in 3.14s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (64 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 73 pages rendered + 23 redirects written (4.19 MB total) in 1.73s.
SEO artifact checks passed: 95 HTML files, 64 sitemap URLs, canonical origin https://agraskbagheltourandtravels.com.

> sk-baghel-tour-travels@0.1.0 admin:build
> npm --prefix admin run build


> skb-admin@0.1.0 build
> tsc --noEmit && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2408 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                                    [39m[1m[2m  1.63 kB[22m[1m[22m[2m │ gzip:  0.63 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-BCtimMPw.css                     [39m[1m[2m 57.41 kB[22m[1m[22m[2m │ gzip: 10.74 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-D1qLPltI.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-BQNqo8Zl.js                [39m[1m[2m  1.37 kB[22m[1m[22m[2m │ gzip:  0.55 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-8aZEDxdE.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.95 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-C567LaAD.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-DITjFcO2.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-alm9Pbr9.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-CXIXoCB0.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-BitD8Ng0.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-D9ueEdxW.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-CMRKd1V4.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-BZseVR41.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  3.00 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-D_0po4Iy.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-B-bnr2MU.js         [39m[1m[2m  9.13 kB[22m[1m[22m[2m │ gzip:  2.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-Qwd0S9nC.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-D-6468oi.js                [39m[1m[2m 10.13 kB[22m[1m[22m[2m │ gzip:  3.26 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-w7-15Yqu.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.70 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-B466LgM5.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-Bvnjdbkz.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.81 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-MjPBQ_6e.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-C6hKuJsC.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-DJyoIHWi.js               [39m[1m[2m 21.89 kB[22m[1m[22m[2m │ gzip:  6.54 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-hzDR_8n0.js              [39m[1m[2m 25.23 kB[22m[1m[22m[2m │ gzip:  8.69 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-CdMFbX8y.js           [39m[1m[2m 25.44 kB[22m[1m[22m[2m │ gzip:  7.74 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-0odwmV-n.js                [39m[1m[2m 28.77 kB[22m[1m[22m[2m │ gzip:  8.40 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-BUt5Kqbj.js                      [39m[1m[2m325.61 kB[22m[1m[22m[2m │ gzip: 89.40 kB[22m
[32m✓ built in 2.67s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
