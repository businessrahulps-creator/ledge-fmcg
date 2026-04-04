
-- Drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- Allow any authenticated user to insert a company.
-- The app ensures this only happens once during signup.
CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);
