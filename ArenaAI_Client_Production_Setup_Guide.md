# ArenaAI / SK Baghel Tour & Travels — Client Production Setup Guide

**Purpose:** Create production service accounts owned by the client, deploy the current monorepo with the existing architecture, configure environment variables safely, and prove the Admin → API → PostgreSQL → customer-site publication path before launch.

**Repository:** `tarun1sisodia/ArenaAI`  
**Production branch:** `main`  
**API service:** `skb-baghel-api` on Render  
**Customer Pages project:** `skbagheltravels-customer`  
**Admin Pages project:** `skbagheltravels-admin`

---

## 0. Mandatory pre-launch blocker: fix the staging API reference first

The latest committed monitor report currently records a **failed main verification** for commit `0c19c2ffacaf3cedb31ce691f9e797d8823eeb56`. The customer build attempted to fetch `https://skb-baghel-api-staging.onrender.com/api/v1/catalog` and received HTTP `502`. See [`monitor-reports/latest.md`](https://github.com/tarun1sisodia/ArenaAI/blob/main/monitor-reports/latest.md).

There is also a hard-coded staging URL in the root `package.json` script `deploy:customer`:

```text
VITE_API_BASE_URL=https://skb-baghel-api-staging.onrender.com
```

**Do not run the current `npm run deploy:customer` script for a production release until this is corrected.** Make the production API URL come from a deliberate production environment variable or correct deployment configuration. Do not use a staging API URL to build production pages.

The customer SSG build reads five published content sources. A build can be blocked by any one source returning 404/5xx, and a successful Admin save alone does not prove the customer page is updated. After configuring the service accounts, verify each manifest URL below against the production API before the Cloudflare customer build.

---

## 1. Correct ownership and account access

Create these accounts inside the **client's business email / client-owned organization**. Do not make the client's production service depend on your personal billing account.

| Provider | Client should own | Give the developer | Notes |
|---|---|---|---|
| GitHub | Repository owner or client organization, as agreed | Repository access needed to deploy | Keep one canonical repository. Current repo is `tarun1sisodia/ArenaAI`; do not create a second copy for production. |
| Render | Workspace, billing, API service | Collaborator access with service deploy/config permissions | The API and its environment variables live here. |
| Cloudflare | Account, domain zone, DNS, Pages projects | Scoped DNS and Pages permissions | Customer and admin frontends are two separate Pages projects. |
| Supabase | Organization and production project | Project access suitable for schema/migration and Auth setup | This project owns PostgreSQL, Auth, and Storage. |
| Razorpay | Merchant account, KYC, settlement bank, live mode | Team role suitable for API keys/webhooks; avoid sharing account owner login | The client must complete merchant activation and financial onboarding. |
| Email/WhatsApp/LocationIQ (if enabled) | Provider accounts and billing | Only necessary project/API access | Optional notification and autocomplete integrations. |

Use provider invitations and least privilege rather than sharing passwords or OTPs. Save secrets in a password manager. Never paste live credentials into chat, a ticket, source code, or a committed `.env` file.

## 2. Final production hostname map

Use one canonical set of origins throughout Render CORS, Cloudflare, Razorpay, Supabase redirects, and monitoring.

| Purpose | Production value |
|---|---|
| Customer site | `https://agraskbagheltourandtravels.com` |
| Customer `www` alias | `https://www.agraskbagheltourandtravels.com` |
| Admin panel | `https://admin.agraskbagheltourandtravels.com` |
| Backend API | `https://api.agraskbagheltourandtravels.com` |
| Razorpay webhook | `https://api.agraskbagheltourandtravels.com/api/v1/webhooks/razorpay` |
| Customer Pages project | `skbagheltravels-customer` |
| Admin Pages project | `skbagheltravels-admin` |
| Render service | `skb-baghel-api` |

Provider-generated `.pages.dev` and `.onrender.com` hostnames will also exist. Use those first for smoke tests; use the custom domains for the final configuration.

---

## 3. Supabase — create the clean production database first

### 3.1 Create the project

1. Sign in to the **client's Supabase organization**.
2. Create a project with an unambiguous name such as `sk-baghel-production`.
3. Select a supported region close to the users/backend and choose a plan with suitable uptime, backup, and retention needs. Do not guess a region or database hostname; use the dashboard's connection information.
4. Generate a strong database password and save it in the client's password manager.
5. Wait until the project is healthy and its database is available.
6. Record the **Project URL / project ref**. Do not put the database password in any frontend configuration.

Use a fresh production project rather than deleting the existing test database. Keep staging/test data and production data separate.

### 3.2 Obtain API keys and JWT verification details

In Supabase **Settings → API Keys**:

- Obtain the public `anon` key for the current Admin code's `VITE_SUPABASE_ANON_KEY`. It is intended for browser use; it is not the privileged key.
- Obtain the server-only privileged key for Render's `SUPABASE_SERVICE_ROLE_KEY`. The source currently uses this environment-variable name in `backend/src/config/supabase.ts`. Never place this key in Cloudflare `VITE_*` variables.
- Check **Authentication → JWT Signing Keys**. If the project issues legacy HS256 JWTs, obtain the corresponding legacy JWT secret and set `SUPABASE_JWT_SECRET` in Render. For asymmetric signing keys, the backend can verify tokens through the project's JWKS URL. Do not invent a JWT secret or blindly rotate signing keys during go-live.

Supabase now recommends publishable keys for browser clients and secret keys for server-only privileged access. This repository's Admin frontend currently reads `VITE_SUPABASE_ANON_KEY`; if you choose the newer publishable key for it, first update the code/config to read `VITE_SUPABASE_PUBLISHABLE_KEY` and validate the deployed login. The production server credential must remain server-only.

### 3.3 Set up PostgreSQL connectivity for Render

1. In Supabase, click **Connect** and choose the **Session pooler** connection string for PostgreSQL.
2. Copy the complete connection string from the dashboard. The current backend example specifically recommends the session pooler on port `5432`, suitable for IPv4-only hosts.
3. Replace only the database-password placeholder. Percent-encode reserved characters in the password if needed.
4. Ensure SSL is required (`sslmode=require`). Do not manually guess the pooler host, username, or region; they are project-specific.
5. This value will be set in Render as `DATABASE_URL`; it must never be set in Cloudflare Pages.

Supabase connection reference: https://supabase.com/docs/guides/database/connecting-to-postgres

### 3.4 Configure Storage for Admin-uploaded images

The backend expects a Storage bucket named `documents` by default (`CATALOG_MEDIA_BUCKET=documents`).

1. In **Storage**, create a bucket named `documents`.
2. Keep it private. The backend serves catalog images through its API media route; the bucket does not need to be made public for the intended path.
3. For the preferred S3-compatible upload path, open **Storage → S3 Connection**, generate an access-key pair, and copy the exact endpoint and region shown in that dashboard.
4. These go to Render only as `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
5. Do not blindly copy `S3_REGION=ap-southeast-2` from the example file if the Supabase dashboard supplies a different region.
6. If the S3 path is not configured, current code can use the Supabase Storage SDK with the server-side privileged key. Test upload, read, and delete paths before relying on that fallback in production.

Supabase S3 reference: https://supabase.com/docs/guides/storage/s3/authentication

### 3.5 Apply the schema using the repository's migration path

The Render Blueprint defines a pre-deploy migration command: `node dist/db/migrate.js`. Confirm that this is the intended migration runner before the first production deployment. Do not create application tables manually, bypass migrations, or insert production catalog rows through SQL for QA.

After Render connects, verify `/ready` reports PostgreSQL, not the in-memory store. The database must be empty/clean only in the sense of being a new, migrated production database—not a test database that is wiped destructively.

### 3.6 Configure the Admin staff identity

1. In Supabase **Authentication → Users**, create the client's authorised admin account (email/password or the configured Google provider).
2. If Google OAuth is used, configure the Google OAuth web client with this Supabase callback:
   `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
3. In Supabase **Authentication → URL Configuration**, add the production Admin callback to allowed redirect URLs:
   `https://admin.agraskbagheltourandtravels.com/auth/callback`
4. If using local development, allow the actual Admin dev origin only while needed (typically `http://localhost:5174` per the repo's dev command).
5. The Admin SPA and backend expect a server-controlled `app_metadata.role` of `super_admin`. The repository deployment guide provides this SQL for the authorised user only:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'super_admin')
where lower(email) = lower('CLIENT_ADMIN_EMAIL_HERE')
returning id, email, raw_app_meta_data ->> 'role' as role;
```

Confirm the returned row is the intended account and the role is `super_admin`. Do not put this role in user-editable `raw_user_meta_data`. Sign out and back in after changing the role so the new token contains the updated claim.

Supabase Auth setup reference: https://supabase.com/docs/guides/auth/signing-keys

---

## 4. Render — deploy the backend API

### 4.1 Create the service from the Blueprint

1. Open the client's Render workspace.
2. Choose **New → Blueprint** and connect `tarun1sisodia/ArenaAI`.
3. Select branch `main` for production.
4. Review the Blueprint-created service `skb-baghel-api`.
5. Confirm root directory `backend`, Dockerfile `backend/Dockerfile`, exposed port `4000`, readiness path `/ready`, and the pre-deploy migration command.
6. Do not create a second competing API service or point two production API instances at the same database without a planned cutover.

Render's Blueprint and environment references:
- https://render.com/docs/infrastructure-as-code
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/health-checks

### 4.2 Set Render environment variables

Set these in **Render → `skb-baghel-api` → Environment**. `sync: false` values in `render.yaml` must be supplied in the dashboard. Blank optional provider variables are not a successful configuration if the associated feature is intended to be live.

#### Core production variables

```dotenv
NODE_ENV=production
PORT=4000
API_BASE_URL=https://api.agraskbagheltourandtravels.com
ALLOW_TEST_AUTH=false
FARE_RULES_VERSION=2026-09-13
CORS_ORIGINS=https://agraskbagheltourandtravels.com,https://www.agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com
DATABASE_URL=<SUPABASE_SESSION_POOLER_CONNECTION_STRING_WITH_SSL>
SUPABASE_URL=https://<SUPABASE_PROJECT_REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SERVER_ONLY_PRIVILEGED_SUPABASE_KEY>
CATALOG_MEDIA_BUCKET=documents
EMAIL_FROM=bookings@agraskbagheltourandtravels.com
```

`SUPABASE_JWT_SECRET` is needed when the project's current JWT verification mode uses the legacy symmetric signing secret. If using an asymmetric signing key, confirm the backend validates it through Supabase JWKS. Do not invent this value.

`ADMIN_EMAIL=<CLIENT_ADMIN_EMAIL>` is an optional additional server-side whitelist supported by backend code. If used, set the exact authorised admin email in Render and set `VITE_ADMIN_EMAIL` on the Admin Pages project to the same address.

#### Storage variables — required for the S3 upload path

```dotenv
S3_ENDPOINT=<EXACT_S3_ENDPOINT_FROM_SUPABASE_STORAGE_S3_CONNECTION>
S3_REGION=<EXACT_REGION_FROM_SUPABASE_STORAGE_S3_CONNECTION>
S3_ACCESS_KEY_ID=<SUPABASE_STORAGE_S3_ACCESS_KEY_ID>
S3_SECRET_ACCESS_KEY=<SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY>
```

#### Razorpay variables — required for live checkout

```dotenv
RAZORPAY_KEY_ID=rzp_live_<CLIENT_LIVE_KEY_ID>
RAZORPAY_KEY_SECRET=<CLIENT_LIVE_KEY_SECRET>
RAZORPAY_WEBHOOK_SECRET=<SEPARATE_WEBHOOK_SECRET_CONFIGURED_IN_RAZORPAY>
```

The repository rejects non-`rzp_live_` keys when `NODE_ENV=production`. Use test keys only in a separate staging configuration with a separate test database; do not put test keys into this production service.

#### Optional variables only when the feature is enabled

```dotenv
LOCATIONIQ_TOKEN=<LOCATIONIQ_SERVER_TOKEN>
RESEND_API_KEY=<RESEND_API_KEY>
WHATSAPP_TOKEN=<META_WHATSAPP_CLOUD_API_TOKEN>
WHATSAPP_PHONE_NUMBER_ID=<WHATSAPP_PHONE_NUMBER_ID>
PAGES_DEPLOY_HOOK_URL=<CLOUDFLARE_CUSTOMER_PAGES_DEPLOY_HOOK_URL>
```

`MONGODB_URI` is optional and is not the canonical booking/catalog database. Do not add it just because it exists in the example file.

### 4.3 CORS rules

`CORS_ORIGINS` is a comma-separated list of **origins only**—no paths and no trailing slash. For production, it must include the exact customer, `www`, and Admin origins. Add preview/staging origins only if they are intentionally in use. During browser testing on temporary `*.pages.dev` previews, add the exact preview origins temporarily or attach the custom domains before browser-based QA; the current `render.yaml` CORS list does not automatically include every generated `pages.dev` hostname. After the client domain is final, remove obsolete preview/`workers.dev` origins unless there is a deliberate need for them.

### 4.4 Deploy and test the provider hostname first

Wait until Render reports **Live**. Copy its actual `.onrender.com` hostname from the dashboard and run:

```bash
curl -i https://<ACTUAL_RENDER_HOSTNAME>/health
curl -i https://<ACTUAL_RENDER_HOSTNAME>/ready
```

Expected:
- `/health` returns 2xx.
- `/ready` returns 2xx and indicates PostgreSQL is the active store.
- It must **not** report the in-memory store.
- Render logs show migration success and no database, Supabase, or env validation errors.

If `/ready` reports memory or the database is unavailable, stop here. Do not deploy either frontend.

### 4.5 Attach the API custom domain

1. In Render service settings, add `api.agraskbagheltourandtravels.com` under Custom Domains.
2. Copy the exact DNS target Render provides.
3. In Cloudflare DNS, create the requested CNAME record. Start with DNS-only if needed for domain verification/TLS; verify Render has issued TLS before changing proxy settings.
4. Verify:

```bash
curl -i https://api.agraskbagheltourandtravels.com/health
curl -i https://api.agraskbagheltourandtravels.com/ready
```

Keep `API_BASE_URL` set to the custom API domain, not the temporary Render hostname.

---

## 5. Razorpay — merchant onboarding, checkout, and webhook

### 5.1 Account and key setup

1. The client signs into the client-owned Razorpay account and completes the merchant activation/KYC/bank-settlement requirements.
2. Test the payment flow on a separate staging deployment using Razorpay **Test Mode** keys and a staging database.
3. For production, switch the Razorpay Dashboard to **Live Mode** and generate live API keys. Use the `Key ID` as `RAZORPAY_KEY_ID` and `Key Secret` as `RAZORPAY_KEY_SECRET` in Render only.
4. Do not confuse the API Key Secret with the webhook secret. They are separate credentials.
5. The public Key ID can appear in a checkout response generated by the backend; the Key Secret must never be in frontend code, Pages variables, or browser storage.

Razorpay's official go-live instructions require switching from test to live keys after test-mode verification: https://razorpay.com/docs/server-integration/python/test-app/

### 5.2 Configure the live webhook

In Razorpay Dashboard → Account & Settings / Webhooks (dashboard wording can vary):

- **Webhook URL:** `https://api.agraskbagheltourandtravels.com/api/v1/webhooks/razorpay`
- **Secret:** generate a strong, unique webhook secret and enter the exact same value in Render as `RAZORPAY_WEBHOOK_SECRET`.
- **Events supported by the currently inspected payment path:** `payment.captured` and `payment.failed`.
- Save the webhook and confirm delivery logs after the first approved end-to-end payment test.

The handler validates the HMAC signature and rejects invalid signatures. Never treat a return/redirect in the browser as proof that payment succeeded; verify the backend state and a valid webhook. Do not run a real payment until the client authorises it and agrees to any charges. An approved small live test may be refunded after checking capture and reconciliation, but staging/Test Mode should be used for normal QA.

Razorpay webhook/security guidance: https://razorpay.com/security/checklist

---

## 6. Cloudflare — DNS, customer Pages, and admin Pages

### 6.1 Add the domain zone

1. Sign in to the client's Cloudflare account.
2. Add `agraskbagheltourandtravels.com` as a zone if it is not already there.
3. If the domain's nameservers are elsewhere, update the registrar to the nameservers Cloudflare assigns. Preserve existing MX/TXT records for business email and verification.
4. Wait for Cloudflare to confirm the zone is active.
5. Add each hostname through the intended Pages project's **Custom domains** screen. Do not only create an arbitrary DNS record and assume Pages is attached.

Cloudflare Pages custom-domain guide: https://developers.cloudflare.com/pages/configuration/custom-domains/

### 6.2 Create the customer Pages project

In **Workers & Pages → Create application → Pages → Connect to Git**:

| Setting | Value |
|---|---|
| Project name | `skbagheltravels-customer` |
| Repository | `tarun1sisodia/ArenaAI` |
| Production branch | `main` |
| Root directory | `/react` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node version | `22` |

Set the following **Production** build variables:

```dotenv
NODE_VERSION=22
VITE_API_BASE_URL=https://api.agraskbagheltourandtravels.com
VITE_SITE_URL=https://agraskbagheltourandtravels.com
VITE_SITE_MODE=production
VITE_BASE_PATH=/
VITE_HINDI_INDEXING_ENABLED=false
```

`VITE_API_BASE_URL` is the API **origin**; do not append `/api/v1` because the frontend constructs endpoint paths itself. `VITE_SITE_URL` is the canonical public origin.

#### Catalog manifest URLs

The current build script resolves these five content sources from `VITE_API_BASE_URL`, unless an explicit override is supplied. **Recommended: set the single correct production API base and leave individual overrides unset**, which avoids accidental mixed production/staging data.

If explicit URLs are intentionally required, they must all point to the same production API and the exact implemented paths:

```dotenv
ROUTE_CATALOG_MANIFEST_URL=https://api.agraskbagheltourandtravels.com/api/v1/route-catalog/manifest
TOUR_PACKAGES_MANIFEST_URL=https://api.agraskbagheltourandtravels.com/api/v1/tour-packages/manifest
TRANSFER_ROUTES_MANIFEST_URL=https://api.agraskbagheltourandtravels.com/api/v1/transfer-routes/manifest
LOCAL_PACKAGES_MANIFEST_URL=https://api.agraskbagheltourandtravels.com/api/v1/local-packages/manifest
CONTENT_MANIFEST_URL=https://api.agraskbagheltourandtravels.com/api/v1/content/manifest
```

Do not point some manifests at staging and others at production. Avoid setting `CATALOG_API_URL` alongside `VITE_API_BASE_URL` unless a deliberate, documented override is needed. Do not set `ALLOW_STAGING_CATALOG=1` for a production build.

The five endpoints are different **paths on one API host**, not five separate services. The publish operation is an authenticated Admin-to-API request; the manifest paths are public/read paths consumed by the customer build. A successful publish should be checked at the database, manifest, generated HTML, and browser runtime layers.

Add these customer domains to the Pages project:
- `agraskbagheltourandtravels.com`
- `www.agraskbagheltourandtravels.com`

### 6.3 Create the admin Pages project

| Setting | Value |
|---|---|
| Project name | `skbagheltravels-admin` |
| Repository | `tarun1sisodia/ArenaAI` |
| Production branch | `main` |
| Root directory | `/admin` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node version | `22` |

Set these Production variables:

```dotenv
NODE_VERSION=22
VITE_API_BASE_URL=https://api.agraskbagheltourandtravels.com
VITE_CUSTOMER_SITE_URL=https://agraskbagheltourandtravels.com
VITE_SUPABASE_URL=https://<SUPABASE_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE_PUBLIC_ANON_KEY>
VITE_ADMIN_EMAIL=<CLIENT_ADMIN_EMAIL>
```

`VITE_ADMIN_EMAIL` is optional on the frontend, but use it if the server `ADMIN_EMAIL` whitelist is enabled. The current Admin config reads `VITE_SUPABASE_ANON_KEY`; do not assume the publishable-key variable works without updating and testing the code.

Add `admin.agraskbagheltourandtravels.com` under this Pages project's Custom domains.

**Never add the Supabase service-role/secret key, database URL/password, Razorpay Key Secret, Razorpay Webhook Secret, LocationIQ server token, S3 secret key, Resend key, WhatsApp token, or Pages deploy-hook URL to either frontend project.** Anything with the `VITE_` prefix can be included in the browser bundle.

Cloudflare Pages build configuration and Git integration:
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/configuration/git-integration/

### 6.4 Create the customer Pages deploy hook

Content publication triggers a customer-site rebuild so new package/route content can be included in the SSG HTML and sitemap.

1. Open the **customer** Pages project `skbagheltravels-customer`.
2. Go to **Settings → Builds → Deploy hooks** (dashboard labels may vary) and create a hook for the production branch `main`.
3. Copy the generated secret URL once.
4. Store it only in Render as `PAGES_DEPLOY_HOOK_URL`.
5. Do not put this URL in client-side variables or commit it to Git.
6. Publish an approved test item in Admin, then confirm Render logs show the hook queued/accepted and Cloudflare shows the customer build triggered.

Cloudflare deploy-hook documentation: https://developers.cloudflare.com/pages/configuration/deploy-hooks/

---

## 7. Public API and manifest verification before any content QA

After the API custom domain is live, run these read-only checks from a terminal. Each response must be HTTP 200, valid JSON, and sourced from the new production Supabase database. These are checks, not data writes.

```bash
curl -i https://api.agraskbagheltourandtravels.com/health
curl -i https://api.agraskbagheltourandtravels.com/ready
curl -i https://api.agraskbagheltourandtravels.com/api/v1/catalog
curl -i https://api.agraskbagheltourandtravels.com/api/v1/catalog/manifest
curl -i https://api.agraskbagheltourandtravels.com/api/v1/route-catalog/manifest
curl -i https://api.agraskbagheltourandtravels.com/api/v1/tour-packages/manifest
curl -i https://api.agraskbagheltourandtravels.com/api/v1/transfer-routes/manifest
curl -i https://api.agraskbagheltourandtravels.com/api/v1/local-packages/manifest
curl -i https://api.agraskbagheltourandtravels.com/api/v1/content/manifest
```

Expected:

- `/health` and `/ready` return 2xx; `/ready` identifies PostgreSQL as the active store.
- Every required manifest returns 2xx, not 404/502.
- JSON shape matches what `react/scripts/build-manifest.ts` expects; a generic HTTP 200 is not enough.
- No response is unexpectedly reading staging/test data.
- If a source is empty, confirm this is correct for the new database; do not silently copy static/sample data or mark it published as a workaround.

The current Cloudflare Pages build should fail closed when a required source cannot be fetched. Fix the API, environment variable, or schema mismatch rather than bypassing the guard.

---

## 8. Fix and verify the production build pipeline

Before the customer build is deployed:

1. Correct the `deploy:customer` script so it no longer forces `https://skb-baghel-api-staging.onrender.com` for production builds.
2. Confirm `VITE_API_BASE_URL` for the Production Cloudflare environment is exactly `https://api.agraskbagheltourandtravels.com`.
3. Review whether explicit `*_MANIFEST_URL` overrides are necessary; if used, verify all five URLs exactly.
4. Do not set the content manifest to `/api/v1/content/` without `/manifest`; the implemented route is `/api/v1/content/manifest`.
5. Run the repository checks with the corrected production-safe configuration and resolve every failure. At minimum: `npm run verify` and the customer production build with production variables injected.
6. Inspect build logs. They must not reference `skb-baghel-api-staging.onrender.com`, and they must show all required sources fetched successfully.
7. Confirm production SSG files contain the test/published item's correct slug, title, price, images, and canonical URL.
8. Only then allow Cloudflare Pages to promote the build to production.

Do not run an unreviewed production deployment merely because an earlier report said tests passed. The current latest monitor report is red and must be re-checked after the fix.

---

## 9. Admin-to-database-to-customer QA — use the real UI and contracts

Once all provider accounts are configured and all public API endpoints return valid production data, test using the deployed Admin panel. Do not bypass the Admin API contract with direct SQL inserts, scripts that seed test rows, fake auth tokens, or manual edits to generated JSON.

Create uniquely named QA items, for example `QA-PROD-ROUTE-2026-10-17`, in the Admin UI. Start with one item per supported vertical:

1. Outstation route.
2. Tour package.
3. Local sightseeing package.
4. Transfer route.
5. Monument/content item if that Admin form is enabled.

For each item, capture the exact entity UUID, slug/code, input values, save response, publish response, and timestamp. Then follow the same chain:

1. **Admin UI:** Create draft using the real form; check validation and that Save returns success.
2. **API:** Inspect the actual browser Network request/response. Confirm the payload uses the expected contract fields and the backend returns the stored record's ID.
3. **Database:** In Supabase Table Editor or a read-only SQL query, confirm the row matches the submitted values and status. Do not alter values with SQL during the test.
4. **Publish:** Use the Admin's real publish action. Confirm the record status becomes published through the API and database.
5. **Manifest:** Fetch the corresponding manifest and confirm the same UUID/slug occurs once, with the expected published values.
6. **Deploy hook:** Verify the customer Pages deployment was triggered, if the item changes pre-rendered content.
7. **Customer discovery page:** Hard refresh and verify the item appears exactly once with correct text, price, and image.
8. **Detail URL:** Open the canonical package/route URL from the UI or generated sitemap and verify it resolves without redirect loops or 404s.
9. **Booking handoff:** Click the actual customer Book action. Verify the correct item ID/slug, trip type, route, fleet preference, and date are preserved into the booking form.
10. **Fare/checkout:** Confirm the backend calculates the price; the browser must not be trusted as the fare authority. Use Razorpay Test Mode in staging for payment-state QA.
11. **Unpublish/archive:** Use the Admin UI to unpublish/archive the QA row and verify it is no longer publicly discoverable as intended. Verify no unintended production content was hidden.
12. Save screenshots and browser Network/Console logs for any mismatch.

Only after the production data path passes should you enter the client's actual routes, packages, prices, images, and operating policies through Admin.

---

## 10. First-launch smoke tests

### Services and security

- [ ] Render reports the current commit deployed and service status Live.
- [ ] `/health` is 2xx and `/ready` confirms PostgreSQL.
- [ ] No secret values are present in Git history or customer/admin JavaScript bundles.
- [ ] `ALLOW_TEST_AUTH=false` and `NODE_ENV=production` on production Render.
- [ ] CORS allows customer, `www`, and Admin exact origins only, plus any explicitly approved preview origins.
- [ ] Admin login uses the intended Supabase project and authorised `super_admin` role.
- [ ] Cloudflare shows correct project names, custom domains, and latest production deployment.
- [ ] DNS/TLS works at all three custom hosts: customer, admin, API.

### Catalog and pages

- [ ] All five manifest endpoints above return valid production JSON.
- [ ] Route listing and route detail show the same canonical ID/slug and fare.
- [ ] Home page shows current fleet/booking data where live data is expected.
- [ ] Packages listing shows only the intended published packages and prices.
- [ ] Each package opens its correct canonical detail page and booking flow.
- [ ] Taxi rental page gets its live active fleet and does not invent prices for unpriced tiers.
- [ ] Monument/local tour pages lead to the correct booking selection.
- [ ] Newly published test content triggers a customer Pages rebuild and appears after deployment/cache refresh.
- [ ] Images upload through Admin, are served from the expected API media route, and remain visible after a hard refresh.

### Payments and notifications

- [ ] Razorpay Test Mode has passed in staging with a matching test webhook secret.
- [ ] Production Render has live Razorpay `rzp_live_` keys and the separate correct live webhook secret.
- [ ] Razorpay webhook URL is exactly `https://api.agraskbagheltourandtravels.com/api/v1/webhooks/razorpay`.
- [ ] `payment.captured` and `payment.failed` delivery is visible in Razorpay and Render logs.
- [ ] Payment success is only recorded after server-side verification/signed webhook—not because the browser returned to a success URL.
- [ ] LocationIQ autocomplete is tested if enabled.
- [ ] Email/WhatsApp delivery is tested only if the client has configured those providers.

---

## 11. Secret ownership matrix

| Variable / credential | Correct storage location | Never store in |
|---|---|---|
| `DATABASE_URL` | Render environment | Cloudflare Pages, Git, browser |
| Supabase server privileged key | Render environment | `VITE_*`, frontend source, Git |
| Supabase legacy JWT secret (if applicable) | Render environment | Frontend source, Git, chat |
| Razorpay Key Secret | Render environment | Browser/Pages variables, Git |
| Razorpay webhook secret | Render environment + Razorpay dashboard | Browser/Pages variables, Git |
| S3 access-key secret | Render environment | Frontend, Git |
| LocationIQ server token | Render environment | Frontend bundle if server-held, Git |
| Resend / WhatsApp tokens | Render environment | Frontend, Git |
| `PAGES_DEPLOY_HOOK_URL` | Render environment | Customer/admin variables, Git |
| `VITE_API_BASE_URL` | Cloudflare Pages build variables | Not secret; it is compiled into client build |
| `VITE_SUPABASE_ANON_KEY` | Admin Pages build variables | Not privileged; still use proper Auth/RLS configuration |

Rotate immediately if a secret is ever committed or exposed. Remove it from current config, rotate it with the provider, update the service environment, redeploy, and review logs.

---

## 12. Official references

- Render Blueprint / infrastructure as code: https://render.com/docs/infrastructure-as-code
- Render environment variables: https://render.com/docs/configure-environment-variables
- Render health checks: https://render.com/docs/health-checks
- Cloudflare Pages build configuration and environment variables: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Cloudflare Pages Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- Cloudflare Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Cloudflare Pages deploy hooks: https://developers.cloudflare.com/pages/configuration/deploy-hooks/
- Supabase PostgreSQL connection strings and poolers: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Storage S3 authentication: https://supabase.com/docs/guides/storage/s3/authentication
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase JWT signing keys: https://supabase.com/docs/guides/auth/signing-keys
- Razorpay server integration and go-live: https://razorpay.com/docs/server-integration/python/test-app/
- Razorpay security checklist: https://razorpay.com/security/checklist

---

## Production release rule

Do not call the site live until: **the latest main verification is green; Render health/readiness proves PostgreSQL is active; each catalog manifest responds correctly from the production API; both Cloudflare projects use the production API base; the staging hardcode is removed; the customer build succeeds without staging URLs; and a real Admin-created QA item is confirmed in the database, public manifest, customer listing/detail page, and booking handoff.**
