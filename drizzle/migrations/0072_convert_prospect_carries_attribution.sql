CREATE OR REPLACE FUNCTION public.convert_prospect_to_dealer_atomic(p_prospect_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_p public.shop_prospects%ROWTYPE;
  v_dealer uuid;
  v_found uuid;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Please sign in again.'; END IF;
  SELECT * INTO v_p FROM public.shop_prospects WHERE id = p_prospect_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This shop was not found.'; END IF;
  IF v_p.stage = 'converted' THEN
    RETURN jsonb_build_object('distributor_id', v_p.converted_distributor_id, 'already', true);
  END IF;
  -- Only carry a finder who still belongs to this business.
  SELECT id INTO v_found FROM public.salespersons WHERE id = v_p.found_by_salesperson_id AND company_id = v_company;
  INSERT INTO public.distributors (company_id, name, location, contact,
    acquired_by_salesperson_id, assigned_salesperson_id, acquisition_date)
  VALUES (v_company, trim(v_p.name), v_p.area, v_p.phone,
    v_found, v_found, CASE WHEN v_found IS NULL THEN NULL ELSE (now() AT TIME ZONE 'Asia/Kolkata')::date END)
  RETURNING id INTO v_dealer;
  UPDATE public.shop_prospects SET stage = 'converted', converted_distributor_id = v_dealer WHERE id = v_p.id;
  RETURN jsonb_build_object('distributor_id', v_dealer, 'already', false);
END $function$;