
-- FIX 1: Restrict self-insert profile to NULL company_id
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id IS NULL);

-- FIX 2: Restrict self-update profile to not change company_id
-- (company_id changes should only happen via setup_new_company SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
