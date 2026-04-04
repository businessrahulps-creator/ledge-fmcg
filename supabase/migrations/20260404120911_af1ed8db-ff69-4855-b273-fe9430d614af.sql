
-- Fix companies INSERT: use a simpler check that works before profile has company_id
DROP POLICY "Authenticated users can create a company" ON public.companies;
CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()) IS NULL
  );

-- Allow users to always view their own profile row
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
