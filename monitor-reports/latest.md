# Main branch verification — 9e7acff8f28a

- **Result:** PASS
- **Commit:** [9e7acff8f28a9380e0cd4459f499b1055fa1256d](https://github.com/tarun1sisodia/ArenaAI/commit/9e7acff8f28a9380e0cd4459f499b1055fa1256d)
- **Checked at:** 2026-10-15T16:10:46Z
- **Workflow run:** [38766552428](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38766552428)

## Changed files

- M	admin/package.json
- M	admin/src/lib/api.ts
- M	admin/src/modules/bookings/bookings.api.ts
- M	admin/src/pages/BookingsPage.tsx
- A	admin/src/pages/bookingsUnmaskHelper.test.ts
- A	admin/src/pages/bookingsUnmaskHelper.ts
- M	backend/src/modules/admin/admin.controller.ts
- M	backend/src/modules/admin/admin.routes.ts
- M	backend/src/modules/admin/admin.service.ts
- A	backend/tests/unit/admin-unmask.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
  ✔ preserves is_verified: true when server indicates verified review (0.865795ms)
  ✔ preserves is_verified: false when server review is unverified (0.178853ms)
  ✔ never infers verification from booking_id, status, or social media links (0.175477ms)
  ✔ safely handles null/missing fields and clamps ratings to 1..5 range (0.20386ms)
✔ ReviewsMarquee — is_verified mapper & badge preservation (2.860936ms)
ℹ tests 21
ℹ suites 4
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 281.884789

> skb-admin@0.1.0 test
> node --experimental-strip-types --test src/lib/reviewMapper.test.ts src/pages/bookingsUnmaskHelper.test.ts

▶ Admin Review Mapper — Safety & Invariant Guarantees
  ✔ defaults missing or unknown public consent to false (1.364105ms)
  ✔ never synthesizes ticket IDs from UUIDs; falls back to 'No Ticket' (0.252992ms)
  ✔ preserves genuine ticket_id or booking_ticket_id when present (0.240909ms)
✔ Admin Review Mapper — Safety & Invariant Guarantees (7.627137ms)
▶ Admin Booking Unmask PII Frontend State & Security Suite
  ✔ 1. Verifies role permission matrix for 'bookings:unmask' (2.183453ms)
  ✔ 2. Initial state is strictly masked and empty (0.602474ms)
  ✔ 3. startUnmasking sets loading flag and clears previous errors (0.177662ms)
  ✔ 4. Successful unmask response applies unmasked data and sets unmasked=true (0.569483ms)
  ✔ 5. Failure handling retains masked state, leaves unmaskedData null, and records error (0.252682ms)
  ✔ 6. Reset behavior clears unmasked data and returns to masked state (0.226663ms)
✔ Admin Booking Unmask PII Frontend State & Security Suite (5.883635ms)
ℹ tests 9
ℹ suites 2
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 147.490047

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
[33mnode_modules/zod/v4/core/util.js (400:0): A comment

"// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle."

in "node_modules/zod/v4/core/util.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[33mnode_modules/zod/v4/core/regexes.js (74:0): A comment

"/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */"

in "node_modules/zod/v4/core/regexes.js" contains an annotation that Rollup cannot interpret due to the position of the comment. The comment will be removed to avoid issues.[39m
[32m✓[39m 2551 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-CjMcS682.css                    [39m[1m[2m381.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mprices-CuO5rt3Z.js                    [39m[1m[2m  0.25 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mfleets-Bm1BgLTI.js                    [39m[1m[2m  0.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mrazorpay-D3zIqEa0.js                  [39m[1m[2m  0.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvehicle-tiers-Bhu6VwvC.js             [39m[1m[2m  0.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-DFMpwP2Y.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mcustomerAuthApi-Dr36uAVW.js           [39m[1m[2m  3.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-CfrqpXJm.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-DegdU0FN.js     [39m[1m[2m  4.55 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-C-jF_Z_l.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-DANhFkv1.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-BNA-G5R5.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-Bg78Jbc8.js                [39m[1m[2m  6.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-CvL06Dq2.js            [39m[1m[2m  7.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons--spl11uJ.js              [39m[1m[2m  8.03 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-Cucjddr3.js         [39m[1m[2m 10.33 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-C3trFZed.js            [39m[1m[2m 11.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingConfirmationPage-BekBXPXh.js   [39m[1m[2m 11.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-DcT7-h3V.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-Cg53cuvP.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mProductDetailPage-BXa-_Iga.js         [39m[1m[2m 14.18 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-sGdC79PJ.js              [39m[1m[2m 16.91 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-DRbDJ5EP.js               [39m[1m[2m 21.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-DoRsqq5S.js               [39m[1m[2m 25.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-BXI_WetB.js           [39m[1m[2m 27.43 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-BeKzouPt.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-DAYTBdV9.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-TAYbpGLd.js         [39m[1m[2m 32.12 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage--HxcpPGO.js                 [39m[1m[2m 32.77 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-Bzveh2MA.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-COAWWfi_.js                [39m[1m[2m 60.89 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-B3uDDpKH.js              [39m[1m[2m 70.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-T3eR97Ln.js             [39m[1m[2m129.66 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-CCpWhkOr.js            [39m[1m[2m349.46 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-fuVgT_4q.js                     [39m[1m[2m350.51 kB[22m[1m[22m
[32m✓ built in 4.44s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (50 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://skbagheltravels-customer.coccoder999.workers.dev/sitemap.xml
✅ SSG Pre-Rendering Complete: 59 pages rendered + 14 redirects written (3.34 MB total) in 2.73s.

> sk-baghel-tour-travels@0.1.0 admin:build
> npm --prefix admin run build


> skb-admin@0.1.0 build
> tsc --noEmit && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2408 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                                    [39m[1m[2m  1.63 kB[22m[1m[22m[2m │ gzip:  0.62 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-Bd2tgWBH.css                     [39m[1m[2m 57.39 kB[22m[1m[22m[2m │ gzip: 10.74 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-BumDm7A1.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-CozOCNZU.js                [39m[1m[2m  1.37 kB[22m[1m[22m[2m │ gzip:  0.55 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-DG3OAu3h.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mcleanAdminApi-CeJHLf_6.js              [39m[1m[2m  2.35 kB[22m[1m[22m[2m │ gzip:  0.60 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-ZATLL0th.js  [39m[1m[2m  2.65 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mCanonicalFleetPricingGrid-C_p0Z69y.js  [39m[1m[2m  5.42 kB[22m[1m[22m[2m │ gzip:  2.00 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-CWa_13W3.js         [39m[1m[2m  6.14 kB[22m[1m[22m[2m │ gzip:  2.22 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-C4bbsgeO.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mPublishingPage-C2RHUjmr.js             [39m[1m[2m  6.57 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-DSsv0gUh.js                  [39m[1m[2m  7.00 kB[22m[1m[22m[2m │ gzip:  2.40 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-B1TQgvZ_.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mRoundTripRatesPage-Af-6UOF9.js         [39m[1m[2m  8.76 kB[22m[1m[22m[2m │ gzip:  2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mFareSettingsPage--cjztNX5.js           [39m[1m[2m  8.98 kB[22m[1m[22m[2m │ gzip:  2.98 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-CD2K5mNL.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-ZrEAImfn.js                [39m[1m[2m 10.13 kB[22m[1m[22m[2m │ gzip:  3.26 kB[22m
[2mdist/[22m[2massets/[22m[36mExtraChargesPage-DmDlyeP7.js           [39m[1m[2m 13.91 kB[22m[1m[22m[2m │ gzip:  3.69 kB[22m
[2mdist/[22m[2massets/[22m[36mVehiclesPage-C78mR_Bl.js               [39m[1m[2m 14.40 kB[22m[1m[22m[2m │ gzip:  3.68 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-Bm_LWNmK.js                 [39m[1m[2m 16.20 kB[22m[1m[22m[2m │ gzip:  4.80 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-DfDkVZgz.js         [39m[1m[2m 18.75 kB[22m[1m[22m[2m │ gzip:  4.69 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-BMSnCljR.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-ChcJrIOA.js               [39m[1m[2m 21.89 kB[22m[1m[22m[2m │ gzip:  6.54 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-Dti7r3zG.js              [39m[1m[2m 24.58 kB[22m[1m[22m[2m │ gzip:  8.55 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-Bh8iR5iS.js           [39m[1m[2m 24.63 kB[22m[1m[22m[2m │ gzip:  7.54 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-DIpKCep6.js                [39m[1m[2m 28.57 kB[22m[1m[22m[2m │ gzip:  8.36 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-BqvMvTCv.js                      [39m[1m[2m325.41 kB[22m[1m[22m[2m │ gzip: 89.34 kB[22m
[32m✓ built in 4.06s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
