CREATE OR REPLACE FUNCTION public.dealer_outstanding(p_dealer uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT GREATEST(
    COALESCE((SELECT SUM(i.grand_total) FROM invoices i
                JOIN orders o ON o.id = i.source_order_id
               WHERE o.distributor_id = p_dealer AND i.doc_type = 'gst_invoice'
                 AND i.status <> 'draft'), 0)
  - COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
               WHERE ip.distributor_id = p_dealer AND ip.status = 'posted'), 0)
  - COALESCE((SELECT SUM(cn.grand_total) FROM credit_notes cn
               WHERE cn.distributor_id = p_dealer), 0)
  , 0)::numeric(14,2)
$function$;
REVOKE ALL ON FUNCTION public.dealer_outstanding(uuid) FROM PUBLIC, anon, authenticated;