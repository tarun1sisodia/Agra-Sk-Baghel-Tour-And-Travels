-- 0042_widen_publish_events_entity_id.sql
-- Allow site_publish_events.entity_id to store text IDs (e.g. catalog_items, mock IDs) in addition to UUIDs
ALTER TABLE site_publish_events ALTER COLUMN entity_id TYPE text;
