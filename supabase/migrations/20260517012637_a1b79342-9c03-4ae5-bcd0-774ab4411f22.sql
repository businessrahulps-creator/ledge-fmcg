-- ORDERS (UPDATE + DELETE only; INSERT already place_orders-gated)
DROP POLICY "Company members can update orders" ON public.orders;
CREATE POLICY "Company members can update orders" ON public.orders FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete orders" ON public.orders;
CREATE POLICY "Company members can delete orders" ON public.orders FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- CLAIMS
DROP POLICY "Company members can insert claims" ON public.claims;
CREATE POLICY "Company members can insert claims" ON public.claims FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update claims" ON public.claims;
CREATE POLICY "Company members can update claims" ON public.claims FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete claims" ON public.claims;
CREATE POLICY "Company members can delete claims" ON public.claims FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- CLAIM_LINES
DROP POLICY "Company members can insert claim lines" ON public.claim_lines;
CREATE POLICY "Company members can insert claim lines" ON public.claim_lines FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

DROP POLICY "Company members can update claim lines" ON public.claim_lines;
CREATE POLICY "Company members can update claim lines" ON public.claim_lines FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

DROP POLICY "Company members can delete claim lines" ON public.claim_lines;
CREATE POLICY "Company members can delete claim lines" ON public.claim_lines FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM claims c WHERE c.id = claim_lines.claim_id AND c.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

-- DISTRIBUTORS
DROP POLICY "Company members can insert distributors" ON public.distributors;
CREATE POLICY "Company members can insert distributors" ON public.distributors FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update distributors" ON public.distributors;
CREATE POLICY "Company members can update distributors" ON public.distributors FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete distributors" ON public.distributors;
CREATE POLICY "Company members can delete distributors" ON public.distributors FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- SALESPERSONS
DROP POLICY "Company members can insert salespersons" ON public.salespersons;
CREATE POLICY "Company members can insert salespersons" ON public.salespersons FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update salespersons" ON public.salespersons;
CREATE POLICY "Company members can update salespersons" ON public.salespersons FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete salespersons" ON public.salespersons;
CREATE POLICY "Company members can delete salespersons" ON public.salespersons FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- INVOICES
DROP POLICY "Company members can insert invoices" ON public.invoices;
CREATE POLICY "Company members can insert invoices" ON public.invoices FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update invoices" ON public.invoices;
CREATE POLICY "Company members can update invoices" ON public.invoices FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete invoices" ON public.invoices;
CREATE POLICY "Company members can delete invoices" ON public.invoices FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- INVOICE_LINES
DROP POLICY "Company members can insert invoice lines" ON public.invoice_lines;
CREATE POLICY "Company members can insert invoice lines" ON public.invoice_lines FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

DROP POLICY "Company members can update invoice lines" ON public.invoice_lines;
CREATE POLICY "Company members can update invoice lines" ON public.invoice_lines FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

DROP POLICY "Company members can delete invoice lines" ON public.invoice_lines;
CREATE POLICY "Company members can delete invoice lines" ON public.invoice_lines FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id())
  AND NOT has_role(auth.uid(), 'viewer'::app_role)
);

-- SECONDARY_SALES
DROP POLICY "Company members can insert secondary sales" ON public.secondary_sales;
CREATE POLICY "Company members can insert secondary sales" ON public.secondary_sales FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update secondary sales" ON public.secondary_sales;
CREATE POLICY "Company members can update secondary sales" ON public.secondary_sales FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete secondary sales" ON public.secondary_sales;
CREATE POLICY "Company members can delete secondary sales" ON public.secondary_sales FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- TARGETS
DROP POLICY "Company members can insert targets" ON public.targets;
CREATE POLICY "Company members can insert targets" ON public.targets FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update targets" ON public.targets;
CREATE POLICY "Company members can update targets" ON public.targets FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete targets" ON public.targets;
CREATE POLICY "Company members can delete targets" ON public.targets FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

-- STOCK_DEDUCTIONS
DROP POLICY "Company members can insert stock deductions" ON public.stock_deductions;
CREATE POLICY "Company members can insert stock deductions" ON public.stock_deductions FOR INSERT TO authenticated
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can update stock deductions" ON public.stock_deductions;
CREATE POLICY "Company members can update stock deductions" ON public.stock_deductions FOR UPDATE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));

DROP POLICY "Company members can delete stock deductions" ON public.stock_deductions;
CREATE POLICY "Company members can delete stock deductions" ON public.stock_deductions FOR DELETE TO authenticated
USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role));