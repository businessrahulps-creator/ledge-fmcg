-- One-time backfill: ensure every auth.users row has a profiles row,
-- and auto-create companies for orphans whose metadata has a company_name.
DO $$
DECLARE
  u RECORD;
  v_company_id uuid;
  v_company_name text;
  v_full_name text;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.id IS NULL
  LOOP
    v_full_name := COALESCE(u.raw_user_meta_data ->> 'full_name', '');
    v_company_name := NULLIF(TRIM(COALESCE(u.raw_user_meta_data ->> 'company_name', '')), '');

    -- Insert missing profile
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (u.id, v_full_name, COALESCE(u.email, ''))
    ON CONFLICT DO NOTHING;

    -- If we have a company name in metadata, build the workspace too
    IF v_company_name IS NOT NULL THEN
      INSERT INTO public.companies (name, trial_ends_at)
      VALUES (v_company_name, now() + interval '30 days')
      RETURNING id INTO v_company_id;

      UPDATE public.profiles
      SET company_id = v_company_id,
          full_name = COALESCE(NULLIF(v_full_name, ''), full_name)
      WHERE user_id = u.id;

      INSERT INTO public.user_roles (user_id, role)
      VALUES (u.id, 'super_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END LOOP;
END $$;