CREATE OR REPLACE FUNCTION public._place_extra_money(p_company uuid, p_dealer uuid, p_parent uuid, p_amount numeric, p_action text, p_mode payment_mode, p_paid_on date, p_reference text, p_note text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_left numeric(14,2) := ROUND(p_amount, 2);
  v_bill record; v_due numeric(14,2); v_take numeric(14,2); v_applied numeric(14,2) := 0;
BEGIN
  IF v_left <= 0 THEN RETURN jsonb_build_object('extra', 0); END IF;
  IF p_action = 'refund' AND p_mode = 'cash' THEN
    RAISE EXCEPTION 'Give cash change at the counter and record only the amount due.';
  END IF;
  IF p_action = 'apply_other_bills' THEN
    FOR v_bill IN
      SELECT i.id, i.source_order_id
        FROM invoices i JOIN orders o ON o.id = i.source_order_id
       WHERE i.company_id = p_company AND o.distributor_id = p_dealer AND o.cancelled_at IS NULL
         AND i.doc_type = 'gst_invoice' AND i.status IN ('posted','partial')
       ORDER BY i.invoice_date, i.created_at, i.id
    LOOP
      EXIT WHEN v_left <= 0;
      v_due := ROUND((SELECT grand_total FROM invoices WHERE id = v_bill.id)
               - COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = v_bill.id AND status = 'posted'),0)
               - COALESCE((SELECT SUM(grand_total) FROM credit_notes WHERE invoice_id = v_bill.id),0), 2);
      CONTINUE WHEN v_due <= 0;
      v_take := LEAST(v_left, v_due);
      INSERT INTO invoice_payments (company_id, invoice_id, distributor_id, amount, mode, paid_on,
        reference, note, status, posted_by, posted_at, parent_payment_id, extra_kind)
      VALUES (p_company, v_bill.id, p_dealer, v_take, p_mode, p_paid_on, COALESCE(p_reference,''),
        TRIM(COALESCE(p_note,'') || ' (extra from an earlier payment)'), 'posted', auth.uid(), now(), p_parent, 'other_bill');
      UPDATE invoices SET status = CASE WHEN ROUND(v_due - v_take,2) <= 0 THEN 'paid' ELSE 'partial' END, updated_at = now()
       WHERE id = v_bill.id;
      UPDATE orders SET payment_status = CASE WHEN ROUND(v_due - v_take,2) <= 0 THEN 'paid'::payment_status ELSE 'partial'::payment_status END,
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
END $function$;
REVOKE ALL ON FUNCTION public._place_extra_money(uuid,uuid,uuid,numeric,text,payment_mode,date,text,text) FROM PUBLIC, anon, authenticated;