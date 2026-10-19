-- Avoid relying on the caller-controlled search_path in this trigger function.
-- The function uses only built-in NOW() and NEW trigger-row fields.
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;
