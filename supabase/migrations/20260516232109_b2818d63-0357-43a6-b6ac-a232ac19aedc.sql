-- PR-E · Team invites: table, enum, RLS, RPCs

-- 1. Status enum
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired');

-- 2. Table
CREATE TABLE public.team_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL,
  invited_by  uuid NOT NULL,
  email       text NOT NULL,
  role        app_role NOT NULL,
  token       uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status      invite_status NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  accepted_at timestamptz
);

CREATE INDEX idx_team_invites_company ON public.team_invites (company_id);
CREATE INDEX idx_team_invites_email   ON public.team_invites (lower(email));
CREATE UNIQUE INDEX uq_team_invites_pending
  ON public.team_invites (company_id, lower(email))
  WHERE status = 'pending';

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- 3. RLS — read for company members, delete for Owners, no direct INSERT/UPDATE
CREATE POLICY "Company members can view invites"
  ON public.team_invites
  FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());

CREATE POLICY "Owners can cancel invites"
  ON public.team_invites
  FOR DELETE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_team'::capability_key)
  );
-- INSERT/UPDATE intentionally have no policy: only SECURITY DEFINER RPCs mutate.

-- 4. send_team_invite — Owner-only, returns new token
CREATE OR REPLACE FUNCTION public.send_team_invite(p_email text, p_role app_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_email   text := lower(trim(p_email));
  v_token   uuid;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no company context';
  END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_team'::capability_key) THEN
    RAISE EXCEPTION 'Forbidden: only owners can invite members';
  END IF;
  IF v_email = '' OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  IF p_role = 'super_admin' THEN
    RAISE EXCEPTION 'Owner role cannot be invited. Promote an existing member instead.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_id = v_company AND lower(email) = v_email
  ) THEN
    RAISE EXCEPTION 'This person is already a member of your workspace.';
  END IF;

  -- Auto-expire stale pending rows for this email so unique index doesn't trip
  UPDATE public.team_invites
     SET status = 'expired'
   WHERE company_id = v_company
     AND lower(email) = v_email
     AND status = 'pending'
     AND expires_at <= now();

  IF EXISTS (
    SELECT 1 FROM public.team_invites
    WHERE company_id = v_company
      AND lower(email) = v_email
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'An invite has already been sent to this email.';
  END IF;

  INSERT INTO public.team_invites (company_id, invited_by, email, role)
  VALUES (v_company, auth.uid(), v_email, p_role)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- 5. resend_team_invite — delete + reinsert with fresh token/window
CREATE OR REPLACE FUNCTION public.resend_team_invite(p_invite_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_company_id();
  v_email   text;
  v_role    app_role;
  v_token   uuid;
BEGIN
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no company context';
  END IF;
  IF NOT public.has_capability(auth.uid(), 'manage_team'::capability_key) THEN
    RAISE EXCEPTION 'Forbidden: only owners can resend invites';
  END IF;

  SELECT email, role INTO v_email, v_role
    FROM public.team_invites
   WHERE id = p_invite_id AND company_id = v_company;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  DELETE FROM public.team_invites WHERE id = p_invite_id;

  INSERT INTO public.team_invites (company_id, invited_by, email, role)
  VALUES (v_company, auth.uid(), v_email, v_role)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- 6. get_invite_by_token — anon-callable readonly preview for /invite/:token
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE (
  email          text,
  role           app_role,
  status         invite_status,
  expires_at     timestamptz,
  company_name   text,
  inviter_name   text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ti.email,
    ti.role,
    CASE
      WHEN ti.status = 'pending' AND ti.expires_at <= now() THEN 'expired'::invite_status
      ELSE ti.status
    END AS status,
    ti.expires_at,
    c.name AS company_name,
    COALESCE(NULLIF(p.full_name, ''), p.email) AS inviter_name
  FROM public.team_invites ti
  JOIN public.companies c ON c.id = ti.company_id
  LEFT JOIN public.profiles p ON p.user_id = ti.invited_by
  WHERE ti.token = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;

-- 7. accept_team_invite — caller must be logged in with matching email
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite     public.team_invites;
  v_user_id    uuid := auth.uid();
  v_user_email text;
  v_profile_company uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to accept this invite.';
  END IF;

  SELECT * INTO v_invite FROM public.team_invites WHERE token = p_token;
  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'This invite link is invalid.';
  END IF;
  IF v_invite.status = 'accepted' THEN
    RAISE EXCEPTION 'This invite has already been accepted.';
  END IF;
  IF v_invite.status = 'expired' OR v_invite.expires_at <= now() THEN
    UPDATE public.team_invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'This invite has expired. Ask your owner to send a new one.';
  END IF;

  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invite is for a different email address.';
  END IF;

  -- Ensure profile exists and is attached to the invite's company
  SELECT company_id INTO v_profile_company FROM public.profiles WHERE user_id = v_user_id;
  IF v_profile_company IS NULL THEN
    UPDATE public.profiles SET company_id = v_invite.company_id WHERE user_id = v_user_id;
  ELSIF v_profile_company <> v_invite.company_id THEN
    RAISE EXCEPTION 'You are already part of another workspace.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_invite.role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.team_invites
     SET status = 'accepted', accepted_at = now()
   WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'ok', true,
    'company_id', v_invite.company_id,
    'role', v_invite.role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invite(uuid) TO authenticated;