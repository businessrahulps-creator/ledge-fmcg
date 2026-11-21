CREATE OR REPLACE FUNCTION public.ops_company_members(p_company uuid)
RETURNS TABLE(user_id uuid, full_name text, email text, role text, is_master boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ops_guard('view_company_members', 'company', p_company::text);
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.email, r.role::text, (c.master_owner_user_id = p.user_id)
  FROM profiles p JOIN companies c ON c.id = p.company_id
  LEFT JOIN user_roles r ON r.user_id = p.user_id
  WHERE p.company_id = p_company
  ORDER BY (c.master_owner_user_id = p.user_id) DESC, p.full_name;
END $$;
REVOKE ALL ON FUNCTION public.ops_company_members(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ops_company_members(uuid) TO authenticated;