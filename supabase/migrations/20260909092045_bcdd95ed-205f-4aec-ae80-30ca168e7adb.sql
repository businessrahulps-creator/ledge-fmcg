-- ============ Phase 4: returns and credit notes ============

CREATE OR REPLACE FUNCTION public.record_return_and_credit_atomic(
  p_order_id uuid,
  p_lines jsonb,
  p_reason text DEFAULT '',
  p_godown_id uuid DEFAULT NULL,
  p_note_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE;
  v_inv invoices%ROWTYPE;
  v_dealer distributors%ROWTYPE;
  v_co companies%ROWTYPE;
  v_godown uuid;
  v_date date := COALESCE(p_note_date, CURRENT_DATE);
  v_fy text;
  v_seq int;
  v_cn_number text;
  v_cn_id uuid;
  v_claim_id uuid;
  v_in RECORD;
  v_il invoice_lines%ROWTYPE;
  v_already int;
  v_qty int;
  v_good int;
  v_dmg int;
  v_unit_taxable numeric(14,4);
  v_taxable numeric(14,2);
  v_rate numeric(5,2);
  v_lc numeric(14,2); v_ls numeric(14,2); v_li numeric(14,2);
  v_subtotal numeric(14,2) := 0;
  v_cgst numeric(14,2) := 0;
  v_sgst numeric(14,2) := 0;
  v_igst numeric(14,2) := 0;
  v_grand numeric(14,2);
  v_rounded numeric(14,2);
  v_roundoff numeric(14,2);
  v_claim_value numeric(14,2) := 0;
  v_restocked boolean := false;
  v_count int := 0;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'You do not have permission to record returns.';
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Add at least one product to the return.';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.company_id <> v_company THEN
    RAISE EXCEPTION 'Order not found in your workspace.';
  END IF;
  IF v_order.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order was cancelled.';
  END IF;
  IF v_order.delivery_status = 'pending' THEN
    RAISE EXCEPTION 'Dispatch and bill this order before recording a return.';
  END IF;

  SELECT * INTO v_inv FROM invoices
   WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice' AND company_id = v_company
   FOR UPDATE;
  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'No final bill found for this order.';
  END IF;

  SELECT * INTO v_co FROM companies WHERE id = v_company;
  SELECT * INTO v_dealer FROM distributors WHERE id = v_order.distributor_id AND company_id = v_company FOR UPDATE;
  IF v_dealer.id IS NULL THEN RAISE EXCEPTION 'Dealer not found in your workspace.'; END IF;

  v_godown := COALESCE(p_godown_id, v_order.godown_id);
  IF v_godown IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM godowns WHERE id = v_godown AND company_id = v_company
  ) THEN
    RAISE EXCEPTION 'Warehouse not found in your workspace.';
  END IF;

  -- Deterministic lock order on stock rows we may touch
  PERFORM 1 FROM stock_items si
   WHERE si.company_id = v_company AND si.godown_id = v_godown
     AND si.product_id IN (
       SELECT il.product_id FROM invoice_lines il WHERE il.invoice_id = v_inv.id AND il.product_id IS NOT NULL
     )
   ORDER BY si.product_id
   FOR UPDATE;

  v_fy := public.fy_of(v_date);

  INSERT INTO document_sequences (company_id, doc_type, fy, prefix, next_seq)
  VALUES (v_company, 'credit_note', v_fy, 'CN', 2)
  ON CONFLICT (company_id, doc_type, fy)
  DO UPDATE SET next_seq = document_sequences.next_seq + 1, updated_at = now()
  RETURNING next_seq - 1 INTO v_seq;

  v_cn_number := 'CN/' || v_fy || '/' || LPAD(v_seq::text, 4, '0');

  INSERT INTO credit_notes (
    company_id, invoice_id, order_id, distributor_id, credit_note_number, fy,
    note_date, reason, subtotal, cgst_amount, sgst_amount, igst_amount,
    total_tax, round_off, grand_total, amount_in_words, posted_by, posted_at
  ) VALUES (
    v_company, v_inv.id, p_order_id, v_dealer.id, v_cn_number, v_fy,
    v_date, COALESCE(p_reason, ''), 0, 0, 0, 0, 0, 0, 0, '', auth.uid(), now()
  ) RETURNING id INTO v_cn_id;

  FOR v_in IN
    SELECT (x->>'invoice_line_id')::uuid AS invoice_line_id,
           COALESCE((x->>'good_qty')::int, 0)    AS good_qty,
           COALESCE((x->>'damaged_qty')::int, 0) AS damaged_qty
      FROM jsonb_array_elements(p_lines) x
     ORDER BY (x->>'invoice_line_id')
  LOOP
    v_good := GREATEST(v_in.good_qty, 0);
    v_dmg  := GREATEST(v_in.damaged_qty, 0);
    v_qty  := v_good + v_dmg;
    CONTINUE WHEN v_qty = 0;

    SELECT * INTO v_il FROM invoice_lines
     WHERE id = v_in.invoice_line_id AND invoice_id = v_inv.id
     FOR UPDATE;
    IF v_il.id IS NULL THEN
      RAISE EXCEPTION 'One of the products is not on this bill.';
    END IF;

    SELECT COALESCE(SUM(cnl.quantity), 0) INTO v_already
      FROM credit_note_lines cnl
      JOIN credit_notes cn ON cn.id = cnl.credit_note_id
     WHERE cnl.invoice_line_id = v_il.id AND cn.id <> v_cn_id;

    IF v_already + v_qty > v_il.quantity THEN
      RAISE EXCEPTION 'You cannot return more % than was billed (% billed, % already returned).',
        v_il.product_name, v_il.quantity, v_already;
    END IF;

    v_rate := COALESCE(v_il.gst_rate, v_co.default_gst_rate);
    v_unit_taxable := CASE WHEN v_il.quantity > 0
                           THEN COALESCE(v_il.taxable_value, 0) / v_il.quantity
                           ELSE 0 END;
    v_taxable := ROUND(v_unit_taxable * v_qty, 2);

    IF v_inv.supply_type = 'inter_state' THEN
      v_li := ROUND(v_taxable * v_rate / 100, 2); v_lc := 0; v_ls := 0;
    ELSE
      v_lc := ROUND(v_taxable * v_rate / 200, 2); v_ls := v_lc; v_li := 0;
    END IF;

    INSERT INTO credit_note_lines (
      credit_note_id, invoice_line_id, product_id, product_name, hsn_code, unit,
      quantity, restocked_quantity, unit_price, taxable_value, gst_rate,
      cgst_amount, sgst_amount, igst_amount, line_total
    ) VALUES (
      v_cn_id, v_il.id, v_il.product_id, v_il.product_name, COALESCE(v_il.hsn_code,''),
      COALESCE(v_il.unit,''), v_qty, v_good, v_il.unit_price, v_taxable, v_rate,
      v_lc, v_ls, v_li, v_taxable + v_lc + v_ls + v_li
    );

    v_subtotal := v_subtotal + v_taxable;
    v_cgst := v_cgst + v_lc;
    v_sgst := v_sgst + v_ls;
    v_igst := v_igst + v_li;
    v_claim_value := v_claim_value + v_taxable + v_lc + v_ls + v_li;
    v_count := v_count + 1;

    -- Only accepted good stock comes back
    IF v_good > 0 AND v_il.product_id IS NOT NULL AND v_godown IS NOT NULL THEN
      v_restocked := true;

      INSERT INTO stock_movements (
        company_id, product_id, godown_id, delta, movement_type,
        source_doc_type, source_doc_id, idempotency_key, actor, note
      ) VALUES (
        v_company, v_il.product_id, v_godown, v_good, 'return',
        'credit_note', v_cn_id,
        'return:' || v_cn_id::text || ':' || v_il.id::text, auth.uid(),
        COALESCE(p_reason, '')
      );

      INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold)
      VALUES (v_company, v_il.product_id, v_godown, v_good, 0)
      ON CONFLICT (company_id, product_id, godown_id)
      DO UPDATE SET quantity = stock_items.quantity + v_good, updated_at = now();
    END IF;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Add at least one product to the return.';
  END IF;

  v_grand := v_subtotal + v_cgst + v_sgst + v_igst;
  v_rounded := ROUND(v_grand, 0);
  v_roundoff := v_rounded - v_grand;

  UPDATE credit_notes SET
    subtotal = v_subtotal, cgst_amount = v_cgst, sgst_amount = v_sgst, igst_amount = v_igst,
    total_tax = v_cgst + v_sgst + v_igst, round_off = v_roundoff, grand_total = v_rounded
  WHERE id = v_cn_id;

  -- Mirror into the returns list, already settled
  INSERT INTO claims (
    company_id, order_id, order_number, distributor_id, distributor_name,
    claim_type, status, reason, resolution_notes, restore_stock,
    total_claim_value, resolved_at
  ) VALUES (
    v_company, p_order_id, v_order.order_number, v_dealer.id, v_dealer.name,
    CASE WHEN v_restocked THEN 'return' ELSE 'damage' END, 'resolved',
    COALESCE(p_reason, ''), 'Credit note ' || v_cn_number, v_restocked,
    v_rounded, now()
  ) RETURNING id INTO v_claim_id;

  INSERT INTO claim_lines (claim_id, product_id, product_name, quantity, unit_price, line_total)
  SELECT v_claim_id, cnl.product_id, cnl.product_name, cnl.quantity, cnl.unit_price, cnl.line_total
    FROM credit_note_lines cnl
   WHERE cnl.credit_note_id = v_cn_id AND cnl.product_id IS NOT NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'credit_note_id', v_cn_id,
    'credit_note_number', v_cn_number,
    'claim_id', v_claim_id,
    'grand_total', v_rounded,
    'restocked', v_restocked,
    'lines', v_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_return_and_credit_atomic(uuid,jsonb,text,uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_return_and_credit_atomic(uuid,jsonb,text,uuid,date) TO authenticated;