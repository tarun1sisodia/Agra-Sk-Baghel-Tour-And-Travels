# Main branch verification — 0616865b8023

- **Result:** PASS
- **Commit:** [0616865b8023e1da96b1f03845b022ce7e0dced4](https://github.com/tarun1sisodia/ArenaAI/commit/0616865b8023e1da96b1f03845b022ce7e0dced4)
- **Checked at:** 2026-10-16T18:42:59Z
- **Workflow run:** [38949307248](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38949307248)

## Changed files

- M	backend/tests/unit/bookings-payments.test.ts
- M	backend/tests/unit/property-matrix.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
✔ Admin Review Mapper — Safety & Invariant Guarantees (1.99187ms)
▶ tour package base tier form normalization
  ✔ uses the form's established default when the API returns null or undefined (0.497954ms)
  ✔ preserves a valid stored tier (0.118768ms)
✔ tour package base tier form normalization (1.58398ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (0.586478ms)
  ✔ 2. Initial state is strictly masked and empty (1.244722ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.178918ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.402522ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.166519ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.116284ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (3.718111ms)
ℹ tests 11
ℹ suites 3
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 111.762747

> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types --test scripts/site-origin.test.ts && node --experimental-strip-types scripts/test-seo-lifecycle.ts

▶ canonical site origin
  ✔ uses the approved production origin when no local override is supplied (0.51476ms)
  ✔ normalizes a trailing slash (0.12744ms)
  ✔ rejects preview hosts in release mode (0.255523ms)
  ✔ requires HTTPS for non-local origins (0.077856ms)
  ✔ allows HTTPS preview origins (0.068252ms)
  ✔ permits HTTP only on loopback in development (0.082874ms)
  ✔ rejects paths and credentials (0.087361ms)
  ✔ keeps Hindi indexing disabled unless explicitly enabled (0.105968ms)
✔ canonical site origin (2.130287ms)
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 69.424767
SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> node --experimental-strip-types scripts/validate-site-config.ts && tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts && node --experimental-strip-types scripts/validate-seo-artifacts.ts

Site origin validated: https://agraskbagheltourandtravels.com (production).
✅ [Manifest Builder] Merged published admin route catalog from https://skb-baghel-api-staging.onrender.com/api/v1/route-catalog/manifest.
✅ [Manifest Builder] Emitted public/routes-manifest.json (971 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 971 typed routes.
✅ [Manifest Builder] Snapshotted 10 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 2 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
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
[32m✓[39m 2552 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-B-gruvXH.css                    [39m[1m[2m369.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-rakN5_k8.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-C78k90UL.js           [39m[1m[2m  3.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-Cqeu8Op6.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-DacNg6nQ.js     [39m[1m[2m  4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-DirXABD0.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-WmGNDypO.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-CUqvQgMs.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-Y5mT_L5K.js            [39m[1m[2m  7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-bO9R6wf1.js              [39m[1m[2m  9.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-CcqtRmO0.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-CWgmYiQb.js            [39m[1m[2m 11.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-CHJmirFN.js   [39m[1m[2m 11.99 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-CxX3fHGG.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-BthzSdFV.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-D1GNFJ6u.js         [39m[1m[2m 14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-Z6fnaKY9.js              [39m[1m[2m 16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-B4BmbHkw.js                [39m[1m[2m 19.11 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-BT8Knul6.js               [39m[1m[2m 21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-DeXsmJCm.js               [39m[1m[2m 26.09 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-CLdAdQUq.js           [39m[1m[2m 27.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-LSnZtKeJ.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-C3DrsbmA.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-7Kl-U-dx.js         [39m[1m[2m 32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-DWXGP8l4.js                 [39m[1m[2m 32.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-BNGjrKSB.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-BxqUtg4Q.js                [39m[1m[2m 61.28 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-B182VPxS.js              [39m[1m[2m 70.40 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-Bw_6fIfN.js                     [39m[1m[2m348.39 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-DcsifvFL.js            [39m[1m[2m352.00 kB[22m[1m[22m
[32m✓ built in 2.93s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (62 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 71 pages rendered + 23 redirects written (4.05 MB total) in 1.68s.
SEO artifact checks passed: 93 HTML files, 62 sitemap URLs, canonical origin https://agraskbagheltourandtravels.com.

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
[2mdist/[22m[2massets/[22m[35mindex-Bd2tgWBH.css                     [39m[1m[2m 57.39 kB[22m[1m[22m[2m │ gzip: 10.74 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-Duf2LHHe.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-D9joLPDp.js                [39m[1m[2m  1.37 kB[22m[1m[22m[2m │ gzip:  0.55 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-Bf8O28kh.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-B5RxjkGi.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-CIjvwSuT.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-IoGzLhxG.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-BczHt_86.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-D2NfTFz3.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.06 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-Bst0qkAF.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-B6sB-BfQ.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-CF5XDBxI.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage-mDuAgQur.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.98 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-DiDsUMJk.js         [39m[1m[2m  9.13 kB[22m[1m[22m[2m │ gzip:  2.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-BvW6IhEd.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-B-6avaTi.js                [39m[1m[2m 10.13 kB[22m[1m[22m[2m │ gzip:  3.26 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-DzcYxewl.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.69 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-BctCAVJ6.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-BHgh1clm.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.80 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-Dz1ZOaPK.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-m59lgh_J.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-WfAi4hrP.js               [39m[1m[2m 21.89 kB[22m[1m[22m[2m │ gzip:  6.54 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-BCq2-toh.js              [39m[1m[2m 24.83 kB[22m[1m[22m[2m │ gzip:  8.57 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-BKabyLtD.js           [39m[1m[2m 25.36 kB[22m[1m[22m[2m │ gzip:  7.69 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-CRCrvSC6.js                [39m[1m[2m 28.77 kB[22m[1m[22m[2m │ gzip:  8.40 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-Zzkm9S0J.js                      [39m[1m[2m325.48 kB[22m[1m[22m[2m │ gzip: 89.37 kB[22m
[32m✓ built in 2.52s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
