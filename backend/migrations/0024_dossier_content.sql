-- 0024_dossier_content.sql
-- Dossier Database Template v2: Schema & Data Seeding
-- Implements commercial tables for local packages, transfer routes, tour packages,
-- package vehicle upgrades, cancellation policies, company profile, dossier signoffs,
-- monuments, and pet taxi policy. Extends route_catalog with universal pricing columns.

-- 1. Extend route_catalog with universal pricing columns
ALTER TABLE route_catalog
  ADD COLUMN IF NOT EXISTS use_per_km BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS per_km_rate_override NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS highway TEXT,
  ADD COLUMN IF NOT EXISTS all_inclusive_note TEXT;

-- 2. Local Sightseeing Packages
CREATE TABLE IF NOT EXISTS local_sightseeing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code TEXT NOT NULL UNIQUE CHECK (package_code ~ '^[a-z0-9-]{2,80}$'),
  name TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  included_km INTEGER NOT NULL,
  covers TEXT NOT NULL,
  parking_note TEXT,
  fleet_prices JSONB NOT NULL,
  use_per_km BOOLEAN NOT NULL DEFAULT false,
  extra_rates JSONB,
  night_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_local_packages_status ON local_sightseeing_packages(status);

-- 3. Point-to-Point Transfer Routes
CREATE TABLE IF NOT EXISTS transfer_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code TEXT NOT NULL UNIQUE CHECK (route_code ~ '^[a-z0-9-]{2,80}$'),
  name TEXT NOT NULL,
  distance_text TEXT,
  direction_note TEXT,
  fleet_prices JSONB NOT NULL,
  use_per_km BOOLEAN NOT NULL DEFAULT false,
  night_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transfer_routes_status ON transfer_routes(status);

-- 4. Tour Packages
CREATE TABLE IF NOT EXISTS tour_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code TEXT NOT NULL UNIQUE CHECK (package_code ~ '^[a-z0-9-]{2,80}$') ,
  name TEXT NOT NULL,
  duration_text TEXT NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  nights INTEGER NOT NULL DEFAULT 0,
  base_tier_code TEXT NOT NULL DEFAULT 'sedan',
  starting_price_inr NUMERIC(10, 2) NOT NULL CHECK (starting_price_inr > 0),
  fleet_prices JSONB NOT NULL,
  night_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  inclusions_highlight TEXT,
  inclusions_note TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tour_packages_status ON tour_packages(status);

-- 5. Package Vehicle Upgrades
CREATE TABLE IF NOT EXISTS package_vehicle_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES tour_packages(id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL,
  passenger_note TEXT,
  surcharge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_upgrades_global
  ON package_vehicle_upgrades (tier_code) WHERE package_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_upgrades_package
  ON package_vehicle_upgrades (package_id, tier_code) WHERE package_id IS NOT NULL;

-- 6. Cancellation Policies
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL CHECK (policy_type IN ('cab', 'tour_package')),
  notice_period_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  fee_retained_percent NUMERIC(5, 2) NOT NULL CHECK (fee_retained_percent >= 0 AND fee_retained_percent <= 100),
  refund_percent NUMERIC(5, 2) NOT NULL CHECK (refund_percent >= 0 AND refund_percent <= 100),
  rule_text TEXT NOT NULL,
  refund_timeline_note TEXT NOT NULL DEFAULT '5–7 business days to original bank/UPI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cancellation_policies_type_order ON cancellation_policies(policy_type, sort_order);

-- 7. Company Profile
CREATE TABLE IF NOT EXISTS company_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL DEFAULT 'Agra SK Baghel Tour & Travels',
  office_address TEXT NOT NULL DEFAULT 'Taj Ganj, Agra, Uttar Pradesh 282001',
  primary_phone TEXT NOT NULL DEFAULT '+91 97628 17598',
  whatsapp_number TEXT NOT NULL DEFAULT '+91 97628 17598',
  email TEXT NOT NULL DEFAULT '[TBD — confirm with client]',
  gstin TEXT NOT NULL DEFAULT '[TBD — confirm with client]',
  operating_hours TEXT NOT NULL DEFAULT 'Bookings Open 24×7, 365 Days',
  maps_location TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=Agra',
  dossier_version TEXT NOT NULL DEFAULT '1.0',
  dossier_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (dossier_status IN ('pending_review', 'signed_off', 'modifications_needed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Dossier Sign-offs
CREATE TABLE IF NOT EXISTS dossier_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE CHECK (section_key ~ '^[a-z0-9_-]{2,80}$'),
  section_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'modification_requested')),
  client_notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Monuments
CREATE TABLE IF NOT EXISTS monuments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  visiting_hours TEXT NOT NULL,
  closed_note TEXT NOT NULL DEFAULT 'Open all days',
  historical_context TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_monuments_sort_order ON monuments(sort_order);

-- 10. Pet Taxi Policy
CREATE TABLE IF NOT EXISTS pet_taxi_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_offered BOOLEAN NOT NULL DEFAULT true,
  seat_protection_note TEXT NOT NULL,
  breed_restriction_note TEXT NOT NULL DEFAULT 'No breed or size restrictions',
  comfort_stop_note TEXT NOT NULL,
  booking_instruction TEXT NOT NULL DEFAULT 'Customer must inform during booking',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SEED DATA (Draft & Initial Benchmark Rows) ──────────────────────────────

-- Seed 9 Dossier Corridors into route_catalog as draft/needs_review=true
INSERT INTO route_catalog (
  trip_type, source_city, source_detail, destination_city, slug,
  distance_km, duration_text, available_fleets, fares_inr,
  driver_charge_inr, night_halt_inr, toll_included, min_km_per_day,
  status, needs_review, use_per_km, highway, all_inclusive_note
) VALUES
(
  'one-way', 'Agra', NULL, 'Delhi', 'agra-to-delhi-taxi',
  210, '3.5 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":3499,"ertiga":4200,"innova":5200,"tempo":8500,"urbania":11500}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'Yamuna Expressway',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', NULL, 'Noida', 'agra-to-noida-taxi',
  190, '3.0 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":3499,"ertiga":4200,"innova":5200,"tempo":8500,"urbania":11500}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'Yamuna Expressway',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', NULL, 'Gurgaon', 'agra-to-gurgaon-taxi',
  215, '3.8 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":3699,"ertiga":4400,"innova":5500,"tempo":8900,"urbania":11900}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'Yamuna Exp + KMP / NH48',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', NULL, 'Jaipur', 'agra-to-jaipur-taxi',
  240, '4.5 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":3499,"ertiga":4200,"innova":5200,"tempo":8500,"urbania":11500}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'NH-21 (Agra–Bikaner)',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', 'Agra to Mathura / Vrindavan', 'Mathura', 'agra-to-mathura-vrindavan-taxi',
  58, '1.2 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":2200,"ertiga":2800,"innova":3600,"tempo":5200,"urbania":7200}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'NH-19 (Delhi–Agra)',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', NULL, 'Gwalior', 'agra-to-gwalior-taxi',
  120, '2.5 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":2800,"ertiga":3600,"innova":4600,"tempo":7200,"urbania":9800}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'NH-44 (North–South)',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', NULL, 'Lucknow', 'agra-to-lucknow-taxi',
  335, '4.5 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":5200,"ertiga":6800,"innova":8400,"tempo":12800,"urbania":16500}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'Agra–Lucknow Expressway',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Agra', NULL, 'Ayodhya', 'agra-to-ayodhya-taxi',
  470, '7.0 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":7800,"ertiga":9600,"innova":11900,"tempo":17500,"urbania":23000}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'Agra-LKO + Purvanchal',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
),
(
  'one-way', 'Delhi', NULL, 'Jaipur', 'delhi-to-jaipur-taxi',
  280, '4.5 Hours', '{sedan,ertiga,innova,tempo,urbania}',
  '{"sedan":4200,"ertiga":5400,"innova":6800,"tempo":10500,"urbania":14200}'::jsonb,
  0, 0, true, 300, 'draft', true, false, 'NH-48 / NE-4 (Mumbai Exp)',
  '100% all-inclusive of tolls, state taxes, chauffeur — no return fare'
)
ON CONFLICT (slug) DO UPDATE SET
  trip_type = EXCLUDED.trip_type,
  source_city = EXCLUDED.source_city,
  source_detail = EXCLUDED.source_detail,
  destination_city = EXCLUDED.destination_city,
  distance_km = EXCLUDED.distance_km,
  duration_text = EXCLUDED.duration_text,
  available_fleets = EXCLUDED.available_fleets,
  fares_inr = EXCLUDED.fares_inr,
  highway = EXCLUDED.highway,
  all_inclusive_note = EXCLUDED.all_inclusive_note,
  use_per_km = EXCLUDED.use_per_km;

-- Seed Cancellation Policies (3 cab rows + 6 tour package slabs)
INSERT INTO cancellation_policies (
  policy_type, notice_period_text, sort_order, fee_retained_percent, refund_percent, rule_text
) VALUES
('cab', '24+ hours before departure', 1, 0, 100, 'Full refund, no questions asked.'),
('cab', '<24 hours before departure', 2, 100, 0, 'Advance retained to compensate driver and vehicle allocation.'),
('cab', 'No-show / Driver arrival dispatch', 3, 100, 0, 'Advance forfeited.'),
('tour_package', '61+ days prior to departure', 10, 0, 100, 'Full refund minus payment gateway transaction fee.'),
('tour_package', '46–60 days prior to departure', 11, 10, 90, '10% cancellation charge.'),
('tour_package', '31–45 days prior to departure', 12, 20, 80, '20% cancellation charge.'),
('tour_package', '16–30 days prior to departure', 13, 30, 70, '30% cancellation charge.'),
('tour_package', '6–15 days prior to departure', 14, 55, 45, '55% cancellation charge.'),
('tour_package', '0–5 days / No-show', 15, 100, 0, 'No refund applicable.');

-- Seed Monuments (10 rows per dossier §10.2)
INSERT INTO monuments (name, visiting_hours, closed_note, historical_context, sort_order) VALUES
('Taj Mahal', '06:00 – 18:30 (Sunrise to Sunset)', 'Closed on Fridays', 'Crown jewel of Mughal architecture, UNESCO World Heritage site built by Shah Jahan.', 1),
('Agra Red Fort', '06:00 – 18:00', 'Open all days', 'Main residence of the emperors of the Mughal Dynasty until 1638.', 2),
('Fatehpur Sikri', '06:00 – 18:00', 'Open all days', 'Imperial red sandstone city founded by Emperor Akbar in 1571.', 3),
('Itmad-Ud-Daulah (Baby Taj)', '08:00 – 00:00 (Midnight)', 'Open all days', 'Tomb of Mirza Ghiyas Beg, precursor to the Taj Mahal with intricate pietra dura inlay.', 4),
('Mehtab Bagh', '06:00 – 21:00', 'Open all days', 'Moonlight garden providing sunset views of the Taj Mahal across the Yamuna River.', 5),
('Sikandra (Akbar Tomb)', '08:00 – 18:00', 'Open all days', 'Final resting place of Mughal Emperor Akbar, blending Islamic, Hindu, and Buddhist motifs.', 6),
('Jama Masjid Agra', '08:00 – 18:00', 'Open all days (Prayer hours restricted)', 'Opposite Agra Fort, built by Jahanara Begum in 1648.', 7),
('Moti Masjid (Pearl Mosque)', '06:00 – 18:00', 'Inside Agra Fort', 'Lustrous white marble mosque commissioned by Shah Jahan.', 8),
('Jodha Bai Ka Rauza', '10:00 – 19:00', 'Open all days', 'Largest residential palace complex inside Fatehpur Sikri.', 9),
('Mariam-Uz-Zamani Palace', '10:00 – 19:00', 'Open all days', 'Palace dedicated to Akbar Portuguese-Christian / Rajput consort.', 10)
ON CONFLICT (name) DO NOTHING;

-- Seed Pet Taxi Policy (1 row)
INSERT INTO pet_taxi_policy (
  is_offered, seat_protection_note, breed_restriction_note, comfort_stop_note, booking_instruction
) VALUES (
  true,
  'Waterproof heavy-duty seat covers and safety barriers provided.',
  'No breed or size restrictions for domestic pets.',
  'Chauffeurs accommodate comfort, hydration, and relief stops on expressways upon request.',
  'Customer must inform pet travel requirements during booking.'
);

-- Seed Company Profile (1 row, with TBD markers for unconfirmed legal details)
INSERT INTO company_profile (
  brand_name, office_address, primary_phone, whatsapp_number,
  email, gstin, operating_hours, maps_location, dossier_version, dossier_status
) VALUES (
  'Agra SK Baghel Tour & Travels',
  'Taj Ganj, Agra, Uttar Pradesh 282001',
  '+91 97628 17598',
  '+91 97628 17598',
  '[TBD — confirm with client]',
  '[TBD — confirm with client]',
  'Bookings Open 24×7, 365 Days',
  'https://maps.google.com/?q=Agra',
  '1.0',
  'pending_review'
);

-- Seed Dossier Sign-offs (10 checklist rows)
INSERT INTO dossier_signoffs (section_key, section_title, status) VALUES
('fleet_rates', 'Fleet Specifications & Base Per-KM Rates', 'pending'),
('local_transfers', 'Local Sightseeing & Airport/Railway Transfers', 'pending'),
('one_way_routes', 'Intercity One-Way Expressway Corridors', 'pending'),
('outstation_rules', 'Outstation Round-Trip Rules & Daily Benchmarks', 'pending'),
('night_allowance', 'Driver Night Allowance Window & Charges', 'pending'),
('advance_deposit', '28% Advance Deposit Booking Formula', 'pending'),
('coupon', 'Promotional Coupon ASTTCAR500OFF', 'pending'),
('tour_packages', 'Signature Tour Packages & Pricing', 'pending'),
('cancellation', 'Cancellation & Refund Tier Schedules', 'pending'),
('specialized_offerings', 'Pet Taxi & Monument Operating Protocols', 'pending')
ON CONFLICT (section_key) DO NOTHING;

-- Seed Global Package Upgrades (4 rows, package_id IS NULL)
INSERT INTO package_vehicle_upgrades (package_id, tier_code, passenger_note, surcharge_inr) VALUES
(NULL, 'ertiga', 'Up to 6 Passengers', 800),
(NULL, 'innova', 'VIP Executive Comfort (6–7 Passengers)', 1800),
(NULL, 'tempo', 'Large Family / Group (12–16 Passengers)', 3500),
(NULL, 'urbania', 'Ultra-Luxury Luxury Van (10–17 Passengers)', 5500)
ON CONFLICT DO NOTHING;

-- Seed Local Sightseeing Packages (2 rows, draft)
INSERT INTO local_sightseeing_packages (
  package_code, name, duration_hours, included_km, covers, parking_note,
  fleet_prices, use_per_km, extra_rates, night_charge_inr, status
) VALUES
(
  'agra-standard-sightseeing', 'Agra Standard Sightseeing', 8, 80,
  'Taj Mahal, Agra Fort, Mehtab Bagh, Itmad-Ud-Daulah (Baby Taj), Sadar Bazaar, Kinari Bazaar',
  'Monument entry fees & parking billed at actuals',
  '{"sedan":1900,"ertiga":2600,"innova":2850,"tempo":5500,"urbania":7500}'::jsonb,
  false,
  '{"sedan":{"per_km":10,"per_hr":150},"ertiga":{"per_km":14,"per_hr":200},"innova":{"per_km":18,"per_hr":250},"tempo":{"per_km":25,"per_hr":400},"urbania":{"per_km":34,"per_hr":600}}'::jsonb,
  0, 'draft'
),
(
  'agra-extended-city-tour', 'Agra Extended City Tour', 12, 120,
  'Complete Agra heritage circuit including Fatehpur Sikri, Taj Mahal, and Agra Fort',
  'Monument entry fees & parking billed at actuals',
  '{"sedan":2200,"ertiga":2950,"innova":3100,"tempo":6500,"urbania":8500}'::jsonb,
  false,
  '{"sedan":{"per_km":10,"per_hr":150},"ertiga":{"per_km":14,"per_hr":200},"innova":{"per_km":18,"per_hr":250},"tempo":{"per_km":25,"per_hr":400},"urbania":{"per_km":34,"per_hr":600}}'::jsonb,
  0, 'draft'
)
ON CONFLICT (package_code) DO NOTHING;

-- Seed Transfer Routes (4 rows, draft)
INSERT INTO transfer_routes (
  route_code, name, distance_text, direction_note,
  fleet_prices, use_per_km, night_charge_inr, status
) VALUES
(
  'agc-station-drop', 'Agra Cantt Railway Station (AGC) Drop/Pickup', '~15–20 km',
  'Doorstep pickup or drop at Agra Cantt Railway Station',
  '{"sedan":800,"ertiga":900,"innova":1100,"tempo":2200,"urbania":3500}'::jsonb,
  false, 0, 'draft'
),
(
  'af-station-drop', 'Agra Fort Railway Station (AF) Drop/Pickup', '~12–15 km',
  'Doorstep pickup or drop at Agra Fort Railway Station',
  '{"sedan":800,"ertiga":900,"innova":1100,"tempo":2200,"urbania":3500}'::jsonb,
  false, 0, 'draft'
),
(
  'kheria-airport', 'Agra Airport (Kheria AGR) Transfer', '~15–25 km',
  'Doorstep pickup or drop at Agra Kheria Airport',
  '{"sedan":900,"ertiga":1050,"innova":1250,"tempo":2400,"urbania":3800}'::jsonb,
  false, 0, 'draft'
),
(
  'delhi-igi-oneway', 'Delhi IGI Airport (DEL) Direct Transfer (One-Way)', '225 km',
  'Direct expressway express transfer between Agra and Delhi IGI Airport',
  '{"sedan":3499,"ertiga":4200,"innova":5200,"tempo":8500,"urbania":11500}'::jsonb,
  false, 0, 'draft'
)
ON CONFLICT (route_code) DO NOTHING;

-- Seed Tour Packages (6 signature tours, draft)
INSERT INTO tour_packages (
  package_code, name, duration_text, days, nights, base_tier_code,
  starting_price_inr, fleet_prices, night_charge_inr,
  inclusions_highlight, status
) VALUES
(
  'agra-sightseeing', 'Same Day Agra Taj Mahal Tour', '1 Day', 1, 0, 'sedan',
  3499, '{"sedan":3499,"ertiga":4299,"innova":5299,"tempo":6999,"urbania":8999}'::jsonb,
  300,
  'Taj Mahal & Agra Fort with dedicated guide & private AC car', 'draft'
),
(
  'taj-mahal-sunrise-tour', 'Taj Mahal Sunrise Tour', '1 Day', 1, 0, 'sedan',
  12999, '{"sedan":12999,"ertiga":13799,"innova":14799,"tempo":16499,"urbania":18499}'::jsonb,
  300,
  'Sunrise VIP entry, Mehtab Bagh & breakfast at 5-star hotel', 'draft'
),
(
  'mathura-vrindavan', 'Mathura & Vrindavan Darshan', '1 Day', 1, 0, 'sedan',
  4200, '{"sedan":4200,"ertiga":5000,"innova":6000,"tempo":7700,"urbania":9700}'::jsonb,
  300,
  'Krishna Janmabhoomi, Banke Bihari, Prem Mandir & evening Aarti', 'draft'
),
(
  'gatimaan-express-agra-tour', 'Same Day Agra by Gatimaan Train', '1 Day', 1, 0, 'sedan',
  14999, '{"sedan":14999,"ertiga":15799,"innova":16799,"tempo":18499,"urbania":20499}'::jsonb,
  300,
  'Return Gatimaan train tickets, luxury station transfers & monument access', 'draft'
),
(
  'agra-unhurried', 'Agra Overnight Experience', '2 Days / 1 Night', 2, 1, 'sedan',
  7800, '{"sedan":7800,"ertiga":8600,"innova":9600,"tempo":11300,"urbania":13300}'::jsonb,
  300,
  'Sunset at Mehtab Bagh, Sunrise at Taj Mahal, Baby Taj & Fatehpur Sikri', 'draft'
),
(
  'golden-triangle', 'Golden Triangle Tour', '3 Days / 2 Nights', 3, 2, 'sedan',
  18500, '{"sedan":18500,"ertiga":19300,"innova":20300,"tempo":22000,"urbania":24000}'::jsonb,
  300,
  'Delhi, Agra & Jaipur circuit with highway tolls and chauffeur accommodation', 'draft'
)
ON CONFLICT (package_code) DO NOTHING;
