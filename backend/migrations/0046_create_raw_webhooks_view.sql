-- Migration 0046: Compatibility view for raw_webhooks pointing to payment_webhook_events
-- Resolves PostgreSQL code 42P01 error (relation "raw_webhooks" does not exist) under legacy webhook deliveries.

CREATE OR REPLACE VIEW raw_webhooks AS
  SELECT
    id,
    provider,
    event_id,
    event_type,
    payload,
    ''::text AS payload_hash,
    processed,
    received_at
  FROM payment_webhook_events;
