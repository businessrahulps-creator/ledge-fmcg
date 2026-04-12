
CREATE TABLE public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  scheme_type text NOT NULL DEFAULT 'percentage',
  discount_percent numeric NOT NULL DEFAULT 0,
  buy_qty integer NOT NULL DEFAULT 0,
  free_qty integer NOT NULL DEFAULT 0,
  flat_amount numeric NOT NULL DEFAULT 0,
  min_order_value numeric NOT NULL DEFAULT 0,
  min_qty integer NOT NULL DEFAULT 0,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  dealer_id uuid REFERENCES public.distributors(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view schemes" ON public.schemes FOR SELECT TO authenticated USING (company_id = get_company_id());
CREATE POLICY "Super admins can insert schemes" ON public.schemes FOR INSERT TO authenticated WITH CHECK (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update schemes" ON public.schemes FOR UPDATE TO authenticated USING (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin')) WITH CHECK (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete schemes" ON public.schemes FOR DELETE TO authenticated USING (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_schemes_updated_at BEFORE UPDATE ON public.schemes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.schemes;
