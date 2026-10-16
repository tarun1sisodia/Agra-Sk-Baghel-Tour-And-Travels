# Contract changelog

## 0.2.0 — 2026-10-16
- **C-FLEET-PRICING-001 (new):** Shared Customer Price Contract — `FleetPriceOption`.
  Establishes canonical customer presentation shape for server-authoritative fleet pricing.
  Pins `fleetCode` to canonical 5-tier enum (C-ENUM-001: `sedan`, `ertiga`, `innova-crysta`,
  `tempo-traveller`, `urbania`), `price` to server-authoritative total fare, preserves
  server-calculated `advanceAmount`, strictly disallows frontend price/distance calculations,
  and exports `FleetPriceOptionSchema` for API boundaries and runtime validation.

## 0.1.1 — 2026-10-08
- **C-ENUM-001 (extension):** Extended `toCanonicalTierKey()` and `resolveTierKey()`
  to handle snake_case aliases (`innova_crysta`, `tempo_traveller`) and compound forms
  (`tempo-12`, `tempo-16`), and added `normalizeFleetCode()` helper. Zero drift in
  canonical tier keys (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).

## 0.1.0 — 2026-10-07 (pilot)
- **C-ENUM-001 (new, PILOT):** canonical vehicle tiers = long form
  (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
  Decided by Tarun (D1). Matches DB `vehicle_tier_enum` (migration 0002).
  Historical short ids (`innova`, `tempo`) readable via `resolveTierKey()` during
  data migration, never writable.
- **C-API-001 (new, PILOT):** `POST /api/v1/fares/calculate` contract pinned —
  `.strict()` request, `vehicleTier ∈ C-ENUM-001`, `FareResponseSchema` response,
  server-authoritative fare.
- **C-WIRE (new, FROZEN):** envelope, casing, money units, error shape, auth model.
- **C-SCHEMA (FROZEN):** 28 tables / 365 columns from migrations 0001–0033
  (+ 0034 canonical fleet keys).
- **Migration 0034:** `route_catalog.available_fleets` default short → long form;
  backfills existing arrays (expand-and-contract: reads accept both forms via
  `resolveTierKey()`, so this is non-breaking).
- Seeds (`dossier-seeds.ts`): `fleetPrices`/`extraRates` keys and `tierCode`
  migrated short → long form.
