DO $mig$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.dispatch_and_bill_order_atomic(uuid,uuid,date,text,text,text,boolean)'::regprocedure) INTO d;
  IF position('ORDER BY ol.product_id
  LOOP' IN d) = 0 THEN RAISE EXCEPTION 'pattern not found'; END IF;
  d := replace(d, 'ORDER BY ol.product_id
  LOOP', 'ORDER BY COALESCE(ol.is_free,false) DESC, ol.product_id
  LOOP');
  EXECUTE d;
END $mig$;