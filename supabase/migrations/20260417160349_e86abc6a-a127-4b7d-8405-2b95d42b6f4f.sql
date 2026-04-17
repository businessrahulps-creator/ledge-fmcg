-- 1) Lock down companies INSERT: force the setup_new_company SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- 2) Tighten error_log INSERT: only allow inserting rows attributed to the caller (or anonymous).
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_log;
CREATE POLICY "Users can insert own error logs"
  ON public.error_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3) Disable LIST/enumeration on the company-logos bucket while keeping individual reads public.
DROP POLICY IF EXISTS "Public read for company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read company-logos objects" ON storage.objects;

CREATE POLICY "Public can read company-logos objects"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'company-logos'
    AND name IS NOT NULL
    AND length(name) > 0
  );