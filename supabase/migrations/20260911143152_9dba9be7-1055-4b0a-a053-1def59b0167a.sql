-- 1. Payments may anchor to an order (pre-bill) or an invoice (post-bill)
ALTER TABLE public.invoice_payments
  ALTER COLUMN invoice_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.invoice_payments
  ADD CONSTRAINT invoice_payments_one_anchor
  CHECK (num_nonnulls(invoice_id, order_id) = 1);

CREATE INDEX IF NOT EXISTS invoice_payments_order_idx ON public.invoice_payments (order_id);

-- 2. Canonical dealer outstanding: bills - posted receipts - credit notes
CREATE OR REPLACE FUNCTION public.dealer_outstanding(p_dealer uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE((SELECT SUM(i.grand_total) FROM invoices i
                JOIN orders o ON o.id = i.source_order_id
               WHERE o.distributor_id = p_dealer AND i.doc_type = 'gst_invoice'), 0)
  - COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
               WHERE ip.distributor_id = p_dealer AND ip.status = 'posted'), 0)
  - COALESCE((SELECT SUM(cn.grand_total) FROM credit_notes cn
               WHERE cn.distributor_id = p_dealer), 0)
  , 0)::numeric(14,2)
$$;
REVOKE EXECUTE ON FUNCTION public.dealer_outstanding(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dealer_outstanding(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_dealer_outstanding(p_dealer uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_dealer IS NULL THEN RETURN; END IF;
  UPDATE distributors SET outstanding_amount = public.dealer_outstanding(p_dealer)
   WHERE id = p_dealer;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.refresh_dealer_outstanding(uuid) FROM PUBLIC, anon;

-- 3. Rollup trigger uses the canonical figure for outstanding
CREATE OR REPLACE FUNCTION public.refresh_entity_aggregates()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    IF TG_OP = 'DELETE' THEN v_order := OLD; ELSE v_order := NEW; END IF;

    UPDATE distributors SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0),
      outstanding_amount = public.dealer_outstanding(v_order.distributor_id)
    FROM (
      SELECT COUNT(*) cnt,
        COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
      FROM orders WHERE distributor_id = v_order.distributor_id
    ) sub
    WHERE id = v_order.distributor_id;

    IF TG_OP = 'UPDATE' AND OLD.distributor_id <> NEW.distributor_id THEN
      UPDATE distributors SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0),
        outstanding_amount = public.dealer_outstanding(OLD.distributor_id)
      FROM (
        SELECT COUNT(*) cnt,
          COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
        FROM orders WHERE distributor_id = OLD.distributor_id
      ) sub
      WHERE id = OLD.distributor_id;
    END IF;

    UPDATE salespersons SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (
      SELECT COUNT(*) cnt,
        COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
      FROM orders WHERE salesperson_id = v_order.salesperson_id
    ) sub
    WHERE id = v_order.salesperson_id;

    IF TG_OP = 'UPDATE' AND OLD.salesperson_id <> NEW.salesperson_id THEN
      UPDATE salespersons SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (
        SELECT COUNT(*) cnt,
          COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
        FROM orders WHERE salesperson_id = OLD.salesperson_id
      ) sub
      WHERE id = OLD.salesperson_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'order_lines' THEN
    IF TG_OP = 'DELETE' THEN
      UPDATE products SET total_sold = COALESCE(sub.qty, 0)
      FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = OLD.product_id) sub
      WHERE id = OLD.product_id;
    ELSE
      UPDATE products SET total_sold = COALESCE(sub.qty, 0)
      FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = NEW.product_id) sub
      WHERE id = NEW.product_id;
      IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
        UPDATE products SET total_sold = COALESCE(sub.qty, 0)
        FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = OLD.product_id) sub
        WHERE id = OLD.product_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 4. Keep dealer outstanding fresh when money documents move
CREATE OR REPLACE FUNCTION public.tg_refresh_dealer_money()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new uuid;
  v_old uuid;
BEGIN
  IF TG_TABLE_NAME IN ('invoice_payments', 'credit_notes') THEN
    IF TG_OP <> 'DELETE' THEN v_new := NEW.distributor_id; END IF;
    IF TG_OP <> 'INSERT' THEN v_old := OLD.distributor_id; END IF;
  ELSIF TG_TABLE_NAME = 'invoices' THEN
    IF TG_OP <> 'DELETE' THEN
      SELECT distributor_id INTO v_new FROM orders WHERE id = NEW.source_order_id;
    END IF;
    IF TG_OP <> 'INSERT' THEN
      SELECT distributor_id INTO v_old FROM orders WHERE id = OLD.source_order_id;
    END IF;
  END IF;

  PERFORM public.refresh_dealer_outstanding(v_new);
  IF v_old IS DISTINCT FROM v_new THEN
    PERFORM public.refresh_dealer_outstanding(v_old);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_money_payments ON public.invoice_payments;
CREATE TRIGGER trg_money_payments
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_dealer_money();

DROP TRIGGER IF EXISTS trg_money_credit_notes ON public.credit_notes;
CREATE TRIGGER trg_money_credit_notes
AFTER INSERT OR UPDATE OR DELETE ON public.credit_notes
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_dealer_money();

DROP TRIGGER IF EXISTS trg_money_invoices ON public.invoices;
CREATE TRIGGER trg_money_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_dealer_money();

-- 5. Attach pre-bill receipts to the bill the moment it is raised
CREATE OR REPLACE FUNCTION public.tg_attach_order_payments()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE invoice_payments
     SET invoice_id = NEW.id, order_id = NULL
   WHERE order_id = NEW.source_order_id AND status = 'posted';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_attach_order_payments ON public.invoices;
CREATE TRIGGER trg_attach_order_payments
AFTER INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.doc_type = 'gst_invoice' AND NEW.source_order_id IS NOT NULL)
EXECUTE FUNCTION public.tg_attach_order_payments();

-- 6. Recompute paid state once the bill's final total is written
CREATE OR REPLACE FUNCTION public.tg_sync_invoice_paid_state()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_paid numeric(14,2);
  v_credited numeric(14,2);
  v_due numeric(14,2);
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO v_paid
    FROM invoice_payments WHERE invoice_id = NEW.id AND status = 'posted';
  SELECT COALESCE(SUM(grand_total),0) INTO v_credited
    FROM credit_notes WHERE invoice_id = NEW.id;
  v_due := ROUND(NEW.grand_total - v_paid - v_credited, 2);

  UPDATE invoices
     SET status = CASE WHEN v_due <= 0 THEN 'paid' WHEN v_paid > 0 THEN 'partial' ELSE 'posted' END,
         updated_at = now()
   WHERE id = NEW.id;

  IF NEW.source_order_id IS NOT NULL THEN
    UPDATE orders
       SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status
                                 WHEN v_paid > 0 THEN 'partial'::payment_status
                                 ELSE 'pending'::payment_status END,
           updated_at = now()
     WHERE id = NEW.source_order_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invoice_paid_state ON public.invoices;
CREATE TRIGGER trg_sync_invoice_paid_state
AFTER UPDATE OF grand_total ON public.invoices
FOR EACH ROW
WHEN (NEW.doc_type = 'gst_invoice' AND OLD.grand_total IS DISTINCT FROM NEW.grand_total)
EXECUTE FUNCTION public.tg_sync_invoice_paid_state();

-- 7. Record a payment against an order (before the bill exists)
CREATE OR REPLACE FUNCTION public.record_order_payment_atomic(
  p_order_id uuid,
  p_amount numeric,
  p_mode payment_mode,
  p_paid_on date DEFAULT NULL,
  p_reference text DEFAULT '',
  p_note text DEFAULT '',
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  v_due := ROUND(GREATEST(v_order.total - COALESCE(v_order.scheme_savings,0), 0) - v_paid, 2);
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
$$;
REVOKE EXECUTE ON FUNCTION public.record_order_payment_atomic(uuid,numeric,payment_mode,date,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_order_payment_atomic(uuid,numeric,payment_mode,date,text,text,text) TO authenticated;

-- 8. Cancelling a payment now handles order-anchored receipts too
CREATE OR REPLACE FUNCTION public.void_invoice_payment_atomic(
  p_payment_id uuid,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_pay record;
  v_inv record;
  v_order record;
  v_paid numeric(14,2);
  v_credited numeric(14,2);
  v_due numeric(14,2);
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to cancel a payment.';
  END IF;
  IF COALESCE(TRIM(p_reason),'') = '' THEN RAISE EXCEPTION 'Say why this payment is being cancelled.'; END IF;

  SELECT * INTO v_pay FROM invoice_payments
   WHERE id = p_payment_id AND company_id = v_company FOR UPDATE;
  IF v_pay.id IS NULL THEN RAISE EXCEPTION 'Payment not found in your workspace.'; END IF;
  IF v_pay.status = 'voided' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', p_payment_id);
  END IF;

  UPDATE invoice_payments
     SET status = 'voided', voided_by = auth.uid(), voided_at = now(), void_reason = TRIM(p_reason)
   WHERE id = v_pay.id;

  IF v_pay.invoice_id IS NOT NULL THEN
    SELECT * INTO v_inv FROM invoices WHERE id = v_pay.invoice_id FOR UPDATE;

    SELECT COALESCE(SUM(amount),0) INTO v_paid
      FROM invoice_payments WHERE invoice_id = v_inv.id AND status = 'posted';
    SELECT COALESCE(SUM(grand_total),0) INTO v_credited
      FROM credit_notes WHERE invoice_id = v_inv.id;
    v_due := ROUND(v_inv.grand_total - v_paid - v_credited, 2);

    UPDATE invoices
       SET status = CASE WHEN v_due <= 0 THEN 'paid' WHEN v_paid > 0 THEN 'partial' ELSE 'posted' END,
           updated_at = now()
     WHERE id = v_inv.id;

    IF v_inv.source_order_id IS NOT NULL THEN
      UPDATE orders
         SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status
                                   WHEN v_paid > 0 THEN 'partial'::payment_status
                                   ELSE 'pending'::payment_status END,
             updated_at = now()
       WHERE id = v_inv.source_order_id AND company_id = v_company;
    END IF;
  ELSE
    SELECT * INTO v_order FROM orders WHERE id = v_pay.order_id FOR UPDATE;
    SELECT COALESCE(SUM(amount),0) INTO v_paid
      FROM invoice_payments WHERE order_id = v_order.id AND status = 'posted';
    v_due := ROUND(GREATEST(v_order.total - COALESCE(v_order.scheme_savings,0), 0) - v_paid, 2);

    UPDATE orders
       SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status
                                 WHEN v_paid > 0 THEN 'partial'::payment_status
                                 ELSE 'pending'::payment_status END,
           updated_at = now()
     WHERE id = v_order.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_pay.id, 'balance_due', v_due);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.void_invoice_payment_atomic(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.void_invoice_payment_atomic(uuid,text) TO authenticated;

-- 9. Backfill every dealer's outstanding with the canonical figure
UPDATE public.distributors d SET outstanding_amount = public.dealer_outstanding(d.id);