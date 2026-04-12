

# Fresh Red Team Audit & Production Readiness Plan

## Audit Summary

After a complete from-scratch review of every page, component, data flow, RLS policy, and utility — this platform is in very strong shape. Architecture is sound, security is well-implemented, and the UX is polished. Below are the remaining issues found.

## Critical

**None.** RLS is correct on all 18 tables. Auth uses email verification. SECURITY DEFINER functions for role checks. No client-side role storage. Sanitization on all user inputs. Offline queue with session validation before replay.

## High Priority

### H1. `claim_lines` and `invoice_lines` fetched without `company_id` filter
**File:** `src/context/DataContext.tsx` lines 368, 370
These two queries fetch ALL claim_lines and invoice_lines across ALL companies with just `.select("*").range(0, 9999)`. While RLS on these tables uses a subquery to check the parent's `company_id`, this is:
- **Wasteful** — pulls rows from other companies that get filtered client-side
- **Fragile** — if RLS is ever misconfigured, data leaks across tenants

**Fix:** Filter by joining through parent IDs. Since we already have `claimsRes.data` and `invoicesRes.data` at that point, extract IDs and use `.in("claim_id", claimIds)` and `.in("invoice_id", invoiceIds)` respectively — matching the pattern already used for `order_lines` (line 502).

### H2. `order_lines` query limited to `.in()` with potentially 10,000+ IDs
**File:** `src/context/DataContext.tsx` line 502
The `.in("order_id", orderIds)` call passes all order IDs in a single query. Postgres has a practical limit (~32K params). For accounts with 10K+ orders, this will fail silently.
**Fix:** Batch the `.in()` calls in chunks of 500 IDs, similar to the `fetchAll` pattern in backup.

## Medium Priority

### M1. `useToast` (shadcn) still imported in Company.tsx and Settings.tsx
**Files:** `src/pages/Company.tsx` line 12, `src/pages/Settings.tsx` line 40
The project standardized on sonner `toast`, but these two files still import the shadcn `useToast` hook. Company.tsx uses both `toast` (from shadcn useToast) AND `sonnerToast` (from sonner), creating inconsistent toast rendering.
**Fix:** Replace shadcn `useToast` with sonner `toast` in both files.

### M2. Orders PDF export shows raw `order.total` without scheme-adjusted amount
**File:** `src/pages/Orders.tsx` line 350
The PDF export uses `formatCurrencyPdf(o.total)` while the table UI uses `order.total - (order.schemeSavings || 0)`. The PDF and CSV exports are inconsistent with what users see on screen.
**Fix:** Use `o.total - (o.schemeSavings || 0)` in both PDF rows and total summary.

### M3. Orders CSV export also shows raw total
**File:** `src/pages/Orders.tsx` line 138
Same issue as M2 but for CSV export.
**Fix:** Apply `o.total - (o.schemeSavings || 0)`.

### M4. `bank_account_name` missing from company data fetch
**File:** `src/context/DataContext.tsx` line 342
The select query for `companies` includes `bank_account` but accesses `bank_account_name` via `(company as any).bank_account_name`. The field isn't in the explicit select list — it works because of how the query is constructed but is fragile.
**Fix:** Add `bank_account_name` to the select string.

### M5. Dashboard "This Month" outstanding calculation doesn't subtract scheme savings
**File:** `src/pages/Dashboard.tsx` line 88-90
`monthOutstanding` sums `o.total` for pending/partial orders, but the actual amount owed should be `o.total - (o.schemeSavings || 0)`.
**Fix:** Apply scheme-adjusted formula.

## Low Priority

### L1. Company.tsx and Settings.tsx import sonner as `sonnerToast` instead of `toast`
Minor naming inconsistency. Not a bug but adds confusion when reading code.

### L2. DataContext fetches `claim_lines` and `invoice_lines` before their parent data is available
Lines 368-370 fetch these tables in the same `Promise.all` as their parents. This is fine architecturally (they're all awaited together), but the `.in()` pattern used for `order_lines` (line 502) is safer and more explicit.

---

## Implementation Plan

| Step | Issue | File(s) | Risk |
|------|-------|---------|------|
| 1 | H1: Filter claim_lines/invoice_lines by parent IDs | DataContext.tsx | Low |
| 2 | M2+M3: Scheme-adjusted totals in Orders export | Orders.tsx | None |
| 3 | M5: Scheme-adjusted outstanding on Dashboard | Dashboard.tsx | None |
| 4 | M1: Replace shadcn useToast with sonner in Company + Settings | Company.tsx, Settings.tsx | None |
| 5 | M4: Add bank_account_name to company select | DataContext.tsx | None |

Each fix is surgical, touching only the specific lines noted. No new features, no new dependencies.

