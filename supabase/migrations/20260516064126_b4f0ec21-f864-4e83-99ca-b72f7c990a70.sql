
-- 1. Tighten error_log INSERT policy to enforce company ownership
DROP POLICY IF EXISTS "Users can insert own error logs" ON public.error_log;
CREATE POLICY "Users can insert own error logs"
  ON public.error_log FOR INSERT TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND (company_id IS NULL OR company_id = public.get_company_id())
  );

-- 2. Add tenant ownership guard to insert_order_atomic
CREATE OR REPLACE FUNCTION public.insert_order_atomic(p_company_id uuid, p_date date, p_distributor_id uuid, p_distributor_name text, p_salesperson_id uuid, p_salesperson_name text, p_total numeric, p_payment_mode payment_mode, p_payment_status payment_status, p_dispatch_date date DEFAULT NULL::date, p_vehicle text DEFAULT ''::text, p_driver_name text DEFAULT ''::text, p_delivery_status delivery_status DEFAULT 'pending'::delivery_status, p_dispatch_remarks text DEFAULT ''::text, p_godown_id uuid DEFAULT NULL::uuid, p_scheme_savings numeric DEFAULT 0)
 RETURNS TABLE(id uuid, order_number text, seq integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prefix text;
  v_seq integer;
  v_order_number text;
  v_id uuid;
  v_attempt integer := 0;
BEGIN
  IF p_company_id IS NULL OR p_company_id <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  LOOP
    v_attempt := v_attempt + 1;

    UPDATE companies
    SET next_order_sequence = next_order_sequence + 1
    WHERE companies.id = p_company_id
    RETURNING order_prefix, next_order_sequence - 1
    INTO v_prefix, v_seq;

    IF v_prefix IS NULL THEN
      RAISE EXCEPTION 'Company not found: %', p_company_id;
    END IF;

    v_order_number := v_prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || LPAD(v_seq::text, 4, '0');

    BEGIN
      INSERT INTO orders (
        company_id, order_number, date,
        distributor_id, distributor_name,
        salesperson_id, salesperson_name,
        total, payment_mode, payment_status,
        dispatch_date, vehicle, driver_name,
        delivery_status, dispatch_remarks, godown_id,
        scheme_savings
      ) VALUES (
        p_company_id, v_order_number, p_date,
        p_distributor_id, p_distributor_name,
        p_salesperson_id, p_salesperson_name,
        p_total, p_payment_mode, p_payment_status,
        p_dispatch_date, p_vehicle, p_driver_name,
        p_delivery_status, p_dispatch_remarks, p_godown_id,
        p_scheme_savings
      )
      RETURNING orders.id INTO v_id;

      id := v_id;
      order_number := v_order_number;
      seq := v_seq;
      RETURN NEXT;
      RETURN;

    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 3 THEN
        RAISE EXCEPTION 'Order number conflict after 3 retries: %', v_order_number;
      END IF;
    END;
  END LOOP;
END;
$function$;

-- 3. Add tenant ownership check to get_next_order_number
CREATE OR REPLACE FUNCTION public.get_next_order_number(target_company_id uuid)
 RETURNS TABLE(prefix text, seq integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF target_company_id IS NULL OR target_company_id <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  RETURN QUERY
  UPDATE companies
  SET next_order_sequence = next_order_sequence + 1
  WHERE id = target_company_id
  RETURNING order_prefix, next_order_sequence - 1;
END;
$function$;

-- 4. Add tenant ownership check to get_next_invoice_number
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(target_company_id uuid)
 RETURNS TABLE(prefix text, seq integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF target_company_id IS NULL OR target_company_id <> public.get_company_id() THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  RETURN QUERY
  UPDATE companies
  SET next_invoice_sequence = next_invoice_sequence + 1
  WHERE id = target_company_id
  RETURNING invoice_prefix, next_invoice_sequence - 1;
END;
$function$;

-- 5. Revoke EXECUTE from anonymous role on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.insert_order_atomic(uuid, date, uuid, text, uuid, text, numeric, payment_mode, payment_status, date, text, text, delivery_status, text, uuid, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_next_order_number(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_next_invoice_number(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.setup_new_company(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_company_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.insert_order_atomic(uuid, date, uuid, text, uuid, text, numeric, payment_mode, payment_status, date, text, text, delivery_status, text, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_order_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_new_company(text, text) TO authenticated;
