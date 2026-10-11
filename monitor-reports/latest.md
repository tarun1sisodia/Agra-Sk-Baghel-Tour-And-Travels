# Main branch verification — fe2487c19d43

- **Result:** PASS
- **Commit:** [fe2487c19d43ebfa7d3c376b359f2a9d69d983ae](https://github.com/tarun1sisodia/ArenaAI/commit/fe2487c19d43ebfa7d3c376b359f2a9d69d983ae)
- **Checked at:** 2026-10-11T01:38:59Z
- **Workflow run:** [38102455646](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38102455646)

## Changed files

- M	admin/package-lock.json
- M	admin/package.json
- A	admin/src/contracts/fare-system.ts
- M	admin/src/contracts/index.ts
- A	backend/migrations/0038_fare_system_clean_rebuild.sql
- A	backend/migrations/0039_fare_system_seeds.sql
- M	backend/src/app.ts
- A	backend/src/contracts/fare-system.ts
- M	backend/src/contracts/index.ts
- M	backend/src/db/migrate.ts
- M	backend/src/db/postgres.ts
- M	backend/src/db/types.ts
- M	backend/src/middlewares/roleGuard.ts
- A	backend/src/modules/admin/fare-admin.repository.ts
- A	backend/src/modules/admin/fare-admin.routes.ts
- A	backend/src/modules/admin/fare-admin.service.ts
- A	backend/src/modules/bookings/bookings.repository.ts
- A	backend/src/modules/bookings/bookings.routes.ts
- A	backend/src/modules/bookings/bookings.service.ts
- A	backend/src/modules/fare-catalog/fare-catalog.repository.ts
- A	backend/src/modules/fare-engine/calculators/fixed-product.ts
- A	backend/src/modules/fare-engine/calculators/one-way.ts
- A	backend/src/modules/fare-engine/calculators/round-trip.ts
- A	backend/src/modules/fare-engine/datetime.ts
- A	backend/src/modules/fare-engine/extra-charges.ts
- A	backend/src/modules/fare-engine/finalizer.ts
- A	backend/src/modules/fare-engine/index.ts
- A	backend/src/modules/fare-engine/rounding.ts
- A	backend/src/modules/payments/payments.repository.ts
- A	backend/src/modules/payments/payments.routes.ts
- A	backend/src/modules/payments/payments.service.ts
- A	backend/src/modules/quotes/quotes.routes.ts
- A	backend/src/modules/quotes/quotes.service.ts
- A	backend/src/modules/reviews/reviews.repository.ts
- A	backend/src/modules/reviews/reviews.routes.ts
- A	backend/src/modules/reviews/reviews.service.ts
- A	backend/src/modules/routes/locationiq.service.ts
- M	backend/src/types/domain.ts
- A	backend/tests/fixtures/fare-fixture.ts
- A	backend/tests/unit/admin-fare.test.ts
- A	backend/tests/unit/bookings-payments.test.ts
- A	backend/tests/unit/fare-engine.test.ts
- A	backend/tests/unit/locationiq.service.test.ts
- A	backend/tests/unit/property-matrix.test.ts
- A	backend/tests/unit/quotes.service.test.ts
- A	backend/tests/unit/reviews-engine.test.ts
- A	contracts/fare-system.ts
- M	contracts/index.ts
- M	docs/agent/02_CHANGE_LEDGER.md
- A	fare-system-final-spec.md
- M	package-lock.json
- M	package.json
- M	react/package-lock.json
- M	react/package.json
- M	react/scripts/generate-sitemap.ts
- A	react/src/contracts/fare-system.ts
- M	react/src/contracts/index.ts
- M	react/src/pages/LivePackageDetailPage.tsx
- A	react/src/services/fareApi.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
> tsc --noEmit


> sk-baghel-tour-travels@0.1.0 admin:typecheck
> npm --prefix admin run typecheck


> skb-admin@0.1.0 typecheck
> tsc --noEmit


> sk-baghel-tour-travels@0.1.0 backend:typecheck
> npm --prefix backend run typecheck


> @sk-baghel/backend@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit


> sk-baghel-tour-travels@0.1.0 test
> npm --prefix backend run test:ci && npm --prefix react run test:catalog-sources


> @sk-baghel/backend@0.1.0 test:ci
> vitest run --passWithNoTests --exclude tests/integration/db-connection.test.ts --exclude tests/integration/db-indexes.test.ts


[1m[46m RUN [49m[22m [36mv3.2.7 [39m[90m/home/runner/work/ArenaAI/ArenaAI/backend[39m

 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m18 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 41[2mms[22m[39m
 [32m✓[39m tests/unit/reviews-engine.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m7 passed[39m[22m[90m (7)[39m
[2m      Tests [22m [1m[32m171 passed[39m[22m[90m (171)[39m
[2m   Start at [22m 01:38:25
[2m   Duration [22m 1.79s[2m (transform 241ms, setup 0ms, collect 404ms, tests 133ms, environment 1ms, prepare 397ms)[22m


> skb-react@0.1.0 test:catalog-sources
> node --experimental-strip-types --test scripts/catalog-sources.test.ts

▶ catalog source resolution (P0-T03 / P0-T04)
  ✔ does not default missing production variables to the staging API (1.350129ms)
  ✔ derives the implemented content manifest path from the API base (0.276786ms)
  ✔ prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback (0.222605ms)
✔ catalog source resolution (P0-T03 / P0-T04) (3.210631ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 116.755224

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
[32m✓[39m 2043 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  4.42 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-Bx8JDO4k.css                    [39m[1m[2m375.51 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mprices-CuO5rt3Z.js                    [39m[1m[2m  0.25 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mfleets-Bm1BgLTI.js                    [39m[1m[2m  0.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-Rxu6vL2x.js  [39m[1m[2m  1.07 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-C2nIWpPW.js              [39m[1m[2m  3.64 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mbookingIntentStorage-CgyW4GZy.js      [39m[1m[2m  4.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMonumentsPage-B1x9cUg0.js             [39m[1m[2m  4.13 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-BibZuEC-.js     [39m[1m[2m  4.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-I6cJOXKi.js              [39m[1m[2m  5.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-B8x7b6bo.js          [39m[1m[2m  5.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mLoginPage-BkE9F1Bi.js                 [39m[1m[2m  6.27 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-Bs7UoXd2.js                [39m[1m[2m  6.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-ByTnDWcS.js            [39m[1m[2m  7.08 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-DxHxipiP.js         [39m[1m[2m 10.83 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-Cbvzz8iv.js            [39m[1m[2m 11.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-DRMZtxIL.js               [39m[1m[2m 11.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-Di3wbO8i.js                   [39m[1m[2m 12.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-CluAmVjq.js              [39m[1m[2m 13.88 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-DRqXveja.js             [39m[1m[2m 14.16 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-qJOiUPAO.js           [39m[1m[2m 27.08 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-DGPLlLgD.js         [39m[1m[2m 28.65 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-DSTXGwuO.js                 [39m[1m[2m 29.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-CXwwh4HK.js         [39m[1m[2m 31.62 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-CpGKpyMA.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-DbMoenEu.js                 [39m[1m[2m 35.57 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-8TZEl6Ee.js                [39m[1m[2m 46.24 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-Ukb9juDI.js               [39m[1m[2m 68.15 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-xN-MW9O7.js              [39m[1m[2m 70.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-DaueY-7D.js           [39m[1m[2m224.50 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-Oy0djS1j.js                     [39m[1m[2m239.04 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-YjuurHFu.js            [39m[1m[2m352.50 kB[22m[1m[22m
[32m✓ built in 3.52s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (50 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://skbagheltravels-customer.coccoder999.workers.dev/sitemap.xml
✅ SSG Pre-Rendering Complete: 59 pages rendered + 14 redirects written (3.67 MB total) in 2.43s.

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
[2mdist/[22m[2massets/[22m[35mindex-YUYo-3ie.css                     [39m[1m[2m 53.77 kB[22m[1m[22m[2m │ gzip: 10.14 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-_25QT0vf.js                      [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-BEwHdHQL.js                [39m[1m[2m  1.32 kB[22m[1m[22m[2m │ gzip:  0.54 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-CzIz312O.js                     [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.94 kB[22m
[2mdist/[22m[2massets/[22m[36mFleetPricingGrid-Cug_ywRk.js           [39m[1m[2m  2.30 kB[22m[1m[22m[2m │ gzip:  1.00 kB[22m
[2mdist/[22m[2massets/[22m[36mLocationAutocompleteInput-CzU8sLyy.js  [39m[1m[2m  2.66 kB[22m[1m[22m[2m │ gzip:  1.16 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-Dvv0w2JN.js                  [39m[1m[2m  4.59 kB[22m[1m[22m[2m │ gzip:  1.86 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-D0o80g8W.js         [39m[1m[2m  6.14 kB[22m[1m[22m[2m │ gzip:  2.22 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-G3-K1RJB.js                [39m[1m[2m  6.19 kB[22m[1m[22m[2m │ gzip:  2.34 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-B1JALzbh.js                [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-mWZL6ySB.js              [39m[1m[2m  7.14 kB[22m[1m[22m[2m │ gzip:  2.59 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-CnlWfu9E.js                [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPromosPage-GzJWYkag.js                 [39m[1m[2m 11.99 kB[22m[1m[22m[2m │ gzip:  3.43 kB[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-DWBg8P4g.js                 [39m[1m[2m 12.62 kB[22m[1m[22m[2m │ gzip:  4.07 kB[22m
[2mdist/[22m[2massets/[22m[36mFaresPage-C2QO8Y24.js                  [39m[1m[2m 12.76 kB[22m[1m[22m[2m │ gzip:  4.21 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-DVuCc2La.js         [39m[1m[2m 18.29 kB[22m[1m[22m[2m │ gzip:  4.66 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-DC6sw4d9.js               [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.45 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-L5AthfVv.js               [39m[1m[2m 20.99 kB[22m[1m[22m[2m │ gzip:  6.29 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-B9d1NrNI.js              [39m[1m[2m 23.29 kB[22m[1m[22m[2m │ gzip:  8.11 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-CQJbAzlF.js           [39m[1m[2m 24.52 kB[22m[1m[22m[2m │ gzip:  7.49 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-MqzS7VM8.js                [39m[1m[2m 28.57 kB[22m[1m[22m[2m │ gzip:  8.36 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-BvnVwLd0.js              [39m[1m[2m 38.19 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js              [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js               [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-uj6TN8vA.js                      [39m[1m[2m328.31 kB[22m[1m[22m[2m │ gzip: 90.21 kB[22m
[32m✓ built in 4.03s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
