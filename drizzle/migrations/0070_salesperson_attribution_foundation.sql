ALTER TABLE public.salespersons ADD COLUMN IF NOT EXISTS user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS salespersons_company_user_uidx ON public.salespersons(company_id, user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.shop_prospects ADD COLUMN IF NOT EXISTS found_by_salesperson_id uuid NULL REFERENCES public.salespersons(id) ON DELETE SET NULL;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS acquired_by_salesperson_id uuid NULL REFERENCES public.salespersons(id) ON DELETE SET NULL;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS assigned_salesperson_id uuid NULL REFERENCES public.salespersons(id) ON DELETE SET NULL;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS acquisition_date date NULL;
ALTER TABLE public.shop_visits ADD COLUMN IF NOT EXISTS visited_by_salesperson_id uuid NULL REFERENCES public.salespersons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS distributors_acquired_by_idx ON public.distributors(acquired_by_salesperson_id) WHERE acquired_by_salesperson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS distributors_assigned_idx ON public.distributors(assigned_salesperson_id) WHERE assigned_salesperson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_prospects_found_by_idx ON public.shop_prospects(found_by_salesperson_id) WHERE found_by_salesperson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_visits_visited_by_idx ON public.shop_visits(visited_by_salesperson_id) WHERE visited_by_salesperson_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public._sp_same_company(_sp uuid, _company uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _sp IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.salespersons WHERE id = _sp AND company_id = _company) THEN
    RAISE EXCEPTION 'That sales person belongs to a different business.';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public._sp_same_company(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_distributor_attribution()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.acquired_by_salesperson_id := NULL;
      NEW.acquisition_date := NULL;
    ELSE
      NEW.acquired_by_salesperson_id := OLD.acquired_by_salesperson_id;
      NEW.acquisition_date := OLD.acquisition_date;
      IF NEW.assigned_salesperson_id IS DISTINCT FROM OLD.assigned_salesperson_id
         AND NOT (public.has_capability(auth.uid(),'see_all_dealers') OR public.has_capability(auth.uid(),'manage_team')) THEN
        RAISE EXCEPTION 'You do not have access to change a dealer''s assigned sales person.';
      END IF;
    END IF;
  END IF;
  PERFORM public._sp_same_company(NEW.acquired_by_salesperson_id, NEW.company_id);
  PERFORM public._sp_same_company(NEW.assigned_salesperson_id, NEW.company_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_distributor_attribution ON public.distributors;
CREATE TRIGGER trg_distributor_attribution BEFORE INSERT OR UPDATE ON public.distributors
FOR EACH ROW EXECUTE FUNCTION public.tg_distributor_attribution();

CREATE OR REPLACE FUNCTION public.tg_prospect_attribution()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public._sp_same_company(NEW.found_by_salesperson_id, NEW.company_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_prospect_attribution ON public.shop_prospects;
CREATE TRIGGER trg_prospect_attribution BEFORE INSERT OR UPDATE OF found_by_salesperson_id ON public.shop_prospects
FOR EACH ROW EXECUTE FUNCTION public.tg_prospect_attribution();

CREATE OR REPLACE FUNCTION public.tg_visit_attribution()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public._sp_same_company(NEW.visited_by_salesperson_id, NEW.company_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_visit_attribution ON public.shop_visits;
CREATE TRIGGER trg_visit_attribution BEFORE INSERT OR UPDATE OF visited_by_salesperson_id ON public.shop_visits
FOR EACH ROW EXECUTE FUNCTION public.tg_visit_attribution();

CREATE OR REPLACE FUNCTION public.tg_salesperson_user_link()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon')
     AND NEW.user_id IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.user_id ELSE NULL END)
     AND NOT public.has_capability(auth.uid(),'manage_team') THEN
    RAISE EXCEPTION 'Only someone who manages the team can link a login to a sales person.';
  END IF;
  IF NEW.user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id AND company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'That login is not part of this business.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_salesperson_user_link ON public.salespersons;
CREATE TRIGGER trg_salesperson_user_link BEFORE INSERT OR UPDATE OF user_id ON public.salespersons
FOR EACH ROW EXECUTE FUNCTION public.tg_salesperson_user_link();