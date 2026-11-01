-- Migration 0055: Standardize transfer-route storage on `transfers`.
--
-- Transfer products (airport/station pickups) live in the `transfers` table
-- created by the 0038 fare-system rebuild. Every application code path reads
-- and writes that table (see backend/src/db/postgres.ts: transferRoutes
-- repository -> `transfers`).
--
-- History: migration 0024 created a separate `transfer_routes` table; 0038
-- dropped it in favour of `transfers`. Migration 0052 later attempted to
-- resurrect `transfer_routes` (and was removed before release) after stale
-- docs made it look authoritative. This migration closes the loop:
-- * retires any leftover `transfer_routes` instance (unused by any code path),
-- * adds the status index the published-transfers listing queries actually use.

DROP TABLE IF EXISTS transfer_routes CASCADE;

CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers (status);
