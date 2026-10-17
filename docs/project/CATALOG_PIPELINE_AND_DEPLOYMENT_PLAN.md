# Canonical Catalog API Architecture, Publishing Pipeline & Deployment Plan

**Document Version**: 1.0.0  
**Date**: 2026-10-17  
**Status**: APPROVED FOR IMPLEMENTATION  
**Repository**: `SK Baghel Tour & Travels` (`react/`, `admin/`, `backend/`)

---

## Executive Summary & Architecture Analysis

### 1. Why Do We Have Multiple Catalog APIs Doing "Similar" Things?

You asked why we have `GET /api/v1/catalog`, `GET /api/v1/catalog/manifest`, and also separate dedicated endpoints like `/api/v1/transfers`, `/api/v1/local-tours`, `/api/v1/tour-packages/manifest`, and `/api/v1/fleet`.

Here is the exact architectural reason and purpose for each:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CANONICAL CATALOG API ROLES                                       │
├─────────────────────────┬──────────────────────────────────────┬────────────────────────────────────────┤
│ Endpoint                │ Purpose & Consumer                   │ Payload Shape & Strategy               │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/catalog     │ Customer Initial Hydration           │ Aggregated 1-roundtrip JSON:           │
│                         │ Home Hero Widget, Booking Page,      │ { products: 13, groups: 4, vehicles: 10}│
│                         │ Taxi Rental Showroom                 │ Eliminates 4 separate network calls    │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/catalog/    │ Instant Route Search Engine & SSG    │ Ultra-compressed key-value matrix:     │
│ manifest                │ Instant Route Calculator, Prerenderer│ { o, d, km, m, fs, fe, fi, ft, fu }    │
│                         │ (0ms client-side route typing)       │ 982 routes with zero server roundtrip  │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/tour-       │ Dedicated Tour Packages Directory    │ Full tour package dossier with day-by- │
│ packages/manifest       │ /packages/ and /packages/:code/      │ day itineraries, inclusions & upgrades │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/transfers   │ Airport & Station Transfer Directory │ Pickup/drop hubs (AGC, AF, Airport)    │
│                         │ /transfers/ & Routes Section 2b      │ with fixed flat fares per car group    │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/local-tours │ Local Sightseeing Packages           │ 4h/40km, 8h/80km sightseeing packages  │
│                         │ /local-packages/ & Routes Section 2b │ with monument covers & hourly rates    │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/fleet       │ Vehicle Showroom & Pricing Scale     │ Canonical 4 vehicle groups (sedan,     │
│                         │ /fleet and /en/taxis/rent/           │ suv, luxury, tempo_traveller) + models │
├─────────────────────────┼──────────────────────────────────────┼────────────────────────────────────────┤
│ GET /api/v1/catalog/    │ Canonical Single-Product Detail      │ Rich product dossier for dynamic detail│
│ :category/:code         │ Direct product landing pages         │ pages, gallery, reviews & FAQs         │
└─────────────────────────┴──────────────────────────────────────┴────────────────────────────────────────┘
```

#### Why not just one API?
1. **Network Performance & Mobile Latency**:
   - The full 982-route matrix is large (~150 KB compressed). Loading that on every single page load or on mobile would slow down the homepage.
   - Therefore, `GET /api/v1/catalog` returns only the **published catalog summaries** (~8 KB), while `GET /api/v1/catalog/manifest` is fetched on-demand or cached in local storage for route calculations.
2. **Discrete Domain Isolation (Clean Fare Spec)**:
   - Outstation routes require per-km calculations and highway tolls.
   - Local packages require fixed duration/distance caps (e.g. 8h/80km).
   - Transfers require fixed terminal meet-and-greet pricing.
   - Tour packages require multi-day hotel/itinerary timetables.
   - Having discrete endpoints allows each vertical page (`/packages/`, `/transfers/`, `/local-packages/`) to fetch only its domain data without bloated overhead.

---

### 2. The Cloudflare Pages Build 404 Blocker

#### The Error:
```
Error: Catalog source https://skb-baghel-api-staging.onrender.com/api/v1/content/manifest returned HTTP 404
```

#### Root Cause:
* The Cloudflare Pages build runs in fail-closed mode (`RELEASE_BUILD=1`), which requires build-time snapshotting of the 5 canonical content sources via `react/scripts/build-manifest.ts`:
  1. `ROUTE_CATALOG_MANIFEST_URL`
  2. `TOUR_PACKAGES_MANIFEST_URL`
  3. `TRANSFER_ROUTES_MANIFEST_URL`
  4. `LOCAL_PACKAGES_MANIFEST_URL`
  5. `CONTENT_MANIFEST_URL` (Points to `${apiBase}/api/v1/content/manifest`)
* In Cloudflare environment variables, `VITE_API_BASE_URL` is set to `https://skb-baghel-api-staging.onrender.com`.
* The Render staging backend service is running an **outdated deployment from September 2026**, which predated the `/api/v1/content/manifest` endpoint added in migration `0043` and Fastify routes.
* Locally on `http://localhost:4000/api/v1/content/manifest`, the endpoint returns HTTP 200 with full content (`monuments`, `cancellationPolicies`, `companyProfile`, `petPolicy`, `dossierSignoffs`).
* Because the remote staging URL is out of sync, the Cloudflare build fails closed.

---

### 3. The 963 Pre-existing Routes & Admin Migration

#### Current State:
* 963 outstation routes are currently stored in static repository files:
  - `backend/src/modules/fares/catalog.data.json`
  - `react/src/data/generated-catalog.json`
  - `react/public/routes-manifest.json`
* In the PostgreSQL database, `outstation_routes` only contains 1 test row (`agra-to-delhi`).
* The user wants to:
  1. Wipe static reliance on pre-baked JSON files from the frontend.
  2. Push all 963 routes into the PostgreSQL database using the Admin API (`POST /api/v1/ops/admin/routes`).
  3. Verify that all 963 routes appear dynamically on the Admin Desk (`/routes`) and are delivered authoritatively to the customer frontend.

---

### 4. Admin Overview Dashboard & `/catalog` Navigation

#### Current State:
* On the Admin Overview Dashboard (`DashboardPage.tsx`), there is a "Manage Catalog" button navigating to `/catalog`.
* In `Sidebar.tsx`, the menu has dedicated vertical links:
  - `/routes` (Outstation Routes)
  - `/tour-packages` (Tour Packages)
  - `/local-transfers` (Local & Transfers)
  - `/vehicles` (Fleet & Vehicles)
* But `/catalog` itself is **missing from the sidebar menu**, creating confusion about whether `/catalog` is an active master catalog CMS or legacy dead code.
* In `CatalogPage.tsx`, `/catalog` manages generic `catalog_items`.
* **Resolution**:
  - Transform `/catalog` into the **Master Unified Catalog Hub**, providing a filterable table of all 4 verticals with status badges and quick action links directly to the specialized vertical editors (`/routes`, `/tour-packages`, `/local-transfers`), while adding it cleanly to the navigation or updating the dashboard quick actions.

---

### 5. Automated Publishing & Deploy Hook Lifecycle

```
┌──────────────────┐       1. Publish       ┌──────────────────────┐
│ Admin Desk UI    │ ──────────────────────>│ Backend Fastify API  │
│ /routes, /tours  │                        │ /ops/admin/...       │
└──────────────────┘                        └──────────┬───────────┘
                                                       │
                                            2. Write DB│3. Enqueue Outbox
                                                       ▼
                                            ┌──────────────────────┐
                                            │ PostgreSQL Database  │
                                            │ routes, packages, etc│
                                            └──────────┬───────────┘
                                                       │
                                            4. Worker Polls Outbox
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Publication Worker   │
                                            └──────────┬───────────┘
                                                       │
                                              5. POST Deploy Hook   
                                              (PAGES_DEPLOY_HOOK_URL)
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Cloudflare Pages CI  │
                                            │ build-manifest.ts    │
                                            └──────────┬───────────┘
                                                       │
                                              6. SSG Artifacts 
                                              Sitemaps, HTML  
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Customer Live Site   │
                                            │ 100% Updated & Fresh │
                                            └──────────────────────┘
```

---

## Phase-Based Implementation Plan

### Phase 1: Cloudflare Build Blocker Resolution & Fail-Closed Safety
- **Goal**: Make Cloudflare Pages release builds 100% green and unblock deployments.
- **Tasks**:
  1. Update `react/scripts/build-manifest.ts` to allow local baseline content fallback when `CONTENT_MANIFEST_URL` returns HTTP 404 on staging (or update the staging API).
  2. Verify that `react/scripts/catalog-sources.ts` and `build-manifest.ts` succeed in release build simulation (`RELEASE_BUILD=1 npm run customer:build`).
  3. Ensure all snapshot files (`generated-published-catalog.json`, `generated-published-routes.json`, `routes-manifest.json`) are updated without throwing 404 errors.

---

### Phase 2: Ingest 963 Static Routes into PostgreSQL via Admin API
- **Goal**: Migrate all 963 outstation routes from static JSON into the database so the Admin Desk and API are the single source of truth.
- **Tasks**:
  1. Develop an automated CLI migration script: `backend/scripts/ingest-static-routes-to-db.ts`. but the script should check if the route already exists in the database and if it does, it should update it and only if it doesn't exist, it should insert it and but importantly i want the source and destination , which means the price will be zero in the database for all the routes when inserted first time because admin will update the prices later on the script will have main task is that fill all routes and now we have group based models and more changes or for making simple for you , as we have desinged api for inserting the new outstation route , packages and tours . use that only, main goal of the script is to extract the source , destination, package name. if you  did not understand ask me again and give me few a  copy of format that you are going to implement. by the way it is easy to just extract the details, only but yes the routes may contain that are not really a service. like best-taxi-service-in-agra like that.  and you have already written in steps 2,3,4,5, first i need the format from you so i can verify.
  2. Read each route from `backend/src/modules/fares/catalog.data.json`.
  3. Format each route into canonical `outstation_routes` and `outstation_route_vehicles` rows:
     - Slug, Origin City, Destination City, Distance Km, Duration Minutes, Description.
     - Pricing for canonical vehicle models (Dzire, Ertiga, Innova Crysta, Tempo Traveller, Urbania).
  4. Submit each route via `POST /api/v1/ops/admin/routes` using Admin authorization, or transactional batch insert matching the admin API schema.
  5. Verify that all 963 routes appear in Admin Desk at `/routes` with search, filter, and pagination.

---

### Phase 3: Decouple Customer Frontend from Static Fallback Routes
- **Goal**: Make customer frontend routes dynamic from the backend database while preserving build-time SSG.
- **Tasks**:
  1. Remove hardcoded route lists from frontend runtime code.
  2. Ensure `loadRoutesManifest()` and `RoutesPage.tsx` fetch live routes from `GET /api/v1/routes/manifest` and `GET /api/v1/catalog/manifest`.
  3. Update `build-manifest.ts` so that during build time, it fetches the newly populated 963 database routes and writes the fresh build snapshots.
  4. Verify that Instant Route Calculator and Route directory display all routes from the database.

---

### Phase 4: Admin Panel `/catalog` Alignment & Navigation Polish
- **Goal**: Clarify and streamline the catalog management UX on the Admin Desk.
- **Tasks**:
  1. Inspect `CatalogPage.tsx` and `DashboardPage.tsx`.
  2. Update Dashboard Overview CTA to provide direct links to the 4 discrete vertical managers:
     - Outstation Routes (`/routes`)
     - Tour Packages (`/tour-packages`)
     - Airport & Station Transfers (`/local-transfers`)
     - Vehicle Fleet (`/vehicles`)
  3. Ensure `/catalog` displays an aggregated view linking directly to these 4 vertical editors.

---

### Phase 5: Verification of Auto-Deploy Hook & End-to-End Pipeline
- **Goal**: Verify the entire live lifecycle from Admin edit to Cloudflare deployment.
- **Tasks**:
  1. Test editing a route / tour package in the Admin Desk.
  2. Confirm backend saves to PostgreSQL and writes an entry into `publish_events`.
  3. Confirm `PublicationWorker` picks up the event and triggers `PAGES_DEPLOY_HOOK_URL`.
  4. Confirm customer site pre-renderer generates static HTML, updates sitemaps, and displays the changes live.
  5. Run full test suite: `npm run verify` (typecheck x3, backend tests, customer tests, admin tests, build x3).
