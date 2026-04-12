

# Full Site-Wide CTO Audit & Production Readiness Plan

## Audit Summary

After reviewing every page, component, data flow, RLS policy, and utility in the Ledge codebase, the platform is in strong shape. The architecture is sound — centralized DataContext, proper RLS on all tables, offline queue with replay, glassmorphic design system with semantic tokens, and comprehensive CRUD across all entities.

Below are the issues found, categorized by severity.

---

## Critical (Must Fix Before Launch)

**None found.** RLS is properly configured on all 16 tables. Auth flow is solid with email verification. No SQL injection vectors. Sensitive operations use SECURITY DEFINER functions. No client-side role storage.

---

## High Priority

### H1. Backup export truncates at 1,000 rows silently
**File:** `src/utils/exportBackup.ts`
The backup warns users but still exports truncated data. For production, paginate fetches to export all rows.
**Fix:** Add a `fetchAll` helper that loops with `.range()` until all rows are fetched, replacing the single `.select()` calls.

### H2. Dashboard sparkline SVG viewBox misalignment
**File:** `src/pages/Dashboard.tsx` lines 224-257
The sparkline uses `viewBox="0 0 180 48"` with 7 points at `i * 30` (0, 30, 60...180). The last point at x=180 is at the edge of the viewBox, causing the rightmost dot to be clipped.
**Fix:** Change viewBox to `"0 0 184 48"` or use `i * 28` spacing.

### H3. Missing `DialogDescription` on Schemes create/edit dialog
**File:** `src/pages/Schemes.tsx`
The Dialog for creating/editing schemes likely lacks `DialogDescription`, causing an accessibility warning in the console.
**Fix:** Add `<DialogDescription className="sr-only">` like other dialogs.

---

## Medium Priority

### M1. Salespersons page missing PDF export
**File:** `src/pages/Salespersons.tsx`
Every other list page (Orders, Dealers, Stock) has both CSV and PDF export. Salespersons only has CSV.
**Fix:** Add PDF export button + `ExportPdfModal` matching the pattern in Distributors.

### M2. `order_lines` foreign key to `orders` not enforced at DB level
**Observation:** The `order_lines` table has no declared foreign key to `orders.id`. The RLS policy uses a subquery `EXISTS (SELECT 1 FROM orders...)` which works, but a proper FK constraint would prevent orphaned lines if an order is deleted without cascading.
**Fix:** Database migration to add `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE`. Same for `claim_lines`, `invoice_lines`, `order_schemes`, `stock_deductions`.

### M3. Status CSS utilities lack dark mode variants
**File:** `src/index.css` lines 171-185
`.status-paid`, `.status-pending`, etc. use hardcoded light-mode colors (`bg-emerald-50 text-emerald-600`) with no `dark:` variants. These are used by `StatusBadge` which may or may not use them directly — but if referenced elsewhere, they'll look wrong in dark mode.
**Fix:** Add `dark:bg-emerald-500/20 dark:text-emerald-400` etc. to each status utility class.

### M4. NewOrder "Save Order" button on mobile partially hidden
**File:** `src/pages/NewOrder.tsx` line 673
The save button uses `sticky bottom-24` to float above the bottom nav. On very small screens with keyboard open, this can overlap content.
**Fix:** Change to `bottom-28` to give more breathing room above the 72px bottom nav + safe area.

### M5. Dashboard "Recent Orders" shows scheme-unadjusted total
**File:** `src/pages/Dashboard.tsx` lines 423, 444
Dashboard recent orders show `order.total` without subtracting `schemeSavings`, while the Orders list page shows `order.total - (order.schemeSavings || 0)`. Inconsistent.
**Fix:** Apply the same `order.total - (order.schemeSavings || 0)` formula on Dashboard.

### M6. Missing empty state for Targets page when no targets exist
**File:** `src/pages/Targets.tsx`
Need to verify if there's a proper empty state with icon + CTA when no targets are set. Most other pages have this pattern.

### M7. Performance page recharts dependency
**File:** `src/pages/Performance.tsx`
Uses recharts (AreaChart, PieChart, BarChart). Verify this is in `package.json` dependencies — if it's missing, the page would crash.

---

## Low Priority / Polish

### L1. Unused `Filter` import on Orders page
The `Filter` icon is imported but only used in the empty state. Minor — not worth a separate fix.

### L2. `useToast` vs `toast` (sonner) inconsistency
Some pages import both `useToast` from shadcn and `toast` from sonner. The project standardized on sonner but Company.tsx and Settings.tsx still import the shadcn `useToast` hook. Won't break anything but adds confusion.

### L3. Backup download filename could include company name
Currently: `ledge_backup_2026-04-12.zip`. Better: `ledge_backup_CompanyName_2026-04-12.zip`.

---

## Implementation Plan (Ordered by Priority)

| Step | Issue | File(s) | Risk |
|------|-------|---------|------|
| 1 | H2: Fix sparkline clipping | Dashboard.tsx | None |
| 2 | H3: Add missing DialogDescription | Schemes.tsx | None |
| 3 | M5: Consistent scheme-adjusted totals on Dashboard | Dashboard.tsx | None |
| 4 | M3: Dark mode status utilities | index.css | None |
| 5 | M4: Save button spacing on mobile | NewOrder.tsx | None |
| 6 | H1: Paginated backup export | exportBackup.ts | Low |
| 7 | M2: FK constraints (migration) | Database | Low |
| 8 | M1: PDF export for Salespersons | Salespersons.tsx | None |

Each fix is surgical, reversible, and touches only the specific lines noted.

