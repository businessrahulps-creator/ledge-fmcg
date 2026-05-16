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

    -- Distributor rollups: total_value & outstanding count only DELIVERED orders.
    -- total_orders still counts all orders (booked pipeline indicator).
    UPDATE distributors SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0),
      outstanding_amount = COALESCE(sub.outstanding, 0)
    FROM (
      SELECT
        COUNT(*) cnt,
        COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val,
        COALESCE(SUM(CASE WHEN delivery_status = 'delivered' AND payment_status IN ('pending', 'partial') THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
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
          COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val,
          COALESCE(SUM(CASE WHEN delivery_status = 'delivered' AND payment_status IN ('pending', 'partial') THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
        FROM orders WHERE distributor_id = OLD.distributor_id
      ) sub
      WHERE id = OLD.distributor_id;
    END IF;

    -- Salesperson rollups: total_value counts DELIVERED only.
    UPDATE salespersons SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (
      SELECT
        COUNT(*) cnt,
        COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
      FROM orders WHERE salesperson_id = v_order.salesperson_id
    ) sub
    WHERE id = v_order.salesperson_id;

    IF TG_OP = 'UPDATE' AND OLD.salesperson_id <> NEW.salesperson_id THEN
      UPDATE salespersons SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (
        SELECT
          COUNT(*) cnt,
          COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
        FROM orders WHERE salesperson_id = OLD.salesperson_id
      ) sub
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

-- Rebuild distributor & salesperson aggregates with the new delivered-only semantics.
UPDATE distributors d SET
  total_orders = COALESCE(sub.cnt, 0),
  total_value = COALESCE(sub.val, 0),
  outstanding_amount = COALESCE(sub.outstanding, 0)
FROM (
  SELECT distributor_id,
    COUNT(*) cnt,
    COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val,
    COALESCE(SUM(CASE WHEN delivery_status = 'delivered' AND payment_status IN ('pending', 'partial') THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
  FROM orders GROUP BY distributor_id
) sub WHERE d.id = sub.distributor_id;

UPDATE salespersons s SET
  total_orders = COALESCE(sub.cnt, 0),
  total_value = COALESCE(sub.val, 0)
FROM (
  SELECT salesperson_id,
    COUNT(*) cnt,
    COALESCE(SUM(CASE WHEN delivery_status = 'delivered' THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) val
  FROM orders GROUP BY salesperson_id
) sub WHERE s.id = sub.salesperson_id;