CREATE OR REPLACE FUNCTION public.delete_member_atomic(member_id uuid)
RETURNS TABLE(success boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_company uuid := public.get_company_id();
  v_target_user uuid;
  v_target_company uuid;
BEGIN
  IF v_caller_company IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no company context';
  END IF;

  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden: super_admin required';
  END IF;

  SELECT user_id, company_id INTO v_target_user, v_target_company
  FROM public.profiles WHERE id = member_id;

  IF v_target_user IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_target_company IS DISTINCT FROM v_caller_company THEN
    RAISE EXCEPTION 'Forbidden: company mismatch';
  END IF;

  IF v_target_user = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  BEGIN
    DELETE FROM public.user_roles
    WHERE user_id = v_target_user
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = v_target_user AND p.company_id = v_caller_company
      );

    DELETE FROM public.profiles WHERE id = member_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;

  RETURN QUERY SELECT true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_member_atomic(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_member_atomic(uuid) TO authenticated;