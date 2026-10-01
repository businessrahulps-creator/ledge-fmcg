ALTER TABLE public.products ADD COLUMN IF NOT EXISTS item_kind text NOT NULL DEFAULT 'product';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS avg_cost numeric NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD CONSTRAINT products_item_kind_check CHECK (item_kind IN ('product','raw_material'));

ALTER TABLE public.stock_movements DROP CONSTRAINT stock_movements_movement_type_check;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_movement_type_check CHECK (movement_type = ANY (ARRAY['dispatch','return_restock','manual_adjust','opening','cancel_reversal','purchase','purchase_return','purchase_cancel']));

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  gstin text NOT NULL DEFAULT '',
  state_code text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  opening_balance numeric NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.purchase_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  supplier_name text NOT NULL,
  supplier_bill_no text NOT NULL,
  bill_date date NOT NULL,
  godown_id uuid NOT NULL REFERENCES public.godowns(id) ON DELETE RESTRICT,
  supply_type text NOT NULL DEFAULT 'intra',
  subtotal numeric NOT NULL DEFAULT 0,
  cgst_amount numeric NOT NULL DEFAULT 0,
  sgst_amount numeric NOT NULL DEFAULT 0,
  igst_amount numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','cancelled')),
  cancel_reason text NOT NULL DEFAULT '',
  cancelled_at timestamptz,
  idempotency_key text,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX purchase_bills_supplier_billno_uq ON public.purchase_bills (company_id, supplier_id, lower(supplier_bill_no)) WHERE status = 'posted';
CREATE UNIQUE INDEX purchase_bills_idem_uq ON public.purchase_bills (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE public.purchase_bill_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.purchase_bills(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  unit text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity > 0),
  rate numeric NOT NULL CHECK (rate >= 0),
  gst_rate numeric NOT NULL DEFAULT 0,
  taxable_value numeric NOT NULL,
  cgst_amount numeric NOT NULL DEFAULT 0,
  sgst_amount numeric NOT NULL DEFAULT 0,
  igst_amount numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.purchase_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bill_id uuid NOT NULL REFERENCES public.purchase_bills(id) ON DELETE RESTRICT,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  return_date date NOT NULL,
  reason text NOT NULL DEFAULT '',
  subtotal numeric NOT NULL DEFAULT 0,
  total_tax numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  idempotency_key text,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX purchase_returns_idem_uq ON public.purchase_returns (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE public.purchase_return_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.purchase_returns(id) ON DELETE CASCADE,
  bill_line_id uuid NOT NULL REFERENCES public.purchase_bill_lines(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  taxable_value numeric NOT NULL,
  tax_amount numeric NOT NULL,
  line_total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  mode payment_mode NOT NULL,
  paid_on date NOT NULL,
  reference text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','voided')),
  void_reason text NOT NULL DEFAULT '',
  voided_at timestamptz,
  voided_by uuid,
  idempotency_key text,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX supplier_payments_idem_uq ON public.supplier_payments (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX purchase_bills_company_date ON public.purchase_bills (company_id, bill_date DESC);
CREATE INDEX supplier_payments_supplier ON public.supplier_payments (supplier_id);
CREATE INDEX purchase_returns_bill ON public.purchase_returns (bill_id);
CREATE INDEX purchase_bill_lines_bill ON public.purchase_bill_lines (bill_id);
CREATE INDEX purchase_return_lines_return ON public.purchase_return_lines (return_id);

GRANT SELECT, INSERT, UPDATE ON public.suppliers TO authenticated;
GRANT SELECT ON public.purchase_bills, public.purchase_bill_lines, public.purchase_returns, public.purchase_return_lines, public.supplier_payments TO authenticated;
GRANT ALL ON public.suppliers, public.purchase_bills, public.purchase_bill_lines, public.purchase_returns, public.purchase_return_lines, public.supplier_payments TO service_role;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_bill_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Money users read suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users add suppliers" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users edit suppliers" ON public.suppliers FOR UPDATE TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'))
  WITH CHECK (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users read purchase bills" ON public.purchase_bills FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users read purchase bill lines" ON public.purchase_bill_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.purchase_bills b WHERE b.id = bill_id AND b.company_id = public.get_company_id()) AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users read purchase returns" ON public.purchase_returns FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users read purchase return lines" ON public.purchase_return_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.purchase_returns r WHERE r.id = return_id AND r.company_id = public.get_company_id()) AND public.has_capability(auth.uid(), 'see_money'));
CREATE POLICY "Money users read supplier payments" ON public.supplier_payments FOR SELECT TO authenticated
  USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'see_money'));

-- Opening balance can only be set while the supplier has no bills/payments (keeps balances canonical)
CREATE OR REPLACE FUNCTION public.tg_supplier_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.company_id <> OLD.company_id THEN RAISE EXCEPTION 'Cannot move a supplier to another business'; END IF;
    IF NEW.opening_balance <> OLD.opening_balance AND (
      EXISTS (SELECT 1 FROM public.purchase_bills WHERE supplier_id = OLD.id) OR
      EXISTS (SELECT 1 FROM public.supplier_payments WHERE supplier_id = OLD.id)) THEN
      RAISE EXCEPTION 'Opening amount can''t be changed after bills or payments are added.';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER supplier_guard BEFORE INSERT OR UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.tg_supplier_guard();

CREATE OR REPLACE FUNCTION public.supplier_balance(p_supplier uuid) RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN s.company_id = public.get_company_id() AND public.has_capability(auth.uid(),'see_money') THEN
    round(s.opening_balance
      + COALESCE((SELECT sum(grand_total) FROM public.purchase_bills WHERE supplier_id = s.id AND status = 'posted'),0)
      - COALESCE((SELECT sum(r.grand_total) FROM public.purchase_returns r JOIN public.purchase_bills b ON b.id = r.bill_id WHERE r.supplier_id = s.id AND b.status = 'posted'),0)
      - COALESCE((SELECT sum(amount) FROM public.supplier_payments WHERE supplier_id = s.id AND status = 'posted'),0), 2)
  END FROM public.suppliers s WHERE s.id = p_supplier
$$;

-- Shared: add stock + movement (delta may be negative; blocks going below zero)
CREATE OR REPLACE FUNCTION public._buying_move_stock(p_company uuid, p_product uuid, p_godown uuid, p_delta integer, p_type text, p_doc_type text, p_doc uuid, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.stock_items%ROWTYPE; v_name text;
BEGIN
  SELECT * INTO v_row FROM public.stock_items WHERE company_id = p_company AND product_id = p_product AND godown_id = p_godown FOR UPDATE;
  IF NOT FOUND THEN
    IF p_delta < 0 THEN
      SELECT name INTO v_name FROM public.products WHERE id = p_product;
      RAISE EXCEPTION 'Not enough stock of % in this godown.', v_name;
    END IF;
    INSERT INTO public.stock_items (company_id, product_id, godown_id, quantity, threshold) VALUES (p_company, p_product, p_godown, p_delta, 0);
  ELSE
    IF v_row.quantity + p_delta < 0 THEN
      SELECT name INTO v_name FROM public.products WHERE id = p_product;
      RAISE EXCEPTION 'Not enough stock of % in this godown (only % left).', v_name, v_row.quantity;
    END IF;
    UPDATE public.stock_items SET quantity = quantity + p_delta, updated_at = now() WHERE id = v_row.id;
  END IF;
  INSERT INTO public.stock_movements (company_id, product_id, godown_id, delta, movement_type, source_doc_type, source_doc_id, actor, note)
  VALUES (p_company, p_product, p_godown, p_delta, p_type, p_doc_type, p_doc, auth.uid(), COALESCE(p_note,''));
END $$;
REVOKE ALL ON FUNCTION public._buying_move_stock(uuid,uuid,uuid,integer,text,text,uuid,text) FROM PUBLIC, anon, authenticated;

-- Weighted average cost recompute from all posted purchases minus returns (pre-GST)
CREATE OR REPLACE FUNCTION public._buying_refresh_avg_cost(p_product uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_qty numeric; v_val numeric;
BEGIN
  SELECT COALESCE(sum(l.quantity),0), COALESCE(sum(l.taxable_value),0) INTO v_qty, v_val
    FROM public.purchase_bill_lines l JOIN public.purchase_bills b ON b.id = l.bill_id
   WHERE l.product_id = p_product AND b.status = 'posted';
  SELECT v_qty - COALESCE(sum(rl.quantity),0), v_val - COALESCE(sum(rl.taxable_value),0) INTO v_qty, v_val
    FROM public.purchase_return_lines rl JOIN public.purchase_returns r ON r.id = rl.return_id JOIN public.purchase_bills b ON b.id = r.bill_id
   WHERE rl.product_id = p_product AND b.status = 'posted';
  UPDATE public.products SET avg_cost = CASE WHEN v_qty > 0 THEN round(v_val / v_qty, 2) ELSE 0 END WHERE id = p_product;
END $$;
REVOKE ALL ON FUNCTION public._buying_refresh_avg_cost(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_purchase_bill_atomic(
  p_supplier_id uuid, p_supplier_bill_no text, p_bill_date date, p_godown_id uuid, p_lines jsonb, p_notes text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_sup public.suppliers%ROWTYPE; v_company_state text; v_inter boolean;
  v_bill uuid; v_existing uuid; v_line jsonb; v_prod public.products%ROWTYPE;
  v_qty integer; v_rate numeric; v_gst numeric; v_taxable numeric; v_tax numeric;
  v_sub numeric := 0; v_c numeric := 0; v_s numeric := 0; v_i numeric := 0; v_lc numeric; v_ls numeric; v_li numeric;
  v_seen uuid[] := '{}';
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money') THEN RAISE EXCEPTION 'You do not have permission to record purchases.'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.purchase_bills WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('bill_id', v_existing, 'duplicate', true); END IF;
  END IF;
  SELECT * INTO v_sup FROM public.suppliers WHERE id = p_supplier_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supplier not found in this business'; END IF;
  PERFORM 1 FROM public.godowns WHERE id = p_godown_id AND company_id = v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Godown not found in this business'; END IF;
  IF COALESCE(trim(p_supplier_bill_no),'') = '' THEN RAISE EXCEPTION 'Enter the supplier''s bill number.'; END IF;
  IF p_bill_date IS NULL OR p_bill_date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Bill date can''t be in the future.'; END IF;
  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Add at least one item.'; END IF;
  IF EXISTS (SELECT 1 FROM public.purchase_bills WHERE company_id = v_company AND supplier_id = p_supplier_id AND lower(supplier_bill_no) = lower(trim(p_supplier_bill_no)) AND status = 'posted') THEN
    RAISE EXCEPTION 'Bill % from this supplier is already entered.', trim(p_supplier_bill_no);
  END IF;
  SELECT state_code INTO v_company_state FROM public.companies WHERE id = v_company;
  v_inter := COALESCE(NULLIF(v_sup.state_code,''), v_company_state) <> COALESCE(v_company_state,'') AND COALESCE(v_company_state,'') <> '';

  INSERT INTO public.purchase_bills (company_id, supplier_id, supplier_name, supplier_bill_no, bill_date, godown_id, supply_type, notes, idempotency_key, posted_by)
  VALUES (v_company, v_sup.id, v_sup.name, trim(p_supplier_bill_no), p_bill_date, p_godown_id, CASE WHEN v_inter THEN 'inter' ELSE 'intra' END, COALESCE(p_notes,''), p_idempotency_key, auth.uid())
  RETURNING id INTO v_bill;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_qty := (v_line->>'quantity')::integer;
    v_rate := round((v_line->>'rate')::numeric, 2);
    v_gst := COALESCE((v_line->>'gst_rate')::numeric, 0);
    IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be more than zero.'; END IF;
    IF v_rate IS NULL OR v_rate < 0 THEN RAISE EXCEPTION 'Rate can''t be negative.'; END IF;
    IF v_gst NOT IN (0, 0.25, 3, 5, 12, 18, 28) THEN RAISE EXCEPTION 'GST % is not a valid rate.', v_gst; END IF;
    SELECT * INTO v_prod FROM public.products WHERE id = (v_line->>'product_id')::uuid AND company_id = v_company;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found in this business'; END IF;
    IF v_prod.id = ANY(v_seen) THEN RAISE EXCEPTION '% is added twice. Combine it into one line.', v_prod.name; END IF;
    v_seen := v_seen || v_prod.id;
    v_taxable := round(v_qty * v_rate, 2);
    IF v_inter THEN v_li := round(v_taxable * v_gst / 100, 2); v_lc := 0; v_ls := 0;
    ELSE v_lc := round(v_taxable * v_gst / 200, 2); v_ls := v_lc; v_li := 0; END IF;
    INSERT INTO public.purchase_bill_lines (bill_id, product_id, product_name, unit, quantity, rate, gst_rate, taxable_value, cgst_amount, sgst_amount, igst_amount, line_total)
    VALUES (v_bill, v_prod.id, v_prod.name, v_prod.unit, v_qty, v_rate, v_gst, v_taxable, v_lc, v_ls, v_li, v_taxable + v_lc + v_ls + v_li);
    v_sub := v_sub + v_taxable; v_c := v_c + v_lc; v_s := v_s + v_ls; v_i := v_i + v_li;
    PERFORM public._buying_move_stock(v_company, v_prod.id, p_godown_id, v_qty, 'purchase', 'purchase_bill', v_bill, 'Purchase bill ' || trim(p_supplier_bill_no));
    PERFORM public._buying_refresh_avg_cost(v_prod.id);
  END LOOP;

  UPDATE public.purchase_bills SET subtotal = v_sub, cgst_amount = v_c, sgst_amount = v_s, igst_amount = v_i,
    total_tax = v_c + v_s + v_i, grand_total = v_sub + v_c + v_s + v_i WHERE id = v_bill;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'purchase_bill', v_bill, 'create',
    'Purchase bill ' || trim(p_supplier_bill_no) || ' from ' || v_sup.name, jsonb_build_object('total', v_sub + v_c + v_s + v_i));
  RETURN jsonb_build_object('bill_id', v_bill, 'grand_total', v_sub + v_c + v_s + v_i);
END $$;

CREATE OR REPLACE FUNCTION public.return_purchase_atomic(p_bill_id uuid, p_lines jsonb, p_reason text, p_return_date date, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_bill public.purchase_bills%ROWTYPE; v_ret uuid; v_existing uuid; v_line jsonb; v_bl public.purchase_bill_lines%ROWTYPE;
  v_qty integer; v_already integer; v_taxable numeric; v_tax numeric; v_sub numeric := 0; v_t numeric := 0; v_left integer;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money') THEN RAISE EXCEPTION 'You do not have permission to record purchases.'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.purchase_returns WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('return_id', v_existing, 'duplicate', true); END IF;
  END IF;
  SELECT * INTO v_bill FROM public.purchase_bills WHERE id = p_bill_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase bill not found'; END IF;
  IF v_bill.status <> 'posted' THEN RAISE EXCEPTION 'This bill is cancelled.'; END IF;
  IF p_return_date IS NULL OR p_return_date < v_bill.bill_date OR p_return_date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'Return date must be between the bill date and today.'; END IF;
  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Choose at least one item to return.'; END IF;
  INSERT INTO public.purchase_returns (company_id, bill_id, supplier_id, return_date, reason, idempotency_key, posted_by)
  VALUES (v_company, v_bill.id, v_bill.supplier_id, p_return_date, COALESCE(p_reason,''), p_idempotency_key, auth.uid()) RETURNING id INTO v_ret;
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_qty := (v_line->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;
    SELECT * INTO v_bl FROM public.purchase_bill_lines WHERE id = (v_line->>'bill_line_id')::uuid AND bill_id = v_bill.id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item is not on this bill'; END IF;
    SELECT COALESCE(sum(quantity),0) INTO v_already FROM public.purchase_return_lines WHERE bill_line_id = v_bl.id;
    v_left := v_bl.quantity - v_already;
    IF v_qty > v_left THEN RAISE EXCEPTION 'Only % of % can still be returned.', v_left, v_bl.product_name; END IF;
    -- Last units returned take whatever value is left, so rounding never leaves paise behind.
    IF v_qty = v_left THEN
      SELECT v_bl.taxable_value - COALESCE(sum(taxable_value),0), (v_bl.line_total - v_bl.taxable_value) - COALESCE(sum(tax_amount),0)
        INTO v_taxable, v_tax FROM public.purchase_return_lines WHERE bill_line_id = v_bl.id;
    ELSE
      v_taxable := round(v_bl.taxable_value * v_qty / v_bl.quantity, 2);
      v_tax := round((v_bl.line_total - v_bl.taxable_value) * v_qty / v_bl.quantity, 2);
    END IF;
    INSERT INTO public.purchase_return_lines (return_id, bill_line_id, product_id, product_name, quantity, taxable_value, tax_amount, line_total)
    VALUES (v_ret, v_bl.id, v_bl.product_id, v_bl.product_name, v_qty, v_taxable, v_tax, v_taxable + v_tax);
    v_sub := v_sub + v_taxable; v_t := v_t + v_tax;
    PERFORM public._buying_move_stock(v_company, v_bl.product_id, v_bill.godown_id, -v_qty, 'purchase_return', 'purchase_return', v_ret, 'Returned to ' || v_bill.supplier_name);
    PERFORM public._buying_refresh_avg_cost(v_bl.product_id);
  END LOOP;
  IF v_sub + v_t = 0 AND NOT EXISTS (SELECT 1 FROM public.purchase_return_lines WHERE return_id = v_ret) THEN RAISE EXCEPTION 'Choose at least one item to return.'; END IF;
  UPDATE public.purchase_returns SET subtotal = v_sub, total_tax = v_t, grand_total = v_sub + v_t WHERE id = v_ret;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'purchase_bill', v_bill.id, 'return', 'Returned items to ' || v_bill.supplier_name || ' (bill ' || v_bill.supplier_bill_no || ')', jsonb_build_object('total', v_sub + v_t, 'reason', p_reason));
  RETURN jsonb_build_object('return_id', v_ret, 'grand_total', v_sub + v_t);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_purchase_bill_atomic(p_bill_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.get_company_id(); v_bill public.purchase_bills%ROWTYPE; v_l record;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money') THEN RAISE EXCEPTION 'You do not have permission to record purchases.'; END IF;
  IF COALESCE(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'Give a reason for cancelling.'; END IF;
  SELECT * INTO v_bill FROM public.purchase_bills WHERE id = p_bill_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase bill not found'; END IF;
  IF v_bill.status <> 'posted' THEN RAISE EXCEPTION 'This bill is already cancelled.'; END IF;
  IF EXISTS (SELECT 1 FROM public.purchase_returns WHERE bill_id = v_bill.id) THEN RAISE EXCEPTION 'Items from this bill were returned, so it can''t be cancelled.'; END IF;
  PERFORM 1 FROM public.suppliers WHERE id = v_bill.supplier_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.supplier_payments WHERE supplier_id = v_bill.supplier_id AND status = 'posted')
     AND public.supplier_balance(v_bill.supplier_id) < v_bill.grand_total THEN
    RAISE EXCEPTION 'You have already paid this supplier for this bill. Use Return to supplier instead.';
  END IF;
  FOR v_l IN SELECT * FROM public.purchase_bill_lines WHERE bill_id = v_bill.id LOOP
    PERFORM public._buying_move_stock(v_company, v_l.product_id, v_bill.godown_id, -v_l.quantity, 'purchase_cancel', 'purchase_bill', v_bill.id, 'Cancelled purchase bill ' || v_bill.supplier_bill_no);
  END LOOP;
  UPDATE public.purchase_bills SET status = 'cancelled', cancel_reason = trim(p_reason), cancelled_at = now() WHERE id = v_bill.id;
  FOR v_l IN SELECT DISTINCT product_id FROM public.purchase_bill_lines WHERE bill_id = v_bill.id LOOP
    PERFORM public._buying_refresh_avg_cost(v_l.product_id);
  END LOOP;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'purchase_bill', v_bill.id, 'cancel', 'Cancelled purchase bill ' || v_bill.supplier_bill_no || ' from ' || v_bill.supplier_name, jsonb_build_object('reason', p_reason));
  RETURN jsonb_build_object('bill_id', v_bill.id, 'status', 'cancelled');
END $$;

CREATE OR REPLACE FUNCTION public.record_supplier_payment_atomic(p_supplier_id uuid, p_amount numeric, p_mode payment_mode, p_paid_on date, p_reference text, p_note text, p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.get_company_id(); v_sup public.suppliers%ROWTYPE; v_id uuid; v_bal numeric;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money') THEN RAISE EXCEPTION 'You do not have permission to pay suppliers.'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_id FROM public.supplier_payments WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN jsonb_build_object('payment_id', v_id, 'duplicate', true); END IF;
  END IF;
  SELECT * INTO v_sup FROM public.suppliers WHERE id = p_supplier_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supplier not found in this business'; END IF;
  p_amount := round(p_amount, 2);
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be more than zero.'; END IF;
  IF p_paid_on IS NULL OR p_paid_on > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Payment date can''t be in the future.'; END IF;
  v_bal := public.supplier_balance(p_supplier_id);
  IF p_amount > v_bal THEN RAISE EXCEPTION 'You owe this supplier only ₹%. Pay that or less.', v_bal; END IF;
  INSERT INTO public.supplier_payments (company_id, supplier_id, amount, mode, paid_on, reference, note, idempotency_key, posted_by)
  VALUES (v_company, v_sup.id, p_amount, p_mode, p_paid_on, CASE WHEN p_mode = 'cash' THEN '' ELSE COALESCE(p_reference,'') END, COALESCE(p_note,''), p_idempotency_key, auth.uid())
  RETURNING id INTO v_id;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'supplier', v_sup.id, 'payment', 'Paid ₹' || p_amount || ' to ' || v_sup.name, jsonb_build_object('payment_id', v_id, 'mode', p_mode));
  RETURN jsonb_build_object('payment_id', v_id, 'balance', v_bal - p_amount);
END $$;

CREATE OR REPLACE FUNCTION public.void_supplier_payment_atomic(p_payment_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.get_company_id(); v_p public.supplier_payments%ROWTYPE;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No company for this user'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money') THEN RAISE EXCEPTION 'You do not have permission to pay suppliers.'; END IF;
  IF COALESCE(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'Give a reason for cancelling this payment.'; END IF;
  SELECT * INTO v_p FROM public.supplier_payments WHERE id = p_payment_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF v_p.status <> 'posted' THEN RAISE EXCEPTION 'This payment is already cancelled.'; END IF;
  UPDATE public.supplier_payments SET status = 'voided', void_reason = trim(p_reason), voided_at = now(), voided_by = auth.uid() WHERE id = v_p.id;
  INSERT INTO public.activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata)
  VALUES (v_company, auth.uid(), '', 'supplier', v_p.supplier_id, 'void_payment', 'Cancelled payment of ₹' || v_p.amount, jsonb_build_object('payment_id', v_p.id, 'reason', p_reason));
  RETURN jsonb_build_object('payment_id', v_p.id, 'status', 'voided');
END $$;

REVOKE ALL ON FUNCTION public.supplier_balance(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_purchase_bill_atomic(uuid,text,date,uuid,jsonb,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.return_purchase_atomic(uuid,jsonb,text,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_purchase_bill_atomic(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_supplier_payment_atomic(uuid,numeric,payment_mode,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.void_supplier_payment_atomic(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.supplier_balance(uuid), public.record_purchase_bill_atomic(uuid,text,date,uuid,jsonb,text,text), public.return_purchase_atomic(uuid,jsonb,text,date,text), public.cancel_purchase_bill_atomic(uuid,text), public.record_supplier_payment_atomic(uuid,numeric,payment_mode,date,text,text,text), public.void_supplier_payment_atomic(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.tg_supplier_guard() FROM PUBLIC, anon, authenticated;