
-- Claims table
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  order_id uuid NOT NULL,
  order_number text NOT NULL DEFAULT '',
  distributor_id uuid NOT NULL,
  distributor_name text NOT NULL DEFAULT '',
  claim_type text NOT NULL DEFAULT 'return',
  status text NOT NULL DEFAULT 'open',
  reason text NOT NULL DEFAULT '',
  resolution_notes text NOT NULL DEFAULT '',
  restore_stock boolean NOT NULL DEFAULT false,
  total_claim_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view claims"
  ON public.claims FOR SELECT TO authenticated
  USING (company_id = get_company_id());

CREATE POLICY "Company members can insert claims"
  ON public.claims FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can update claims"
  ON public.claims FOR UPDATE TO authenticated
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can delete claims"
  ON public.claims FOR DELETE TO authenticated
  USING (company_id = get_company_id());

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Claim lines table
CREATE TABLE public.claim_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  product_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view claim lines"
  ON public.claim_lines FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()
  ));

CREATE POLICY "Company members can insert claim lines"
  ON public.claim_lines FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()
  ));

CREATE POLICY "Company members can delete claim lines"
  ON public.claim_lines FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()
  ));
