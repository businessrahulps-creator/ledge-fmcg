CREATE OR REPLACE FUNCTION public.void_invoice_payment_atomic(p_payment_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Lock order before bill, same as the payment functions, so they can't deadlock.
    PERFORM 1 FROM orders o JOIN invoices i ON i.source_order_id = o.id WHERE i.id = v_pay.invoice_id FOR UPDATE OF o;
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
    v_due := ROUND(COALESCE(public.order_bill_equivalent(v_order.id), 0) - v_paid, 2);

    UPDATE orders
       SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status
                                 WHEN v_paid > 0 THEN 'partial'::payment_status
                                 ELSE 'pending'::payment_status END,
           updated_at = now()
     WHERE id = v_order.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_pay.id, 'balance_due', v_due);
END;
$function$;