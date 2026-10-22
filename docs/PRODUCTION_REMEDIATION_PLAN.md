# Production Remediation Plan

## Scope

Stabilize the `main` branch after the payment-security refactor, restore the backend contract/build, prevent payment state corruption, and make the production customer origin authoritative for SEO and deployment configuration.

## Findings from the current branch

1. The PostgreSQL repository factory is typed as `Repositories`, so its `payments` object must implement the shared `processCaptured` and `processNeedsReview` methods. The latest refactor changed the implementation and the reported Docker build was produced from a revision where those methods were absent; the current checkout now contains an incomplete/non-equivalent version that still requires verification.
2. `processCaptured` currently uses `provider_payment_id=$3` while its values place the provider payment ID at `$2`; this can write an ISO timestamp into the provider-payment column. It also uses `amountPaise` in aggregate SQL while the repository and migration contract use `amount_minor`.
3. The PostgreSQL implementation updates payment and booking state without the same locked transaction and cancellation checks used by the dedicated payment repository/memory implementation. This risks partial state on webhook processing.
4. The canonical customer production origin is `https://agraskbagheltourandtravels.com`, but backend defaults, CI, deploy scripts, `.env.example`, and the checked-in `react/public/sitemap.xml` still contain staging or Workers-hosted defaults.
5. The sitemap generator already derives URLs from `VITE_SITE_URL`, but the committed fallback artifact is stale and must be regenerated with the production origin. `robots.txt` must point to the production sitemap, and production builds must keep canonical, Open Graph, and JSON-LD URLs on the same origin.
6. The Render service is configured for `https://api.agraskbagheltourandtravels.com`; API consumers and healthcheck examples should use that public production hostname rather than the staging hostname.

## Execution steps

1. **Contract and database implementation repair**
   - Align the PostgreSQL payment repository with `backend/src/db/types.ts`, memory repositories, migrations, and the payment service.
   - Correct payment column names and SQL parameter positions.
   - Make capture/review transitions transactional, lock the booking/payment rows, reject cancelled/refunded bookings, and mark the correct webhook-event table.
   - Preserve the repository contract regression test and add service-level regression coverage for legacy `booking_id` webhook records and the canonical `amount_paise` response field.

2. **Production URL/configuration repair**
   - Make the production API and customer-site origins the safe documented defaults while preserving explicit local development behavior.
   - Replace stale staging URLs in build/deploy examples and CI production verification variables.
   - Keep credentials and deployment-only values out of source control.

3. **SEO artifact repair**
   - Regenerate the checked-in sitemap and robots files against `https://agraskbagheltourandtravels.com`.
   - Preserve only canonical, indexable, prerendered routes; do not add booking or admin routes.
   - Ensure the production build emits matching canonical, `og:url`, sitemap, robots, and structured-data origins.

4. **Verification**
   - Run contract synchronization, frontend/backend/admin typechecks, focused payment tests, SEO lifecycle tests, full CI-equivalent verification, and all builds.
   - Inspect the final diff for accidental staging URLs, secret leakage, generated-artifact drift, and unrelated changes.
   - Commit and push the verified fix to `origin/main` without rewriting history.

## Acceptance criteria

- `npm run backend:build` and `npm run backend:typecheck` pass.
- `npm run customer:build` and `npm run customer:seo` pass with `VITE_SITE_URL=https://agraskbagheltourandtravels.com` and `VITE_API_BASE_URL=https://api.agraskbagheltourandtravels.com`.
- Full repository verification passes or any unrelated pre-existing blocker is explicitly reported.
- Payment capture/review repository methods satisfy the shared contract; the existing payment/webhook suite covers webhook processing, while compile-time SQL/contract alignment and service-level regression coverage protect the repaired integration points.
- `react/public/sitemap.xml` and `react/public/robots.txt` reference only the production customer origin.
- No staging/Workers origin remains in production defaults, CI release variables, or production deployment commands.
