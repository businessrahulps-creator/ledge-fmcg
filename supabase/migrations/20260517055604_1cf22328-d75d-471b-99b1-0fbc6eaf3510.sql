-- 1. Block viewers from mutating order_lines
DROP POLICY IF EXISTS "Users can update order lines for their company" ON public.order_lines;
DROP POLICY IF EXISTS "Users can delete order lines for their company" ON public.order_lines;

CREATE POLICY "Users can update order lines for their company"
ON public.order_lines
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id())
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id())
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
);

CREATE POLICY "Users can delete order lines for their company"
ON public.order_lines
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id())
  AND NOT public.has_role(auth.uid(), 'viewer'::app_role)
);

-- 2. Explicit INSERT policy for team_invites
CREATE POLICY "Owners can insert team invites"
ON public.team_invites
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_company_id()
  AND public.has_capability(auth.uid(), 'manage_team'::capability_key)
  AND invited_by = auth.uid()
);

-- 3. Move pg_net out of public schema (drop + recreate; not used anywhere in app code)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;
