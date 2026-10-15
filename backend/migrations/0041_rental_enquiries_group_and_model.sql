-- 0041: Add canonical vehicle group, vehicle model, destination/itinerary, and passenger count to rental_enquiries
-- Expand-and-contract migration: fully backward-compatible with legacy car_tier enquiries.

ALTER TABLE rental_enquiries
  ADD COLUMN IF NOT EXISTS vehicle_group_code TEXT CHECK (vehicle_group_code IN ('sedan','suv','luxury','tempo_traveller')),
  ADD COLUMN IF NOT EXISTS vehicle_model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_or_itinerary TEXT,
  ADD COLUMN IF NOT EXISTS passengers INT CHECK (passengers IS NULL OR passengers > 0);

-- Make legacy car_tier column optional for future records while preserving historical values
ALTER TABLE rental_enquiries
  ALTER COLUMN car_tier DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rental_enquiries_group_code ON rental_enquiries(vehicle_group_code);
CREATE INDEX IF NOT EXISTS idx_rental_enquiries_model_id ON rental_enquiries(vehicle_model_id);
