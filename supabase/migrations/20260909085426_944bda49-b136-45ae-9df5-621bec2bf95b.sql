-- ============ Phase 1: order-to-cash foundations (additive only) ============

-- 1. Company-level GST defaults
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS gst_price_basis text NOT NULL DEFAULT 'exclusive',
  ADD COLUMN IF NOT EXISTS default_gst_rate numeric(5,2) NOT NULL DEFAULT 18.00;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_gst_price_basis_chk
  CHECK (gst_price_basis IN ('exclusive','inclusive'));

-- 2. Product-level GST rate
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS gst_rate_confirmed boolean NOT NULL DEFAULT false;

-- 3. Order line detail
ALTER TABLE public.order_lines
  ADD COLUMN IF NOT EXISTS booked_quantity integer,
  ADD COLUMN IF NOT EXISTS loaded_quantity integer,
  ADD COLUMN IF NOT EXISTS free_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_short_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_basis text NOT NULL DEFAULT 'exclusive',
  ADD COLUMN IF NOT EXISTS scheme_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gross_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2) NOT NULL DEFAULT 0;

-- 4. Order cancellation
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancel_reason text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS booked_at timestamptz;

-- 5. Invoice posting metadata + one-final-invoice-per-order guarantee
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS posted_by uuid,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS fy text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS place_of_supply_state_code text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS invoices_one_final_per_order_idx
  ON public.invoices (source_order_id)
  WHERE doc_type = 'gst_invoice' AND source_order_id IS NOT NULL;

-- 6. Invoice line tax detail
ALTER TABLE public.invoice_lines
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS gross_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total numeric(14,2);

-- 7. Document sequences (per company, doc type, financial year)
CREATE TABLE IF NOT EXISTS public.document_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  fy text NOT NULL,
  prefix text NOT NULL DEFAULT '',
  next_seq integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, doc_type, fy)
);
GRANT SELECT ON public.document_sequences TO authenticated;
GRANT ALL ON public.document_sequences TO service_role;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq_select_own_company" ON public.document_sequences
  FOR SELECT TO authenticated USING (company_id = public.get_company_id());

-- 8. Payments received against invoices
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  mode payment_mode NOT NULL,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  reference text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','voided')),
  idempotency_key text,
  posted_by uuid,
  posted_at timestamptz NOT NULL DEFAULT now(),
  voided_by uuid,
  voided_at timestamptz,
  void_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_idem_idx
  ON public.invoice_payments (company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_idx ON public.invoice_payments (invoice_id);
CREATE INDEX IF NOT EXISTS invoice_payments_dealer_idx ON public.invoice_payments (distributor_id);
GRANT SELECT ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoice_payments TO service_role;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own_company" ON public.invoice_payments
  FOR SELECT TO authenticated USING (company_id = public.get_company_id());

-- 9. Credit notes
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE RESTRICT,
  credit_note_number text NOT NULL,
  fy text NOT NULL DEFAULT '',
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text NOT NULL DEFAULT '',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  cgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  sgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  igst_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_tax numeric(14,2) NOT NULL DEFAULT 0,
  round_off numeric(14,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL DEFAULT 0,
  amount_in_words text NOT NULL DEFAULT '',
  posted_by uuid,
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, credit_note_number)
);
CREATE INDEX IF NOT EXISTS credit_notes_invoice_idx ON public.credit_notes (invoice_id);
GRANT SELECT ON public.credit_notes TO authenticated;
GRANT ALL ON public.credit_notes TO service_role;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_notes_select_own_company" ON public.credit_notes
  FOR SELECT TO authenticated USING (company_id = public.get_company_id());

CREATE TABLE IF NOT EXISTS public.credit_note_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id uuid NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  invoice_line_id uuid REFERENCES public.invoice_lines(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  hsn_code text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity > 0),
  restocked_quantity integer NOT NULL DEFAULT 0,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  taxable_value numeric(14,2) NOT NULL DEFAULT 0,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0,
  cgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  sgst_amount numeric(14,2) NOT NULL DEFAULT 0,
  igst_amount numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_note_lines_note_idx ON public.credit_note_lines (credit_note_id);
GRANT SELECT ON public.credit_note_lines TO authenticated;
GRANT ALL ON public.credit_note_lines TO service_role;
ALTER TABLE public.credit_note_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_note_lines_select_own_company" ON public.credit_note_lines
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.credit_notes cn
            WHERE cn.id = credit_note_lines.credit_note_id
              AND cn.company_id = public.get_company_id())
  );

-- 10. Append-only stock movement ledger
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  godown_id uuid NOT NULL REFERENCES public.godowns(id) ON DELETE RESTRICT,
  delta integer NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('dispatch','return_restock','manual_adjust','opening','cancel_reversal')),
  source_doc_type text NOT NULL DEFAULT '',
  source_doc_id uuid,
  idempotency_key text,
  actor uuid,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS stock_movements_idem_idx
  ON public.stock_movements (company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS stock_movements_lookup_idx
  ON public.stock_movements (company_id, product_id, godown_id, created_at DESC);
GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_select_own_company" ON public.stock_movements
  FOR SELECT TO authenticated USING (company_id = public.get_company_id());

-- 11. Canonical balances
CREATE OR REPLACE VIEW public.invoice_balances
WITH (security_invoker = true) AS
SELECT
  i.id                              AS invoice_id,
  i.company_id,
  i.source_order_id                 AS order_id,
  i.invoice_number,
  i.invoice_date,
  i.buyer_name,
  i.grand_total                     AS invoice_total,
  COALESCE(p.paid, 0)::numeric(14,2)     AS amount_received,
  COALESCE(c.credited, 0)::numeric(14,2) AS amount_credited,
  (i.grand_total - COALESCE(p.paid, 0) - COALESCE(c.credited, 0))::numeric(14,2) AS balance_due
FROM public.invoices i
LEFT JOIN LATERAL (
  SELECT SUM(ip.amount) AS paid FROM public.invoice_payments ip
  WHERE ip.invoice_id = i.id AND ip.status = 'posted'
) p ON true
LEFT JOIN LATERAL (
  SELECT SUM(cn.grand_total) AS credited FROM public.credit_notes cn
  WHERE cn.invoice_id = i.id
) c ON true
WHERE i.doc_type = 'gst_invoice';

GRANT SELECT ON public.invoice_balances TO authenticated;
GRANT SELECT ON public.invoice_balances TO service_role;

CREATE OR REPLACE VIEW public.dealer_balances
WITH (security_invoker = true) AS
SELECT
  d.id           AS distributor_id,
  d.company_id,
  d.name         AS distributor_name,
  d.credit_limit,
  COALESCE(SUM(ib.invoice_total), 0)::numeric(14,2)   AS billed_total,
  COALESCE(SUM(ib.amount_received), 0)::numeric(14,2) AS received_total,
  COALESCE(SUM(ib.amount_credited), 0)::numeric(14,2) AS credited_total,
  COALESCE(SUM(ib.balance_due), 0)::numeric(14,2)     AS balance_due
FROM public.distributors d
LEFT JOIN public.orders o ON o.distributor_id = d.id
LEFT JOIN public.invoice_balances ib ON ib.order_id = o.id
GROUP BY d.id, d.company_id, d.name, d.credit_limit;

GRANT SELECT ON public.dealer_balances TO authenticated;
GRANT SELECT ON public.dealer_balances TO service_role;
