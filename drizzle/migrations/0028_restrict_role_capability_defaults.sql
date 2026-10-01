DROP POLICY IF EXISTS "Anyone authenticated can read defaults" ON public.role_capabilities_default;
CREATE POLICY "Team managers can read defaults" ON public.role_capabilities_default
  FOR SELECT TO authenticated
  USING (public.has_capability(auth.uid(), 'manage_team'::public.capability_key));