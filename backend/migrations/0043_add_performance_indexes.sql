-- Migration: 0043_add_performance_indexes.sql
-- Phase H2: Database performance optimization
--
-- Adds additional indexes for common query patterns to improve read performance
-- without impacting write performance significantly.

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

-- 8. Index for transfer_routes by status (used in published transfer queries)
CREATE INDEX IF NOT EXISTS idx_transfer_routes_status
ON transfer_routes (status);

-- 9. Index for monuments by status (used in published monument queries)
CREATE INDEX IF NOT EXISTS idx_monuments_status
ON monuments (status);

-- 10. Index for bookings by customer_phone (used in customer lookup queries)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone
ON bookings (customer_phone);

-- 11. Index for bookings by customer_name (used in customer lookup queries)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name
ON bookings (customer_name);

-- 12. Index for bookings by pickup_datetime (used in dispatch and scheduling queries)
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_datetime
ON bookings (pickup_datetime);

-- 13. Index for bookings by status (used in status filter queries)
CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings (status);

-- 14. Index for payments by booking_id (used in payment lookup queries)
CREATE INDEX IF NOT EXISTS idx_payments_booking_id
ON payments (booking_id);

-- 15. Index for payments by status (used in payment status queries)
CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments (status);

-- 16. Index for inquiries by phone (used in inquiry lookup queries)
CREATE INDEX IF NOT EXISTS idx_inquiries_phone
ON inquiries (phone);

-- 17. Index for inquiries by status (used in inquiry status queries)
CREATE INDEX IF NOT EXISTS idx_inquiries_status
ON inquiries (status);

-- 18. Index for reviews by catalog_item_id (used in item review queries)
CREATE INDEX IF NOT EXISTS idx_reviews_catalog_item_id
ON reviews (catalog_item_id);

-- 19. Index for reviews by status (used in review moderation queries)
CREATE INDEX IF NOT EXISTS idx_reviews_status
ON reviews (status);

-- 20. Index for publication_outbox by status (used in publish queue queries)
CREATE INDEX IF NOT EXISTS idx_publication_outbox_status
ON publication_outbox (status);

-- 21. Index for site_publish_events by entity_id and entity_type (used in publish tracking)
CREATE INDEX IF NOT EXISTS idx_site_publish_events_entity
ON site_publish_events (entity_id, entity_type);

-- 22. Index for site_publish_events by status (used in publish status queries)
CREATE INDEX IF NOT EXISTS idx_site_publish_events_status
ON site_publish_events (status);

-- 23. Index for promo_codes by code (used in promo validation queries)
CREATE INDEX IF NOT EXISTS idx_promo_codes_code
ON promo_codes (code);

-- 24. Index for promo_codes by is_active and valid_to (used in active promo queries)
CREATE INDEX IF NOT EXISTS idx_promo_codes_active_valid
ON promo_codes (is_active, valid_to)
WHERE is_active = true;
