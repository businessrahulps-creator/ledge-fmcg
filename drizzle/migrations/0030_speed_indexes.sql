-- Lookups used every time the app opens (lists by business, newest first)
-- and by the dealer balance view / embedded line loads. Read speed only.
CREATE INDEX IF NOT EXISTS orders_company_created_idx ON public.orders (company_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS invoices_company_created_idx ON public.invoices (company_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS claims_company_created_idx ON public.claims (company_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS claim_lines_claim_idx ON public.claim_lines (claim_id);
CREATE INDEX IF NOT EXISTS order_schemes_order_idx ON public.order_schemes (order_id);
CREATE INDEX IF NOT EXISTS credit_notes_distributor_idx ON public.credit_notes (distributor_id);
CREATE INDEX IF NOT EXISTS invoice_payments_company_idx ON public.invoice_payments (company_id, paid_on DESC);
CREATE INDEX IF NOT EXISTS credit_notes_company_idx ON public.credit_notes (company_id, note_date DESC);