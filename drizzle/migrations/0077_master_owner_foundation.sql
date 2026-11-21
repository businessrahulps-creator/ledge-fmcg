ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS master_owner_user_id uuid NULL;
CREATE INDEX IF NOT EXISTS companies_master_owner_user_id_idx ON public.companies(master_owner_user_id);
COMMENT ON COLUMN public.companies.master_owner_user_id IS 'Single Master Owner (a super_admin of this company). Changed only by server-side governance functions.';

CREATE OR REPLACE FUNCTION public.tg_companies_protect_master_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.master_owner_user_id IS NOT DISTINCT FROM OLD.master_owner_user_id THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.master_owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- Direct app (client) writes are refused; trusted server functions run as their owner.
  IF current_user IN ('authenticated','anon') THEN
    RAISE EXCEPTION 'The Master Owner can only be changed through ownership handover.' USING ERRCODE = '42501';
  END IF;
  IF NEW.master_owner_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.user_id AND r.role = 'super_admin'
    WHERE p.user_id = NEW.master_owner_user_id AND p.company_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'The Master Owner must be an Owner of this business.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS companies_protect_master_owner ON public.companies;
CREATE TRIGGER companies_protect_master_owner
BEFORE INSERT OR UPDATE OF master_owner_user_id ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_companies_protect_master_owner();

CREATE OR REPLACE FUNCTION public.is_master_owner(_user uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c JOIN public.profiles p ON p.company_id = c.id
    WHERE p.user_id = _user AND c.master_owner_user_id = _user
  )
$$;
REVOKE ALL ON FUNCTION public.is_master_owner(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_master_owner(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.tg_companies_protect_master_owner() FROM public, anon, authenticated;

-- Backfill: businesses with exactly one Owner
UPDATE public.companies c SET master_owner_user_id = s.user_id
FROM (
  SELECT p.company_id, min(p.user_id::text)::uuid AS user_id
  FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.user_id AND r.role = 'super_admin'
  WHERE p.company_id IS NOT NULL
  GROUP BY p.company_id HAVING count(*) = 1
) s
WHERE c.id = s.company_id AND c.master_owner_user_id IS NULL;

-- Approved by the owner: anaar -> Rajan P S
UPDATE public.companies SET master_owner_user_id = '57c3f7c6-8195-45fd-82b4-07f954652831'
WHERE id = '19b241b3-206d-40c2-af17-95c2f554b532' AND master_owner_user_id IS NULL;