# Deployment and CI/CD Guide — SK Baghel Tour & Travels

## 1. Executive Summary

This document describes the deployment architecture and CI/CD pipeline for the SK Baghel Tour & Travels monorepo. It covers the three independently deployable applications (customer site, admin panel, backend API), their hosting platforms, build processes, and automated verification gates.

### Architecture Overview

| Application | Root Directory | Hosting Platform | Domain | Build Command |
|-------------|----------------|------------------|--------|---------------|
| Customer Site | `react/` | Cloudflare Pages | `agraskbagheltourandtravels.com` | `npm ci && npm run build` |
| Admin Panel | `admin/` | Cloudflare Pages | `admin.agraskbagheltourandtravels.com` | `npm ci && npm run build` |
| Backend API | `backend/` | Render Docker | `api.agraskbagheltourandtravels.com` | Dockerfile (port 4000) |

### Release Workflow

```
feature branch → pull request → design/homepage → main → auto-deploy
```

**Branch Strategy:**
- `main` - Production branch (protected)
- `design/homepage` - Integration branch for staging
- Feature branches - `feat/*`, `fix/*`, `design/*`, `arena/*`

---

## 2. Monorepo Structure

### 2.1 Independent Deployments

Each application is deployed independently from the same repository:

```
ArenaAI/
├── react/          # Customer-facing React application
│   ├── src/
│   ├── public/
│   ├── scripts/
│   └── package.json
├── admin/          # Operations desk React application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/        # Fastify API server
│   ├── src/
│   ├── migrations/
│   ├── tests/
│   └── package.json
├── docs/
├── scripts/
└── package.json    # Root workspace configuration
```

### 2.2 Build Output

Build output is **confined** to three directories:
- `react/dist` - Customer site static assets
- `admin/dist` - Admin panel static assets
- `backend/dist` - Backend compiled JavaScript

**The only tracked file a build rewrites is `react/public/sitemap.xml`** (the versioned mirror of the generated sitemap).

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflows

#### Quality Workflow (`.github/workflows/ci.yml`)

```yaml
name: "CI — Monorepo Quality & Deployment Guard"

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  verify:
    name: "Contracts · TypeChecks · Tests · Builds · Security"
    runs-on: ubuntu-latest
    timeout-minutes: 15
```

**Verification Steps:**
1. Checkout codebase
2. Setup Node.js runtime (v24)
3. Install locked monorepo dependencies (`npm run install:all`)
4. Check healthcheck script syntax
5. Run full monorepo verification pipeline (`npm run verify`)
6. Verify admin SPA deep-link redirects (`_redirects`)
7. Verify Cloudflare asset size budgets (<25 MiB)
8. Frontend secret leak guard
9. Publish verification summary to GitHub Step Summary

#### Uptime Workflow (`.github/workflows/uptime.yml`)

```yaml
name: Custom API keepalive and uptime

on:
  workflow_dispatch:
  schedule:
    - cron: "*/5 * * * *"  # Five-minute checks

jobs:
  healthcheck:
    name: "Custom API + site healthcheck"
    runs-on: ubuntu-latest
    timeout-minutes: 4
```

**Health Check Endpoints:**
- `https://api.agraskbagheltourandtravels.com/health` - Backend liveness
- `https://agraskbagheltourandtravels.com/` - Customer site
- `https://admin.agraskbagheltourandtravels.com/` - Admin panel

### 3.2 Verification Contract

Every host runs the same command contract as CI:

```bash
# Bootstrap once
npm run install:all    # npm ci for root, react/, admin/, backend/

# Verify before every push
npm run verify         # typecheck (x3) + backend tests + production build (x3)
```

**Individual Gates:**
```bash
npm run customer:typecheck
npm run admin:typecheck
npm run backend:typecheck
npm test
npm run build:all
npm run healthcheck
```

---

## 4. Backend API Deployment (Render)

### 4.1 Render Configuration

#### [`render.yaml`](render.yaml) - Service Definition

```yaml
services:
  - type: web
    name: skb-baghel-api
    runtime: docker
    rootDir: backend
    dockerfilePath: ./Dockerfile
    healthCheckPath: /ready
    preDeployCommand: node dist/db/migrate.js
    autoDeploy: true
    buildFilter:
      paths:
        - backend/**
        - render.yaml
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: DATABASE_URL
        sync: false
      - key: CORS_ORIGINS
        value: https://agraskbagheltourandtravels.com,https://www.agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: RAZORPAY_KEY_ID
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false
      - key: RAZORPAY_WEBHOOK_SECRET
        sync: false
      # ... more sync: false variables
```

### 4.2 Dockerfile Architecture

#### [`backend/Dockerfile`](backend/Dockerfile) - Multi-Stage Build

```dockerfile
# Stage 1: deps - Full dependency tree for compilation
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build - TypeScript compilation
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Stage 3: prod-deps - Pruned production dependencies
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 4: runner - Minimal runtime image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S skb && adduser -S skb -G skb
COPY --from=prod-deps --chown=skb:skb /app/node_modules ./node_modules
COPY --from=build --chown=skb:skb /app/dist ./dist
COPY --chown=skb:skb package.json ./
COPY --chown=skb:skb migrations ./migrations
COPY --chown=skb:skb scripts/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
USER skb
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/ready || exit 1
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

**Key Features:**
- Multi-stage build for minimal production image
- Non-root user (`skb`) for security
- Health check on `/ready` endpoint
- Pre-deploy database migrations
- DevDependencies excluded from production

### 4.3 Deployment Steps

1. **Sign in to Render** and choose **New → Blueprint**
2. **Connect GitHub** and select `tarun1sisodia/ArenaAI`
3. **Select `main` branch** for production
4. **Review service** named `skb-baghel-api`
5. **Create Blueprint** - Render builds Docker image and starts `node dist/server.js`
6. **Verify health check** path is `/ready` and exposed port is `4000`
7. **Add environment variables** from `render.yaml` (all `sync: false`)
8. **Deploy** and wait for **Live** status
9. **Test** before adding custom domain:
   ```bash
   curl -fsS https://<render-service>.onrender.com/health
   curl -fsS https://<render-service>.onrender.com/ready
   ```

### 4.4 Custom Domain Setup

1. In Render, open **Settings → Custom Domains → Add Custom Domain**
2. Enter `api.agraskbagheltourandtravels.com` and copy DNS target
3. In Cloudflare DNS, create CNAME record
4. Start with proxy **disabled** for domain verification
5. Enable proxy after TLS and routing confirmed
6. Verify:
   ```bash
   curl -fsS https://api.agraskbagheltourandtravels.com/health
   curl -fsS https://api.agraskbagheltourandtravels.com/ready
   ```

### 4.5 Free-Tier Wake-Up Limitation

The uptime monitor sends requests every 5 minutes to reduce idle sleep on Render Free tier. This is **not a guarantee** - Render can suspend services, and free-tier policies can change.

**For guaranteed always-on behavior:**
- Use a paid Render instance, OR
- Deploy the same Docker image to a VPS behind Cloudflare Tunnel

---

## 5. Customer Site Deployment (Cloudflare Pages)

### 5.1 Cloudflare Configuration

#### [`react/cloudflare-pages.toml`](react/cloudflare-pages.toml)

```toml
[build]
command = "npm ci && npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "22"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"
Strict-Transport-Security = "max-age=31536000; includeSubDomains"
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.razorpay.com https://*.googleapis.com; frame-ancestors 'none';"

[[headers]]
for = "/_headers"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/sitemap.xml"
[headers.values]
Cache-Control = "public, max-age=3600"
```

### 5.2 Deployment Steps

1. **Sign in to Cloudflare Dashboard** → **Workers & Pages → Create application → Pages → Connect to Git**
2. **Select repository** `tarun1sisodia/ArenaAI`
3. **Create project** with name `skbagheltravels-customer`
4. **Set Production branch** to `main`
5. **Set Root directory** to `/react`
6. **Set Build command** to `npm ci && npm run build`
7. **Set Build output directory** to `dist`
8. **Add production variable** `VITE_API_BASE_URL=https://api.agraskbagheltourandtravels.com`
9. **Set Ignored build command**:
   ```bash
   git diff --quiet HEAD^ HEAD -- react/
   ```
   Cloudflare skips build when no `react/` files changed
10. **Deploy** and verify preview URL
11. **Add custom domains** `agraskbagheltourandtravels.com` and `www.agraskbagheltourandtravels.com`
12. **Verify** site loads at `https://agraskbagheltourandtravels.com/`

### 5.3 Canonical www-to-apex Redirect

Configure a Cloudflare **Bulk Redirect** from `www.agraskbagheltourandtravels.com` to `https://agraskbagheltourandtravels.com/` with:
- Status: `301`
- Subpath matching: enabled
- Preserve path suffix: enabled
- Preserve query string: enabled

**Verify:**
```bash
curl -sSI 'https://www.agraskbagheltourandtravels.com/routes/example/?source=seo' | sed -n '1,8p'
```

Response should be `301` with `Location: https://agraskbagheltourandtravels.com/routes/example/?source=seo`.

### 5.4 SSG Routing Rules

The customer site is **pre-rendered** by `react/scripts/prerender.ts`:
- Every marketing URL is real HTML **plus a real `404.html`**
- Deploys with `not_found_handling: "404-page"`
- Do **not** add catch-all rewrite to `index.html` - it would turn genuine 404s into 200s

### 5.5 Manual Deployment

```bash
npm run deploy:customer
```

---

## 6. Admin Panel Deployment (Cloudflare Pages)

### 6.1 Cloudflare Configuration

#### [`admin/cloudflare-pages.toml`](admin/cloudflare-pages.toml)

```toml
[build]
command = "npm ci && npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "22"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[[headers]]
for = "/*"
[headers.values]
X-Robots-Tag = "noindex, nofollow"
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/_headers"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/robots.txt"
[headers.values]
Content-Type = "text/plain"
```

### 6.2 Deployment Steps

1. **Create second project** named `skbagheltravels-admin`
2. **Select same repository**, set **Production branch** to `main`
3. **Set Root directory** to `/admin`
4. **Set Build command** to `npm ci && npm run build`
5. **Set Build output directory** to `dist`
6. **Add production variables**:
   - `VITE_API_BASE_URL=https://api.agraskbagheltourandtravels.com`
   - `VITE_SUPABASE_URL=https://<SUPABASE_PROJECT_REF>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_PUBLIC_KEY>`
   - `VITE_ADMIN_EMAIL=<ALLOWED_ADMIN_GMAIL>` (optional)
7. **Set Ignored build command**:
   ```bash
   git diff --quiet HEAD^ HEAD -- admin/
   ```
8. **Deploy** and open generated Pages URL
9. **Add custom domain** `admin.agraskbagheltourandtravels.com`
10. **Verify** login route, deep links (`/bookings`), and API requests work

### 6.3 Admin Authentication Setup

The admin SPA accepts **Supabase Auth** sessions only. Email/password and Google OAuth use the same staff authorization rule: the authenticated user's `app_metadata.role` must equal `super_admin`.

#### 1. Configure Google OAuth

1. In Google Cloud Console, create OAuth 2.0 **Web application** client
2. Set authorized redirect URI: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
3. Add authorized JavaScript origins:
   - `https://admin.agraskbagheltourandtravels.com`
   - `http://localhost:5173`
4. In Supabase Dashboard → **Authentication → Sign In / Up → Providers → Google**, enable Google and enter client ID/secret
5. In Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs**, allow:
   - `https://<admin-host>/auth/callback`
   - `http://localhost:5173/auth/callback`

#### 2. Provision Staff User

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'super_admin')
where lower(email) = lower('STAFF_EMAIL_HERE')
returning id, email, raw_app_meta_data ->> 'role' as role;
```

Confirm returned row has role `super_admin`. Sign out and sign in again after role change.

### 6.4 Manual Deployment

```bash
npm run deploy:admin
```

---

## 7. DNS and Release Order

Use this order to avoid deploying frontends that point at an unavailable API:

1. **Deploy Render** and verify `/health` and `/ready` on Render hostname
2. **Add and verify** `api.agraskbagheltourandtravels.com`
3. **Set `VITE_API_BASE_URL`** in both Pages projects
4. **Deploy customer Pages** project and add `agraskbagheltourandtravels.com`
5. **Deploy admin Pages** project and add `admin.agraskbagheltourandtravels.com`
6. **Run complete public check**:
   ```bash
   HEALTHCHECK_URLS="https://api.agraskbagheltourandtravels.com/health,https://agraskbagheltourandtravels.com/,https://admin.agraskbagheltourandtravels.com/" npm run healthcheck
   ```

**Never put database, payment, webhook, or service-role secrets in Cloudflare or Vite variables** - frontend builds are public static clients.

---

## 8. Automated Uptime Monitoring

### 8.1 Health Check Script

[`scripts/healthcheck.mjs`](scripts/healthcheck.mjs) performs dependency-free HTTP checks:

```bash
# Default targets (provider-hosted URLs)
npm run healthcheck

# Custom domains
HEALTHCHECK_URLS="https://api.agraskbagheltourandtravels.com/health,https://agraskbagheltourandtravels.com/,https://admin.agraskbagheltourandtravels.com/" npm run healthcheck

# Staging or preview
HEALTHCHECK_URLS="https://my-api.onrender.com/health,https://staging.example.com/,https://staging-admin.example.com/" npm run healthcheck
```

**Available options:**
- `HEALTHCHECK_TIMEOUT_MS` - Timeout in milliseconds
- `HEALTHCHECK_ATTEMPTS` - Number of retry attempts
- `HEALTHCHECK_URLS` - Comma-separated URLs
- `HEALTHCHECK_EXPECTED_STATUS` - Expected HTTP status code

### 8.2 GitHub Actions Uptime Workflow

Runs every 5 minutes to reduce idle spin-down risk on Render Free tier:

```yaml
on:
  schedule:
    - cron: "*/5 * * * *"  # Five-minute checks
```

**Note:** GitHub Actions scheduled runs are best-effort and may be delayed. A failed check appears as a failed workflow run and can be connected to GitHub notifications.

---

## 9. Rollback Strategy

### 9.1 Cloudflare Pages Rollback

Cloudflare Pages keeps previous deployments. To roll back:
1. Go to **Pages → Project → Deployments**
2. Find the last known-good deployment
3. Click **... → Redeploy**

**Never hand-edit a `dist/` tree** - always redeploy from a known-good artifact.

### 9.2 Render Rollback

Render keeps previous deployments. To roll back:
1. Go to **Services → skb-baghel-api → Deployments**
2. Find the last known-good deployment
3. Click **... → Redeploy**

### 9.3 Database Rollback

`backend/migrations/` is **append-only**. See [`backend/DATABASE_MIGRATION_ROLLBACK.md`](backend/DATABASE_MIGRATION_ROLLBACK.md) for the database side of a rollback.

---

## 10. Build Hygiene

### 10.1 Build Output

- **Only** write inside `react/dist`, `admin/dist`, and `backend/dist`
- The **one tracked file** a build rewrites is `react/public/sitemap.xml`
- Never commit `dist/`, `node_modules/`, or `.env*` (except examples)

### 10.2 Secret Management

**Frontend builds are public** - never include:
- `DATABASE_URL`
- `RAZORPAY_KEY_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SUPABASE_JWT_SECRET`
- `MONGODB_URI`
- `CARD_PROVIDER_SECRET`

**CI Guard:** The CI workflow scans `react/dist` and `admin/dist` for secret identifiers and fails the build if found.

### 10.3 Asset Size Budgets

Cloudflare Pages has a **25 MiB per-asset limit**. CI fails the build if any file exceeds this threshold.

---

## 11. Environment Variables

### 11.1 Backend (Render)

| Variable | Sync | Purpose |
|----------|------|---------|
| `NODE_ENV` | No | Set to `production` |
| `PORT` | No | Set to `4000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CORS_ORIGINS` | No | Allowed origins for CORS |
| `ALLOW_TEST_AUTH` | No | Set to `false` in production |
| `API_BASE_URL` | Yes | Backend API URL |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Yes | Supabase JWT secret |
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook secret |
| `LOCATIONIQ_TOKEN` | Yes | LocationIQ API token |
| `RESEND_API_KEY` | Yes | Resend API key |
| `EMAIL_FROM` | No | Email sender address |

### 11.2 Customer Site (Cloudflare Pages)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_RAZORPAY_KEY` | Razorpay key ID |
| `VITE_GA_ID` | Google Analytics ID |
| `VITE_GTAG_ID` | Google Tag Manager ID |

### 11.3 Admin Panel (Cloudflare Pages)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_ADMIN_EMAIL` | Allowed admin email (optional) |

---

## 12. Deployment Checklist

### 12.1 Pre-Deployment

- [ ] Run `npm run verify` (typecheck + tests + build)
- [ ] Verify all environment variables are set
- [ ] Test backend `/health` and `/ready` endpoints
- [ ] Test customer site loads
- [ ] Test admin panel login
- [ ] Verify custom domains are configured
- [ ] Verify SSL/TLS certificates are issued

### 12.2 Deployment

```bash
# Deploy backend (Render auto-deploys from main)
git push origin main

# Deploy customer site
npm run deploy:customer

# Deploy admin panel
npm run deploy:admin
```

### 12.3 Post-Deployment

- [ ] Verify sitemap.xml is accessible
- [ ] Verify robots.txt is accessible
- [ ] Test all routes on customer site
- [ ] Test authentication flow
- [ ] Test booking flow
- [ ] Test payment flow
- [ ] Check PageSpeed Insights scores
- [ ] Check SEO metrics
- [ ] Verify uptime monitoring passes

---

## 13. Troubleshooting

### 13.1 Build Failures

**Error:** `npm ci` fails
- **Fix:** Run `npm install` to regenerate `package-lock.json`, commit changes

**Error:** TypeScript compilation fails
- **Fix:** Run `npm run typecheck` locally to see errors

**Error:** Build output exceeds 25 MiB
- **Fix:** Optimize images, remove unused dependencies, enable code splitting

### 13.2 Runtime Errors

**Error:** Backend `/ready` returns `"store": "memory"`
- **Fix:** Verify `DATABASE_URL` is set in Render environment variables

**Error:** Customer site 404s on deep links
- **Fix:** Verify `react/public/_redirects` exists and has correct rules

**Error:** Admin panel login fails
- **Fix:** Verify `VITE_ADMIN_EMAIL` matches user's email, verify `raw_app_meta_data.role` is `super_admin`

### 13.3 Domain Verification

**Error:** Custom domain verification fails
- **Fix:** Disable Cloudflare proxy temporarily, verify DNS records, re-enable proxy

**Error:** SSL/TLS certificate not issued
- **Fix:** Wait 24 hours, check Cloudflare SSL/TLS settings, verify DNS records

---

## 14. References

### 14.1 Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Production deployment documentation
- [`react/README.md`](react/README.md) - Customer site README
- [`admin/README.md`](admin/README.md) - Admin panel README
- [`backend/README.md`](backend/README.md) - Backend API README

### 14.2 Configuration Files

- [`render.yaml`](render.yaml) - Render service definition
- [`react/cloudflare-pages.toml`](react/cloudflare-pages.toml) - Cloudflare Pages config
- [`admin/cloudflare-pages.toml`](admin/cloudflare-pages.toml) - Cloudflare Pages config
- [`wrangler.jsonc`](wrangler.jsonc) - Cloudflare Workers config

### 14.3 CI/CD Files

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) - CI workflow
- [`.github/workflows/uptime.yml`](.github/workflows/uptime.yml) - Uptime monitoring
- [`.github/workflows/bot-package-updates.yml`](.github/workflows/bot-package-updates.yml) - Bot update verification

### 14.4 Scripts

- [`scripts/healthcheck.mjs`](scripts/healthcheck.mjs) - Health check script
- [`backend/scripts/docker-entrypoint.sh`](backend/scripts/docker-entrypoint.sh) - Docker entrypoint
- [`backend/migrations/`](backend/migrations/) - Database migrations
