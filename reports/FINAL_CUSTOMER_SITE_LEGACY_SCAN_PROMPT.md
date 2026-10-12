# Final Customer Site Legacy Scan — Agent Prompt

## Mission

Perform a **complete, read-only legacy and contract-drift audit of the entire customer site** under `react/` in the `tarun1sisodia/ArenaAI` repository.

The purpose is to identify every place where the customer site still depends on legacy contracts, legacy APIs, legacy database concepts, duplicated fare calculations, fallback aliases, outdated field names, or response-shape assumptions before any customer-site rewiring begins.

**Do not modify source code, contracts, migrations, generated files, or configuration during this scan.** This is an inventory and evidence-gathering task only.

The final result must allow a later implementation agent to migrate the customer site systematically without guessing and without making hundreds of untracked changes.

---

## Repository and authority order

Work from the repository root:

```text
/home/ubuntu/ArenaAI
```

Read these files before scanning:

1. `docs/CANONICAL_FIELD_REGISTRY.md`
2. `contracts/LOCKED.md`
3. `contracts/fare-system.ts`
4. `contracts/routes.ts`
5. `contracts/local-packages.ts`
6. `contracts/transfer-routes.ts`
7. `contracts/tour-packages.ts`
8. `contracts/product-verticals.ts`
9. `docs/backend/ROUTE_AND_API_INVENTORY.md`
10. `backend/migrations/0038_fare_system_clean_rebuild.sql`
11. `backend/migrations/0039_fare_system_seeds.sql`
12. `backend/migrations/0040_add_catalog_updated_at.sql`
13. `backend/src/modules/fare-engine/`
14. `backend/src/modules/quotes/`
15. `backend/src/modules/bookings/`
16. `backend/src/modules/fare-catalog/`
17. `admin/src/services/cleanAdminApi.ts`
18. `react/src/services/cleanFareApi.ts`

If a source disagrees with another source, record the conflict. Do not silently choose one.

Use this authority order when classifying the intended future state:

1. Locked contracts and canonical field registry
2. Clean fare-engine and clean quote/booking services
3. Clean database migrations `0038+`
4. Clean API route inventory
5. Current clean customer API client
6. Current React implementation
7. Legacy modules, compatibility aliases, static fixtures, and old documentation

---

## Canonical registry rules that must be applied to React

The canonical field registry is not merely a backend reference. Its **Customer UI** column is the target contract for `react/`. For every React field, record both the database/domain spelling and the customer wire spelling. Do not treat a matching concept with a different name as automatically compatible.

### Customer-facing canonical identifiers

| Product/concept | Canonical customer field |
|---|---|
| Outstation route | `route_id`, `code`, `origin_name`, `destination_name`, `distance_km`, `duration_minutes` |
| Local sightseeing package | `local_package_id`, `code`, `name`, `duration_hours`, `included_km`, `highlights`, `notes`, `inclusions`, `exclusions` |
| Point-to-point transfer | `transfer_id`, `code`, `name`, `pickup_name`, `drop_name`, `duration_minutes`, `distance_km`, `inclusions`, `exclusions` |
| Multi-day tour package | `tour_package_id`, `code`, `name`, `duration_text`, `days`, `nights`, `source`, `destination`, `itinerary`, `inclusions`, `exclusions` |
| Vehicle group | `group_code`, `name`, `driver_allowance_per_day`, `one_way_night_charge`, `round_trip_halt_per_night` |
| Vehicle model | `vehicle_model_id`, `display_name`, `passenger_capacity`, `luggage_capacity`, `image_url` |

Explicitly flag React usage of old or ambiguous variants such as `packageCode`, `routeCode`, `transferCode`, `fleetPrices`, `vehicleTier`, `carType`, `totalFare`, `advance`, `balance`, or `amount` when the surrounding contract does not establish the unit and owner.

### Amount ownership and units

The registry defines:

- Product and fare amounts: **whole INR rupees**.
- Booking `total_amount`, `advance_amount`, and `balance_amount`: **whole INR rupees**.
- Payment `amount_paise`: **paise**, strictly equal to persisted `advance_amount * 100`.
- The browser must never convert a quote to paise to decide what to charge. It may display a server-provided payment amount only when the payment contract explicitly requires it.

For every amount in React, record its unit, source, and whether it is a server snapshot or a client calculation. Any variable named only `amount`, `price`, `fare`, `total`, `advance`, or `balance` without a type-level unit or contract source is a P2 finding; if it reaches booking/payment submission it is P0.

### Quote and booking invariant audit

For every quote, booking, and payment flow, verify that React does not violate or recreate these registry invariants:

```text
INV-1: Quote.total = sum(Quote.lines[].amount)
INV-2: Quote.advance = min(total, round_half_up(total * advance_percent / 100))
INV-3: Quote.advance + Quote.balance = Quote.total
INV-4: Payment.amount_paise = Booking.advance_amount * 100
INV-6: passenger_count <= vehicle_model.passenger_capacity
INV-7: pickup_at > now()
INV-8: round-trip return_at > pickup_at
INV-9: round-trip IST calendar days <= max_round_trip_days
INV-10: booking financial values are a frozen server snapshot
```

React must not recompute these formulas. The scan must instead verify that the UI:

1. submits selection inputs and `quoted_total` only where the booking contract requires it;
2. renders the server’s `QuoteResponse` and `BookingDetailResponse` values;
3. handles `PRICE_CHANGED` by requiring a fresh quote/reconfirmation;
4. never assumes `advance + balance` is valid without validating the server response;
5. never rebuilds a booking fare from a stale catalog response or local cache.

### Canonical fixed-product pricing rule

For `local_package`, `transfer`, and `tour_package`, the customer site must treat the server-provided `fare_rules.amount` for the selected `vehicle_model_id` as the fixed base fare. It must not calculate distance, per-kilometre charges, driver allowance, halt charges, or night charges for these categories. Extra charges are server-provided quote lines.

For outstation:

- one-way uses the server-authoritative flat route vehicle fare and applicable night/extra charges;
- round-trip uses the server-authoritative distance, rate, minimum-km policy, driver allowance, halt charge, and extra charges;
- no React code may duplicate either formula.

### Canonical deep-link boundary

Audit the booking-entry boundary against this exact untrusted-input contract:

| Incoming parameter | Canonical target | Required validation |
|---|---|---|
| `category` | `category` | `outstation \| local_package \| transfer \| tour_package` |
| `product` | `product` | slug `^[a-z0-9-]{2,80}$` |
| `trip` | `trip_type` | `one_way \| round_trip`; normalize `round-trip` explicitly |
| `date` | `pickup_at` date | `YYYY-MM-DD` |
| `time` | `pickup_at` time | `HH:MM` |
| `return_date` | `return_at` date | required for round trip |
| `return_time` | `return_at` time | `HH:MM` |
| `pax` | `passenger_count` | integer `>= 1`; only `passengers` and `passengerCount` may be compatibility inputs |
| `car` | `vehicle_model_id` | valid UUID and eligibility checked by server |
| `src` | attribution | lowercase alphanumeric/underscore, max 40 characters |

Record whether normalization happens once at the route boundary. Repeated interpretation of `package`, `pkg`, `route`, `from`, `to`, `tripType`, `passengers`, or `carType` throughout components is contract drift even when the page currently works.

### Canonical error behavior

The audit must verify that customer flows preserve and handle these machine errors instead of flattening them to a generic message or empty result:

```text
VALIDATION_ERROR
NOT_FOUND
PRODUCT_INACTIVE
VEHICLE_NOT_AVAILABLE
CAPACITY_EXCEEDED
TRIP_TOO_LONG
SETTINGS_MISSING
PRICE_CHANGED
INVALID_STATE
DATA_CORRUPTION
GEOCODE_FAILED
ROUTING_FAILED
UPSTREAM_ERROR
```

Any `catch { return [] }`, `catch { return null }`, `catch { return 0 }`, or optional-chain response fallback that hides one of these errors must be reported with the original file and line.

---

## Non-negotiable architectural rules

The scan must enforce these rules:

### Financial rules

- The browser must never calculate fares, billable distance, rates, driver allowance, halt charges, night charges, total amount, advance amount, balance amount, or payment amount.
- The browser may render server-provided numbers and perform display-only formatting.
- No financial fallback may silently use an alias or zero, including:
  - `?? 0`
  - `|| 0`
  - `row.total_amount ?? row.total_fare`
  - `row.advance_amount ?? breakdown.advance`
  - `total || fallback`
  - `Number(value || 0)`
  - `parseFloat(value) || 0`
- Missing required financial data must be reported as a data/contract error, not converted to zero.
- The customer site must use the server-authoritative quote endpoint and must send only selection inputs plus the approved optimistic `quoted_total` assertion where the contract requires it.
- The customer must not submit client-controlled price, distance, allowance, advance, balance, or payment amount fields.

### Canonical product rules

Canonical product categories are:

```text
outstation
local_package
transfer
tour_package
```

Canonical database product tables are:

```text
outstation_routes
local_packages
transfers
tour_packages
fare_rules
vehicle_groups
vehicle_models
fare_settings
extra_charges
```

The following are legacy/deprecated database concepts and must be reported wherever used by customer-site code:

```text
route_catalog
local_sightseeing_packages
transfer_routes
local_tours
catalog_items as a product-pricing source
```

Canonical customer API families are the clean APIs documented in `docs/backend/ROUTE_AND_API_INVENTORY.md`, especially:

```text
/api/v1/catalog
/api/v1/catalog/:category/:code
/api/v1/quotes/options
/api/v1/quotes
/api/v1/bookings
/api/v1/bookings/:id
/api/v1/bookings/:id/payment
```

The following are legacy API families and must be reported wherever called by `react/`:

```text
/api/v1/fares/calculate
/api/v1/fleet
/api/v1/bookings/draft
/api/v1/bookings/:id/confirm
/api/v1/booking-intents/*
/api/v1/payments/create-checkout
/api/v1/payments/:id/status
/api/v1/catalog/legacy
/api/v1/ops/admin/*
```

### Contract rules

- Identify every use of camelCase/snake_case translation.
- Identify every alias that accepts multiple names for one concept.
- Do not assume an alias is harmless: classify it as required compatibility, approved input normalization, response-contract drift, or unsafe ambiguity.
- Record every use of `any`, unchecked casts, `as unknown as`, `Record<string, unknown>`, and unvalidated JSON response access around API or fare data.
- Record every API response unwrap that guesses between shapes, such as:
  - `json.data ?? json`
  - `json.items ?? json.data?.items ?? []`
  - `response.data || response`
  - `row.foo ?? row.bar`
- Record every API request that sends fields not present in the locked contract.

---

## Required scan scope

Scan all files under `react/`, including:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`
- `.json`
- `.css` and style files when they contain API paths or pricing labels
- route configuration
- hooks
- components
- services
- state stores
- context providers
- utilities
- type declarations
- test files
- fixtures and mocks
- static content and SEO data
- build-time loaders
- localStorage/sessionStorage persistence
- URL/deep-link parsing
- payment and checkout code

Also inspect shared contracts and backend definitions whenever needed to prove whether a React usage is canonical or legacy. Do not restrict the evidence search to `react/` if the meaning of a field or endpoint is defined elsewhere.

---

## Scan categories

### 1. API inventory

Build a complete table of every network call in `react/`:

| File | Line | Method | URL/path | Caller | Request body | Response assumption | Classification | Canonical replacement |
|---|---:|---|---|---|---|---|---|---|

Find calls made through:

- `fetch`
- `axios`
- custom API clients
- `cleanFareApi.ts`
- imported shared helpers
- Supabase clients
- payment SDK calls
- server actions or generated clients
- dynamic URL construction

For every call, trace the helper to its actual URL and response transformation.

Classify each call as:

- `CANONICAL`
- `LEGACY_REQUIRES_MIGRATION`
- `COMPATIBILITY_ALLOWED_BUT_ISOLATE`
- `UNKNOWN_REQUIRES_DECISION`
- `DEAD_CODE`

### 2. Fare and price flow

Trace every user journey that can display or submit a price:

- homepage booking widget
- route listing
- route detail
- local package listing/detail
- transfer listing/detail
- tour package listing/detail
- booking page
- vehicle selection
- quote summary
- checkout
- payment launch
- booking confirmation
- booking recovery/status

For every journey document:

```text
input source
→ state variable
→ API call
→ response type
→ transformation
→ displayed amount
→ submitted amount
→ payment amount
```

Flag any client-side computation involving:

- multiplication by distance
- per-km rates
- package prices
- vehicle prices
- driver allowance
- night charges
- halt charges
- tolls
- extra charges
- total
- advance
- balance
- payment paise conversion
- rounding
- percentage calculations

Display-only formatting is allowed, for example `Intl.NumberFormat`, provided it does not create or alter the business value.

### 3. Field and model registry

Extract and classify every business field used by React, especially:

```text
route_id
routeId
code
slug
origin_name
originName
destination_name
destinationName
local_package_id
localPackageId
transfer_id
transferId
tour_package_id
tourPackageId
vehicle_model_id
vehicleModelId
vehicle_group_id
vehicleGroupId
vehicle_tier
fleet_code
fleetCode
total_amount
totalAmount
total_fare
totalFare
advance_amount
advanceAmount
balance_amount
balanceAmount
amount_paise
amountPaise
fare_breakdown
fareBreakdown
quoted_total
quotedTotal
pickup_at
pickupAt
return_at
returnAt
trip_type
tripType
passenger_count
passengerCount
```

For each field, record:

| Field used in React | File/line | Source | Canonical field | Type | Unit | Transformation | Safe? | Required action |
|---|---|---|---|---|---|---|---|---|

Explicitly detect collisions where one UI variable can receive values from multiple unrelated sources.

### 4. Legacy aliases and fallbacks

Search for all nullish, logical, ternary, and parser fallbacks, not only financial ones:

```text
??
||
? :
Number(...)
parseInt(...)
parseFloat(...)
String(...)
Boolean(...)
```

For every fallback, record whether it is:

- safe UI default
- safe missing-display label
- input default allowed by contract
- response compatibility shim
- business-data fallback
- financial fallback
- unsafe silent corruption risk

Do not label a fallback safe merely because it appears in a rendering component.

### 5. URL and deep-link compatibility

Audit:

- query-string parsing
- path parameters
- route slug resolution
- `trip`, `tripType`, `category`, `product`, `package`, `pkg`, `route`, `from`, `to`, `src`, `pax`, `passengers`, `passengerCount`, `car`
- date/time aliases
- localStorage and sessionStorage keys
- navigation state
- SEO links and CTA builders

For each input, identify the canonical normalized target and whether normalization occurs once at the boundary or repeatedly throughout the UI.

### 6. State and persistence

Find all state that stores:

- fare breakdowns
- route/package records
- vehicle selection
- quote identifiers
- booking identifiers
- payment identifiers
- guest access tokens
- cached catalog data
- cached pricing data
- stale legacy response shapes

Record cache key, schema/version handling, invalidation behavior, and whether old cached data can be interpreted as current canonical data.

### 7. Payment and booking integrity

Trace the exact payment flow and report:

- where the quote total comes from
- where the advance comes from
- whether payment amount is derived client-side
- whether the booking endpoint recomputes the quote server-side
- whether the frontend handles `409 PRICE_CHANGED`
- whether the frontend handles `PRODUCT_INACTIVE`, `VEHICLE_NOT_AVAILABLE`, `SETTINGS_MISSING`, and `DATA_CORRUPTION`
- whether payment success is trusted from the browser instead of fetched from the server
- whether booking confirmation uses legacy draft or intent endpoints

### 8. Static data and hardcoded business values

Find hardcoded:

- vehicle names and tiers
- fares and starting prices
- per-km rates
- advance percentages
- minimum kilometres
- maximum days
- night hours
- toll amounts
- driver allowances
- package names/codes
- route distances
- route durations
- product IDs and UUIDs
- legacy API paths

Classify each as:

- UI label only
- test fixture
- seed/demo data
- canonical server data
- forbidden business logic
- dead/obsolete data

### 9. Generated and duplicate contracts

Check whether React imports from:

- `contracts/`
- `react/src/contracts/`
- copied/generated contract files
- `admin/src/contracts/`
- hand-written local interfaces

Compare equivalent types and report drift in:

- field names
- optionality
- enum values
- response envelopes
- amount units
- product category names
- vehicle codes
- date formats

### 10. Error handling

Audit every API error path. Report whether the customer site:

- preserves canonical error codes
- reads the correct error envelope
- displays a useful message
- retries unsafe operations
- silently treats a failed request as an empty list
- converts a 500 response into an empty catalog
- loses `PRICE_CHANGED` details
- retries payment or booking creation without idempotency

Flag patterns such as:

```ts
catch { return []; }
catch { return null; }
catch { return 0; }
response?.data ?? []
```

### 11. Dead and unreachable legacy code

Identify files, exports, components, routes, hooks, and helpers that are no longer imported but still contain legacy fare logic or API calls.

Separate:

- reachable legacy code
- unreachable but dangerous code
- test-only legacy code
- intentionally retained compatibility code
- safe deletion candidates

---

## Required commands

Use multiple focused searches rather than one truncated output. At minimum run commands equivalent to:

```bash
find react -type f | sort
rg -n --hidden --glob '!node_modules' --glob '!dist' \
  '/api/v1|fetch\(|axios|supabase|localStorage|sessionStorage' react
rg -n --hidden --glob '!node_modules' --glob '!dist' \
  'total_amount|totalAmount|total_fare|totalFare|advance_amount|advanceAmount|balance_amount|balanceAmount|amount_paise|amountPaise|quoted_total|quotedTotal' react
rg -n --hidden --glob '!node_modules' --glob '!dist' \
  'route_catalog|local_sightseeing_packages|transfer_routes|local_tours|catalog_items|fares/calculate|fleet|bookings/draft|booking-intents|create-checkout|/ops/admin' react
rg -n --hidden --glob '!node_modules' --glob '!dist' \
  'fare|price|amount|advance|balance|distance|rate|toll|allowance|night|halt|round|multiply|percent|Math\.|Number\(|parseInt|parseFloat' react
rg -n --hidden --glob '!node_modules' --glob '!dist' \
  '\?\?|\|\||\? .*:' react
rg -n --hidden --glob '!node_modules' --glob '!dist' \
  'as any|as unknown|Record<string, unknown>|any\b|JSON\.parse|response\.json' react
```

Also inspect import graphs and run the available customer checks from `package.json`:

```bash
npm --prefix react run typecheck
npm --prefix react run test:catalog-sources
npm --prefix react run test:seo
npm --prefix react run build
```

If dependencies are unavailable, report that clearly and still complete the static scan.

---

## Required final deliverables

Create a Markdown report at:

```text
reports/customer-site-legacy-scan.md
```

The report must contain:

### 1. Executive summary

- total files scanned
- total API calls found
- canonical API calls
- legacy API calls
- client-side financial calculations
- unsafe fallbacks
- contract mismatches
- hardcoded business values
- high-risk flows

### 2. Severity definitions

Use:

- **P0 — Financial or booking integrity risk:** can calculate, charge, or persist an incorrect amount; can submit wrong booking/payment data.
- **P1 — Production migration blocker:** customer flow calls removed table/API/contract or cannot complete a canonical journey.
- **P2 — Contract drift:** wrong field names, response envelope, enum, unit, or unsafe alias that currently works accidentally.
- **P3 — Legacy/dead code:** not currently reachable but must be removed or isolated before deletion.
- **P4 — Documentation/test cleanup:** no production behavior impact.

### 3. Complete API matrix

Include every network call and its evidence.

### 4. Complete field matrix

Include every important business field, aliases, units, and transformations.

### 5. Complete financial-flow matrix

One row per customer journey and fare/payment transition.

### 6. Legacy dependency inventory

Group findings by:

- APIs
- contracts
- models/types
- database concepts
- calculations
- aliases/fallbacks
- URL parameters
- caches
- error handling
- static data
- dead code

### 7. Dependency graph

Show which pages/components/services depend on each legacy helper or API. Use Mermaid if useful.

### 8. Canonical target map

For every legacy item, specify the exact intended replacement:

```text
legacy file/function/API/field
→ canonical file/function/API/field
→ migration strategy
→ dependent callers
→ validation required
```

### 9. Ordered migration plan

Split into small, testable phases:

1. shared contracts and response types
2. API client boundary
3. catalog and route pages
4. local package and transfer pages
5. booking input/state normalization
6. quote flow
7. payment flow
8. booking confirmation/recovery
9. cache invalidation
10. removal of legacy code

Each phase must include:

- files to change
- contracts affected
- backend dependencies
- risk
- tests
- acceptance criteria
- rollback strategy

### 10. Verification checklist

Include exact commands and static assertions that must pass after migration.

### 11. Blockers and decisions required

List only decisions that materially change architecture or data behavior. Do not hide unresolved schema conflicts.

---

## Strict output rules

- Do not make code changes during the scan.
- Do not create compatibility aliases as part of the audit.
- Do not infer that a field is canonical because it is widely used.
- Do not treat a successful TypeScript build as proof of contract correctness.
- Do not report only examples; enumerate all occurrences.
- Include file paths and line numbers for every P0, P1, and P2 finding.
- Distinguish confirmed findings from suspected findings.
- If a result is truncated, rerun the search in smaller ranges.
- Never use `?? 0` or another fallback in the audit tooling to hide missing evidence.
- End with a clear statement of whether the customer site is ready for migration implementation.
