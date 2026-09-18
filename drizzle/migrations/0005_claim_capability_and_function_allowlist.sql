-- 1. Closing a return is a credit decision: require the money capability,
--    matching record_invoice_payment_atomic and the other money RPCs.
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

  IF NOT public.has_capability(auth.uid(), 'see_money') THEN
    RAISE EXCEPTION 'You do not have permission to close claims';
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

-- 2. Flip function permissions from allow-by-default to deny-by-default.
--    Everything in public is revoked from anon/authenticated, then EXECUTE is
--    granted back only to the explicit allowlist below: the RPCs the browser
--    actually calls, plus the three helpers RLS policies evaluate as the caller.
--    A new function is therefore locked until it is deliberately added here.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
  allowed text[] := ARRAY[
    -- RLS policy helpers (evaluated with the caller's privileges)
    'get_company_id', 'has_role', 'has_capability',
    -- RPCs invoked from the app
    'accept_team_invite', 'adjust_stock_atomic', 'book_order_atomic', 'cancel_order_atomic',
    'delete_godown_atomic', 'delete_member_atomic', 'dispatch_and_bill_order_atomic',
    'mark_order_delivered_atomic', 'preview_dispatch_impact', 'record_invoice_payment_atomic',
    'record_order_payment_atomic', 'record_return_and_credit_atomic', 'resend_team_invite',
    'resolve_claim_atomic', 'reverse_dispatch_for_order', 'send_team_invite',
    'setup_new_company', 'void_invoice_payment_atomic'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prorettype <> 'trigger'::regtype
  LOOP
    IF r.proname = ANY (allowed) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
    -- get_invite_by_token is the one pre-login call: the invite page runs it signed out.
    IF r.proname = 'get_invite_by_token' THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', r.sig);
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;