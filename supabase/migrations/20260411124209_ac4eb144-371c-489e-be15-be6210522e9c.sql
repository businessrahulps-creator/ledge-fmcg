
-- Fix profiles update policy to target authenticated role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND (
    company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

-- Fix notifications insert policy to target authenticated role
DROP POLICY IF EXISTS "Privileged users can insert company notifications" ON public.notifications;

CREATE POLICY "Privileged users can insert company notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (company_id = get_company_id())
  AND (get_company_id() IS NOT NULL)
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'sales_manager'::app_role)
  )
);
