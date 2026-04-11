
CREATE OR REPLACE FUNCTION public.insert_order_atomic(
  p_company_id uuid,
  p_date date,
  p_distributor_id uuid,
  p_distributor_name text,
  p_salesperson_id uuid,
  p_salesperson_name text,
  p_total numeric,
  p_payment_mode payment_mode,
  p_payment_status payment_status,
  p_dispatch_date date DEFAULT NULL,
  p_vehicle text DEFAULT '',
  p_driver_name text DEFAULT '',
  p_delivery_status delivery_status DEFAULT 'pending',
  p_dispatch_remarks text DEFAULT '',
  p_godown_id uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, order_number text, seq integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_seq integer;
  v_order_number text;
  v_id uuid;
  v_attempt integer := 0;
BEGIN
  LOOP
    v_attempt := v_attempt + 1;

    -- Atomically increment and fetch the sequence
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
        delivery_status, dispatch_remarks, godown_id
      ) VALUES (
        p_company_id, v_order_number, p_date,
        p_distributor_id, p_distributor_name,
        p_salesperson_id, p_salesperson_name,
        p_total, p_payment_mode, p_payment_status,
        p_dispatch_date, p_vehicle, p_driver_name,
        p_delivery_status, p_dispatch_remarks, p_godown_id
      )
      RETURNING orders.id INTO v_id;

      -- Success — return the result
      id := v_id;
      order_number := v_order_number;
      seq := v_seq;
      RETURN NEXT;
      RETURN;

    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 3 THEN
        RAISE EXCEPTION 'Order number conflict after 3 retries: %', v_order_number;
      END IF;
      -- Loop again to get next sequence number
    END;
  END LOOP;
END;
$$;
