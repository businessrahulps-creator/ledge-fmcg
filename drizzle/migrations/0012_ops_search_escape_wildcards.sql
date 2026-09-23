CREATE OR REPLACE FUNCTION public.ops_list_companies(p_search text DEFAULT ''::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, created_at timestamp with time zone, trial_ends_at timestamp with time zone, owner_name text, owner_email text, member_count bigint, order_count bigint, invoice_count bigint, billed_value numeric, outstanding numeric, last_activity timestamp with time zone, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q text := '%' || replace(replace(replace(COALESCE(p_search, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
BEGIN
  PERFORM public.ops_guard('view_companies', 'search', COALESCE(p_search, ''));

  RETURN QUERY
  WITH base AS (
    SELECT c.id, c.name, c.created_at, c.trial_ends_at
    FROM public.companies c
    WHERE COALESCE(p_search, '') = ''
       OR c.name ILIKE q ESCAPE '\'
       OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.company_id = c.id AND p.email ILIKE q ESCAPE '\')
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
$function$;

CREATE OR REPLACE FUNCTION public.ops_list_users(p_search text DEFAULT ''::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(user_id uuid, full_name text, email text, phone text, role text, company_id uuid, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q text := '%' || replace(replace(replace(COALESCE(p_search, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
BEGIN
  PERFORM public.ops_guard('view_users', 'search', COALESCE(p_search, ''));

  RETURN QUERY
  WITH base AS (
    SELECT p.*
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.platform_staff s WHERE s.user_id = p.user_id)
      AND (
        COALESCE(p_search, '') = ''
        OR p.email ILIKE q ESCAPE '\'
        OR p.full_name ILIKE q ESCAPE '\'
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
$function$;