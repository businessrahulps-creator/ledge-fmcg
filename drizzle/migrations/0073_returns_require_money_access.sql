DO $mig$
DECLARE d text; old text := 'IF public.has_role(auth.uid(), ''viewer''::app_role) THEN';
BEGIN
  SELECT pg_get_functiondef('public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date, text)'::regprocedure) INTO d;
  IF position(old in d) = 0 THEN RAISE EXCEPTION 'guard not found'; END IF;
  d := replace(d, old, 'IF NOT public.has_capability(auth.uid(), ''see_money''::capability_key) THEN');
  EXECUTE d;
END
$mig$;
REVOKE ALL ON FUNCTION public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_return_and_credit_atomic(uuid, jsonb, text, uuid, date, text) TO authenticated, service_role;