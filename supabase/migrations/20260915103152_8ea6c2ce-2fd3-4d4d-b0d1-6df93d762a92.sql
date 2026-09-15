-- One definition of "what a dealer owes": bills - posted receipts (any anchor) - credit notes.

-- 1. The dealer_balances view now matches dealer_outstanding() exactly: it counts
--    advances taken on orders that are not billed yet, which it previously ignored.
CREATE OR REPLACE VIEW public.dealer_balances
WITH (security_invoker = true) AS
SELECT
  d.id           AS distributor_id,
  d.company_id,
  d.name         AS distributor_name,
  d.credit_limit,
  COALESCE((SELECT SUM(i.grand_total) FROM public.invoices i
              JOIN public.orders o ON o.id = i.source_order_id
             WHERE o.distributor_id = d.id AND i.doc_type = 'gst_invoice'), 0)::numeric(14,2) AS billed_total,
  COALESCE((SELECT SUM(ip.amount) FROM public.invoice_payments ip
             WHERE ip.distributor_id = d.id AND ip.status = 'posted'), 0)::numeric(14,2)      AS received_total,
  COALESCE((SELECT SUM(cn.grand_total) FROM public.credit_notes cn
             WHERE cn.distributor_id = d.id), 0)::numeric(14,2)                                AS credited_total,
  GREATEST(
      COALESCE((SELECT SUM(i.grand_total) FROM public.invoices i
                  JOIN public.orders o ON o.id = i.source_order_id
                 WHERE o.distributor_id = d.id AND i.doc_type = 'gst_invoice'), 0)
    - COALESCE((SELECT SUM(ip.amount) FROM public.invoice_payments ip
                 WHERE ip.distributor_id = d.id AND ip.status = 'posted'), 0)
    - COALESCE((SELECT SUM(cn.grand_total) FROM public.credit_notes cn
                 WHERE cn.distributor_id = d.id), 0)
  , 0)::numeric(14,2) AS balance_due
FROM public.distributors d;

GRANT SELECT ON public.dealer_balances TO authenticated;
GRANT SELECT ON public.dealer_balances TO service_role;

-- 2. The credit-limit gate inside dispatch_and_bill_order_atomic re-implemented the
--    same sum a third time and ignored order-anchored advances. Point it at the one
--    canonical function instead, patching the live definition in place so nothing
--    else in that function changes.
DO $do$
DECLARE
  v_def text;
  v_old text;
  v_new text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_def
    FROM pg_proc WHERE proname = 'dispatch_and_bill_order_atomic'
     AND pronamespace = 'public'::regnamespace;

  v_old := '    SELECT COALESCE(SUM(i.grand_total), 0)
         - COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
                      JOIN invoices i2 ON i2.id = ip.invoice_id
                      JOIN orders o2 ON o2.id = i2.source_order_id
                     WHERE o2.distributor_id = v_dealer.id AND ip.status = ''posted''), 0)
         - COALESCE((SELECT SUM(cn.grand_total) FROM credit_notes cn
                     WHERE cn.distributor_id = v_dealer.id), 0)
      INTO v_outstanding
      FROM invoices i JOIN orders o ON o.id = i.source_order_id
     WHERE o.distributor_id = v_dealer.id AND i.doc_type = ''gst_invoice'';';

  v_new := '    v_outstanding := public.dealer_outstanding(v_dealer.id);';

  IF position(v_old in v_def) = 0 THEN
    RAISE EXCEPTION 'Credit-limit block not found in dispatch_and_bill_order_atomic — aborting.';
  END IF;

  EXECUTE replace(v_def, v_old, v_new);
END
$do$;
