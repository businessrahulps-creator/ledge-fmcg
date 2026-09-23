-- Platform staff accounts are not customers. Keep them out of the
-- "Registered users" figure and the People list so the platform numbers
-- stay honest once a shared team login exists.

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
    'users', (SELECT count(*) FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.platform_staff s WHERE s.user_id = p.user_id)),
    'users_new_7d', (SELECT count(*) FROM public.profiles p WHERE p.created_at > now() - interval '7 days' AND NOT EXISTS (SELECT 1 FROM public.platform_staff s WHERE s.user_id = p.user_id)),
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
    WHERE NOT EXISTS (SELECT 1 FROM public.platform_staff s WHERE s.user_id = p.user_id)
      AND (
        COALESCE(p_search, '') = ''
        OR p.email ILIKE q
        OR p.full_name ILIKE q
      )
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

REVOKE ALL ON FUNCTION public.ops_platform_summary() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ops_list_users(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ops_platform_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ops_list_users(text, integer, integer) TO authenticated, service_role;
