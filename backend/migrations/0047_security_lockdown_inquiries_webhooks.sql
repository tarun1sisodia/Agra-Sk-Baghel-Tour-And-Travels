-- Security hardening: keep the legacy raw_webhooks compatibility view removed
-- and prevent direct Supabase API access to private inquiry/webhook records.
-- The Fastify backend remains the supported application path for inquiries.
DROP VIEW IF EXISTS public.raw_webhooks;
DROP POLICY IF EXISTS inquiries_anon_insert ON public.inquiries;
REVOKE ALL PRIVILEGES ON TABLE public.inquiries FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.payment_webhook_events FROM anon, authenticated;
