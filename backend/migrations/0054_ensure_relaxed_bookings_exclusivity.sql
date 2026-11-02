-- Migration 0054: Guarantee the relaxed bookings category-exclusivity rule is in force.
--
-- 0044_allow_manual_outstation_without_route.sql drops the strict exclusivity
-- check (which required route_id for outstation bookings) and replaces it with a
-- relaxed version so manual desk/phone bookings can use free-form origin and
-- destination values with no catalogue route UUID.
--
-- On a database where 0044 was already recorded as applied against the pre-0038
-- bookings table, the 0038 rebuild silently reinstated the strict rule and 0044
-- never re-runs. This migration heals any such state by removing whichever
-- exclusivity variant is present and installing the relaxed rule under a stable
-- name (definition identical to 0044).
--
-- Properties:
-- * No-op when the relaxed rule is already in force (the normal outcome of
--   running 0044 against the 0038 schema).
-- * Detection is definition-based, so it works whatever the constraint is named.
-- * Safe to re-run: it is idempotent, and the relaxed check is a superset of the
--   strict one, so existing rows can never fail validation.

DO $$
DECLARE
  cons RECORD;
  has_strict boolean := false;
BEGIN
  -- The category-exclusivity check is the only check on bookings that references
  -- all four product foreign keys. Flag it if any variant still encodes the
  -- strict (pre-0044) rule, which requires route_id for outstation rows.
  FOR cons IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.bookings'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%route_id%'
      AND pg_get_constraintdef(oid) LIKE '%local_package_id%'
      AND pg_get_constraintdef(oid) LIKE '%transfer_id%'
      AND pg_get_constraintdef(oid) LIKE '%tour_package_id%'
  LOOP
    IF position('route_id IS NOT NULL' in cons.def) > 0 THEN
      has_strict := true;
    END IF;
  END LOOP;

  IF has_strict THEN
    -- Remove every exclusivity variant, then install the relaxed rule.
    FOR cons IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.bookings'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%route_id%'
        AND pg_get_constraintdef(oid) LIKE '%local_package_id%'
        AND pg_get_constraintdef(oid) LIKE '%transfer_id%'
        AND pg_get_constraintdef(oid) LIKE '%tour_package_id%'
    LOOP
      EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', cons.conname);
    END LOOP;

    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_category_exclusivity CHECK (
        (category = 'outstation'    AND local_package_id IS NULL AND transfer_id IS NULL AND tour_package_id IS NULL AND trip_type IS NOT NULL) OR
        (category = 'local_package' AND route_id IS NULL AND local_package_id IS NOT NULL AND transfer_id IS NULL AND tour_package_id IS NULL AND trip_type IS NULL) OR
        (category = 'transfer'      AND route_id IS NULL AND local_package_id IS NULL AND transfer_id IS NOT NULL AND tour_package_id IS NULL AND trip_type IS NULL) OR
        (category = 'tour_package'  AND route_id IS NULL AND local_package_id IS NULL AND transfer_id IS NULL AND tour_package_id IS NOT NULL AND trip_type IS NULL)
      );
  END IF;
END $$;
