CREATE OR REPLACE VIEW public.dealer_balances WITH (security_invoker = true) AS
SELECT d.id AS distributor_id,
       d.company_id,
       d.name AS distributor_name,
       d.credit_limit,
       b.billed::numeric(14,2) AS billed_total,
       r.received::numeric(14,2) AS received_total,
       c.credited::numeric(14,2) AS credited_total,
       GREATEST(b.billed - r.received - c.credited, 0::numeric)::numeric(14,2) AS balance_due
  FROM distributors d
  CROSS JOIN LATERAL (SELECT COALESCE(sum(i.grand_total), 0::numeric) AS billed
                        FROM orders o JOIN invoices i ON i.source_order_id = o.id
                       WHERE o.distributor_id = d.id AND i.doc_type = 'gst_invoice'::text) b
  CROSS JOIN LATERAL (SELECT COALESCE(sum(ip.amount), 0::numeric) AS received
                        FROM invoice_payments ip
                       WHERE ip.distributor_id = d.id AND ip.status = 'posted'::text) r
  CROSS JOIN LATERAL (SELECT COALESCE(sum(cn.grand_total), 0::numeric) AS credited
                        FROM credit_notes cn
                       WHERE cn.distributor_id = d.id) c;