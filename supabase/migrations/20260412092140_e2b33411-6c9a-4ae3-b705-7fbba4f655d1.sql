
-- Add new columns to distributors
ALTER TABLE public.distributors
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gstin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_ifsc text NOT NULL DEFAULT '';

-- Add missing account holder name to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS bank_account_name text NOT NULL DEFAULT '';
