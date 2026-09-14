CREATE OR REPLACE FUNCTION public.adjust_stock_atomic(
  p_product_id uuid,
  p_godown_id uuid,
  p_new_quantity integer,
  p_threshold integer DEFAULT NULL,
  p_note text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_row public.stock_items%ROWTYPE;
  v_delta integer;
  v_threshold integer;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
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
$$;

REVOKE ALL ON FUNCTION public.adjust_stock_atomic(uuid, uuid, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock_atomic(uuid, uuid, integer, integer, text) TO authenticated;