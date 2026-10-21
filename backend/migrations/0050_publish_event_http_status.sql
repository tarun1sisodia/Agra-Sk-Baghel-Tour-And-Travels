-- Persist the provider response status so the admin outbox can explain hook failures.
ALTER TABLE site_publish_events
  ADD COLUMN IF NOT EXISTS deploy_http_status integer;
