CREATE POLICY "Company members can update claim lines"
ON public.claim_lines FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()))
WITH CHECK (EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id()));

CREATE POLICY "Company members can update secondary sales"
ON public.secondary_sales FOR UPDATE TO authenticated
USING (company_id = get_company_id())
WITH CHECK (company_id = get_company_id());

CREATE POLICY "Company members can update stock deductions"
ON public.stock_deductions FOR UPDATE TO authenticated
USING (company_id = get_company_id())
WITH CHECK (company_id = get_company_id());