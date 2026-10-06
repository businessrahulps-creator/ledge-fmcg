CREATE OR REPLACE FUNCTION public.my_pending_invite()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ti.token
  FROM public.team_invites ti
  WHERE ti.status = 'pending'
    AND ti.expires_at > now()
    AND lower(ti.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.company_id IS NOT NULL)
  ORDER BY ti.created_at DESC
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.my_pending_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_pending_invite() TO authenticated;