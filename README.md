# Agra SK Baghel Tour & Travels — Monorepo

Agra-based tour and travel operator platform. One repository, three independently
deployable applications:

| Application | Directory | Stack | Dev command | Build output | Production host |
|---|---|---|---|---|---|
| Customer site | [`react/`](./react/) | React 19 + Vite 7, bilingual SSG pre-render | `npm run customer:dev` → http://localhost:5173 | `react/dist` | Cloudflare Pages (`agraskbagheltourandtravels.com`) |
| Operations desk | [`admin/`](./admin/) | React 19 + Vite 7 + Tailwind 4 (Vercel light design system) | `npm run admin:dev` → http://localhost:5174 | `admin/dist` | Cloudflare Pages (`admin.agraskbagheltourandtravels.com`) |
| API | [`backend/`](./backend/) | Fastify 5 + TypeScript, PostgreSQL ledger | `npm run backend:dev` → http://localhost:4000 | `backend/dist` | Render Docker service (`skb-baghel-api-staging.onrender.com`) |

The full topology, provider settings, environment variables, release order and
rollback notes are in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). Read that
before deploying anything.

## Quick start

```bash
npm run install:all     # npm ci for the root and all three workspaces
npm run verify          # typecheck + test + production build for everything
```

Run a single application:

The TestSprite QA context, synthetic fixtures, and separate customer/admin/API
test plans are documented in [`testsprite/README.md`](./testsprite/README.md).

```bash
npm run customer:dev    # customer site   http://localhost:5173
npm run admin:dev       # admin panel     http://localhost:5174
npm run backend:dev     # API             http://localhost:4000
```

## Command contract

These root scripts are the stable interface used by CI and by every host. They
are the only commands that need to be memorised:

| Command | What it does |
|---|---|
| `npm run install:all` | `npm ci` for the root, `react/`, `admin/` and `backend/` (lockfile-enforced) |
| `npm run typecheck` | TypeScript check for all three applications |
| `npm run customer:typecheck` · `admin:typecheck` · `backend:typecheck` | TypeScript check for one application |
| `npm test` | Deterministic backend suite (excludes live-credential DB checks) |
| `npm run backend:test` | Full backend suite, including the DB connectivity checks that need `backend/.env` |
| `npm run build:all` | Production build for all three applications |
| `npm run verify` | Typecheck + tests + build in one shot — the local equivalent of CI |
| `npm run healthcheck` | Dependency-free uptime check of the API, customer site and admin site (`HEALTHCHECK_URLS` overrides the targets; see `docs/DEPLOYMENT.md` §6) |
| `npm run deploy:customer` · `deploy:admin` | Build and publish a frontend to Cloudflare Pages |
| `npm run backend:start` | Run the compiled API (`backend/dist/server.js`) |

[`.github/workflows/quality.yml`](./.github/workflows/quality.yml) runs exactly
these commands, plus deploy guards: build-artifact presence, no server-side
secrets in frontend bundles, per-file Cloudflare asset budget (<25 MiB), and an
admin SPA deep-link fallback check.

## Environment variables

| File | Scope | Notes |
|---|---|---|
| [`.env.example`](./.env.example) | Customer + admin frontends | `VITE_API_BASE_URL` is reserved for the API integration phase — no frontend code reads it yet. `VITE_REACT_MIGRATION_ENABLED` is the migration gate. Only `VITE_*` values may ever be set as Pages variables; everything here is public in the bundle. |
| [`backend/.env.example`](./backend/.env.example) | API only | Copied to `backend/.env` for local work. `DATABASE_URL`, Supabase, Razorpay, webhook, WhatsApp and email secrets live **only** here (or in the Render dashboard), never in a Pages variable. |

`backend/src/config/env.ts` validates the whole server environment with Zod at
boot and refuses to start a production process with missing or insecure values:
it requires `DATABASE_URL` and the Supabase credentials, rejects
`ALLOW_TEST_AUTH=true`, rejects non-HTTPS CORS origins, and requires the Razorpay
secret and webhook secret whenever a Razorpay key id is present.

## Repository layout

```
react/          customer site (src/, public/assets, scripts/prerender.ts, dist output)
admin/          operations desk (src/, public/, dist output)
backend/        API (src/, migrations/, tests/, Dockerfile, dist output)
docs/           DEPLOYMENT.md, PAYMENT_SYSTEM.md, admin/ and backend/ specifications
assets/         brand and photography masters (mirrored into react/public/assets)
design-guide/   approved Dark Navy + Golden design system
scratch/        throwaway QA scripts
```

The customer site is a **bilingual pre-rendered SSG** (`/en/…` and `/hi/…` with
hreflang): `npm run customer:build` runs `tsc`, `vite build` and
`react/scripts/prerender.ts`, which writes fully-formed HTML for every marketing,
route, vehicle, package and hub page, plus `404.html`, `robots.txt` and
`sitemap.xml`. Fares are identical in both languages; `/book.html` is the
client-side booking flow and is `noindex`.

The build only ever writes inside each application's own `outDir`
(`react/dist`, `admin/dist`, `backend/dist`). Generated `sitemap.xml` /
`robots.txt` are mirrored into `react/public/` so they stay versioned with the
source; nothing is written to the repository root.

## Backend API

```bash
cd backend
cp .env.example .env
npm install
npm test
npm run dev
```

`GET /health` is the liveness probe, `GET /ready` the readiness probe (reports
whether it is backed by PostgreSQL or the in-memory store). See
[`backend/README.md`](./backend/README.md) and
[`docs/backend/BACKEND_ARCHITECTURE_PLAN.md`](./docs/backend/BACKEND_ARCHITECTURE_PLAN.md).

PostgreSQL is the ledger; the browser is never trusted for amounts or payment
success. Production runs from [`backend/Dockerfile`](./backend/Dockerfile)
(multi-stage, pruned production dependencies, non-root user) and the Render
blueprint [`render.yaml`](./render.yaml). DevDependencies never reach the runtime
image, and [`backend/.dockerignore`](./backend/.dockerignore) keeps `.env` files
and caches out of the build context.

## Deploying

```bash
# API first
render.yaml → Render service (or VPS Docker + Cloudflare Tunnel)

# then the frontends, pointed at the live API hostname
npm run deploy:customer   # react/dist   → Cloudflare Pages
npm run deploy:admin      # admin/dist   → Cloudflare Pages
```

Deployment order, DNS, Pages build settings, the admin SPA `_redirects`
fallback, and the verification curls are documented in
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## Replacing the photography

Drop the replacement WebP at the same path under
[`react/public/assets/`](./react/public/assets/) (for example
`react/public/assets/fleet/innova.webp`) and rebuild the customer site. Keep the
`-480` / `-768` responsive derivatives in the same folder: the pre-renderer emits
`srcset`/`sizes` against those names, and `<img>` `width`/`height` come from the
asset itself, so a like-for-like replacement keeps Cumulative Layout Shift at
zero.

## History

The original static HTML/CSS/JS site (Python SSG generator, `book.html` app,
GitHub Pages hosting) was retired when the React platform moved into `react/`.
Documents from that era remain under `docs/project/` for reference
(`02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md`, `PRD.md`
and friends); wherever they disagree with this file or `docs/DEPLOYMENT.md`, the
monorepo commands here win.
