
-- 1. Add columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_ifsc text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_prefix text NOT NULL DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS next_invoice_sequence integer NOT NULL DEFAULT 1;

-- 2. Add hsn_code to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hsn_code text NOT NULL DEFAULT '';

-- 3. Create invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  doc_type text NOT NULL DEFAULT 'gst_invoice',
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  source_order_id uuid,
  -- Buyer snapshot
  buyer_name text NOT NULL DEFAULT '',
  buyer_address text NOT NULL DEFAULT '',
  buyer_gstin text NOT NULL DEFAULT '',
  buyer_state_code text NOT NULL DEFAULT '',
  -- Seller snapshot
  seller_name text NOT NULL DEFAULT '',
  seller_address text NOT NULL DEFAULT '',
  seller_gstin text NOT NULL DEFAULT '',
  seller_pan text NOT NULL DEFAULT '',
  seller_state_code text NOT NULL DEFAULT '',
  seller_phone text NOT NULL DEFAULT '',
  seller_email text NOT NULL DEFAULT '',
  seller_bank_name text NOT NULL DEFAULT '',
  seller_bank_account text NOT NULL DEFAULT '',
  seller_bank_ifsc text NOT NULL DEFAULT '',
  seller_logo_url text NOT NULL DEFAULT '',
  -- Tax
  supply_type text NOT NULL DEFAULT 'intra_state',
  gst_rate numeric NOT NULL DEFAULT 18,
  subtotal numeric NOT NULL DEFAULT 0,
  cgst_amount numeric NOT NULL DEFAULT 0,
  sgst_amount numeric NOT NULL DEFAULT 0,
  igst_amount numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  round_off numeric NOT NULL DEFAULT 0,
  -- Meta
  amount_in_words text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, invoice_number)
);

-- 4. Create invoice_lines table
CREATE TABLE public.invoice_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT '',
  hsn_code text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'Pack',
  unit_price numeric NOT NULL DEFAULT 0,
  taxable_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (company_id = get_company_id());

CREATE POLICY "Company members can insert invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can update invoices"
  ON public.invoices FOR UPDATE TO authenticated
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can delete invoices"
  ON public.invoices FOR DELETE TO authenticated
  USING (company_id = get_company_id());

-- 6. RLS on invoice_lines
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view invoice lines"
  ON public.invoice_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id()));

CREATE POLICY "Company members can insert invoice lines"
  ON public.invoice_lines FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id()));

CREATE POLICY "Company members can delete invoice lines"
  ON public.invoice_lines FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id()));

-- 7. updated_at trigger on invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Atomic invoice number function
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(target_company_id uuid)
  RETURNS TABLE(prefix text, seq integer)
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  UPDATE companies
  SET next_invoice_sequence = next_invoice_sequence + 1
  WHERE id = target_company_id
  RETURNING invoice_prefix, next_invoice_sequence - 1;
$$;
