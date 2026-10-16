# Main branch verification — cc9684f70aeb

- **Result:** PASS
- **Commit:** [cc9684f70aebc93b372de202779bd36a640f715b](https://github.com/tarun1sisodia/ArenaAI/commit/cc9684f70aebc93b372de202779bd36a640f715b)
- **Checked at:** 2026-10-16T20:26:13Z
- **Workflow run:** [38962010420](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38962010420)

## Changed files

- M	backend/tests/unit/publication-worker.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
✔ Admin Review Mapper — Safety & Invariant Guarantees (4.258829ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (1.086212ms)
  ✔ preserves a valid stored tier (0.265376ms)
✔ tour package base tier form normalization (3.484921ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (1.297458ms)
  ✔ 2. Initial state is strictly masked and empty (1.651049ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.301495ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.735425ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.29888ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.318256ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (6.61093ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 181.053036

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (1.033253ms)
  ✔ normalizes a trailing slash (0.210584ms)
  ✔ rejects preview hosts in release mode (0.45391ms)
  ✔ requires HTTPS for non-local origins (0.195295ms)
  ✔ allows HTTPS preview origins (0.200565ms)
  ✔ permits HTTP only on loopback in development (0.217518ms)
  ✔ rejects paths and credentials (0.28293ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.233527ms)
✔ canonical site origin (4.577154ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 123.60198
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
[2mdist/[22m[2massets/[22m[35mindex-B-gruvXH.css                    [39m[1m[2m369.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-rja1mjmB.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-mU_LK35N.js           [39m[1m[2m  3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-XvDLxcsz.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-BNDhzma4.js     [39m[1m[2m  4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-KCvlbK_M.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-CsUNaUmL.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-BEf84ayc.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-BIrkN_Sk.js            [39m[1m[2m  7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-bO9R6wf1.js              [39m[1m[2m  9.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-TSoASKnC.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-ojFLWtYS.js            [39m[1m[2m 11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-DHwb4Rno.js   [39m[1m[2m 11.99 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-DBLzlonf.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-Bc2_gDzx.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-y172J0vq.js         [39m[1m[2m 14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-CePj3UVX.js              [39m[1m[2m 16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-C1qlqcxQ.js                [39m[1m[2m 19.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-FOB7CLaY.js               [39m[1m[2m 21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-Bryg4Noe.js               [39m[1m[2m 26.09 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-Cat_xC1A.js           [39m[1m[2m 27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-DrK71CgG.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-C3DrsbmA.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-CMy4WqKJ.js         [39m[1m[2m 32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-_lmjGBW2.js                 [39m[1m[2m 32.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-B6UX9rXo.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-DT7DrY88.js                [39m[1m[2m 61.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-mzlNr51D.js              [39m[1m[2m 70.40 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-tvZwIIfH.js                     [39m[1m[2m352.30 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-Cm2_ZEqa.js            [39m[1m[2m353.04 kB[22m[1m[22m
[32m✓ built in 4.49s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (64 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 73 pages rendered + 23 redirects written (4.19 MB total) in 2.94s.
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
[32m✓ built in 4.00s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
