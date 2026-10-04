INSERT INTO public.role_capabilities_default (role, capability)
SELECT 'super_admin', 'manage_business'
WHERE NOT EXISTS (SELECT 1 FROM public.role_capabilities_default WHERE role='super_admin' AND capability='manage_business');

DROP POLICY IF EXISTS "Super admins can update their company" ON public.companies;
CREATE POLICY "Super admins can update their company" ON public.companies FOR UPDATE TO authenticated
USING (id = public.get_company_id() AND (public.has_capability(auth.uid(),'manage_team') OR public.has_capability(auth.uid(),'manage_business')))
WITH CHECK (id = public.get_company_id() AND (public.has_capability(auth.uid(),'manage_team') OR public.has_capability(auth.uid(),'manage_business')));

ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS capability_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public._access_toggleable() RETURNS public.capability_key[]
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT ARRAY['place_orders','manage_stock','manage_schemes','see_money','see_all_dealers','override_credit_limit','manage_buying','manage_business']::public.capability_key[];
$$;

-- Keeps only toggleable keys whose value differs from the role default.
CREATE OR REPLACE FUNCTION public._access_clean(p_role public.app_role, p_overrides jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; v jsonb; out jsonb := '{}'::jsonb; def boolean;
BEGIN
  IF p_overrides IS NULL OR jsonb_typeof(p_overrides) <> 'object' THEN RETURN out; END IF;
  FOR k, v IN SELECT * FROM jsonb_each(p_overrides) LOOP
    IF NOT (k = ANY (SELECT unnest(public._access_toggleable())::text)) THEN
      RAISE EXCEPTION 'This access can''t be given: %', k;
    END IF;
    IF jsonb_typeof(v) <> 'boolean' THEN RAISE EXCEPTION 'Invalid access value for %', k; END IF;
    SELECT EXISTS (SELECT 1 FROM public.role_capabilities_default WHERE role = p_role AND capability = k::public.capability_key) INTO def;
    IF (v::text)::boolean IS DISTINCT FROM def THEN out := out || jsonb_build_object(k, v); END IF;
  END LOOP;
  RETURN out;
END $$;

CREATE OR REPLACE FUNCTION public.send_team_invite(p_email text, p_role public.app_role, p_overrides jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_token uuid; v_clean jsonb;
BEGIN
  v_clean := public._access_clean(p_role, p_overrides);
  v_token := public.send_team_invite(p_email, p_role);
  UPDATE public.team_invites SET capability_overrides = v_clean WHERE token = v_token;
  RETURN v_token;
END $$;

CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_invite     public.team_invites;
  v_user_id    uuid := auth.uid();
  v_user_email text;
  v_profile_company uuid;
  k text; v jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to accept this invite.'; END IF;
  SELECT * INTO v_invite FROM public.team_invites WHERE token = p_token FOR UPDATE;
  IF v_invite.id IS NULL THEN RAISE EXCEPTION 'This invite link is invalid.'; END IF;
  IF v_invite.status = 'accepted' THEN RAISE EXCEPTION 'This invite has already been accepted.'; END IF;
  IF v_invite.status = 'expired' OR v_invite.expires_at <= now() THEN
    UPDATE public.team_invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'This invite has expired. Ask your owner to send a new one.';
  END IF;
  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invite is for a different email address.';
  END IF;
  SELECT company_id INTO v_profile_company FROM public.profiles WHERE user_id = v_user_id;
  IF v_profile_company IS NULL THEN
    UPDATE public.profiles SET company_id = v_invite.company_id WHERE user_id = v_user_id;
  ELSIF v_profile_company <> v_invite.company_id THEN
    RAISE EXCEPTION 'You are already part of another workspace.';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, v_invite.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  FOR k, v IN SELECT * FROM jsonb_each(COALESCE(v_invite.capability_overrides, '{}'::jsonb)) LOOP
    IF k = ANY (SELECT unnest(public._access_toggleable())::text) AND jsonb_typeof(v) = 'boolean' THEN
      INSERT INTO public.user_capability_overrides (user_id, capability, granted)
      VALUES (v_user_id, k::public.capability_key, (v::text)::boolean)
      ON CONFLICT (user_id, capability) DO UPDATE SET granted = EXCLUDED.granted, updated_at = now();
    END IF;
  END LOOP;
  UPDATE public.team_invites SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;
  RETURN jsonb_build_object('ok', true, 'company_id', v_invite.company_id, 'role', v_invite.role);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_member_access_atomic(p_user uuid, p_overrides jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.get_company_id(); v_role public.app_role; v_clean jsonb; k text; v jsonb;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_team') THEN
    RAISE EXCEPTION 'Only the owner can change team access.';
  END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'You can''t change your own access.'; END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = p_user AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person isn''t in your team.'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'super_admin') THEN
    RAISE EXCEPTION 'The owner''s access can''t be changed.';
  END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user ORDER BY created_at LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'This person has no access level yet.'; END IF;
  v_clean := public._access_clean(v_role, p_overrides);
  DELETE FROM public.user_capability_overrides
   WHERE user_id = p_user AND capability = ANY (public._access_toggleable())
     AND NOT (v_clean ? capability::text);
  FOR k, v IN SELECT * FROM jsonb_each(v_clean) LOOP
    INSERT INTO public.user_capability_overrides (user_id, capability, granted)
    VALUES (p_user, k::public.capability_key, (v::text)::boolean)
    ON CONFLICT (user_id, capability) DO UPDATE SET granted = EXCLUDED.granted, updated_at = now()
    WHERE public.user_capability_overrides.granted IS DISTINCT FROM EXCLUDED.granted;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'overrides', v_clean);
END $$;

REVOKE ALL ON FUNCTION public._access_clean(public.app_role, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_team_invite(text, public.app_role, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_team_invite(text, public.app_role, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.set_member_access_atomic(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_access_atomic(uuid, jsonb) TO authenticated;