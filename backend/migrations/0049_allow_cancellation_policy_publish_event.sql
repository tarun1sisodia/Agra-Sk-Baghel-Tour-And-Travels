-- Allow cancellation_policy in site_publish_events
ALTER TABLE site_publish_events DROP CONSTRAINT IF EXISTS site_publish_events_entity_type_check;
ALTER TABLE site_publish_events ADD CONSTRAINT site_publish_events_entity_type_check
  CHECK (entity_type IN ('outstation_route','local_package','transfer','tour_package','review','cancellation_policy'));
