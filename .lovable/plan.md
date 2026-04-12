

# Final Production Readiness Audit — Ledge Platform

## Findings

### Critical (Must Fix)

| # | Issue | Location |
|---|-------|----------|
| C1 | **Duplicate `useOnlineStatus` — double toasts on network change.** `OnlineStatusWatcher` in `App.tsx` (line 44) and `AppLayout.tsx` (line 46) both call `useOnlineStatus()`, each independently firing "You're back online" / "You're offline" toasts. Every network state change produces 2 toasts. | `App.tsx:44` + `AppLayout.tsx:46` |
| C2 | **Dashboard desktop table rows not clickable.** Mobile cards link to `/orders/${id}`, but desktop `<tr>` rows have no `onClick` or `Link` — users can't navigate to order detail from desktop Dashboard. | `Dashboard.tsx:245` |

### High Priority

| # | Issue | Location |
|---|-------|----------|
| H1 | **Dashboard desktop table missing salesperson column.** Orders page shows salesperson but Dashboard recent orders table omits it — inconsistent info density. | `Dashboard.tsx:235-241` |
| H2 | **Claims `resolvingId` set but buttons don't show loading state.** The `resolvingId` state is tracked but neither Resolve nor Reject buttons display a spinner or disable during async operation. | `Claims.tsx:43-58` |
| H3 | **Billing mobile cards missing Convert-to-GST and Finalize actions.** Desktop table shows all action buttons (Download, Edit, Convert, Finalize, Delete) but mobile cards only show Download, Edit, Delete. | `Billing.tsx:531-545` |

### Medium Priority

| # | Issue | Location |
|---|-------|----------|
| M1 | **Dashboard empty state "Create Order" button lacks mobile bottom padding.** The CTA sits at pb-8 but with the floating bottom nav at `bottom-4`, content can be obscured on short screens. | `Dashboard.tsx:205` |
| M2 | **Salespersons page has no PDF export** while Dealers page has both CSV and PDF — feature parity gap. | `Salespersons.tsx` |
| M3 | **Company page doesn't validate GSTIN format** — accepts any string instead of the 15-char alphanumeric Indian GSTIN pattern. | `Company.tsx` |

---

## Fix Plan

### Pass 1: Critical Fixes (2 changes)

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Replace `useOnlineStatus()` with a simple `navigator.onLine` state + event listeners that DON'T fire toasts (keep toast-firing in `OnlineStatusWatcher` only). Need to keep the `online` variable for the offline banner UI. |
| `src/pages/Dashboard.tsx` | Add `onClick={() => navigate(`/orders/${order.id}`)}` and `cursor-pointer row-hover` to desktop table `<tr>` rows. Import `useNavigate`. |

### Pass 2: High Priority Fixes (3 changes)

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add "Sales Person" column header and `<td>` with `order.salesperson` to desktop table. |
| `src/pages/Claims.tsx` | Add `disabled={resolvingId === claim.id}` and `Loader2` spinner to Resolve/Reject buttons when `resolvingId` matches. |
| `src/pages/Billing.tsx` | Add Convert-to-GST and Finalize buttons to mobile card actions section, matching desktop table actions. |

### Pass 3: Medium Priority (deferred — non-blocking)

- M1-M3 are polish items for next sprint. No user-facing breakage.

**Total: 5 surgical edits across 4 files. No new dependencies, no schema changes, no feature additions.**

