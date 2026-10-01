-- 1) Buying: owner + accountant by default (overridable per user)
INSERT INTO public.role_capabilities_default(role, capability) VALUES
  ('super_admin','manage_buying'), ('accountant','manage_buying')
ON CONFLICT DO NOTHING;

-- Swap see_money -> manage_buying inside every buying RPC (bodies otherwise unchanged)
DO $$
DECLARE r record; v_def text;
BEGIN
  FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('record_purchase_bill_atomic','cancel_purchase_bill_atomic','return_purchase_atomic','record_supplier_payment_atomic','void_supplier_payment_atomic','supplier_balance')
  LOOP
    v_def := pg_get_functiondef(r.oid);
    v_def := replace(v_def, '''see_money''', '''manage_buying''');
    EXECUTE v_def;
  END LOOP;
END $$;

-- Buying table read/write policies
DO $$
DECLARE r record; v_new text;
BEGIN
  FOR r IN SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('suppliers','purchase_bills','purchase_bill_lines','purchase_returns','purchase_return_lines','supplier_payments')
      AND (coalesce(qual,'') LIKE '%see_money%' OR coalesce(with_check,'') LIKE '%see_money%')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    v_new := format('CREATE POLICY %I ON public.%I FOR %s TO authenticated', r.policyname, r.tablename, r.cmd);
    IF r.qual IS NOT NULL THEN v_new := v_new || ' USING (' || replace(r.qual, '''see_money''', '''manage_buying''') || ')'; END IF;
    IF r.with_check IS NOT NULL THEN v_new := v_new || ' WITH CHECK (' || replace(r.with_check, '''see_money''', '''manage_buying''') || ')'; END IF;
    EXECUTE v_new;
  END LOOP;
END $$;

-- 2) Money records readable only by money roles
DROP POLICY IF EXISTS payments_select_own_company ON public.invoice_payments;
CREATE POLICY payments_select_own_company ON public.invoice_payments FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
DROP POLICY IF EXISTS credit_notes_select_own_company ON public.credit_notes;
CREATE POLICY credit_notes_select_own_company ON public.credit_notes FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
DROP POLICY IF EXISTS credit_note_lines_select_own_company ON public.credit_note_lines;
CREATE POLICY credit_note_lines_select_own_company ON public.credit_note_lines FOR SELECT TO authenticated
  USING (public.has_capability(auth.uid(), 'see_money') AND EXISTS (SELECT 1 FROM public.credit_notes cn WHERE cn.id = credit_note_lines.credit_note_id AND cn.company_id = public.get_company_id()));

-- 4) Cancel purchase bill: refuse if payments/returns (applied oldest-first) reach this bill
CREATE OR REPLACE FUNCTION public.cancel_purchase_bill_atomic(p_bill_id uuid, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid := public.get_company_id(); v_bill public.purchase_bills%ROWTYPE; v_l record;
  v_credits numeric; v_owed_before numeric;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_buying') THEN RAISE EXCEPTION 'You do not have permission to record purchases.'; END IF;
  IF COALESCE(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'Give a reason for cancelling.'; END IF;
  SELECT * INTO v_bill FROM public.purchase_bills WHERE id = p_bill_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase bill not found'; END IF;
  IF v_bill.status <> 'posted' THEN RAISE EXCEPTION 'This bill is already cancelled.'; END IF;
  IF EXISTS (SELECT 1 FROM public.purchase_returns WHERE bill_id = v_bill.id) THEN RAISE EXCEPTION 'Items from this bill were returned, so it can''t be cancelled.'; END IF;
  PERFORM 1 FROM public.suppliers WHERE id = v_bill.supplier_id FOR UPDATE;
  -- Payments are not tied to one bill: settle the opening balance, then bills oldest-first.
  SELECT COALESCE((SELECT SUM(amount) FROM public.supplier_payments WHERE supplier_id = v_bill.supplier_id AND status = 'posted'),0)
       + COALESCE((SELECT SUM(grand_total) FROM public.purchase_returns WHERE supplier_id = v_bill.supplier_id),0)
    INTO v_credits;
  SELECT s.opening_balance + COALESCE((SELECT SUM(b.grand_total) FROM public.purchase_bills b
       WHERE b.supplier_id = v_bill.supplier_id AND b.status = 'posted' AND b.id <> v_bill.id
         AND (b.bill_date, b.created_at) < (v_bill.bill_date, v_bill.created_at)),0)
    INTO v_owed_before FROM public.suppliers s WHERE s.id = v_bill.supplier_id;
  IF v_credits > v_owed_before + 0.005 THEN
    RAISE EXCEPTION 'You have already paid this supplier for this bill. Use Return to supplier instead.';
  END IF;
  FOR v_l IN SELECT * FROM public.purchase_bill_lines WHERE bill_id = v_bill.id LOOP
    PERFORM public._buying_move_stock(v_company, v_l.product_id, v_bill.godown_id, -v_l.quantity, 'purchase_cancel', 'purchase_bill', v_bill.id, 'Cancelled purchase bill ' || v_bill.supplier_bill_no);
  END LOOP;
  UPDATE public.purchase_bills SET status = 'cancelled', cancel_reason = trim(p_reason), cancelled_at = now() WHERE id = v_bill.id;
  FOR v_l IN SELECT DISTINCT product_id FROM public.purchase_bill_lines WHERE bill_id = v_bill.id LOOP
    PERFORM public._buying_refresh_avg_cost(v_l.product_id);
  END LOOP;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'purchase_bill', v_bill.id, 'cancel', 'Cancelled purchase bill ' || v_bill.supplier_bill_no || ' from ' || v_bill.supplier_name, jsonb_build_object('reason', p_reason));
  RETURN jsonb_build_object('bill_id', v_bill.id, 'status', 'cancelled');
END $function$;

-- 5) Order-wide "buy X get Y": free items valued at the cheapest product in the order
DO $$
DECLARE v_def text;
BEGIN
  v_def := pg_get_functiondef('public.book_order_atomic'::regproc);
  IF position('COALESCE(MAX(unit_price), 0) INTO v_top_price' in v_def) = 0 THEN
    RAISE EXCEPTION 'book_order_atomic: expected pricing line not found';
  END IF;
  v_def := replace(v_def, 'COALESCE(MAX(unit_price), 0) INTO v_top_price', 'COALESCE(MIN(unit_price), 0) INTO v_top_price');
  EXECUTE v_def;
END $$;

-- 6) Advance payment retry: same idempotency key returns the first result
DO $$
DECLARE v_def text; v_anchor text := '  IF v_order.cancelled_at IS NOT NULL THEN RAISE EXCEPTION ''This order was cancelled.''; END IF;';
BEGIN
  v_def := pg_get_functiondef('public.record_order_payment_atomic'::regproc);
  IF position(v_anchor in v_def) = 0 THEN RAISE EXCEPTION 'record_order_payment_atomic: anchor not found'; END IF;
  v_def := replace(v_def, v_anchor, v_anchor || E'\n  IF NULLIF(COALESCE(p_idempotency_key,''''),'''') IS NOT NULL THEN\n    SELECT id INTO v_id FROM invoice_payments WHERE company_id = v_company AND idempotency_key = p_idempotency_key LIMIT 1;\n    IF v_id IS NOT NULL THEN\n      RETURN jsonb_build_object(''ok'', true, ''payment_id'', v_id, ''order_id'', p_order_id, ''replayed'', true);\n    END IF;\n  END IF;');
  EXECUTE v_def;
END $$;

-- 7) Retire the old send path that skipped stock and credit checks
REVOKE EXECUTE ON FUNCTION public.dispatch_order_atomic(uuid, date, text, text, text) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.dispatch_order_atomic(uuid, date, text, text, text) IS 'DEPRECATED: use dispatch_and_bill_order_atomic (stock + credit checks).';