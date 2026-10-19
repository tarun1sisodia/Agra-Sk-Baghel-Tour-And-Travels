# Security Audit Report — ArenaAI

**Audit date:** 2026-10-19  
**Repository:** [tarun1sisodia/ArenaAI](https://github.com/tarun1sisodia/ArenaAI)  
**Supabase project:** `trcmufqbpcymipqpemoq`  
**Scope:** Customer inquiry submission path; frontend/backend request handling; database access to inquiry and payment-webhook records; selected Supabase security-advisor findings.  
**Environment note:** The owner states that the connected database contains test data only. Changes below were applied to the connected project; verify the target project before applying similar changes elsewhere.

## Executive summary

The most concrete issues found were (1) a legacy `public.raw_webhooks` view that exposed payment webhook payload fields to API roles, (2) broad table grants and an unconditional anonymous INSERT policy on `public.inquiries`, and (3) frontend inquiry handling that treated any HTTP 2xx response as a successful submission without validating the response envelope.

The database cleanup has been applied and verified. A frontend response-validation fix and matching migration files have been committed to branch `security/audit-inquiry-webhook-hardening`; they are not yet merged or deployed. The live Render service and production Cloudflare Pages bundle were not directly runtime-tested in this audit, so the precise reason for the user's original test behavior is not conclusively established.

## Findings and status

### F-01 — Legacy webhook view exposed sensitive event payloads
**Severity:** High  
**Status:** Fixed in live database; migration parity added to branch.

**Evidence**
- `backend/migrations/0046_create_raw_webhooks_view.sql` created `raw_webhooks` as a view over `payment_webhook_events`, including the `payload` column.
- The live database previously had `anon` and `authenticated` grants on the view.
- The view has now been dropped. Verification found `payment_webhook_events` still present and `raw_webhooks` absent.

**Impact**
Webhook payloads can contain provider event and payment metadata. A public-facing view over those records was not appropriate.

**Remediation**
- Executed `DROP VIEW IF EXISTS public.raw_webhooks`.
- Added `backend/migrations/0047_security_lockdown_inquiries_webhooks.sql` so a fresh migration run removes the view after the historical migration.
- Revoked `anon` and `authenticated` privileges on `payment_webhook_events` as defense in depth.

**Data impact:** No rows were deleted from `payment_webhook_events`.

### F-02 — Anonymous clients could insert inquiries directly into Supabase
**Severity:** High  
**Status:** Fixed in live database; migration parity added to branch.

**Evidence**
- `backend/migrations/0016_comprehensive_rls_policies.sql` created `inquiries_anon_insert` with `WITH CHECK (true)`.
- Live policy inspection confirmed the policy existed.
- The customer frontend uses `createInquiry()` to call `POST /api/v1/inquiries`; the Fastify route applies a per-route limit of 5 requests per minute and the controller parses `CreateInquirySchema`.
- No direct Supabase inquiry insert was found in the reviewed frontend search.

**Impact**
A client using the public Supabase API could attempt to bypass backend validation and the route-level rate limit. Before remediation, table grants also included more privileges than the public inquiry flow required.

**Remediation**
- Dropped `inquiries_anon_insert`.
- Revoked all table privileges on `public.inquiries` from `anon` and `authenticated`.
- Verified no direct table grants remained for those roles and that the anonymous insert policy was absent.

**Expected effect**
Inquiry writes should use the server-side backend path. Confirm a legitimate form submission against the deployed backend after deployment.

### F-03 — Frontend could misreport an unrelated HTTP 200 as inquiry success
**Severity:** Medium  
**Status:** Fix committed to branch; not yet merged/deployed.

**Evidence**
- `react/src/services/api.ts` originally parsed the response with a fallback to an empty object, checked only `res.ok`, and returned `json.data` without validating that an inquiry ID existed.
- If a request accidentally reached a frontend/static fallback that returned HTTP 200 HTML, JSON parsing could fail and the helper could resolve without a real persisted inquiry ID.
- `react/src/pages/HomePage.tsx` marks the inquiry submitted after `createInquiry()` resolves.

**Remediation**
The branch changes `createInquiry()` to require a non-empty string at `data.id`. A non-JSON response or malformed success envelope now throws an error instead of being treated as a successful submission.

**Verification still required**
Run the customer typecheck/build and test the live form with the backend reachable and unavailable. The patch has not been deployed, so the live site behavior remains unchanged until merge/deploy.

### F-04 — Customer CI build uses a staging-named Render API URL
**Severity:** Medium / configuration risk  
**Status:** Needs deployment confirmation.

**Evidence**
- `.github/workflows/ci-customer.yml` builds with `VITE_API_BASE_URL=https://skb-baghel-api-staging.onrender.com`.
- The workflow comment describes this as the current live API for the account, but the service name is staging-oriented.

**Impact**
If production Cloudflare Pages uses this same value unintentionally, the production frontend may call a staging/test backend. Conversely, a missing or incorrect value can cause requests to hit the frontend origin rather than the API.

**Recommendation**
Confirm the intended API origin for each Cloudflare Pages environment (preview/staging/production), then ensure the production build receives the intended URL. This audit did not inspect the actual deployed JavaScript bundle or prove which value the live Pages deployment currently uses.

### F-05 — Mutable search_path warning for `public.set_updated_at()`
**Severity:** Low / hardening  
**Status:** Fixed in live database; migration parity added to branch.

**Evidence**
Supabase's security advisor reported a mutable function search path. Inspection showed the trigger function only assigns `NEW.updated_at = NOW()` and returns `NEW`.

**Remediation**
Applied `ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog` and added `backend/migrations/0048_harden_set_updated_at_search_path.sql`. This pins name resolution to the built-in catalog for the function body.

### F-06 — Other Supabase security-advisor notices remain
**Severity:** Mixed; requires review  
**Status:** Open / not all are direct vulnerabilities.

Supabase reported:
- 18 tables with RLS enabled and no policies, including `payment_webhook_events`.
- `pg_trgm` installed in the `public` schema.
- Leaked-password protection disabled in Supabase Auth.

**Interpretation**
RLS enabled with no policies is default-deny for roles subject to RLS, so these notices can represent intentional backend-only tables rather than public exposure. The audit did not automatically add policies to these tables because doing so without a table-by-table access design could expose sensitive records. The grants to `anon` and `authenticated` on `payment_webhook_events` were revoked as an additional safeguard.

**Recommended next steps**
1. Review the intended access path for each of the 18 RLS tables; preserve default-deny on private operational/payment tables.
2. Enable leaked-password protection in Supabase Auth settings after confirming the desired auth policy.
3. Assess moving `pg_trgm` only after checking extension dependencies and migration behavior.

## Architecture trace for inquiry submissions

1. Customer form in `react/src/pages/HomePage.tsx` calls `createInquiry()`.
2. `react/src/services/api.ts` sends `POST /api/v1/inquiries` to the configured API base URL.
3. `backend/src/modules/inquiries/inquiry.routes.ts` registers the endpoint with a 5-per-minute route rate limit.
4. `backend/src/modules/inquiries/inquiry.controller.ts` validates input with `CreateInquirySchema` and returns a success envelope containing the created inquiry ID.
5. `backend/src/modules/inquiries/inquiry.service.ts` persists through the backend repository.

The reviewed homepage path does not directly write to Supabase. However, the database policy previously allowed a separate direct-write route through the public Supabase API; that route has now been closed.

## Changes performed

### Applied to the connected Supabase database
- Dropped `public.raw_webhooks`.
- Dropped `inquiries_anon_insert`.
- Revoked `anon` and `authenticated` privileges on `public.inquiries` and `public.payment_webhook_events`.
- Set the search path for `public.set_updated_at()` to `pg_catalog`.

### Committed on branch `security/audit-inquiry-webhook-hardening`
- `react/src/services/api.ts`: validate that a successful inquiry response contains a non-empty `data.id`.
- `backend/migrations/0047_security_lockdown_inquiries_webhooks.sql`: preserve database access cleanup for future migration runs.
- `backend/migrations/0048_harden_set_updated_at_search_path.sql`: preserve function search-path hardening.
- This report.

## Verification results

| Check | Result |
|---|---|
| `public.raw_webhooks` absent | Verified |
| `public.payment_webhook_events` remains | Verified |
| `inquiries_anon_insert` absent | Verified |
| No `anon`/`authenticated` table grants on `inquiries` or `payment_webhook_events` | Verified |
| `set_updated_at()` search path altered | Migration succeeded; follow-up advisor refresh recommended |
| Frontend build/typecheck after patch | Not run in this audit |
| Live Render API availability and live form submission | Not runtime-tested |
| Production Cloudflare bundle/API origin | Not directly verified |
| Admin authorization across all protected routes | Not exhaustively tested |

## Remaining actions, in priority order

1. Merge and deploy the branch after CI passes.
2. Verify the intended `VITE_API_BASE_URL` in the production Cloudflare Pages deployment.
3. Submit a test inquiry while the backend is available; confirm an ID is returned and the record appears through the authorized admin/backend path.
4. Stop or simulate the backend being unavailable; verify the form shows an error and does not display success.
5. Re-run Supabase security advisors and review the remaining notices table by table.
6. Enable leaked-password protection in Supabase Auth settings.
