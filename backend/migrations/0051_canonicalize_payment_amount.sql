-- Canonicalize the payment amount column. PostgreSQL folded the original
-- unquoted `amountPaise` identifier in migration 0038 to `amountpaise`.
-- Rename in place to preserve the existing data, indexes, and constraints.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'payments'
      AND column_name = 'amountpaise'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'payments'
      AND column_name = 'amount_paise'
  ) THEN
    ALTER TABLE payments RENAME COLUMN amountpaise TO amount_paise;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'payments'
      AND column_name = 'amount_paise'
  ) THEN
    RAISE EXCEPTION 'payments.amount_paise is missing; reconcile legacy payment columns before applying migration';
  END IF;
END $$;
