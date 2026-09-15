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
  v_line jsonb;
  v_count int := 0;
  v_scheme jsonb;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'place_orders'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to place orders.';
  END IF;

  SELECT name INTO v_dealer_name FROM distributors WHERE id = p_distributor_id AND company_id = v_company;
  IF v_dealer_name IS NULL THEN RAISE EXCEPTION 'Dealer not found in your workspace.'; END IF;

  SELECT name INTO v_sp_name FROM salespersons WHERE id = p_salesperson_id AND company_id = v_company;
  IF v_sp_name IS NULL THEN RAISE EXCEPTION 'Sales person not found in your workspace.'; END IF;

  IF p_godown_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM godowns WHERE id = p_godown_id AND company_id = v_company
  ) THEN RAISE EXCEPTION 'Warehouse not found in your workspace.'; END IF;

  IF jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Add at least one product to the order.';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = (v_line->>'product_id')::uuid AND company_id = v_company) THEN
      RAISE EXCEPTION 'Product not found in your workspace.';
    END IF;
    IF (v_line->>'quantity')::int <= 0 THEN RAISE EXCEPTION 'Quantity must be more than zero.'; END IF;
    IF (v_line->>'unit_price')::numeric < 0 THEN RAISE EXCEPTION 'Price cannot be negative.'; END IF;
    v_gross := v_gross + ROUND((v_line->>'quantity')::numeric * (v_line->>'unit_price')::numeric, 2);
    v_count := v_count + 1;
  END LOOP;

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
    'pending'::delivery_status, p_godown_id, COALESCE(p_scheme_savings, 0), COALESCE(p_remarks, ''), now()
  ) RETURNING id INTO v_order_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    INSERT INTO order_lines (
      order_id, product_id, product_name, quantity, unit_price, line_total,
      booked_quantity, gross_amount
    ) VALUES (
      v_order_id,
      (v_line->>'product_id')::uuid,
      COALESCE(v_line->>'product_name', ''),
      (v_line->>'quantity')::int,
      (v_line->>'unit_price')::numeric,
      ROUND((v_line->>'quantity')::numeric * (v_line->>'unit_price')::numeric, 2),
      (v_line->>'quantity')::int,
      ROUND((v_line->>'quantity')::numeric * (v_line->>'unit_price')::numeric, 2)
    );
  END LOOP;

  IF jsonb_typeof(p_applied_schemes) = 'array' THEN
    FOR v_scheme IN SELECT * FROM jsonb_array_elements(p_applied_schemes) LOOP
      INSERT INTO order_schemes (order_id, scheme_id, scheme_name, scheme_label, savings)
      VALUES (
        v_order_id,
        NULLIF(v_scheme->>'scheme_id', '')::uuid,
        COALESCE(v_scheme->>'scheme_name', ''),
        COALESCE(v_scheme->>'scheme_label', ''),
        COALESCE((v_scheme->>'savings')::numeric, 0)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total', v_gross, 'lines', v_count);
END;
$function$;