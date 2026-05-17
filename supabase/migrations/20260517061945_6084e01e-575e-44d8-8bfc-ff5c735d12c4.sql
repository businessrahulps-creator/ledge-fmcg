
DROP POLICY IF EXISTS "Super admins can update their company" ON public.companies;
CREATE POLICY "Super admins can update their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_team'::public.capability_key))
  WITH CHECK (id = public.get_company_id() AND public.has_capability(auth.uid(), 'manage_team'::public.capability_key));

DROP POLICY IF EXISTS "Company members can update order schemes" ON public.order_schemes;
CREATE POLICY "Company members can update order schemes"
  ON public.order_schemes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_schemes.order_id AND o.company_id = public.get_company_id())
    AND NOT public.has_role(auth.uid(), 'viewer'::public.app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_schemes.order_id AND o.company_id = public.get_company_id())
    AND NOT public.has_role(auth.uid(), 'viewer'::public.app_role)
  );

DROP POLICY IF EXISTS "Company members can delete order schemes" ON public.order_schemes;
CREATE POLICY "Company members can delete order schemes"
  ON public.order_schemes FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_schemes.order_id AND o.company_id = public.get_company_id())
    AND NOT public.has_role(auth.uid(), 'viewer'::public.app_role)
  );
