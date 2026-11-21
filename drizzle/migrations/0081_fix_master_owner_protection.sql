CREATE OR REPLACE FUNCTION public.tg_companies_protect_master_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.master_owner_user_id IS NOT DISTINCT FROM OLD.master_owner_user_id THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.master_owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- Runs as the caller: app users are 'authenticated'/'anon'; trusted SECURITY DEFINER functions run as their owner.
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
REVOKE ALL ON FUNCTION public.tg_companies_protect_master_owner() FROM public, anon;