-- Phase 1: make stock readers decimal-safe (no column changes; safe with whole numbers)

-- 1) Activity log trigger: read stock movement delta as decimal, show without trailing zeros
DO $do$
DECLARE d text; n text;
BEGIN
  d := pg_get_functiondef('public.tg_audit_row()'::regprocedure);
  n := replace(d, $s$(j->>'delta')::int >= 0$s$, $s$(j->>'delta')::numeric >= 0$s$);
  n := replace(n, $s$END || (j->>'delta') || ' ('$s$, $s$END || trim_scale((j->>'delta')::numeric)::text || ' ('$s$);
  IF n = d OR position($s$(j->>'delta')::int$s$ in n) > 0 THEN
    RAISE EXCEPTION 'tg_audit_row: expected pattern not found';
  END IF;
  EXECUTE n;
END
$do$;

-- 2) Dispatch & bill: compare/report stock as decimal (no ::int rounding)
DO $do$
DECLARE d text; n text;
BEGIN
  d := pg_get_functiondef('public.dispatch_and_bill_order_atomic'::regproc);
  n := replace(d, 'SUM(ol.quantity)::int AS need', 'SUM(ol.quantity)::numeric AS need');
  n := replace(n, 'COALESCE(MAX(si.quantity), 0)::int AS have', 'trim_scale(COALESCE(MAX(si.quantity), 0)::numeric) AS have');
  IF n = d OR position('::int AS need' in n) > 0 OR position('::int AS have' in n) > 0 THEN
    RAISE EXCEPTION 'dispatch_and_bill_order_atomic: expected pattern not found';
  END IF;
  EXECUTE n;
END
$do$;

-- 3) Dispatch preview: decimal outputs
DROP FUNCTION public.preview_dispatch_impact(uuid);
CREATE FUNCTION public.preview_dispatch_impact(p_order_id uuid)
 RETURNS TABLE(product_id uuid, product_name text, required_qty numeric, current_qty numeric, after_qty numeric, will_go_negative boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid;
  v_godown uuid;
BEGIN
  SELECT company_id, godown_id INTO v_company, v_godown
  FROM orders WHERE id = p_order_id;
  IF v_company IS NULL OR public.get_company_id() IS NULL OR v_company IS DISTINCT FROM public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  RETURN QUERY
  SELECT
    ol.product_id,
    ol.product_name,
    ol.quantity::numeric AS required_qty,
    COALESCE(si.quantity, 0)::numeric AS current_qty,
    (COALESCE(si.quantity, 0) - ol.quantity)::numeric AS after_qty,
    (COALESCE(si.quantity, 0) - ol.quantity) < 0 AS will_go_negative
  FROM order_lines ol
  LEFT JOIN stock_items si
    ON si.product_id = ol.product_id
   AND si.godown_id = v_godown
   AND si.company_id = v_company
  WHERE ol.order_id = p_order_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.preview_dispatch_impact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_dispatch_impact(uuid) TO authenticated, service_role;

-- 4) Stock adjust: decimal quantity and change (threshold stays whole)
DROP FUNCTION public.adjust_stock_atomic(uuid, uuid, integer, integer, text);
CREATE FUNCTION public.adjust_stock_atomic(p_product_id uuid, p_godown_id uuid, p_new_quantity numeric, p_threshold integer DEFAULT NULL::integer, p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_row public.stock_items%ROWTYPE;
  v_delta numeric;
  v_threshold integer;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_stock'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to change stock.';
  END IF;
  IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative';
  END IF;
  IF p_new_quantity <> round(p_new_quantity, 6) THEN
    RAISE EXCEPTION 'Quantity can have at most 6 decimal places';
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
REVOKE ALL ON FUNCTION public.adjust_stock_atomic(uuid, uuid, numeric, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock_atomic(uuid, uuid, numeric, integer, text) TO authenticated, service_role;