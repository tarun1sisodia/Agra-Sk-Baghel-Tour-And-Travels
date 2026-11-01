# Database Schema & Migration Guide — Agra SK Baghel Tour & Travels

**Document Version:** 2.0.0 (Production Clean-Room Standard)
**Status:** Production-Ready PostgreSQL Schema  
**Last Updated:** 2026-10-31

---

## 1. Executive Summary

This document describes the **correct, production-grade database architecture** for the Agra SK Baghel Tour & Travels platform. It synthesizes lessons from 51 database migrations, identifying both what worked and what failed, and presents a clean, maintainable, and scalable schema.

### Key Principles

| Principle | Correct Approach | What Failed Before |
|-----------|------------------|-------------------|
| **Single Source of Truth** | PostgreSQL only (no MongoDB) | Dual-write conflicts |
| **Server-Authoritative Fares** | Fares calculated on server | Client-side fare manipulation |
| **Immutable Booking State** | State machine with transitions | Direct status updates |
| **Row-Level Security** | RLS policies on all tables | Data leakage risks |
| **Migration-First** | Every schema change is a migration | Ad-hoc schema changes |
| **Standardized Integer Money** | `INTEGER` (Rupees) for business, `BIGINT` (Paise) for Razorpay | FLOAT/NUMERIC for currency |

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Database** | PostgreSQL | 15+ |
| **Extensions** | uuid-ossp, pgcrypto | Latest |
| **ORM** | pg (node-postgres) | 8.16.3 |
| **Auth** | Supabase Auth | 2.57.4 |
| **Migrations** | SQL files in `backend/migrations/` | - |

---

## 3. Money Standardization

All monetary amounts use **integer types** to avoid floating-point precision errors:

| Data Type | Use Case | Example |
|-----------|----------|---------|
| `INTEGER` | All business amounts (Rupees) | `base_fare`, `total_fare`, `advance_amount`, `discount_amount` |
| `BIGINT` | Razorpay gateway amounts (Paise) | `amount_paise = advance_amount * 100` |

**Rules:**
- Never use `FLOAT`, `REAL`, or `NUMERIC` for currency
- All business tables use `INTEGER` for INR Rupees
- Razorpay tables use `BIGINT` for Indian Paise (`amount_paise = advance_amount * 100`)

---

## 4. Database Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL Database                                 │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Tables by Domain                                                    │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Authentication & Users                                        │  │   │
│  │  │  - auth.users (Supabase managed)                               │  │   │
│  │  │  - profiles (user profiles)                                    │  │   │
│  │  │  - device_registrations (FCM tokens)                           │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Bookings & Payments                                           │  │   │
│  │  │  - bookings (trip reservations)                                │  │   │
│  │  │  - payments (payment records)                                  │  │   │
│  │  │  - refunds (refund tracking)                                   │  │   │
│  │  │  - payment_webhook_events (webhook processing)                 │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Catalog & Content                                             │  │   │
│  │  │  - vehicle_groups (fleet categories)                           │  │   │
│  │  │  - vehicle_models (specific vehicles)                          │  │   │
│  │  │  - outstation_routes (long-distance routes)                    │  │   │
│  │  │  - local_packages (sightseeing packages)                       │  │   │
│  │  │  - tour_packages (multi-day tours)                             │  │   │
│  │  │  - transfer_routes (airport/station transfers)                 │  │   │
│  │  │  - monuments (sightseeing spots)                               │  │   │
│  │  │  - cancellation_policies (refund rules)                        │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Reviews & Feedback                                            │  │   │
│  │  │  - reviews (customer reviews)                                  │  │   │
│  │  │  - review_media (review images)                                │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Business Logic                                                │  │   │
│  │  │  - fare_settings (global configuration)                        │  │   │
│  │  │  - promo_codes (discount codes)                                │  │   │
│  │  │  - publication_outbox (content deployment)                     │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  System & Audit                                                │  │   │
│  │  │  - admin_audit_logs (admin actions)                            │  │   │
│  │  │  - notification_jobs (email/SMS queue)                         │  │   │
│  │  │  - inquiries (contact form submissions)                        │  │   │
│  │  │  - location_cache (geocoding cache)                            │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Tables Schema

### 4.1 Authentication & Users

#### `auth.users` (Supabase Managed)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | TEXT | Unique email address |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |

#### `profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` |
| `full_name` | TEXT | User's full name |
| `phone` | VARCHAR(20) | Unique phone number |
| `email` | VARCHAR(255) | Optional email |
| `role` | user_role_enum | User role (customer, admin, etc.) |
| `created_at` | TIMESTAMPTZ | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Enums:**
```sql
CREATE TYPE user_role_enum AS ENUM (
    'customer', 'content_editor', 'review_moderator', 
    'dispatcher', 'finance_operator', 'super_admin'
);
```

#### `device_registrations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `booking_id` | UUID | References `bookings(id)` |
| `device_id` | VARCHAR(100) | Device identifier |
| `platform` | VARCHAR(20) | android, ios, web |
| `fcm_token` | TEXT | Firebase Cloud Messaging token |
| `is_active` | BOOLEAN | Active device flag |
| `last_seen_at` | TIMESTAMPTZ | Last activity timestamp |
| `created_at` | TIMESTAMPTZ | Registration timestamp |

---

### 4.2 Bookings & Payments

#### `bookings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ticket_id` | VARCHAR(30) | Unique booking ID (format: `AGR-YYYYMMDD-XXXX`) |
| `user_id` | UUID | References `profiles(id)` |
| `guest_access_token` | VARCHAR(64) | Guest booking access token |
| `trip_type` | trip_type_enum | one-way, round-trip, local-tour, airport-transfer |
| `vehicle_group_id` | UUID | References `vehicle_groups(id)` |
| `vehicle_model_id` | UUID | References `vehicle_models(id)` |
| `origin_name` | TEXT | Pickup location name |
| `destination_name` | TEXT | Drop-off location name |
| `pickup_address` | TEXT | Full pickup address |
| `drop_address` | TEXT | Full drop-off address |
| `pickup_datetime` | TIMESTAMPTZ | Trip start datetime |
| `return_datetime` | TIMESTAMPTZ | Return datetime (round-trip only) |
| `distance_km` | NUMERIC(8,2) | Trip distance in km |
| `customer_name` | TEXT | Customer name |
| `customer_phone` | VARCHAR(20) | Customer phone |
| `customer_email` | VARCHAR(255) | Customer email |
| `base_fare` | INTEGER | Base fare in INR Rupees |
| `night_allowance` | INTEGER | Night charge in INR Rupees |
| `driver_allowance` | INTEGER | Driver allowance in INR Rupees |
| `discount_amount` | INTEGER | Promo discount in INR Rupees |
| `promo_code` | VARCHAR(30) | Applied promo code |
| `total_fare` | INTEGER | Total fare in INR Rupees |
| `advance_amount` | INTEGER | Advance deposit in INR Rupees (min ₹500) |
| `balance_amount` | INTEGER | Balance to pay on trip in INR Rupees |
| `fare_rules_version` | VARCHAR(20) | Fare rule version used |
| `fare_snapshot` | JSONB | Full fare breakdown |
| `status` | booking_status_enum | Booking status |
| `version` | INT | Optimistic lock version |
| `special_notes` | TEXT | Customer notes |
| `package_id` | UUID | References `tour_packages(id)` |
| `balance_collected_by_driver` | BOOLEAN | Driver collected balance flag |
| `admin_trip_notes` | TEXT | Admin trip completion notes |
| `completed_at` | TIMESTAMPTZ | Trip completion timestamp |
| `created_at` | TIMESTAMPTZ | Booking creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Enums:**
```sql
CREATE TYPE trip_type_enum AS ENUM (
    'one-way', 'round-trip', 'local-tour', 'airport-transfer'
);

CREATE TYPE booking_status_enum AS ENUM (
    'draft', 'pending_payment', 'paid_confirmed',
    'in_transit', 'completed', 'cancelled', 'refunded'
);
```

#### `payments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `booking_id` | UUID | References `bookings(id)` |
| `provider` | payment_provider_enum | razorpay only |
| `provider_order_id` | VARCHAR(120) | Razorpay order ID |
| `provider_payment_id` | VARCHAR(120) | Razorpay payment ID |
| `checkout_session_id` | VARCHAR(120) | Checkout session ID |
| `checkout_url` | TEXT | Hosted checkout URL |
| `public_client_token` | TEXT | Public client token |
| `amount_paise` | BIGINT | Payment amount in Indian Paise (`amount_paise = advance_amount * 100`) |
| `currency` | VARCHAR(5) | Currency code (INR) |
| `status` | payment_status_enum | pending, captured, failed, refunded, needs_review |
| `payment_method` | VARCHAR(50) | UPI, netbanking |
| `fee_paise` | BIGINT | Payment gateway fee in Paise |
| `tax_paise` | BIGINT | Tax amount in Paise |
| `idempotency_key` | VARCHAR(100) | Idempotency key |
| `webhook_event_id` | VARCHAR(120) | Webhook event ID |
| `reconciliation_status` | VARCHAR(30) | pending, reconciled, discrepancy |
| `failure_reason` | TEXT | Failure reason |
| `verified_at` | TIMESTAMPTZ | Verification timestamp |
| `expires_at` | TIMESTAMPTZ | Payment expiry timestamp |
| `created_at` | TIMESTAMPTZ | Payment creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Enums:**
```sql
CREATE TYPE payment_provider_enum AS ENUM ('razorpay');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'captured', 'failed', 'refunded', 'needs_review');
```

#### `refunds`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `payment_id` | UUID | References `payments(id)` |
| `booking_id` | UUID | References `bookings(id)` |
| `provider_refund_id` | VARCHAR(120) | Razorpay refund ID |
| `amount_minor` | BIGINT | Refund amount in paise |
| `currency` | VARCHAR(5) | Currency code (INR) |
| `reason` | TEXT | Refund reason |
| `status` | VARCHAR(30) | processed, pending, failed |
| `idempotency_key` | VARCHAR(100) | Idempotency key |
| `created_at` | TIMESTAMPTZ | Refund creation timestamp |

---

### 4.3 Catalog & Content

#### `vehicle_groups`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique code (sedan, suv, luxury, tempo_traveller) |
| `name` | TEXT | Display name |
| `driver_allowance_per_day` | INT | Daily driver allowance in paise |
| `one_way_night_charge` | INT | One-way night charge in paise |
| `round_trip_halt_per_night` | INT | Round-trip night halt in paise |
| `sort_order` | INT | Display order |
| `is_active` | BOOLEAN | Active flag |

#### `vehicle_models`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vehicle_group_id` | UUID | References `vehicle_groups(id)` |
| `make` | TEXT | Vehicle make (e.g., Maruti, Toyota) |
| `model_name` | TEXT | Model name (e.g., Dzire, Innova) |
| `display_name` | TEXT | Display name (e.g., Maruti Dzire) |
| `passenger_capacity` | INT | Number of passengers |
| `luggage_capacity` | INT | Luggage capacity in bags |
| `image_url` | TEXT | Vehicle image URL |
| `sort_order` | INT | Display order |
| `is_active` | BOOLEAN | Active flag |

#### `outstation_routes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique route code |
| `origin_name` | TEXT | Origin city/name |
| `destination_name` | TEXT | Destination city/name |
| `distance_km` | NUMERIC(7,1) | Distance in km |
| `duration_minutes` | INT | Estimated duration in minutes |
| `description` | TEXT | Route description |
| `image_url` | TEXT | Route image URL |
| `gallery` | JSONB | Array of image URLs |
| `status` | TEXT | draft, published, archived |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `local_packages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique package code |
| `name` | TEXT | Package name |
| `duration_hours` | INT | Duration in hours |
| `included_km` | INT | Included kilometers |
| `covers` | TEXT | Coverage area |
| `parking_note` | TEXT | Parking information |
| `fleet_prices` | JSONB | Per-vehicle pricing |
| `use_per_km` | BOOLEAN | Per-km pricing flag |
| `extra_rates` | JSONB | Extra hour/km rates |
| `night_charge_inr` | NUMERIC(10,2) | Night charge |
| `status` | TEXT | draft, published, archived |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `tour_packages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique package code |
| `name` | TEXT | Package name |
| `duration_text` | TEXT | Duration description |
| `days` | INT | Number of days |
| `nights` | INT | Number of nights |
| `base_tier_code` | TEXT | Base vehicle group code |
| `starting_price_inr` | NUMERIC(10,2) | Starting price |
| `fleet_prices` | JSONB | Per-vehicle pricing |
| `night_charge_inr` | NUMERIC(10,2) | Night charge |
| `inclusions_highlight` | TEXT | Key inclusions |
| `inclusions_note` | TEXT | Inclusion details |
| `status` | TEXT | draft, published, archived |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `transfer_routes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `route_code` | TEXT | Unique route code |
| `name` | TEXT | Route name |
| `distance_text` | TEXT | Distance description |
| `direction_note` | TEXT | Direction information |
| `fleet_prices` | JSONB | Per-vehicle pricing |
| `use_per_km` | BOOLEAN | Per-km pricing flag |
| `night_charge_inr` | NUMERIC(10,2) | Night charge |
| `status` | TEXT | draft, published, archived |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `monuments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique monument code |
| `name` | TEXT | Monument name |
| `location` | TEXT | Location |
| `entry_fee_inr` | NUMERIC(10,2) | Entry fee |
| `opening_hours` | TEXT | Opening hours |
| `best_time_to_visit` | TEXT | Best visiting time |
| `description` | TEXT | Description |
| `image_url` | TEXT | Monument image URL |
| `gallery` | JSONB | Array of image URLs |
| `status` | TEXT | draft, published, archived |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `cancellation_policies`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `policy_type` | TEXT | cab, tour_package |
| `notice_period_text` | TEXT | Notice period description |
| `sort_order` | INT | Display order |
| `fee_retained_percent` | NUMERIC(5,2) | Fee retained percentage |
| `refund_percent` | NUMERIC(5,2) | Refund percentage |
| `rule_text` | TEXT | Cancellation rule |
| `refund_timeline_note` | TEXT | Refund timeline |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

### 4.4 Reviews & Feedback

#### `reviews`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `booking_id` | UUID | References `bookings(id)` |
| `catalog_item_id` | TEXT | References `catalog_items(id)` |
| `customer_id` | UUID | References `profiles(id)` |
| `display_name` | TEXT | Display name |
| `rating` | INT | Rating (1-5) |
| `review_text` | TEXT | Review text |
| `status` | review_status_enum | draft, pending_review, approved, rejected, published, archived |
| `verification_status` | verification_status_enum | unverified, booking_verified, social_link_submitted, manually_verified |
| `social_profile_url` | TEXT | Social media profile URL |
| `social_platform` | VARCHAR(40) | Social platform name |
| `verification_notes` | TEXT | Verification notes |
| `reviewed_by` | UUID | References `profiles(id)` |
| `reviewed_at` | TIMESTAMPTZ | Review timestamp |
| `published_at` | TIMESTAMPTZ | Publication timestamp |
| `guest_access_token` | VARCHAR(64) | Guest access token |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Enums:**
```sql
CREATE TYPE review_status_enum AS ENUM (
    'draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'
);

CREATE TYPE verification_status_enum AS ENUM (
    'unverified', 'booking_verified', 'social_link_submitted', 'manually_verified'
);
```

#### `review_media`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `review_id` | UUID | References `reviews(id)` |
| `storage_path` | TEXT | Storage path (Cloudflare R2/Supabase) |
| `media_type` | VARCHAR(10) | image, video |
| `alt_text` | TEXT | Alt text |
| `sort_order` | INT | Display order |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

### 4.5 Business Logic

#### `fare_settings`

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT | Primary key (advance_percent, min_km_per_day, etc.) |
| `value` | INT | Setting value |

**Valid Keys:**
- `advance_percent`: Percentage for advance deposit (1-100)
- `min_km_per_day`: Minimum km charge per day (> 0)
- `max_round_trip_days`: Maximum round-trip days (> 0)
- `night_start_hour`: Night start hour (0-23)
- `night_end_hour`: Night end hour (0-23)

#### `promo_codes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | VARCHAR(30) | Unique promo code |
| `discount_amount` | NUMERIC(8,2) | Discount amount |
| `min_total` | NUMERIC(10,2) | Minimum order total |
| `description` | TEXT | Promo description |
| `is_active` | BOOLEAN | Active flag |
| `max_redemptions` | INT | Maximum redemptions |
| `redemption_count` | INT | Current redemptions |
| `valid_from` | TIMESTAMPTZ | Valid from timestamp |
| `valid_to` | TIMESTAMPTZ | Valid to timestamp |

#### `publication_outbox`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | TEXT | tour_package, local_package, transfer_route, monument |
| `entity_id` | TEXT | Entity identifier |
| `event_type` | TEXT | publish, unpublish, update |
| `payload` | JSONB | Event payload |
| `status` | TEXT | queued, published, failed |
| `error_message` | TEXT | Error message |
| `published_at` | TIMESTAMPTZ | Publication timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

### 4.6 System & Audit

#### `admin_audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `actor_id` | UUID | References `profiles(id)` |
| `actor_role` | user_role_enum | Actor role |
| `resource_type` | TEXT | Resource type |
| `resource_id` | TEXT | Resource identifier |
| `action` | TEXT | Action performed |
| `before_state` | JSONB | State before action |
| `after_state` | JSONB | State after action |
| `reason` | TEXT | Reason for action |
| `request_id` | TEXT | Request identifier |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `notification_jobs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `booking_id` | UUID | References `bookings(id)` |
| `channel` | VARCHAR(20) | email, sms, whatsapp |
| `template_key` | TEXT | Template identifier |
| `dedupe_key` | TEXT | Deduplication key |
| `payload` | JSONB | Template payload |
| `status` | VARCHAR(20) | queued, sent, failed |
| `attempt_count` | INT | Attempt count |
| `provider_message_id` | TEXT | Provider message ID |
| `last_error` | TEXT | Last error message |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `inquiries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Inquirer name |
| `phone` | VARCHAR(20) | Inquirer phone |
| `email` | VARCHAR(255) | Inquirer email |
| `message` | TEXT | Inquiry message |
| `trip_interest` | TEXT | Trip interest |
| `status` | TEXT | pending, contacted, resolved |
| `notes` | TEXT | Internal notes |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `location_cache`

| Column | Type | Description |
|--------|------|-------------|
| `cache_key` | TEXT | Primary key (MD5 hash of query) |
| `suggestions` | JSONB | Geocoding suggestions |
| `stored_at` | TIMESTAMPTZ | Cache timestamp |

---

## 4.7 Undocumented Tables

### `outstation_route_vehicles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `route_id` | UUID | References `outstation_routes(id)` |
| `vehicle_group_id` | UUID | References `vehicle_groups(id)` |
| `is_active` | BOOLEAN | Active flag |
| `sort_order` | INT | Display order |

### `fare_rules`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `version` | VARCHAR(20) | Rule version (e.g., "2026-09-13") |
| `per_km_rate` | INTEGER | Per-km rate in INR Rupees |
| `per_hour_rate` | INTEGER | Per-hour rate in INR Rupees |
| `min_km_charge` | INTEGER | Minimum km charge |
| `night_start_hour` | INT | Night start hour (0-23) |
| `night_end_hour` | INT | Night end hour (0-23) |
| `night_charge_multiplier` | NUMERIC(3,2) | Night charge multiplier |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `extra_charges`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `charge_type` | TEXT | toll, parking, night_charge, driver_allowance |
| `name` | TEXT | Charge name |
| `amount` | INTEGER | Charge amount in INR Rupees |
| `scope` | TEXT | global, route, group |
| `route_id` | UUID | References `outstation_routes(id)` (optional) |
| `vehicle_group_id` | UUID | References `vehicle_groups(id)` (optional) |
| `is_active` | BOOLEAN | Active flag |
| `sort_order` | INT | Display order |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `rental_enquiries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Inquirer name |
| `phone` | VARCHAR(20) | Inquirer phone |
| `email` | VARCHAR(255) | Inquirer email |
| `city` | TEXT | Rental city |
| `duration_days` | INT | Rental duration |
| `vehicle_type` | TEXT | Preferred vehicle type |
| `message` | TEXT | Inquiry message |
| `status` | TEXT | pending, contacted, resolved |
| `notes` | TEXT | Internal notes |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `company_profile`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `company_name` | TEXT | Company name |
| `contact_phone` | VARCHAR(20) | Contact phone |
| `contact_email` | VARCHAR(255) | Contact email |
| `address` | TEXT | Company address |
| `gstin` | VARCHAR(15) | GSTIN number |
| `pan` | VARCHAR(10) | PAN number |
| `logo_url` | TEXT | Logo URL |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `pet_policy`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `is_allowed` | BOOLEAN | Pet allowed flag |
| `charge_inr` | INTEGER | Pet charge in INR Rupees |
| `notes` | TEXT | Pet policy notes |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `dossier_signoffs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `booking_id` | UUID | References `bookings(id)` |
| `client_name` | TEXT | Client name |
| `signoff_status` | TEXT | pending, signed, rejected |
| `signed_at` | TIMESTAMPTZ | Signoff timestamp |
| `notes` | TEXT | Internal notes |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `seo_metadata`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `url_path` | TEXT | URL path |
| `title` | VARCHAR(70) | Page title |
| `description` | VARCHAR(170) | Meta description |
| `canonical_url` | TEXT | Canonical URL |
| `og_title` | VARCHAR(100) | OpenGraph title |
| `og_description` | VARCHAR(200) | OpenGraph description |
| `og_image_url` | TEXT | OpenGraph image URL |
| `noindex` | BOOLEAN | Noindex flag |
| `schema_json_ld` | JSONB | Schema.org JSON-LD |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `seo_redirects`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `from_path` | TEXT | Source path |
| `to_path` | TEXT | Destination path |
| `status_code` | INT | Redirect status code (301, 302) |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `publishing_outbox`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | TEXT | tour_package, local_package, transfer_route, monument, route |
| `entity_id` | TEXT | Entity identifier |
| `event_type` | TEXT | publish, unpublish, update |
| `payload` | JSONB | Event payload |
| `status` | TEXT | queued, published, failed |
| `error_message` | TEXT | Error message |
| `published_at` | TIMESTAMPTZ | Publication timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## 5. Indexing Strategy

### 5.1 Primary Key Indexes

All tables use UUID v4 primary keys with automatic indexing.

### 5.2 Foreign Key Indexes

```sql
-- Bookings
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_pickup_datetime ON bookings(pickup_datetime);

-- Payments
CREATE INDEX idx_payments_provider_order ON payments(provider, provider_order_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- Reviews
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Catalog
CREATE INDEX idx_catalog_items_status ON catalog_items(status);
CREATE INDEX idx_catalog_items_type ON catalog_items(type);
```

### 5.3 Composite Indexes

```sql
-- Payment verification
CREATE INDEX idx_payments_provider_status ON payments(provider, status);

-- Review moderation
CREATE INDEX idx_reviews_moderation ON reviews(status, verification_status);

-- Route search
CREATE INDEX idx_outstation_routes_search ON outstation_routes(origin_name, destination_name);
```

---

## 6. Row-Level Security (RLS) Policies

### 6.1 Profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_user_select ON profiles
    FOR SELECT
    USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY profiles_admin_select ON profiles
    FOR SELECT
    USING (current_setting('role', true) = 'service_role');
```

### 6.2 Bookings

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookings
CREATE POLICY bookings_user_select ON bookings
    FOR SELECT
    USING (user_id = auth.uid() OR current_setting('role', true) = 'service_role');

-- Users can create bookings
CREATE POLICY bookings_user_insert ON bookings
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR current_setting('role', true) = 'service_role');

-- Admins can read all bookings
CREATE POLICY bookings_admin_select ON bookings
    FOR SELECT
    USING (current_setting('role', true) = 'service_role');
```

### 6.3 Reviews

```sql
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can read published reviews
CREATE POLICY reviews_public_select ON reviews
    FOR SELECT
    USING (status = 'published' OR current_setting('role', true) = 'service_role');

-- Users can create reviews for their bookings
CREATE POLICY reviews_user_insert ON reviews
    FOR INSERT
    WITH CHECK (customer_id = auth.uid() OR current_setting('role', true) = 'service_role');
```

### 6.4 Catalog Items

```sql
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

-- Public can read published catalog items
CREATE POLICY catalog_public_select ON catalog_items
    FOR SELECT
    USING (status = 'published' OR current_setting('role', true) = 'service_role');
```

---

## 7. Migration Process

### 7.1 Migration File Naming

```
NNN_description.sql
```

Where `NNN` is a zero-padded number (001, 002, ..., 051).

### 7.2 Migration Template

```sql
-- 0000_description.sql
-- Brief description of changes

-- Step 1: Add new column
ALTER TABLE table_name
  ADD COLUMN IF NOT EXISTS column_name TYPE;

-- Step 2: Update existing data
UPDATE table_name
  SET column_name = default_value
  WHERE column_name IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE table_name
  ALTER COLUMN column_name SET NOT NULL;

-- Step 4: Add index
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);
```

### 7.3 Running Migrations

```bash
# Run all pending migrations
npm --prefix backend run migrate

# Run specific migration
psql $DATABASE_URL -f backend/migrations/0000_description.sql
```

### 7.4 Migration Verification

```bash
# Check migration status
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY applied_at DESC LIMIT 10;"
```

---

## 8. Database Seeding

### 8.1 Seed Data Categories

| Category | File | Description |
|----------|------|-------------|
| Vehicle Groups | `0039_fare_system_seeds.sql` | Sedan, SUV, Luxury, Tempo Traveller |
| Fare Settings | `0039_fare_system_seeds.sql` | Advance %, min km/day, night hours |
| Cancellation Policies | `0039_fare_system_seeds.sql` | Cab, tour package policies |

### 8.2 Running Seeds

```bash
# Run all seeds
npm --prefix backend run seed

# Run specific seed script
tsx backend/scripts/seed.ts
```

---

## 9. Database Backup & Recovery

### 9.1 Backup Command

```bash
# Full database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Schema-only backup
pg_dump -s $DATABASE_URL > schema-$(date +%Y%m%d).sql
```

### 9.2 Restore Command

```bash
# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

### 9.3 Supabase Backup

Supabase provides automatic daily backups. Manual backups can be requested via the dashboard.

---

## 10. Performance Optimization

### 10.1 Connection Pooling

```typescript
// backend/src/db/poolConfig.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 10.2 Query Optimization

| Pattern | Correct Approach | What to Avoid |
|---------|------------------|---------------|
| **Joins** | Use explicit JOINs | Subqueries for simple lookups |
| **Indexes** | Create indexes on WHERE/JOIN columns | Full table scans |
| **Pagination** | Use LIMIT + OFFSET or cursor-based | Fetch all, then paginate |
| **JSONB** | Use `@>` operator for queries | JSONB in WHERE clause without index |

### 10.3 Caching Strategy

| Data Type | Cache Location | TTL |
|-----------|---------------|-----|
| Geocoding results | `location_cache` table | 24 hours |
| Fare rules | In-memory (fare-engine) | 1 hour |
| Catalog items | Cloudflare Edge | 1 hour |

---

## 11. Security Best Practices

### 11.1 Secrets Management

| Secret | Storage Location | Access |
|--------|-----------------|--------|
| `DATABASE_URL` | Supabase project settings | Backend only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings | Backend only |
| `RAZORPAY_KEY_SECRET` | Render/Environment variables | Backend only |

### 11.2 SQL Injection Prevention

```typescript
// Correct: Parameterized queries
const result = await pool.query(
  'SELECT * FROM bookings WHERE id = $1',
  [bookingId]
);

// Incorrect: String concatenation (AVOID)
const result = await pool.query(
  `SELECT * FROM bookings WHERE id = '${bookingId}'`
);
```

### 11.3 Data Masking

```typescript
// Mask phone number in public responses
function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
}
```

---

## 12. Conclusion

This database schema represents the **correct, production-grade approach** for building a travel booking platform. It synthesizes lessons from 51 migrations of real-world development.

### Key Takeaways

1. **PostgreSQL only** — No MongoDB, no dual-write
2. **Server-authoritative fares** — Client never determines prices
3. **Immutable booking state** — State machine with transitions
4. **Row-level security** — RLS on all tables
5. **Migration-first** — Every schema change is a migration

### Next Steps

1. Read [`BACKEND_RULES.md`](BACKEND_RULES.md) for backend development
2. Read [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) for payment integration
3. Read [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) for overall architecture

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-10-31  
**Author:** Agra SK Baghel Tour & Travels Engineering Team
