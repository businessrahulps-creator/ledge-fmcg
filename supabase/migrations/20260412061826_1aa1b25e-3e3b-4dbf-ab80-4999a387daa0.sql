
CREATE TABLE public.secondary_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  distributor_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL DEFAULT '',
  retailer_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secondary_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view secondary sales"
  ON public.secondary_sales FOR SELECT TO authenticated
  USING (company_id = get_company_id());

CREATE POLICY "Company members can insert secondary sales"
  ON public.secondary_sales FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can delete secondary sales"
  ON public.secondary_sales FOR DELETE TO authenticated
  USING (company_id = get_company_id());
