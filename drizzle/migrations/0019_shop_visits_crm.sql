CREATE TABLE public.shop_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('gave_order','paid','enough_stock','owner_away','shop_closed','promised_payment','promised_order','other')),
  promise_date date,
  promise_amount numeric CHECK (promise_amount IS NULL OR promise_amount >= 0),
  promise_status text NOT NULL DEFAULT 'none' CHECK (promise_status IN ('none','open','kept','broken')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shop_visits TO authenticated;
GRANT ALL ON public.shop_visits TO service_role;
ALTER TABLE public.shop_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_visits read own company" ON public.shop_visits FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());
CREATE POLICY "shop_visits insert own company" ON public.shop_visits FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.distributors d WHERE d.id = distributor_id AND d.company_id = public.get_company_id()));
CREATE POLICY "shop_visits update own company" ON public.shop_visits FOR UPDATE TO authenticated
  USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());
CREATE INDEX shop_visits_company_created_idx ON public.shop_visits (company_id, created_at DESC);
CREATE INDEX shop_visits_dealer_idx ON public.shop_visits (distributor_id, created_at DESC);
CREATE TRIGGER shop_visits_updated_at BEFORE UPDATE ON public.shop_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.shop_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  owner_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  shop_type text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  stage text NOT NULL DEFAULT 'found' CHECK (stage IN ('found','talked','converted','not_interested')),
  converted_distributor_id uuid REFERENCES public.distributors(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shop_prospects TO authenticated;
GRANT ALL ON public.shop_prospects TO service_role;
ALTER TABLE public.shop_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_prospects read own company" ON public.shop_prospects FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());
CREATE POLICY "shop_prospects insert own company" ON public.shop_prospects FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND created_by = auth.uid() AND stage IN ('found','talked'));
CREATE POLICY "shop_prospects update own company" ON public.shop_prospects FOR UPDATE TO authenticated
  USING (company_id = public.get_company_id() AND stage <> 'converted')
  WITH CHECK (company_id = public.get_company_id() AND stage IN ('found','talked','not_interested'));
CREATE INDEX shop_prospects_company_idx ON public.shop_prospects (company_id, created_at DESC);
CREATE TRIGGER shop_prospects_updated_at BEFORE UPDATE ON public.shop_prospects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.convert_prospect_to_dealer_atomic(p_prospect_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_p public.shop_prospects%ROWTYPE;
  v_dealer uuid;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Please sign in again.'; END IF;
  SELECT * INTO v_p FROM public.shop_prospects WHERE id = p_prospect_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This shop was not found.'; END IF;
  IF v_p.stage = 'converted' THEN
    RETURN jsonb_build_object('distributor_id', v_p.converted_distributor_id, 'already', true);
  END IF;
  INSERT INTO public.distributors (company_id, name, location, contact)
  VALUES (v_company, trim(v_p.name), v_p.area, v_p.phone)
  RETURNING id INTO v_dealer;
  UPDATE public.shop_prospects SET stage = 'converted', converted_distributor_id = v_dealer WHERE id = v_p.id;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'distributor', v_dealer, 'created',
    'New shop "' || trim(v_p.name) || '" became a dealer', jsonb_build_object('prospect_id', v_p.id));
  RETURN jsonb_build_object('distributor_id', v_dealer, 'already', false);
END $$;
REVOKE ALL ON FUNCTION public.convert_prospect_to_dealer_atomic(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_prospect_to_dealer_atomic(uuid) TO authenticated;