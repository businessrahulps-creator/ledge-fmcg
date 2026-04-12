
-- 1. Add new columns
ALTER TABLE public.distributors
  ADD COLUMN credit_limit numeric NOT NULL DEFAULT 0,
  ADD COLUMN outstanding_amount numeric NOT NULL DEFAULT 0;

-- 2. Replace refresh_entity_aggregates to also compute outstanding_amount
CREATE OR REPLACE FUNCTION public.refresh_entity_aggregates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    IF TG_OP = 'DELETE' THEN v_order := OLD; ELSE v_order := NEW; END IF;

    UPDATE distributors SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0),
      outstanding_amount = COALESCE(sub.outstanding, 0)
    FROM (
      SELECT
        COUNT(*) cnt,
        COALESCE(SUM(total), 0) val,
        COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN total ELSE 0 END), 0) outstanding
      FROM orders WHERE distributor_id = v_order.distributor_id
    ) sub
    WHERE id = v_order.distributor_id;

    IF TG_OP = 'UPDATE' AND OLD.distributor_id <> NEW.distributor_id THEN
      UPDATE distributors SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0),
        outstanding_amount = COALESCE(sub.outstanding, 0)
      FROM (
        SELECT
          COUNT(*) cnt,
          COALESCE(SUM(total), 0) val,
          COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN total ELSE 0 END), 0) outstanding
        FROM orders WHERE distributor_id = OLD.distributor_id
      ) sub
      WHERE id = OLD.distributor_id;
    END IF;

    UPDATE salespersons SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val FROM orders WHERE salesperson_id = v_order.salesperson_id) sub
    WHERE id = v_order.salesperson_id;

    IF TG_OP = 'UPDATE' AND OLD.salesperson_id <> NEW.salesperson_id THEN
      UPDATE salespersons SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val FROM orders WHERE salesperson_id = OLD.salesperson_id) sub
      WHERE id = OLD.salesperson_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'order_lines' THEN
    IF TG_OP = 'DELETE' THEN
      UPDATE products SET total_sold = COALESCE(sub.qty, 0)
      FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = OLD.product_id) sub
      WHERE id = OLD.product_id;
    ELSE
      UPDATE products SET total_sold = COALESCE(sub.qty, 0)
      FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = NEW.product_id) sub
      WHERE id = NEW.product_id;
      IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
        UPDATE products SET total_sold = COALESCE(sub.qty, 0)
        FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = OLD.product_id) sub
        WHERE id = OLD.product_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;

-- 3. Backfill outstanding amounts
UPDATE public.distributors d SET outstanding_amount = COALESCE(sub.amt, 0)
FROM (
  SELECT distributor_id, SUM(total) amt
  FROM public.orders
  WHERE payment_status IN ('pending', 'partial')
  GROUP BY distributor_id
) sub
WHERE d.id = sub.distributor_id;
