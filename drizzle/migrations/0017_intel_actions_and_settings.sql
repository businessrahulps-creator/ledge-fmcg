CREATE TABLE public.intel_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL,
  subject_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('done','snoozed','promised')),
  until_date date,
  promised_amount numeric,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.intel_actions TO authenticated;
GRANT ALL ON public.intel_actions TO service_role;
ALTER TABLE public.intel_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intel_actions read own company" ON public.intel_actions FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "intel_actions insert own company" ON public.intel_actions FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND created_by = auth.uid() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "intel_actions delete own company" ON public.intel_actions FOR DELETE TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE INDEX intel_actions_company_subject_idx ON public.intel_actions (company_id, subject_id, created_at DESC);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS intel_settings jsonb NOT NULL DEFAULT '{"lateDays":3,"runwayDays":7,"dropPct":40}'::jsonb;