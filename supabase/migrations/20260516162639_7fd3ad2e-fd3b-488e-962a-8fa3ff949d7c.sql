-- Add delivered_at column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;

-- Trigger to auto-stamp delivered_at when delivery_status becomes 'delivered'
CREATE OR REPLACE FUNCTION public.set_delivered_at_on_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.delivery_status = 'delivered' THEN
    IF TG_OP = 'INSERT' OR OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
      IF NEW.delivered_at IS NULL THEN
        NEW.delivered_at := now();
      END IF;
    END IF;
  ELSE
    IF TG_OP = 'UPDATE' AND OLD.delivery_status = 'delivered' THEN
      NEW.delivered_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_delivered_at ON public.orders;
CREATE TRIGGER trg_set_delivered_at
BEFORE INSERT OR UPDATE OF delivery_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_delivered_at_on_status();

-- Backfill existing delivered orders
UPDATE public.orders
SET delivered_at = updated_at
WHERE delivery_status = 'delivered' AND delivered_at IS NULL;

-- Index for delivered-revenue queries
CREATE INDEX IF NOT EXISTS orders_company_delivered_at_idx
ON public.orders(company_id, delivered_at)
WHERE delivery_status = 'delivered';