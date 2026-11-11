-- Phase 3: returns in any product unit, saved as whole main units, counted once in return_line_ledger.
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS claims_company_idem_uq ON public.claims (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Safety net: any credit note line saved before this function went live gets its ledger rows.
INSERT INTO public.return_line_ledger (company_id, invoice_id, invoice_line_id, product_id, kind,
  entered_quantity, entered_unit, conversion_factor, base_quantity, credit_note_line_id, source, created_by, created_at)
SELECT cn.company_id, cn.invoice_id, cl.invoice_line_id, il.product_id, k.kind, k.q, COALESCE(NULLIF(cl.unit,''),''), 1, k.q, cl.id, 'backfill', cn.posted_by, cl.created_at
  FROM public.credit_note_lines cl
  JOIN public.credit_notes cn ON cn.id = cl.credit_note_id
  JOIN public.invoice_lines il ON il.id = cl.invoice_line_id
  CROSS JOIN LATERAL (VALUES ('good', cl.restocked_quantity::numeric), ('damaged_credit', (cl.quantity - cl.restocked_quantity)::numeric)) k(kind, q)
 WHERE k.q > 0
   AND NOT EXISTS (SELECT 1 FROM public.return_line_ledger l WHERE l.credit_note_line_id = cl.id AND l.kind = k.kind);

CREATE OR REPLACE FUNCTION public.record_return_and_credit_atomic(p_order_id uuid, p_lines jsonb, p_reason text DEFAULT ''::text, p_godown_id uuid DEFAULT NULL::uuid, p_note_date date DEFAULT NULL::date, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE;
  v_inv invoices%ROWTYPE;
  v_dealer distributors%ROWTYPE;
  v_godown uuid;
  v_date date := COALESCE(p_note_date, ((now() AT TIME ZONE 'Asia/Kolkata')::date));
  v_fy text; v_seq int; v_cn_number text;
  v_cn_id uuid; v_claim_id uuid; v_cnl_id uuid; v_ql_id uuid;
  v_in RECORD;
  v_il invoice_lines%ROWTYPE;
  v_unit product_units%ROWTYPE;
  v_factor numeric; v_unit_name text; v_unit_id uuid;
  v_eg numeric; v_ed numeric; v_en numeric;      -- entered: good, damaged credit, damaged no credit
  v_good int; v_dmg int; v_nocr int; v_cr int; v_all int;
  v_done numeric; v_nocr_ever numeric;
  v_rate numeric(5,2);
  v_taxable numeric(14,2); v_lc numeric(14,2); v_ls numeric(14,2); v_li numeric(14,2);
  v_subtotal numeric(14,2) := 0; v_cgst numeric(14,2) := 0; v_sgst numeric(14,2) := 0; v_igst numeric(14,2) := 0;
  v_grand numeric(14,2); v_rounded numeric(14,2) := 0; v_roundoff numeric(14,2);
  v_restocked boolean := false;
  v_count int := 0; v_credit_count int := 0;
  v_prev_tax numeric(14,2); v_prev_c numeric(14,2); v_prev_s numeric(14,2); v_prev_i numeric(14,2);
  v_existing credit_notes%ROWTYPE; v_existing_claim uuid;
  v_prior_cn numeric(14,2);
  v_kind text;
  v_lines jsonb := '[]'::jsonb;
  x jsonb;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN
    RAISE EXCEPTION 'You do not have permission to record returns.';
  END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM credit_notes WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF v_existing.id IS NOT NULL THEN
      RETURN jsonb_build_object('ok', true, 'replayed', true, 'credit_note_id', v_existing.id,
        'credit_note_number', v_existing.credit_note_number, 'grand_total', v_existing.grand_total);
    END IF;
    SELECT id INTO v_existing_claim FROM claims WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF v_existing_claim IS NOT NULL THEN
      RETURN jsonb_build_object('ok', true, 'replayed', true, 'credit_note_id', NULL, 'credit_note_number', NULL,
        'claim_id', v_existing_claim, 'grand_total', 0);
    END IF;
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Add at least one product to the return.';
  END IF;
  IF (SELECT COUNT(*) FROM jsonb_array_elements(p_lines) e)
     <> (SELECT COUNT(DISTINCT e->>'invoice_line_id') FROM jsonb_array_elements(p_lines) e) THEN
    RAISE EXCEPTION 'The same product is listed twice in this return. Combine it into one row.';
  END IF;

  -- Locks, always in this order: business money lock, order, bill, bill lines, units, stock rows.
  PERFORM pg_advisory_xact_lock(hashtext('ledge.money'), hashtext(v_company::text));
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.company_id <> v_company THEN RAISE EXCEPTION 'Order not found in your workspace.'; END IF;
  IF v_order.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'This order was cancelled.'; END IF;
  IF v_order.delivery_status = 'pending' THEN RAISE EXCEPTION 'Dispatch and bill this order before recording a return.'; END IF;

  SELECT * INTO v_inv FROM invoices
   WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice' AND company_id = v_company FOR UPDATE;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'No final bill found for this order.'; END IF;

  PERFORM 1 FROM invoice_lines WHERE invoice_id = v_inv.id ORDER BY id FOR UPDATE;
  PERFORM 1 FROM product_units u
   WHERE u.id IN (SELECT NULLIF(e->>'unit_id','')::uuid FROM jsonb_array_elements(p_lines) e)
   ORDER BY u.id FOR SHARE;

  SELECT * INTO v_dealer FROM distributors WHERE id = v_order.distributor_id AND company_id = v_company FOR UPDATE;
  IF v_dealer.id IS NULL THEN RAISE EXCEPTION 'Dealer not found in your workspace.'; END IF;

  v_godown := COALESCE(p_godown_id, v_order.godown_id);
  IF v_godown IS NOT NULL AND NOT EXISTS (SELECT 1 FROM godowns WHERE id = v_godown AND company_id = v_company) THEN
    RAISE EXCEPTION 'Warehouse not found in your workspace.';
  END IF;
  PERFORM 1 FROM stock_items si
   WHERE si.company_id = v_company AND si.godown_id = v_godown
     AND si.product_id IN (SELECT il.product_id FROM invoice_lines il WHERE il.invoice_id = v_inv.id AND il.product_id IS NOT NULL)
   ORDER BY si.product_id, si.godown_id FOR UPDATE;

  -- Pass 1: validate every line and convert to whole main units (after locks).
  FOR v_in IN
    SELECT (e->>'invoice_line_id')::uuid AS invoice_line_id,
           NULLIF(e->>'unit_id','')::uuid AS unit_id,
           NULLIF(e->>'unit_factor_seen','')::numeric AS factor_seen,
           COALESCE(NULLIF(e->>'good_qty','')::numeric, 0) AS g,
           COALESCE(NULLIF(e->>'damaged_qty','')::numeric, 0) AS d,
           COALESCE(NULLIF(e->>'damaged_no_credit_qty','')::numeric, 0) AS n
      FROM jsonb_array_elements(p_lines) e
     ORDER BY (e->>'invoice_line_id')
  LOOP
    IF v_in.g < 0 OR v_in.d < 0 OR v_in.n < 0 THEN RAISE EXCEPTION 'Return quantities cannot be negative.'; END IF;
    IF v_in.g <> round(v_in.g, 3) OR v_in.d <> round(v_in.d, 3) OR v_in.n <> round(v_in.n, 3) THEN
      RAISE EXCEPTION 'Use at most 3 decimal places in a return quantity.';
    END IF;
    CONTINUE WHEN v_in.g + v_in.d + v_in.n = 0;

    SELECT * INTO v_il FROM invoice_lines WHERE id = v_in.invoice_line_id AND invoice_id = v_inv.id;
    IF v_il.id IS NULL THEN RAISE EXCEPTION 'One of the products is not on this bill.'; END IF;

    IF v_in.unit_id IS NULL THEN
      v_factor := 1; v_unit_name := COALESCE(NULLIF(v_il.unit,''), ''); v_unit_id := NULL;
    ELSE
      SELECT * INTO v_unit FROM product_units WHERE id = v_in.unit_id;
      IF v_unit.id IS NULL OR v_unit.company_id <> v_company OR v_unit.product_id IS DISTINCT FROM v_il.product_id THEN
        RAISE EXCEPTION 'This unit does not belong to % in your business.', v_il.product_name;
      END IF;
      IF v_unit.is_archived OR (v_in.factor_seen IS NOT NULL AND v_in.factor_seen <> v_unit.conversion_factor) THEN
        RAISE EXCEPTION 'This unit changed — please pick it again.';
      END IF;
      v_factor := v_unit.conversion_factor; v_unit_name := v_unit.unit_name; v_unit_id := v_unit.id;
    END IF;

    -- entered / factor must be a whole number of the main unit, for each kind.
    IF (v_in.g / v_factor) <> trunc(v_in.g / v_factor) OR (v_in.d / v_factor) <> trunc(v_in.d / v_factor)
       OR (v_in.n / v_factor) <> trunc(v_in.n / v_factor) THEN
      RAISE EXCEPTION '% % of % is not a whole %. Enter a multiple of % %.',
        trim_scale(CASE WHEN (v_in.g / v_factor) <> trunc(v_in.g / v_factor) THEN v_in.g WHEN (v_in.d / v_factor) <> trunc(v_in.d / v_factor) THEN v_in.d ELSE v_in.n END),
        v_unit_name, v_il.product_name, COALESCE(NULLIF(v_il.unit,''),'main unit'), trim_scale(v_factor), v_unit_name;
    END IF;
    v_good := (v_in.g / v_factor)::int; v_dmg := (v_in.d / v_factor)::int; v_nocr := (v_in.n / v_factor)::int;

    SELECT COALESCE(SUM(base_quantity),0) INTO v_done FROM return_line_ledger WHERE invoice_line_id = v_il.id;
    IF v_done + v_good + v_dmg + v_nocr > v_il.quantity THEN
      RAISE EXCEPTION 'You cannot return more % than was billed (% billed, % already returned).',
        v_il.product_name, v_il.quantity, trim_scale(v_done);
    END IF;

    v_lines := v_lines || jsonb_build_object('il', v_il.id, 'unit_id', v_unit_id, 'unit', v_unit_name, 'f', v_factor,
      'eg', v_in.g, 'ed', v_in.d, 'en', v_in.n, 'g', v_good, 'd', v_dmg, 'n', v_nocr);
    v_count := v_count + 1;
    IF v_good + v_dmg > 0 THEN v_credit_count := v_credit_count + 1; END IF;
  END LOOP;

  IF v_count = 0 THEN RAISE EXCEPTION 'Add at least one product to the return.'; END IF;

  IF v_credit_count > 0 THEN
    v_fy := public.fy_of(v_date);
    INSERT INTO document_sequences (company_id, doc_type, fy, prefix, next_seq)
    VALUES (v_company, 'credit_note', v_fy, 'CN', 2)
    ON CONFLICT (company_id, doc_type, fy) DO UPDATE SET next_seq = document_sequences.next_seq + 1, updated_at = now()
    RETURNING next_seq - 1 INTO v_seq;
    v_cn_number := 'CN/' || v_fy || '/' || LPAD(v_seq::text, GREATEST(4, length(v_seq::text)), '0');
    INSERT INTO credit_notes (company_id, invoice_id, order_id, distributor_id, credit_note_number, fy,
      note_date, reason, subtotal, cgst_amount, sgst_amount, igst_amount, total_tax, round_off, grand_total,
      amount_in_words, posted_by, posted_at, idempotency_key)
    VALUES (v_company, v_inv.id, p_order_id, v_dealer.id, v_cn_number, v_fy, v_date, COALESCE(p_reason,''),
      0,0,0,0,0,0,0,'', auth.uid(), now(), p_idempotency_key)
    RETURNING id INTO v_cn_id;
  END IF;

  INSERT INTO claims (company_id, order_id, order_number, distributor_id, distributor_name, claim_type, status,
    reason, resolution_notes, restore_stock, total_claim_value, resolved_at, idempotency_key)
  VALUES (v_company, p_order_id, v_order.order_number, v_dealer.id, v_dealer.name, 'damage', 'resolved',
    COALESCE(p_reason,''), COALESCE('Credit note ' || v_cn_number, 'No credit given'), false, 0, now(),
    CASE WHEN v_cn_id IS NULL THEN p_idempotency_key END)
  RETURNING id INTO v_claim_id;

  -- Pass 2: write documents, ledger and stock.
  FOR x IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
    SELECT * INTO v_il FROM invoice_lines WHERE id = (x->>'il')::uuid;
    v_good := (x->>'g')::int; v_dmg := (x->>'d')::int; v_nocr := (x->>'n')::int;
    v_cr := v_good + v_dmg; v_all := v_cr + v_nocr;
    v_factor := (x->>'f')::numeric;
    v_cnl_id := NULL; v_taxable := 0; v_lc := 0; v_ls := 0; v_li := 0;

    IF v_cr > 0 THEN
      v_rate := COALESCE(v_il.gst_rate, 0);
      v_taxable := CASE WHEN v_il.quantity > 0 THEN ROUND(COALESCE(v_il.taxable_value,0) * v_cr / v_il.quantity, 2) ELSE 0 END;
      IF v_inv.supply_type = 'inter_state' THEN
        v_li := ROUND(v_taxable * v_rate / 100, 2); v_lc := 0; v_ls := 0;
      ELSE
        v_lc := ROUND(v_taxable * v_rate / 200, 2); v_ls := v_lc; v_li := 0;
      END IF;
      -- Last units of a line that was never returned without credit: credit exactly what is left.
      SELECT COALESCE(SUM(base_quantity),0) INTO v_done FROM return_line_ledger WHERE invoice_line_id = v_il.id;
      SELECT COALESCE(SUM(base_quantity),0) INTO v_nocr_ever FROM return_line_ledger WHERE invoice_line_id = v_il.id AND kind = 'damaged_no_credit';
      IF v_done + v_all = v_il.quantity AND v_nocr_ever + v_nocr = 0 THEN
        SELECT COALESCE(SUM(cnl.taxable_value),0), COALESCE(SUM(cnl.cgst_amount),0), COALESCE(SUM(cnl.sgst_amount),0), COALESCE(SUM(cnl.igst_amount),0)
          INTO v_prev_tax, v_prev_c, v_prev_s, v_prev_i
          FROM credit_note_lines cnl WHERE cnl.invoice_line_id = v_il.id;
        v_taxable := COALESCE(v_il.taxable_value,0) - v_prev_tax;
        IF v_inv.supply_type = 'inter_state' THEN
          v_li := COALESCE(v_il.igst_amount,0) - v_prev_i; v_lc := 0; v_ls := 0;
        ELSE
          v_lc := COALESCE(v_il.cgst_amount,0) - v_prev_c; v_ls := COALESCE(v_il.sgst_amount,0) - v_prev_s; v_li := 0;
        END IF;
      END IF;

      INSERT INTO credit_note_lines (credit_note_id, invoice_line_id, product_id, product_name, hsn_code, unit,
        quantity, restocked_quantity, unit_price, taxable_value, gst_rate, cgst_amount, sgst_amount, igst_amount, line_total,
        entered_quantity, entered_unit, conversion_factor, base_quantity, product_unit_id)
      VALUES (v_cn_id, v_il.id, v_il.product_id, v_il.product_name, COALESCE(v_il.hsn_code,''), COALESCE(v_il.unit,''),
        v_cr, v_good, v_il.unit_price, v_taxable, v_rate, v_lc, v_ls, v_li, v_taxable + v_lc + v_ls + v_li,
        (x->>'eg')::numeric + (x->>'ed')::numeric, x->>'unit', v_factor, v_cr, NULLIF(x->>'unit_id','')::uuid)
      RETURNING id INTO v_cnl_id;
      v_subtotal := v_subtotal + v_taxable; v_cgst := v_cgst + v_lc; v_sgst := v_sgst + v_ls; v_igst := v_igst + v_li;
    END IF;

    v_kind := CASE WHEN (v_good > 0)::int + (v_dmg > 0)::int + (v_nocr > 0)::int > 1 THEN 'mixed'
                   WHEN v_good > 0 THEN 'good' WHEN v_dmg > 0 THEN 'damaged_credit' ELSE 'damaged_no_credit' END;
    INSERT INTO claim_lines (claim_id, product_id, product_name, quantity, unit_price, line_total,
      entered_quantity, entered_unit, conversion_factor, base_quantity, product_unit_id, invoice_line_id, return_kind)
    VALUES (v_claim_id, v_il.product_id, v_il.product_name, v_all, v_il.unit_price, v_taxable + v_lc + v_ls + v_li,
      (x->>'eg')::numeric + (x->>'ed')::numeric + (x->>'en')::numeric, x->>'unit', v_factor, v_all,
      NULLIF(x->>'unit_id','')::uuid, v_il.id, v_kind)
    RETURNING id INTO v_ql_id;

    INSERT INTO return_line_ledger (company_id, invoice_id, invoice_line_id, product_id, kind, entered_quantity, entered_unit,
      product_unit_id, conversion_factor, base_quantity, claim_line_id, credit_note_line_id, source, created_by)
    SELECT v_company, v_inv.id, v_il.id, v_il.product_id, k.kind, k.e, x->>'unit', NULLIF(x->>'unit_id','')::uuid, v_factor,
           k.b, v_ql_id, CASE WHEN k.kind = 'damaged_no_credit' THEN NULL ELSE v_cnl_id END, 'return', auth.uid()
      FROM (VALUES ('good', (x->>'eg')::numeric, v_good), ('damaged_credit', (x->>'ed')::numeric, v_dmg),
                   ('damaged_no_credit', (x->>'en')::numeric, v_nocr)) k(kind, e, b)
     WHERE k.b > 0;

    IF v_good > 0 AND v_il.product_id IS NOT NULL AND v_godown IS NOT NULL THEN
      v_restocked := true;
      INSERT INTO stock_movements (company_id, product_id, godown_id, delta, movement_type, source_doc_type, source_doc_id,
        idempotency_key, actor, note)
      VALUES (v_company, v_il.product_id, v_godown, v_good, 'return_restock', 'credit_note', v_cn_id,
        'return:' || v_cn_id::text || ':' || v_il.id::text, auth.uid(), COALESCE(p_reason,''));
      INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold)
      VALUES (v_company, v_il.product_id, v_godown, v_good, 0)
      ON CONFLICT (company_id, product_id, godown_id) DO UPDATE SET quantity = stock_items.quantity + v_good, updated_at = now();
    END IF;
  END LOOP;

  IF v_cn_id IS NOT NULL THEN
    v_grand := v_subtotal + v_cgst + v_sgst + v_igst;
    v_rounded := ROUND(v_grand, 0);
    SELECT COALESCE(SUM(grand_total),0) INTO v_prior_cn FROM credit_notes WHERE invoice_id = v_inv.id AND id <> v_cn_id;
    v_rounded := LEAST(v_rounded, GREATEST(v_inv.grand_total - v_prior_cn, 0));
    IF NOT EXISTS (
      SELECT 1 FROM invoice_lines il WHERE il.invoice_id = v_inv.id
         AND il.quantity > (SELECT COALESCE(SUM(cnl.quantity),0) FROM credit_note_lines cnl WHERE cnl.invoice_line_id = il.id)
    ) THEN
      v_rounded := v_inv.grand_total - v_prior_cn;
    END IF;
    v_roundoff := v_rounded - v_grand;
    UPDATE credit_notes SET subtotal = v_subtotal, cgst_amount = v_cgst, sgst_amount = v_sgst, igst_amount = v_igst,
      total_tax = v_cgst + v_sgst + v_igst, round_off = v_roundoff, grand_total = v_rounded,
      amount_in_words = public.amount_in_words_inr(v_rounded)
     WHERE id = v_cn_id;
  END IF;

  UPDATE claims SET claim_type = CASE WHEN v_restocked THEN 'return' ELSE 'damage' END,
         restore_stock = v_restocked, total_claim_value = v_rounded
   WHERE id = v_claim_id;

  RETURN jsonb_build_object('ok', true, 'credit_note_id', v_cn_id, 'credit_note_number', v_cn_number,
    'claim_id', v_claim_id, 'grand_total', v_rounded, 'restocked', v_restocked, 'lines', v_count);
END;
$function$;
REVOKE ALL ON FUNCTION public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date, text) TO authenticated;