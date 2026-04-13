

# Audit Report — Demo Account & Platform

## Data Integrity: PASS

All checks passed with zero issues:

| Check | Result |
|-------|--------|
| Orphan references (dealers, salespersons, products, godowns, orders) | 0 orphans |
| Order totals vs order_lines sum | All match |
| Distributor aggregate counts/values vs actual orders | All match |
| Salesperson aggregate counts vs actual orders | All match |
| Product total_sold vs order_lines quantity sum | All match |
| Duplicate order numbers | None |
| Orders missing order_lines | None |
| Claims missing claim_lines | None |
| Targets referencing non-existent entities | None |
| Invoice subtotals vs invoice_lines taxable_value sum | All match |
| GST supply_type vs state codes | 100% correct |
| User role assigned | super_admin confirmed |
| Company sequence numbers | Correct (order: 533, invoice: 248) |

## Data Quality: PASS

| Metric | Value |
|--------|-------|
| Orders | 532, spread evenly across 31 days (14–20/day) |
| Payment statuses | paid (306), partial (143), pending (66) — realistic |
| Delivery statuses | delivered (342), dispatched (158), pending (32) — realistic |
| Stock health | 144 healthy, 42 low, 39 critical — good spread |
| Active schemes | 16 active, 4 inactive — realistic |
| Claims | 31 total, mix of open/resolved across damage/return/shortage |
| GST logic | intra_state (185), inter_state (62) — all consistent |

## New Signup Isolation: PASS

Other companies confirmed to have independent data. No demo seeding leaks.

---

## Bug Found: `safeRefetchOrders` missing chunking

**Severity: Medium** — will cause silent data truncation or API errors for accounts with 500+ orders.

**Location:** `src/context/DataContext.tsx`, lines 706–710

**Problem:** The initial data fetch uses `batchIn()` which chunks `.in()` queries at 500 IDs. But `safeRefetchOrders()` passes all order IDs (532 in this account) directly to `.in()` without chunking. This could:
- Hit Postgres parameter limits
- Exceed URL length limits for PostgREST
- Silently drop order_lines/order_schemes for orders beyond the limit

**Fix:** Refactor `safeRefetchOrders` to use the same `batchIn` pattern:

```typescript
// In safeRefetchOrders, replace direct .in() calls with chunked batches:
const CHUNK = 500;
let allLines: any[] = [];
let allOrderSchemes: any[] = [];
for (let i = 0; i < orderIds.length; i += CHUNK) {
  const chunk = orderIds.slice(i, i + CHUNK);
  const [linesRes, osRes] = await Promise.all([
    supabase.from("order_lines").select("*").in("order_id", chunk),
    supabase.from("order_schemes").select("*").in("order_id", chunk),
  ]);
  allLines.push(...(linesRes.data || []));
  allOrderSchemes.push(...(osRes.data || []));
}
```

## Files to Change
- `src/context/DataContext.tsx` — fix `safeRefetchOrders` to use chunked `.in()` queries

## Verdict
Demo data is pristine — all relationships, aggregates, and business logic are consistent. One real bug found in the order refetch path that needs fixing before go-live with high-volume accounts.

