-- ================================================================
-- Dealer aging: views, state table, notification transition function
-- ================================================================

-- Index to make outstanding-order scans cheap
CREATE INDEX IF NOT EXISTS idx_orders_outstanding_delivered_at
  ON public.orders (company_id, distributor_id, delivered_at)
  WHERE delivery_status = 'delivered' AND payment_status IN ('pending', 'partial');

-- Per-order outstanding view (drives DealerDetail aging table)
CREATE OR REPLACE VIEW public.order_aging
WITH (security_invoker = true) AS
SELECT
  o.id              AS order_id,
  o.company_id,
  o.distributor_id,
  o.distributor_name,
  o.order_number,
  o.date            AS order_date,
  o.delivered_at,
  o.payment_status,
  GREATEST(o.total - COALESCE(o.scheme_savings, 0), 0)::numeric AS outstanding_amount,
  (CURRENT_DATE - COALESCE(o.delivered_at::date, o.date))::int  AS age_days,
  CASE
    WHEN (CURRENT_DATE - COALESCE(o.delivered_at::date, o.date)) > 90 THEN 'b90'
    WHEN (CURRENT_DATE - COALESCE(o.delivered_at::date, o.date)) > 60 THEN 'b61'
    WHEN (CURRENT_DATE - COALESCE(o.delivered_at::date, o.date)) > 30 THEN 'b31'
    ELSE 'b0'
  END AS bucket
FROM public.orders o
WHERE o.delivery_status = 'delivered'
  AND o.payment_status IN ('pending', 'partial');

-- Per-dealer rollup view (drives Dashboard card and reports export)
CREATE OR REPLACE VIEW public.dealer_aging
WITH (security_invoker = true) AS
WITH outstanding AS (
  SELECT
    company_id, distributor_id, distributor_name,
    outstanding_amount AS amt, age_days, payment_status
  FROM public.order_aging
)
SELECT
  d.company_id,
  d.id              AS distributor_id,
  d.name            AS distributor_name,
  d.credit_limit,
  COALESCE(SUM(o.amt) FILTER (WHERE o.age_days BETWEEN 0  AND 30), 0)::numeric AS bucket_0_30,
  COALESCE(SUM(o.amt) FILTER (WHERE o.age_days BETWEEN 31 AND 60), 0)::numeric AS bucket_31_60,
  COALESCE(SUM(o.amt) FILTER (WHERE o.age_days BETWEEN 61 AND 90), 0)::numeric AS bucket_61_90,
  COALESCE(SUM(o.amt) FILTER (WHERE o.age_days > 90),               0)::numeric AS bucket_90_plus,
  COALESCE(SUM(o.amt), 0)::numeric                                              AS total_outstanding,
  COALESCE(MAX(o.age_days), 0)::int                                             AS oldest_age_days,
  COUNT(*) FILTER (WHERE o.payment_status = 'partial')::int                     AS partial_count,
  CASE
    WHEN MAX(o.age_days) > 90 THEN 'b90'
    WHEN MAX(o.age_days) > 60 THEN 'b61'
    WHEN MAX(o.age_days) > 30 THEN 'b31'
    WHEN MAX(o.age_days) >= 0 THEN 'b0'
    ELSE NULL
  END AS worst_bucket
FROM public.distributors d
LEFT JOIN outstanding o
  ON o.distributor_id = d.id
 AND o.company_id     = d.company_id
GROUP BY d.company_id, d.id, d.name, d.credit_limit
HAVING COALESCE(SUM(o.amt), 0) > 0;

-- Persisted last-seen worst bucket per dealer (drives transition notifications)
CREATE TABLE IF NOT EXISTS public.dealer_aging_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  distributor_id uuid NOT NULL,
  last_worst_bucket text,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, distributor_id)
);

ALTER TABLE public.dealer_aging_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view aging state" ON public.dealer_aging_state;
CREATE POLICY "Company members can view aging state"
  ON public.dealer_aging_state FOR SELECT TO authenticated
  USING (company_id = public.get_company_id());

-- Bucket rank helper for ordering and "upward" detection
CREATE OR REPLACE FUNCTION public.aging_bucket_rank(b text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE b
    WHEN 'b0'  THEN 0
    WHEN 'b31' THEN 1
    WHEN 'b61' THEN 2
    WHEN 'b90' THEN 3
    ELSE -1
  END;
$$;

-- Run by a daily cron; finds dealers whose worst bucket escalated into b61 or b90
-- since last check and inserts a notification for every super_admin / sales_manager
-- in the company. Always updates state so downgrades are silent.
CREATE OR REPLACE FUNCTION public.check_aging_transitions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_user RECORD;
  v_prev_rank int;
  v_new_rank int;
  v_notifs int := 0;
  v_title text;
  v_msg text;
BEGIN
  FOR v_row IN
    SELECT da.*, ds.last_worst_bucket
    FROM public.dealer_aging da
    LEFT JOIN public.dealer_aging_state ds
      ON ds.company_id = da.company_id
     AND ds.distributor_id = da.distributor_id
  LOOP
    v_prev_rank := public.aging_bucket_rank(v_row.last_worst_bucket);
    v_new_rank  := public.aging_bucket_rank(v_row.worst_bucket);

    -- Notify on upward crossing into b61 or b90
    IF v_new_rank >= 2 AND v_new_rank > v_prev_rank THEN
      IF v_row.worst_bucket = 'b90' THEN
        v_title := v_row.distributor_name || ' — CRITICAL';
        v_msg   := v_row.distributor_name || ' — ₹' || to_char(v_row.total_outstanding, 'FM9,99,99,999') ||
                   ' CRITICAL — outstanding for 90+ days. Review credit limit.';
      ELSE
        v_title := v_row.distributor_name || ' — 60+ days overdue';
        v_msg   := v_row.distributor_name || ' has ₹' || to_char(v_row.total_outstanding, 'FM9,99,99,999') ||
                   ' overdue for 60+ days';
      END IF;

      FOR v_user IN
        SELECT DISTINCT p.user_id
        FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.user_id
        WHERE p.company_id = v_row.company_id
          AND ur.role IN ('super_admin', 'sales_manager')
      LOOP
        INSERT INTO public.notifications (user_id, company_id, title, message, type)
        VALUES (v_user.user_id, v_row.company_id, v_title, v_msg, 'credit_risk');
        v_notifs := v_notifs + 1;
      END LOOP;
    END IF;

    -- Always persist current state
    INSERT INTO public.dealer_aging_state (company_id, distributor_id, last_worst_bucket, last_checked_at)
    VALUES (v_row.company_id, v_row.distributor_id, v_row.worst_bucket, now())
    ON CONFLICT (company_id, distributor_id) DO UPDATE
      SET last_worst_bucket = EXCLUDED.last_worst_bucket,
          last_checked_at   = EXCLUDED.last_checked_at;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'notifications_sent', v_notifs);
END;
$$;