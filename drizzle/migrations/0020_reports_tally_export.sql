CREATE TABLE public.tally_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  ledgers jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tally_settings TO authenticated;
GRANT ALL ON public.tally_settings TO service_role;
ALTER TABLE public.tally_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tally settings read" ON public.tally_settings FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "tally settings insert" ON public.tally_settings FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "tally settings update" ON public.tally_settings FOR UPDATE TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'))
  WITH CHECK (company_id = public.get_company_id());

CREATE TABLE public.export_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  user_name text NOT NULL DEFAULT '',
  report_id text NOT NULL,
  format text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_count integer NOT NULL DEFAULT 0,
  document_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX export_log_company_idx ON public.export_log(company_id, report_id, created_at DESC);
GRANT SELECT, INSERT ON public.export_log TO authenticated;
GRANT ALL ON public.export_log TO service_role;
ALTER TABLE public.export_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export log read" ON public.export_log FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());
CREATE POLICY "export log insert" ON public.export_log FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND user_id = auth.uid());