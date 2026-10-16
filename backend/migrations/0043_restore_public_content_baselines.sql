-- 0043_restore_public_content_baselines.sql
-- Restore source-defined baseline content missing from the configured API database,
-- and provide valid existing repository assets for published packages without media.
-- Every operation is additive or conditional and safe to re-run.

UPDATE public.tour_packages
SET
  image_url = '/assets/packages/golden-triangle.webp',
  gallery = jsonb_build_array(jsonb_build_object(
    'url', '/assets/packages/golden-triangle.webp',
    'alt', 'Golden Triangle Tour (3 Days / 2 Nights)',
    'caption', 'Golden Triangle Tour (3 Days / 2 Nights)'
  )),
  updated_at = now()
WHERE code = 'golden-triangle-3d'
  AND status = 'published'
  AND NULLIF(BTRIM(image_url), '') IS NULL
  AND COALESCE(gallery, '[]'::jsonb) = '[]'::jsonb;

UPDATE public.local_packages
SET
  image_url = '/assets/booking/taj-mahal.webp',
  gallery = jsonb_build_array(jsonb_build_object(
    'url', '/assets/booking/taj-mahal.webp',
    'alt', 'Agra Sightseeing - Taj Mahal',
    'caption', 'Agra Sightseeing'
  )),
  updated_at = now()
WHERE code = 'agra-8h-80km'
  AND status = 'published'
  AND NULLIF(BTRIM(image_url), '') IS NULL
  AND COALESCE(gallery, '[]'::jsonb) = '[]'::jsonb;

UPDATE public.local_packages
SET
  image_url = '/assets/packages/agra-fort.webp',
  gallery = jsonb_build_array(jsonb_build_object(
    'url', '/assets/packages/agra-fort.webp',
    'alt', 'Agra local tour',
    'caption', 'Agra local tour'
  )),
  updated_at = now()
WHERE code = 'ram-bagh-to-sikandra-tour'
  AND status = 'published'
  AND NULLIF(BTRIM(image_url), '') IS NULL
  AND COALESCE(gallery, '[]'::jsonb) = '[]'::jsonb;

-- Company profile is required by the public content manifest singleton lookup.
INSERT INTO public.company_profile (
  brand_name, office_address, primary_phone, whatsapp_number, email, gstin,
  operating_hours, maps_location, dossier_version, dossier_status
)
SELECT
  'SK Baghel Tour & Travels',
  'Taj Ganj, Agra, Uttar Pradesh 282001',
  '+91 97628 17598',
  '+91 97628 17598',
  '[TBD — confirm with client]',
  '[TBD — confirm with client]',
  'Bookings Open 24×7, 365 Days',
  'https://maps.google.com/?q=Agra',
  '1.0',
  'pending_review'
WHERE NOT EXISTS (SELECT 1 FROM public.company_profile);

-- Pet-taxi has been discontinued by migration 0029; seed that final policy state.
INSERT INTO public.pet_taxi_policy (
  is_offered, seat_protection_note, breed_restriction_note,
  comfort_stop_note, booking_instruction
)
SELECT
  false,
  'Not applicable — pet taxi service discontinued per client policy.',
  'Pets and animals are not permitted inside vehicles.',
  'Standard comfort and hydration stops provided for human passengers.',
  'Pets are strictly not permitted in vehicles to maintain passenger hygiene.'
WHERE NOT EXISTS (SELECT 1 FROM public.pet_taxi_policy);

INSERT INTO public.cancellation_policies (
  policy_type, notice_period_text, sort_order, fee_retained_percent,
  refund_percent, rule_text
)
SELECT v.policy_type, v.notice_period_text, v.sort_order,
       v.fee_retained_percent, v.refund_percent, v.rule_text
FROM (VALUES
  ('cab', '24+ hours before departure', 1, 0::numeric, 100::numeric, 'Full refund, no questions asked.'),
  ('cab', '<24 hours before departure', 2, 100::numeric, 0::numeric, 'Advance retained to compensate driver and vehicle allocation.'),
  ('cab', 'No-show / Driver arrival dispatch', 3, 100::numeric, 0::numeric, 'Advance forfeited.'),
  ('tour_package', '61+ days prior to departure', 10, 0::numeric, 100::numeric, 'Full refund minus payment gateway transaction fee.'),
  ('tour_package', '46–60 days prior to departure', 11, 10::numeric, 90::numeric, '10% cancellation charge.'),
  ('tour_package', '31–45 days prior to departure', 12, 20::numeric, 80::numeric, '20% cancellation charge.'),
  ('tour_package', '16–30 days prior to departure', 13, 30::numeric, 70::numeric, '30% cancellation charge.'),
  ('tour_package', '6–15 days prior to departure', 14, 55::numeric, 45::numeric, '55% cancellation charge.'),
  ('tour_package', '0–5 days / No-show', 15, 100::numeric, 0::numeric, 'No refund applicable.')
) AS v(policy_type, notice_period_text, sort_order, fee_retained_percent, refund_percent, rule_text)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.cancellation_policies existing
  WHERE existing.policy_type = v.policy_type
    AND existing.notice_period_text = v.notice_period_text
);

INSERT INTO public.monuments (name, visiting_hours, closed_note, historical_context, sort_order)
VALUES
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

INSERT INTO public.dossier_signoffs (section_key, section_title, status)
VALUES
  ('fleet_rates', 'Fleet Specifications & Base Per-KM Rates', 'pending'),
  ('local_transfers', 'Local Sightseeing & Airport/Railway Transfers', 'pending'),
  ('one_way_routes', 'Intercity One-Way Expressway Corridors', 'pending'),
  ('outstation_rules', 'Outstation Round-Trip Rules & Daily Benchmarks', 'pending'),
  ('night_allowance', 'Driver Night Allowance Window & Charges', 'pending'),
  ('advance_deposit', '28% Advance Deposit Booking Formula', 'pending'),
  ('coupon', 'Promotional Coupon ASTTCAR500OFF', 'pending'),
  ('tour_packages', 'Signature Tour Packages & Pricing', 'pending'),
  ('cancellation', 'Cancellation & Refund Tier Schedules', 'pending'),
  ('specialized_offerings', 'Monument Operating Protocols & Heritage Guidelines', 'pending')
ON CONFLICT (section_key) DO NOTHING;

UPDATE public.dossier_signoffs
SET section_title = 'Monument Operating Protocols & Heritage Guidelines',
    updated_at = now()
WHERE section_key = 'specialized_offerings'
  AND section_title <> 'Monument Operating Protocols & Heritage Guidelines';
