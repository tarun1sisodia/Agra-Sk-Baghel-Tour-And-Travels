-- Add timestamps required by admin edit/publish operations for clean-catalog products.
-- Migration 0038 created these product tables without updated_at, while the
-- admin service updates that column for status changes and route edits.

ALTER TABLE outstation_routes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE local_packages
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE tour_packages
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
