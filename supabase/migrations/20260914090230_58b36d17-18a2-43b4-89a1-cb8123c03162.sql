DO $mig$
DECLARE
  v_src text;
  v_old text;
  v_new text;
BEGIN
  SELECT prosrc INTO v_src FROM pg_proc WHERE proname = 'dispatch_and_bill_order_atomic';

  v_old := 'INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold, last_deducted_date)
      VALUES (v_company, v_line.product_id, v_godown, -v_line.quantity, 0, v_date)
      ON CONFLICT (company_id, product_id, godown_id)
      DO UPDATE SET quantity = stock_items.quantity - v_line.quantity,
                    last_deducted_date = v_date,
                    updated_at = now();';

  v_new := 'INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold, last_deducted_date)
      VALUES (v_company, v_line.product_id, v_godown, 0, 0, v_date)
      ON CONFLICT (company_id, product_id, godown_id) DO NOTHING;

      UPDATE stock_items
         SET quantity = quantity - v_line.quantity,
             last_deducted_date = v_date,
             updated_at = now()
       WHERE company_id = v_company
         AND product_id = v_line.product_id
         AND godown_id = v_godown
         AND quantity >= v_line.quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION ''Not enough % in this warehouse to dispatch. Move stock in first.'', v_line.product_name;
      END IF;';

  IF position(v_old in v_src) = 0 THEN
    RAISE EXCEPTION 'dispatch_and_bill_order_atomic stock block not found - aborting';
  END IF;

  v_src := replace(v_src, v_old, v_new);

  EXECUTE 'CREATE OR REPLACE FUNCTION public.dispatch_and_bill_order_atomic('
    || 'p_order_id uuid, p_godown_id uuid DEFAULT NULL::uuid, p_dispatch_date date DEFAULT NULL::date, '
    || 'p_vehicle text DEFAULT NULL::text, p_driver_name text DEFAULT NULL::text, '
    || 'p_dispatch_remarks text DEFAULT NULL::text, p_override_credit boolean DEFAULT false) '
    || 'RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''public'' AS $fn$'
    || v_src || '$fn$';
END
$mig$;

REVOKE ALL ON FUNCTION public.dispatch_and_bill_order_atomic(uuid, uuid, date, text, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_and_bill_order_atomic(uuid, uuid, date, text, text, text, boolean) TO authenticated;