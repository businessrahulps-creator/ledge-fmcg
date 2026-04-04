
DROP POLICY "Authenticated users can create a company" ON public.companies;

CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND company_id IS NOT NULL
    )
  );
