CREATE OR REPLACE FUNCTION public.setup_new_company(p_company_name text, p_full_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_existing_company_id uuid;
BEGIN
  SELECT company_id INTO v_existing_company_id
  FROM profiles WHERE user_id = v_user_id;

  IF v_existing_company_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM companies WHERE id = v_existing_company_id) THEN
      RETURN v_existing_company_id;
    END IF;
    UPDATE profiles SET company_id = NULL WHERE user_id = v_user_id;
  END IF;

  INSERT INTO companies (name, trial_ends_at)
  VALUES (p_company_name, now() + interval '30 days')
  RETURNING id INTO v_company_id;

  UPDATE profiles
  SET company_id = v_company_id, full_name = p_full_name
  WHERE user_id = v_user_id;

  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_company_id;
END;
$function$;

ALTER TABLE public.companies
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '30 days');