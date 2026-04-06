ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_number_key;
ALTER TABLE orders ADD CONSTRAINT orders_company_order_number_key UNIQUE (company_id, order_number);