

# Fix Computed Aggregates on Entities (Bug #5)

## Problem
Dealers, salespersons, and products all show `totalOrders: 0`, `totalValue: 0`, `totalSold: 0` because the DataContext hardcodes these to 0 when mapping DB rows.

## Approach
Add aggregate columns to the DB tables, populate them with a trigger that fires on order/order_line changes, and read the real values in DataContext.

## 1. Database Migration

Add columns and trigger:

```sql
-- Add aggregate columns
ALTER TABLE distributors ADD COLUMN total_orders integer NOT NULL DEFAULT 0;
ALTER TABLE distributors ADD COLUMN total_value numeric NOT NULL DEFAULT 0;

ALTER TABLE salespersons ADD COLUMN total_orders integer NOT NULL DEFAULT 0;
ALTER TABLE salespersons ADD COLUMN total_value numeric NOT NULL DEFAULT 0;

ALTER TABLE products ADD COLUMN total_sold integer NOT NULL DEFAULT 0;

-- Trigger function: recalculates aggregates for affected distributor/salesperson/products
CREATE OR REPLACE FUNCTION refresh_entity_aggregates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_order RECORD;
  v_company_id uuid;
BEGIN
  -- Determine the order row to work with
  IF TG_TABLE_NAME = 'orders' THEN
    IF TG_OP = 'DELETE' THEN v_order := OLD; ELSE v_order := NEW; END IF;
    v_company_id := v_order.company_id;

    -- Update distributor
    UPDATE distributors SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val 
          FROM orders WHERE distributor_id = v_order.distributor_id) sub
    WHERE id = v_order.distributor_id;

    -- Also update OLD distributor if it changed
    IF TG_OP = 'UPDATE' AND OLD.distributor_id <> NEW.distributor_id THEN
      UPDATE distributors SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val 
            FROM orders WHERE distributor_id = OLD.distributor_id) sub
      WHERE id = OLD.distributor_id;
    END IF;

    -- Update salesperson
    UPDATE salespersons SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val 
          FROM orders WHERE salesperson_id = v_order.salesperson_id) sub
    WHERE id = v_order.salesperson_id;

    IF TG_OP = 'UPDATE' AND OLD.salesperson_id <> NEW.salesperson_id THEN
      UPDATE salespersons SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (SELECT COUNT(*) cnt, COALESCE(SUM(total),0) val 
            FROM orders WHERE salesperson_id = OLD.salesperson_id) sub
      WHERE id = OLD.salesperson_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'order_lines' THEN
    -- Update product total_sold from all order_lines
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
```

## 2. Update DataContext (`src/context/DataContext.tsx`)

Replace hardcoded `0` with real column values in 6 places:

- `fetchAll` distributor mapping: `totalOrders: d.total_orders, totalValue: Number(d.total_value)`
- `fetchAll` salesperson mapping: same pattern
- `fetchAll` product mapping: `totalSold: p.total_sold`
- `safeRefetchDistributors`: same
- `safeRefetchSalespersons`: same
- `safeRefetchProducts`: same

## Files changed
| File | Change |
|------|--------|
| Migration SQL | Add columns, trigger function, triggers, backfill |
| `src/context/DataContext.tsx` | Read real aggregate columns (6 mapping locations) |

## What stays untouched
- All UI pages (Dealers, Sales Team, Stock, Products) — unchanged
- Dashboard and Reports — unchanged
- All other DataContext logic

