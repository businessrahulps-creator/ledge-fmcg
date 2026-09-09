-- Phase 3: delivery proof, real receipts, honest balances

CREATE OR REPLACE FUNCTION public.mark_order_delivered_atomic(
  p_order_id uuid,
  p_delivered_on timestamptz DEFAULT now(),
  p_note text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_order record;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;

  SELECT * INTO v_order FROM orders
   WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found in your workspace.'; END IF;
  IF v_order.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'This order was cancelled.'; END IF;
  IF v_order.delivery_status = 'delivered' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'order_id', p_order_id);
  END IF;
  IF v_order.delivery_status <> 'dispatched' THEN
    RAISE EXCEPTION 'Dispatch and bill this order before marking it delivered.';
  END IF;

  UPDATE orders
     SET delivery_status = 'delivered',
         delivered_at = COALESCE(p_delivered_on, now()),
         dispatch_remarks = CASE WHEN COALESCE(p_note,'') = '' THEN dispatch_remarks
                                 ELSE TRIM(BOTH E'\n' FROM COALESCE(dispatch_remarks,'') || E'\n' || p_note) END,
         updated_at = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_order_delivered_atomic(uuid,timestamptz,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_order_delivered_atomic(uuid,timestamptz,text) TO authenticated;


CREATE OR REPLACE FUNCTION public.record_invoice_payment_atomic(
  p_invoice_id uuid,
  p_amount numeric,
  p_mode payment_mode,
  p_paid_on date DEFAULT CURRENT_DATE,
  p_reference text DEFAULT '',
  p_note text DEFAULT '',
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_inv record;
  v_dealer uuid;
  v_paid numeric(14,2);
  v_credited numeric(14,2);
  v_due numeric(14,2);
  v_amount numeric(14,2) := ROUND(COALESCE(p_amount,0)::numeric, 2);
  v_existing uuid;
  v_id uuid;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to record payments.';
  END IF;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Enter an amount above zero.'; END IF;
  IF p_paid_on > CURRENT_DATE THEN RAISE EXCEPTION 'The payment date cannot be in the future.'; END IF;

  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id INTO v_existing FROM invoice_payments
     WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN
      RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', v_existing);
    END IF;
  END IF;

  SELECT * INTO v_inv FROM invoices
   WHERE id = p_invoice_id AND company_id = v_company FOR UPDATE;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'Bill not found in your workspace.'; END IF;
  IF v_inv.doc_type <> 'gst_invoice' THEN RAISE EXCEPTION 'Payments can only be recorded against a GST bill.'; END IF;

  SELECT distributor_id INTO v_dealer FROM orders WHERE id = v_inv.source_order_id;
  IF v_dealer IS NULL THEN
    SELECT id INTO v_dealer FROM distributors
     WHERE company_id = v_company AND name = v_inv.buyer_name LIMIT 1;
  END IF;
  IF v_dealer IS NULL THEN RAISE EXCEPTION 'Could not work out which dealer this bill belongs to.'; END IF;

  SELECT COALESCE(SUM(amount),0)::numeric(14,2) INTO v_paid
    FROM invoice_payments WHERE invoice_id = v_inv.id AND status = 'posted';
  SELECT COALESCE(SUM(grand_total),0)::numeric(14,2) INTO v_credited
    FROM credit_notes WHERE invoice_id = v_inv.id;

  v_due := ROUND(v_inv.grand_total - v_paid - v_credited, 2);
  IF v_due <= 0 THEN RAISE EXCEPTION 'This bill is already settled in full.'; END IF;
  IF v_amount > v_due THEN
    RAISE EXCEPTION 'That is more than the % still due on this bill.', TO_CHAR(v_due, 'FM999,999,990.00');
  END IF;

  INSERT INTO invoice_payments (
    company_id, invoice_id, distributor_id, amount, mode, paid_on,
    reference, note, status, idempotency_key, posted_by, posted_at
  ) VALUES (
    v_company, v_inv.id, v_dealer, v_amount, p_mode, COALESCE(p_paid_on, CURRENT_DATE),
    COALESCE(p_reference,''), COALESCE(p_note,''), 'posted',
    NULLIF(COALESCE(p_idempotency_key,''),''), auth.uid(), now()
  ) RETURNING id INTO v_id;

  UPDATE invoices SET status = CASE WHEN ROUND(v_due - v_amount, 2) <= 0 THEN 'paid' ELSE 'partial' END,
                      updated_at = now()
   WHERE id = v_inv.id;

  IF v_inv.source_order_id IS NOT NULL THEN
    UPDATE orders
       SET payment_status = CASE WHEN ROUND(v_due - v_amount, 2) <= 0 THEN 'paid'::payment_status
                                 ELSE 'partial'::payment_status END,
           payment_mode = p_mode,
           updated_at = now()
     WHERE id = v_inv.source_order_id AND company_id = v_company;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'payment_id', v_id, 'invoice_id', v_inv.id,
    'amount', v_amount, 'balance_due', ROUND(v_due - v_amount, 2)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_invoice_payment_atomic(uuid,numeric,payment_mode,date,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment_atomic(uuid,numeric,payment_mode,date,text,text,text) TO authenticated;


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

  SELECT * INTO v_inv FROM invoices WHERE id = v_pay.invoice_id FOR UPDATE;

  UPDATE invoice_payments
     SET status = 'voided', voided_by = auth.uid(), voided_at = now(), void_reason = TRIM(p_reason)
   WHERE id = v_pay.id;

  SELECT COALESCE(SUM(amount),0)::numeric(14,2) INTO v_paid
    FROM invoice_payments WHERE invoice_id = v_inv.id AND status = 'posted';
  SELECT COALESCE(SUM(grand_total),0)::numeric(14,2) INTO v_credited
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

  RETURN jsonb_build_object('ok', true, 'payment_id', v_pay.id, 'balance_due', v_due);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.void_invoice_payment_atomic(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.void_invoice_payment_atomic(uuid,text) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_idem_uniq
  ON public.invoice_payments (company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
