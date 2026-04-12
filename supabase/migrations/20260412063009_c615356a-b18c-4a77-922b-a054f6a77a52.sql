
CREATE TABLE public.targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'salesperson',
  entity_id uuid NOT NULL,
  entity_name text NOT NULL DEFAULT '',
  period_type text NOT NULL DEFAULT 'monthly',
  period_start date NOT NULL,
  target_revenue numeric NOT NULL DEFAULT 0,
  target_orders integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, entity_type, entity_id, period_type, period_start)
);

ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view targets"
  ON public.targets FOR SELECT TO authenticated
  USING (company_id = get_company_id());

CREATE POLICY "Company members can insert targets"
  ON public.targets FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can update targets"
  ON public.targets FOR UPDATE TO authenticated
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can delete targets"
  ON public.targets FOR DELETE TO authenticated
  USING (company_id = get_company_id());

CREATE TRIGGER update_targets_updated_at
  BEFORE UPDATE ON public.targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
