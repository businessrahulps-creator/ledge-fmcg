-- 1) Only guarded functions may write roles, overrides and invites
DROP POLICY IF EXISTS "Owners can insert overrides" ON public.user_capability_overrides;
DROP POLICY IF EXISTS "Owners can update overrides" ON public.user_capability_overrides;
DROP POLICY IF EXISTS "Owners can delete overrides" ON public.user_capability_overrides;
REVOKE INSERT, UPDATE, DELETE ON public.user_capability_overrides FROM authenticated, anon;
DROP POLICY IF EXISTS "Super admins can manage same-company roles" ON public.user_roles;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;
DROP POLICY IF EXISTS "Owners can insert team invites" ON public.team_invites;
REVOKE INSERT, UPDATE ON public.team_invites FROM authenticated, anon;

-- 2) Change a member's job: one role, custom access reset, owners protected
CREATE OR REPLACE FUNCTION public.change_member_role_atomic(p_user uuid, p_role public.app_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_company uuid := public.get_company_id(); v_removed int;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_team') THEN RAISE EXCEPTION 'Only the owner can change jobs.'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'You can''t change your own job.'; END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = p_user AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person isn''t in your team.'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'super_admin') THEN
    RAISE EXCEPTION 'An owner''s job can''t be changed.';
  END IF;
  DELETE FROM public.user_capability_overrides WHERE user_id = p_user;
  GET DIAGNOSTICS v_removed = ROW_COUNT;
  DELETE FROM public.user_roles WHERE user_id = p_user;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user, p_role);
  RETURN jsonb_build_object('ok', true, 'role', p_role, 'custom_access_cleared', v_removed > 0);
END $$;
REVOKE ALL ON FUNCTION public.change_member_role_atomic(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_member_role_atomic(uuid, public.app_role) TO authenticated;

-- 3) Resend keeps the invite's custom access and only works on open invites
CREATE OR REPLACE FUNCTION public.resend_team_invite(p_invite_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_company uuid := public.get_company_id(); v_inv public.team_invites; v_token uuid;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Forbidden: no company context'; END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_team'::capability_key) THEN
    RAISE EXCEPTION 'Forbidden: only owners can resend invites';
  END IF;
  SELECT * INTO v_inv FROM public.team_invites WHERE id = p_invite_id AND company_id = v_company FOR UPDATE;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF v_inv.status = 'accepted' THEN RAISE EXCEPTION 'This invite was already accepted.'; END IF;
  DELETE FROM public.team_invites WHERE id = p_invite_id;
  INSERT INTO public.team_invites (company_id, invited_by, email, role, capability_overrides)
  VALUES (v_company, auth.uid(), v_inv.email, v_inv.role, COALESCE(v_inv.capability_overrides, '{}'::jsonb))
  RETURNING token INTO v_token;
  RETURN v_token;
END $$;

-- 4) Accept: lock profile, no owner invites, no stacking roles, fresh access
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_invite public.team_invites; v_user_id uuid := auth.uid(); v_user_email text;
  v_profile_company uuid; v_has_profile boolean; k text; v jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to accept this invite.'; END IF;
  SELECT * INTO v_invite FROM public.team_invites WHERE token = p_token FOR UPDATE;
  IF v_invite.id IS NULL THEN RAISE EXCEPTION 'This invite link is invalid.'; END IF;
  IF v_invite.status = 'accepted' THEN RAISE EXCEPTION 'This invite has already been accepted.'; END IF;
  IF v_invite.status = 'expired' OR v_invite.expires_at <= now() THEN
    UPDATE public.team_invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'This invite has expired. Ask your owner to send a new one.';
  END IF;
  IF v_invite.role = 'super_admin' THEN RAISE EXCEPTION 'This invite link is invalid.'; END IF;
  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invite is for a different email address.';
  END IF;
  SELECT true, company_id INTO v_has_profile, v_profile_company FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_has_profile IS NULL THEN RAISE EXCEPTION 'Your account isn''t ready yet. Sign out, sign in again and reopen the link.'; END IF;
  IF v_profile_company IS NOT NULL AND v_profile_company <> v_invite.company_id THEN
    RAISE EXCEPTION 'You are already part of another workspace.';
  END IF;
  IF v_profile_company = v_invite.company_id AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already in this team. Ask the owner to change your job instead.';
  END IF;
  UPDATE public.profiles SET company_id = v_invite.company_id WHERE user_id = v_user_id;
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

-- 5) Remove member: owners protected, custom access cleared
CREATE OR REPLACE FUNCTION public.delete_member_atomic(member_id uuid)
RETURNS TABLE(success boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_caller_company uuid := public.get_company_id(); v_target_user uuid; v_target_company uuid;
BEGIN
  IF v_caller_company IS NULL THEN RAISE EXCEPTION 'Forbidden: no company context'; END IF;
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Forbidden: super_admin required'; END IF;
  SELECT user_id, company_id INTO v_target_user, v_target_company FROM public.profiles WHERE id = member_id FOR UPDATE;
  IF v_target_user IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF v_target_company IS DISTINCT FROM v_caller_company THEN RAISE EXCEPTION 'Forbidden: company mismatch'; END IF;
  IF v_target_user = auth.uid() THEN RAISE EXCEPTION 'Cannot remove yourself'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_target_user AND role = 'super_admin') THEN
    RAISE EXCEPTION 'An owner can''t be removed.';
  END IF;
  DELETE FROM public.user_capability_overrides WHERE user_id = v_target_user;
  DELETE FROM public.user_roles WHERE user_id = v_target_user;
  DELETE FROM public.profiles WHERE id = member_id;
  RETURN QUERY SELECT true;
END $$;

-- 6) Invite link preview no longer reveals the invited email to others
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE(email text, role app_role, status invite_status, expires_at timestamptz, company_name text, inviter_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_me text;
BEGIN
  SELECT lower(u.email) INTO v_me FROM auth.users u WHERE u.id = auth.uid();
  RETURN QUERY
  SELECT CASE WHEN v_me IS NOT NULL AND v_me = lower(ti.email) THEN ti.email ELSE ''::text END,
    ti.role,
    CASE WHEN ti.status = 'pending' AND ti.expires_at <= now() THEN 'expired'::invite_status ELSE ti.status END,
    ti.expires_at, c.name,
    COALESCE(NULLIF(p.full_name, ''), 'Your team owner')
  FROM public.team_invites ti
  JOIN public.companies c ON c.id = ti.company_id
  LEFT JOIN public.profiles p ON p.user_id = ti.invited_by
  WHERE ti.token = p_token;
END $$;

-- 7) Only team managers see invite links
DROP POLICY IF EXISTS "Company members can view invites" ON public.team_invites;
CREATE POLICY "Team managers can view invites" ON public.team_invites FOR SELECT TO authenticated
USING (company_id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_team'::capability_key));

-- 8) Clean leftovers that no longer match the rules
DELETE FROM public.user_capability_overrides o
WHERE NOT (o.capability = ANY (public._access_toggleable()))
   OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = o.user_id AND r.role = 'super_admin');