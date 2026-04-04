
-- Create a single function to handle all post-signup setup
CREATE OR REPLACE FUNCTION public.setup_new_company(
  p_company_name text,
  p_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
BEGIN
  -- 1. Create company
  INSERT INTO companies (name)
  VALUES (p_company_name)
  RETURNING id INTO v_company_id;

  -- 2. Link profile to company
  UPDATE profiles
  SET company_id = v_company_id, full_name = p_full_name
  WHERE user_id = v_user_id;

  -- 3. Assign super_admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Seed sample data
  PERFORM seed_company_data(v_company_id);

  RETURN v_company_id;
END;
$$;
