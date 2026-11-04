CREATE OR REPLACE FUNCTION public.tg_order_lines_gross()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.gross_amount := ROUND(COALESCE(NEW.quantity,0) * COALESCE(NEW.unit_price,0), 2);
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.tg_order_lines_gross() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS order_lines_gross ON public.order_lines;
CREATE TRIGGER order_lines_gross
  BEFORE INSERT OR UPDATE OF quantity, unit_price, gross_amount ON public.order_lines
  FOR EACH ROW EXECUTE FUNCTION public.tg_order_lines_gross();

UPDATE public.order_lines SET gross_amount = ROUND(quantity * unit_price, 2) WHERE gross_amount IS NULL;