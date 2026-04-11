
-- Super admins can insert profiles for their company
CREATE POLICY "Super admins can insert company profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND company_id = get_company_id()
);

-- Super admins can update profiles within their company
CREATE POLICY "Super admins can update company profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND company_id = get_company_id()
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND company_id = get_company_id()
);

-- Super admins can delete profiles within their company (but not their own)
CREATE POLICY "Super admins can delete company profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND company_id = get_company_id()
  AND user_id != auth.uid()
);
