DO $mig$
DECLARE
  s text;
  old_block text := '      INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold, last_deducted_date)
      VALUES (v_company, v_line.product_id, v_godown, -v_line.quantity, 0, v_date)
      ON CONFLICT (company_id, product_id, godown_id)
      DO UPDATE SET quantity = stock_items.quantity - v_line.quantity,
                    last_deducted_date = v_date,
                    updated_at = now();';
  new_block text := '      UPDATE stock_items
         SET quantity = quantity - v_line.quantity,
             last_deducted_date = v_date,
             updated_at = now()
       WHERE company_id = v_company
         AND product_id = v_line.product_id
         AND godown_id = v_godown;
      IF NOT FOUND THEN
        RAISE EXCEPTION ''This product is not stocked in the chosen warehouse.'';
      END IF;';
BEGIN
  SELECT p.prosrc INTO s
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'dispatch_and_bill_order_atomic';

  IF s IS NULL THEN RAISE EXCEPTION 'function not found'; END IF;
  IF position(old_block in s) = 0 THEN RAISE EXCEPTION 'stock block not found'; END IF;

  EXECUTE 'CREATE OR REPLACE FUNCTION public.dispatch_and_bill_order_atomic(p_order_id uuid, p_godown_id uuid DEFAULT NULL::uuid, p_dispatch_date date DEFAULT NULL::date, p_vehicle text DEFAULT NULL::text, p_driver_name text DEFAULT NULL::text, p_dispatch_remarks text DEFAULT NULL::text, p_override_credit boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''public'' AS '
    || quote_literal(replace(s, old_block, new_block));
END
$mig$;

REVOKE ALL ON FUNCTION public.dispatch_and_bill_order_atomic(uuid, uuid, date, text, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_and_bill_order_atomic(uuid, uuid, date, text, text, text, boolean) TO authenticated;