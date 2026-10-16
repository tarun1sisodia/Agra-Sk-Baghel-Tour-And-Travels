# Contract Registry — ArenaAI (admin ↔ backend ↔ react)

The file-by-file connection map. Every contract lists its source of truth and
every consumer file. If a file is not listed here, it must not touch the contract.
Status: `PILOT` = proven on 2 contracts · `FROZEN` = defined, not yet locked ·
`LOCKED` = CI + CODEOWNERS enforced (see `LOCKED.md`).

## C-ENUM-001 — Canonical vehicle tiers · Status: PILOT
- **Source:** `contracts/enums/vehicle-tiers.ts` (this repo). Generated copies:
  `backend/src/contracts/vehicle-tiers.ts`, `admin/src/contracts/vehicle-tiers.ts`,
  `react/src/contracts/vehicle-tiers.ts` (via `contracts/scripts/sync-contracts.ts`).
- **Values:** `sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`
  (Tarun decision D1, 2026-10-07 — long form; matches DB `vehicle_tier_enum`).
- **Rule:** long form is the ONLY valid key at API boundaries, in zod schemas,
  and in newly written DB rows. Historical short ids (`innova`, `tempo`) are readable
  via `resolveTierKey()` during the data migration, never writable.
- **Consumers (backend):**
  - `backend/src/types/domain.ts` — `VEHICLE_TIERS` (must deep-equal contract)
  - `backend/src/modules/fares/fare.catalogue.ts` — `toVehicleTier()` delegates to contract
  - `backend/src/modules/fares/fare.service.ts` — fleet override lookup (:47), extraRates lookup (:157)
  - `backend/src/modules/fares/fare.engine.ts` — dossier tier-price resolution
  - `backend/src/modules/fares/fare.schema.ts` — `z.enum(VEHICLE_TIERS)` (API boundary)
  - `backend/src/db/dossier-seeds.ts` — seeds use canonical keys
  - `backend/migrations/0034_canonical_fleet_keys.sql` — DB default + data backfill
- **Consumers (admin):** `admin/src/contracts/vehicle-tiers.ts` (synced; `FLEET_KEYS` migration to follow in rollout)
- **Consumers (react):** `react/src/contracts/vehicle-tiers.ts` (synced; fleet constants migration to follow in rollout)
- **Tests:** `backend/tests/contract/vehicle-tiers.contract.test.ts`
- **Docs:** `contracts/docs/vehicle-tiers.tests.md`

## C-API-001 — POST /api/v1/fares/calculate · Status: PILOT
- **Source:** `backend/src/modules/fares/fare.schema.ts`
  (`CalculateFareSchema` request, `FareResponseSchema` response).
- **Contract:** request `.strict()`; `vehicleTier ∈ C-ENUM-001`; server-authoritative
  fare (client distance never trusted — Law 2, BACKEND_RULES.md); response matches
  `FareResponseSchema`; errors use the C-WIRE envelope with `VALIDATION_ERROR`.
- **Consumers:** `backend/src/modules/fares/*`, `react/src/services/*` (fare callers),
  `admin` fare preview callers (rollout).
- **Tests:** `backend/tests/contract/vehicle-tiers.contract.test.ts` (API section) +
  existing `backend/tests/contract/routes.test.ts`
- **Docs:** `contracts/docs/fares-calculate.tests.md`

## C-SCHEMA — DB schema (28 tables / 365 columns) · Status: FROZEN (pilot)
- **Source:** `backend/migrations/*.sql` (0001–0034). Human-readable:
  `arenaai-db-schema-mismatch-audit-2026-10-06.xlsx` → DB_SCHEMA sheet.
- **Rule:** migrations are append-only (Law 6, BACKEND_RULES.md — expand-and-contract).
  Code may not reference columns outside the snapshot (drift test in rollout).
- **Consumers:** `backend/src/db/postgres.ts` (SQL authority), all zod schemas, all
  `*-types.ts` files, admin/react type mirrors.

## C-WIRE — Wire conventions · Status: FROZEN (pilot)
- **Source:** `contracts/WIRE.md`.
- **Covers:** response envelope, camelCase API ↔ snake_case DB, money units
  (paise in DB / rupees on wire), error shape + requestId, auth model.

## C-FLEET-PRICING-001 — Shared Customer Price Contract (`FleetPriceOption`) · Status: PILOT
- **Source:** `contracts/fleet-pricing.ts`. Generated copies:
  `backend/src/contracts/fleet-pricing.ts`, `admin/src/contracts/fleet-pricing.ts`,
  `react/src/contracts/fleet-pricing.ts` (via `contracts/scripts/sync-contracts.ts`).
- **Values / Schema:** `FleetPriceOption` interface and `FleetPriceOptionSchema` (Zod).
  Pins `fleetCode` to canonical `VehicleTier` (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`),
  `price` (number, server total fare), `advanceAmount` (number, server advance deposit), `currency: "INR"`,
  `pricingType` (`per-km-route`, `fixed-package`, `local-package`, `special-commercial`),
  `displayLabel` (string), `priceSource` (`fare_rules`, `tour_packages`, `local_packages`), and optional `breakdown`.
- **Rule:** Server-authoritative calculations only. Customer frontend displays normalized price options
  and never calculates or submits prices, advances, allowances, or distances.
- **Consumers (backend):**
  - `backend/src/contracts/fleet-pricing.ts` (synced)
  - `backend/src/modules/fares/fare.service.ts` / quotes service (rollout in Phase 12)
- **Consumers (admin):**
  - `admin/src/contracts/fleet-pricing.ts` (synced)
- **Consumers (react):**
  - `react/src/contracts/fleet-pricing.ts` (synced)
  - Customer booking & pricing presentation components (rollout in Phases 7–10)
- **Tests:** `backend/tests/unit/contracts.test.ts`

## Rollout queue (after pilot sign-off)
C-ENUM-002 booking statuses · C-ENUM-003 trip types · C-API per module (23 modules) ·
C-SCHEMA drift test (G1) · admin `FLEET_KEYS` → contract · react fleet constants → contract.
