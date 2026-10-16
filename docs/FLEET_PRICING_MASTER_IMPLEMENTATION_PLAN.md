# Fleet Pricing Rewiring — Master Implementation Plan & Testing Matrix

**Document Reference:** `docs/FLEET_PRICING_MASTER_IMPLEMENTATION_PLAN.md`  
**Date:** October 8, 2026  
**Status:** Approved Solid Implementation Plan  
**Supermemory Container Tag:** `sk_baghel_travels`  
**Related Documents:**
- `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md`
- `docs/CURRENT_SYSTEM_AUDIT.md`
- `docs/PRICE_FLOW_AUDIT.md`
- `docs/PRICE_SOURCE_MATRIX.md`
- `docs/CUSTOMER_RENDERING_AUDIT.md`
- `docs/BOOKING_PRICE_AUDIT.md`
- `docs/MIGRATION_PLAN.md`
- `docs/project/DESIGN_LOCKS.md`
- `BACKEND_RULES.md`
- `FRONTEND_RULES.md`

---

## 1. Executive Summary & Objective

The objective is to fix and standardize the commercial fleet pricing flow throughout the **entire platform**:
```text
ADMIN → FARE RULES → DATABASE → PRICING RESOLUTION → CUSTOMER PRESENTATION → BOOKING QUOTE → PAYMENT
```

Currently, Admin Fare Rules update commercial pricing in PostgreSQL (`fare_rules`), but disparate customer marketing pages (`/`, `/routes/`, `/routes/[slug]`, `/packages/`, `/monuments/[slug]`) display hardcoded numbers, static JSON files, or client-side arithmetic (`distance * rate`, `Math.round(total * 0.28)`, `* 1.85`). Furthermore, package booking encounters a UUID lookup bug (`#18`), and monument pages hardcode arbitrary rates (`₹800` Sedan) disconnected from real booking quotes (`₹1,900+`).

**The Master Plan ensures:**
1. A **single pricing authority** per domain.
2. Complete adherence to the **zero client pricing math** rule (Frontend ONLY renders pre-calculated numbers).
3. The **canonical 5 fleets** (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`) normalized across backend, admin, and frontend.
4. Total isolation between **Route Distance Pricing** and **Package Fixed Pricing**.
5. Monument transfers derive from route context, not arbitrary constants.
6. Booking quotes and draft reservations are backed by immutable database snapshots (`bookings.fare_snapshot`).
7. Payments are strictly bound to server-calculated advance tokens (`booking.advanceAmount`).
8. Phased, non-destructive rollout executed one step at a time with full verification (`npm test`, `npm run verify`).

---

## 2. Target Commercial Architecture

```text
                        ADMIN
                          │
                          ▼
                    FLEET MASTER
               (Contract C-ENUM-001)
                          │
                          ▼
                     FARE RULES
             (PostgreSQL: fare_rules)
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
         ROUTE         PACKAGE        LOCAL TOUR
           │              │              │
           ▼              ▼              ▼
      ROUTE PRICE     FIXED PRICE    FIXED PRICE
   (Distance x Rate  (tour_packages. (local_packages.
   + Group Vehicle    fleet_prices)   fleet_prices)
    300km rule)           │              │
           │              │              │
           ▼              │              │
       MONUMENT           │              │
     ROUTE CONTEXT        │              │
           │              │              │
           └──────────────┼──────────────┘
                          │
                          ▼
              NORMALIZED CUSTOMER CONTRACT
                  (FleetPriceOption)
                          │
                          ▼
              CUSTOMER PRESENTATION PAGES
     (/, /routes/*, /packages/*, /monuments/*)
                          │
                          ▼
              AUTHORITATIVE SERVER QUOTE
        (POST /quotes/route, POST /quotes/package)
                          │
                          ▼
              IMMUTABLE BOOKING SNAPSHOT
              (bookings.fare_snapshot)
                          │
                          ▼
                   RAZORPAY PAYMENT
               (booking.advanceAmount)
```

---

## 3. The 16 Non-Negotiable Operational Rules

1. **No business rule changes without approval:** Any deviation from the formulas requires explicit confirmation.
2. **No authoritative prices outside Pricing:** Fares originate strictly from `fare_rules`, `tour_packages`, or `local_packages`.
3. **No frontend pricing math (Zero Client Trust):** Frontend MUST NOT calculate `distance * rate`, minimum distance, round-trip conversions, driver allowances, night charges, tolls, or advance percentages.
4. **No duplicate fleet definitions:** Exactly 5 canonical vehicle tiers (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
5. **No route-specific fleet base rates:** Route catalog defines corridor distance, duration, and toll charges; per-km rates come from active `fare_rules`.
6. **Packages do NOT use route pricing:** Tour packages use fixed commercial package pricing from `tour_packages.fleet_prices`.
7. **Monuments use route context pricing:** Monument transfers derive from corridor distance and route pricing rules; no standalone static constants.
8. **Payment does not determine price:** Payment gateway receives `rupeesToPaise(booking.advanceAmount)` from the persisted booking snapshot.
9. **Client money never authoritative:** Any client-supplied price or advance sent in API payloads is ignored or overwritten.
10. **Do not delete old logic until replacement tests pass:** Strict expand-and-contract rollout.
11. **Do not change public URLs without approval:** Preserve `/routes/[slug]`, `/packages/[slug]`, `/tours/[slug]`, `/monuments/[slug]`.
12. **Do not modify locked visual components:** Respect `docs/project/DESIGN_LOCKS.md` (`LOCK-N01` to `LOCK-N07`).
13. **Razorpay security/idempotency untouched:** Webhook signature verification and idempotency keys remain inviolate.
14. **Every business rule modification requires a test:** Unit and contract tests must cover all logic updates.
15. **Cross-domain dependencies documented:** Keep manifest generation, SSG pre-renderers, and admin revalidation in lockstep.
16. **Stop and report when uncertain:** Cease execution immediately upon unexpected behavior.

---

## 4. Canonical Fleet Master (Contract C-ENUM-001)

### 4.1 Canonical Fleet Codes & Specifications
| Fleet Code (`id`) | Commercial Name | Model Examples | Capacity | Luggage | Base Strategy |
|---|---|---|---|---|---|
| `sedan` | Prime Sedan | Dzire, Etios, Aura | 4 Pax | 2 Bags | Standard Per-Km |
| `ertiga` | Spacious SUV / MUV | Ertiga, XL6, Carens | 6 Pax | 3 Bags | Standard Per-Km |
| `innova-crysta` | Premium Commercial MUV | Innova Crysta | 7 Pax | 4 Bags | Standard Per-Km |
| `tempo-traveller` | Group Executive Minibus | Force Tempo 12–16s | 12–16 Pax | 8+ Bags | Group Commercial (<300km Round Trip + ₹500 DA; >=300km One-Way + ₹500 DA) |
| `urbania` | Luxury Group Van | Force Urbania Luxury | 10–12 Pax | 6+ Bags | Group Commercial (<300km Round Trip + ₹500 DA; >=300km One-Way + ₹500 DA) |

### 4.2 Legacy Normalization Mapper
All readers across backend, admin, and frontend must normalize input keys through `normalizeFleetCode()`:
- `"innova"` → `"innova-crysta"`
- `"innova_crysta"` → `"innova-crysta"`
- `"tempo"` → `"tempo-traveller"`
- `"tempo_traveller"` → `"tempo-traveller"`

---

## 5. Pricing Engine Breakdown & Formulas

### 5.1 Route Pricing Engine (`resolveRouteFleetPrice`)
- **Inputs:** `distanceKm`, `tripType` (`"one-way"` | `"round-trip"`), `fleetCode`, `activeFareRule`, `routeSurcharges` (tolls, state tax), `days`.
- **Formulas:**
  - **Sedan, Ertiga, Innova Crysta:**
    - One-way: `billedDistance = distanceKm`
    - Round-trip: `billedDistance = distanceKm * 2` (or catalog round multiplier)
    - `baseFare = billedDistance * rule.perKm`
    - `total = baseFare + tolls + (driverAllowance * days)`
    - `advance = Math.max(500, Math.round((total * 0.28) / 100) * 100)`
  - **Tempo Traveller & Force Urbania (Group Commercial Strategy):**
    - **Distance < 300 km:**
      - Forced Round-Trip: `billedDistance = distanceKm * 2`
      - `baseFare = billedDistance * rule.perKm`
      - Driver Allowance: `500 * Math.max(1, days)`
      - `total = baseFare + tolls + driverAllowance`
      - `advance = Math.max(500, Math.round((total * 0.28) / 100) * 100)`
    - **Distance >= 300 km:**
      - Billed as per requested `tripType`: `billedDistance = (tripType === "round-trip" ? distanceKm * 2 : distanceKm)`
      - `baseFare = billedDistance * rule.perKm`
      - Driver Allowance: `500 * Math.max(1, days)`
      - `total = baseFare + tolls + driverAllowance`
      - `advance = Math.max(500, Math.round((total * 0.28) / 100) * 100)`

### 5.2 Tour Package Fixed Pricing Engine (`resolvePackageFleetPrice`)
- **Inputs:** `packageCode`, `fleetCode`, `tourPackageRow`.
- **Authority:** `tour_packages.fleet_prices[fleetCode]` or `starting_price_inr`.
- **Formulas:**
  - `total = tourPackageRow.fleet_prices[fleetCode] ?? tourPackageRow.starting_price_inr`
  - `advance = Math.max(500, Math.round((total * 0.28) / 100) * 100)`
  - **Zero route distance arithmetic.**

### 5.3 Local Sightseeing Package Pricing Engine (`resolveLocalPackageFleetPrice`)
- **Inputs:** `packageCode`, `fleetCode`, `localPackageRow`.
- **Authority:** `local_sightseeing_packages.fleet_prices[fleetCode]`.
- **Formulas:** Fixed base package fare for base hours/km; extra rates apply only on overage.

### 5.4 Monument Route-Context Pricing Engine (`resolveMonumentTransferFleetPrice`)
- **Inputs:** `monumentSlug`, `fleetCode`, `pickupLocation`.
- **Formula:** Evaluated as a short transfer route using corridor distance to monument + route pricing engine.

---

## 6. Target Normalized Customer Contract (`FleetPriceOption`)

```typescript
export interface FleetPriceOption {
  fleetCode: "sedan" | "ertiga" | "innova-crysta" | "tempo-traveller" | "urbania";
  fleetName: string;
  price: number;
  advanceAmount: number;
  currency: "INR";
  pricingType: "per-km-route" | "fixed-package" | "local-package" | "special-commercial";
  displayLabel: string; // e.g., "Starting from", "All-Inclusive", "Fixed Package Rate"
  priceSource: "fare_rules" | "tour_packages" | "local_packages";
  breakdown?: {
    billedKm?: number;
    driverAllowance?: number;
    nightAllowance?: number;
    tollNote?: string;
  };
}
```

---

## 7. Phased Implementation Sequence

| Phase | Title | Scope & Files | Key Verification |
|---|---|---|---|
| **Phase 1** | Audit & Master Plan | `docs/FLEET_PRICING_MASTER_IMPLEMENTATION_PLAN.md`, `00_CONTEXT_HANDOFF.md`, `PROGRESS.md`, `02_CHANGE_LEDGER.md` | **COMPLETED** (Supermemory ingested, all 6 audit docs active) |
| **Phase 2** | Fleet Master Normalization | `contracts/enums/vehicle-tiers.ts`, sync to `backend/`, `admin/`, `react/` | **COMPLETED** (Contract C-ENUM-001 extended to snake_case aliases & compound tempo forms; 9/9 contract tests green, 0 drift) |
| **Phase 4** | Route Fleet-Price Resolver | `backend/src/modules/fares/fare.strategy.ts`, `fare.engine.ts` | **COMPLETED** (Distance boundary matrix DIST-01 to DIST-09 verified across 5 fleets: 1, 100, 240, 299, 299.9, 300, 300.1, 350 km; 9/9 boundary tests green) |
| **Phase 5** | Package Fleet-Price Resolver *(Next)* | `backend/src/modules/fares/fare.service.ts`, `tour-packages.service.ts` | Package pricing totally isolated from route rates |
| **Phase 6** | Shared Customer Price Contract | `react/src/contracts/fleet-pricing.ts`, `backend/src/contracts/` | `FleetPriceOption` typecheck across customer & backend |
| **Phase 7** | Homepage Rewire | `react/src/components/home/FleetSection.tsx`, `HomeBookingWidget.tsx` | No hardcoded starting fares (₹3499, ₹6499, ₹9500) |
| **Phase 8** | Routes Listing & Detail Rewire | `react/src/pages/RoutesPage.tsx`, `RouteDetailPage.tsx` | Prices dynamically match distance × active rate |
| **Phase 9** | Monument Transfer Rewire | `react/src/pages/MonumentDetailPage.tsx` | Remove hardcoded `FLEET_SPECIFICATIONS`, route to booking |
| **Phase 10** | Package Detail Rewire | `react/src/pages/PackageDetailPage.tsx`, `DossierTourPackagePage.tsx` | Render fixed package rates; fix booking CTA link |
| **Phase 11** | Fix Package Booking Flow | `backend/src/modules/bookings/booking.service.ts`, `BookingPage.tsx` | Bug #18 resolved (slug/code lookup in `tour_packages`) |
| **Phase 12** | Dedicated Server Quote Endpoints | `backend/src/modules/fares/quotes.controller.ts`, routes | `POST /quotes/route` & `POST /quotes/package` live |
| **Phase 13** | SSG / Revalidation Sync | `backend/src/modules/admin/`, `react/scripts/build-manifest.ts` | Admin updates trigger manifest / rebuild hooks |
| **Phase 14** | Complete Test Suite Verification | `backend/tests/`, `npm run verify` | 100% test pass (32+ suites), 3x clean builds |
| **Phase 15** | Decommission Legacy Math | `react/src/fares.ts` legacy client calculations | Clean deprecation without customer regression |

---

## 8. Complete Testing Matrix (Validation Checklist)

### 8.1 Distance Boundary Test Matrix (All 5 Fleets)
| Test ID | Corridor Distance | Fleet Tier | Expected Billing Logic | Expected Billed Km | Driver Allowance | Expected Advance Token |
|---|---|---|---|---|---|---|
| `DIST-01` | 1 km (Edge) | Sedan | `1 * perKm + tolls` | 1 km | ₹0 | `Math.max(500, round(total * 0.28))` |
| `DIST-02` | 100 km (Short) | Sedan | `100 * perKm + tolls` | 100 km | ₹0 | 28% rounded |
| `DIST-03` | 240 km (Corridor) | Innova Crysta | `240 * perKm + tolls` | 240 km | ₹0 | 28% rounded |
| `DIST-04` | 299 km (Boundary) | Tempo Traveller | **Forced Round-Trip** (`299 * 2 * perKm`) | 598 km | ₹500 / day | 28% rounded |
| `DIST-05` | 299.9 km (Boundary) | Force Urbania | **Forced Round-Trip** (`299.9 * 2 * perKm`) | 599.8 km | ₹500 / day | 28% rounded |
| `DIST-06` | 300.0 km (Boundary) | Tempo Traveller | **One-Way Billed** (`300 * perKm`) | 300 km | ₹500 / day | 28% rounded |
| `DIST-07` | 300.1 km (Boundary) | Force Urbania | **One-Way Billed** (`300.1 * perKm`) | 300.1 km | ₹500 / day | 28% rounded |
| `DIST-08` | 350 km (Long) | Tempo Traveller | **One-Way Billed** (`350 * perKm`) | 350 km | ₹500 / day | 28% rounded |
| `DIST-09` | Multi-Day (2 Days) | Force Urbania | Billed km + `500 * 2` DA | Per rule | ₹1,000 | 28% rounded |

### 8.2 Admin Mutation & Price Propagation Matrix
| Action | Database Table Affected | Expected Public Impact | Forbidden Side Effects |
|---|---|---|---|
| Admin updates Sedan rate (`₹12 → ₹14/km`) | `fare_rules` | All route estimates on `/routes/`, `/routes/[slug]`, and `/book` reflect ₹14/km | Must NOT alter tour package prices; must NOT mutate historical bookings |
| Admin updates Tour Package price | `tour_packages` | Package detail & booking quotes reflect new fixed price | Must NOT alter route per-km rates |
| Admin updates Route Toll Surcharge | `route_catalog` | Route toll adds to total fare for that corridor | Must NOT affect other corridors |

### 8.3 Package Booking & Bug #18 Resolution Matrix
| Input Slug / Code | Target Resolution | Result |
|---|---|---|
| `/book?trip=package&package=golden-triangle-3-day` | Lookup by `package_code` in `tour_packages` | Resolves package successfully, returns authoritative fixed quote |
| `/book?trip=package&package=550e8400-e29b-41d4-a716-446655440000` | Lookup by `id` (UUID) in `tour_packages` | Resolves package successfully |
| Non-existent package code | Error handled gracefully | Returns clean 404 / friendly error; no crash |

### 8.4 Booking Draft & Payment Binding Matrix
| Action | Source of Value | Invariant Check |
|---|---|---|
| `POST /api/v1/bookings/draft` | Server `fareService.calculate()` | Total and advance written to `bookings.total_fare`, `bookings.advance_amount`, and `bookings.fare_snapshot` |
| `POST /api/v1/payments/create-checkout` | `booking.advanceAmount` | Exact minor unit match `rupeesToPaise(booking.advanceAmount)`. Zero client-specified money accepted |
| Razorpay Webhook Confirmation | Signed HMAC signature | Only verified webhook transitions status to `confirmed` / `paid_confirmed` |

### 8.5 Customer UI Surface Parity Matrix
| Page / Surface | Old Bad State | Target Standardized State |
|---|---|---|
| `/` `FleetSection.tsx` | Hardcoded ₹3499, ₹6499, ₹9500 | Live fleet cards reading from active fare baseline contract |
| `/routes/[slug]` `RouteDetailPage.tsx` | Pre-rendered hardcoded fares & client `Math.round(primaryFare * 0.28)` | Dynamic server-derived 5-fleet matrix & server advance token |
| `/packages/[slug]` `PackageDetailPage.tsx` | Client `Math.round(grossPrice * 0.28)` | Fixed package pricing from `tour_packages.fleet_prices` |
| `/monuments/[slug]` `MonumentDetailPage.tsx` | Arbitrary `FLEET_SPECIFICATIONS` (Sedan ₹800) | Corridor route context fare; CTA opens `/book` with matching vehicle & quote |
| `/book` `BookingPage.tsx` | Step 1 client math differences with Step 2 | Step 1 reads server contract; Step 2 authoritative quote matches Step 1 |

---

## 9. Verification Protocol

Before declaring any step or the entire project complete, the following commands must execute cleanly:
```bash
# 1. Focused Unit & Integration Tests
npm test --prefix backend -- --run

# 2. Strict Typecheck Across All 3 Projects
npm run backend:typecheck
npm run admin:typecheck
npm run customer:typecheck

# 3. Monorepo Verification Pipeline (CI equivalent)
npm run verify
```
Criteria for success: 0 lint errors, 0 type errors, 100% test pass rate, and successful build of `backend`, `admin`, and `react` applications.
