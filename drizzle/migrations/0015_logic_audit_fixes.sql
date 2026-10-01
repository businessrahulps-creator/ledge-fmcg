CREATE OR REPLACE FUNCTION public.adjust_stock_atomic(p_product_id uuid, p_godown_id uuid, p_new_quantity integer, p_threshold integer DEFAULT NULL::integer, p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_row public.stock_items%ROWTYPE;
  v_delta integer;
  v_threshold integer;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_stock'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to change stock.';
  END IF;
  IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative';
  END IF;

  PERFORM 1 FROM public.products WHERE id = p_product_id AND company_id = v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found in this workspace'; END IF;
  PERFORM 1 FROM public.godowns WHERE id = p_godown_id AND company_id = v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Warehouse not found in this workspace'; END IF;

  SELECT * INTO v_row FROM public.stock_items
   WHERE company_id = v_company AND product_id = p_product_id AND godown_id = p_godown_id
   FOR UPDATE;

  IF FOUND THEN
    v_delta := p_new_quantity - v_row.quantity;
    v_threshold := COALESCE(p_threshold, v_row.threshold);
    UPDATE public.stock_items
       SET quantity = p_new_quantity, threshold = v_threshold, updated_at = now()
     WHERE id = v_row.id;
  ELSE
    v_delta := p_new_quantity;
    v_threshold := COALESCE(p_threshold, 0);
    INSERT INTO public.stock_items (company_id, product_id, godown_id, quantity, threshold)
    VALUES (v_company, p_product_id, p_godown_id, p_new_quantity, v_threshold)
    RETURNING * INTO v_row;
  END IF;

  IF v_delta <> 0 THEN
    INSERT INTO public.stock_movements (
      company_id, product_id, godown_id, delta, movement_type,
      source_doc_type, source_doc_id, actor, note
    ) VALUES (
      v_company, p_product_id, p_godown_id, v_delta, 'manual_adjust',
      'stock_item', v_row.id, auth.uid(), COALESCE(p_note, '')
    );
  END IF;

  RETURN jsonb_build_object(
    'stock_item_id', v_row.id,
    'quantity', p_new_quantity,
    'threshold', v_threshold,
    'delta', v_delta
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_godown_atomic(p_godown_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_name text;
  v_with_stock integer;
  v_open_orders integer;
  v_removed integer;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_stock'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to change stock.';
  END IF;

  SELECT name INTO v_name FROM public.godowns
   WHERE id = p_godown_id AND company_id = v_company FOR UPDATE;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Warehouse not found in this workspace'; END IF;

  PERFORM 1 FROM public.stock_items WHERE company_id = v_company AND godown_id = p_godown_id FOR UPDATE;
  SELECT count(*) INTO v_with_stock FROM public.stock_items
   WHERE company_id = v_company AND godown_id = p_godown_id AND quantity <> 0;
  IF v_with_stock > 0 THEN
    RAISE EXCEPTION 'This warehouse still holds stock for % product(s). Move or clear the stock first.', v_with_stock;
  END IF;

  SELECT count(*) INTO v_open_orders FROM public.orders
   WHERE company_id = v_company AND godown_id = p_godown_id AND delivery_status = 'pending' AND cancelled_at IS NULL;
  IF v_open_orders > 0 THEN
    RAISE EXCEPTION 'This warehouse is set on % order(s) that are not dispatched yet.', v_open_orders;
  END IF;

  DELETE FROM public.stock_items
   WHERE company_id = v_company AND godown_id = p_godown_id;
  GET DIAGNOSTICS v_removed = ROW_COUNT;

  DELETE FROM public.godowns WHERE id = p_godown_id AND company_id = v_company;

  RETURN jsonb_build_object('deleted', true, 'name', v_name, 'stock_rows_removed', v_removed);
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_order_delivered_atomic(p_order_id uuid, p_delivered_on timestamp with time zone DEFAULT now(), p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_order record;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN RAISE EXCEPTION 'You can only view orders, not change them.'; END IF;

  SELECT * INTO v_order FROM orders
   WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found in your workspace.'; END IF;
  IF v_order.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'This order was cancelled.'; END IF;
  IF v_order.delivery_status = 'delivered' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'order_id', p_order_id);
  END IF;
  IF v_order.delivery_status <> 'dispatched' THEN
    RAISE EXCEPTION 'Dispatch and bill this order before marking it delivered.';
  END IF;

  UPDATE orders
     SET delivery_status = 'delivered',
         delivered_at = COALESCE(p_delivered_on, now()),
         dispatch_remarks = CASE WHEN COALESCE(p_note,'') = '' THEN dispatch_remarks
                                 ELSE TRIM(BOTH E'\n' FROM COALESCE(dispatch_remarks,'') || E'\n' || p_note) END,
         updated_at = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reverse_dispatch_for_order(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid;
  v_godown uuid;
  v_row RECORD;
  v_reversed int := 0;
BEGIN
  SELECT company_id, godown_id INTO v_company, v_godown
  FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_company IS NULL OR public.get_company_id() IS NULL OR v_company <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: viewers cannot reverse dispatches';
  END IF;

  FOR v_row IN
    SELECT id, product_id, godown_id, quantity_deducted
    FROM stock_deductions
    WHERE order_id = p_order_id AND source = 'auto_dispatch'
  LOOP
    INSERT INTO stock_deductions (
      company_id, order_id, product_id, godown_id,
      quantity_deducted, date, source
    ) VALUES (
      v_company, NULL, v_row.product_id, v_row.godown_id,
      -v_row.quantity_deducted, (now() AT TIME ZONE 'Asia/Kolkata')::date, 'return_reversal'
    );
    DELETE FROM stock_deductions WHERE id = v_row.id;
    v_reversed := v_reversed + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'reversed', v_reversed);
END;
$function$;

CREATE OR REPLACE FUNCTION public.void_invoice_payment_atomic(p_payment_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_pay record;
  v_inv record;
  v_order record;
  v_paid numeric(14,2);
  v_credited numeric(14,2);
  v_due numeric(14,2);
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to cancel a payment.';
  END IF;
  IF COALESCE(TRIM(p_reason),'') = '' THEN RAISE EXCEPTION 'Say why this payment is being cancelled.'; END IF;

  SELECT * INTO v_pay FROM invoice_payments
   WHERE id = p_payment_id AND company_id = v_company FOR UPDATE;
  IF v_pay.id IS NULL THEN RAISE EXCEPTION 'Payment not found in your workspace.'; END IF;
  IF v_pay.status = 'voided' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', p_payment_id);
  END IF;

  UPDATE invoice_payments
     SET status = 'voided', voided_by = auth.uid(), voided_at = now(), void_reason = TRIM(p_reason)
   WHERE id = v_pay.id;

  IF v_pay.invoice_id IS NOT NULL THEN
    SELECT * INTO v_inv FROM invoices WHERE id = v_pay.invoice_id FOR UPDATE;

    SELECT COALESCE(SUM(amount),0) INTO v_paid
      FROM invoice_payments WHERE invoice_id = v_inv.id AND status = 'posted';
    SELECT COALESCE(SUM(grand_total),0) INTO v_credited
      FROM credit_notes WHERE invoice_id = v_inv.id;
    v_due := ROUND(v_inv.grand_total - v_paid - v_credited, 2);

    UPDATE invoices
       SET status = CASE WHEN v_due <= 0 THEN 'paid' WHEN v_paid > 0 THEN 'partial' ELSE 'posted' END,
           updated_at = now()
     WHERE id = v_inv.id;

    IF v_inv.source_order_id IS NOT NULL THEN
      UPDATE orders
         SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status
                                   WHEN v_paid > 0 THEN 'partial'::payment_status
                                   ELSE 'pending'::payment_status END,
             updated_at = now()
       WHERE id = v_inv.source_order_id AND company_id = v_company;
    END IF;
  ELSE
    SELECT * INTO v_order FROM orders WHERE id = v_pay.order_id FOR UPDATE;
    SELECT COALESCE(SUM(amount),0) INTO v_paid
      FROM invoice_payments WHERE order_id = v_order.id AND status = 'posted';
    v_due := ROUND(COALESCE(public.order_bill_equivalent(v_order.id), 0) - v_paid, 2);

    UPDATE orders
       SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status
                                 WHEN v_paid > 0 THEN 'partial'::payment_status
                                 ELSE 'pending'::payment_status END,
           updated_at = now()
     WHERE id = v_order.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_pay.id, 'balance_due', v_due);
END;
$function$;