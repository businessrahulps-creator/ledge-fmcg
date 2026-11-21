CREATE OR REPLACE FUNCTION public.tg_log_master_owner_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor uuid := coalesce(auth.uid(), NEW.master_owner_user_id); v_old text; v_new text; v_staff boolean;
BEGIN
  IF OLD.master_owner_user_id IS NOT DISTINCT FROM NEW.master_owner_user_id OR NEW.master_owner_user_id IS NULL THEN RETURN NULL; END IF;
  IF OLD.master_owner_user_id IS NULL THEN RETURN NULL; END IF; -- first assignment (new business / backfill)
  SELECT nullif(full_name,'') INTO v_old FROM profiles WHERE user_id = OLD.master_owner_user_id;
  SELECT nullif(full_name,'') INTO v_new FROM profiles WHERE user_id = NEW.master_owner_user_id;
  v_staff := auth.uid() IS NOT NULL AND public.is_platform_staff(auth.uid())
             AND NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND company_id = NEW.id);
  INSERT INTO activity_log (company_id, user_id, entity_type, entity_id, action, summary, metadata, before, after)
  VALUES (NEW.id, v_actor, 'team', NEW.master_owner_user_id,
    CASE WHEN v_staff THEN 'master_owner_reassigned' ELSE 'master_owner_transferred' END,
    CASE WHEN v_staff THEN 'Ledge support made ' || coalesce(v_new,'a member') || ' the Master Owner (was ' || coalesce(v_old,'someone') || ')'
         ELSE coalesce(v_old,'The Master Owner') || ' handed over Master Owner to ' || coalesce(v_new,'a member') END,
    jsonb_build_object('by_platform_staff', v_staff),
    jsonb_build_object('master_owner_user_id', OLD.master_owner_user_id),
    jsonb_build_object('master_owner_user_id', NEW.master_owner_user_id));
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS companies_log_master_owner ON public.companies;
CREATE TRIGGER companies_log_master_owner AFTER UPDATE OF master_owner_user_id ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_log_master_owner_change();

CREATE OR REPLACE FUNCTION public.tg_log_owner_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row user_roles; v_company uuid; v_name text; v_actor uuid := auth.uid();
BEGIN
  v_row := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  IF v_row.role <> 'super_admin' OR v_actor IS NULL OR v_actor = v_row.user_id THEN RETURN NULL; END IF;
  SELECT company_id, nullif(full_name,'') INTO v_company, v_name FROM profiles WHERE user_id = v_row.user_id;
  IF v_company IS NULL THEN RETURN NULL; END IF;
  INSERT INTO activity_log (company_id, user_id, entity_type, entity_id, action, summary)
  VALUES (v_company, v_actor, 'team', v_row.user_id,
    CASE WHEN TG_OP = 'DELETE' THEN 'owner_removed' ELSE 'owner_added' END,
    coalesce(v_name,'A member') || CASE WHEN TG_OP = 'DELETE' THEN ' is no longer an Owner' ELSE ' was made an Owner' END);
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS user_roles_log_owner_change ON public.user_roles;
CREATE TRIGGER user_roles_log_owner_change AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.tg_log_owner_role_change();

REVOKE ALL ON FUNCTION public.tg_log_master_owner_change() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_log_owner_role_change() FROM public, anon, authenticated;