# ArenaAI live Supabase schema inventory

Generated from the live Supabase PostgreSQL inspection on 2026-10-11 06:24:08 (IST).
Total applied migrations: **40**.

## Table summary

| Table | Rows | RLS | Primary key |
|---|---:|:---:|---|
| `public.admin_audit_logs` | 32 | enabled | `id` |
| `public.bookings` | 3 | enabled | `id` |
| `public.cancellation_policies` | 0 | enabled | `id` |
| `public.catalog_item_media` | 5 | enabled | `id` |
| `public.catalog_items` | 11 | enabled | `id` |
| `public.company_profile` | 0 | enabled | `id` |
| `public.device_registrations` | 1 | enabled | `id` |
| `public.dossier_signoffs` | 0 | enabled | `id` |
| `public.extra_charges` | 4 | enabled | `id` |
| `public.fare_rules` | 10 | enabled | `id` |
| `public.fare_settings` | 5 | enabled | `key` |
| `public.inquiries` | 2 | enabled | `id` |
| `public.local_packages` | 0 | enabled | `id` |
| `public.location_cache` | 6 | enabled | `cache_key` |
| `public.monuments` | 0 | enabled | `id` |
| `public.notification_jobs` | 1 | enabled | `id` |
| `public.outstation_route_vehicles` | 10 | enabled | `id` |
| `public.outstation_routes` | 2 | enabled | `id` |
| `public.payment_webhook_events` | 0 | enabled | `id` |
| `public.payments` | 2 | enabled | `id` |
| `public.pet_taxi_policy` | 0 | enabled | `id` |
| `public.profiles` | 6 | enabled | `id` |
| `public.rental_enquiries` | 0 | enabled | `id` |
| `public.review_images` | 0 | enabled | `id` |
| `public.review_links` | 0 | enabled | `id` |
| `public.review_submissions` | 0 | enabled | `id` |
| `public.schema_migrations` | 40 | enabled | `id` |
| `public.site_publish_events` | 0 | enabled | `id` |
| `public.tour_packages` | 0 | enabled | `id` |
| `public.transfers` | 0 | enabled | `id` |
| `public.url_redirects` | 0 | enabled | `id` |
| `public.vehicle_groups` | 4 | enabled | `id` |
| `public.vehicle_models` | 14 | enabled | `id` |

## Columns and types

### `public.admin_audit_logs`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `actor_id` | `uuid` | no | `—` | — |
| `actor_role` | `user_role_enum` | no | `—` | enum: customer, content_editor, review_moderator, dispatcher, finance_operator, super_admin |
| `resource_type` | `text` | no | `—` | — |
| `resource_id` | `text` | no | `—` | — |
| `action` | `text` | no | `—` | — |
| `before_state` | `jsonb` | yes | `—` | — |
| `after_state` | `jsonb` | yes | `—` | — |
| `reason` | `text` | yes | `—` | — |
| `request_id` | `text` | no | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

### `public.bookings`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `ticket_id` | `text` | no | `—` | — |
| `user_id` | `uuid` | yes | `—` | — |
| `guest_access_token` | `text` | no | `—` | — |
| `customer_name` | `text` | no | `—` | — |
| `customer_phone` | `text` | no | `—` | — |
| `customer_email` | `text` | yes | `—` | — |
| `category` | `text` | no | `—` | (category = ANY (ARRAY['outstation'::text, 'local_package'::text, 'transfer'::text, 'tour_package'::text])) |
| `vehicle_model_id` | `uuid` | no | `—` | — |
| `passenger_count` | `int4` | no | `—` | (passenger_count > 0) |
| `route_id` | `uuid` | yes | `—` | — |
| `local_package_id` | `uuid` | yes | `—` | — |
| `transfer_id` | `uuid` | yes | `—` | — |
| `tour_package_id` | `uuid` | yes | `—` | — |
| `trip_type` | `text` | yes | `—` | (trip_type = ANY (ARRAY['one_way'::text, 'round_trip'::text])) |
| `pickup_at` | `timestamptz` | no | `—` | — |
| `return_at` | `timestamptz` | yes | `—` | ((return_at IS NULL) OR (return_at > pickup_at)) |
| `pickup_address` | `text` | no | `—` | — |
| `drop_address` | `text` | yes | `—` | — |
| `flight_train_number` | `text` | yes | `—` | — |
| `special_notes` | `text` | yes | `—` | — |
| `fare_breakdown` | `jsonb` | no | `—` | — |
| `total_amount` | `int4` | no | `—` | (total_amount > 0) |
| `advance_amount` | `int4` | no | `—` | ((advance_amount >= 0) AND (advance_amount <= total_amount)) |
| `balance_amount` | `int4` | yes | `—` | — |
| `status` | `text` | no | `'pending_payment'::text` | (status = ANY (ARRAY['pending_payment'::text, 'confirmed'::text, 'driver_assigned'::text, 'in_transit'::text, 'completed'::text, 'cancelled'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_local_package_id_fkey` | `public.bookings` (`local_package_id`) | `public.local_packages` (`id`) | Outgoing (Foreign Key) |
| `bookings_route_id_fkey` | `public.bookings` (`route_id`) | `public.outstation_routes` (`id`) | Outgoing (Foreign Key) |
| `bookings_tour_package_id_fkey` | `public.bookings` (`tour_package_id`) | `public.tour_packages` (`id`) | Outgoing (Foreign Key) |
| `bookings_transfer_id_fkey` | `public.bookings` (`transfer_id`) | `public.transfers` (`id`) | Outgoing (Foreign Key) |
| `bookings_user_id_fkey` | `public.bookings` (`user_id`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |
| `bookings_vehicle_model_id_fkey` | `public.bookings` (`vehicle_model_id`) | `public.vehicle_models` (`id`) | Outgoing (Foreign Key) |
| `fk_device_registrations_booking` | `public.device_registrations` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `fk_notification_jobs_booking` | `public.notification_jobs` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `payments_booking_id_fkey` | `public.payments` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `review_links_booking_id_fkey` | `public.review_links` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `review_submissions_booking_id_fkey` | `public.review_submissions` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |

### `public.cancellation_policies`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `policy_type` | `text` | no | `—` | (policy_type = ANY (ARRAY['cab'::text, 'tour_package'::text])) |
| `notice_period_text` | `text` | no | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `fee_retained_percent` | `numeric` | no | `—` | ((fee_retained_percent >= (0)::numeric) AND (fee_retained_percent <= (100)::numeric)) |
| `refund_percent` | `numeric` | no | `—` | ((refund_percent >= (0)::numeric) AND (refund_percent <= (100)::numeric)) |
| `rule_text` | `text` | no | `—` | — |
| `refund_timeline_note` | `text` | no | `'5–7 business days to original bank/UPI'::text` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.catalog_item_media`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `catalog_item_id` | `text` | no | `—` | — |
| `storage_path` | `text` | no | `—` | — |
| `media_type` | `varchar(10)` | no | `—` | — |
| `alt_text` | `text` | no | `—` | — |
| `caption` | `text` | yes | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `status` | `content_status_enum` | no | `'draft'::content_status_enum` | enum: draft, published, archived |
| `source_type` | `varchar(30)` | no | `'admin_upload'::character varying` | — |
| `copyright_owner` | `text` | yes | `—` | — |
| `created_by` | `uuid` | yes | `—` | — |
| `approved_by` | `uuid` | yes | `—` | — |
| `published_at` | `timestamptz` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `mime_type` | `varchar(60)` | yes | `—` | — |
| `content_base64` | `text` | yes | `—` | — |
| `size_bytes` | `int4` | yes | `—` | ((size_bytes IS NULL) OR (size_bytes >= 0)) |

### `public.catalog_items`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `text` | no | `—` | — |
| `type` | `text` | no | `—` | (type = ANY (ARRAY['ride'::text, 'tour'::text, 'package'::text, 'route'::text, 'vehicle'::text, 'place'::text])) |
| `slug` | `varchar(150)` | no | `—` | — |
| `title` | `text` | no | `—` | — |
| `short_description` | `text` | no | `—` | — |
| `description` | `text` | no | `—` | — |
| `status` | `content_status_enum` | no | `'draft'::content_status_enum` | enum: draft, published, archived |
| `duration_text` | `text` | no | `—` | — |
| `route_summary` | `text` | no | `—` | — |
| `version` | `int4` | no | `1` | — |
| `created_by` | `uuid` | yes | `—` | — |
| `updated_by` | `uuid` | yes | `—` | — |
| `published_at` | `timestamptz` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |
| `availability` | `varchar(20)` | no | `'available'::character varying` | — |
| `seats_left` | `int4` | yes | `—` | ((seats_left IS NULL) OR (seats_left >= 0)) |
| `stops` | `_text` | no | `'{}'::text[]` | — |
| `trip_type` | `varchar(30)` | yes | `—` | ((trip_type IS NULL) OR ((trip_type)::text = ANY ((ARRAY['one-way'::character varying, 'round-trip'::character varying, 'local-tour'::character varying, 'airport-transfer'::character varying])::text[]))) |

### `public.company_profile`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `brand_name` | `text` | no | `'SK Baghel Tour & Travels'::text` | — |
| `office_address` | `text` | no | `'Taj Ganj, Agra, Uttar Pradesh 282001'::text` | — |
| `primary_phone` | `text` | no | `'+91 97628 17598'::text` | — |
| `whatsapp_number` | `text` | no | `'+91 97628 17598'::text` | — |
| `email` | `text` | no | `'[TBD — confirm with client]'::text` | — |
| `gstin` | `text` | no | `'[TBD — confirm with client]'::text` | — |
| `operating_hours` | `text` | no | `'Bookings Open 24×7, 365 Days'::text` | — |
| `maps_location` | `text` | no | `'https://maps.google.com/?q=Agra'::text` | — |
| `dossier_version` | `text` | no | `'1.0'::text` | — |
| `dossier_status` | `text` | no | `'pending_review'::text` | (dossier_status = ANY (ARRAY['pending_review'::text, 'signed_off'::text, 'modifications_needed'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.device_registrations`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `user_id` | `uuid` | yes | `—` | — |
| `booking_id` | `uuid` | yes | `—` | — |
| `device_id` | `varchar(100)` | no | `—` | — |
| `platform` | `varchar(20)` | no | `—` | — |
| `fcm_token` | `text` | no | `—` | — |
| `is_active` | `bool` | no | `true` | — |
| `last_seen_at` | `timestamptz` | no | `now()` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `device_registrations_user_id_fkey` | `public.device_registrations` (`user_id`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |
| `fk_device_registrations_booking` | `public.device_registrations` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |

### `public.dossier_signoffs`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `section_key` | `text` | no | `—` | (section_key ~ '^[a-z0-9_-]{2,80}$'::text) |
| `section_title` | `text` | no | `—` | — |
| `status` | `text` | no | `'pending'::text` | (status = ANY (ARRAY['pending'::text, 'approved'::text, 'modification_requested'::text])) |
| `client_notes` | `text` | yes | `—` | — |
| `approved_by` | `uuid` | yes | `—` | — |
| `approved_at` | `timestamptz` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.extra_charges`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `category` | `text` | no | `—` | (category = ANY (ARRAY['outstation'::text, 'local_package'::text, 'transfer'::text, 'tour_package'::text])); (((category = 'outstation'::text) AND (local_package_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'local_package'::text) AND (route_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'transfer'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'tour_package'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (transfer_id IS NULL))) |
| `vehicle_group_id` | `uuid` | yes | `—` | — |
| `route_id` | `uuid` | yes | `—` | (((category = 'outstation'::text) AND (local_package_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'local_package'::text) AND (route_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'transfer'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'tour_package'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (transfer_id IS NULL))) |
| `local_package_id` | `uuid` | yes | `—` | (((category = 'outstation'::text) AND (local_package_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'local_package'::text) AND (route_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'transfer'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'tour_package'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (transfer_id IS NULL))) |
| `transfer_id` | `uuid` | yes | `—` | (((category = 'outstation'::text) AND (local_package_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'local_package'::text) AND (route_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'transfer'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'tour_package'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (transfer_id IS NULL))) |
| `tour_package_id` | `uuid` | yes | `—` | (((category = 'outstation'::text) AND (local_package_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'local_package'::text) AND (route_id IS NULL) AND (transfer_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'transfer'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (tour_package_id IS NULL)) OR ((category = 'tour_package'::text) AND (route_id IS NULL) AND (local_package_id IS NULL) AND (transfer_id IS NULL))) |
| `label` | `text` | no | `—` | — |
| `amount` | `int4` | yes | `—` | (amount > 0) |
| `is_active` | `bool` | no | `true` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `extra_charges_local_package_id_fkey` | `public.extra_charges` (`local_package_id`) | `public.local_packages` (`id`) | Outgoing (Foreign Key) |
| `extra_charges_route_id_fkey` | `public.extra_charges` (`route_id`) | `public.outstation_routes` (`id`) | Outgoing (Foreign Key) |
| `extra_charges_tour_package_id_fkey` | `public.extra_charges` (`tour_package_id`) | `public.tour_packages` (`id`) | Outgoing (Foreign Key) |
| `extra_charges_transfer_id_fkey` | `public.extra_charges` (`transfer_id`) | `public.transfers` (`id`) | Outgoing (Foreign Key) |
| `extra_charges_vehicle_group_id_fkey` | `public.extra_charges` (`vehicle_group_id`) | `public.vehicle_groups` (`id`) | Outgoing (Foreign Key) |

### `public.fare_rules`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `category` | `text` | no | `—` | (category = ANY (ARRAY['outstation'::text, 'local_package'::text, 'transfer'::text, 'tour_package'::text])) |
| `vehicle_model_id` | `uuid` | no | `—` | — |
| `local_package_id` | `uuid` | yes | `—` | — |
| `transfer_id` | `uuid` | yes | `—` | — |
| `tour_package_id` | `uuid` | yes | `—` | — |
| `amount` | `int4` | no | `—` | (amount > 0) |
| `is_active` | `bool` | no | `true` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `fare_rules_local_package_id_fkey` | `public.fare_rules` (`local_package_id`) | `public.local_packages` (`id`) | Outgoing (Foreign Key) |
| `fare_rules_tour_package_id_fkey` | `public.fare_rules` (`tour_package_id`) | `public.tour_packages` (`id`) | Outgoing (Foreign Key) |
| `fare_rules_transfer_id_fkey` | `public.fare_rules` (`transfer_id`) | `public.transfers` (`id`) | Outgoing (Foreign Key) |
| `fare_rules_vehicle_model_id_fkey` | `public.fare_rules` (`vehicle_model_id`) | `public.vehicle_models` (`id`) | Outgoing (Foreign Key) |

### `public.fare_settings`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `key` | `text` | no | `—` | (key = ANY (ARRAY['advance_percent'::text, 'min_km_per_day'::text, 'max_round_trip_days'::text, 'night_start_hour'::text, 'night_end_hour'::text])); (((key = 'advance_percent'::text) AND ((value >= 1) AND (value <= 100))) OR ((key = ANY (ARRAY['min_km_per_day'::text, 'max_round_trip_days'::text])) AND (value > 0)) OR ((key = ANY (ARRAY['night_start_hour'::text, 'night_end_hour'::text])) AND ((value >= 0) AND (value <= 23)))) |
| `value` | `int4` | no | `—` | (((key = 'advance_percent'::text) AND ((value >= 1) AND (value <= 100))) OR ((key = ANY (ARRAY['min_km_per_day'::text, 'max_round_trip_days'::text])) AND (value > 0)) OR ((key = ANY (ARRAY['night_start_hour'::text, 'night_end_hour'::text])) AND ((value >= 0) AND (value <= 23)))) |

### `public.inquiries`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `name` | `text` | no | `—` | — |
| `phone` | `varchar(20)` | no | `—` | — |
| `email` | `varchar(255)` | yes | `—` | — |
| `message` | `text` | no | `—` | — |
| `trip_interest` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `status` | `varchar(30)` | no | `'new'::character varying` | — |
| `notes` | `_text` | no | `'{}'::text[]` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.local_packages`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `code` | `text` | no | `—` | (code ~ '^[a-z0-9-]{2,80}$'::text) |
| `name` | `text` | no | `—` | — |
| `duration_hours` | `int4` | yes | `—` | (duration_hours > 0) |
| `included_km` | `int4` | yes | `—` | (included_km > 0) |
| `covers` | `text` | yes | `—` | — |
| `description` | `text` | yes | `—` | — |
| `inclusions_highlight` | `text` | yes | `—` | — |
| `inclusions_note` | `text` | yes | `—` | — |
| `image_url` | `text` | yes | `—` | — |
| `gallery` | `jsonb` | no | `'[]'::jsonb` | — |
| `inclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `exclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_local_package_id_fkey` | `public.bookings` (`local_package_id`) | `public.local_packages` (`id`) | Incoming (Referenced by) |
| `extra_charges_local_package_id_fkey` | `public.extra_charges` (`local_package_id`) | `public.local_packages` (`id`) | Incoming (Referenced by) |
| `fare_rules_local_package_id_fkey` | `public.fare_rules` (`local_package_id`) | `public.local_packages` (`id`) | Incoming (Referenced by) |

### `public.location_cache`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `cache_key` | `text` | no | `—` | — |
| `suggestions` | `jsonb` | no | `—` | — |
| `stored_at` | `timestamptz` | no | `now()` | — |

### `public.monuments`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `name` | `text` | no | `—` | — |
| `visiting_hours` | `text` | no | `—` | — |
| `closed_note` | `text` | no | `'Open all days'::text` | — |
| `historical_context` | `text` | yes | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.notification_jobs`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `booking_id` | `uuid` | yes | `—` | — |
| `channel` | `varchar(20)` | no | `—` | — |
| `template_key` | `text` | no | `—` | — |
| `dedupe_key` | `text` | no | `—` | — |
| `payload` | `jsonb` | no | `'{}'::jsonb` | — |
| `status` | `varchar(20)` | no | `'queued'::character varying` | — |
| `attempt_count` | `int4` | no | `0` | — |
| `provider_message_id` | `text` | yes | `—` | — |
| `last_error` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `fk_notification_jobs_booking` | `public.notification_jobs` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |

### `public.outstation_route_vehicles`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `route_id` | `uuid` | no | `—` | — |
| `vehicle_model_id` | `uuid` | no | `—` | — |
| `one_way_amount` | `int4` | yes | `—` | (one_way_amount > 0) |
| `round_trip_enabled` | `bool` | no | `true` | — |
| `terms` | `jsonb` | no | `'{}'::jsonb` | — |
| `sort_order` | `int4` | no | `0` | — |
| `is_active` | `bool` | no | `true` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `outstation_route_vehicles_route_id_fkey` | `public.outstation_route_vehicles` (`route_id`) | `public.outstation_routes` (`id`) | Outgoing (Foreign Key) |
| `outstation_route_vehicles_vehicle_model_id_fkey` | `public.outstation_route_vehicles` (`vehicle_model_id`) | `public.vehicle_models` (`id`) | Outgoing (Foreign Key) |

### `public.outstation_routes`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `code` | `text` | no | `—` | (code ~ '^[a-z0-9-]{2,80}$'::text) |
| `origin_name` | `text` | no | `—` | — |
| `destination_name` | `text` | no | `—` | — |
| `distance_km` | `numeric` | yes | `—` | (distance_km > (0)::numeric) |
| `duration_minutes` | `int4` | yes | `—` | (duration_minutes > 0) |
| `description` | `text` | yes | `—` | — |
| `image_url` | `text` | yes | `—` | — |
| `gallery` | `jsonb` | no | `'[]'::jsonb` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_route_id_fkey` | `public.bookings` (`route_id`) | `public.outstation_routes` (`id`) | Incoming (Referenced by) |
| `extra_charges_route_id_fkey` | `public.extra_charges` (`route_id`) | `public.outstation_routes` (`id`) | Incoming (Referenced by) |
| `outstation_route_vehicles_route_id_fkey` | `public.outstation_route_vehicles` (`route_id`) | `public.outstation_routes` (`id`) | Incoming (Referenced by) |

### `public.payment_webhook_events`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `provider` | `text` | no | `—` | — |
| `event_id` | `text` | no | `—` | — |
| `event_type` | `text` | no | `—` | — |
| `payload` | `jsonb` | no | `—` | — |
| `processed` | `bool` | no | `false` | — |
| `received_at` | `timestamptz` | no | `now()` | — |

### `public.payments`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `booking_id` | `uuid` | no | `—` | — |
| `provider` | `text` | no | `—` | — |
| `provider_order_id` | `text` | no | `—` | — |
| `provider_payment_id` | `text` | yes | `—` | — |
| `amount_paise` | `int8` | no | `—` | (amount_paise > 0) |
| `status` | `text` | no | `'pending'::text` | (status = ANY (ARRAY['pending'::text, 'captured'::text, 'failed'::text, 'needs_review'::text])) |
| `failure_reason` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `payments_booking_id_fkey` | `public.payments` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |

### `public.pet_taxi_policy`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `is_offered` | `bool` | no | `true` | — |
| `seat_protection_note` | `text` | no | `—` | — |
| `breed_restriction_note` | `text` | no | `'No breed or size restrictions'::text` | — |
| `comfort_stop_note` | `text` | no | `—` | — |
| `booking_instruction` | `text` | no | `'Customer must inform during booking'::text` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.profiles`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `full_name` | `text` | no | `—` | — |
| `phone` | `varchar(20)` | no | `—` | — |
| `email` | `varchar(255)` | yes | `—` | — |
| `role` | `user_role_enum` | no | `'customer'::user_role_enum` | enum: customer, content_editor, review_moderator, dispatcher, finance_operator, super_admin |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_user_id_fkey` | `public.bookings` (`user_id`) | `public.profiles` (`id`) | Incoming (Referenced by) |
| `device_registrations_user_id_fkey` | `public.device_registrations` (`user_id`) | `public.profiles` (`id`) | Incoming (Referenced by) |
| `review_links_created_by_fkey` | `public.review_links` (`created_by`) | `public.profiles` (`id`) | Incoming (Referenced by) |
| `review_submissions_reviewed_by_fkey` | `public.review_submissions` (`reviewed_by`) | `public.profiles` (`id`) | Incoming (Referenced by) |

### `public.rental_enquiries`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `ref` | `text` | no | `—` | — |
| `name` | `text` | no | `—` | — |
| `phone` | `text` | no | `—` | — |
| `email` | `text` | yes | `—` | — |
| `car_tier` | `text` | no | `—` | (car_tier = ANY (ARRAY['sedan'::text, 'ertiga'::text, 'innova'::text, 'tempo'::text, 'urbania'::text])) |
| `pickup_date` | `date` | no | `—` | — |
| `return_date` | `date` | no | `—` | (return_date >= pickup_date) |
| `pickup_location` | `text` | no | `—` | — |
| `with_driver` | `bool` | no | `false` | — |
| `note` | `text` | yes | `—` | — |
| `status` | `text` | no | `'new'::text` | (status = ANY (ARRAY['new'::text, 'contacted'::text, 'quoted'::text, 'done'::text, 'closed'::text, 'spam'::text])) |
| `notes` | `_text` | no | `'{}'::text[]` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.review_images`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `submission_id` | `uuid` | no | `—` | — |
| `storage_key` | `text` | no | `—` | — |
| `width` | `int4` | yes | `—` | — |
| `height` | `int4` | yes | `—` | — |
| `alt_text` | `text` | yes | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `status` | `text` | no | `'pending'::text` | (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `review_images_submission_id_fkey` | `public.review_images` (`submission_id`) | `public.review_submissions` (`id`) | Outgoing (Foreign Key) |

### `public.review_links`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `kind` | `text` | no | `—` | (kind = ANY (ARRAY['qr'::text, 'booking'::text])) |
| `token_hash` | `text` | no | `—` | — |
| `booking_id` | `uuid` | yes | `—` | — |
| `label` | `text` | yes | `—` | — |
| `prefill` | `jsonb` | no | `'{}'::jsonb` | — |
| `expires_at` | `timestamptz` | yes | `—` | — |
| `revoked_at` | `timestamptz` | yes | `—` | — |
| `used_at` | `timestamptz` | yes | `—` | — |
| `email_sent_at` | `timestamptz` | yes | `—` | — |
| `email_last_error` | `text` | yes | `—` | — |
| `created_by` | `uuid` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `review_links_booking_id_fkey` | `public.review_links` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |
| `review_links_created_by_fkey` | `public.review_links` (`created_by`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |
| `review_submissions_link_id_fkey` | `public.review_submissions` (`link_id`) | `public.review_links` (`id`) | Incoming (Referenced by) |

### `public.review_submissions`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `link_id` | `uuid` | no | `—` | — |
| `booking_id` | `uuid` | yes | `—` | — |
| `display_name` | `text` | no | `—` | — |
| `rating` | `int4` | yes | `—` | ((rating >= 1) AND (rating <= 5)) |
| `review_text` | `text` | no | `—` | — |
| `tour_name` | `text` | yes | `—` | — |
| `route_text` | `text` | yes | `—` | — |
| `social_platform` | `text` | yes | `—` | (social_platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'youtube'::text, 'x'::text, 'linkedin'::text])); ((social_platform IS NULL) = (social_username IS NULL)) |
| `social_username` | `text` | yes | `—` | ((social_platform IS NULL) = (social_username IS NULL)) |
| `consent_public` | `bool` | no | `—` | — |
| `status` | `text` | no | `'pending'::text` | (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])) |
| `show_on_homepage` | `bool` | no | `false` | — |
| `show_in_gallery` | `bool` | no | `false` | — |
| `reviewed_by` | `uuid` | yes | `—` | — |
| `reviewed_at` | `timestamptz` | yes | `—` | — |
| `rejection_reason` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `review_submissions_booking_id_fkey` | `public.review_submissions` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |
| `review_submissions_link_id_fkey` | `public.review_submissions` (`link_id`) | `public.review_links` (`id`) | Outgoing (Foreign Key) |
| `review_submissions_reviewed_by_fkey` | `public.review_submissions` (`reviewed_by`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |
| `review_images_submission_id_fkey` | `public.review_images` (`submission_id`) | `public.review_submissions` (`id`) | Incoming (Referenced by) |

### `public.schema_migrations`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `text` | no | `—` | — |
| `applied_at` | `timestamptz` | no | `now()` | — |
| `checksum` | `text` | yes | `—` | — |

### `public.site_publish_events`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `entity_type` | `text` | no | `—` | (entity_type = ANY (ARRAY['outstation_route'::text, 'local_package'::text, 'transfer'::text, 'tour_package'::text, 'review'::text])) |
| `entity_id` | `uuid` | no | `—` | — |
| `event_type` | `text` | no | `—` | (event_type = ANY (ARRAY['published'::text, 'updated'::text, 'archived'::text, 'slug_changed'::text, 'price_changed'::text, 'review_approved'::text])) |
| `status` | `text` | no | `'pending'::text` | (status = ANY (ARRAY['pending'::text, 'processing'::text, 'triggered'::text, 'succeeded'::text, 'failed'::text, 'superseded'::text])) |
| `attempt_count` | `int4` | no | `0` | — |
| `next_attempt_at` | `timestamptz` | no | `now()` | — |
| `deployment_ref` | `text` | yes | `—` | — |
| `last_error` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `processed_at` | `timestamptz` | yes | `—` | — |

### `public.tour_packages`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `code` | `text` | no | `—` | (code ~ '^[a-z0-9-]{2,80}$'::text) |
| `name` | `text` | no | `—` | — |
| `duration_text` | `text` | no | `—` | — |
| `days` | `int4` | no | `1` | — |
| `nights` | `int4` | no | `0` | — |
| `source` | `text` | no | `'Agra'::text` | — |
| `destination` | `text` | no | `''::text` | — |
| `description` | `text` | yes | `—` | — |
| `inclusions_highlight` | `text` | yes | `—` | — |
| `inclusions_note` | `text` | yes | `—` | — |
| `image_url` | `text` | yes | `—` | — |
| `gallery` | `jsonb` | no | `'[]'::jsonb` | — |
| `inclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `exclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `itinerary` | `jsonb` | no | `'[]'::jsonb` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_tour_package_id_fkey` | `public.bookings` (`tour_package_id`) | `public.tour_packages` (`id`) | Incoming (Referenced by) |
| `extra_charges_tour_package_id_fkey` | `public.extra_charges` (`tour_package_id`) | `public.tour_packages` (`id`) | Incoming (Referenced by) |
| `fare_rules_tour_package_id_fkey` | `public.fare_rules` (`tour_package_id`) | `public.tour_packages` (`id`) | Incoming (Referenced by) |

### `public.transfers`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `code` | `text` | no | `—` | (code ~ '^[a-z0-9-]{2,80}$'::text) |
| `name` | `text` | no | `—` | — |
| `pickup_name` | `text` | no | `—` | — |
| `drop_name` | `text` | no | `—` | — |
| `description` | `text` | yes | `—` | — |
| `inclusions_highlight` | `text` | yes | `—` | — |
| `inclusions_note` | `text` | yes | `—` | — |
| `image_url` | `text` | yes | `—` | — |
| `gallery` | `jsonb` | no | `'[]'::jsonb` | — |
| `inclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `exclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_transfer_id_fkey` | `public.bookings` (`transfer_id`) | `public.transfers` (`id`) | Incoming (Referenced by) |
| `extra_charges_transfer_id_fkey` | `public.extra_charges` (`transfer_id`) | `public.transfers` (`id`) | Incoming (Referenced by) |
| `fare_rules_transfer_id_fkey` | `public.fare_rules` (`transfer_id`) | `public.transfers` (`id`) | Incoming (Referenced by) |

### `public.url_redirects`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `old_path` | `text` | no | `—` | (old_path <> new_path) |
| `new_path` | `text` | no | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

### `public.vehicle_groups`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `code` | `text` | no | `—` | (code = ANY (ARRAY['sedan'::text, 'suv'::text, 'luxury'::text, 'tempo_traveller'::text])) |
| `name` | `text` | no | `—` | — |
| `driver_allowance_per_day` | `int4` | no | `0` | (driver_allowance_per_day >= 0) |
| `one_way_night_charge` | `int4` | no | `0` | (one_way_night_charge >= 0) |
| `round_trip_halt_per_night` | `int4` | no | `0` | (round_trip_halt_per_night >= 0) |
| `sort_order` | `int4` | no | `0` | — |
| `is_active` | `bool` | no | `true` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `extra_charges_vehicle_group_id_fkey` | `public.extra_charges` (`vehicle_group_id`) | `public.vehicle_groups` (`id`) | Incoming (Referenced by) |
| `vehicle_models_vehicle_group_id_fkey` | `public.vehicle_models` (`vehicle_group_id`) | `public.vehicle_groups` (`id`) | Incoming (Referenced by) |

### `public.vehicle_models`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `vehicle_group_id` | `uuid` | no | `—` | — |
| `make` | `text` | no | `—` | — |
| `model_name` | `text` | no | `—` | — |
| `display_name` | `text` | no | `—` | — |
| `passenger_capacity` | `int4` | no | `—` | (passenger_capacity > 0) |
| `luggage_capacity` | `int4` | yes | `—` | (luggage_capacity >= 0) |
| `image_url` | `text` | yes | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `is_active` | `bool` | no | `true` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `vehicle_models_vehicle_group_id_fkey` | `public.vehicle_models` (`vehicle_group_id`) | `public.vehicle_groups` (`id`) | Outgoing (Foreign Key) |
| `bookings_vehicle_model_id_fkey` | `public.bookings` (`vehicle_model_id`) | `public.vehicle_models` (`id`) | Incoming (Referenced by) |
| `fare_rules_vehicle_model_id_fkey` | `public.fare_rules` (`vehicle_model_id`) | `public.vehicle_models` (`id`) | Incoming (Referenced by) |
| `outstation_route_vehicles_vehicle_model_id_fkey` | `public.outstation_route_vehicles` (`vehicle_model_id`) | `public.vehicle_models` (`id`) | Incoming (Referenced by) |

## Live advisory & RLS State

> **RLS Status Summary:** 33 tables have RLS enabled, and 0 tables currently have RLS disabled.

### Tables with RLS DISABLED:
