ALTER TABLE public.distributors ADD COLUMN credit_days integer NULL CONSTRAINT distributors_credit_days_range CHECK (credit_days BETWEEN 1 AND 365);
COMMENT ON COLUMN public.distributors.credit_days IS 'Internal collections only. Current dealer terms; never changes invoices, billing, pricing, taxes or payment calculations.';
CREATE OR REPLACE FUNCTION public.tg_protect_distributor_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.outstanding_amount := 0; NEW.total_orders := 0; NEW.total_value := 0;
      IF NEW.credit_days IS NOT NULL AND NOT (public.has_capability(auth.uid(),'override_credit_limit') OR public.has_capability(auth.uid(),'manage_team')) THEN
        RAISE EXCEPTION 'You do not have access to set a dealer''s credit days.';
      END IF;
    ELSE
      NEW.outstanding_amount := OLD.outstanding_amount;
      NEW.total_orders := OLD.total_orders;
      NEW.total_value := OLD.total_value;
      IF (NEW.credit_limit IS DISTINCT FROM OLD.credit_limit OR NEW.credit_mode IS DISTINCT FROM OLD.credit_mode OR NEW.credit_days IS DISTINCT FROM OLD.credit_days)
         AND NOT (public.has_capability(auth.uid(),'override_credit_limit') OR public.has_capability(auth.uid(),'manage_team')) THEN
        RAISE EXCEPTION 'You do not have access to change a dealer''s credit limit or credit days.';
      END IF;
    END IF;
  END IF;
  IF NEW.credit_mode = 'cash_only' THEN NEW.credit_days := NULL; END IF;
  RETURN NEW;
END $function$;