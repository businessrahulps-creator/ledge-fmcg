
-- Drop the two existing SELECT policies
DROP POLICY "Users can view their own profile" ON public.profiles;
DROP POLICY "Users can view own-company profiles" ON public.profiles;

-- Create one consolidated SELECT policy
CREATE POLICY "Users can view relevant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR company_id = get_company_id());
