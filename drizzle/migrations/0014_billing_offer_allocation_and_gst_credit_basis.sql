CREATE OR REPLACE FUNCTION public.order_bill_equivalent(p_order_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH o AS (
    SELECT o.id, LEAST(COALESCE(o.scheme_savings,0), GREATEST(o.total,0)) AS sav, c.gst_price_basis AS basis, c.default_gst_rate AS def_rate
      FROM orders o JOIN companies c ON c.id = o.company_id
     WHERE o.id = p_order_id AND o.company_id = public.get_company_id()
  ), l AS (
    SELECT COALESCE(ol.gross_amount, ol.line_total) AS g, ol.discount_amount AS d,
           COALESCE(p.gst_rate, ol.gst_rate, o.def_rate, 0) AS r, o.sav, o.basis
      FROM order_lines ol JOIN o ON o.id = ol.order_id
      LEFT JOIN products p ON p.id = ol.product_id
  ), m AS (
    SELECT (SUM(d) = MAX(sav)) AS use_line, SUM(g) AS tot FROM l
  )
  SELECT COALESCE(ROUND(SUM(
           CASE WHEN l.basis = 'inclusive' THEN l.g - e.disc
                ELSE (l.g - e.disc) * (1 + l.r / 100) END), 0), 0)::numeric(14,2)
    FROM l CROSS JOIN m
    CROSS JOIN LATERAL (SELECT CASE WHEN m.use_line THEN l.d
                                    WHEN m.tot > 0 THEN l.sav * l.g / m.tot ELSE 0 END AS disc) e
$function$;
REVOKE ALL ON FUNCTION public.order_bill_equivalent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_bill_equivalent(uuid) TO authenticated, service_role;

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
    product_id uuid, quantity int, unit_price numeric(14,2), amount numeric(14,2), disc numeric(14,2) DEFAULT 0
  ) ON COMMIT DROP;
  DELETE FROM tmp_book_lines WHERE true;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = (v_line->>'product_id')::uuid AND company_id = v_company) THEN
      RAISE EXCEPTION 'Product not found in your workspace.';
    END IF;
    IF (v_line->>'quantity')::int <= 0 THEN RAISE EXCEPTION 'Quantity must be more than zero.'; END IF;
    IF (v_line->>'unit_price')::numeric < 0 THEN RAISE EXCEPTION 'Price cannot be negative.'; END IF;

    v_line_qty := (v_line->>'quantity')::int;
    v_line_price := (v_line->>'unit_price')::numeric;
    v_line_amount := ROUND(v_line_qty * v_line_price, 2);

    INSERT INTO tmp_book_lines VALUES ((v_line->>'product_id')::uuid, v_line_qty, v_line_price, v_line_amount, 0);

    v_gross := v_gross + v_line_amount;
    v_total_qty := v_total_qty + v_line_qty;
    v_count := v_count + 1;
  END LOOP;

  SELECT COALESCE(MAX(unit_price), 0) INTO v_top_price FROM tmp_book_lines;

  CREATE TEMP TABLE IF NOT EXISTS tmp_book_schemes (
    scheme_id uuid, scheme_name text, scheme_label text, savings numeric(14,2), combinable boolean, product_id uuid
  ) ON COMMIT DROP;
  DELETE FROM tmp_book_schemes WHERE true;

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

    INSERT INTO tmp_book_schemes VALUES (v_s.id, v_s.name, v_label, v_savings, v_s.is_combinable, v_s.product_id);

    IF v_s.is_combinable THEN
      v_stack_total := v_stack_total + v_savings;
    ELSIF v_savings > v_best_savings THEN
      v_best_savings := v_savings;
      v_best_id := v_s.id;
      v_best_name := v_s.name;
      v_best_label := v_label;
    END IF;
  END LOOP;

  -- Allocate each applied offer to the lines it belongs to: a product offer
  -- only to that product's lines, an order-wide offer across all lines.
  -- Residual paisa goes to the largest line of the group; each line's
  -- discount is capped at its own amount.
  FOR v_s IN
    SELECT * FROM tmp_book_schemes s WHERE s.combinable OR s.scheme_id = v_best_id
  LOOP
    WITH g AS (
      SELECT ctid AS rid, amount,
             SUM(amount) OVER () AS tot,
             ROW_NUMBER() OVER (ORDER BY amount DESC, product_id) AS rn
        FROM tmp_book_lines
       WHERE v_s.product_id IS NULL OR product_id = v_s.product_id
    ), a AS (
      SELECT rid, rn, CASE WHEN tot > 0 THEN ROUND(v_s.savings * amount / tot, 2) ELSE 0 END AS share
        FROM g
    ), r AS (
      SELECT rid, share + CASE WHEN rn = 1 THEN v_s.savings - (SELECT SUM(share) FROM a) ELSE 0 END AS share
        FROM a
    )
    UPDATE tmp_book_lines t SET disc = t.disc + r.share FROM r WHERE t.ctid = r.rid;
  END LOOP;
  UPDATE tmp_book_lines SET disc = LEAST(GREATEST(disc, 0), amount) WHERE true;
  SELECT COALESCE(SUM(disc), 0) INTO v_final_savings FROM tmp_book_lines;

  v_ceiling := CASE
    WHEN v_credit_mode = 'cash_only' THEN 0
    WHEN v_credit_mode = 'limited' THEN GREATEST(v_credit_limit, 0)
    ELSE NULL
  END;
  IF v_ceiling IS NOT NULL THEN
    -- Unclamped balance so advances count in the dealer's favour.
    v_outstanding :=
        COALESCE((SELECT SUM(i.grand_total) FROM invoices i JOIN orders o ON o.id = i.source_order_id
                   WHERE o.distributor_id = p_distributor_id AND i.doc_type = 'gst_invoice'), 0)
      - COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
                   WHERE ip.distributor_id = p_distributor_id AND ip.status = 'posted'), 0)
      - COALESCE((SELECT SUM(cn.grand_total) FROM credit_notes cn WHERE cn.distributor_id = p_distributor_id), 0);
    -- Compare on the same GST-inclusive basis the bill will use.
    SELECT ROUND(COALESCE(SUM(CASE WHEN c.gst_price_basis = 'inclusive' THEN t.amount - t.disc
                  ELSE (t.amount - t.disc) * (1 + COALESCE(p.gst_rate, c.default_gst_rate, 0) / 100) END), 0), 0)
      INTO v_savings
      FROM tmp_book_lines t LEFT JOIN products p ON p.id = t.product_id
      CROSS JOIN companies c WHERE c.id = v_company;
    IF ROUND(v_outstanding + v_savings, 2) > v_ceiling
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

  INSERT INTO order_lines (
    order_id, product_id, product_name, quantity, unit_price, line_total,
    booked_quantity, gross_amount, gst_rate, discount_amount
  )
  SELECT v_order_id, t.product_id, COALESCE(p.name, ''), t.quantity, t.unit_price, t.amount, t.quantity, t.amount, p.gst_rate, t.disc
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

CREATE OR REPLACE FUNCTION public.dispatch_and_bill_order_atomic(p_order_id uuid, p_godown_id uuid DEFAULT NULL::uuid, p_dispatch_date date DEFAULT NULL::date, p_vehicle text DEFAULT NULL::text, p_driver_name text DEFAULT NULL::text, p_dispatch_remarks text DEFAULT NULL::text, p_override_credit boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE;
  v_co companies%ROWTYPE;
  v_dealer distributors%ROWTYPE;
  v_godown uuid;
  v_existing uuid;
  v_inter boolean;
  v_gross_total numeric(14,2) := 0;
  v_discount_total numeric(14,2) := 0;
  v_use_line_disc boolean := false;
  v_nlines int := 0;
  v_alloc numeric(14,2) := 0;
  v_subtotal numeric(14,2) := 0;
  v_cgst numeric(14,2) := 0;
  v_sgst numeric(14,2) := 0;
  v_igst numeric(14,2) := 0;
  v_grand numeric(14,2);
  v_rounded numeric(14,2);
  v_roundoff numeric(14,2);
  v_seq int;
  v_fy text;
  v_invoice_number text;
  v_invoice_id uuid;
  v_date date;
  v_line RECORD;
  v_disc numeric(14,2);
  v_taxable numeric(14,2);
  v_rate numeric(5,2);
  v_lc numeric(14,2); v_ls numeric(14,2); v_li numeric(14,2);
  v_outstanding numeric(14,2);
  v_idx int := 0;
  v_last_id uuid;
  v_pos text;
  v_seller_state text;
  v_gstin_state text;
  v_already_out boolean;
  v_skip_stock boolean;
  v_short text;
  v_credit_mode text;
  v_ceiling numeric(14,2);
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'You do not have permission to dispatch orders.';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.company_id <> v_company THEN
    RAISE EXCEPTION 'Order not found in your workspace.';
  END IF;

  SELECT id INTO v_existing FROM invoices
   WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice';
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_done', true, 'invoice_id', v_existing);
  END IF;

  IF v_order.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order was cancelled.';
  END IF;

  v_already_out := v_order.delivery_status <> 'pending';
  v_skip_stock := v_already_out
    AND EXISTS (SELECT 1 FROM stock_deductions sd WHERE sd.order_id = p_order_id);

  v_date := COALESCE(p_dispatch_date, CASE WHEN v_already_out THEN v_order.dispatch_date END,
                     (now() AT TIME ZONE 'Asia/Kolkata')::date);

  v_godown := COALESCE(p_godown_id, v_order.godown_id);
  IF v_godown IS NULL THEN
    RAISE EXCEPTION 'Choose the warehouse the goods leave from.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM godowns WHERE id = v_godown AND company_id = v_company) THEN
    RAISE EXCEPTION 'Warehouse not found in your workspace.';
  END IF;

  SELECT * INTO v_co FROM companies WHERE id = v_company;
  SELECT * INTO v_dealer FROM distributors WHERE id = v_order.distributor_id AND company_id = v_company FOR UPDATE;
  IF v_dealer.id IS NULL THEN RAISE EXCEPTION 'Dealer not found in your workspace.'; END IF;

  IF EXISTS (
    SELECT 1 FROM order_lines ol JOIN products p ON p.id = ol.product_id
    WHERE ol.order_id = p_order_id AND (p.gst_rate IS NULL OR NOT p.gst_rate_confirmed)
  ) THEN
    RAISE EXCEPTION 'Confirm the GST rate on every product in this order before billing.';
  END IF;

  IF NOT v_skip_stock THEN
    PERFORM 1 FROM stock_items si
     WHERE si.company_id = v_company AND si.godown_id = v_godown
       AND si.product_id IN (SELECT product_id FROM order_lines WHERE order_id = p_order_id)
     ORDER BY si.product_id
     FOR UPDATE;

    SELECT string_agg(x.pname || ' (need ' || x.need || ', have ' || x.have || ')', ', ' ORDER BY x.pname)
      INTO v_short
      FROM (
        SELECT p.name AS pname,
               SUM(ol.quantity)::int AS need,
               COALESCE(MAX(si.quantity), 0)::int AS have
          FROM order_lines ol
          JOIN products p ON p.id = ol.product_id
          LEFT JOIN stock_items si
            ON si.product_id = ol.product_id AND si.godown_id = v_godown AND si.company_id = v_company
         WHERE ol.order_id = p_order_id
         GROUP BY p.id, p.name
        HAVING SUM(ol.quantity) > COALESCE(MAX(si.quantity), 0)
      ) x;

    IF v_short IS NOT NULL THEN
      RAISE EXCEPTION 'Not enough stock in this warehouse: %. Add stock or dispatch from a warehouse that has it.', v_short;
    END IF;
  END IF;

  v_seller_state := COALESCE(public.state_code_of_gstin(v_co.gstin), NULLIF(v_co.state_code, ''));
  v_gstin_state := public.state_code_of_gstin(v_dealer.gstin);

  IF v_gstin_state IS NOT NULL
     AND NULLIF(v_dealer.state_code, '') IS NOT NULL
     AND v_gstin_state <> v_dealer.state_code THEN
    RAISE EXCEPTION 'GSTIN of % starts with state %, but their state code says %. Fix the dealer before billing.',
      v_dealer.name, v_gstin_state, v_dealer.state_code;
  END IF;

  v_pos := COALESCE(v_gstin_state, NULLIF(v_dealer.state_code, ''), v_seller_state);
  v_inter := (NULLIF(v_seller_state,'') IS NOT NULL
              AND NULLIF(v_pos,'') IS NOT NULL
              AND v_pos <> v_seller_state);

  SELECT COALESCE(SUM(gross_amount), 0) INTO v_gross_total FROM order_lines WHERE order_id = p_order_id;
  v_discount_total := LEAST(COALESCE(v_order.scheme_savings, 0), v_gross_total);
  -- Use per-line discounts saved at booking when they add up to the order's
  -- savings (product offers stay on their product); older orders spread by value.
  SELECT COUNT(*), (COALESCE(SUM(discount_amount),0) = v_discount_total AND BOOL_AND(discount_amount <= COALESCE(gross_amount,0)))
    INTO v_nlines, v_use_line_disc
    FROM order_lines WHERE order_id = p_order_id;
  v_use_line_disc := COALESCE(v_use_line_disc, false) AND v_discount_total > 0;

  v_fy := public.fy_of(v_date);

  INSERT INTO document_sequences (company_id, doc_type, fy, prefix, next_seq)
  VALUES (v_company, 'gst_invoice', v_fy, COALESCE(NULLIF(v_co.invoice_prefix,''), 'INV'), 2)
  ON CONFLICT (company_id, doc_type, fy)
  DO UPDATE SET next_seq = document_sequences.next_seq + 1, updated_at = now()
  RETURNING next_seq - 1 INTO v_seq;

  v_invoice_number := COALESCE(NULLIF(v_co.invoice_prefix,''), 'INV') || '/' || v_fy || '/' || LPAD(v_seq::text, 4, '0');

  INSERT INTO invoices (
    company_id, doc_type, invoice_number, invoice_date, source_order_id,
    buyer_name, buyer_address, buyer_gstin, buyer_state_code,
    seller_name, seller_address, seller_gstin, seller_pan, seller_state_code,
    seller_phone, seller_email, seller_bank_name, seller_bank_account_name,
    seller_bank_account, seller_bank_ifsc, seller_logo_url,
    supply_type, gst_rate, subtotal, cgst_amount, sgst_amount, igst_amount,
    total_tax, grand_total, round_off, amount_in_words, notes, status,
    vehicle, driver_name, posted_by, posted_at, fy, place_of_supply_state_code
  ) VALUES (
    v_company, 'gst_invoice', v_invoice_number, v_date, p_order_id,
    v_dealer.name, v_dealer.address, v_dealer.gstin, COALESCE(v_gstin_state, v_dealer.state_code),
    v_co.name, v_co.address, v_co.gstin, v_co.pan, COALESCE(v_seller_state, v_co.state_code),
    v_co.phone, v_co.email, v_co.bank_name, v_co.bank_account_name,
    v_co.bank_account, v_co.bank_ifsc, v_co.logo_url,
    CASE WHEN v_inter THEN 'inter_state' ELSE 'intra_state' END,
    0, 0, 0, 0, 0, 0, 0, 0, '', COALESCE(p_dispatch_remarks,''), 'final',
    COALESCE(NULLIF(p_vehicle,''), v_order.vehicle, ''),
    COALESCE(NULLIF(p_driver_name,''), v_order.driver_name, ''),
    auth.uid(), now(), v_fy, v_pos
  ) RETURNING id INTO v_invoice_id;

  FOR v_line IN
    SELECT ol.*, p.hsn_code, p.unit, p.gst_rate AS product_rate
    FROM order_lines ol JOIN products p ON p.id = ol.product_id
    WHERE ol.order_id = p_order_id
    ORDER BY ol.product_id
  LOOP
    v_idx := v_idx + 1;
    v_rate := COALESCE(v_line.product_rate, v_co.default_gst_rate);

    IF v_use_line_disc THEN
      v_disc := v_line.discount_amount;
    ELSIF v_gross_total > 0 AND v_idx = v_nlines THEN
      -- last line takes the residual BEFORE tax, so taxable and tax stay consistent
      v_disc := LEAST(v_discount_total - v_alloc, v_line.gross_amount);
    ELSIF v_gross_total > 0 THEN
      v_disc := ROUND(v_discount_total * (v_line.gross_amount / v_gross_total), 2);
    ELSE
      v_disc := 0;
    END IF;
    v_alloc := v_alloc + v_disc;

    v_taxable := v_line.gross_amount - v_disc;
    IF v_co.gst_price_basis = 'inclusive' THEN
      v_taxable := ROUND(v_taxable / (1 + v_rate / 100), 2);
    END IF;

    IF v_inter THEN
      v_li := ROUND(v_taxable * v_rate / 100, 2); v_lc := 0; v_ls := 0;
    ELSE
      v_lc := ROUND(v_taxable * v_rate / 200, 2); v_ls := v_lc; v_li := 0;
    END IF;

    INSERT INTO invoice_lines (
      invoice_id, product_id, product_name, hsn_code, quantity, unit, unit_price,
      taxable_value, gross_amount, discount_amount, gst_rate,
      cgst_amount, sgst_amount, igst_amount, line_total
    ) VALUES (
      v_invoice_id, v_line.product_id, v_line.product_name, COALESCE(v_line.hsn_code,''),
      v_line.quantity, COALESCE(v_line.unit,''), v_line.unit_price,
      v_taxable, v_line.gross_amount, v_disc, v_rate,
      v_lc, v_ls, v_li, v_taxable + v_lc + v_ls + v_li
    ) RETURNING id INTO v_last_id;

    UPDATE order_lines SET
      loaded_quantity = COALESCE(loaded_quantity, quantity),
      discount_amount = v_disc,
      taxable_amount  = v_taxable,
      gst_rate        = v_rate,
      cgst_amount     = v_lc,
      sgst_amount     = v_ls,
      igst_amount     = v_li
    WHERE id = v_line.id;

    v_subtotal := v_subtotal + v_taxable;
    v_cgst := v_cgst + v_lc;
    v_sgst := v_sgst + v_ls;
    v_igst := v_igst + v_li;

    IF NOT v_skip_stock THEN
      INSERT INTO stock_movements (
        company_id, product_id, godown_id, delta, movement_type,
        source_doc_type, source_doc_id, idempotency_key, actor
      ) VALUES (
        v_company, v_line.product_id, v_godown, -v_line.quantity, 'dispatch',
        'order', p_order_id, 'dispatch:' || p_order_id::text || ':' || v_line.product_id::text, auth.uid()
      );

      UPDATE stock_items
         SET quantity = quantity - v_line.quantity,
             last_deducted_date = v_date,
             updated_at = now()
       WHERE company_id = v_company
         AND product_id = v_line.product_id
         AND godown_id = v_godown;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'This product is not stocked in the chosen warehouse.';
      END IF;

      INSERT INTO stock_deductions (
        company_id, order_id, product_id, godown_id, quantity_deducted, date, source
      ) VALUES (
        v_company, p_order_id, v_line.product_id, v_godown, v_line.quantity, v_date, 'auto_dispatch'
      );
    END IF;
  END LOOP;

  v_grand := v_subtotal + v_cgst + v_sgst + v_igst;
  v_rounded := ROUND(v_grand, 0);
  v_roundoff := v_rounded - v_grand;

  v_credit_mode := COALESCE(NULLIF(v_dealer.credit_mode, ''), 'unlimited');

  IF v_credit_mode <> 'unlimited' THEN
    SELECT COALESCE(SUM(i.grand_total), 0)
         - COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
                     WHERE ip.distributor_id = v_dealer.id AND ip.status = 'posted'), 0)
         - COALESCE((SELECT SUM(cn.grand_total) FROM credit_notes cn
                     WHERE cn.distributor_id = v_dealer.id), 0)
      INTO v_outstanding
      FROM invoices i JOIN orders o ON o.id = i.source_order_id
     WHERE o.distributor_id = v_dealer.id AND i.doc_type = 'gst_invoice';

    v_ceiling := CASE WHEN v_credit_mode = 'cash_only' THEN 0 ELSE COALESCE(v_dealer.credit_limit, 0) END;

    IF (v_outstanding + v_rounded) > v_ceiling THEN
      IF NOT (p_override_credit AND public.has_capability(auth.uid(), 'override_credit_limit'::capability_key)) THEN
        IF v_credit_mode = 'cash_only' THEN
          RAISE EXCEPTION '% is set to no credit. Collect payment first, or ask someone who can approve an override.', v_dealer.name;
        ELSE
          RAISE EXCEPTION 'This bill would take % past their credit limit. Ask someone who can approve an override.', v_dealer.name;
        END IF;
      END IF;
    END IF;
  END IF;

  UPDATE invoices SET
    subtotal = v_subtotal, cgst_amount = v_cgst, sgst_amount = v_sgst, igst_amount = v_igst,
    total_tax = v_cgst + v_sgst + v_igst, round_off = v_roundoff, grand_total = v_rounded,
    amount_in_words = public.amount_in_words_inr(v_rounded),
    gst_rate = CASE WHEN v_subtotal > 0 THEN ROUND((v_cgst + v_sgst + v_igst) * 100 / v_subtotal, 2) ELSE 0 END
  WHERE id = v_invoice_id;

  UPDATE orders SET
    delivery_status  = CASE WHEN v_already_out THEN delivery_status ELSE 'dispatched'::delivery_status END,
    dispatch_date    = COALESCE(dispatch_date, v_date),
    godown_id        = COALESCE(godown_id, v_godown),
    vehicle          = COALESCE(NULLIF(p_vehicle,''), vehicle),
    driver_name      = COALESCE(NULLIF(p_driver_name,''), driver_name),
    dispatch_remarks = COALESCE(NULLIF(p_dispatch_remarks,''), dispatch_remarks)
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'grand_total', v_rounded,
    'bill_only', v_already_out,
    'supply_type', CASE WHEN v_inter THEN 'inter_state' ELSE 'intra_state' END,
    'lines', v_idx
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_order_payment_atomic(p_order_id uuid, p_amount numeric, p_mode payment_mode, p_paid_on date DEFAULT NULL::date, p_reference text DEFAULT ''::text, p_note text DEFAULT ''::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE;
  v_inv uuid;
  v_paid numeric(14,2);
  v_due numeric(14,2);
  v_amount numeric(14,2) := ROUND(COALESCE(p_amount,0), 2);
  v_id uuid;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to record a payment.';
  END IF;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Enter the amount received.'; END IF;
  IF COALESCE(p_paid_on, CURRENT_DATE) > CURRENT_DATE THEN
    RAISE EXCEPTION 'A payment cannot be dated in the future.';
  END IF;

  SELECT * INTO v_order FROM orders
   WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found in your workspace.'; END IF;
  IF v_order.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'This order was cancelled.'; END IF;

  SELECT id INTO v_inv FROM invoices
   WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice';
  IF v_inv IS NOT NULL THEN
    RETURN public.record_invoice_payment_atomic(
      v_inv, v_amount, p_mode, p_paid_on, p_reference, p_note, p_idempotency_key);
  END IF;

  SELECT COALESCE(SUM(amount),0) INTO v_paid
    FROM invoice_payments WHERE order_id = p_order_id AND status = 'posted';

  -- Advance can cover the full bill (GST included), not just the pre-GST value.
  v_due := ROUND(public.order_bill_equivalent(p_order_id) - v_paid, 2);
  IF v_due <= 0 THEN RAISE EXCEPTION 'This order is already paid in full.'; END IF;
  IF v_amount > v_due THEN
    RAISE EXCEPTION 'That is more than the % still due on this order.', TO_CHAR(v_due, 'FM999,999,990.00');
  END IF;

  INSERT INTO invoice_payments (
    company_id, invoice_id, order_id, distributor_id, amount, mode, paid_on,
    reference, note, status, idempotency_key, posted_by, posted_at
  ) VALUES (
    v_company, NULL, p_order_id, v_order.distributor_id, v_amount, p_mode,
    COALESCE(p_paid_on, CURRENT_DATE), COALESCE(p_reference,''), COALESCE(p_note,''),
    'posted', NULLIF(COALESCE(p_idempotency_key,''),''), auth.uid(), now()
  ) RETURNING id INTO v_id;

  UPDATE orders
     SET payment_status = CASE WHEN ROUND(v_due - v_amount, 2) <= 0 THEN 'paid'::payment_status
                               ELSE 'partial'::payment_status END,
         payment_mode = p_mode,
         updated_at = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_id, 'order_id', p_order_id,
                            'amount', v_amount, 'balance_due', ROUND(v_due - v_amount, 2));
END;
$function$;