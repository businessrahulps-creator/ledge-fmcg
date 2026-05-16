
-- 1. Source column + backfill + idempotency index
ALTER TABLE public.stock_deductions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

UPDATE public.stock_deductions
SET source = 'auto_dispatch'
WHERE source = 'manual' AND order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stock_deductions_auto_dispatch_uniq
  ON public.stock_deductions (order_id, product_id)
  WHERE source = 'auto_dispatch';

-- Allow order_id to be NULL for reversal audit rows (already nullable? schema shows NOT NULL).
ALTER TABLE public.stock_deductions
  ALTER COLUMN order_id DROP NOT NULL;

-- 2. Preview function
CREATE OR REPLACE FUNCTION public.preview_dispatch_impact(p_order_id uuid)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  required_qty integer,
  current_qty integer,
  after_qty integer,
  will_go_negative boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_godown uuid;
BEGIN
  SELECT company_id, godown_id INTO v_company, v_godown
  FROM orders WHERE id = p_order_id;
  IF v_company IS NULL OR v_company <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  RETURN QUERY
  SELECT
    ol.product_id,
    ol.product_name,
    ol.quantity::int AS required_qty,
    COALESCE(si.quantity, 0)::int AS current_qty,
    (COALESCE(si.quantity, 0) - ol.quantity)::int AS after_qty,
    (COALESCE(si.quantity, 0) - ol.quantity) < 0 AS will_go_negative
  FROM order_lines ol
  LEFT JOIN stock_items si
    ON si.product_id = ol.product_id
   AND si.godown_id = v_godown
   AND si.company_id = v_company
  WHERE ol.order_id = p_order_id;
END;
$$;

-- 3. Atomic dispatch RPC
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
SET search_path = public
AS $$
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

  -- Always flip the order status fields
  UPDATE orders SET
    delivery_status = 'dispatched',
    dispatch_date = COALESCE(p_dispatch_date, dispatch_date, v_today),
    vehicle = COALESCE(p_vehicle, vehicle),
    driver_name = COALESCE(p_driver_name, driver_name),
    dispatch_remarks = COALESCE(p_dispatch_remarks, dispatch_remarks)
  WHERE id = p_order_id;

  -- Missing godown: log + skip deduction
  IF v_godown IS NULL THEN
    INSERT INTO error_log (source, severity, message, company_id, context)
    VALUES ('dispatch_order_atomic.no_godown', 'warning',
            'Order dispatched without a warehouse — stock not auto-deducted',
            v_company, jsonb_build_object('order_id', p_order_id));
    RETURN jsonb_build_object('ok', true, 'skipped', 'no_godown', 'warnings', '[]'::jsonb, 'lines', 0);
  END IF;

  -- Idempotency short-circuit
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
$$;

-- 4. Reverse RPC: deletes auto_dispatch rows (existing trigger restores stock),
-- then inserts a mirror audit row with source='return_reversal' and NULL order_id.
CREATE OR REPLACE FUNCTION public.reverse_dispatch_for_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  FOR v_row IN
    SELECT id, product_id, godown_id, quantity_deducted
    FROM stock_deductions
    WHERE order_id = p_order_id AND source = 'auto_dispatch'
  LOOP
    -- Audit row first (before delete trigger fires)
    INSERT INTO stock_deductions (
      company_id, order_id, product_id, godown_id,
      quantity_deducted, date, source
    ) VALUES (
      v_company, NULL, v_row.product_id, v_row.godown_id,
      -v_row.quantity_deducted, CURRENT_DATE, 'return_reversal'
    );
    -- Delete original (existing trigger restores quantity)
    DELETE FROM stock_deductions WHERE id = v_row.id;
    v_reversed := v_reversed + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'reversed', v_reversed);
END;
$$;

-- 5. The restore_stock_on_deduction_delete trigger must skip return_reversal rows
-- (they have negative quantity_deducted and order_id NULL; deleting them later
-- shouldn't subtract stock). Guard it.
CREATE OR REPLACE FUNCTION public.restore_stock_on_deduction_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.source = 'return_reversal' THEN
    RETURN OLD;
  END IF;
  UPDATE stock_items
  SET quantity = quantity + OLD.quantity_deducted,
      updated_at = now()
  WHERE product_id = OLD.product_id
    AND godown_id = OLD.godown_id
    AND company_id = OLD.company_id;
  RETURN OLD;
END;
$$;
