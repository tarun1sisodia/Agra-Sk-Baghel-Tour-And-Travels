-- Seeds for Clean Rebuild of Fare System & Products (fare-system-final-spec.md)

-- 1. Vehicle Groups
insert into vehicle_groups (id, code, name, driver_allowance_per_day, one_way_night_charge, round_trip_halt_per_night, sort_order, is_active)
values
  ('10000000-0000-0000-0001-000000000001', 'sedan', 'Sedan', 500, 0, 0, 1, true),
  ('10000000-0000-0000-0001-000000000002', 'suv', 'SUV', 500, 0, 0, 2, true),
  ('10000000-0000-0000-0001-000000000003', 'luxury', 'Luxury', 500, 0, 0, 3, true),
  ('10000000-0000-0000-0001-000000000004', 'tempo_traveller', 'Tempo Traveller', 700, 0, 0, 4, true)
on conflict (code) do update set
  driver_allowance_per_day = excluded.driver_allowance_per_day,
  sort_order = excluded.sort_order;

-- 2. Fare Settings
insert into fare_settings (key, value)
values
  ('advance_percent', 28),
  ('min_km_per_day', 300),
  ('max_round_trip_days', 5), -- Requirement B: approved 5 calendar days limit
  ('night_start_hour', 20),
  ('night_end_hour', 6)
on conflict (key) do update set
  value = excluded.value;

-- 3. Vehicle Models
insert into vehicle_models (id, vehicle_group_id, make, model_name, display_name, passenger_capacity, luggage_capacity, sort_order, is_active)
values
  ('10000000-0000-0000-0002-000000000001', '10000000-0000-0000-0001-000000000001', 'Maruti', 'Dzire', 'Maruti Dzire', 4, 2, 1, true),
  ('10000000-0000-0000-0002-000000000002', '10000000-0000-0000-0001-000000000001', 'Honda', 'City', 'Honda City', 4, 3, 2, true),
  ('10000000-0000-0000-0002-000000000003', '10000000-0000-0000-0001-000000000002', 'Maruti', 'Ertiga', 'Maruti Ertiga', 6, 3, 3, true),
  ('10000000-0000-0000-0002-000000000004', '10000000-0000-0000-0001-000000000002', 'Toyota', 'Innova Crysta', 'Innova Crysta', 7, 4, 4, true),
  ('10000000-0000-0000-0002-000000000005', '10000000-0000-0000-0001-000000000002', 'Toyota', 'Fortuner', 'Toyota Fortuner', 7, 4, 5, true),
  ('10000000-0000-0000-0002-000000000006', '10000000-0000-0000-0001-000000000003', 'Toyota', 'Camry', 'Toyota Camry', 4, 3, 6, true),
  ('10000000-0000-0000-0002-000000000007', '10000000-0000-0000-0001-000000000003', 'Toyota', 'Vellfire', 'Toyota Vellfire', 6, 4, 7, true),
  ('10000000-0000-0000-0002-000000000008', '10000000-0000-0000-0001-000000000004', 'Force', 'Traveller 12', 'Force Traveller 12-seater', 12, 10, 8, true),
  ('10000000-0000-0000-0002-000000000009', '10000000-0000-0000-0001-000000000004', 'Force', 'Traveller 17', 'Force Traveller 17-seater', 17, 12, 9, true),
  ('10000000-0000-0000-0002-000000000010', '10000000-0000-0000-0001-000000000004', 'Force', 'Urbania 13', 'Force Urbania 13-seater', 13, 10, 10, true)
on conflict (id) do update set
  display_name = excluded.display_name,
  passenger_capacity = excluded.passenger_capacity;

-- 4. Global Outstation round-trip ₹/km in fare_rules
insert into fare_rules (category, vehicle_model_id, amount, is_active)
values
  ('outstation', '10000000-0000-0000-0002-000000000001', 10, true),
  ('outstation', '10000000-0000-0000-0002-000000000002', 13, true),
  ('outstation', '10000000-0000-0000-0002-000000000003', 14, true),
  ('outstation', '10000000-0000-0000-0002-000000000004', 18, true),
  ('outstation', '10000000-0000-0000-0002-000000000005', 28, true),
  ('outstation', '10000000-0000-0000-0002-000000000006', 40, true),
  ('outstation', '10000000-0000-0000-0002-000000000007', 45, true),
  ('outstation', '10000000-0000-0000-0002-000000000008', 25, true),
  ('outstation', '10000000-0000-0000-0002-000000000009', 28, true),
  ('outstation', '10000000-0000-0000-0002-000000000010', 34, true)
on conflict do nothing;

-- 5. Starter Published Route: Agra to Delhi
insert into outstation_routes (id, code, origin_name, destination_name, distance_km, duration_minutes, description, status)
values
  ('20000000-0000-0000-0001-000000000001', 'agra-to-delhi', 'Agra', 'Delhi', 230.0, 240, 'Direct highway travel between Agra and Delhi via Yamuna Expressway.', 'published')
on conflict (code) do update set
  distance_km = excluded.distance_km,
  duration_minutes = excluded.duration_minutes,
  status = excluded.status;

-- 6. Route Vehicles for Agra to Delhi
insert into outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, terms, sort_order, is_active)
values
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000001', 2500, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 1, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000002', 3100, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 2, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000003', 3600, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 3, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000004', 4500, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 4, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000005', 6800, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 5, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000006', 9800, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 6, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000007', 11000, true, '{"one_way":{"inclusions":["Toll Tax","State Tax"],"exclusions":["Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 7, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000008', 7500, true, '{"one_way":{"inclusions":["State Tax"],"exclusions":["Tolls","Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 8, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000009', 8500, true, '{"one_way":{"inclusions":["State Tax"],"exclusions":["Tolls","Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 9, true),
  ('20000000-0000-0000-0001-000000000001', '10000000-0000-0000-0002-000000000010', 11000, true, '{"one_way":{"inclusions":["State Tax"],"exclusions":["Tolls","Parking"]},"round_trip":{"inclusions":["Driver Allowance","Fuel"],"exclusions":["Tolls","Parking"]}}', 10, true)
on conflict (route_id, vehicle_model_id) do update set
  one_way_amount = excluded.one_way_amount,
  round_trip_enabled = excluded.round_trip_enabled;

-- 7. Policy Note-Only Extra Charges (amount is null: messages only)
insert into extra_charges (category, label, amount, is_active)
values
  ('outstation', 'Extra kilometers beyond booked distance to be settled directly with the driver as per vehicle policy.', null, true),
  ('local_package', 'Extra hours and kilometers beyond package limits to be settled directly with the driver.', null, true)
on conflict do nothing;
