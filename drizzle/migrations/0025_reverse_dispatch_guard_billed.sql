CREATE OR REPLACE FUNCTION public.reverse_dispatch_for_order(p_order_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid; v_row RECORD; v_reversed int := 0;
BEGIN
  SELECT company_id INTO v_company FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_company IS NULL OR public.get_company_id() IS NULL OR v_company <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: viewers cannot reverse dispatches';
  END IF;
  -- A GST bill can't be undone quietly: goods coming back must go through a return + credit note.
  IF EXISTS (SELECT 1 FROM invoices WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice' AND status <> 'draft') THEN
    RAISE EXCEPTION 'This order already has a GST bill. To take goods back, use Returns.';
  END IF;
  FOR v_row IN
    SELECT id, product_id, godown_id, quantity_deducted FROM stock_deductions
     WHERE order_id = p_order_id AND source = 'auto_dispatch'
     ORDER BY product_id, godown_id
  LOOP
    INSERT INTO stock_deductions (company_id, order_id, product_id, godown_id, quantity_deducted, date, source)
    VALUES (v_company, NULL, v_row.product_id, v_row.godown_id, -v_row.quantity_deducted,
            (now() AT TIME ZONE 'Asia/Kolkata')::date, 'return_reversal');
    DELETE FROM stock_deductions WHERE id = v_row.id;  -- trigger restores stock_items.quantity
    INSERT INTO stock_movements (company_id, product_id, godown_id, delta, movement_type, source_doc_type, source_doc_id, actor, note)
    VALUES (v_company, v_row.product_id, v_row.godown_id, v_row.quantity_deducted, 'dispatch_reversal', 'order', p_order_id, auth.uid(), 'Send undone');
    v_reversed := v_reversed + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'reversed', v_reversed);
END;
$function$;
REVOKE ALL ON FUNCTION public.reverse_dispatch_for_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reverse_dispatch_for_order(uuid) TO authenticated;