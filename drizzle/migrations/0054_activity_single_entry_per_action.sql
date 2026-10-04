CREATE OR REPLACE FUNCTION public.tg_audit_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  j jsonb; o jsonb;
  v_company uuid; v_entity uuid; v_type text; v_label text; v_action text;
  v_ref text; v_amount numeric; v_dir text; v_changed text[] := '{}';
  v_before jsonb; v_after jsonb; k text;
  noise text[] := ARRAY['updated_at','created_at','total_sold','avg_cost','outstanding_amount','total_orders','total_value','next_order_sequence','next_invoice_sequence','last_deducted_date'];
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  IF TG_OP = 'DELETE' THEN j := to_jsonb(OLD); ELSE j := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' THEN
    o := to_jsonb(OLD);
    FOR k IN SELECT jsonb_object_keys(j) LOOP
      IF NOT (k = ANY(noise)) AND (o->k) IS DISTINCT FROM (j->k) THEN
        v_changed := v_changed || k;
      END IF;
    END LOOP;
    IF array_length(v_changed,1) IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_object_agg(x, o->x), jsonb_object_agg(x, j->x) INTO v_before, v_after FROM unnest(v_changed) x;
  END IF;

  v_type := CASE TG_TABLE_NAME
    WHEN 'orders' THEN 'order' WHEN 'invoices' THEN 'invoice' WHEN 'invoice_payments' THEN 'payment'
    WHEN 'credit_notes' THEN 'credit_note' WHEN 'claims' THEN 'claim' WHEN 'purchase_bills' THEN 'purchase_bill'
    WHEN 'purchase_returns' THEN 'purchase_return' WHEN 'supplier_payments' THEN 'supplier_payment'
    WHEN 'suppliers' THEN 'supplier' WHEN 'stock_movements' THEN 'stock' WHEN 'distributors' THEN 'dealer'
    WHEN 'products' THEN 'product' WHEN 'schemes' THEN 'scheme' WHEN 'godowns' THEN 'warehouse'
    WHEN 'targets' THEN 'target' WHEN 'salespersons' THEN 'salesperson' WHEN 'shop_visits' THEN 'visit'
    WHEN 'shop_prospects' THEN 'prospect' WHEN 'companies' THEN 'company' WHEN 'tally_settings' THEN 'company'
    ELSE 'team' END;
  v_label := CASE v_type
    WHEN 'order' THEN 'Order' WHEN 'invoice' THEN 'GST bill' WHEN 'payment' THEN 'Payment received'
    WHEN 'credit_note' THEN 'Credit note' WHEN 'claim' THEN 'Return' WHEN 'purchase_bill' THEN 'Purchase bill'
    WHEN 'purchase_return' THEN 'Purchase return' WHEN 'supplier_payment' THEN 'Supplier payment'
    WHEN 'supplier' THEN 'Supplier' WHEN 'stock' THEN 'Stock' WHEN 'dealer' THEN 'Dealer'
    WHEN 'product' THEN 'Product' WHEN 'scheme' THEN 'Offer' WHEN 'warehouse' THEN 'Godown'
    WHEN 'target' THEN 'Target' WHEN 'salesperson' THEN 'Salesperson' WHEN 'visit' THEN 'Shop visit'
    WHEN 'prospect' THEN 'New shop' WHEN 'company' THEN 'Company settings'
    ELSE CASE TG_TABLE_NAME WHEN 'team_invites' THEN 'Team invite' WHEN 'user_roles' THEN 'Team role' ELSE 'Access' END END;

  v_company := CASE TG_TABLE_NAME
    WHEN 'companies' THEN (j->>'id')::uuid
    WHEN 'user_roles' THEN (SELECT company_id FROM profiles WHERE user_id = (j->>'user_id')::uuid LIMIT 1)
    WHEN 'user_capability_overrides' THEN (SELECT company_id FROM profiles WHERE user_id = (j->>'user_id')::uuid LIMIT 1)
    ELSE (j->>'company_id')::uuid END;
  IF v_company IS NULL THEN RETURN NULL; END IF;
  v_entity := COALESCE((j->>'id')::uuid, v_company);

  v_action := CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'DELETE' THEN 'deleted' ELSE 'updated' END;
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'orders' AND 'cancelled_at' = ANY(v_changed) AND j->>'cancelled_at' IS NOT NULL THEN v_action := 'cancelled';
    ELSIF TG_TABLE_NAME = 'orders' AND 'delivery_status' = ANY(v_changed) THEN
      v_action := CASE j->>'delivery_status' WHEN 'dispatched' THEN 'dispatched' WHEN 'delivered' THEN 'delivered' ELSE 'sending undone' END;
    ELSIF TG_TABLE_NAME IN ('invoice_payments','supplier_payments','purchase_bills') AND 'status' = ANY(v_changed) AND j->>'status' IN ('voided','cancelled') THEN v_action := 'cancelled';
    ELSIF TG_TABLE_NAME = 'invoice_payments' AND 'status' = ANY(v_changed) AND j->>'status' = 'refunded' THEN v_action := 'given back';
    END IF;
  END IF;

  v_ref := COALESCE(j->>'order_number', j->>'invoice_number', j->>'credit_note_number', j->>'supplier_bill_no',
                    j->>'name', j->>'entity_name', j->>'email', j->>'role', j->>'capability', j->>'reference', '');
  IF TG_TABLE_NAME = 'stock_movements' THEN
    v_ref := COALESCE((SELECT name FROM products WHERE id = (j->>'product_id')::uuid), '') || ' ' ||
             CASE WHEN (j->>'delta')::int >= 0 THEN '+' ELSE '' END || (j->>'delta') || ' (' || COALESCE(j->>'movement_type','') || ')';
  END IF;

  -- Orders: same net value as the summary (total minus offer savings).
  v_amount := CASE WHEN TG_TABLE_NAME = 'orders' THEN (j->>'total')::numeric - COALESCE((j->>'scheme_savings')::numeric, 0)
                   ELSE COALESCE((j->>'grand_total')::numeric, (j->>'amount')::numeric, (j->>'total_claim_value')::numeric) END;
  -- Money in: posted payments and to-give-back money (both reached us). Given back = money out.
  IF TG_TABLE_NAME = 'invoice_payments' AND v_action = 'given back' THEN
    v_dir := 'out';
  ELSIF TG_TABLE_NAME = 'invoice_payments' AND ((TG_OP = 'INSERT' AND j->>'status' IN ('posted','refund_due')) OR v_action = 'cancelled') THEN
    v_dir := 'in'; IF v_action = 'cancelled' THEN v_amount := -v_amount; END IF;
  ELSIF TG_TABLE_NAME = 'supplier_payments' AND ((TG_OP = 'INSERT' AND j->>'status' = 'posted') OR v_action = 'cancelled') THEN
    v_dir := 'out'; IF v_action = 'cancelled' THEN v_amount := -v_amount; END IF;
  END IF;

  -- A save that inserts a row and then fills in its totals in the same transaction
  -- is one action: fold the follow-up edit into the "created" entry.
  IF TG_OP = 'UPDATE' AND v_action = 'updated' AND (j ? 'created_at')
     AND (j->>'created_at')::timestamptz = now() THEN
    UPDATE activity_log SET amount = v_amount, money_direction = COALESCE(v_dir, money_direction)
     WHERE company_id = v_company AND entity_id = v_entity AND action = 'created' AND created_at = now();
    IF FOUND THEN RETURN NULL; END IF;
  END IF;

  INSERT INTO activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata,
                            source, outcome, money_direction, amount, before, after, changed_fields)
  VALUES (v_company, v_uid, '', v_type, v_entity, v_action,
          left(trim(v_label || ' ' || COALESCE(v_ref,'') || ' ' || v_action), 300),
          jsonb_build_object('table', TG_TABLE_NAME,
            'distributor_id', j->>'distributor_id', 'order_id', COALESCE(j->>'order_id', j->>'source_order_id')),
          'db', 'ok', v_dir, v_amount, v_before, v_after, v_changed);
  RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION public.resolve_claim_atomic(p_claim_id uuid, p_notes text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Activity row is written by the tg_audit_row trigger.

  RETURN jsonb_build_object('success', true, 'claim_id', p_claim_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_purchase_bill_atomic(p_supplier_id uuid, p_supplier_bill_no text, p_bill_date date, p_godown_id uuid, p_lines jsonb, p_notes text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_sup public.suppliers%ROWTYPE; v_company_state text; v_inter boolean;
  v_bill uuid; v_existing uuid; v_line jsonb; v_prod public.products%ROWTYPE;
  v_qty integer; v_rate numeric; v_gst numeric; v_taxable numeric; v_tax numeric;
  v_sub numeric := 0; v_c numeric := 0; v_s numeric := 0; v_i numeric := 0; v_lc numeric; v_ls numeric; v_li numeric;
  v_seen uuid[] := '{}';
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_buying') THEN RAISE EXCEPTION 'You do not have permission to record purchases.'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.purchase_bills WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('bill_id', v_existing, 'duplicate', true); END IF;
  END IF;
  SELECT * INTO v_sup FROM public.suppliers WHERE id = p_supplier_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supplier not found in this business'; END IF;
  PERFORM 1 FROM public.godowns WHERE id = p_godown_id AND company_id = v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Godown not found in this business'; END IF;
  IF COALESCE(trim(p_supplier_bill_no),'') = '' THEN RAISE EXCEPTION 'Enter the supplier''s bill number.'; END IF;
  IF p_bill_date IS NULL OR p_bill_date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Bill date can''t be in the future.'; END IF;
  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Add at least one item.'; END IF;
  IF EXISTS (SELECT 1 FROM public.purchase_bills WHERE company_id = v_company AND supplier_id = p_supplier_id AND lower(supplier_bill_no) = lower(trim(p_supplier_bill_no)) AND status = 'posted') THEN
    RAISE EXCEPTION 'Bill % from this supplier is already entered.', trim(p_supplier_bill_no);
  END IF;
  SELECT state_code INTO v_company_state FROM public.companies WHERE id = v_company;
  v_inter := COALESCE(NULLIF(v_sup.state_code,''), v_company_state) <> COALESCE(v_company_state,'') AND COALESCE(v_company_state,'') <> '';

  INSERT INTO public.purchase_bills (company_id, supplier_id, supplier_name, supplier_bill_no, bill_date, godown_id, supply_type, notes, idempotency_key, posted_by)
  VALUES (v_company, v_sup.id, v_sup.name, trim(p_supplier_bill_no), p_bill_date, p_godown_id, CASE WHEN v_inter THEN 'inter' ELSE 'intra' END, COALESCE(p_notes,''), p_idempotency_key, auth.uid())
  RETURNING id INTO v_bill;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_qty := (v_line->>'quantity')::integer;
    v_rate := round((v_line->>'rate')::numeric, 2);
    v_gst := COALESCE((v_line->>'gst_rate')::numeric, 0);
    IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be more than zero.'; END IF;
    IF v_rate IS NULL OR v_rate < 0 THEN RAISE EXCEPTION 'Rate can''t be negative.'; END IF;
    IF v_gst NOT IN (0, 0.25, 3, 5, 12, 18, 28) THEN RAISE EXCEPTION 'GST % is not a valid rate.', v_gst; END IF;
    SELECT * INTO v_prod FROM public.products WHERE id = (v_line->>'product_id')::uuid AND company_id = v_company;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found in this business'; END IF;
    IF v_prod.id = ANY(v_seen) THEN RAISE EXCEPTION '% is added twice. Combine it into one line.', v_prod.name; END IF;
    v_seen := v_seen || v_prod.id;
    v_taxable := round(v_qty * v_rate, 2);
    IF v_inter THEN v_li := round(v_taxable * v_gst / 100, 2); v_lc := 0; v_ls := 0;
    ELSE v_lc := round(v_taxable * v_gst / 200, 2); v_ls := v_lc; v_li := 0; END IF;
    INSERT INTO public.purchase_bill_lines (bill_id, product_id, product_name, unit, quantity, rate, gst_rate, taxable_value, cgst_amount, sgst_amount, igst_amount, line_total)
    VALUES (v_bill, v_prod.id, v_prod.name, v_prod.unit, v_qty, v_rate, v_gst, v_taxable, v_lc, v_ls, v_li, v_taxable + v_lc + v_ls + v_li);
    v_sub := v_sub + v_taxable; v_c := v_c + v_lc; v_s := v_s + v_ls; v_i := v_i + v_li;
    PERFORM public._buying_move_stock(v_company, v_prod.id, p_godown_id, v_qty, 'purchase', 'purchase_bill', v_bill, 'Purchase bill ' || trim(p_supplier_bill_no));
    PERFORM public._buying_refresh_avg_cost(v_prod.id);
  END LOOP;

  UPDATE public.purchase_bills SET subtotal = v_sub, cgst_amount = v_c, sgst_amount = v_s, igst_amount = v_i,
    total_tax = v_c + v_s + v_i, grand_total = v_sub + v_c + v_s + v_i WHERE id = v_bill;
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('bill_id', v_bill, 'grand_total', v_sub + v_c + v_s + v_i);
END $function$;

CREATE OR REPLACE FUNCTION public.return_purchase_atomic(p_bill_id uuid, p_lines jsonb, p_reason text, p_return_date date, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_bill public.purchase_bills%ROWTYPE; v_ret uuid; v_existing uuid; v_line jsonb; v_bl public.purchase_bill_lines%ROWTYPE;
  v_qty integer; v_already integer; v_taxable numeric; v_tax numeric; v_sub numeric := 0; v_t numeric := 0; v_left integer;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_buying') THEN RAISE EXCEPTION 'You do not have permission to record purchases.'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.purchase_returns WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('return_id', v_existing, 'duplicate', true); END IF;
  END IF;
  SELECT * INTO v_bill FROM public.purchase_bills WHERE id = p_bill_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase bill not found'; END IF;
  IF v_bill.status <> 'posted' THEN RAISE EXCEPTION 'This bill is cancelled.'; END IF;
  IF p_return_date IS NULL OR p_return_date < v_bill.bill_date OR p_return_date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'Return date must be between the bill date and today.'; END IF;
  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Choose at least one item to return.'; END IF;
  INSERT INTO public.purchase_returns (company_id, bill_id, supplier_id, return_date, reason, idempotency_key, posted_by)
  VALUES (v_company, v_bill.id, v_bill.supplier_id, p_return_date, COALESCE(p_reason,''), p_idempotency_key, auth.uid()) RETURNING id INTO v_ret;
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_qty := (v_line->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;
    SELECT * INTO v_bl FROM public.purchase_bill_lines WHERE id = (v_line->>'bill_line_id')::uuid AND bill_id = v_bill.id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item is not on this bill'; END IF;
    SELECT COALESCE(sum(quantity),0) INTO v_already FROM public.purchase_return_lines WHERE bill_line_id = v_bl.id;
    v_left := v_bl.quantity - v_already;
    IF v_qty > v_left THEN RAISE EXCEPTION 'Only % of % can still be returned.', v_left, v_bl.product_name; END IF;
    -- Last units returned take whatever value is left, so rounding never leaves paise behind.
    IF v_qty = v_left THEN
      SELECT v_bl.taxable_value - COALESCE(sum(taxable_value),0), (v_bl.line_total - v_bl.taxable_value) - COALESCE(sum(tax_amount),0)
        INTO v_taxable, v_tax FROM public.purchase_return_lines WHERE bill_line_id = v_bl.id;
    ELSE
      v_taxable := round(v_bl.taxable_value * v_qty / v_bl.quantity, 2);
      v_tax := round((v_bl.line_total - v_bl.taxable_value) * v_qty / v_bl.quantity, 2);
    END IF;
    INSERT INTO public.purchase_return_lines (return_id, bill_line_id, product_id, product_name, quantity, taxable_value, tax_amount, line_total)
    VALUES (v_ret, v_bl.id, v_bl.product_id, v_bl.product_name, v_qty, v_taxable, v_tax, v_taxable + v_tax);
    v_sub := v_sub + v_taxable; v_t := v_t + v_tax;
    PERFORM public._buying_move_stock(v_company, v_bl.product_id, v_bill.godown_id, -v_qty, 'purchase_return', 'purchase_return', v_ret, 'Returned to ' || v_bill.supplier_name);
    PERFORM public._buying_refresh_avg_cost(v_bl.product_id);
  END LOOP;
  IF v_sub + v_t = 0 AND NOT EXISTS (SELECT 1 FROM public.purchase_return_lines WHERE return_id = v_ret) THEN RAISE EXCEPTION 'Choose at least one item to return.'; END IF;
  UPDATE public.purchase_returns SET subtotal = v_sub, total_tax = v_t, grand_total = v_sub + v_t WHERE id = v_ret;
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('return_id', v_ret, 'grand_total', v_sub + v_t);
END $function$;

CREATE OR REPLACE FUNCTION public.void_supplier_payment_atomic(p_payment_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_company uuid := public.get_company_id(); v_p public.supplier_payments%ROWTYPE;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_buying') THEN RAISE EXCEPTION 'You do not have permission to pay suppliers.'; END IF;
  IF COALESCE(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'Give a reason for cancelling this payment.'; END IF;
  SELECT * INTO v_p FROM public.supplier_payments WHERE id = p_payment_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF v_p.status <> 'posted' THEN RAISE EXCEPTION 'This payment is already cancelled.'; END IF;
  UPDATE public.supplier_payments SET status = 'voided', void_reason = trim(p_reason), voided_at = now(), voided_by = auth.uid() WHERE id = v_p.id;
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('payment_id', v_p.id, 'status', 'voided');
END $function$;

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
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('distributor_id', v_dealer, 'already', false);
END $function$;

CREATE OR REPLACE FUNCTION public.record_supplier_payment_atomic(p_supplier_id uuid, p_amount numeric, p_mode payment_mode, p_paid_on date, p_reference text, p_note text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_company uuid := public.get_company_id(); v_sup public.suppliers%ROWTYPE; v_id uuid; v_bal numeric;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_buying') THEN RAISE EXCEPTION 'You do not have permission to pay suppliers.'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_id FROM public.supplier_payments WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('payment_id', v_id, 'duplicate', true); END IF;
  END IF;
  SELECT * INTO v_sup FROM public.suppliers WHERE id = p_supplier_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supplier not found in this business'; END IF;
  p_amount := round(p_amount, 2);
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be more than zero.'; END IF;
  IF p_paid_on IS NULL OR p_paid_on > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Payment date can''t be in the future.'; END IF;
  v_bal := public.supplier_balance(p_supplier_id);
  IF p_amount > v_bal THEN RAISE EXCEPTION 'You owe this supplier only ₹%. Pay that or less.', v_bal; END IF;
  INSERT INTO public.supplier_payments (company_id, supplier_id, amount, mode, paid_on, reference, note, idempotency_key, posted_by)
  VALUES (v_company, v_sup.id, p_amount, p_mode, p_paid_on, CASE WHEN p_mode = 'cash' THEN '' ELSE COALESCE(p_reference,'') END, COALESCE(p_note,''), p_idempotency_key, auth.uid())
  RETURNING id INTO v_id;
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('payment_id', v_id, 'balance', v_bal - p_amount);
END $function$;

CREATE OR REPLACE FUNCTION public.cancel_purchase_bill_atomic(p_bill_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('bill_id', v_bill.id, 'status', 'cancelled');
END $function$;

CREATE OR REPLACE FUNCTION public.delete_order_atomic(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_company uuid := public.get_company_id(); v_o public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Please sign in again.'; END IF;
  IF public.has_role(auth.uid(), 'viewer') THEN RAISE EXCEPTION 'You do not have permission to delete orders.'; END IF;
  SELECT * INTO v_o FROM public.orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This order was not found.'; END IF;
  IF v_o.delivery_status <> 'pending' THEN RAISE EXCEPTION 'Only orders not yet sent can be deleted.'; END IF;
  IF EXISTS (SELECT 1 FROM public.invoices WHERE source_order_id = v_o.id AND doc_type = 'gst_invoice') THEN
    RAISE EXCEPTION 'This order has a GST bill and cannot be deleted.'; END IF;
  IF EXISTS (SELECT 1 FROM public.invoice_payments WHERE order_id = v_o.id) THEN
    RAISE EXCEPTION 'This order has money recorded against it. Cancel the payments first.'; END IF;
  DELETE FROM public.stock_deductions WHERE order_id = v_o.id;
  DELETE FROM public.order_schemes WHERE order_id = v_o.id;
  DELETE FROM public.order_lines WHERE order_id = v_o.id;
  DELETE FROM public.orders WHERE id = v_o.id;
  -- Activity row is written by the tg_audit_row trigger.
  RETURN jsonb_build_object('ok', true, 'order_number', v_o.order_number);
END $function$;