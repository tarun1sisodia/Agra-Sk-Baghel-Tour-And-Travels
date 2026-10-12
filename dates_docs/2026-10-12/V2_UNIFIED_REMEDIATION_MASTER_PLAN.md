# ArenaAI: Unified Backend, Admin and Customer Website Remediation Master Plan — V2

**Document Date:** October 12, 2026  
**Repository:** [tarun1sisodia/ArenaAI](https://github.com/tarun1sisodia/ArenaAI)  
**Customer Site:** [SK Baghel Tour & Travels](https://skbagheltravels-customer.coccoder999.workers.dev/)  
**Authoritative Progress Tracker:** [docs/project/04_PROGRESS_TRACKER.md](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/docs/project/04_PROGRESS_TRACKER.md)  
**Reference Trackers:** `docs/project/PROGRESS.md`, `docs/project/AUDIT_PROGRESS.md`  

---

## 1. Executive Summary & Problem Diagnosis

The SK Baghel Tour & Travels platform operates across three applications in a monorepo (`react/`, `admin/`, `backend/`). While the underlying canonical Clean Fare System schema (PostgreSQL migrations `0038`, `0039`, `0040`) and core fare engine (`backend/src/modules/fare-engine/`) are fully implemented and verified, multiple customer-facing pages still rely on **legacy hardcoded content, generated build snapshots, synthetic price multipliers, and unpersisted inquiry actions**.

### 1.1 Confirmed Live Database Inventory (October 12, 2026 Audit)
A live read-only inspection of the Supabase PostgreSQL database confirms the true canonical inventory:
- `outstation_routes`: 4 records (3 published: `agra-to-delhi`, `agra-to-fatehbad-tax-one-way`, `khandoli-to-jewar-one-way`; 1 draft: `agra-to-mathura`)
- `outstation_route_vehicles`: 58 records (19 active pricing associations)
- `vehicle_groups`: 4 records (all 4 active: `sedan`, `suv`, `luxury`, `tempo_traveller`)
- `vehicle_models`: 24 records (all 24 active)
- `fare_rules`: 20 records (all 20 active)
- `local_packages`: 1 record (1 published)
- `transfers`: 1 record (1 published)
- `tour_packages`: 1 record (1 published)
- Legacy `catalog_items`: 11 records (7 published, 3 archived, 1 draft)

### 1.2 The Conflict with Static Build Snapshots & Legacy Manifests
- `react/src/data/generated-catalog.json`: 963 generated route objects from legacy catalogue dictionary.
- `react/public/routes-manifest.json`: 2,060 keys generated via synthetic aliases and bidirectional reverse routes (`d-to-s-taxi`).
- `react/src/data/generated-published-*.json`: Out-of-sync snapshots dated October 8.
- **The Core Mandate:** Runtime UI must never fall back to stale static JSON or synthesize fake prices. Snapshots serve only as build-time SSG pre-render artifacts for SEO and must strictly reflect canonical published data.

---

## 2. Canonical Architecture & Four Service Categories

The entire platform must operate as one coherent data pipeline:
```
ADMIN CMS → CANONICAL DATABASE → PUBLIC API → CUSTOMER UI → QUOTES & BOOKING
```

All customer services map strictly to the **4 canonical product categories**:
1. **01 — Outstation Routes** (`outstation_routes`, `outstation_route_vehicles`, `vehicle_models`, `vehicle_groups`)
   - One-Way: Point-to-point rate from `outstation_route_vehicles.one_way_amount` + night pickup charge (`20:00–06:00`).
   - Round-Trip: Evaluated by `calculateRoundTripOutstation` (`Math.max(2 * km, min_km_per_day * days) * perKm + driver_allowance * days + halt * nights`).
2. **02 — Local Sightseeing** (`local_packages`, `fare_rules`)
   - Fixed packages with defined duration and included km. Fares from `fare_rules(local_package)`.
3. **03 — Airport & Station Transfers** (`transfers`, `fare_rules`)
   - Pickup/drop services with fixed point-to-point pricing from `fare_rules(transfer)`.
4. **04 — Guided Tours & Tour Packages** (`tour_packages`, `fare_rules`)
   - Itinerary-based multi-day packages. Fares from `fare_rules(tour_package)`.

---

## 3. Detailed Audit of Affected Pages & Required Transformations

### 3.1 Customer Routes Page (`RoutesPage.tsx`)
- **Current Defect:** Merges legacy `routes-manifest.json` (2,060 keys), calculates browse estimates via client-side `getIndicativeBrowseFare()`, and `LatestRoutesSection` imports stale `generated-published-routes.json`.
- **Target Transformation:**
  - Load solely from canonical published routes via `/api/v1/catalog/manifest` or `/api/v1/catalog`.
  - Distinguish One-Way and Round-Trip modes; show Round-Trip only when enabled.
  - Remove client fare calculations; route selections hand off to authoritative server quote (`POST /api/v1/quotes/options` or `/quotes`).
  - Wire `LatestRoutesSection` to the same live published query.

### 3.2 Services Page Redesign (`ServicesPage.tsx`)
- **Current Defect:** 6 hardcoded `SERVICES_MODULES` with predetermined prices, arbitrary vehicle labels, and split-image layout.
- **Target Transformation (Awwwards / 21st.dev Luxury Experience):**
  - Replace the 6 static cards with **4 full-image dynamic editorial category sections** (Outstation, Local Sightseeing, Transfers, Tour Packages) sourced from published database records.
  - Retain existing luxury animation tokens: `useScrollReveal`, `--reveal-delay`, terracotta/sandstone palette (`theme.css`).
  - **Scroll Reveal:** Heading appears first, followed by staggered supporting details as the user scrolls.
  - **Hover / Focus / Touch Interaction:** Smooth image scale/zoom with reveal of secondary details layer, highlights, and CTA. Initial title remains legible.
  - Full mobile responsiveness without requiring hover; support reduced-motion preferences.

### 3.3 Homepage Dynamic Content (`HomePage.tsx`)
- **Popular Routes (`PopularRoutes.tsx`):** Replace 4 static slugs with current admin-published routes with separate One-Way/Round-Trip modes.
- **Choose Your Vehicle (`FleetSection.tsx`, `FleetPage.tsx`):** Group active vehicle models by canonical groups (`Sedan`, `SUV`, `Luxury`, `Tempo Traveller`) using live `vehicle_groups` and `vehicle_models`.
- **Guided Tours & Famous Places (`FamousPlacesSection.tsx`, `MonumentsPage.tsx`):** Wire to canonical `tour_packages` and CMS place records.

### 3.4 Reviews & Consented Images (`ReviewsMarquee.tsx`, Reviews Page)
- Unify review workflows using `reviews.service.ts` and `reviews.routes.ts`.
- Enforce full moderation lifecycle: submitted -> admin moderation queue -> approved -> public feed.
- Cap dedicated customer reviews page at **30 real approved reviews**; display only consented images.

### 3.5 Booking Inquiries (`ContactPage.tsx`, Home)
- Current form only launches WhatsApp without database persistence.
- Wire form to `POST /api/v1/inquiries` (`inquiry.routes.ts`) so inquiries persist directly into the admin inbox.
- WhatsApp remains an optional direct contact alternative.

---

## 4. Phased Remediation Roadmap

| Phase | Description | Priority | Status | Exit Gate |
|---|---|---|---|---|
| **Phase 1** | **Canonical Contracts & Backend Reads**<br>Clean `catalog.service.ts` manifest generator; eliminate static `CATALOG_RAW_DATA` baseline, synthetic reverse routes, and multiplier fares; wire `FareCatalogRepository`; purge obsolete upgrade queries. | P0 | **COMPLETED** (2026-10-12) | 192 backend unit tests pass; `npm run verify` green. |
| **Phase 2** | **Services Page Redesign**<br>Replace 6 hardcoded modules with 4 full-image editorial category sections; scroll-reveal & hover/touch card reveal; wire to published records; maintain luxury animation system. | P1 | **NEXT** | No hardcoded service data; mobile/touch accessible; canonical CTA links. |
| **Phase 3** | **Routes Page & Homepage Dynamic Rewiring**<br>Rewire `RoutesPage.tsx`, `InstantRouteCalculator`, and `LatestRoutesSection` to canonical published outstation routes; Popular Routes One-Way/Round-Trip modes; Homepage Vehicle Groups/Models. | P1 | Pending | No static JSON fallback at runtime; zero client price math; live DB routes rendered. |
| **Phase 4** | **Reviews Feed, Gallery & Inquiry Persistence**<br>Unify review moderation feed; enforce 30-review cap on public page; persist booking inquiry forms to `inquiries` table & admin inbox. | P1 | Pending | Inquiries saved to admin inbox; only approved/consented reviews displayed. |
| **Phase 5** | **Build Snapshots, Seed Scripts & End-to-End Verification**<br>Reconcile `build-manifest.ts` and seeds (`seed-routes.ts`, `seed-canonical-catalog.ts`); sweep fallbacks/typos; full monorepo verification & live smoke test. | P0 | Pending | Seeds match schema; SSG build reflects canonical DB; `npm run verify` passes. |

---

## 5. Verification Protocol

Every phase must pass:
1. `npm --prefix backend run typecheck`
2. `npm --prefix react run typecheck`
3. `npm --prefix admin run typecheck`
4. `npm test` (all backend and frontend unit tests)
5. `npm run verify` (monorepo contract CI command)
6. Update [docs/project/04_PROGRESS_TRACKER.md](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/docs/project/04_PROGRESS_TRACKER.md) after each discrete step.
