CREATE OR REPLACE FUNCTION public.change_member_role_atomic(p_user uuid, p_role app_role)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid := public.get_company_id(); v_removed int; v_master uuid; v_target_owner boolean;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT master_owner_user_id INTO v_master FROM public.companies WHERE id = v_company FOR UPDATE;
  IF NOT public.has_capability(auth.uid(), 'manage_team') THEN RAISE EXCEPTION 'Only the owner can change jobs.'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'You can''t change your own job.'; END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = p_user AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person isn''t in your team.'; END IF;
  IF p_user = v_master THEN RAISE EXCEPTION 'The Master Owner''s job can''t be changed. Hand over Master Owner first.'; END IF;
  v_target_owner := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'super_admin');
  IF (v_target_owner OR p_role = 'super_admin') AND (v_master IS NULL OR v_master <> auth.uid()) THEN
    RAISE EXCEPTION 'Only the Master Owner can add, change or remove Owners.';
  END IF;
  DELETE FROM public.user_capability_overrides WHERE user_id = p_user;
  GET DIAGNOSTICS v_removed = ROW_COUNT;
  DELETE FROM public.user_roles WHERE user_id = p_user;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user, p_role);
  RETURN jsonb_build_object('ok', true, 'role', p_role, 'custom_access_cleared', v_removed > 0);
END $function$;

CREATE OR REPLACE FUNCTION public.delete_member_atomic(member_id uuid)
 RETURNS TABLE(success boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_caller_company uuid := public.get_company_id(); v_target_user uuid; v_target_company uuid; v_master uuid;
BEGIN
  IF v_caller_company IS NULL THEN RAISE EXCEPTION 'Forbidden: no company context'; END IF;
  SELECT master_owner_user_id INTO v_master FROM public.companies WHERE id = v_caller_company FOR UPDATE;
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Forbidden: super_admin required'; END IF;
  SELECT user_id, company_id INTO v_target_user, v_target_company FROM public.profiles WHERE id = member_id FOR UPDATE;
  IF v_target_user IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF v_target_company IS DISTINCT FROM v_caller_company THEN RAISE EXCEPTION 'Forbidden: company mismatch'; END IF;
  IF v_target_user = auth.uid() THEN RAISE EXCEPTION 'Cannot remove yourself'; END IF;
  IF v_target_user = v_master THEN RAISE EXCEPTION 'The Master Owner can''t be removed. Hand over Master Owner first.'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_target_user AND role = 'super_admin')
     AND (v_master IS NULL OR v_master <> auth.uid()) THEN
    RAISE EXCEPTION 'Only the Master Owner can remove an Owner.';
  END IF;
  UPDATE public.salespersons SET user_id = NULL WHERE user_id = v_target_user AND company_id = v_caller_company;
  DELETE FROM public.user_capability_overrides WHERE user_id = v_target_user;
  DELETE FROM public.user_roles WHERE user_id = v_target_user;
  DELETE FROM public.profiles WHERE id = member_id;
  RETURN QUERY SELECT true;
END $function$;

CREATE OR REPLACE FUNCTION public.transfer_master_owner_atomic(p_new_user uuid, p_confirm_text text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_company uuid := public.get_company_id(); v_master uuid; v_name text; v_promoted boolean := false;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT master_owner_user_id, name INTO v_master, v_name FROM public.companies WHERE id = v_company FOR UPDATE;
  IF v_master = p_new_user THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'master_owner_user_id', p_new_user);
  END IF;
  IF v_master IS NULL OR v_master <> auth.uid() THEN RAISE EXCEPTION 'Only the Master Owner can hand over Master Owner.'; END IF;
  IF p_new_user IS NULL OR p_new_user = auth.uid() THEN RAISE EXCEPTION 'Choose another member of your team.'; END IF;
  IF lower(btrim(coalesce(p_confirm_text,''))) <> lower(btrim(v_name)) THEN
    RAISE EXCEPTION 'Type the business name exactly to confirm.';
  END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = p_new_user AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person isn''t in your team.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_new_user AND role = 'super_admin') THEN
    DELETE FROM public.user_capability_overrides WHERE user_id = p_new_user;
    DELETE FROM public.user_roles WHERE user_id = p_new_user;
    INSERT INTO public.user_roles (user_id, role) VALUES (p_new_user, 'super_admin');
    v_promoted := true;
  END IF;
  UPDATE public.companies SET master_owner_user_id = p_new_user WHERE id = v_company;
  RETURN jsonb_build_object('ok', true, 'already', false, 'master_owner_user_id', p_new_user,
    'previous_master_owner_user_id', v_master, 'promoted_to_owner', v_promoted);
END $function$;

CREATE OR REPLACE FUNCTION public.platform_reassign_master_owner(p_company uuid, p_new_user uuid, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_master uuid; v_promoted boolean := false;
BEGIN
  IF coalesce(length(btrim(p_reason)),0) < 5 THEN RAISE EXCEPTION 'A reason is required.'; END IF;
  PERFORM public.ops_guard('reassign_master_owner', 'company', p_company::text || ' -> ' || coalesce(p_new_user::text,'') || ' : ' || btrim(p_reason));
  SELECT master_owner_user_id INTO v_master FROM public.companies WHERE id = p_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business not found.'; END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = p_new_user AND company_id = p_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person isn''t a member of that business.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_new_user AND role = 'super_admin') THEN
    DELETE FROM public.user_capability_overrides WHERE user_id = p_new_user;
    DELETE FROM public.user_roles WHERE user_id = p_new_user;
    INSERT INTO public.user_roles (user_id, role) VALUES (p_new_user, 'super_admin');
    v_promoted := true;
  END IF;
  UPDATE public.companies SET master_owner_user_id = p_new_user WHERE id = p_company;
  RETURN jsonb_build_object('ok', true, 'master_owner_user_id', p_new_user,
    'previous_master_owner_user_id', v_master, 'promoted_to_owner', v_promoted);
END $function$;

CREATE OR REPLACE FUNCTION public.setup_new_company(p_company_name text, p_full_name text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_user_id uuid := auth.uid(); v_company_id uuid; v_existing_company_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT company_id INTO v_existing_company_id FROM profiles WHERE user_id = v_user_id;
  IF v_existing_company_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM companies WHERE id = v_existing_company_id) THEN
      RETURN v_existing_company_id;
    END IF;
    UPDATE profiles SET company_id = NULL WHERE user_id = v_user_id;
  END IF;
  INSERT INTO companies (name, trial_ends_at) VALUES (p_company_name, now() + interval '30 days')
  RETURNING id INTO v_company_id;
  INSERT INTO profiles (user_id, company_id, full_name, email)
  VALUES (v_user_id, v_company_id, coalesce(p_full_name,''),
          coalesce((SELECT email FROM auth.users WHERE id = v_user_id), ''))
  ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id, full_name = EXCLUDED.full_name;
  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'super_admin') ON CONFLICT (user_id, role) DO NOTHING;
  UPDATE companies SET master_owner_user_id = v_user_id WHERE id = v_company_id;
  RETURN v_company_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.change_member_role_atomic(uuid, app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.delete_member_atomic(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.transfer_master_owner_atomic(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.platform_reassign_master_owner(uuid, uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.setup_new_company(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.change_member_role_atomic(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_member_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_master_owner_atomic(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_reassign_master_owner(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_new_company(text, text) TO authenticated;