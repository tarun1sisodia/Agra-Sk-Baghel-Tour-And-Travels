-- Module 2: restore the promo ledger removed by the clean fare rebuild.
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code varchar(30) not null unique,
  title text not null default '',
  description text not null default '',
  discount_type text not null default 'FLAT' check (discount_type in ('PERCENTAGE','FLAT')),
  discount_value numeric(10,2) not null default 0 check (discount_value >= 0),
  max_discount_amount numeric(10,2),
  min_booking_amount numeric(10,2) not null default 0 check (min_booking_amount >= 0),
  applicable_categories text[] not null default '{all}',
  is_public boolean not null default false,
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  usage_limit int,
  used_count int not null default 0,
  -- Legacy aliases retained for existing fare and admin code.
  discount_amount numeric(8,2) not null default 0,
  min_total numeric(10,2) not null default 0,
  max_redemptions int,
  redemption_count int not null default 0,
  allow_group_vehicles boolean not null default false,
  is_broadcast boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_promo_codes_single_broadcast
  on promo_codes (is_broadcast) where is_broadcast;
create index if not exists idx_promo_codes_public_active on promo_codes (is_public, is_active);
