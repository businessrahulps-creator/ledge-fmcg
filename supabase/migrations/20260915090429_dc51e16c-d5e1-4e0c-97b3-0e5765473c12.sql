-- Seed/legacy repair: invoice_lines carried taxable value only, so printed lines
-- never added up to the GST-inclusive bill total. Recompute per line from the
-- line's own rate (falling back to the bill's rate) and the bill's supply type.
-- Header totals are authoritative and are NOT touched.
UPDATE public.invoice_lines l
SET
  gst_rate = COALESCE(l.gst_rate, i.gst_rate),
  cgst_amount = CASE WHEN i.supply_type = 'intra_state'
    THEN ROUND(l.taxable_value * COALESCE(l.gst_rate, i.gst_rate) / 200.0, 2) ELSE 0 END,
  sgst_amount = CASE WHEN i.supply_type = 'intra_state'
    THEN ROUND(l.taxable_value * COALESCE(l.gst_rate, i.gst_rate) / 200.0, 2) ELSE 0 END,
  igst_amount = CASE WHEN i.supply_type <> 'intra_state'
    THEN ROUND(l.taxable_value * COALESCE(l.gst_rate, i.gst_rate) / 100.0, 2) ELSE 0 END,
  line_total = l.taxable_value
    + CASE WHEN i.supply_type = 'intra_state'
        THEN 2 * ROUND(l.taxable_value * COALESCE(l.gst_rate, i.gst_rate) / 200.0, 2)
        ELSE ROUND(l.taxable_value * COALESCE(l.gst_rate, i.gst_rate) / 100.0, 2) END,
  gross_amount = COALESCE(l.gross_amount, l.taxable_value + COALESCE(l.discount_amount, 0))
FROM public.invoices i
WHERE i.id = l.invoice_id
  AND i.doc_type = 'gst_invoice'
  AND COALESCE(i.gst_rate, 0) > 0;

-- Remove the single stray proforma left by seeding; it is not a tax document and
-- shows up in the money desk as if it were one.
DELETE FROM public.invoice_lines
WHERE invoice_id IN (SELECT id FROM public.invoices WHERE doc_type = 'proforma');

DELETE FROM public.invoices WHERE doc_type = 'proforma';