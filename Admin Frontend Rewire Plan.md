# Admin Frontend Rewire Plan

**Repository:** `tarun1sisodia/ArenaAI`  
**Baseline:** `main` at `b343f5c`  
**Primary specification:** [`fare-system-final-spec.md`](../../fare-system-final-spec.md)  
**Scope:** Rewire the admin desk to the clean fare-system database, APIs, shared contracts, role rules, audit trail, publishing pipeline, bookings, payments, and reviews. This plan replaces legacy catalog/fare management screens instead of adapting their old vehicle-tier model.

## Walkthrough deltas to carry into implementation

The supplied walkthrough reports the applied production behavior as `max_round_trip_days = 5`, calculated from IST calendar dates, with the clean API used by the customer site under `/api/v1`. It also confirms that publishing preserves archived pages and canonical URLs while excluding drafts from sitemaps, and that the applied backend verification passed 171 fare-system tests plus the repository typecheck/build/SEO pipeline.

The checked-out `main` seed migration already contains `max_round_trip_days = 5`, but the attached final specification still has earlier `2`-day assumption/fixture references. Reconcile the canonical specification/tests with the walkthrough rather than adding an admin-only override. The settings screen must display the backend value and valid range, not a hardcoded ceiling. Likewise, the publishing screen must expose the distinction between an archived-but-crawlable page and a draft-that-is-not-public.

## 1. Goal and operating principles

The admin UI must let authorized staff manage exactly what the customer site can publish and book:

- Four fixed categories: `outstation`, `local_package`, `transfer`, `tour_package`.
- Four fixed vehicle groups: `sedan`, `suv`, `luxury`, `tempo_traveller`; many separately priced vehicle models per group.
- Database-owned rates, allowances, night/halt charges, settings, route prices, product prices, explicit charges, content, and statuses.
- Backend-only authorization and validation; UI permissions are usability, never security.
- Every successful write produces exactly one audit record with before/after state.
- Published content is visible to the customer site; price edits are live through quote APIs, while content/status changes use the publish event pipeline.
- No hard delete of published records; deactivate/archive instead.

## 2. Current baseline and problems to remove

The clean admin contracts and routes exist (`admin/src/contracts/fare-system.ts`, `backend/src/modules/admin/fare-admin.routes.ts`), but the active desk remains dominated by legacy APIs and data models.

### Current conflict inventory

- `admin/src/pages/FaresPage.tsx` still edits a legacy ruleset with vehicle tiers such as `ertiga`, `innova-crysta`, and `urbania`, and calls legacy `/api/v1/ops/admin/fare-rules` endpoints.
- `admin/src/lib/api.ts` maps old fare responses into `FareRuleset`, invents night/hour and driver values, and uses old endpoint prefixes for bookings, catalog, payments, reviews, and audit.
- `admin/src/pages/CatalogPage.tsx`, `TourPackagesPage.tsx`, `LocalTransfersPage.tsx`, and `RoutesPage.tsx` manage legacy `catalog_items`, `route_catalog`, `transfer_routes`, and package structures rather than the clean product tables.
- `admin/src/lib/types.ts` still exposes old `VehicleTier`, catalog availability, promo, and legacy booking selection concepts beside the generated clean contracts.
- `admin/src/modules/routes/routes.api.ts` and UI expose `suggestRouteFares`, which conflicts with fixed one-way route prices and backend-only pricing rules.
- `admin/src/components/admin/Sidebar.tsx` and `App.tsx` route to both legacy and clean screens, with no dedicated vehicles/settings/extra-charges/publishing/audit workflow aligned to the clean spec.
- Some clean write routes exist only as generic endpoints and do not yet have the complete read models needed to render the grids. Those read contracts must be added deliberately; the UI must not reconstruct them from old endpoints.

### Cleanup rule

Do not keep two competing admin editors. Build clean feature modules, point navigation at them, migrate each domain, then remove legacy API functions/types/components once no route imports them. Never silently map a clean `vehicle_model_id` to an old tier key.

## 3. Canonical admin contract boundary

Use generated schemas from `admin/src/contracts/fare-system.ts`, synchronized only from `contracts/fare-system.ts`. Create a typed `admin/src/services/cleanAdminApi.ts` or equivalent with one function per clean endpoint and explicit response schemas.

### Required write functions

- Vehicle models: `POST/PATCH /admin/vehicle-models`, `PATCH /admin/vehicle-models/:id`.
- Vehicle groups: `PATCH /admin/vehicle-groups/:id`.
- Settings: `PATCH /admin/fare-settings/:key`.
- Fare rules: `POST/PATCH /admin/fare-rules` and `/admin/fare-rules/:id`.
- Extra charges: `POST/PATCH /admin/extra-charges` and `/admin/extra-charges/:id`; if the backend lacks patch/deactivate, add it before UI completion.
- Routes: create/update route, `POST /admin/routes/calculate-distance`, and `PUT /admin/routes/:id/vehicles`.
- Products: create/update local packages, transfers, tours, and routes using clean product endpoints.
- Status: `PATCH /admin/<product>/:id/status` for publish/archive.
- Reviews: clean review-link, moderation, per-photo approval, placement, and revoke endpoints.
- Publishing: read event list and retry failed events; add clean read/retry routes if absent.

### Required read models

The clean UI needs backend responses for:

- Active/inactive vehicle groups, all vehicle models, group commercial values, and IDs.
- All settings with current values and valid ranges.
- All fare rules joined to vehicle and product names, with active/inactive state.
- Route detail plus the complete route vehicle grid, including terms and prices.
- Product detail/list with status and content fields.
- Scoped extra charges/notes.
- Clean booking list/detail with frozen fare breakdown and payment state.
- Review submissions/links/photos and publishing events.
- Audit log entries with actor, role, resource, before, after, timestamp, and request ID.

Formalize these response types in the shared `contracts/` package. Do not type clean screens as `any` or reuse old `FareRuleset`/`CatalogItem` types.

## 4. Admin information architecture

Replace the mixed sidebar with clean domain navigation, grouped by responsibility:

1. Overview
2. Bookings
3. Vehicles
4. Fare settings
5. Round-trip rates
6. Outstation routes
7. Local packages
8. Transfers
9. Tour packages
10. Extra charges
11. Reviews
12. Publishing events
13. Audit log
14. Finance/payments (read-only or operations scope as defined)

Keep legacy operational areas only when they are explicitly out of fare-system scope and their APIs remain valid. Remove Promo Codes from the clean fare workflow because v1 has no discounts; preserve it only if another independent product requirement still needs it and it cannot affect clean quotes.

## 5. Feature implementation plans

### 5.1 Vehicles

Create `admin/src/modules/vehicles/` and a `VehiclesPage`.

- Load groups and models from a clean admin read endpoint.
- Show four groups in configured `sort_order` with allowance/day, one-way night charge, halt/night, active state.
- Edit group values through `VehicleGroupPatch`; display that allowance applies only to round trips and night charge applies only to one-way pickup night window.
- Add/edit vehicle models with make, model, display name, passenger capacity, luggage capacity, image, sort order, active state.
- Require group/model IDs from API responses; no tier constants besides the fixed four allowed codes.
- Deactivate instead of delete. Explain that inactive groups/models disappear from customer options and do not modify existing bookings.
- Enforce `super_admin` edit controls in UI, but handle backend `FORBIDDEN` as a first-class error.

### 5.2 Fare settings

Create a dedicated `FareSettingsPage`.

Edit the five keys only:

- `advance_percent`
- `min_km_per_day`
- `max_round_trip_days`
- `night_start_hour`
- `night_end_hour`

Show valid ranges from the schema/table, current value, and impact. The initial approved seed is `advance_percent = 28`, `min_km_per_day = 300`, `max_round_trip_days = 5`, `night_start_hour = 20`, and `night_end_hour = 6`, but these are database values and must remain editable within backend constraints. Any value that can change a customer total must show old/new confirmation. Saving uses `PATCH /admin/fare-settings/:key`; the client never performs a test fare calculation.

### 5.3 Round-trip rates

Create `RoundTripRatesPage` with a table of every vehicle model and its active outstation `fare_rules` row (`all product IDs NULL`).

- Inline edit positive whole INR/km values.
- Distinguish “missing price” from zero; zero is invalid.
- Show inactive/missing rows clearly; missing rates make a car unavailable for round-trip options.
- Confirm old/new values before save.
- After save, invalidate all fare/rate queries and show that the next customer quote uses the new rate immediately.
- Remove all `suggestRouteFares`, per-tier defaults, and client-derived rates.

### 5.4 Outstation routes and route vehicle grid

Create/replace `admin/src/modules/routes/` with clean route types and components.

#### Route editor

- Origin and destination text fields.
- `Calculate distance` calls `POST /admin/routes/calculate-distance`; display resolved origin/destination, road km, duration, and upstream errors.
- Allow manual correction before save.
- Save description, image, gallery, code, and status through the clean route API.
- Enforce published-route requirement for both distance and duration in UI; backend/table CHECK remains authoritative.

#### Route vehicle grid

For every active group/model:

- One-way amount (nullable, positive if present).
- Round-trip enabled.
- One-way inclusions/exclusions.
- Round-trip inclusions/exclusions.
- Sort order and active state.

Submit the complete `RouteVehiclesPut` payload. Validate that a row cannot offer neither trip type. “Apply to group” and “copy lists” are form prefill helpers only; they must not invent prices or bypass per-car rows.

One-way distance is informational; changing route distance must not cause the admin UI to rewrite one-way price.

### 5.5 Local packages, transfers, and tour packages

Create separate clean modules or a shared `ProductEditor` with category-specific fields.

Common fields:

- code, name, description, images/gallery, inclusions, exclusions, highlight, note, status.

Category fields:

- local package: duration hours, included km, covers.
- transfer: pickup name, drop name.
- tour package: duration text, days, nights, source, destination, itinerary.

Each product gets a **price-per-car grid** backed by one active `fare_rules` row per `(category, vehicle_model_id, product_id)`. A car with no active row is not offered. Prices are positive whole rupees and are editable only by `super_admin`.

Publishing flow:

1. Save draft content/price rows.
2. Preview the public template and availability.
3. Confirm publish with validation summary.
4. Call clean status endpoint.
5. Show pending publish event and eventual verified success/failure.

No product editor may write `starting_price_inr`, `distance_km` on old `catalog_items`, old fleet prices, or promo discounts.

### 5.6 Extra charges and notes

Create `ExtraChargesPage`.

- Category scope required.
- Optional product scope and optional vehicle-group scope.
- Label required.
- Amount optional: amount = added quote line; omitted/null = message-only policy text.
- Active/inactive state with no hard delete.
- Explain matching behavior: active + same category + matching product/group scope.
- Prevent duplicate active labels in the same scope and show conflict responses.
- Confirm any charge with an amount because it changes customer totals.
- Preview the exact label as it will appear in `quote.lines` or `quote.messages`; do not calculate a total locally.

### 5.7 Bookings and payments

Replace the current legacy booking mapper and `/api/v1/ops/admin` assumptions with clean booking models.

Booking list/detail must show:

- ticket ID, customer name/contact according to role masking policy, category/product, route, vehicle model/group, passenger count, pickup/return, addresses, status.
- Frozen `fare_breakdown`, line items, total, advance, balance, payment status/order IDs, timestamps.

Rules:

- Never edit price/advance/balance on a booking.
- Dispatch-only status transitions follow the allowed operational state machine; do not recreate fare-system state changes in the UI.
- Mark completed only through the authorized backend action; it triggers the review-request pipeline.
- Payment screens are read-only for finance unless an explicit clean endpoint permits a safe operation; refunds are not part of the clean v1 schema in this plan.

### 5.8 Reviews

Replace legacy catalog-linked review moderation with clean screens:

- create general QR link or booking link;
- show/copy returned URL and QR image;
- filter submissions by pending/approved/rejected;
- inspect safe booking/trip summary;
- edit typo/content fields with before/after audit;
- approve/reject submission;
- set homepage/gallery placement only when consent is true;
- approve/reject individual photos;
- revoke links and resend review requests.

Enforce photo limits and statuses through the backend. The UI must not claim an item is public until the clean public endpoint can return it.

### 5.9 Publishing and audit

Create `PublishingPage` with:

- entity/type, event, status, attempt count, next retry, deployment reference, error, timestamps;
- filters for failed/pending/succeeded;
- retry button only for failed events and a clear resulting status.

Create `AuditPage` using the clean audit model. Every successful write screen should refresh or link to its audit record. Show before/after as structured, redacted JSON—not raw secrets or payment credentials.

## 6. Role-aware UX matrix

| Role | UI behavior |
|---|---|
| `super_admin` | Full vehicles, rates, settings, charges, content, publish, bookings, reviews, publishing, audit access |
| `content_editor` | Product content, route grids excluding price fields, publish/archive; no commercial values |
| `review_moderator` | Review links and moderation only |
| `dispatcher` | Booking operational statuses after confirmation; no pricing/settings edits |
| `finance_operator` | Read-only bookings/payments/frozen fares; no price writes |
| `customer` | Never renders admin app |

Derive visible controls from role, but route every request through backend auth/role checks. `401/403` must invalidate/refresh session or show a precise permission state without retry loops.

## 7. File-level work breakdown

### New/rewired modules

- `admin/src/services/cleanAdminApi.ts` and response schemas.
- `admin/src/modules/vehicles/*` and `admin/src/pages/VehiclesPage.tsx`.
- `admin/src/modules/fare-settings/*` and `FareSettingsPage.tsx`.
- `admin/src/modules/round-trip-rates/*` and `RoundTripRatesPage.tsx`.
- Clean route editor/grid under `admin/src/modules/routes/*`.
- Clean product editor modules under `admin/src/modules/products/*`.
- `admin/src/modules/extra-charges/*` and page.
- Clean booking/payment/review/publishing data hooks and types.
- Shared form primitives for array fields, gallery, currency integers, status, confirmation, and error display.

### Replace/remove

- Replace `admin/src/pages/FaresPage.tsx` and `admin/src/modules/fares/*` legacy ruleset implementation.
- Replace legacy route/catalog/product pages and API methods that target `/api/v1/ops/admin/catalog`, `/api/v1/ops/admin/routes`, old package/transfer endpoints, or old fare rules.
- Remove `VehicleTier`, `FareRuleset`, legacy catalog availability, `suggestRouteFares`, and old promo/fare fields from admin types once no consumer remains.
- Update `admin/src/App.tsx` and `Sidebar.tsx` to clean routes and role-aware navigation.
- Keep `admin/src/contracts/fare-system.ts` generated; never hand-edit generated contracts.

## 8. Contract/API gaps to resolve before UI lock

The main branch contains clean write routes but not a complete documented read surface for all clean admin screens. Before implementing the screens, add and contract-test the missing reads/actions rather than hiding them behind legacy endpoints:

- list/detail endpoints for groups, models, settings, fare rules, extra charges, routes, route vehicles, and each product type;
- patch/deactivate for extra charges;
- create/update endpoints for clean outstation routes and product tables;
- clean booking list/detail and allowed operational transition endpoints;
- clean publishing event list/retry endpoints;
- clean review-link/submission/photo moderation reads/actions;
- consistent response envelope and error shape;
- role enforcement for every clean route, not only UI visibility.

The current `fare-admin.routes.ts` authenticates actors and the service asserts `super_admin` for commercial writes, but this must be verified for every endpoint and every role in the contract test matrix.

## 9. Acceptance and regression matrix

### Admin contract tests

- Anonymous/non-admin clean admin calls return `FORBIDDEN` and create no audit row.
- `content_editor` cannot change prices, rates, settings, charges, or group commercial values.
- Invalid amount, negative charge, unknown setting, invalid code, duplicate active fare rule, duplicate scoped charge, and route row offering neither trip type are rejected.
- Every successful write creates exactly one audit row with actor, role, resource, before, after, and request ID.
- No hard-delete action is available for published products, active vehicles, fare rules, or charges.
- Calculate-distance returns rounded road km/duration and does not persist until route save.
- LocationIQ secret never reaches response/log/frontend bundle.
- Publish with missing route distance/duration is rejected.
- Drafts remain absent from public catalog and sitemap; archive keeps the canonical page available/crawlable with an unavailable notice but makes it unbookable.
- Publishing event is transactionally coupled to publish/status save and retries with visible failure.

### Cross-site behavior tests

- Admin publishes one item in each of the four categories; customer `GET /catalog` returns all four with the same code/name/content.
- Admin adds a vehicle model but no price: customer options omit it.
- Admin adds the exact price row: customer options include it with that model's quote.
- One-way route amount changes affect one-way options only; round-trip rate changes affect round-trip options only.
- Group allowance/night/halt/settings changes affect the next quote exactly as specified.
- Extra charge amount appears as its own quote line; note-only charge appears only in messages.
- Deactivating a car/group/product removes it from new options without changing existing frozen bookings.
- Customer quote option cards and direct quote endpoint agree for every returned car.

### UI checks

- Currency inputs accept whole rupees and never coerce blank values to zero.
- All destructive-looking actions use archive/deactivate language and show impact.
- Price-impacting saves display old/new confirmation.
- Unsaved route grid/product changes warn before navigation.
- Loading, empty, conflict, forbidden, validation, upstream LocationIQ failure, and publish-failed states are visible and retryable.
- Tables remain usable on mobile and preserve accessible labels/keyboard focus.

## 10. Delivery order and definition of done

1. Formalize clean admin read/write response contracts and missing backend reads/actions.
2. Implement clean API client, auth/error handling, query invalidation, and contract tests.
3. Rewire vehicles, settings, and round-trip rates.
4. Rewire routes and route vehicle grid.
5. Rewire local packages, transfers, and tour packages with per-car pricing.
6. Implement extra charges, bookings/payments, reviews, publishing, and audit screens.
7. Replace navigation and delete legacy admin fare/catalog types and API calls.
8. Reconcile the walkthrough's `max_round_trip_days = 5` migration/seed/test state with the checked-out source, then run backend contract/unit tests, admin typecheck/build, customer cross-site smoke tests, sitemap checks, and role matrix tests.
9. Verify the full path: admin creates/publishes service and price → customer sees it → customer gets correct car-specific quote → booking stores frozen fare → payment uses stored advance → admin sees the immutable booking.

**Done means:** the admin desk is a direct client of the clean database/API contract, every customer-visible service is publishable from the clean product model, and no admin screen can accidentally write data that the customer frontend or fare engine interprets through the removed legacy codebase.
