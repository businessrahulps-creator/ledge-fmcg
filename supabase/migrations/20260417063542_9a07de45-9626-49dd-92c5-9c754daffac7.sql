-- Phase 4 fixes

-- 1. Fix refresh_entity_aggregates: use net total (total - scheme_savings) for distributor totals
CREATE OR REPLACE FUNCTION public.refresh_entity_aggregates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    IF TG_OP = 'DELETE' THEN v_order := OLD; ELSE v_order := NEW; END IF;

    UPDATE distributors SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0),
      outstanding_amount = COALESCE(sub.outstanding, 0)
    FROM (
      SELECT
        COUNT(*) cnt,
        COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)), 0) val,
        COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
      FROM orders WHERE distributor_id = v_order.distributor_id
    ) sub
    WHERE id = v_order.distributor_id;

    IF TG_OP = 'UPDATE' AND OLD.distributor_id <> NEW.distributor_id THEN
      UPDATE distributors SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0),
        outstanding_amount = COALESCE(sub.outstanding, 0)
      FROM (
        SELECT
          COUNT(*) cnt,
          COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)), 0) val,
          COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
        FROM orders WHERE distributor_id = OLD.distributor_id
      ) sub
      WHERE id = OLD.distributor_id;
    END IF;

    UPDATE salespersons SET
      total_orders = COALESCE(sub.cnt, 0),
      total_value = COALESCE(sub.val, 0)
    FROM (
      SELECT COUNT(*) cnt, COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)),0) val
      FROM orders WHERE salesperson_id = v_order.salesperson_id
    ) sub
    WHERE id = v_order.salesperson_id;

    IF TG_OP = 'UPDATE' AND OLD.salesperson_id <> NEW.salesperson_id THEN
      UPDATE salespersons SET
        total_orders = COALESCE(sub.cnt, 0),
        total_value = COALESCE(sub.val, 0)
      FROM (
        SELECT COUNT(*) cnt, COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)),0) val
        FROM orders WHERE salesperson_id = OLD.salesperson_id
      ) sub
      WHERE id = OLD.salesperson_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'order_lines' THEN
    IF TG_OP = 'DELETE' THEN
      UPDATE products SET total_sold = COALESCE(sub.qty, 0)
      FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = OLD.product_id) sub
      WHERE id = OLD.product_id;
    ELSE
      UPDATE products SET total_sold = COALESCE(sub.qty, 0)
      FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = NEW.product_id) sub
      WHERE id = NEW.product_id;
      IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
        UPDATE products SET total_sold = COALESCE(sub.qty, 0)
        FROM (SELECT COALESCE(SUM(quantity),0) qty FROM order_lines WHERE product_id = OLD.product_id) sub
        WHERE id = OLD.product_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;

-- Re-create triggers (in case they were missing — linter said no triggers)
DROP TRIGGER IF EXISTS trg_refresh_aggregates_orders ON public.orders;
CREATE TRIGGER trg_refresh_aggregates_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.refresh_entity_aggregates();

DROP TRIGGER IF EXISTS trg_refresh_aggregates_order_lines ON public.order_lines;
CREATE TRIGGER trg_refresh_aggregates_order_lines
AFTER INSERT OR UPDATE OR DELETE ON public.order_lines
FOR EACH ROW EXECUTE FUNCTION public.refresh_entity_aggregates();

-- 2. Add LIMIT 1 + ORDER BY to get_company_id() to harden against multi-profile rows
CREATE OR REPLACE FUNCTION public.get_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT company_id FROM public.profiles
  WHERE user_id = auth.uid() AND company_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1
$function$;

-- Enforce uniqueness of profiles.user_id to prevent multi-profile attack
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles(user_id);

-- 3. Backfill aggregates with corrected net values
UPDATE public.distributors d SET
  total_orders = COALESCE(sub.cnt, 0),
  total_value = COALESCE(sub.val, 0),
  outstanding_amount = COALESCE(sub.outstanding, 0)
FROM (
  SELECT distributor_id,
    COUNT(*) cnt,
    COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)), 0) val,
    COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN GREATEST(total - COALESCE(scheme_savings, 0), 0) ELSE 0 END), 0) outstanding
  FROM public.orders GROUP BY distributor_id
) sub
WHERE d.id = sub.distributor_id;

UPDATE public.salespersons s SET
  total_orders = COALESCE(sub.cnt, 0),
  total_value = COALESCE(sub.val, 0)
FROM (
  SELECT salesperson_id,
    COUNT(*) cnt,
    COALESCE(SUM(GREATEST(total - COALESCE(scheme_savings, 0), 0)), 0) val
  FROM public.orders GROUP BY salesperson_id
) sub
WHERE s.id = sub.salesperson_id;

-- 4. Tighten user_roles "manage" policy: super_admin can only manage roles for users in their own company
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

CREATE POLICY "Super admins can manage same-company roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
      AND p.company_id = get_company_id()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
      AND p.company_id = get_company_id()
  )
);
