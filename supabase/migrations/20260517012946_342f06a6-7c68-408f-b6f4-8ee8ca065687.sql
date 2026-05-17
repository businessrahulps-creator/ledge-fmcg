CREATE OR REPLACE FUNCTION public.dispatch_order_atomic(
  p_order_id uuid,
  p_dispatch_date date DEFAULT NULL,
  p_vehicle text DEFAULT NULL,
  p_driver_name text DEFAULT NULL,
  p_dispatch_remarks text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid;
  v_godown uuid;
  v_already int;
  v_line RECORD;
  v_existing_qty int;
  v_existing_id uuid;
  v_warnings jsonb := '[]'::jsonb;
  v_today date := CURRENT_DATE;
  v_lines_count int := 0;
BEGIN
  SELECT company_id, godown_id INTO v_company, v_godown
  FROM orders WHERE id = p_order_id;

  IF v_company IS NULL OR v_company <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: viewers cannot dispatch orders';
  END IF;

  UPDATE orders SET
    delivery_status = 'dispatched',
    dispatch_date = COALESCE(p_dispatch_date, dispatch_date, v_today),
    vehicle = COALESCE(p_vehicle, vehicle),
    driver_name = COALESCE(p_driver_name, driver_name),
    dispatch_remarks = COALESCE(p_dispatch_remarks, dispatch_remarks)
  WHERE id = p_order_id;

  IF v_godown IS NULL THEN
    INSERT INTO error_log (source, severity, message, company_id, context)
    VALUES ('dispatch_order_atomic.no_godown', 'warning',
            'Order dispatched without a warehouse — stock not auto-deducted',
            v_company, jsonb_build_object('order_id', p_order_id));
    RETURN jsonb_build_object('ok', true, 'skipped', 'no_godown', 'warnings', '[]'::jsonb, 'lines', 0);
  END IF;

  SELECT COUNT(*) INTO v_already
  FROM stock_deductions
  WHERE order_id = p_order_id AND source = 'auto_dispatch';

  IF v_already > 0 THEN
    RETURN jsonb_build_object('ok', true, 'skipped', 'already_deducted', 'warnings', '[]'::jsonb, 'lines', v_already);
  END IF;

  FOR v_line IN
    SELECT product_id, product_name, quantity FROM order_lines WHERE order_id = p_order_id
  LOOP
    v_lines_count := v_lines_count + 1;
    SELECT id, quantity INTO v_existing_id, v_existing_qty
    FROM stock_items
    WHERE company_id = v_company AND godown_id = v_godown AND product_id = v_line.product_id;

    INSERT INTO stock_deductions (
      company_id, order_id, product_id, godown_id, quantity_deducted, date, source
    ) VALUES (
      v_company, p_order_id, v_line.product_id, v_godown, v_line.quantity, v_today, 'auto_dispatch'
    );

    IF v_existing_id IS NOT NULL THEN
      UPDATE stock_items
      SET quantity = v_existing_qty - v_line.quantity,
          last_deducted_date = v_today,
          updated_at = now()
      WHERE id = v_existing_id;
      IF (v_existing_qty - v_line.quantity) < 0 THEN
        v_warnings := v_warnings || jsonb_build_object(
          'product_id', v_line.product_id,
          'product_name', v_line.product_name,
          'before', v_existing_qty,
          'after', v_existing_qty - v_line.quantity,
          'required', v_line.quantity
        );
      END IF;
    ELSE
      INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold, last_deducted_date)
      VALUES (v_company, v_line.product_id, v_godown, -v_line.quantity, 0, v_today);
      v_warnings := v_warnings || jsonb_build_object(
        'product_id', v_line.product_id,
        'product_name', v_line.product_name,
        'before', 0,
        'after', -v_line.quantity,
        'required', v_line.quantity
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'warnings', v_warnings, 'lines', v_lines_count);
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
  FROM orders WHERE id = p_order_id;
  IF v_company IS NULL OR v_company <> public.get_company_id() THEN
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
      -v_row.quantity_deducted, CURRENT_DATE, 'return_reversal'
    );
    DELETE FROM stock_deductions WHERE id = v_row.id;
    v_reversed := v_reversed + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'reversed', v_reversed);
END;
$function$;