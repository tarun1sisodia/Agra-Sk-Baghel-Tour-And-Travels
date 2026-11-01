-- Create transfer_routes table (recreated after fare system rebuild)
-- This table stores airport/station transfer route definitions

CREATE TABLE IF NOT EXISTS transfers_routes (
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

-- Index for status (used in published transfer queries)
CREATE INDEX IF NOT EXISTS idx_transfer_routes_status ON transfer_routes(status);

-- Enable Row Level Security
ALTER TABLE transfer_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access to published transfers
DROP POLICY IF EXISTS transfer_routes_public_read ON transfer_routes;
CREATE POLICY transfer_routes_public_read ON transfer_routes
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Admin full access (via auth role check)
DROP POLICY IF EXISTS transfer_routes_admin_full ON transfer_routes;
CREATE POLICY transfer_routes_admin_full ON transfer_routes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('content_editor', 'super_admin')
    )
  );
