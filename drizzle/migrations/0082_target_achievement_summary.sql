CREATE OR REPLACE FUNCTION public.target_achievement_summary(p_period_type text, p_period_start date)
RETURNS TABLE(entity_type text, entity_id uuid, gross numeric, returns_deducted numeric, returns_on_earlier_orders numeric, net numeric, delivered_count integer, fully_returned_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_company uuid := public.get_company_id();
  v_money boolean;
  v_from date;
  v_to date;
BEGIN
  IF v_uid IS NULL OR v_company IS NULL THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_period_start IS NULL THEN
    RAISE EXCEPTION 'Pick a period' USING ERRCODE = '22023';
  END IF;
  v_money := public.has_capability(v_uid, 'see_money');

  IF p_period_type = 'daily' THEN
    v_from := p_period_start; v_to := p_period_start;
  ELSIF p_period_type = 'weekly' THEN
    v_from := p_period_start - (extract(isodow FROM p_period_start)::int - 1);
    v_to := v_from + 6;
  ELSIF p_period_type = 'monthly' THEN
    v_from := date_trunc('month', p_period_start)::date;
    v_to := (v_from + interval '1 month' - interval '1 day')::date;
  ELSE
    RAISE EXCEPTION 'Unsupported period' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH d AS (
    SELECT o.id, o.salesperson_id, o.distributor_id,
           greatest(0, coalesce(o.total,0) - coalesce(o.scheme_savings,0)) AS amt
    FROM orders o
    WHERE o.company_id = v_company AND o.cancelled_at IS NULL
      AND o.delivery_status = 'delivered' AND o.delivered_at IS NOT NULL
      AND (o.delivered_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN v_from AND v_to
  ),
  billed AS (
    SELECT i.source_order_id AS oid, sum(il.quantity) AS q
    FROM invoices i JOIN invoice_lines il ON il.invoice_id = i.id
    WHERE i.company_id = v_company AND i.source_order_id IN (SELECT id FROM d)
      AND i.status IN ('posted','paid','partial','final')
    GROUP BY 1
  ),
  credited AS (
    SELECT cn.order_id AS oid, sum(cnl.quantity) AS q
    FROM credit_notes cn JOIN credit_note_lines cnl ON cnl.credit_note_id = cn.id
    WHERE cn.company_id = v_company AND cn.posted_at IS NOT NULL AND cn.order_id IN (SELECT id FROM d)
    GROUP BY 1
  ),
  fr AS (
    SELECT d.id FROM d JOIN billed b ON b.oid = d.id JOIN credited c ON c.oid = d.id
    WHERE b.q > 0 AND c.q >= b.q
  ),
  r AS (
    SELECT cn.id, o.salesperson_id, o.distributor_id, coalesce(cn.grand_total,0) AS amt,
           (o.delivered_at IS NOT NULL AND (o.delivered_at AT TIME ZONE 'Asia/Kolkata')::date < v_from) AS earlier
    FROM credit_notes cn JOIN orders o ON o.id = cn.order_id AND o.company_id = v_company
    WHERE cn.company_id = v_company AND cn.posted_at IS NOT NULL
      AND cn.note_date BETWEEN v_from AND v_to
  ),
  base AS (
    SELECT d.salesperson_id AS sp, d.distributor_id AS dl, d.amt AS g, 0::numeric AS rd, 0::numeric AS re,
           1 AS dc, (d.id IN (SELECT id FROM fr))::int AS frc
    FROM d
    UNION ALL
    SELECT r.salesperson_id, r.distributor_id, 0, r.amt, CASE WHEN r.earlier THEN r.amt ELSE 0 END, 0, 0
    FROM r
  ),
  ev AS (
    SELECT 'company'::text AS et, NULL::uuid AS eid, b.* FROM base b
    UNION ALL SELECT 'salesperson', b.sp, b.* FROM base b WHERE b.sp IS NOT NULL
    UNION ALL SELECT 'dealer', b.dl, b.* FROM base b WHERE b.dl IS NOT NULL
  )
  SELECT ev.et, ev.eid,
         CASE WHEN v_money THEN sum(ev.g) END,
         CASE WHEN v_money THEN sum(ev.rd) END,
         CASE WHEN v_money THEN sum(ev.re) END,
         CASE WHEN v_money THEN sum(ev.g) - sum(ev.rd) END,
         sum(ev.dc)::int, sum(ev.frc)::int
  FROM ev GROUP BY ev.et, ev.eid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.target_achievement_summary(text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.target_achievement_summary(text, date) TO authenticated, service_role;