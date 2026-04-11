
-- Products: restrict write operations to non-accountants
DROP POLICY "Company members can insert products" ON products;
CREATE POLICY "Non-accountant members can insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY "Company members can update products" ON products;
CREATE POLICY "Non-accountant members can update products" ON products
  FOR UPDATE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role))
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY "Company members can delete products" ON products;
CREATE POLICY "Non-accountant members can delete products" ON products
  FOR DELETE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

-- Godowns: restrict write operations to non-accountants
DROP POLICY "Company members can insert godowns" ON godowns;
CREATE POLICY "Non-accountant members can insert godowns" ON godowns
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY "Company members can update godowns" ON godowns;
CREATE POLICY "Non-accountant members can update godowns" ON godowns
  FOR UPDATE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role))
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY "Company members can delete godowns" ON godowns;
CREATE POLICY "Non-accountant members can delete godowns" ON godowns
  FOR DELETE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

-- Stock items: restrict write operations to non-accountants
DROP POLICY "Company members can insert stock items" ON stock_items;
CREATE POLICY "Non-accountant members can insert stock items" ON stock_items
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY "Company members can update stock items" ON stock_items;
CREATE POLICY "Non-accountant members can update stock items" ON stock_items
  FOR UPDATE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role))
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY "Company members can delete stock items" ON stock_items;
CREATE POLICY "Non-accountant members can delete stock items" ON stock_items
  FOR DELETE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'::app_role));
