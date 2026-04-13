
CREATE POLICY "Company members can update invoice lines"
ON invoice_lines FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id()))
WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.company_id = get_company_id()));

CREATE POLICY "Company members can update order schemes"
ON order_schemes FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_schemes.order_id AND o.company_id = get_company_id()))
WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_schemes.order_id AND o.company_id = get_company_id()));
