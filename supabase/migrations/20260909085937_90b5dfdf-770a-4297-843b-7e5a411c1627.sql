-- ===================== Phase 2: atomic Book + Dispatch & bill =====================

CREATE OR REPLACE FUNCTION public.fy_of(p_date date)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN EXTRACT(MONTH FROM p_date) >= 4
    THEN EXTRACT(YEAR FROM p_date)::text || '-' || LPAD(((EXTRACT(YEAR FROM p_date)::int + 1) % 100)::text, 2, '0')
    ELSE (EXTRACT(YEAR FROM p_date)::int - 1)::text || '-' || LPAD((EXTRACT(YEAR FROM p_date)::int % 100)::text, 2, '0')
  END;
$$;

-- ---------------------------------------------------------------- BOOK ORDER
CREATE OR REPLACE FUNCTION public.book_order_atomic(
  p_date date,
  p_distributor_id uuid,
  p_salesperson_id uuid,
  p_lines jsonb,
  p_godown_id uuid DEFAULT NULL,
  p_applied_schemes jsonb DEFAULT '[]'::jsonb,
  p_scheme_savings numeric DEFAULT 0,
  p_remarks text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
      RAISE EXCEPTION 'One of the products is not in your workspace.';
    END IF;
    IF COALESCE((v_line->>'quantity')::int, 0) <= 0 THEN
      RAISE EXCEPTION 'Every product needs a quantity above zero.';
    END IF;
    IF COALESCE((v_line->>'unit_price')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Every product needs a price above zero.';
    END IF;
    v_count := v_count + 1;
    v_gross := v_gross + ROUND((v_line->>'quantity')::numeric * (v_line->>'unit_price')::numeric, 2);
  END LOOP;

  UPDATE companies SET next_order_sequence = next_order_sequence + 1
  WHERE id = v_company
  RETURNING order_prefix, next_order_sequence - 1 INTO v_prefix, v_seq;

  v_order_number := v_prefix || '-' || EXTRACT(YEAR FROM p_date)::text || '-' || LPAD(v_seq::text, 4, '0');

  INSERT INTO orders (
    company_id, order_number, date, distributor_id, distributor_name,
    salesperson_id, salesperson_name, total, payment_mode, payment_status,
    delivery_status, godown_id, scheme_savings, dispatch_remarks, booked_at
  ) VALUES (
    v_company, v_order_number, p_date, p_distributor_id, v_dealer_name,
    p_salesperson_id, v_sp_name, GREATEST(v_gross - COALESCE(p_scheme_savings, 0), 0),
    'cash'::payment_mode, 'pending'::payment_status,
    'pending'::delivery_status, p_godown_id, COALESCE(p_scheme_savings, 0), COALESCE(p_remarks, ''), now()
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_lines (
    order_id, product_id, product_name, quantity, unit_price, line_total,
    booked_quantity, gross_amount, taxable_amount, gst_rate, price_basis
  )
  SELECT
    v_order_id,
    (l->>'product_id')::uuid,
    p.name,
    (l->>'quantity')::int,
    (l->>'unit_price')::numeric,
    ROUND((l->>'quantity')::numeric * (l->>'unit_price')::numeric, 2),
    (l->>'quantity')::int,
    ROUND((l->>'quantity')::numeric * (l->>'unit_price')::numeric, 2),
    ROUND((l->>'quantity')::numeric * (l->>'unit_price')::numeric, 2),
    p.gst_rate,
    c.gst_price_basis
  FROM jsonb_array_elements(p_lines) l
  JOIN products p ON p.id = (l->>'product_id')::uuid
  JOIN companies c ON c.id = v_company;

  IF jsonb_typeof(p_applied_schemes) = 'array' AND jsonb_array_length(p_applied_schemes) > 0 THEN
    INSERT INTO order_schemes (order_id, scheme_id, scheme_name, scheme_label, savings)
    SELECT v_order_id,
           NULLIF(s->>'scheme_id','')::uuid,
           COALESCE(s->>'scheme_name',''),
           COALESCE(s->>'scheme_label',''),
           COALESCE((s->>'savings')::numeric, 0)
    FROM jsonb_array_elements(p_applied_schemes) s;
  END IF;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'order_number', v_order_number, 'seq', v_seq);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.book_order_atomic(date,uuid,uuid,jsonb,uuid,jsonb,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_order_atomic(date,uuid,uuid,jsonb,uuid,jsonb,numeric,text) TO authenticated;

-- ------------------------------------------------------- DISPATCH AND BILL
CREATE OR REPLACE FUNCTION public.dispatch_and_bill_order_atomic(
  p_order_id uuid,
  p_godown_id uuid DEFAULT NULL,
  p_dispatch_date date DEFAULT NULL,
  p_vehicle text DEFAULT '',
  p_driver_name text DEFAULT '',
  p_dispatch_remarks text DEFAULT '',
  p_override_credit boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  v_date date := COALESCE(p_dispatch_date, CURRENT_DATE);
  v_line RECORD;
  v_disc numeric(14,2);
  v_taxable numeric(14,2);
  v_rate numeric(5,2);
  v_lc numeric(14,2); v_ls numeric(14,2); v_li numeric(14,2);
  v_outstanding numeric(14,2);
  v_idx int := 0;
  v_last_id uuid;
  v_pos text;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'You do not have permission to dispatch orders.';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.company_id <> v_company THEN
    RAISE EXCEPTION 'Order not found in your workspace.';
  END IF;

  -- Idempotent: already billed
  SELECT id INTO v_existing FROM invoices
   WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice';
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_done', true, 'invoice_id', v_existing);
  END IF;

  IF v_order.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order was cancelled.';
  END IF;
  IF v_order.delivery_status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been dispatched.';
  END IF;

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

  -- Deterministic lock order on stock
  PERFORM 1 FROM stock_items si
   WHERE si.company_id = v_company AND si.godown_id = v_godown
     AND si.product_id IN (SELECT product_id FROM order_lines WHERE order_id = p_order_id)
   ORDER BY si.product_id
   FOR UPDATE;

  v_pos := COALESCE(NULLIF(v_dealer.state_code, ''), v_co.state_code);
  v_inter := (NULLIF(v_co.state_code,'') IS NOT NULL
              AND NULLIF(v_pos,'') IS NOT NULL
              AND v_pos <> v_co.state_code);

  SELECT COALESCE(SUM(gross_amount), 0) INTO v_gross_total FROM order_lines WHERE order_id = p_order_id;
  v_discount_total := LEAST(COALESCE(v_order.scheme_savings, 0), v_gross_total);

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
    v_dealer.name, v_dealer.address, v_dealer.gstin, v_dealer.state_code,
    v_co.name, v_co.address, v_co.gstin, v_co.pan, v_co.state_code,
    v_co.phone, v_co.email, v_co.bank_name, v_co.bank_account_name,
    v_co.bank_account, v_co.bank_ifsc, v_co.logo_url,
    CASE WHEN v_inter THEN 'inter_state' ELSE 'intra_state' END,
    0, 0, 0, 0, 0, 0, 0, 0, '', COALESCE(p_dispatch_remarks,''), 'final',
    COALESCE(p_vehicle,''), COALESCE(p_driver_name,''), auth.uid(), now(), v_fy, v_pos
  ) RETURNING id INTO v_invoice_id;

  FOR v_line IN
    SELECT ol.*, p.hsn_code, p.unit, p.gst_rate AS product_rate
    FROM order_lines ol JOIN products p ON p.id = ol.product_id
    WHERE ol.order_id = p_order_id
    ORDER BY ol.product_id
  LOOP
    v_idx := v_idx + 1;
    v_rate := COALESCE(v_line.product_rate, v_co.default_gst_rate);

    IF v_gross_total > 0 THEN
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

    -- Stock out
    INSERT INTO stock_movements (
      company_id, product_id, godown_id, delta, movement_type,
      source_doc_type, source_doc_id, idempotency_key, actor
    ) VALUES (
      v_company, v_line.product_id, v_godown, -v_line.quantity, 'dispatch',
      'order', p_order_id, 'dispatch:' || p_order_id::text || ':' || v_line.product_id::text, auth.uid()
    );

    INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold, last_deducted_date)
    VALUES (v_company, v_line.product_id, v_godown, -v_line.quantity, 0, v_date)
    ON CONFLICT (company_id, product_id, godown_id)
    DO UPDATE SET quantity = stock_items.quantity - v_line.quantity,
                  last_deducted_date = v_date,
                  updated_at = now();

    INSERT INTO stock_deductions (
      company_id, order_id, product_id, godown_id, quantity_deducted, date, source
    ) VALUES (
      v_company, p_order_id, v_line.product_id, v_godown, v_line.quantity, v_date, 'auto_dispatch'
    );
  END LOOP;

  -- Push any rounding remainder of the discount onto the last line
  IF v_alloc <> v_discount_total AND v_last_id IS NOT NULL THEN
    UPDATE invoice_lines
       SET discount_amount = discount_amount + (v_discount_total - v_alloc)
     WHERE id = v_last_id;
  END IF;

  v_grand := v_subtotal + v_cgst + v_sgst + v_igst;
  v_rounded := ROUND(v_grand, 0);
  v_roundoff := v_rounded - v_grand;

  -- Credit limit check against the canonical balance
  IF COALESCE(v_dealer.credit_limit, 0) > 0 THEN
    SELECT COALESCE(SUM(i.grand_total), 0)
         - COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
                      JOIN invoices i2 ON i2.id = ip.invoice_id
                      JOIN orders o2 ON o2.id = i2.source_order_id
                     WHERE o2.distributor_id = v_dealer.id AND ip.status = 'posted'), 0)
         - COALESCE((SELECT SUM(cn.grand_total) FROM credit_notes cn
                     WHERE cn.distributor_id = v_dealer.id), 0)
      INTO v_outstanding
      FROM invoices i JOIN orders o ON o.id = i.source_order_id
     WHERE o.distributor_id = v_dealer.id AND i.doc_type = 'gst_invoice';

    IF (v_outstanding + v_rounded) > v_dealer.credit_limit THEN
      IF NOT (p_override_credit AND public.has_capability(auth.uid(), 'override_credit_limit'::capability_key)) THEN
        RAISE EXCEPTION 'This bill would take % past their credit limit. Ask someone who can approve an override.', v_dealer.name;
      END IF;
    END IF;
  END IF;

  UPDATE invoices SET
    subtotal = v_subtotal, cgst_amount = v_cgst, sgst_amount = v_sgst, igst_amount = v_igst,
    total_tax = v_cgst + v_sgst + v_igst, round_off = v_roundoff, grand_total = v_rounded,
    gst_rate = CASE WHEN v_subtotal > 0 THEN ROUND((v_cgst + v_sgst + v_igst) * 100 / v_subtotal, 2) ELSE 0 END
  WHERE id = v_invoice_id;

  UPDATE orders SET
    delivery_status  = 'dispatched',
    dispatch_date    = v_date,
    godown_id        = v_godown,
    vehicle          = COALESCE(NULLIF(p_vehicle,''), vehicle),
    driver_name      = COALESCE(NULLIF(p_driver_name,''), driver_name),
    dispatch_remarks = COALESCE(NULLIF(p_dispatch_remarks,''), dispatch_remarks)
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'grand_total', v_rounded,
    'supply_type', CASE WHEN v_inter THEN 'inter_state' ELSE 'intra_state' END,
    'lines', v_idx
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_and_bill_order_atomic(uuid,uuid,date,text,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_and_bill_order_atomic(uuid,uuid,date,text,text,text,boolean) TO authenticated;

-- ------------------------------------------------------------- CANCEL ORDER
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(p_order_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'You do not have permission to cancel orders.';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.company_id <> v_company THEN
    RAISE EXCEPTION 'Order not found in your workspace.';
  END IF;
  IF v_order.cancelled_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_done', true);
  END IF;
  IF v_order.delivery_status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been dispatched, so it cannot be cancelled. Record a return instead.';
  END IF;

  UPDATE orders SET cancelled_at = now(), cancelled_by = auth.uid(),
                    cancel_reason = COALESCE(p_reason, '')
  WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order_atomic(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(uuid,text) TO authenticated;
