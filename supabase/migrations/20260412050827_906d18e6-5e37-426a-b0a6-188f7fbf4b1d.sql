
-- Create order_schemes table
CREATE TABLE public.order_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  scheme_id uuid REFERENCES public.schemes(id) ON DELETE SET NULL,
  scheme_name text NOT NULL,
  scheme_label text NOT NULL DEFAULT '',
  savings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_schemes ENABLE ROW LEVEL SECURITY;

-- RLS policies (company-scoped via order join)
CREATE POLICY "Company members can view order schemes"
  ON public.order_schemes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_schemes.order_id AND o.company_id = get_company_id()));

CREATE POLICY "Company members can insert order schemes"
  ON public.order_schemes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_schemes.order_id AND o.company_id = get_company_id()));

CREATE POLICY "Company members can delete order schemes"
  ON public.order_schemes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_schemes.order_id AND o.company_id = get_company_id()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_schemes;

-- Add scheme_savings column to orders
ALTER TABLE public.orders ADD COLUMN scheme_savings numeric NOT NULL DEFAULT 0;
