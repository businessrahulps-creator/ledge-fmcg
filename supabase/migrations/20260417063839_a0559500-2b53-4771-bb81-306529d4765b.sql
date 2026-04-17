
-- 1. Re-attach triggers (drop first to be idempotent)
DROP TRIGGER IF EXISTS trg_refresh_aggregates_orders ON public.orders;
DROP TRIGGER IF EXISTS trg_refresh_aggregates_order_lines ON public.order_lines;

CREATE TRIGGER trg_refresh_aggregates_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.refresh_entity_aggregates();

CREATE TRIGGER trg_refresh_aggregates_order_lines
AFTER INSERT OR UPDATE OR DELETE ON public.order_lines
FOR EACH ROW EXECUTE FUNCTION public.refresh_entity_aggregates();

-- 2. Backfill distributor aggregates (net of scheme_savings)
UPDATE public.distributors d SET
  total_orders = COALESCE(sub.cnt, 0),
  total_value = COALESCE(sub.val, 0),
  outstanding_amount = COALESCE(sub.outstanding, 0)
FROM (
  SELECT
    distributor_id,
    COUNT(*) cnt,
    COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)), 0) val,
    COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial')
      THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
  FROM public.orders
  GROUP BY distributor_id
) sub
WHERE d.id = sub.distributor_id;

-- Zero out distributors with no orders
UPDATE public.distributors SET total_orders = 0, total_value = 0, outstanding_amount = 0
WHERE id NOT IN (SELECT DISTINCT distributor_id FROM public.orders);

-- 3. Backfill salesperson aggregates
UPDATE public.salespersons s SET
  total_orders = COALESCE(sub.cnt, 0),
  total_value = COALESCE(sub.val, 0)
FROM (
  SELECT
    salesperson_id,
    COUNT(*) cnt,
    COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)), 0) val
  FROM public.orders
  GROUP BY salesperson_id
) sub
WHERE s.id = sub.salesperson_id;

UPDATE public.salespersons SET total_orders = 0, total_value = 0
WHERE id NOT IN (SELECT DISTINCT salesperson_id FROM public.orders);

-- 4. Backfill product total_sold
UPDATE public.products p SET total_sold = COALESCE(sub.qty, 0)
FROM (
  SELECT product_id, COALESCE(SUM(quantity), 0) qty
  FROM public.order_lines
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

UPDATE public.products SET total_sold = 0
WHERE id NOT IN (SELECT DISTINCT product_id FROM public.order_lines);
