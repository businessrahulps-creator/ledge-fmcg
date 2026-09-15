CREATE OR REPLACE FUNCTION public.resolve_claim_atomic(p_claim_id uuid, p_notes text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_claim public.claims%ROWTYPE;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'No workspace for this user';
  END IF;

  SELECT * INTO v_claim FROM public.claims
   WHERE id = p_claim_id AND company_id = v_company
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This return could not be found in your workspace';
  END IF;

  IF v_claim.status = 'resolved' THEN
    RAISE EXCEPTION 'This return has already been closed';
  END IF;

  UPDATE public.claims
     SET status = 'resolved',
         resolution_notes = COALESCE(NULLIF(TRIM(p_notes), ''), resolution_notes),
         resolved_at = now(),
         updated_at = now()
   WHERE id = p_claim_id;

  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'claim', p_claim_id, 'resolve',
          'Return closed for order ' || v_claim.order_number,
          jsonb_build_object('notes', p_notes, 'claim_type', v_claim.claim_type));

  RETURN jsonb_build_object('success', true, 'claim_id', p_claim_id);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_claim_atomic(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_claim_atomic(uuid, text) TO authenticated;