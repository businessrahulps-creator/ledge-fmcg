-- Some bills carried the scheme discount only in the header, so line taxable values
-- summed higher than the bill subtotal. Allocate the header discount across lines
-- proportionally to gross, then recompute tax and line totals. Headers stay authoritative.
WITH totals AS (
  SELECT l.invoice_id,
         SUM(COALESCE(l.gross_amount, l.taxable_value)) AS gross_sum
  FROM public.invoice_lines l
  GROUP BY l.invoice_id
)
UPDATE public.invoice_lines l
SET
  discount_amount = ROUND(COALESCE(l.gross_amount, l.taxable_value) * (1 - i.subtotal / t.gross_sum), 2),
  taxable_value = ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum), 2),
  cgst_amount = CASE WHEN i.supply_type = 'intra_state'
    THEN ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum) * COALESCE(l.gst_rate, i.gst_rate) / 200.0, 2) ELSE 0 END,
  sgst_amount = CASE WHEN i.supply_type = 'intra_state'
    THEN ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum) * COALESCE(l.gst_rate, i.gst_rate) / 200.0, 2) ELSE 0 END,
  igst_amount = CASE WHEN i.supply_type <> 'intra_state'
    THEN ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum) * COALESCE(l.gst_rate, i.gst_rate) / 100.0, 2) ELSE 0 END,
  line_total = ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum), 2)
    + CASE WHEN i.supply_type = 'intra_state'
        THEN 2 * ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum) * COALESCE(l.gst_rate, i.gst_rate) / 200.0, 2)
        ELSE ROUND(COALESCE(l.gross_amount, l.taxable_value) * (i.subtotal / t.gross_sum) * COALESCE(l.gst_rate, i.gst_rate) / 100.0, 2) END
FROM public.invoices i, totals t
WHERE i.id = l.invoice_id
  AND t.invoice_id = l.invoice_id
  AND i.doc_type = 'gst_invoice'
  AND t.gross_sum > 0
  AND i.subtotal > 0
  AND ABS(t.gross_sum - i.subtotal) > 1;