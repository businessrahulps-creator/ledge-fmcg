DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (p.prorettype = 'trigger'::regtype
           OR p.proname IN ('get_cron_secret','check_aging_transitions','insert_order_atomic','dispatch_order_atomic','get_next_invoice_number','get_next_order_number'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;