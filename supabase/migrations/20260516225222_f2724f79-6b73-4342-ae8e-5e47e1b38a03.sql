-- =========================================================================
-- PR-C: Migrate 21 RLS policies from has_role() to has_capability()
-- =========================================================================

-- 1-2. error_log (view + update)
DROP POLICY IF EXISTS "Super admins can view company error logs" ON public.error_log;
CREATE POLICY "Super admins can view company error logs"
  ON public.error_log FOR SELECT TO authenticated
  USING (
    public.has_capability(auth.uid(), 'view_error_logs')
    AND (company_id IS NULL OR company_id = public.get_company_id())
  );

DROP POLICY IF EXISTS "Super admins can update company error logs" ON public.error_log;
CREATE POLICY "Super admins can update company error logs"
  ON public.error_log FOR UPDATE TO authenticated
  USING (
    public.has_capability(auth.uid(), 'view_error_logs')
    AND (company_id IS NULL OR company_id = public.get_company_id())
  )
  WITH CHECK (
    public.has_capability(auth.uid(), 'view_error_logs')
    AND (company_id IS NULL OR company_id = public.get_company_id())
  );

-- 3-5. godowns (insert/update/delete)
DROP POLICY IF EXISTS "Non-accountant members can insert godowns" ON public.godowns;
CREATE POLICY "Non-accountant members can insert godowns"
  ON public.godowns FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

DROP POLICY IF EXISTS "Non-accountant members can update godowns" ON public.godowns;
CREATE POLICY "Non-accountant members can update godowns"
  ON public.godowns FOR UPDATE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

DROP POLICY IF EXISTS "Non-accountant members can delete godowns" ON public.godowns;
CREATE POLICY "Non-accountant members can delete godowns"
  ON public.godowns FOR DELETE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

-- 6-8. products (insert/update/delete)
DROP POLICY IF EXISTS "Non-accountant members can insert products" ON public.products;
CREATE POLICY "Non-accountant members can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

DROP POLICY IF EXISTS "Non-accountant members can update products" ON public.products;
CREATE POLICY "Non-accountant members can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

DROP POLICY IF EXISTS "Non-accountant members can delete products" ON public.products;
CREATE POLICY "Non-accountant members can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

-- 9-11. stock_items (insert/update/delete)
DROP POLICY IF EXISTS "Non-accountant members can insert stock items" ON public.stock_items;
CREATE POLICY "Non-accountant members can insert stock items"
  ON public.stock_items FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

DROP POLICY IF EXISTS "Non-accountant members can update stock items" ON public.stock_items;
CREATE POLICY "Non-accountant members can update stock items"
  ON public.stock_items FOR UPDATE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

DROP POLICY IF EXISTS "Non-accountant members can delete stock items" ON public.stock_items;
CREATE POLICY "Non-accountant members can delete stock items"
  ON public.stock_items FOR DELETE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_stock')
  );

-- 12-14. schemes (insert/update/delete) — intentional widening to sales_manager
DROP POLICY IF EXISTS "Super admins can insert schemes" ON public.schemes;
CREATE POLICY "Super admins can insert schemes"
  ON public.schemes FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_schemes')
  );

DROP POLICY IF EXISTS "Super admins can update schemes" ON public.schemes;
CREATE POLICY "Super admins can update schemes"
  ON public.schemes FOR UPDATE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_schemes')
  )
  WITH CHECK (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_schemes')
  );

DROP POLICY IF EXISTS "Super admins can delete schemes" ON public.schemes;
CREATE POLICY "Super admins can delete schemes"
  ON public.schemes FOR DELETE TO authenticated
  USING (
    company_id = public.get_company_id()
    AND public.has_capability(auth.uid(), 'manage_schemes')
  );

-- 15. notifications — INTENTIONALLY LEFT ON has_role() (see PR-C plan, option b)

-- 16-18. profiles (insert/update/delete)
DROP POLICY IF EXISTS "Super admins can insert company profiles" ON public.profiles;
CREATE POLICY "Super admins can insert company profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    public.has_capability(auth.uid(), 'manage_team')
    AND company_id = public.get_company_id()
  );

DROP POLICY IF EXISTS "Super admins can update company profiles" ON public.profiles;
CREATE POLICY "Super admins can update company profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.has_capability(auth.uid(), 'manage_team')
    AND company_id = public.get_company_id()
  )
  WITH CHECK (
    public.has_capability(auth.uid(), 'manage_team')
    AND company_id = public.get_company_id()
  );

DROP POLICY IF EXISTS "Super admins can delete company profiles" ON public.profiles;
CREATE POLICY "Super admins can delete company profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (
    public.has_capability(auth.uid(), 'manage_team')
    AND company_id = public.get_company_id()
    AND user_id <> auth.uid()
  );

-- 19. user_roles (ALL)
DROP POLICY IF EXISTS "Super admins can manage same-company roles" ON public.user_roles;
CREATE POLICY "Super admins can manage same-company roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (
    public.has_capability(auth.uid(), 'manage_team')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_roles.user_id
        AND p.company_id = public.get_company_id()
    )
  )
  WITH CHECK (
    public.has_capability(auth.uid(), 'manage_team')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_roles.user_id
        AND p.company_id = public.get_company_id()
    )
  );

-- 20-22. user_capability_overrides (insert/update/delete)
DROP POLICY IF EXISTS "Owners can insert overrides" ON public.user_capability_overrides;
CREATE POLICY "Owners can insert overrides"
  ON public.user_capability_overrides FOR INSERT TO authenticated
  WITH CHECK (
    public.has_capability(auth.uid(), 'manage_team')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  );

DROP POLICY IF EXISTS "Owners can update overrides" ON public.user_capability_overrides;
CREATE POLICY "Owners can update overrides"
  ON public.user_capability_overrides FOR UPDATE TO authenticated
  USING (
    public.has_capability(auth.uid(), 'manage_team')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  )
  WITH CHECK (
    public.has_capability(auth.uid(), 'manage_team')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  );

DROP POLICY IF EXISTS "Owners can delete overrides" ON public.user_capability_overrides;
CREATE POLICY "Owners can delete overrides"
  ON public.user_capability_overrides FOR DELETE TO authenticated
  USING (
    public.has_capability(auth.uid(), 'manage_team')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  );
