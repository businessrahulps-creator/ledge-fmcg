REVOKE EXECUTE ON FUNCTION public.send_team_invite(text, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resend_team_invite(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_team_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_team_invite(text, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resend_team_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(uuid) TO authenticated;
