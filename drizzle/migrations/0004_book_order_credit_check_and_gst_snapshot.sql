CREATE OR REPLACE FUNCTION public.book_order_atomic(p_date date, p_distributor_id uuid, p_salesperson_id uuid, p_lines jsonb, p_godown_id uuid DEFAULT NULL::uuid, p_applied_schemes jsonb DEFAULT '[]'::jsonb, p_scheme_savings numeric DEFAULT 0, p_remarks text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_dealer_name text;
  v_sp_name text;
  v_prefix text;
  v_seq int;
  v_order_number text;
  v_order_id uuid;
  v_gross numeric(14,2) := 0;
  v_total_qty int := 0;
  v_line jsonb;
  v_count int := 0;
  v_s RECORD;
  v_savings numeric(14,2);
  v_label text;
  v_line_qty int;
  v_line_price numeric(14,2);
  v_line_amount numeric(14,2);
  v_best_savings numeric(14,2) := 0;
  v_best_id uuid;
  v_best_name text;
  v_best_label text;
  v_stack_total numeric(14,2) := 0;
  v_final_savings numeric(14,2) := 0;
  v_sets int;
  v_top_price numeric(14,2);
  v_credit_mode text;
  v_credit_limit numeric(14,2);
  v_ceiling numeric(14,2);
  v_outstanding numeric(14,2);
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'place_orders'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to place orders.';
  END IF;

  SELECT name, COALESCE(credit_mode, 'unlimited'), COALESCE(credit_limit, 0)
    INTO v_dealer_name, v_credit_mode, v_credit_limit
    FROM distributors WHERE id = p_distributor_id AND company_id = v_company;
  IF v_dealer_name IS NULL THEN RAISE EXCEPTION 'Dealer not found in your workspace.'; END IF;

  SELECT name INTO v_sp_name FROM salespersons WHERE id = p_salesperson_id AND company_id = v_company;
  IF v_sp_name IS NULL THEN RAISE EXCEPTION 'Sales person not found in your workspace.'; END IF;

  IF p_godown_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM godowns WHERE id = p_godown_id AND company_id = v_company
  ) THEN RAISE EXCEPTION 'Warehouse not found in your workspace.'; END IF;

  IF jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Add at least one product to the order.';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_book_lines (
    product_id uuid, quantity int, unit_price numeric(14,2), amount numeric(14,2)
  ) ON COMMIT DROP;
  DELETE FROM tmp_book_lines;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = (v_line->>'product_id')::uuid AND company_id = v_company) THEN
      RAISE EXCEPTION 'Product not found in your workspace.';
    END IF;
    IF (v_line->>'quantity')::int <= 0 THEN RAISE EXCEPTION 'Quantity must be more than zero.'; END IF;
    IF (v_line->>'unit_price')::numeric < 0 THEN RAISE EXCEPTION 'Price cannot be negative.'; END IF;

    v_line_qty := (v_line->>'quantity')::int;
    v_line_price := (v_line->>'unit_price')::numeric;
    v_line_amount := ROUND(v_line_qty * v_line_price, 2);

    INSERT INTO tmp_book_lines VALUES ((v_line->>'product_id')::uuid, v_line_qty, v_line_price, v_line_amount);

    v_gross := v_gross + v_line_amount;
    v_total_qty := v_total_qty + v_line_qty;
    v_count := v_count + 1;
  END LOOP;

  SELECT COALESCE(MAX(unit_price), 0) INTO v_top_price FROM tmp_book_lines;

  CREATE TEMP TABLE IF NOT EXISTS tmp_book_schemes (
    scheme_id uuid, scheme_name text, scheme_label text, savings numeric(14,2), combinable boolean
  ) ON COMMIT DROP;
  DELETE FROM tmp_book_schemes;

  FOR v_s IN
    SELECT * FROM schemes s
     WHERE s.company_id = v_company
       AND s.is_active
       AND s.valid_from <= p_date
       AND (s.valid_until IS NULL OR s.valid_until >= p_date)
       AND (s.dealer_id IS NULL OR s.dealer_id = p_distributor_id)
  LOOP
    v_savings := 0;
    v_label := '';

    IF v_s.min_order_value > 0 AND v_gross < v_s.min_order_value THEN CONTINUE; END IF;

    IF v_s.product_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM tmp_book_lines WHERE product_id = v_s.product_id) THEN CONTINUE; END IF;
      IF v_s.min_qty > 0 AND (SELECT SUM(quantity) FROM tmp_book_lines WHERE product_id = v_s.product_id) < v_s.min_qty THEN
        CONTINUE;
      END IF;
    ELSIF v_s.min_qty > 0 AND v_total_qty < v_s.min_qty THEN
      CONTINUE;
    END IF;

    IF v_s.scheme_type = 'percentage' THEN
      IF v_s.product_id IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) * v_s.discount_percent / 100 INTO v_savings
          FROM tmp_book_lines WHERE product_id = v_s.product_id;
      ELSE
        v_savings := v_gross * v_s.discount_percent / 100;
      END IF;
      v_label := v_s.discount_percent || '% off';

    ELSIF v_s.scheme_type = 'buy_x_get_y' THEN
      IF v_s.buy_qty > 0 THEN
        IF v_s.product_id IS NOT NULL THEN
          SELECT FLOOR(COALESCE(SUM(quantity), 0) / v_s.buy_qty), COALESCE(MAX(unit_price), 0)
            INTO v_sets, v_line_price
            FROM tmp_book_lines WHERE product_id = v_s.product_id;
          v_savings := v_sets * v_s.free_qty * v_line_price;
        ELSE
          v_sets := FLOOR(v_total_qty / v_s.buy_qty);
          v_savings := v_sets * v_s.free_qty * v_top_price;
        END IF;
      END IF;
      v_label := 'Buy ' || v_s.buy_qty || ' Get ' || v_s.free_qty || ' Free';

    ELSIF v_s.scheme_type = 'flat_discount' THEN
      v_savings := v_s.flat_amount;
      v_label := v_s.flat_amount || ' off';
    END IF;

    v_savings := ROUND(GREATEST(v_savings, 0), 2);
    IF v_savings <= 0 THEN CONTINUE; END IF;

    INSERT INTO tmp_book_schemes VALUES (v_s.id, v_s.name, v_label, v_savings, v_s.is_combinable);

    IF v_s.is_combinable THEN
      v_stack_total := v_stack_total + v_savings;
    ELSIF v_savings > v_best_savings THEN
      v_best_savings := v_savings;
      v_best_id := v_s.id;
      v_best_name := v_s.name;
      v_best_label := v_label;
    END IF;
  END LOOP;

  v_final_savings := LEAST(ROUND(v_stack_total + v_best_savings, 2), v_gross);

  -- Credit ceiling is enforced here too, so a tampered client cannot book past it.
  -- Only people who may approve an override are allowed through.
  v_ceiling := CASE
    WHEN v_credit_mode = 'cash_only' THEN 0
    WHEN v_credit_mode = 'limited' THEN GREATEST(v_credit_limit, 0)
    ELSE NULL
  END;
  IF v_ceiling IS NOT NULL THEN
    v_outstanding := COALESCE(public.dealer_outstanding(p_distributor_id), 0);
    IF ROUND(v_outstanding + (v_gross - v_final_savings), 2) > v_ceiling
       AND NOT public.has_capability(auth.uid(), 'override_credit_limit'::capability_key) THEN
      IF v_ceiling = 0 THEN
        RAISE EXCEPTION '% is set to no credit. Collect payment first, or ask someone who can approve an override.', v_dealer_name;
      ELSE
        RAISE EXCEPTION '% would owe more than their credit limit. Ask someone who can approve it.', v_dealer_name;
      END IF;
    END IF;
  END IF;

  SELECT prefix, seq INTO v_prefix, v_seq FROM public.get_next_order_number(v_company);
  v_order_number := v_prefix || '-' || to_char(p_date, 'YYYY') || '-' || lpad(v_seq::text, 4, '0');

  INSERT INTO orders (
    company_id, order_number, date, distributor_id, distributor_name,
    salesperson_id, salesperson_name, total, payment_mode, payment_status,
    delivery_status, godown_id, scheme_savings, dispatch_remarks, booked_at
  ) VALUES (
    v_company, v_order_number, p_date, p_distributor_id, v_dealer_name,
    p_salesperson_id, v_sp_name, v_gross,
    'cash'::payment_mode, 'pending'::payment_status,
    'pending'::delivery_status, p_godown_id, v_final_savings, COALESCE(p_remarks, ''), now()
  ) RETURNING id INTO v_order_id;

  -- The GST rate is captured on the line, so changing a product's rate later
  -- never rewrites the tax on an order already booked.
  INSERT INTO order_lines (
    order_id, product_id, product_name, quantity, unit_price, line_total,
    booked_quantity, gross_amount, gst_rate
  )
  SELECT v_order_id, t.product_id, COALESCE(p.name, ''), t.quantity, t.unit_price, t.amount, t.quantity, t.amount, p.gst_rate
    FROM tmp_book_lines t LEFT JOIN products p ON p.id = t.product_id;

  INSERT INTO order_schemes (order_id, scheme_id, scheme_name, scheme_label, savings)
  SELECT v_order_id, s.scheme_id, s.scheme_name, s.scheme_label, s.savings
    FROM tmp_book_schemes s
   WHERE s.combinable OR s.scheme_id = v_best_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_gross,
    'scheme_savings', v_final_savings,
    'lines', v_count
  );
END;
$function$;