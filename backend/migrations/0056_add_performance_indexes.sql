-- Migration: 0056_add_performance_indexes.sql
-- Phase H2: Database performance optimization
--
-- Adds additional indexes for common query patterns to improve read performance
-- without impacting write performance significantly.
--
-- NOTE: this file was originally numbered 0043 and was written against the
-- pre-0038 schema (reviews, promo_codes, publication_outbox,
-- bookings.pickup_datetime). Migration 0038 dropped/rebuilt those relations,
-- so this file is renumbered to run after the rebuild and is defensive about
-- tables that may no longer exist (indexes for them are created only where the
-- table is present). It was renamed rather than edited in place so that
-- databases which already recorded the old id do not hit a checksum-drift
-- failure. Transfer-route queries are indexed separately on the `transfers`
-- table (see 0055_standardize_on_transfers.sql).

-- 1. Index for catalog items by status and type (used in public catalog queries)
CREATE INDEX IF NOT EXISTS idx_catalog_items_status_type
ON catalog_items (status, type);

-- 2. Index for catalog items by slug (used in item detail queries)
CREATE INDEX IF NOT EXISTS idx_catalog_items_slug
ON catalog_items (slug);

-- 3. Index for catalog item media by catalog_item_id (used in gallery queries)
CREATE INDEX IF NOT EXISTS idx_catalog_item_media_catalog_item_id
ON catalog_item_media (catalog_item_id);

-- 4. Index for catalog item media by status (used in draft/published media queries)
CREATE INDEX IF NOT EXISTS idx_catalog_item_media_status
ON catalog_item_media (status);

-- 5. Index for tour_packages by status (used in published package queries)
CREATE INDEX IF NOT EXISTS idx_tour_packages_status
ON tour_packages (status);

-- 6. Index for outstation_routes by status (used in published route queries)
CREATE INDEX IF NOT EXISTS idx_outstation_routes_status
ON outstation_routes (status);

-- 7. Index for local_packages by status (used in published local package queries)
CREATE INDEX IF NOT EXISTS idx_local_packages_status
ON local_packages (status);

-- 8. Index for monuments by status (used in published monument queries). The
-- monuments table (0024) has no status column in the current schema; create the
-- index only on databases where a legacy variant carries one.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'monuments' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_monuments_status ON monuments (status);
  END IF;
END $$;

-- 9. Index for bookings by customer_phone (used in customer lookup queries)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone
ON bookings (customer_phone);

-- 10. Index for bookings by customer_name (used in customer lookup queries)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name
ON bookings (customer_name);

-- 11. Index for bookings by pickup timestamp (used in dispatch and scheduling
-- queries). Column is pickup_at since the 0038 rebuild (it was pickup_datetime
-- before).
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_at
ON bookings (pickup_at);

-- 12. Index for bookings by status (used in status filter queries)
CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings (status);

-- 13. Index for payments by booking_id (used in payment lookup queries)
CREATE INDEX IF NOT EXISTS idx_payments_booking_id
ON payments (booking_id);

-- 14. Index for payments by status (used in payment status queries)
CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments (status);

-- 15. Index for inquiries by phone (used in inquiry lookup queries)
CREATE INDEX IF NOT EXISTS idx_inquiries_phone
ON inquiries (phone);

-- 16. Index for inquiries by status (used in inquiry status queries)
CREATE INDEX IF NOT EXISTS idx_inquiries_status
ON inquiries (status);

-- 17. Indexes for reviews (used in item review queries). The reviews table
-- was dropped by the 0038 fare-system rebuild; create the indexes only when a
-- database still carries the legacy table.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'catalog_item_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_catalog_item_id ON reviews (catalog_item_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
  END IF;
END $$;

-- 18. Index for publication_outbox by status (used in publish queue queries).
-- No migration creates this table (legacy/manual schema); index it if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_outbox' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_publication_outbox_status ON publication_outbox (status);
  END IF;
END $$;

-- 19. Index for site_publish_events by entity_id and entity_type (used in publish tracking)
CREATE INDEX IF NOT EXISTS idx_site_publish_events_entity
ON site_publish_events (entity_id, entity_type);

-- 20. Index for site_publish_events by status (used in publish status queries)
CREATE INDEX IF NOT EXISTS idx_site_publish_events_status
ON site_publish_events (status);

-- 21. Indexes for promo_codes (used in promo validation queries). The
-- promo_codes table was dropped by the 0038 fare-system rebuild; create the
-- indexes only when a database still carries the legacy table.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'code'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (code);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'valid_to'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_promo_codes_active_valid
    ON promo_codes (is_active, valid_to)
    WHERE is_active = true;
  END IF;
END $$;
