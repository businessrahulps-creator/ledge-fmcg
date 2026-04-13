-- Add transport columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN vehicle text NOT NULL DEFAULT '',
  ADD COLUMN driver_name text NOT NULL DEFAULT '';

-- Backfill from linked orders
UPDATE public.invoices i
SET vehicle = o.vehicle,
    driver_name = o.driver_name
FROM public.orders o
WHERE i.source_order_id = o.id
  AND (o.vehicle <> '' OR o.driver_name <> '');