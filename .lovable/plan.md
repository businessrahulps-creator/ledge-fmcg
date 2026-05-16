# Aging-based credit & outstanding view

## Source of truth: orders, not invoices

The PRD calls this "invoice aging" but in this codebase `invoices` are optional documents (often not generated for every delivered order) and have no `payment_status` column — only `status` (draft/issued). The real outstanding ledger lives on `orders`: `distributors.outstanding_amount` is already computed by `refresh_entity_aggregates()` as the sum of delivered orders with `payment_status IN ('pending','partial')`, net of scheme savings.

We'll use that same definition for aging:

- An order contributes to outstanding if `delivery_status = 'delivered'` AND `payment_status IN ('pending','partial')`.
- Age = `today - delivered_at` (fall back to `date` when `delivered_at` is null — rare).
- Outstanding amount = `GREATEST(total - COALESCE(scheme_savings, 0), 0)`. We do not have `amount_paid` per order; a `partial` order is shown at full outstanding with a "Partial" badge, exactly as the PRD's edge-case note requires.

Cancelled orders are already excluded because they never reach `delivered`. Invoices and their `status` field are not used for aging logic.

## 1. Database — aging view

New SECURITY INVOKER view `dealer_aging` (RLS on `orders` and `distributors` flows through automatically — RBAC for accountant/salesperson is handled by row visibility plus the territory check in step 5):

```text
dealer_aging
  company_id, distributor_id, distributor_name, credit_limit,
  bucket_0_30, bucket_31_60, bucket_61_90, bucket_90_plus,
  total_outstanding, oldest_age_days, partial_count,
  worst_bucket  -- 'b90', 'b61', 'b31', 'b0', or NULL
```

Computed by `SUM(... FILTER WHERE age BETWEEN ...)` over the qualifying orders and joined to `distributors`. Returns a row per dealer with at least one outstanding order. Plus a sibling view `order_aging` (one row per outstanding order: order_id, order_number, date, delivered_at, age_days, bucket, outstanding_amount, payment_status, distributor_id) for the DealerDetail invoice list.

Indexes: `idx_orders_outstanding_delivered_at` on `(company_id, distributor_id, delivered_at) WHERE delivery_status='delivered' AND payment_status IN ('pending','partial')`.

## 2. Frontend — aging hook

New `src/lib/aging.ts` exposing pure functions: `bucketize(ageDays)`, `bucketLabel`, `bucketTone` (returns one of `muted | amber | terracotta | destructive`). Wired to existing semantic tokens — no new colors.

New `src/hooks/use-dealer-aging.ts` that selects from the view via `supabase.from('dealer_aging').select(...)` and caches in `DataContext`'s phase 2 (so Dashboard / DealerDetail / Reports all read the same memoised array). Falls back to a client-side compute over `orders` when offline (we already have orders cached locally).

## 3. Dashboard "Credit at Risk" upgrade

Replace the current `dealersAtRisk` block (lines 198-206 + 529-553 of `Dashboard.tsx`) with an aging-driven `SignalCard`:

- Header: total outstanding + dealer count across the company.
- Top 5 dealers sorted by `worst_bucket DESC, total_outstanding DESC`.
- Each row: dealer name → DealerDetail link, outstanding amount (`.num`), bucket pill using `bucketTone`.
- Hidden entirely for `userRole === 'salesperson'`.
- Empty state ("All clear") replaces it when no dealer has any outstanding.

Reuses `SignalCard` + `StatusBadge` — no new primitives.

## 4. DealerDetail "Outstanding & Aging" section

Inserted under the existing profile card (above the orders/secondary-sales tabs):

- **Summary strip** (3 stats): Total Outstanding | Credit Limit (or "No limit set") | Utilization % (suppress and show "—" when `credit_limit <= 0`).
- **4-bucket segmented bar**: pure flex children with `width: ${pct}%`, tinted with bucket tokens. Bucket label + amount below each segment.
- **Outstanding orders table**: Order # | Date | Total | Outstanding | Age | Status. Sorted by `age_days DESC`. Row click → `/orders/:id` (existing detail page already has the "Record Payment" UX via paymentStatus select — no new modal needed).
- Mobile: table sits inside `overflow-x-auto`; bucket bar wraps to 2x2 under `sm`.

## 5. RBAC

- `super_admin`, `sales_manager`, `accountant`: full view.
- `salesperson`: aging filtered to dealers they have orders for. Computed client-side via `orders.filter(o => o.salespersonId === currentSalespersonId).map(o => o.distributorId)` and intersecting the view rows — no extra RLS policy needed since the salesperson can already see all dealers in their company; we just hide rows they don't own.
- Dashboard Credit at Risk card hidden entirely for salesperson.

## 6. Notifications on bucket transition

New table `dealer_aging_state` (one row per `(company_id, distributor_id)`, columns: `last_worst_bucket text`, `last_checked_at timestamptz`). A scheduled Postgres function `check_aging_transitions()` (run by a new daily edge function `aging-check` on a cron) compares the current `dealer_aging.worst_bucket` to `last_worst_bucket` and inserts into `notifications` for every user with role `super_admin` or `sales_manager` in the company when:

- transitioned into `b61` → "{Dealer} has ₹X overdue for 60+ days"
- transitioned into `b90` → "{Dealer} — ₹X CRITICAL — outstanding for 90+ days. Review credit limit."

Only fires on upward transitions; downgrades silently update state. The function uses `SECURITY DEFINER` and the existing `notifications` insert path.

## 7. Payment Report — Aging Summary export

In `PaymentReport.tsx`, add a second "Export → Aging Summary (XLSX)" button. Reuses the existing xlsx chunk via `utils/exportCsv` infrastructure. Columns: Dealer | 0–30 | 31–60 | 61–90 | 90+ | Total Outstanding | Credit Limit | Utilization %. Driven straight off `dealer_aging`.

## Technical details

```text
View definition (sketch)
─────────────────────────
CREATE VIEW dealer_aging AS
WITH outstanding AS (
  SELECT o.company_id, o.distributor_id, o.payment_status,
         GREATEST(o.total - COALESCE(o.scheme_savings,0), 0) AS amt,
         (CURRENT_DATE - COALESCE(o.delivered_at::date, o.date))::int AS age_days
  FROM orders o
  WHERE o.delivery_status = 'delivered'
    AND o.payment_status IN ('pending','partial')
)
SELECT
  d.company_id, d.id AS distributor_id, d.name AS distributor_name,
  d.credit_limit,
  COALESCE(SUM(amt) FILTER (WHERE age_days BETWEEN 0  AND 30), 0) AS bucket_0_30,
  COALESCE(SUM(amt) FILTER (WHERE age_days BETWEEN 31 AND 60), 0) AS bucket_31_60,
  COALESCE(SUM(amt) FILTER (WHERE age_days BETWEEN 61 AND 90), 0) AS bucket_61_90,
  COALESCE(SUM(amt) FILTER (WHERE age_days > 90),               0) AS bucket_90_plus,
  COALESCE(SUM(amt), 0)                                            AS total_outstanding,
  COALESCE(MAX(age_days), 0)                                       AS oldest_age_days,
  COUNT(*) FILTER (WHERE payment_status = 'partial')               AS partial_count,
  CASE
    WHEN MAX(age_days) > 90 THEN 'b90'
    WHEN MAX(age_days) > 60 THEN 'b61'
    WHEN MAX(age_days) > 30 THEN 'b31'
    WHEN MAX(age_days) >= 0 THEN 'b0'
    ELSE NULL
  END AS worst_bucket
FROM distributors d
LEFT JOIN outstanding o ON o.distributor_id = d.id AND o.company_id = d.company_id
GROUP BY d.company_id, d.id, d.name, d.credit_limit
HAVING COALESCE(SUM(amt), 0) > 0;
```

Bucket → tone mapping (in `src/lib/aging.ts`):

```text
0–30    → muted
31–60   → warning (amber)
61–90   → accent  (terracotta)
90+     → destructive
```

## Files touched

- `supabase/migrations/<ts>_dealer_aging.sql` — views, index, `dealer_aging_state` table, `check_aging_transitions()`, RLS.
- `supabase/functions/aging-check/index.ts` — daily cron worker.
- `supabase/config.toml` — schedule for `aging-check`.
- `src/lib/aging.ts` — bucket helpers (new).
- `src/hooks/use-dealer-aging.ts` — view-backed hook (new).
- `src/pages/Dashboard.tsx` — replace Credit at Risk block.
- `src/pages/DealerDetail.tsx` — add Outstanding & Aging section.
- `src/components/reports/PaymentReport.tsx` — Aging Summary export.
- `src/integrations/supabase/types.ts` — auto-regenerates.

## QA checklist

- Dealer with one `delivered+pending` order from 95 days ago appears in 90+ bucket on Dashboard, DealerDetail bar, and report export.
- Dealer with `credit_limit = 0` shows "No limit set" instead of NaN%.
- Salesperson role: Credit at Risk card hidden on Dashboard; DealerDetail aging section visible only for their own dealers.
- Accountant role: full visibility, including the export.
- Marking the order as `paid` in OrderDetail makes the row disappear from aging within one realtime tick.
- Crossing a 60-day threshold inserts a notification visible in the bell icon for super_admin / sales_manager.
