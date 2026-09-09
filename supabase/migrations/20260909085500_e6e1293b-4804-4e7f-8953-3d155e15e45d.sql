REVOKE EXECUTE ON FUNCTION public.send_team_invite(text, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resend_team_invite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_team_invite(uuid) FROM anon;
