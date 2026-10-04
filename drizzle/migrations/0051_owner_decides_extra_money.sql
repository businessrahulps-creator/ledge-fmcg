ALTER TABLE public.invoice_payments DROP CONSTRAINT invoice_payments_status_check;
ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_status_check
  CHECK (status = ANY (ARRAY['posted','voided','refund_due','refunded']));
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS parent_payment_id uuid REFERENCES public.invoice_payments(id) ON DELETE RESTRICT;
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS extra_kind text NOT NULL DEFAULT ''
  CHECK (extra_kind IN ('','other_bill','dealer_credit','refund'));
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS refunded_by uuid;
CREATE INDEX IF NOT EXISTS invoice_payments_parent_idx ON public.invoice_payments(parent_payment_id);
ALTER TABLE public.invoice_payments DROP CONSTRAINT invoice_payments_one_anchor;
ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_one_anchor
  CHECK (num_nonnulls(invoice_id, order_id) = 1
         OR (invoice_id IS NULL AND order_id IS NULL AND extra_kind IN ('dealer_credit','refund') AND parent_payment_id IS NOT NULL));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_advance_action text NOT NULL DEFAULT ''
  CHECK (cancel_advance_action IN ('','apply_to_dues','refund'));

-- Puts money beyond what is due where the owner chose. Called inside payment functions only.
CREATE OR REPLACE FUNCTION public._place_extra_money(
  p_company uuid, p_dealer uuid, p_parent uuid, p_amount numeric, p_action text,
  p_mode payment_mode, p_paid_on date, p_reference text, p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_left numeric(14,2) := ROUND(p_amount, 2);
  v_bill record;
  v_take numeric(14,2);
  v_applied numeric(14,2) := 0;
BEGIN
  IF v_left <= 0 THEN RETURN jsonb_build_object('extra', 0); END IF;
  IF p_action = 'apply_other_bills' THEN
    FOR v_bill IN
      SELECT i.id, i.source_order_id,
             ROUND(i.grand_total
               - COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id AND status = 'posted'),0)
               - COALESCE((SELECT SUM(grand_total) FROM credit_notes WHERE invoice_id = i.id),0), 2) AS due
        FROM invoices i JOIN orders o ON o.id = i.source_order_id
       WHERE i.company_id = p_company AND o.distributor_id = p_dealer
         AND i.doc_type = 'gst_invoice' AND i.status <> 'draft'
       ORDER BY i.invoice_date, i.created_at, i.id
       FOR UPDATE OF i
    LOOP
      EXIT WHEN v_left <= 0;
      CONTINUE WHEN v_bill.due <= 0;
      v_take := LEAST(v_left, v_bill.due);
      INSERT INTO invoice_payments (company_id, invoice_id, distributor_id, amount, mode, paid_on,
        reference, note, status, posted_by, posted_at, parent_payment_id, extra_kind)
      VALUES (p_company, v_bill.id, p_dealer, v_take, p_mode, p_paid_on, COALESCE(p_reference,''),
        TRIM(COALESCE(p_note,'') || ' (extra from an earlier payment)'), 'posted', auth.uid(), now(), p_parent, 'other_bill');
      UPDATE invoices SET status = CASE WHEN ROUND(v_bill.due - v_take,2) <= 0 THEN 'paid' ELSE 'partial' END, updated_at = now()
       WHERE id = v_bill.id;
      UPDATE orders SET payment_status = CASE WHEN ROUND(v_bill.due - v_take,2) <= 0 THEN 'paid'::payment_status ELSE 'partial'::payment_status END,
             updated_at = now() WHERE id = v_bill.source_order_id;
      v_left := v_left - v_take; v_applied := v_applied + v_take;
    END LOOP;
    IF v_left > 0 THEN
      INSERT INTO invoice_payments (company_id, distributor_id, amount, mode, paid_on, reference, note, status,
        posted_by, posted_at, parent_payment_id, extra_kind)
      VALUES (p_company, p_dealer, v_left, p_mode, p_paid_on, COALESCE(p_reference,''),
        TRIM(COALESCE(p_note,'') || ' (extra kept as dealer credit)'), 'posted', auth.uid(), now(), p_parent, 'dealer_credit');
    END IF;
  ELSIF p_action = 'dealer_credit' THEN
    INSERT INTO invoice_payments (company_id, distributor_id, amount, mode, paid_on, reference, note, status,
      posted_by, posted_at, parent_payment_id, extra_kind)
    VALUES (p_company, p_dealer, v_left, p_mode, p_paid_on, COALESCE(p_reference,''),
      TRIM(COALESCE(p_note,'') || ' (extra kept as dealer credit)'), 'posted', auth.uid(), now(), p_parent, 'dealer_credit');
  ELSIF p_action = 'refund' THEN
    INSERT INTO invoice_payments (company_id, distributor_id, amount, mode, paid_on, reference, note, status,
      posted_by, posted_at, parent_payment_id, extra_kind)
    VALUES (p_company, p_dealer, v_left, p_mode, p_paid_on, COALESCE(p_reference,''),
      TRIM(COALESCE(p_note,'') || ' (extra to give back)'), 'refund_due', auth.uid(), now(), p_parent, 'refund');
  ELSE
    RAISE EXCEPTION 'Choose what to do with the extra money.';
  END IF;
  RETURN jsonb_build_object('extra', ROUND(p_amount,2), 'applied_to_other_bills', v_applied);
END $$;
REVOKE ALL ON FUNCTION public._place_extra_money(uuid,uuid,uuid,numeric,text,payment_mode,date,text,text) FROM PUBLIC, anon, authenticated;

DROP FUNCTION public.record_invoice_payment_atomic(uuid, numeric, payment_mode, date, text, text, text);
CREATE FUNCTION public.record_invoice_payment_atomic(p_invoice_id uuid, p_amount numeric, p_mode payment_mode,
  p_paid_on date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'))::date, p_reference text DEFAULT '', p_note text DEFAULT '',
  p_idempotency_key text DEFAULT NULL, p_extra_action text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_inv record; v_dealer uuid;
  v_paid numeric(14,2); v_credited numeric(14,2); v_due numeric(14,2);
  v_amount numeric(14,2) := ROUND(COALESCE(p_amount,0)::numeric, 2);
  v_main numeric(14,2); v_extra numeric(14,2) := 0;
  v_existing uuid; v_id uuid; v_on date := COALESCE(p_paid_on, ((now() AT TIME ZONE 'Asia/Kolkata')::date));
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to record payments.';
  END IF;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Enter an amount above zero.'; END IF;
  IF v_on > ((now() AT TIME ZONE 'Asia/Kolkata')::date) THEN RAISE EXCEPTION 'The payment date cannot be in the future.'; END IF;
  IF p_extra_action IS NOT NULL AND p_extra_action NOT IN ('apply_other_bills','dealer_credit','refund') THEN
    RAISE EXCEPTION 'Choose what to do with the extra money.';
  END IF;

  IF NULLIF(p_idempotency_key,'') IS NOT NULL THEN
    SELECT id INTO v_existing FROM invoice_payments WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', v_existing); END IF;
  END IF;

  PERFORM 1 FROM orders o JOIN invoices i ON i.source_order_id = o.id
   WHERE i.id = p_invoice_id AND i.company_id = v_company FOR UPDATE OF o;
  SELECT * INTO v_inv FROM invoices WHERE id = p_invoice_id AND company_id = v_company FOR UPDATE;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'Bill not found in your workspace.'; END IF;
  IF NULLIF(p_idempotency_key,'') IS NOT NULL THEN
    SELECT id INTO v_existing FROM invoice_payments WHERE company_id = v_company AND idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', v_existing); END IF;
  END IF;
  IF v_inv.doc_type <> 'gst_invoice' THEN RAISE EXCEPTION 'Payments can only be recorded against a GST bill.'; END IF;
  IF v_inv.status = 'draft' THEN RAISE EXCEPTION 'This bill is not final yet.'; END IF;

  SELECT distributor_id INTO v_dealer FROM orders WHERE id = v_inv.source_order_id AND company_id = v_company;
  IF v_dealer IS NULL THEN RAISE EXCEPTION 'Could not work out which dealer this bill belongs to.'; END IF;

  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM invoice_payments WHERE invoice_id = v_inv.id AND status = 'posted';
  SELECT COALESCE(SUM(grand_total),0) INTO v_credited FROM credit_notes WHERE invoice_id = v_inv.id;
  v_due := GREATEST(ROUND(v_inv.grand_total - v_paid - v_credited, 2), 0);

  IF v_amount > v_due THEN
    IF p_extra_action IS NULL THEN
      RAISE EXCEPTION 'EXTRA_CHOICE_NEEDED: That is % more than the % still due on this bill. Choose what to do with the extra.',
        TO_CHAR(v_amount - v_due, 'FM999,999,990.00'), TO_CHAR(v_due, 'FM999,999,990.00');
    END IF;
    v_main := v_due; v_extra := v_amount - v_due;
  ELSE
    v_main := v_amount;
  END IF;

  -- The whole receipt is one parent row when the bill takes something; otherwise the parent is the extra row itself.
  IF v_main > 0 THEN
    INSERT INTO invoice_payments (company_id, invoice_id, distributor_id, amount, mode, paid_on,
      reference, note, status, idempotency_key, posted_by, posted_at)
    VALUES (v_company, v_inv.id, v_dealer, v_main, p_mode, v_on, COALESCE(p_reference,''), COALESCE(p_note,''),
      'posted', NULLIF(p_idempotency_key,''), auth.uid(), now()) RETURNING id INTO v_id;
    UPDATE invoices SET status = CASE WHEN ROUND(v_due - v_main, 2) <= 0 THEN 'paid' ELSE 'partial' END, updated_at = now()
     WHERE id = v_inv.id;
    IF v_inv.source_order_id IS NOT NULL THEN
      UPDATE orders SET payment_status = CASE WHEN ROUND(v_due - v_main, 2) <= 0 THEN 'paid'::payment_status ELSE 'partial'::payment_status END,
             payment_mode = p_mode, updated_at = now()
       WHERE id = v_inv.source_order_id AND company_id = v_company;
    END IF;
    IF v_extra > 0 THEN
      PERFORM public._place_extra_money(v_company, v_dealer, v_id, v_extra, p_extra_action, p_mode, v_on, p_reference, p_note);
    END IF;
  ELSE
    -- Bill already settled: only extra money. Anchor it on this bill as the parent record of where it went.
    RAISE EXCEPTION 'This bill is already settled in full. Record the money against another bill.';
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_id, 'invoice_id', v_inv.id, 'amount', v_amount,
    'extra', v_extra, 'balance_due', ROUND(v_due - v_main, 2));
END;
$function$;
REVOKE ALL ON FUNCTION public.record_invoice_payment_atomic(uuid,numeric,payment_mode,date,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment_atomic(uuid,numeric,payment_mode,date,text,text,text,text) TO authenticated;

DROP FUNCTION public.record_order_payment_atomic(uuid, numeric, payment_mode, date, text, text, text);
CREATE FUNCTION public.record_order_payment_atomic(p_order_id uuid, p_amount numeric, p_mode payment_mode,
  p_paid_on date DEFAULT NULL, p_reference text DEFAULT '', p_note text DEFAULT '',
  p_idempotency_key text DEFAULT NULL, p_extra_action text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE; v_inv uuid;
  v_paid numeric(14,2); v_due numeric(14,2);
  v_amount numeric(14,2) := ROUND(COALESCE(p_amount,0), 2);
  v_main numeric(14,2); v_extra numeric(14,2) := 0;
  v_id uuid; v_on date := COALESCE(p_paid_on, ((now() AT TIME ZONE 'Asia/Kolkata')::date));
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to record a payment.';
  END IF;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'Enter the amount received.'; END IF;
  IF v_on > ((now() AT TIME ZONE 'Asia/Kolkata')::date) THEN RAISE EXCEPTION 'A payment cannot be dated in the future.'; END IF;
  IF p_extra_action IS NOT NULL AND p_extra_action NOT IN ('apply_other_bills','dealer_credit','refund') THEN
    RAISE EXCEPTION 'Choose what to do with the extra money.';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found in your workspace.'; END IF;
  IF v_order.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'This order was cancelled.'; END IF;
  IF NULLIF(p_idempotency_key,'') IS NOT NULL THEN
    SELECT id INTO v_id FROM invoice_payments WHERE company_id = v_company AND idempotency_key = p_idempotency_key LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'payment_id', v_id, 'order_id', p_order_id, 'replayed', true); END IF;
  END IF;

  SELECT id INTO v_inv FROM invoices WHERE source_order_id = p_order_id AND doc_type = 'gst_invoice' AND status <> 'draft';
  IF v_inv IS NOT NULL THEN
    RETURN public.record_invoice_payment_atomic(v_inv, v_amount, p_mode, v_on, p_reference, p_note, p_idempotency_key, p_extra_action);
  END IF;

  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM invoice_payments WHERE order_id = p_order_id AND status = 'posted';
  v_due := GREATEST(ROUND(public.order_bill_equivalent(p_order_id) - v_paid, 2), 0);
  IF v_due <= 0 THEN RAISE EXCEPTION 'This order is already paid in full.'; END IF;
  IF v_amount > v_due THEN
    IF p_extra_action IS NULL THEN
      RAISE EXCEPTION 'EXTRA_CHOICE_NEEDED: That is % more than the % still due on this order. Choose what to do with the extra.',
        TO_CHAR(v_amount - v_due, 'FM999,999,990.00'), TO_CHAR(v_due, 'FM999,999,990.00');
    END IF;
    v_main := v_due; v_extra := v_amount - v_due;
  ELSE v_main := v_amount; END IF;

  INSERT INTO invoice_payments (company_id, invoice_id, order_id, distributor_id, amount, mode, paid_on,
    reference, note, status, idempotency_key, posted_by, posted_at)
  VALUES (v_company, NULL, p_order_id, v_order.distributor_id, v_main, p_mode, v_on, COALESCE(p_reference,''), COALESCE(p_note,''),
    'posted', NULLIF(p_idempotency_key,''), auth.uid(), now()) RETURNING id INTO v_id;

  UPDATE orders SET payment_status = CASE WHEN ROUND(v_due - v_main, 2) <= 0 THEN 'paid'::payment_status ELSE 'partial'::payment_status END,
         payment_mode = p_mode, updated_at = now()
   WHERE id = p_order_id;

  IF v_extra > 0 THEN
    PERFORM public._place_extra_money(v_company, v_order.distributor_id, v_id, v_extra, p_extra_action, p_mode, v_on, p_reference, p_note);
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_id, 'order_id', p_order_id, 'amount', v_amount,
    'extra', v_extra, 'balance_due', ROUND(v_due - v_main, 2));
END;
$function$;
REVOKE ALL ON FUNCTION public.record_order_payment_atomic(uuid,numeric,payment_mode,date,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_order_payment_atomic(uuid,numeric,payment_mode,date,text,text,text,text) TO authenticated;

-- Voiding a payment also voids everything its extra money was turned into.
CREATE OR REPLACE FUNCTION public.void_invoice_payment_atomic(p_payment_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_pay record; v_inv record; v_order record; v_child record;
  v_paid numeric(14,2); v_credited numeric(14,2); v_due numeric(14,2);
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to cancel a payment.';
  END IF;
  IF COALESCE(TRIM(p_reason),'') = '' THEN RAISE EXCEPTION 'Say why this payment is being cancelled.'; END IF;

  SELECT * INTO v_pay FROM invoice_payments WHERE id = p_payment_id AND company_id = v_company;
  IF v_pay.id IS NULL THEN RAISE EXCEPTION 'Payment not found in your workspace.'; END IF;
  IF v_pay.status = 'voided' THEN RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', p_payment_id); END IF;
  IF v_pay.status = 'refunded' THEN RAISE EXCEPTION 'This money was already given back, so it cannot be cancelled.'; END IF;

  -- Lock order before bill before payment, same order as the payment functions.
  IF v_pay.invoice_id IS NOT NULL THEN
    PERFORM 1 FROM orders o JOIN invoices i ON i.source_order_id = o.id WHERE i.id = v_pay.invoice_id FOR UPDATE OF o;
    PERFORM 1 FROM invoices WHERE id = v_pay.invoice_id FOR UPDATE;
  ELSIF v_pay.order_id IS NOT NULL THEN
    PERFORM 1 FROM orders WHERE id = v_pay.order_id FOR UPDATE;
  END IF;
  SELECT * INTO v_pay FROM invoice_payments WHERE id = p_payment_id FOR UPDATE;
  IF v_pay.status = 'voided' THEN RETURN jsonb_build_object('ok', true, 'already', true, 'payment_id', p_payment_id); END IF;

  FOR v_child IN SELECT id FROM invoice_payments WHERE parent_payment_id = v_pay.id AND status IN ('posted','refund_due') LOOP
    PERFORM public.void_invoice_payment_atomic(v_child.id, p_reason);
  END LOOP;
  IF EXISTS (SELECT 1 FROM invoice_payments WHERE parent_payment_id = v_pay.id AND status = 'refunded') THEN
    RAISE EXCEPTION 'Part of this payment was already given back, so it cannot be cancelled.';
  END IF;

  UPDATE invoice_payments SET status = 'voided', voided_by = auth.uid(), voided_at = now(), void_reason = TRIM(p_reason)
   WHERE id = v_pay.id;

  IF v_pay.invoice_id IS NOT NULL THEN
    SELECT * INTO v_inv FROM invoices WHERE id = v_pay.invoice_id;
    SELECT COALESCE(SUM(amount),0) INTO v_paid FROM invoice_payments WHERE invoice_id = v_inv.id AND status = 'posted';
    SELECT COALESCE(SUM(grand_total),0) INTO v_credited FROM credit_notes WHERE invoice_id = v_inv.id;
    v_due := ROUND(v_inv.grand_total - v_paid - v_credited, 2);
    UPDATE invoices SET status = CASE WHEN v_due <= 0 THEN 'paid' WHEN v_paid > 0 THEN 'partial' ELSE 'posted' END, updated_at = now()
     WHERE id = v_inv.id;
    IF v_inv.source_order_id IS NOT NULL THEN
      UPDATE orders SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status WHEN v_paid > 0 THEN 'partial'::payment_status ELSE 'pending'::payment_status END,
             updated_at = now()
       WHERE id = v_inv.source_order_id AND company_id = v_company;
    END IF;
  ELSIF v_pay.order_id IS NOT NULL THEN
    SELECT * INTO v_order FROM orders WHERE id = v_pay.order_id;
    SELECT COALESCE(SUM(amount),0) INTO v_paid FROM invoice_payments WHERE order_id = v_order.id AND status = 'posted';
    v_due := ROUND(COALESCE(public.order_bill_equivalent(v_order.id), 0) - v_paid, 2);
    UPDATE orders SET payment_status = CASE WHEN v_due <= 0 THEN 'paid'::payment_status WHEN v_paid > 0 THEN 'partial'::payment_status ELSE 'pending'::payment_status END,
           updated_at = now()
     WHERE id = v_order.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_pay.id, 'balance_due', v_due);
END;
$function$;

-- Owner records that money waiting to be given back was handed over.
CREATE OR REPLACE FUNCTION public.mark_money_given_back_atomic(p_payment_id uuid, p_note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_company uuid := public.get_company_id(); v_pay record;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
    RAISE EXCEPTION 'You do not have permission to record money given back.';
  END IF;
  SELECT * INTO v_pay FROM invoice_payments WHERE id = p_payment_id AND company_id = v_company FOR UPDATE;
  IF v_pay.id IS NULL THEN RAISE EXCEPTION 'Payment not found in your workspace.'; END IF;
  IF v_pay.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;
  IF v_pay.status <> 'refund_due' THEN RAISE EXCEPTION 'This money is not waiting to be given back.'; END IF;
  UPDATE invoice_payments SET status = 'refunded', refunded_at = now(), refunded_by = auth.uid(),
         note = TRIM(note || CASE WHEN COALESCE(TRIM(p_note),'') <> '' THEN ' — given back: ' || TRIM(p_note) ELSE '' END)
   WHERE id = v_pay.id;
  RETURN jsonb_build_object('ok', true, 'payment_id', v_pay.id);
END $$;
REVOKE ALL ON FUNCTION public.mark_money_given_back_atomic(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_money_given_back_atomic(uuid,text) TO authenticated;

-- Cancelling an order that holds advance money needs the owner's choice.
DROP FUNCTION public.cancel_order_atomic(uuid, text);
CREATE FUNCTION public.cancel_order_atomic(p_order_id uuid, p_reason text, p_advance_action text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_company uuid := public.get_company_id();
  v_order orders%ROWTYPE;
  v_advance numeric(14,2);
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF public.has_role(auth.uid(), 'viewer'::app_role) THEN RAISE EXCEPTION 'You do not have permission to cancel orders.'; END IF;
  IF p_advance_action IS NOT NULL AND p_advance_action NOT IN ('apply_to_dues','refund') THEN
    RAISE EXCEPTION 'Choose what to do with the advance money.';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.company_id <> v_company THEN RAISE EXCEPTION 'Order not found in your workspace.'; END IF;
  IF v_order.cancelled_at IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'already_done', true); END IF;
  IF v_order.delivery_status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been dispatched, so it cannot be cancelled. Record a return instead.';
  END IF;

  SELECT COALESCE(SUM(amount),0) INTO v_advance FROM invoice_payments WHERE order_id = p_order_id AND status = 'posted';
  IF v_advance > 0 THEN
    IF p_advance_action IS NULL THEN
      RAISE EXCEPTION 'ADVANCE_CHOICE_NEEDED: This order holds % of advance money. Choose whether to keep it against what the dealer owes or give it back.',
        TO_CHAR(v_advance, 'FM999,999,990.00');
    END IF;
    IF p_advance_action = 'apply_to_dues' AND NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
      NULL; -- keeping money where it is needs no money access
    END IF;
    IF p_advance_action = 'refund' THEN
      IF NOT public.has_capability(auth.uid(), 'see_money'::capability_key) THEN
        RAISE EXCEPTION 'Only someone with money access can mark advance money to give back.';
      END IF;
      UPDATE invoice_payments SET status = 'refund_due', extra_kind = 'refund'
       WHERE order_id = p_order_id AND status = 'posted';
    END IF;
  END IF;

  UPDATE orders SET cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = COALESCE(p_reason, ''),
         cancel_advance_action = CASE WHEN v_advance > 0 THEN p_advance_action ELSE '' END
   WHERE id = p_order_id;
  RETURN jsonb_build_object('ok', true, 'advance', v_advance, 'advance_action', p_advance_action);
END;
$function$;
REVOKE ALL ON FUNCTION public.cancel_order_atomic(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(uuid,text,text) TO authenticated;
