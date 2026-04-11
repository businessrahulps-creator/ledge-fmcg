
-- Add aggregate columns
ALTER TABLE distributors ADD COLUMN total_orders integer NOT NULL DEFAULT 0;
ALTER TABLE distributors ADD COLUMN total_value numeric NOT NULL DEFAULT 0;

ALTER TABLE salespersons ADD COLUMN total_orders integer NOT NULL DEFAULT 0;
ALTER TABLE salespersons ADD COLUMN total_value numeric NOT NULL DEFAULT 0;

ALTER TABLE products ADD COLUMN total_sold integer NOT NULL DEFAULT 0;

-- Trigger function
CREATE OR REPLACE FUNCTION refresh_entity_aggregates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    IF TG_OP = 'DELETE' THEN v_order := OLD; ELSE v_order := NEW; END IF;

    UPDATE distributors SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val FROM orders WHERE distributor_id = v_order.distributor_id) sub
    WHERE id = v_order.distributor_id;

    IF TG_OP = 'UPDATE' AND OLD.distributor_id <> NEW.distributor_id THEN
      UPDATE distributors SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val FROM orders WHERE distributor_id = OLD.distributor_id) sub
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
$$;

-- Attach triggers
CREATE TRIGGER trg_orders_aggregates AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION refresh_entity_aggregates();

CREATE TRIGGER trg_order_lines_aggregates AFTER INSERT OR UPDATE OR DELETE ON order_lines
  FOR EACH ROW EXECUTE FUNCTION refresh_entity_aggregates();

-- Backfill existing data
UPDATE distributors d SET
  total_orders = sub.cnt, total_value = sub.val
FROM (SELECT distributor_id, COUNT(*) cnt, COALESCE(SUM(total),0) val FROM orders GROUP BY distributor_id) sub
WHERE d.id = sub.distributor_id;

UPDATE salespersons s SET
  total_orders = sub.cnt, total_value = sub.val
FROM (SELECT salesperson_id, COUNT(*) cnt, COALESCE(SUM(total),0) val FROM orders GROUP BY salesperson_id) sub
WHERE s.id = sub.salesperson_id;

UPDATE products p SET total_sold = sub.qty
FROM (SELECT product_id, COALESCE(SUM(quantity),0) qty FROM order_lines GROUP BY product_id) sub
WHERE p.id = sub.product_id;
