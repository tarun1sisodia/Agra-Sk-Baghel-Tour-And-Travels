# SK Baghel Tour & Travels — Master Canonical Field Registry & Contract Specification

> **Document Status:** Authoritative Architectural Standard & Master Contract Registry  
> **Repository Authority Sources:**  
> - Primary Rebuild Specification: [`fare-system-final-spec.md`](../fare-system-final-spec.md)  
> - Core Locked Contracts: [`contracts/fare-system.ts`](../contracts/fare-system.ts) (`C-CONTRACT-ALL`, locked via [`contracts/LOCKED.md`](../contracts/LOCKED.md))  
> - Database Migrations: [`backend/migrations/0038_fare_system_clean_rebuild.sql`](../backend/migrations/0038_fare_system_clean_rebuild.sql), [`backend/migrations/0039_fare_system_seeds.sql`](../backend/migrations/0039_fare_system_seeds.sql)  
> - Authoritative Engine: [`backend/src/modules/fare-engine/`](../backend/src/modules/fare-engine/) (`calculators/`, `finalizer.ts`, `extra-charges.ts`, `rounding.ts`, `datetime.ts`)  
> - Services & Repositories: [`backend/src/modules/bookings/`](../backend/src/modules/bookings/), [`backend/src/modules/payments/`](../backend/src/modules/payments/), [`backend/src/modules/quotes/`](../backend/src/modules/quotes/), [`backend/src/modules/admin/`](../backend/src/modules/admin/)  
> - Active UI Implementations: [`react/src/services/cleanFareApi.ts`](../react/src/services/cleanFareApi.ts), [`react/src/features/booking/clean/CleanBookingPage.tsx`](../react/src/features/booking/clean/CleanBookingPage.tsx), [`admin/src/services/cleanAdminApi.ts`](../admin/src/services/cleanAdminApi.ts)

---

## 1. Core Architectural Directives & Financial Invariants

### 1.1 Fundamental Operating Directives
1. **Preserve Established Pricing & Behavioral Rules:**  
   The rebuilt clean fare system establishes unambiguous pricing mathematics across all four categories (`outstation`, `local_package`, `transfer`, `tour_package`), four vehicle groups (`sedan`, `suv`, `luxury`, `tempo_traveller`), per-vehicle pricing models, 28% advance deposits, and LocationIQ distance management. These rules must remain completely intact.
2. **Fail-Closed on Financial Boundaries:**  
   Financial amounts must never fall back to an alias, synthetic fallback, or zero (`?? 0`). If an entity row or request payload lacks required financial figures, violates positive integer constraints, or breaches arithmetic invariants, execution fails closed with `DATA_CORRUPTION` (HTTP 500) or `VALIDATION_ERROR` (HTTP 400).
3. **Server-Authoritative Fare Computation:**  
   The client browser or mobile client **never** computes fares, rates, or billable distances. Client requests submit selection parameters (`QuoteRequest`) and optimistic assertions (`quoted_total`). If the recomputed server total deviates by even ₹1, the server rejects booking persistence with `HTTP 409 PRICE_CHANGED`. Client attempts to inject prices, distances, allowances, or advance amounts are stripped and ignored.
4. **Preserve Database History & Expand-and-Contract Migrations:**  
   Historical migrations (`0001`–`0037`) and clean rebuild migrations (`0038`–`0039`) are immutable. No production columns are dropped or mutated without formal expand-and-contract forward migrations.

### 1.2 Mathematical Invariants
Every quote, booking, and payment lifecycle transition must adhere to the following 10 invariants:

| Invariant Code | Mathematical Invariant Formula | Description | Enforcing Layer |
| :--- | :--- | :--- | :--- |
| **INV-1** | $\text{Quote.total} \equiv \sum_{i} \text{lines}[i].\text{amount}$ | Total fare is strictly the sum of all itemized quote lines. | `fare-engine/finalizer.ts` |
| **INV-2** | $\text{Quote.advance} \equiv \min(\text{total}, \text{round\_half\_up}(\text{total} \times \frac{\text{advance\_percent}}{100}))$ | Advance deposit is calculated strictly from global setting (28%), rounded half up. | `fare-engine/finalizer.ts` |
| **INV-3** | $\text{Quote.advance} + \text{Quote.balance} \equiv \text{Quote.total}$ | Advance deposit and balance payable must equal the total fare. Zero discrepancy. | `fare-engine/finalizer.ts`, `mapBooking` |
| **INV-4** | $\text{Payment.amount\_paise} \equiv \text{Booking.advance\_amount} \times 100$ | Razorpay payment order amount in paise is strictly the persisted advance amount in whole rupees $\times 100$. | `payments.service.ts` |
| **INV-5** | $\text{Webhook.amount} \equiv \text{Payment.amount\_paise}$ | Webhook captured amount must match the recorded payment order down to the single paise. Discrepancy triggers `needs_review`. | `payments.service.ts` |
| **INV-6** | $\text{Request.passenger\_count} \le \text{VehicleModel.passenger\_capacity}$ | Passenger count must never exceed the selected vehicle model's seat capacity. | `quotes.service.ts`, `bookings.service.ts` |
| **INV-7** | $\text{Request.pickup\_at} > \text{now()}$ | Pickup datetime must be strictly in the future. | `quotes.service.ts`, `bookings.service.ts` |
| **INV-8** | $\text{Request.return\_at} > \text{Request.pickup\_at}$ | For round-trip outstation, return datetime must be strictly after pickup datetime. | `quotes.service.ts`, `bookings.service.ts` |
| **INV-9** | $\text{RoundTrip.days} \le \text{fare\_settings['max\_round\_trip\_days']}$ | Round trip duration in IST calendar days must not exceed maximum days limit (default 2/5). Exceeding triggers `TRIP_TOO_LONG`. | `quotes.service.ts`, `fare-engine` |
| **INV-10** | $\text{Booking.fare\_breakdown} \equiv \text{Frozen Snapshot}$ | Booking financial values are frozen in `bookings` upon creation and never recomputed post-persistence. | `bookings.repository.ts` |

---

## 2. Canonical Business Entities & Cross-Layer Registry

### 2.1 Vehicle Groups (`vehicle_groups`)
Represents the 4 high-level commercial fleets. Every specific vehicle model belongs to exactly one group.

| Business Concept | PostgreSQL Column (`snake_case`) | Domain Entity (`backend`) | Wire Contract (`contracts/`) | Admin Desk UI (`admin/`) | Customer UI (`react/`) | Data Type & Constraint | Currency Unit | Authoritative Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Group Identifier | `id` | `id` | `id` | `id` | `id` | UUID PK | N/A | PostgreSQL `vehicle_groups.id` |
| Fleet Group Code | `code` | `code` | `group_code` / `code` | `code` | `group_code` | Text (`'sedan' \| 'suv' \| 'luxury' \| 'tempo_traveller'`) | N/A | PostgreSQL CHECK constraint |
| Group Display Name | `name` | `name` | `name` | `name` | `name` | Text (min 1 char) | N/A | PostgreSQL `vehicle_groups.name` |
| Driver Allowance / Day | `driver_allowance_per_day` | `driver_allowance_per_day` | `driver_allowance_per_day` | `driver_allowance_per_day` | `driver_allowance_per_day` | Integer $\ge 0$ (Default 500/700) | INR Whole Rupees | PostgreSQL `vehicle_groups` |
| One-Way Night Charge | `one_way_night_charge` | `one_way_night_charge` | `one_way_night_charge` | `one_way_night_charge` | `one_way_night_charge` | Integer $\ge 0$ (Default 0/250) | INR Whole Rupees | PostgreSQL `vehicle_groups` |
| Round-Trip Halt / Night | `round_trip_halt_per_night` | `round_trip_halt_per_night` | `round_trip_halt_per_night` | `round_trip_halt_per_night` | `round_trip_halt_per_night` | Integer $\ge 0$ (Default 0) | INR Whole Rupees | PostgreSQL `vehicle_groups` |
| Sort Order | `sort_order` | `sort_order` | `sort_order` | `sort_order` | `sort_order` | Integer (Default 0) | N/A | PostgreSQL `vehicle_groups` |
| Commercial Active State | `is_active` | `is_active` | `is_active` | `is_active` | `is_active` | Boolean (Default true) | N/A | PostgreSQL `vehicle_groups` |

---

### 2.2 Vehicle Models (`vehicle_models`)
Represents the actual car model chosen by the customer (e.g. Maruti Dzire, Toyota Innova Crysta, Force Urbania).

| Business Concept | PostgreSQL Column (`snake_case`) | Domain Entity (`backend`) | Wire Contract (`contracts/`) | Admin Desk UI (`admin/`) | Customer UI (`react/`) | Data Type & Constraint | Currency Unit | Authoritative Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Model Identifier | `id` | `id` | `vehicle_model_id` / `id` | `id` | `vehicle_model_id` | UUID PK | N/A | PostgreSQL `vehicle_models.id` |
| Vehicle Group FK | `vehicle_group_id` | `vehicle_group_id` | `vehicle_group_id` | `vehicle_group_id` | N/A | UUID FK `vehicle_groups(id)` | N/A | PostgreSQL FK |
| Manufacturer / Make | `make` | `make` | `make` | `make` | `make` | Text (e.g. 'Toyota', 'Force') | N/A | PostgreSQL `vehicle_models` |
| Internal Model Name | `model_name` | `model_name` | `model_name` | `model_name` | `model_name` | Text (e.g. 'Crysta', 'Urbania') | N/A | PostgreSQL `vehicle_models` |
| Public Display Name | `display_name` | `display_name` | `display_name` | `display_name` | `display_name` | Text (e.g. 'Innova Crysta') | N/A | PostgreSQL `vehicle_models` |
| Passenger Capacity | `passenger_capacity` | `passenger_capacity` | `passenger_capacity` | `passenger_capacity` | `passenger_capacity` | Integer $> 0$ (excludes driver) | Seats | PostgreSQL CHECK constraint |
| Luggage Capacity | `luggage_capacity` | `luggage_capacity` | `luggage_capacity` | `luggage_capacity` | `luggage_capacity` | Integer $\ge 0$ or Null | Bags | PostgreSQL `vehicle_models` |
| Vehicle Photo URL | `image_url` | `image_url` | `image_url` | `image_url` | `image_url` | Text / URL or Null | N/A | PostgreSQL `vehicle_models` |
| Sort Order | `sort_order` | `sort_order` | `sort_order` | `sort_order` | `sort_order` | Integer (Default 0) | N/A | PostgreSQL `vehicle_models` |
| Model Active State | `is_active` | `is_active` | `is_active` | `is_active` | `is_active` | Boolean (Default true) | N/A | PostgreSQL `vehicle_models` |

---

### 2.3 Global Commercial Parameters (`fare_settings`)
Global administrative levers stored in the database.

| Business Concept | PostgreSQL Key (`key`) | PostgreSQL Value (`value`) | Wire Contract Key | Domain Key | Default Value | Unit | Database Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Advance Ratio | `'advance_percent'` | `value` | `'advance_percent'` | `advance_percent` | 28 | Percentage Integer | $1 \le \text{value} \le 100$ |
| Minimum Round-Trip KM/Day | `'min_km_per_day'` | `value` | `'min_km_per_day'` | `min_km_per_day` | 300 | Kilometres / Day | $\text{value} > 0$ |
| Maximum Round-Trip Days | `'max_round_trip_days'` | `value` | `'max_round_trip_days'` | `max_round_trip_days` | 2 (seeded) / 5 (tested) | Calendar Days | $\text{value} > 0$ |
| Night Window Start Hour | `'night_start_hour'` | `value` | `'night_start_hour'` | `night_start_hour` | 20 (8:00 PM IST) | 24-Hour (0–23) | $0 \le \text{value} \le 23$ |
| Night Window End Hour | `'night_end_hour'` | `value` | `'night_end_hour'` | `night_end_hour` | 6 (6:00 AM IST) | 24-Hour (0–23) | $0 \le \text{value} \le 23$ |

---

### 2.4 Products: Outstation Corridors (`outstation_routes` & `outstation_route_vehicles`)

#### `outstation_routes`
| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Admin Desk Field | Customer Field | Data Type & Constraint | Source of Truth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Route Identifier | `id` | `id` | `route_id` / `id` | `id` | `route_id` | UUID PK | PostgreSQL `outstation_routes` |
| Corridor Slug / Code | `code` | `code` | `code` | `code` | `code` | Text (`^[a-z0-9-]{2,80}$`) | PostgreSQL `outstation_routes` |
| Origin Place Name | `origin_name` | `origin_name` | `origin_name` | `origin_name` | `origin_name` | Text | PostgreSQL `outstation_routes` |
| Destination Place Name | `destination_name` | `destination_name` | `destination_name` | `destination_name` | `destination_name` | Text | PostgreSQL `outstation_routes` |
| One-Way Distance | `distance_km` | `distance_km` | `distance_km` | `distance_km` | `distance_km` | Numeric(7,1) $> 0$ | LocationIQ lookup $\to$ Admin |
| Duration Text / Minutes | `duration_minutes` | `duration_minutes` | `duration_minutes` | `duration_minutes` | `duration_minutes` | Integer $> 0$ (Informational) | LocationIQ lookup $\to$ Admin |
| Description Copy | `description` | `description` | `description` | `description` | `description` | Text Nullable | Admin CMS |
| Cover Photo URL | `image_url` | `image_url` | `image_url` | `image_url` | `image_url` | Text Nullable | Admin CMS |
| Media Gallery | `gallery` | `gallery` | `gallery` | `gallery` | `gallery` | JSONB (`string[]`) | Admin CMS |
| Catalog Status | `status` | `status` | `status` | `status` | `status` | Text (`'draft' \| 'published' \| 'archived'`) | Admin CMS |

#### `outstation_route_vehicles`
| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Admin Desk Field | Customer Field | Data Type & Constraint | Currency Unit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Route Vehicle ID | `id` | `id` | `id` | `id` | N/A | UUID PK | N/A |
| Route FK | `route_id` | `route_id` | `route_id` | `route_id` | `route_id` | UUID FK `outstation_routes(id)` | N/A |
| Vehicle Model FK | `vehicle_model_id` | `vehicle_model_id` | `vehicle_model_id` | `vehicle_model_id` | `vehicle_model_id` | UUID FK `vehicle_models(id)` | N/A |
| Flat One-Way Fare | `one_way_amount` | `one_way_amount` | `one_way_amount` | `one_way_amount` | `one_way_amount` | Integer $> 0$ or Null | INR Whole Rupees |
| Round-Trip Enabled | `round_trip_enabled` | `round_trip_enabled` | `round_trip_enabled` | `round_trip_enabled` | `round_trip_enabled` | Boolean (Default true) | N/A |
| Contract Terms | `terms` | `terms` | `terms` | `terms` | `inclusions`/`exclusions` | JSONB (`{ one_way, round_trip }`) | N/A |
| Sort Order | `sort_order` | `sort_order` | `sort_order` | `sort_order` | `sort_order` | Integer (Default 0) | N/A |
| Offering Active State | `is_active` | `is_active` | `is_active` | `is_active` | `is_active` | Boolean (Default true) | N/A |

---

### 2.5 Products: Local Sightseeing Packages (`local_packages`)

| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Customer Field | Data Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Package ID | `id` | `id` | `local_package_id` / `id` | `local_package_id` | UUID PK | Unique Identifier |
| Package Slug / Code | `code` | `code` | `code` | `code` | Text (`^[a-z0-9-]{2,80}$`) | e.g. `'agra-8h-80k'` |
| Package Display Name | `name` | `name` | `name` | `name` | Text | e.g. `'8 hours / 80 km'` |
| Included Duration | `duration_hours` | `duration_hours` | `duration_hours` | `duration_hours` | Integer $> 0$ | Informational policy |
| Included Distance Floor | `included_km` | `included_km` | `included_km` | `included_km` | Integer $> 0$ | Informational policy |
| Monuments Covered | `covers` | `covers` | `covers` | `covers` | Text Nullable | e.g. `'Taj Mahal, Agra Fort'` |
| Inclusions Highlight | `inclusions_highlight` | `inclusions_highlight` | `inclusions_highlight` | `highlights` | Text Nullable | Summary pill text |
| Inclusions Note | `inclusions_note` | `inclusions_note` | `inclusions_note` | `notes` | Text Nullable | Explanatory note |
| Inclusions List | `inclusions` | `inclusions` | `inclusions` | `inclusions` | JSONB (`string[]`) | Include checklist |
| Exclusions List | `exclusions` | `exclusions` | `exclusions` | `exclusions` | JSONB (`string[]`) | Exclude checklist |
| Catalog Status | `status` | `status` | `status` | `status` | Text (`'draft' \| 'published' \| 'archived'`) | Publish gate |

---

### 2.6 Products: Point-to-Point Transfers (`transfers`)

| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Customer Field | Data Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Transfer ID | `id` | `id` | `transfer_id` / `id` | `transfer_id` | UUID PK | Unique Identifier |
| Transfer Slug / Code | `code` | `code` | `code` | `code` | Text (`^[a-z0-9-]{2,80}$`) | e.g. `'agra-to-kheria'` |
| Transfer Name | `name` | `name` | `name` | `name` | Text | e.g. `'Agra Hotel to Kheria Airport'` |
| Pickup Location Name | `pickup_name` | `pickup_name` | `pickup_name` | `pickup_name` | Text | e.g. `'Agra City Hotel'` |
| Drop Location Name | `drop_name` | `drop_name` | `drop_name` | `drop_name` | Text | e.g. `'Kheria Airport (AGR)'` |
| Estimated Duration | `duration_minutes` | `duration_minutes` | `duration_minutes` | `duration_minutes` | Integer Nullable | Informational |
| Estimated Road KM | `distance_km` | `distance_km` | `distance_km` | `distance_km` | Numeric Nullable | Informational |
| Inclusions List | `inclusions` | `inclusions` | `inclusions` | `inclusions` | JSONB (`string[]`) | Include checklist |
| Exclusions List | `exclusions` | `exclusions` | `exclusions` | `exclusions` | JSONB (`string[]`) | Exclude checklist |
| Catalog Status | `status` | `status` | `status` | `status` | Text (`'draft' \| 'published' \| 'archived'`) | Publish gate |

---

### 2.7 Products: Multi-Day Tour Packages (`tour_packages`)

| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Customer Field | Data Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Tour Package ID | `id` | `id` | `tour_package_id` / `id` | `tour_package_id` | UUID PK | Unique Identifier |
| Package Slug / Code | `code` | `code` | `code` | `code` | Text (`^[a-z0-9-]{2,80}$`) | e.g. `'golden-triangle-3d'` |
| Package Display Name | `name` | `name` | `name` | `name` | Text | e.g. `'Golden Triangle Tour'` |
| Duration Text | `duration_text` | `duration_text` | `duration_text` | `duration_text` | Text | e.g. `'3 Days / 2 Nights'` |
| Itinerary Days | `days` | `days` | `days` | `days` | Integer $\ge 1$ | Display only; NOT in fare |
| Itinerary Nights | `nights` | `nights` | `nights` | `nights` | Integer $\ge 0$ | Display only; NOT in fare |
| Tour Origin / Source | `source` | `source` | `source` | `source` | Text (Default 'Agra') | Starting city |
| Tour Destination | `destination` | `destination` | `destination` | `destination` | Text | Primary region |
| Day-by-Day Itinerary | `itinerary` | `itinerary` | `itinerary` | `itinerary` | JSONB (`ItineraryItem[]`) | Detailed timeline |
| Inclusions List | `inclusions` | `inclusions` | `inclusions` | `inclusions` | JSONB (`string[]`) | Included items |
| Exclusions List | `exclusions` | `exclusions` | `exclusions` | `exclusions` | JSONB (`string[]`) | Excluded items |
| Catalog Status | `status` | `status` | `status` | `status` | Text (`'draft' \| 'published' \| 'archived'`) | Publish gate |

---

### 2.8 Master Pricing Rules (`fare_rules`)
Central rule table governing round-trip ₹/km rates and fixed product prices per car model.

| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Constraint | Currency Unit | Rule Meaning by Category |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Rule ID | `id` | `id` | `id` | UUID PK | N/A | Unique rule record |
| Category Code | `category` | `category` | `category` | Text (`'outstation' \| 'local_package' \| 'transfer' \| 'tour_package'`) | N/A | Categorical pricing partition |
| Vehicle Model FK | `vehicle_model_id` | `vehicle_model_id` | `vehicle_model_id` | UUID FK `vehicle_models(id)` | N/A | Specific vehicle model |
| Local Package FK | `local_package_id` | `local_package_id` | `local_package_id` | UUID FK Nullable | N/A | Required if `local_package` |
| Transfer FK | `transfer_id` | `transfer_id` | `transfer_id` | UUID FK Nullable | N/A | Required if `transfer` |
| Tour Package FK | `tour_package_id` | `tour_package_id` | `tour_package_id` | UUID FK Nullable | N/A | Required if `tour_package` |
| **Pricing Amount** | `amount` | `amount` | `amount` | Integer $> 0$ | **INR Whole Rupees** | **Outstation:** ₹/KM rate. **Other:** Fixed ₹ product fare. |
| Active Status | `is_active` | `is_active` | `is_active` | Boolean (Default true) | N/A | Active pricing rule |

---

### 2.9 Extra Charges & Policy Disclaimers (`extra_charges`)

| Business Concept | PostgreSQL Column | Domain Field | Wire Contract Property | Type & Constraint | Currency Unit | System Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Extra Charge ID | `id` | `id` | `id` | UUID PK | N/A | Unique charge record |
| Category Scope | `category` | `category` | `category` | Text (CHECK category) | N/A | Applicable category |
| Vehicle Group Scope | `vehicle_group_id` | `vehicle_group_id` | `vehicle_group_code` | UUID FK Nullable | N/A | Null = applies to all vehicle groups |
| Corridor Scope | `route_id` | `route_id` | `route_id` | UUID FK Nullable | N/A | Scoped outstation route |
| Local Package Scope | `local_package_id` | `local_package_id` | `local_package_id` | UUID FK Nullable | N/A | Scoped local package |
| Transfer Scope | `transfer_id` | `transfer_id` | `transfer_id` | UUID FK Nullable | N/A | Scoped transfer |
| Tour Package Scope | `tour_package_id` | `tour_package_id` | `tour_package_id` | UUID FK Nullable | N/A | Scoped tour package |
| Charge / Note Label | `label` | `label` | `label` / message | Text (min 1 char) | N/A | Customer-facing label / text |
| Charge Amount | `amount` | `amount` | `lines[code='extra_charge'].amount` | Integer $> 0$ or Null | **INR Whole Rupees** | **Amount set:** Added to quote total. **Amount Null:** Added to `QuoteResponse.messages` (₹0). |
| Sort Order | `sort_order` | `sort_order` | `sort_order` | Integer (Default 0) | N/A | Presentation ordering |
| Active State | `is_active` | `is_active` | `is_active` | Boolean (Default true) | N/A | Active status |

---

### 2.10 Bookings Master Persistence (`bookings`)

| Business Concept | PostgreSQL Column (`snake_case`) | Domain Entity (`backend`) | Wire Contract (`BookingDetailResponse`) | Admin Desk Field (`AdminService`) | Type & Constraint | Currency Unit | Fail-Closed Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Booking ID | `id` | `id` | `booking_id` | `id` | UUID PK | N/A | Required |
| Ticket Identifier | `ticket_id` | `ticket_id` | `ticket_id` | `ticketId` | Text Unique (`AGR-YYYYMMDD-XXXX`) | N/A | Unique, server-generated |
| Profile User FK | `user_id` | `user_id` | `user_id` | `userId` | UUID FK Nullable | N/A | Optional (Guest if null) |
| Guest Access Token | `guest_access_token` | `guest_access_token` | Secret | Secret | Text (64 hex characters) | N/A | Required, unique |
| Customer Name | `customer_name` | `customer_name` | `customer_name` | `customerName` | Text | N/A | Required |
| Customer Phone | `customer_phone` | `customer_phone` | `customer_phone` | `customerPhone` | Text | N/A | Required (min 10 digits) |
| Customer Email | `customer_email` | `customer_email` | `customer_email` | `customerEmail` | Text Nullable | N/A | Optional |
| Category Code | `category` | `category` | `category` | `category` | Text (CHECK category) | N/A | Required |
| Vehicle Model FK | `vehicle_model_id` | `vehicle_model_id` | `vehicle_model.id` | `vehicleModelId` | UUID FK `vehicle_models(id)` | N/A | Required |
| Passenger Count | `passenger_count` | `passenger_count` | `passenger_count` | `passengerCount` | Integer $> 0$ | Seats | Must $\le$ model capacity |
| Route FK | `route_id` | `route_id` | `route_id` | `routeId` | UUID FK Nullable | N/A | Required if outstation |
| Local Package FK | `local_package_id` | `local_package_id` | `local_package_id` | `localPackageId` | UUID FK Nullable | N/A | Required if local_package |
| Transfer FK | `transfer_id` | `transfer_id` | `transfer_id` | `transferId` | UUID FK Nullable | N/A | Required if transfer |
| Tour Package FK | `tour_package_id` | `tour_package_id` | `tour_package_id` | `tourPackageId` | UUID FK Nullable | N/A | Required if tour_package |
| Outstation Trip Type | `trip_type` | `trip_type` | `trip_type` | `tripType` | Text (`'one_way' \| 'round_trip'`) | N/A | Required if outstation |
| Pickup Timestamp | `pickup_at` | `pickup_at` | `pickup_at` | `pickupDatetime` | TIMESTAMPTZ | ISO 8601 | Required; future date |
| Return Timestamp | `return_at` | `return_at` | `return_at` | `returnDatetime` | TIMESTAMPTZ Nullable | ISO 8601 | Required if round-trip |
| Pickup Address | `pickup_address` | `pickup_address` | `pickup_address` | `pickupAddress` | Text | N/A | Required |
| Drop Address | `drop_address` | `drop_address` | `drop_address` | `dropAddress` | Text Nullable | N/A | Optional |
| Flight / Train No. | `flight_train_number` | `flight_train_number` | `flight_train_number` | `flightTrainNumber` | Text Nullable | N/A | Optional |
| Special Notes | `special_notes` | `special_notes` | `special_notes` | `specialNotes` | Text Nullable | N/A | Optional |
| Frozen Fare Snapshot | `fare_breakdown` | `fare_breakdown` | `fare_breakdown` | `fareSnapshot` | JSONB (`QuoteResponse`) | N/A | Complete audit snapshot |
| **Total Amount** | `total_amount` | `total_amount` | `total_amount` | `totalFare` | **Integer $> 0$** | **INR Whole Rupees** | **Fail closed: must be $> 0$** |
| **Advance Amount** | `advance_amount` | `advance_amount` | `advance_amount` | `advanceAmount` | **Integer $\ge 0$** | **INR Whole Rupees** | **Fail closed: $\le \text{total}$** |
| **Balance Amount** | `balance_amount` | `balance_amount` | `balance_amount` | `balanceAmount` | **Integer $\ge 0$** | **INR Whole Rupees** | **Generated column: $\text{total} - \text{advance}$** |
| Lifecycle Status | `status` | `status` | `status` | `status` | Text (`'pending_payment' \| 'confirmed' \| 'driver_assigned' \| 'in_transit' \| 'completed' \| 'cancelled'`) | N/A | Required |
| Record Created At | `created_at` | `created_at` | `created_at` | `createdAt` | TIMESTAMPTZ | ISO 8601 | Server timestamp |
| Record Updated At | `updated_at` | `updated_at` | `updated_at` | `updatedAt` | TIMESTAMPTZ | ISO 8601 | Server timestamp |

---

### 2.11 Payments & Gateway Orders (`payments` & `payment_webhook_events`)

#### `payments`
| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Admin Desk Field | Type & Constraint | Currency Unit | Fail-Closed Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Payment ID | `id` | `id` | `payment_id` | `id` | UUID PK | N/A | Required |
| Booking FK | `booking_id` | `booking_id` | `booking_id` | `bookingId` | UUID FK `bookings(id)` | N/A | Required |
| Gateway Provider | `provider` | `provider` | Provider | `provider` | Text (`'razorpay'`) | N/A | Required |
| Provider Order ID | `provider_order_id` | `provider_order_id` | `order_id` | `providerOrderId` | Text Unique (`order_...`) | N/A | Required |
| Provider Payment ID | `provider_payment_id` | `provider_payment_id` | `provider_payment_id` | `providerPaymentId` | Text Unique Nullable (`pay_...`) | N/A | Set on capture |
| **Payment Amount** | `amount_paise` | `amount_paise` | `amount_paise` | `amountMinor` / `amount` (₹ = paise / 100) | **BigInt $> 0$** | **INR Paise** | **Strictly $\text{booking.advance\_amount} \times 100$** |
| Payment Status | `status` | `status` | `status` | `status` | Text (`'pending' \| 'captured' \| 'failed' \| 'needs_review'`) | N/A | Required |
| Failure Reason | `failure_reason` | `failure_reason` | `failure_reason` | `failureReason` | Text Nullable | N/A | Set on failure |
| Record Created At | `created_at` | `created_at` | `created_at` | `createdAt` | TIMESTAMPTZ | ISO 8601 | Server timestamp |
| Record Updated At | `updated_at` | `updated_at` | `updated_at` | `updatedAt` | TIMESTAMPTZ | ISO 8601 | Server timestamp |

#### `payment_webhook_events`
| Business Concept | PostgreSQL Column | Domain Field | Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| Event Record ID | `id` | `id` | UUID PK | Unique audit event |
| Provider Name | `provider` | `provider` | Text (`'razorpay'`) | Payment provider |
| Provider Event ID | `event_id` | `event_id` | Text (`event_...`) | Razorpay event identifier (deduplication key) |
| Event Type | `event_type` | `event_type` | Text (`'payment.captured'`, etc.) | Webhook event type |
| Raw Payload | `payload` | `payload` | JSONB | Complete unmutated webhook body |
| Processed Flag | `processed` | `processed` | Boolean (Default false) | Idempotent execution flag |
| Received Timestamp | `received_at` | `received_at` | TIMESTAMPTZ | Server arrival timestamp |

---

### 2.12 Customer Reviews & Moderation (`review_links`, `review_submissions`, `review_images`)

#### `review_links`
| Business Concept | PostgreSQL Column | Domain Field | Wire Contract | Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Link ID | `id` | `id` | `id` | UUID PK | Unique link record |
| Link Kind | `kind` | `kind` | `kind` | Text (`'qr' \| 'booking'`) | General QR vs verified booking link |
| Token SHA-256 Hash | `token_hash` | `token_hash` | Secret | Text Unique | SHA-256 hash of 128-bit secret token |
| Booking FK | `booking_id` | `booking_id` | `booking_id` | UUID FK `bookings(id)` Nullable | Required if `kind = 'booking'` |
| Optional Label | `label` | `label` | `label` | Text Nullable | Admin tracking note |
| Form Prefill | `prefill` | `prefill` | `prefill` | JSONB | Prefilled name or note |
| Expiration Time | `expires_at` | `expires_at` | `expires_at` | TIMESTAMPTZ Nullable | Link validity cutoff |
| Revocation Time | `revoked_at` | `revoked_at` | `revoked_at` | TIMESTAMPTZ Nullable | Admin manual revocation |
| First Used Time | `used_at` | `used_at` | `used_at` | TIMESTAMPTZ Nullable | Single-use gate for booking links |
| Email Sent Time | `email_sent_at` | `email_sent_at` | `email_sent_at` | TIMESTAMPTZ Nullable | Resend trigger timestamp |
| Email Error Log | `email_last_error` | `email_last_error` | `email_last_error` | Text Nullable | Resend delivery failure log |

#### `review_submissions`
| Business Concept | PostgreSQL Column | Domain Field | Wire Contract (`PublicReviewItem`) | Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Submission ID | `id` | `id` | `id` | UUID PK | Unique submission record |
| Link FK | `link_id` | `link_id` | `link_id` | UUID FK `review_links(id)` | Associated review link |
| Verified Booking FK | `booking_id` | `booking_id` | `booking_id` | UUID FK Nullable | Inherited from link (verified traveler) |
| Author Display Name | `display_name` | `display_name` | `author_name` | Text (min 1 char) | Reviewer's name |
| Star Rating | `rating` | `rating` | `rating` | Integer ($1 \le \text{rating} \le 5$) Nullable | 1–5 stars |
| Review Text Body | `review_text` | `review_text` | `review_text` | Text | Customer review content |
| Tour / Trip Summary | `tour_name` / `route_text`| `tour_name` / `route_text` | `trip_summary` | Text Nullable | Trip or route name |
| Social Network | `social_platform` | `social_platform` | `social_platform` | Text (`'instagram' \| 'facebook' \| 'youtube' \| 'x' \| 'linkedin'`) Nullable | Verified social network |
| Social Handle | `social_username` | `social_username` | Derived `social_url` | Text Nullable | Profile username (no URLs/spaces) |
| Public Display Consent | `consent_public` | `consent_public` | `consent_public` | Boolean | Traveler explicit consent checkbox |
| Moderation Status | `status` | `status` | Moderation State | Text (`'pending' \| 'approved' \| 'rejected'`) | Admin moderation state |
| Homepage Feature Flag | `show_on_homepage` | `show_on_homepage` | Homepage display | Boolean (Default false) | Approved homepage carousel feature |
| Gallery Feature Flag | `show_in_gallery` | `show_in_gallery` | Gallery display | Boolean (Default false) | Approved about-page gallery feature |
| Moderated By FK | `reviewed_by` | `reviewed_by` | Moderator | UUID FK `profiles(id)` Nullable | Staff moderator |
| Moderated Timestamp | `reviewed_at` | `reviewed_at` | Review Time | TIMESTAMPTZ Nullable | Staff approval timestamp |
| Rejection Reason | `rejection_reason` | `rejection_reason` | Rejection Note | Text Nullable | Staff rejection feedback |

---

### 2.13 Publishing Pipeline & Outbox Engine (`site_publish_events` & `url_redirects`)

#### `site_publish_events`
| Business Concept | PostgreSQL Column | Domain Field | Wire Contract (`PublishEventItem`) | Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Event ID | `id` | `id` | `id` | UUID PK | Unique event identifier |
| Published Entity Type | `entity_type` | `entity_type` | `entity_type` | Text (`'outstation_route' \| 'local_package' \| 'transfer' \| 'tour_package' \| 'review'`) | Target catalog domain |
| Published Entity ID | `entity_id` | `entity_id` | `entity_id` | UUID | Foreign key to published record |
| Trigger Event Type | `event_type` | `event_type` | `event_type` | Text (`'published' \| 'updated' \| 'archived' \| 'slug_changed' \| 'price_changed' \| 'review_approved'`) | Nature of publication trigger |
| Outbox Status | `status` | `status` | `status` | Text (`'pending' \| 'processing' \| 'triggered' \| 'succeeded' \| 'failed' \| 'superseded'`) | Processing lifecycle state |
| Retry Counter | `attempt_count` | `attempt_count` | `attempt_count` | Integer $\ge 0$ | Retry attempt counter |
| Next Attempt Time | `next_attempt_at` | `next_attempt_at` | `next_attempt_at` | TIMESTAMPTZ | Exponential backoff schedule |
| Deployment Ref | `deployment_ref` | `deployment_ref` | `deployment_ref` | Text Nullable | Cloudflare build identifier |
| Last Error Message | `last_error` | `last_error` | `error_message` | Text Nullable | Deploy hook error message |

#### `url_redirects`
| Business Concept | PostgreSQL Column | Type & Constraint | Purpose |
| :--- | :--- | :--- | :--- |
| Redirect ID | `id` | UUID PK | Unique redirect entry |
| Source Path | `old_path` | Text Unique | Former slug path (e.g. `'/taxi/agra-delhi'`) |
| Target Path | `new_path` | Text | New destination path (e.g. `'/taxi/agra-to-delhi'`) |
| Created Timestamp | `created_at` | TIMESTAMPTZ | Audit creation date |

---

### 2.14 Admin Audit Trail (`admin_audit_logs`)

| Business Concept | PostgreSQL Column | Domain Field | Wire Contract (`AdminAuditLogItem`) | Type & Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Audit ID | `id` | `id` | `id` | UUID PK | Unique audit entry |
| Staff Actor FK | `actor_id` | `actor_id` | `actor_id` | UUID FK Nullable | Profile of administrator |
| Actor Role | `actor_role` | `actor_role` | `actor_role` | Text | Staff role (`super_admin`, etc.) |
| Action Name | `action` | `action` | `action` | Text | Action verb (`CREATE`, `UPDATE`, `PUBLISH`) |
| Entity Type | `entity_type` | `entity_type` | `entity_type` | Text | Target entity table |
| Entity ID | `entity_id` | `entity_id` | `entity_id` | UUID Nullable | Target entity record ID |
| State Before Change | `before_state` | `before_state` | `before_state` | JSONB Nullable | Pre-modification state snapshot |
| State After Change | `after_state` | `after_state` | `after_state` | JSONB Nullable | Post-modification state snapshot |
| Created Timestamp | `created_at` | `created_at` | `created_at` | TIMESTAMPTZ | Change timestamp |

---

## 3. Customer URL Deep-Link Parameters (`BookingEntryParams`)

The booking funnel supports incoming deep-link parameters from SEO route pages, marketing banners, and external campaigns. All incoming parameters are strictly untrusted inputs, validated and sanitized on mount.

| Query Parameter | Canonical Target | Expected Format | Validation Rule | Deep-Link Fallback Handling |
| :--- | :--- | :--- | :--- | :--- |
| `category` | `category` | Enum | `'outstation' \| 'local_package' \| 'transfer' \| 'tour_package'` | Inferred from `trip=local` or `trip=package` |
| `product` | `product` | String | Slug format: `^[a-z0-9-]{2,80}$` | Auto-resolved from `package`, `pkg`, `route`, or `from`+`to` |
| `trip` | `trip_type` | Enum | `'one_way' \| 'round_trip'` | Maps `tripType=round-trip` $\to$ `'round_trip'` |
| `date` | `pickup_at` (date) | Date | `YYYY-MM-DD` | Defaults to tomorrow in IST |
| `time` | `pickup_at` (time) | 24h Time | `HH:MM` (`^\d{2}:\d{2}$`) | Defaults to `'10:00'` |
| `return_date` | `return_at` (date) | Date | `YYYY-MM-DD` | Required if `trip === 'round_trip'` |
| `return_time` | `return_at` (time) | 24h Time | `HH:MM` (`^\d{2}:\d{2}$`) | Defaults to `'18:00'` |
| `pax` | `passenger_count` | Integer | $\ge 1$ | Auto-parses from `passengers`, `passengerCount` |
| `car` | `vehicle_model_id` | UUID | Valid `vehicle_models.id` | Pre-selects vehicle if eligible |
| `src` | Attribution | String | `^[a-z0-9_]{1,40}$` | Attribution tracking (e.g. `'seo_route_page'`) |

---

## 4. Complete Fare Engine Calculation Specifications

All calculations execute strictly on the backend inside `backend/src/modules/fare-engine/`. All dates and times are evaluated in **Asia/Kolkata (IST)** time, never UTC.

### 4.1 One-Way Outstation Calculation
```
1. base_fare = outstation_route_vehicles.one_way_amount (for this route + this car)
2. pickup_hour = hour_of_day_in_IST(pickup_at)
3. is_night = (pickup_hour >= fare_settings.night_start_hour || pickup_hour < fare_settings.night_end_hour)
4. night_charge = is_night ? vehicle_groups.one_way_night_charge : 0
5. extra_charges = sum of applicable extra_charges (scoped by category, group, or route)
6. total = base_fare + night_charge + extra_charges
7. advance = min(total, round_half_up(total * advance_percent / 100))
8. balance = total - advance
```
*Note:* One-way trips **never** include driver allowance, distance multiplication, or halt charges.

### 4.2 Round-Trip Outstation Calculation
```
1. distance_km = outstation_routes.distance_km (one-way road km)
2. days = date_diff_in_IST_calendar_days(return_at, pickup_at) + 1
3. if (days > fare_settings.max_round_trip_days) throw TRIP_TOO_LONG (HTTP 400)
4. nights = days - 1
5. billable_km = max(2 * distance_km, fare_settings.min_km_per_day * days)
6. base_fare = round_half_up(billable_km * fare_rules.amount)  [where fare_rules.amount = car's ₹/km]
7. driver_allowance = vehicle_groups.driver_allowance_per_day * days  [applies to EVERY round trip, including same-day]
8. halt_charge = vehicle_groups.round_trip_halt_per_night * nights
9. extra_charges = sum of applicable extra_charges
10. total = base_fare + driver_allowance + halt_charge + extra_charges
11. advance = min(total, round_half_up(total * advance_percent / 100))
12. balance = total - advance
```
*Note:* Round-trip trips **never** include pickup-time night charges.

### 4.3 Fixed Product Calculation (Local Package, Transfer, Tour Package)
```
1. base_fare = fare_rules.amount (for this car model + this product)
2. extra_charges = sum of applicable extra_charges
3. total = base_fare + extra_charges
4. advance = min(total, round_half_up(total * advance_percent / 100))
5. balance = total - advance
```
*Note:* Fixed products **never** compute distance, allowances, or night charges. Any extra kilometres or hours beyond the package allowance are collected in cash by the driver per policy notes.

---

## 5. Machine Error Codes & Boundary Guard Rails

| Machine Error Code | HTTP Status | Trigger Condition | Fail-Closed Handling |
| :--- | :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Payload fails Zod contract schema validation. | Execution halts; validation issues returned. |
| `NOT_FOUND` | 404 | Route, product, car model, booking, or payment ID does not exist. | Returns 404 envelope. |
| `PRODUCT_INACTIVE` | 400 | Requested route or package has status `'draft'` or `'archived'`. | Booking or quote blocked. |
| `VEHICLE_NOT_AVAILABLE` | 400 | Selected car model is unpriced, inactive, or not enabled for the corridor. | Booking or quote blocked. |
| `CAPACITY_EXCEEDED` | 400 | `passenger_count > vehicle_models.passenger_capacity`. | Shield rejects booking request. |
| `TRIP_TOO_LONG` | 400 | Round-trip IST calendar `days > fare_settings.max_round_trip_days`. | Shield rejects booking request. |
| `SETTINGS_MISSING` | 500 | Required commercial parameter missing from `fare_settings` table. | Fails closed; defaults rejected. |
| `PRICE_CHANGED` | 409 | Server-recomputed quote total differs from customer's `quoted_total`. | Booking rejected; fresh quote returned for re-confirmation. |
| `INVALID_STATE` | 400 | Attempting to create payment order on booking not in `pending_payment`. | Payment creation rejected. |
| `DATA_CORRUPTION` | 500 | Database entity contains missing, non-positive, or NaN financial figures. | Fails closed immediately without fallback. |
| `GEOCODE_FAILED` | 400 | LocationIQ failed to resolve place names for route distance calculation. | Form remains editable for manual override. |
| `ROUTING_FAILED` | 400 | LocationIQ failed to route driving directions between endpoints. | Form remains editable for manual override. |
| `UPSTREAM_ERROR` | 502 | Upstream network failure with Razorpay or LocationIQ. | Returns 502 with sanitized message. |
