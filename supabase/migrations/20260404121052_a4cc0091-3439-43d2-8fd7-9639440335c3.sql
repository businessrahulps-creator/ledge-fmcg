
DROP POLICY "Authenticated users can create a company" ON public.companies;
CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (get_company_id() IS NULL);
