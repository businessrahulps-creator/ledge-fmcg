CREATE OR REPLACE FUNCTION public._buying_refresh_avg_cost(p_product uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_qty numeric; v_val numeric;
BEGIN
  -- Serialise concurrent recomputes for the same product (avoid lost updates).
  PERFORM 1 FROM public.products WHERE id = p_product FOR UPDATE;
  SELECT COALESCE(sum(l.quantity),0), COALESCE(sum(l.taxable_value),0) INTO v_qty, v_val
    FROM public.purchase_bill_lines l JOIN public.purchase_bills b ON b.id = l.bill_id
   WHERE l.product_id = p_product AND b.status = 'posted';
  SELECT v_qty - COALESCE(sum(rl.quantity),0), v_val - COALESCE(sum(rl.taxable_value),0) INTO v_qty, v_val
    FROM public.purchase_return_lines rl JOIN public.purchase_returns r ON r.id = rl.return_id JOIN public.purchase_bills b ON b.id = r.bill_id
   WHERE rl.product_id = p_product AND b.status = 'posted';
  UPDATE public.products SET avg_cost = CASE WHEN v_qty > 0 THEN round(v_val / v_qty, 2) ELSE 0 END WHERE id = p_product;
END $function$;
REVOKE ALL ON FUNCTION public._buying_refresh_avg_cost(uuid) FROM PUBLIC, anon, authenticated;

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
  -- Payments settle the opening balance, then bills oldest-first. Returns reduce only their own bill.
  SELECT COALESCE(SUM(amount),0) INTO v_credits FROM public.supplier_payments
   WHERE supplier_id = v_bill.supplier_id AND status = 'posted';
  SELECT s.opening_balance + COALESCE((SELECT SUM(b.grand_total - COALESCE((SELECT SUM(r.grand_total) FROM public.purchase_returns r WHERE r.bill_id = b.id),0))
       FROM public.purchase_bills b
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
REVOKE ALL ON FUNCTION public.cancel_purchase_bill_atomic(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_purchase_bill_atomic(uuid, text) TO authenticated;