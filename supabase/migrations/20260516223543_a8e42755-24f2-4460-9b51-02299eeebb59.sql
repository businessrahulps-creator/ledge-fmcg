
-- ============================================================
-- PR-A: Capability model foundation (DB only, no behaviour change)
-- ============================================================

-- 1. Add 'viewer' to the existing app_role enum (used in PR-G)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Capability keys enum — the plain-English permission vocabulary
DO $$ BEGIN
  CREATE TYPE public.capability_key AS ENUM (
    'manage_team',
    'manage_billing',
    'see_money',
    'manage_stock',
    'manage_schemes',
    'see_all_dealers',
    'override_credit_limit',
    'view_error_logs',
    'see_own_performance_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Default capability set per role (seeded once, immutable from app)
CREATE TABLE IF NOT EXISTS public.role_capabilities_default (
  role        public.app_role      NOT NULL,
  capability  public.capability_key NOT NULL,
  PRIMARY KEY (role, capability)
);

ALTER TABLE public.role_capabilities_default ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated user (the UI needs to render defaults)
CREATE POLICY "Anyone authenticated can read defaults"
  ON public.role_capabilities_default FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies = locked from app. Seeded below.

-- 4. Per-user capability overrides (the "fine-tune access" toggles)
CREATE TABLE IF NOT EXISTS public.user_capability_overrides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  capability   public.capability_key NOT NULL,
  granted      boolean NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_user_cap_overrides_user
  ON public.user_capability_overrides (user_id);

ALTER TABLE public.user_capability_overrides ENABLE ROW LEVEL SECURITY;

-- Members of the same company can read overrides (so UI can show "Customised")
CREATE POLICY "Company members can view overrides"
  ON public.user_capability_overrides FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_capability_overrides.user_id
      AND p.company_id = public.get_company_id()
  ));

-- Only Owners (super_admin) in the same company can write overrides
CREATE POLICY "Owners can insert overrides"
  ON public.user_capability_overrides FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  );

CREATE POLICY "Owners can update overrides"
  ON public.user_capability_overrides FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  );

CREATE POLICY "Owners can delete overrides"
  ON public.user_capability_overrides FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_capability_overrides.user_id
        AND p.company_id = public.get_company_id()
    )
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS user_cap_overrides_updated_at ON public.user_capability_overrides;
CREATE TRIGGER user_cap_overrides_updated_at
  BEFORE UPDATE ON public.user_capability_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. has_capability() — override beats default, security definer, company-scoped
CREATE OR REPLACE FUNCTION public.has_capability(_user_id uuid, _capability public.capability_key)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override boolean;
  v_default  boolean;
BEGIN
  -- Same-company guard: caller must share a company with target user
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p_caller
    JOIN public.profiles p_target ON p_target.user_id = _user_id
    WHERE p_caller.user_id = auth.uid()
      AND p_caller.company_id IS NOT NULL
      AND p_caller.company_id = p_target.company_id
  ) AND _user_id <> auth.uid() THEN
    RETURN false;
  END IF;

  -- 1. Check override
  SELECT granted INTO v_override
  FROM public.user_capability_overrides
  WHERE user_id = _user_id AND capability = _capability;

  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- 2. Fall back to any of the user's role defaults
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_capabilities_default rcd ON rcd.role = ur.role
    WHERE ur.user_id = _user_id
      AND rcd.capability = _capability
  ) INTO v_default;

  RETURN COALESCE(v_default, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_capability(uuid, public.capability_key) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_capability(uuid, public.capability_key) TO authenticated;

-- 6. Seed defaults — exactly mirrors today's behaviour
-- Owner (super_admin): everything except 'see_own_performance_only'
INSERT INTO public.role_capabilities_default (role, capability) VALUES
  ('super_admin', 'manage_team'),
  ('super_admin', 'manage_billing'),
  ('super_admin', 'see_money'),
  ('super_admin', 'manage_stock'),
  ('super_admin', 'manage_schemes'),
  ('super_admin', 'see_all_dealers'),
  ('super_admin', 'override_credit_limit'),
  ('super_admin', 'view_error_logs')
ON CONFLICT DO NOTHING;

-- Manager (sales_manager): operations but no team/billing/error_logs
INSERT INTO public.role_capabilities_default (role, capability) VALUES
  ('sales_manager', 'see_money'),
  ('sales_manager', 'manage_stock'),
  ('sales_manager', 'manage_schemes'),
  ('sales_manager', 'see_all_dealers'),
  ('sales_manager', 'override_credit_limit')
ON CONFLICT DO NOTHING;

-- Accountant: money + dealer visibility, no stock/schemes
INSERT INTO public.role_capabilities_default (role, capability) VALUES
  ('accountant', 'see_money'),
  ('accountant', 'see_all_dealers')
ON CONFLICT DO NOTHING;

-- Sales Rep (salesperson): own performance only, no money/all-dealers
INSERT INTO public.role_capabilities_default (role, capability) VALUES
  ('salesperson', 'see_own_performance_only')
ON CONFLICT DO NOTHING;

-- Viewer: no write/grant capabilities (read-only handled by UI in PR-G)
-- No rows seeded intentionally.
