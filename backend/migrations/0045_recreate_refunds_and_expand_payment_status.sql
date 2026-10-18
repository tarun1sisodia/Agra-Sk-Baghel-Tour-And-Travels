-- Migration 0045: Recreate refunds table and expand payments.status check constraint
-- Resolves Critical Audit Finding: migration 0038 dropped refunds cascade without recreation.
-- Also ensures payments.status check constraint permits 'refunded' and 'partially_refunded'.

-- 1. Expand payments.status check constraint and add finance/reconciliation columns
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'captured', 'failed', 'needs_review', 'refunded', 'partially_refunded'));

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'pending';

-- 1b. Expand bookings.status check constraint to support both Clean Fare and domain state machine
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('draft', 'pending_payment', 'confirmed', 'paid_confirmed', 'driver_assigned', 'in_transit', 'completed', 'cancelled', 'refunded'));

-- 2. Recreate refunds table with foreign keys to payments and bookings
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_refund_id VARCHAR(120) UNIQUE,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'processed',
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create performance and idempotency indexes
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_idempotency ON refunds(idempotency_key);

-- 4. Enable Row Level Security and service_role policy
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS refunds_service_role_all ON refunds;
CREATE POLICY refunds_service_role_all ON refunds FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');
