-- Clean Rebuild of Fare System & Products (fare-system-final-spec.md)
-- Step 1: Drop foreign keys from notification_jobs and device_registrations that point to old bookings
alter table if exists notification_jobs drop constraint if exists notification_jobs_booking_id_fkey;
alter table if exists notification_jobs drop constraint if exists fk_notification_jobs_booking;

alter table if exists device_registrations drop constraint if exists device_registrations_booking_id_fkey;
alter table if exists device_registrations drop constraint if exists fk_device_registrations_booking;

-- Step 2: Drop old / deprecated tables and views
drop view if exists transfers cascade;
drop view if exists local_tours cascade;
drop view if exists route_catalog cascade;
drop table if exists routes cascade;
drop table if exists payments cascade;
drop table if exists raw_webhooks cascade;
drop table if exists refunds cascade;
drop table if exists customer_booking_intents cascade;
drop table if exists bookings cascade;
drop table if exists reviews cascade;
drop table if exists package_vehicle_upgrades cascade;
drop table if exists promo_codes cascade;
drop table if exists local_sightseeing_packages cascade;
drop table if exists transfer_routes cascade;
drop table if exists route_catalog cascade;
drop table if exists fare_rules cascade;
drop table if exists tour_packages cascade;

-- Step 3: Clean up catalog_items columns
alter table if exists catalog_items drop column if exists starting_price_inr;
alter table if exists catalog_items drop column if exists distance_km;

-- Step 4: Drop legacy enums if they exist and are no longer referenced
drop type if exists vehicle_tier_enum cascade;
drop type if exists trip_type_enum cascade;
drop type if exists booking_status_enum cascade;
drop type if exists payment_status_enum cascade;
drop type if exists payment_provider_enum cascade;

-- Step 5: Create new tables

-- ===== Vehicles =====
create table vehicle_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('sedan','suv','luxury','tempo_traveller')),
  name text not null,
  driver_allowance_per_day int not null default 0 check (driver_allowance_per_day >= 0),
  one_way_night_charge int not null default 0 check (one_way_night_charge >= 0),
  round_trip_halt_per_night int not null default 0 check (round_trip_halt_per_night >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table vehicle_models (
  id uuid primary key default gen_random_uuid(),
  vehicle_group_id uuid not null references vehicle_groups(id),
  make text not null,
  model_name text not null,
  display_name text not null,
  passenger_capacity int not null check (passenger_capacity > 0),
  luggage_capacity int check (luggage_capacity >= 0),
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ===== Global numbers =====
create table fare_settings (
  key text primary key check (key in ('advance_percent','min_km_per_day','max_round_trip_days','night_start_hour','night_end_hour')),
  value int not null,
  check (
    (key = 'advance_percent' and value between 1 and 100) or
    (key in ('min_km_per_day','max_round_trip_days') and value > 0) or
    (key in ('night_start_hour','night_end_hour') and value between 0 and 23)
  )
);

-- ===== Products =====
create table outstation_routes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  origin_name text not null,
  destination_name text not null,
  distance_km numeric(7,1) check (distance_km > 0),
  duration_minutes int check (duration_minutes > 0),
  description text,
  image_url text,
  gallery jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  unique (origin_name, destination_name),
  check (status <> 'published' or (distance_km is not null and duration_minutes is not null))
);

create table local_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  duration_hours int check (duration_hours > 0),
  included_km int check (included_km > 0),
  covers text,
  description text,
  inclusions_highlight text,
  inclusions_note text,
  image_url text,
  gallery jsonb not null default '[]',
  inclusions jsonb not null default '[]',
  exclusions jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table transfers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  pickup_name text not null,
  drop_name text not null,
  description text,
  inclusions_highlight text,
  inclusions_note text,
  image_url text,
  gallery jsonb not null default '[]',
  inclusions jsonb not null default '[]',
  exclusions jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table tour_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  duration_text text not null,
  days int not null default 1,
  nights int not null default 0,
  source text not null default 'Agra',
  destination text not null default '',
  description text,
  inclusions_highlight text,
  inclusions_note text,
  image_url text,
  gallery jsonb not null default '[]',
  inclusions jsonb not null default '[]',
  exclusions jsonb not null default '[]',
  itinerary jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

-- ===== Outstation: Route Vehicles Grid =====
create table outstation_route_vehicles (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references outstation_routes(id),
  vehicle_model_id uuid not null references vehicle_models(id),
  one_way_amount int check (one_way_amount > 0),
  round_trip_enabled boolean not null default true,
  terms jsonb not null default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (route_id, vehicle_model_id),
  check (one_way_amount is not null or round_trip_enabled)
);

-- ===== Prices per car =====
create table fare_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_model_id uuid not null references vehicle_models(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),
  amount int not null check (amount > 0),
  is_active boolean not null default true,
  check (
    (category = 'outstation'    and local_package_id is null and transfer_id is null and tour_package_id is null) or
    (category = 'local_package' and local_package_id is not null and transfer_id is null and tour_package_id is null) or
    (category = 'transfer'      and transfer_id is not null and local_package_id is null and tour_package_id is null) or
    (category = 'tour_package'  and tour_package_id is not null and local_package_id is null and transfer_id is null)
  )
);

create unique index fare_rules_one_active
  on fare_rules (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id)
  nulls not distinct where is_active;

-- ===== Explicit charges and notes =====
create table extra_charges (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_group_id uuid references vehicle_groups(id),
  route_id uuid references outstation_routes(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),
  label text not null,
  amount int check (amount > 0),
  is_active boolean not null default true,
  check (
    (category = 'outstation'    and local_package_id is null and transfer_id is null and tour_package_id is null) or
    (category = 'local_package' and route_id is null and transfer_id is null and tour_package_id is null) or
    (category = 'transfer'      and route_id is null and local_package_id is null and tour_package_id is null) or
    (category = 'tour_package'  and route_id is null and local_package_id is null and transfer_id is null)
  )
);

create unique index extra_charges_no_duplicates
  on extra_charges (category, vehicle_group_id, route_id, local_package_id, transfer_id, tour_package_id, label)
  nulls not distinct where is_active;

-- ===== Bookings =====
create table bookings (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null unique,
  user_id uuid references profiles(id),
  guest_access_token text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_model_id uuid not null references vehicle_models(id),
  passenger_count int not null check (passenger_count > 0),
  route_id uuid references outstation_routes(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),
  trip_type text check (trip_type in ('one_way','round_trip')),
  pickup_at timestamptz not null,
  return_at timestamptz,
  pickup_address text not null,
  drop_address text,
  flight_train_number text,
  special_notes text,
  fare_breakdown jsonb not null,
  total_amount int not null check (total_amount > 0),
  advance_amount int not null check (advance_amount >= 0 and advance_amount <= total_amount),
  balance_amount int generated always as (total_amount - advance_amount) stored,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','confirmed','driver_assigned','in_transit','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (return_at is null or return_at > pickup_at),
  check (trip_type is distinct from 'round_trip' or return_at is not null),
  check (
    (category = 'outstation'    and route_id is not null and local_package_id is null and transfer_id is null and tour_package_id is null and trip_type is not null) or
    (category = 'local_package' and local_package_id is not null and route_id is null and transfer_id is null and tour_package_id is null and trip_type is null) or
    (category = 'transfer'      and transfer_id is not null and route_id is null and local_package_id is null and tour_package_id is null and trip_type is null) or
    (category = 'tour_package'  and tour_package_id is not null and route_id is null and local_package_id is null and transfer_id is null and trip_type is null)
  )
);

-- ===== Payments =====
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  provider text not null,
  provider_order_id text not null unique,
  provider_payment_id text unique,
  amountPaise bigint not null check (amountPaise > 0),
  status text not null default 'pending'
    check (status in ('pending','captured','failed','needs_review')),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_one_pending_per_booking on payments (booking_id) where status = 'pending';

create table payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);

-- ===== Reviews =====
create table review_links (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('qr','booking')),
  token_hash text not null unique,
  booking_id uuid references bookings(id),
  label text,
  prefill jsonb not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  used_at timestamptz,
  email_sent_at timestamptz,
  email_last_error text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check ((kind = 'booking') = (booking_id is not null))
);

create table review_submissions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references review_links(id),
  booking_id uuid references bookings(id),
  display_name text not null,
  rating int check (rating between 1 and 5),
  review_text text not null,
  tour_name text,
  route_text text,
  social_platform text check (social_platform in ('instagram','facebook','youtube','x','linkedin')),
  social_username text,
  consent_public boolean not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  show_on_homepage boolean not null default false,
  show_in_gallery boolean not null default false,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  check ((social_platform is null) = (social_username is null))
);

create table review_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references review_submissions(id),
  storage_key text not null,
  width int, height int, alt_text text,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- ===== Publishing Pipeline =====
create table site_publish_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('outstation_route','local_package','transfer','tour_package','review')),
  entity_id uuid not null,
  event_type text not null check (event_type in ('published','updated','archived','slug_changed','price_changed','review_approved')),
  status text not null default 'pending'
    check (status in ('pending','processing','triggered','succeeded','failed','superseded')),
  attempt_count int not null default 0,
  next_attempt_at timestamptz not null default now(),
  deployment_ref text,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index site_publish_events_one_pending
  on site_publish_events (entity_type, entity_id, event_type) where status = 'pending';

create table url_redirects (
  id uuid primary key default gen_random_uuid(),
  old_path text not null unique,
  new_path text not null,
  created_at timestamptz not null default now(),
  check (old_path <> new_path)
);

-- Step 6: Clear dangling test booking references and re-link foreign keys to new bookings(id)
alter table if exists notification_jobs alter column booking_id drop not null;
update notification_jobs set booking_id = null;
delete from notification_jobs where booking_id is not null;
update device_registrations set booking_id = null;
alter table notification_jobs add constraint fk_notification_jobs_booking foreign key (booking_id) references bookings(id) on delete set null;
alter table device_registrations add constraint fk_device_registrations_booking foreign key (booking_id) references bookings(id) on delete set null;

-- Step 7: Enable RLS on every new table
alter table vehicle_groups enable row level security;
alter table vehicle_models enable row level security;
alter table fare_settings enable row level security;
alter table outstation_routes enable row level security;
alter table local_packages enable row level security;
alter table transfers enable row level security;
alter table tour_packages enable row level security;
alter table outstation_route_vehicles enable row level security;
alter table fare_rules enable row level security;
alter table extra_charges enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table payment_webhook_events enable row level security;
alter table review_links enable row level security;
alter table review_submissions enable row level security;
alter table review_images enable row level security;
alter table site_publish_events enable row level security;
alter table url_redirects enable row level security;
