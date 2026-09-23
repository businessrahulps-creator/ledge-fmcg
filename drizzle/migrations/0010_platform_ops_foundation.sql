-- ============================================================
-- Ledge Ops: internal platform admin foundation
-- Separate identity plane from customer roles. Read-only RPCs,
-- every call audited. Nothing here widens a customer policy.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_staff (
  user_id uuid PRIMARY KEY,
  level text NOT NULL DEFAULT 'owner',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_staff TO authenticated;
GRANT ALL ON public.platform_staff TO service_role;

ALTER TABLE public.platform_staff ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  action text NOT NULL,
  target_type text NOT NULL DEFAULT '',
  target_id text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_audit_log_created_idx
  ON public.platform_audit_log (created_at DESC);

GRANT SELECT ON public.platform_audit_log TO authenticated;
GRANT ALL ON public.platform_audit_log TO service_role;

ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

-- ---------- staff check (used by every policy + RPC) ----------

CREATE OR REPLACE FUNCTION public.is_platform_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_staff WHERE user_id = _user_id);
$$;

DROP POLICY IF EXISTS "staff read staff list" ON public.platform_staff;
CREATE POLICY "staff read staff list"
  ON public.platform_staff FOR SELECT TO authenticated
  USING (public.is_platform_staff(auth.uid()));

DROP POLICY IF EXISTS "staff read audit log" ON public.platform_audit_log;
CREATE POLICY "staff read audit log"
  ON public.platform_audit_log FOR SELECT TO authenticated
  USING (public.is_platform_staff(auth.uid()));

-- Seed: Rahul only (business.rahulps@gmail.com).
INSERT INTO public.platform_staff (user_id, level, note)
VALUES ('b289b014-bd4a-4d5d-b7c6-3cceee5a0fb9', 'owner', 'business.rahulps@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- ---------- internal guard + audit helper ----------

CREATE OR REPLACE FUNCTION public.ops_guard(p_action text, p_target_type text DEFAULT '', p_target_id text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  INSERT INTO public.platform_audit_log (actor, action, target_type, target_id)
  VALUES (auth.uid(), p_action, COALESCE(p_target_type, ''), COALESCE(p_target_id, ''));
END;
$$;

-- ---------- overview ----------

CREATE OR REPLACE FUNCTION public.ops_platform_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.ops_guard('view_summary');

  SELECT jsonb_build_object(
    'companies', (SELECT count(*) FROM public.companies),
    'companies_new_7d', (SELECT count(*) FROM public.companies WHERE created_at > now() - interval '7 days'),
    'companies_new_30d', (SELECT count(*) FROM public.companies WHERE created_at > now() - interval '30 days'),
    'users', (SELECT count(*) FROM public.profiles),
    'users_new_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'active_companies_7d', (SELECT count(DISTINCT company_id) FROM public.orders WHERE created_at > now() - interval '7 days'),
    'active_companies_30d', (SELECT count(DISTINCT company_id) FROM public.orders WHERE created_at > now() - interval '30 days'),
    'orders', (SELECT count(*) FROM public.orders),
    'orders_7d', (SELECT count(*) FROM public.orders WHERE created_at > now() - interval '7 days'),
    'invoices', (SELECT count(*) FROM public.invoices),
    'billed_value', (SELECT COALESCE(sum(grand_total), 0) FROM public.invoices),
    'collected_value', (SELECT COALESCE(sum(amount), 0) FROM public.invoice_payments WHERE status <> 'void'),
    'trials_ending_7d', (SELECT count(*) FROM public.companies WHERE trial_ends_at IS NOT NULL AND trial_ends_at BETWEEN now() AND now() + interval '7 days'),
    'open_errors_24h', (SELECT count(*) FROM public.error_log WHERE resolved = false AND created_at > now() - interval '24 hours')
  ) INTO result;

  RETURN result;
END;
$$;

-- ---------- businesses ----------

CREATE OR REPLACE FUNCTION public.ops_list_companies(
  p_search text DEFAULT '',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  trial_ends_at timestamptz,
  owner_name text,
  owner_email text,
  member_count bigint,
  order_count bigint,
  invoice_count bigint,
  billed_value numeric,
  outstanding numeric,
  last_activity timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := '%' || COALESCE(p_search, '') || '%';
BEGIN
  PERFORM public.ops_guard('view_companies', 'search', COALESCE(p_search, ''));

  RETURN QUERY
  WITH base AS (
    SELECT c.id, c.name, c.created_at, c.trial_ends_at
    FROM public.companies c
    WHERE COALESCE(p_search, '') = ''
       OR c.name ILIKE q
       OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.company_id = c.id AND p.email ILIKE q)
  ), counted AS (
    SELECT count(*) AS n FROM base
  )
  SELECT
    b.id,
    b.name,
    b.created_at,
    b.trial_ends_at,
    COALESCE((SELECT p.full_name FROM public.profiles p
              JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'super_admin'
              WHERE p.company_id = b.id ORDER BY p.created_at LIMIT 1), '') AS owner_name,
    COALESCE((SELECT p.email FROM public.profiles p
              JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'super_admin'
              WHERE p.company_id = b.id ORDER BY p.created_at LIMIT 1), '') AS owner_email,
    (SELECT count(*) FROM public.profiles p WHERE p.company_id = b.id) AS member_count,
    (SELECT count(*) FROM public.orders o WHERE o.company_id = b.id) AS order_count,
    (SELECT count(*) FROM public.invoices i WHERE i.company_id = b.id) AS invoice_count,
    (SELECT COALESCE(sum(i.grand_total), 0) FROM public.invoices i WHERE i.company_id = b.id) AS billed_value,
    (SELECT COALESCE(sum(d.outstanding_amount), 0) FROM public.distributors d WHERE d.company_id = b.id) AS outstanding,
    (SELECT max(o.created_at) FROM public.orders o WHERE o.company_id = b.id) AS last_activity,
    (SELECT n FROM counted) AS total_count
  FROM base b
  ORDER BY b.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 50), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.ops_company_detail(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.ops_guard('view_company', 'company', p_company_id::text);

  SELECT jsonb_build_object(
    'company', (SELECT to_jsonb(x) FROM (
        SELECT c.id, c.name, c.created_at, c.trial_ends_at, c.gstin, c.state_code,
               c.phone, c.email, c.order_prefix, c.invoice_prefix
        FROM public.companies c WHERE c.id = p_company_id
      ) x),
    'team', COALESCE((SELECT jsonb_agg(t ORDER BY t.created_at) FROM (
        SELECT p.full_name, p.email, p.phone, p.created_at, p.updated_at,
               COALESCE((SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.user_id LIMIT 1), '') AS role
        FROM public.profiles p WHERE p.company_id = p_company_id
      ) t), '[]'::jsonb),
    'usage', jsonb_build_object(
      'orders', (SELECT count(*) FROM public.orders WHERE company_id = p_company_id),
      'orders_30d', (SELECT count(*) FROM public.orders WHERE company_id = p_company_id AND created_at > now() - interval '30 days'),
      'invoices', (SELECT count(*) FROM public.invoices WHERE company_id = p_company_id),
      'billed_value', (SELECT COALESCE(sum(grand_total), 0) FROM public.invoices WHERE company_id = p_company_id),
      'collected_value', (SELECT COALESCE(sum(amount), 0) FROM public.invoice_payments WHERE company_id = p_company_id AND status <> 'void'),
      'dealers', (SELECT count(*) FROM public.distributors WHERE company_id = p_company_id),
      'products', (SELECT count(*) FROM public.products WHERE company_id = p_company_id),
      'outstanding', (SELECT COALESCE(sum(outstanding_amount), 0) FROM public.distributors WHERE company_id = p_company_id)
    ),
    'daily', COALESCE((SELECT jsonb_agg(d ORDER BY d.day) FROM (
        SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata')::date AS day,
               count(*) AS orders
        FROM public.orders
        WHERE company_id = p_company_id AND created_at > now() - interval '30 days'
        GROUP BY 1
      ) d), '[]'::jsonb),
    'errors', COALESCE((SELECT jsonb_agg(e ORDER BY e.created_at DESC) FROM (
        SELECT id, created_at, severity, source, message, resolved
        FROM public.error_log
        WHERE company_id = p_company_id
        ORDER BY created_at DESC LIMIT 20
      ) e), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

-- ---------- people ----------

CREATE OR REPLACE FUNCTION public.ops_list_users(
  p_search text DEFAULT '',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  company_id uuid,
  company_name text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := '%' || COALESCE(p_search, '') || '%';
BEGIN
  PERFORM public.ops_guard('view_users', 'search', COALESCE(p_search, ''));

  RETURN QUERY
  WITH base AS (
    SELECT p.*
    FROM public.profiles p
    WHERE COALESCE(p_search, '') = ''
       OR p.email ILIKE q
       OR p.full_name ILIKE q
  ), counted AS (SELECT count(*) AS n FROM base)
  SELECT
    b.user_id,
    b.full_name,
    b.email,
    b.phone,
    COALESCE((SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = b.user_id LIMIT 1), '') AS role,
    b.company_id,
    COALESCE((SELECT c.name FROM public.companies c WHERE c.id = b.company_id), '') AS company_name,
    b.created_at,
    b.updated_at,
    (SELECT n FROM counted) AS total_count
  FROM base b
  ORDER BY b.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 50), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

-- ---------- health ----------

CREATE OR REPLACE FUNCTION public.ops_recent_errors(p_limit integer DEFAULT 100, p_only_open boolean DEFAULT true)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  severity text,
  source text,
  message text,
  stack text,
  resolved boolean,
  company_id uuid,
  company_name text,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ops_guard('view_errors');

  RETURN QUERY
  SELECT e.id, e.created_at, e.severity, e.source, e.message, e.stack, e.resolved,
         e.company_id,
         COALESCE((SELECT c.name FROM public.companies c WHERE c.id = e.company_id), '') AS company_name,
         COALESCE((SELECT p.email FROM public.profiles p WHERE p.user_id = e.user_id LIMIT 1), '') AS user_email
  FROM public.error_log e
  WHERE (NOT p_only_open) OR e.resolved = false
  ORDER BY e.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1);
END;
$$;

-- ---------- activity ----------

CREATE OR REPLACE FUNCTION public.ops_recent_activity(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  company_id uuid,
  company_name text,
  user_name text,
  entity_type text,
  action text,
  summary text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ops_guard('view_activity');

  RETURN QUERY
  SELECT a.id, a.created_at, a.company_id,
         COALESCE((SELECT c.name FROM public.companies c WHERE c.id = a.company_id), '') AS company_name,
         a.user_name, a.entity_type, a.action, a.summary
  FROM public.activity_log a
  ORDER BY a.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1);
END;
$$;

-- ---------- execute allowlist (migration 0005 convention) ----------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'is_platform_staff', 'ops_guard', 'ops_platform_summary', 'ops_list_companies',
        'ops_company_detail', 'ops_list_users', 'ops_recent_errors', 'ops_recent_activity'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    IF r.proname <> 'ops_guard' THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
  END LOOP;
END $$;
