CREATE OR REPLACE FUNCTION public.mark_order_delivered_atomic(
  p_order_id uuid,
  p_delivered_on timestamptz DEFAULT now(),
  p_note text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_order record;
  v_day date;
  v_min date;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;

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

  v_day := (COALESCE(p_delivered_on, now()) AT TIME ZONE 'Asia/Kolkata')::date;
  IF v_day > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'Delivery date can''t be in the future.';
  END IF;
  v_min := COALESCE(v_order.dispatch_date::date, v_order.date::date);
  IF v_min IS NOT NULL AND v_day < v_min THEN
    RAISE EXCEPTION 'Delivery date can''t be before the order was sent.';
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
$$;
REVOKE EXECUTE ON FUNCTION public.mark_order_delivered_atomic(uuid,timestamptz,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_order_delivered_atomic(uuid,timestamptz,text) TO authenticated;