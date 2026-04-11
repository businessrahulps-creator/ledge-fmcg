
-- 1. Fix profiles: prevent users from changing their own company_id
-- Drop the existing broad "Users can update their own profile" policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a replacement that prevents company_id changes
-- Users can update their own profile but company_id must remain unchanged
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND (
    company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

-- 2. Fix notifications: restrict INSERT to privileged roles only
DROP POLICY IF EXISTS "Users can insert company notifications" ON public.notifications;

CREATE POLICY "Privileged users can insert company notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  (company_id = get_company_id())
  AND (get_company_id() IS NOT NULL)
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'sales_manager'::app_role)
  )
);
