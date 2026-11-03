-- Restore the admin-configured local sightseeing surcharges on the canonical
-- local_packages table (rebuilt in 0038 without these columns). Existing rows
-- stay NULL: their historical prices cannot be inferred from UI placeholders.
ALTER TABLE local_packages
  ADD COLUMN IF NOT EXISTS extra_rates jsonb,
  ADD COLUMN IF NOT EXISTS night_charge_inr numeric,
  ADD COLUMN IF NOT EXISTS use_per_km boolean;
