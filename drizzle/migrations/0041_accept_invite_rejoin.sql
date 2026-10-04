CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_invite public.team_invites; v_user_id uuid := auth.uid(); v_user_email text; v_user_name text;
  v_profile_company uuid; v_has_profile boolean; k text; v jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to accept this invite.'; END IF;
  SELECT * INTO v_invite FROM public.team_invites WHERE token = p_token FOR UPDATE;
  IF v_invite.id IS NULL THEN RAISE EXCEPTION 'This invite link is invalid.'; END IF;
  IF v_invite.status = 'accepted' THEN RAISE EXCEPTION 'This invite has already been accepted.'; END IF;
  IF v_invite.status <> 'pending' OR v_invite.expires_at <= now() THEN
    UPDATE public.team_invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'This invite has expired. Ask your owner to send a new one.';
  END IF;
  IF v_invite.role = 'super_admin' THEN RAISE EXCEPTION 'This invite link is invalid.'; END IF;
  SELECT lower(email), COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
    INTO v_user_email, v_user_name FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invite is for a different email address.';
  END IF;
  SELECT true, company_id INTO v_has_profile, v_profile_company FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_has_profile IS NULL THEN
    -- Removed members (profile deleted) can rejoin
    INSERT INTO public.profiles (user_id, company_id, full_name, email)
    VALUES (v_user_id, v_invite.company_id, v_user_name, v_user_email);
  ELSE
    IF v_profile_company IS NOT NULL AND v_profile_company <> v_invite.company_id THEN
      RAISE EXCEPTION 'You are already part of another workspace.';
    END IF;
    IF v_profile_company = v_invite.company_id AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
      RAISE EXCEPTION 'You are already in this team. Ask the owner to change your job instead.';
    END IF;
    UPDATE public.profiles SET company_id = v_invite.company_id WHERE user_id = v_user_id;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.user_capability_overrides WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, v_invite.role);
  FOR k, v IN SELECT * FROM jsonb_each(COALESCE(v_invite.capability_overrides, '{}'::jsonb)) LOOP
    IF k = ANY (SELECT unnest(public._access_toggleable())::text) AND jsonb_typeof(v) = 'boolean' THEN
      INSERT INTO public.user_capability_overrides (user_id, capability, granted)
      VALUES (v_user_id, k::public.capability_key, (v::text)::boolean);
    END IF;
  END LOOP;
  UPDATE public.team_invites SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;
  RETURN jsonb_build_object('ok', true, 'company_id', v_invite.company_id, 'role', v_invite.role);
END $$;