CREATE OR REPLACE FUNCTION public.set_member_access_checked(p_user uuid, p_overrides jsonb, p_expected jsonb, p_expected_role public.app_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_company uuid := public.get_company_id(); v_role public.app_role; v_now jsonb;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_team') THEN
    RAISE EXCEPTION 'Only the owner can change team access.';
  END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = p_user AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person isn''t in your team.'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user ORDER BY created_at LIMIT 1;
  SELECT COALESCE(jsonb_object_agg(capability::text, granted), '{}'::jsonb) INTO v_now
    FROM public.user_capability_overrides
   WHERE user_id = p_user AND capability = ANY (public._access_toggleable());
  IF v_role IS DISTINCT FROM p_expected_role
     OR v_now <> public._access_clean(v_role, COALESCE(p_expected, '{}'::jsonb)) THEN
    RAISE EXCEPTION 'Someone else changed this person''s access just now. Close and open it again to see the latest.';
  END IF;
  RETURN public.set_member_access_atomic(p_user, p_overrides);
END $$;
REVOKE ALL ON FUNCTION public.set_member_access_checked(uuid, jsonb, jsonb, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_access_checked(uuid, jsonb, jsonb, public.app_role) TO authenticated;