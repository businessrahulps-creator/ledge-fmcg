DO $mig$
DECLARE f text; d text;
BEGIN
  FOREACH f IN ARRAY ARRAY['record_invoice_payment_atomic','record_order_payment_atomic'] LOOP
    SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname=f;
    IF position('cash_change' in d) > 0 THEN CONTINUE; END IF;
    d := replace(d, $q$NOT IN ('apply_other_bills','dealer_credit','refund')$q$,
                    $q$NOT IN ('apply_other_bills','dealer_credit','refund','cash_change')$q$);
    d := replace(d, E'  IF v_amount > v_due THEN',
      E'  -- Cash change handed back at the counter: keep only what is due, server-side.\n  IF p_extra_action = ''cash_change'' THEN v_amount := LEAST(v_amount, v_due); p_extra_action := NULL; END IF;\n  IF v_amount > v_due THEN');
    IF position('cash_change'' THEN' in d) = 0 THEN RAISE EXCEPTION 'patch failed for %', f; END IF;
    EXECUTE d;
  END LOOP;
END $mig$;