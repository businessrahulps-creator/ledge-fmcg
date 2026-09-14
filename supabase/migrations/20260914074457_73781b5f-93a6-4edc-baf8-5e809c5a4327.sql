CREATE OR REPLACE FUNCTION public.tg_block_order_delete_with_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.invoice_payments WHERE order_id = OLD.id;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'This order has % payment record(s). Cancel the payments first — deleting the order would erase the money trail.', v_count
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS block_order_delete_with_payments ON public.orders;
CREATE TRIGGER block_order_delete_with_payments
BEFORE DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_block_order_delete_with_payments();

REVOKE ALL ON FUNCTION public.tg_block_order_delete_with_payments() FROM anon, authenticated;