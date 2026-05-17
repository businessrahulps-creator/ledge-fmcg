-- 1. Seed defaults — who gets place_orders out of the box
INSERT INTO public.role_capabilities_default (role, capability) VALUES
  ('super_admin',  'place_orders'),
  ('sales_manager','place_orders'),
  ('salesperson',  'place_orders')
ON CONFLICT DO NOTHING;

-- 2. Tighten RLS on orders.INSERT
DROP POLICY IF EXISTS "Company members can insert orders" ON public.orders;
CREATE POLICY "Members with place_orders can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_company_id()
  AND public.has_capability(auth.uid(), 'place_orders'::public.capability_key)
);

-- 3. Tighten RLS on order_lines.INSERT (gate when attaching to a new order)
DROP POLICY IF EXISTS "Users can insert order lines for their company" ON public.order_lines;
CREATE POLICY "Members with place_orders can insert order lines"
ON public.order_lines
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_lines.order_id
      AND o.company_id = public.get_company_id()
  )
  AND public.has_capability(auth.uid(), 'place_orders'::public.capability_key)
);

-- 4. Tighten RLS on order_schemes.INSERT
DROP POLICY IF EXISTS "Company members can insert order schemes" ON public.order_schemes;
CREATE POLICY "Members with place_orders can insert order schemes"
ON public.order_schemes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_schemes.order_id
      AND o.company_id = public.get_company_id()
  )
  AND public.has_capability(auth.uid(), 'place_orders'::public.capability_key)
);

-- 5. Defense-in-depth: gate insert_order_atomic RPC
CREATE OR REPLACE FUNCTION public.insert_order_atomic(
  p_company_id uuid, p_date date,
  p_distributor_id uuid, p_distributor_name text,
  p_salesperson_id uuid, p_salesperson_name text,
  p_total numeric, p_payment_mode payment_mode, p_payment_status payment_status,
  p_dispatch_date date DEFAULT NULL::date,
  p_vehicle text DEFAULT ''::text,
  p_driver_name text DEFAULT ''::text,
  p_delivery_status delivery_status DEFAULT 'pending'::delivery_status,
  p_dispatch_remarks text DEFAULT ''::text,
  p_godown_id uuid DEFAULT NULL::uuid,
  p_scheme_savings numeric DEFAULT 0
)
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

  IF NOT public.has_capability(auth.uid(), 'place_orders'::public.capability_key) THEN
    RAISE EXCEPTION 'Forbidden: you don''t have permission to place orders';
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