DROP FUNCTION IF EXISTS public.insert_order_atomic(
  uuid, date, uuid, text, uuid, text, numeric, payment_mode, payment_status,
  date, text, text, delivery_status, text, uuid
);