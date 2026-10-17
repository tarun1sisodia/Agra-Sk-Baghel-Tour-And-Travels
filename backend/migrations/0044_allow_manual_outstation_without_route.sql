-- Manual desk/phone bookings accept free-form origin and destination values.
-- They intentionally have no catalogue route UUID, so retain category and
-- foreign-key exclusivity while making route_id optional for outstation rows.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_check3;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_check3 CHECK (
    (category = 'outstation'    AND local_package_id IS NULL AND transfer_id IS NULL AND tour_package_id IS NULL AND trip_type IS NOT NULL) OR
    (category = 'local_package' AND route_id IS NULL AND local_package_id IS NOT NULL AND transfer_id IS NULL AND tour_package_id IS NULL AND trip_type IS NULL) OR
    (category = 'transfer'      AND route_id IS NULL AND local_package_id IS NULL AND transfer_id IS NOT NULL AND tour_package_id IS NULL AND trip_type IS NULL) OR
    (category = 'tour_package'  AND route_id IS NULL AND local_package_id IS NULL AND transfer_id IS NULL AND tour_package_id IS NOT NULL AND trip_type IS NULL)
  );
