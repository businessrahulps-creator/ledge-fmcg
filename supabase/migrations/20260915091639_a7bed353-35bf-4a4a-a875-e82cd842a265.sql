INSERT INTO public.stock_movements
  (company_id, product_id, godown_id, delta, movement_type, source_doc_type, source_doc_id, idempotency_key, actor, note, created_at)
SELECT d.company_id, d.product_id, d.godown_id, -d.quantity_deducted, 'dispatch', 'order', d.order_id,
       'backfill:deduction:' || d.id::text, NULL, 'Backfilled from earlier dispatch record', d.created_at
FROM public.stock_deductions d
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_movements m
  WHERE m.idempotency_key = 'backfill:deduction:' || d.id::text
)
AND NOT EXISTS (
  SELECT 1 FROM public.stock_movements m
  WHERE m.source_doc_type = 'order' AND m.source_doc_id = d.order_id
    AND m.product_id = d.product_id AND m.godown_id = d.godown_id
);