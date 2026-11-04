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
  v_nogst boolean;
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
  -- No GST number: make a Bill of supply (no tax), never block dispatch on GST.
  v_nogst := NULLIF(btrim(COALESCE(v_co.gstin,'')), '') IS NULL;
  SELECT * INTO v_dealer FROM distributors WHERE id = v_order.distributor_id AND company_id = v_company FOR UPDATE;
  IF v_dealer.id IS NULL THEN RAISE EXCEPTION 'Dealer not found in your workspace.'; END IF;

  IF NOT v_nogst AND EXISTS (
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
  IF v_nogst THEN
    v_pos := COALESCE(v_pos, '');
  ELSIF NULLIF(v_pos,'') IS NULL THEN
    RAISE EXCEPTION 'Add your business state in My Business before making a GST bill.';
  END IF;
  v_inter := (NOT v_nogst AND NULLIF(v_seller_state,'') IS NOT NULL
              AND NULLIF(v_pos,'') IS NOT NULL
              AND v_pos <> v_seller_state);

  SELECT COALESCE(SUM(gross_amount), 0) INTO v_gross_total FROM order_lines WHERE order_id = p_order_id;
  v_discount_total := LEAST(COALESCE(v_order.scheme_savings, 0), v_gross_total);
  SELECT COUNT(*), (COALESCE(SUM(discount_amount),0) = v_discount_total AND BOOL_AND(discount_amount <= COALESCE(gross_amount,0)))
    INTO v_nlines, v_use_line_disc
    FROM order_lines WHERE order_id = p_order_id;
  v_use_line_disc := COALESCE(v_use_line_disc, false) AND v_discount_total > 0;

  v_fy := public.fy_of(v_date);

  INSERT INTO document_sequences (company_id, doc_type, fy, prefix, next_seq)
  VALUES (v_company, CASE WHEN v_nogst THEN 'bill_of_supply' ELSE 'gst_invoice' END, v_fy, CASE WHEN v_nogst THEN 'BOS' ELSE COALESCE(NULLIF(v_co.invoice_prefix,''), 'INV') END, 2)
  ON CONFLICT (company_id, doc_type, fy)
  DO UPDATE SET next_seq = document_sequences.next_seq + 1, updated_at = now()
  RETURNING next_seq - 1 INTO v_seq;

  v_invoice_number := CASE WHEN v_nogst THEN 'BOS' ELSE COALESCE(NULLIF(v_co.invoice_prefix,''), 'INV') END || '/' || v_fy || '/' || LPAD(v_seq::text, GREATEST(4, length(v_seq::text)), '0');

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
    v_dealer.name, v_dealer.address, v_dealer.gstin, COALESCE(v_gstin_state, v_dealer.state_code, ''),
    v_co.name, v_co.address, v_co.gstin, v_co.pan, COALESCE(v_seller_state, v_co.state_code, ''),
    v_co.phone, v_co.email, v_co.bank_name, v_co.bank_account_name,
    v_co.bank_account, v_co.bank_ifsc, v_co.logo_url,
    CASE WHEN v_nogst THEN 'bill_of_supply' WHEN v_inter THEN 'inter_state' ELSE 'intra_state' END,
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
    v_rate := CASE WHEN v_nogst THEN 0 ELSE COALESCE(v_line.product_rate, v_co.default_gst_rate) END;

    IF v_use_line_disc THEN
      v_disc := v_line.discount_amount;
    ELSIF v_gross_total > 0 AND v_idx = v_nlines THEN
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
    'supply_type', CASE WHEN v_nogst THEN 'bill_of_supply' WHEN v_inter THEN 'inter_state' ELSE 'intra_state' END,
    'lines', v_idx
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.order_bill_equivalent(p_order_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH o AS (
    SELECT o.id, LEAST(COALESCE(o.scheme_savings,0), GREATEST(o.total,0)) AS sav, c.gst_price_basis AS basis, c.default_gst_rate AS def_rate,
           (NULLIF(btrim(COALESCE(c.gstin,'')),'') IS NULL) AS nogst
      FROM orders o JOIN companies c ON c.id = o.company_id
     WHERE o.id = p_order_id AND o.company_id = public.get_company_id()
  ), l AS (
    SELECT COALESCE(ol.gross_amount, ol.line_total) AS g, ol.discount_amount AS d,
           CASE WHEN o.nogst THEN 0 ELSE COALESCE(p.gst_rate, ol.gst_rate, o.def_rate, 0) END AS r, o.sav, o.basis
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