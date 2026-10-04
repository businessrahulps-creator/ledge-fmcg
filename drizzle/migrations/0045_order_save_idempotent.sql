ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_company_idem_uq ON public.orders(company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.book_order_atomic(p_date date, p_distributor_id uuid, p_salesperson_id uuid, p_lines jsonb, p_godown_id uuid, p_applied_schemes jsonb, p_scheme_savings numeric, p_remarks text, p_idempotency_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_res jsonb;
  v_id uuid;
  v_key text := NULLIF(btrim(COALESCE(p_idempotency_key, '')), '');
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'No workspace found for this user.'; END IF;
  IF v_key IS NOT NULL THEN
    IF length(v_key) > 100 THEN RAISE EXCEPTION 'Save ID is too long.'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext('book_order:' || v_company::text || ':' || v_key));
    SELECT o.id INTO v_id FROM orders o WHERE o.company_id = v_company AND o.idempotency_key = v_key;
    IF v_id IS NOT NULL THEN
      RETURN (SELECT jsonb_build_object('order_id', o.id, 'order_number', o.order_number, 'total', o.total,
                'scheme_savings', o.scheme_savings,
                'lines', (SELECT count(*) FROM order_lines l WHERE l.order_id = o.id),
                'seq', (SELECT c.next_order_sequence - 1 FROM companies c WHERE c.id = v_company),
                'replayed', true)
                FROM orders o WHERE o.id = v_id);
    END IF;
  END IF;

  v_res := public.book_order_atomic(p_date, p_distributor_id, p_salesperson_id, p_lines, p_godown_id,
                                    p_applied_schemes, p_scheme_savings, p_remarks);
  v_id := (v_res->>'order_id')::uuid;
  IF v_key IS NOT NULL THEN
    UPDATE orders SET idempotency_key = v_key WHERE id = v_id;
  END IF;
  RETURN v_res || jsonb_build_object('seq', (SELECT c.next_order_sequence - 1 FROM companies c WHERE c.id = v_company));
END;
$$;

REVOKE ALL ON FUNCTION public.book_order_atomic(date, uuid, uuid, jsonb, uuid, jsonb, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_order_atomic(date, uuid, uuid, jsonb, uuid, jsonb, numeric, text, text) TO authenticated, service_role;