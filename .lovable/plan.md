

# Production Readiness Fixes — Implementation Plan

## Overview
18 issues from the audit, all surgical fixes in existing files plus one new page. No new features.

## Critical Fixes

### 1-3. Password Reset Page + Correct redirectTo
- **New file**: `src/pages/ResetPassword.tsx` — form to enter new password, detects `type=recovery` from URL hash, calls `supabase.auth.updateUser({ password })`
- **Edit `src/App.tsx`**: Add `/reset-password` route (public, not behind ProtectedRoute)
- **Edit `src/pages/Login.tsx`**: Change `redirectTo` from `window.location.origin` to `window.location.origin + '/reset-password'`

### 2. Trial Period Copy Mismatch
- **Edit `src/pages/Signup.tsx`**: Change "14-day free trial" → "30-day free trial"

### 4. Team Member Creation (fake user_id)
- **Edit `src/pages/Settings.tsx`**: Disable the "Add Member" button and replace with a "Coming soon — invite by email" placeholder. Remove the `saveMember` insert-new-member flow that uses `crypto.randomUUID()`.

### 5. Stock Deduction Stale Closure
- **Edit `src/context/DataContext.tsx`**: In `deductStockForOrder`, fetch fresh stock_items from DB at the start of the function instead of using the `stockItems` state closure. Use the fresh data for quantity checks.

## High Fixes

### 6. Enable Realtime Publication
- **DB Migration**: `ALTER PUBLICATION supabase_realtime ADD TABLE orders, distributors, salespersons, products, godowns, stock_items;`

### 7. Signup Auto-Confirm
- Use `cloud--configure_auth` to verify auto-confirm is disabled. The current signup flow calls `setup_new_company` RPC immediately — this works because the `on_auth_user_created` trigger creates the profile, and the RPC uses `auth.uid()` which is available even before email confirmation if auto-confirm is on. Leave as-is but verify setting.

### 8. Order Delete → Restore Stock + Update UI
- **Edit `src/context/DataContext.tsx`**: After successful order deletion, call `safeRefetchStockItems()` to refresh stock state.

### 9. order_lines Realtime Filter
- **Edit `src/context/DataContext.tsx`**: Remove the separate `order_lines` listener (line 359). Order changes already trigger `safeRefetchOrders()` which fetches lines too.

### 10. Pull-to-Refresh Actually Refreshes Data
- **Edit `src/context/DataContext.tsx`**: Expose `fetchAll` (or a wrapper `refreshAll`) on the context
- **Edit `src/services/api.ts`**: Expose `refreshAll` through api
- **Edit `src/pages/Performance.tsx`**: Call `api.refreshAll()` in `handleRefresh` instead of `setTimeout`

### 11. getCutoffDate Custom Period
- **Edit `src/pages/Performance.tsx`**: Add `case "custom"` to `getCutoffDate` that returns `new Date(0)` (epoch). Update `getPreviousCutoff` to return epoch for custom period so `prevOrders` is empty.

### 12. basePrice Type Mismatch
- **Edit `src/context/DataContext.tsx`**: Line 486, change `p.base_price` → `Number(p.base_price)`

### 13. ExportPdfModal on Distributors Page
- **Edit `src/pages/Distributors.tsx`**: Add an "Export PDF" button using `ExportPdfModal` with section picker, similar to other pages.

## Medium Fixes

### 14. Bottom Nav "More" Menu Discoverability
- **Edit `src/components/layout/AppLayout.tsx`**: Move "Performance" from `moreItems` into `primaryMobileNav` (replacing "Reports" which moves to More), since Performance is higher-frequency for FMCG users. This keeps 5 primary items (Home, Orders, Stock, Performance, More).

### 15-16. Sales Team Ranking Click → Wrong Param
- **Edit `src/pages/Performance.tsx`**: Change Sales Team bar `onClick` from `navigate(/orders?dealer=...)` to `navigate(/orders?salesperson=...)` (or remove the click handler since orders page may not support salesperson filtering — in that case, just remove the `cursor-pointer` and `onClick`).

### 17. Dashboard Day Filter → Current Week Only
- **Edit `src/pages/Dashboard.tsx`**: Add week boundary logic so `filteredOrders` only includes orders from the current week (Mon-Sun or Sun-Sat containing today), not all historical orders on that weekday.

## Files Changed Summary
| File | Action |
|------|--------|
| `src/pages/ResetPassword.tsx` | Create |
| `src/App.tsx` | Add route |
| `src/pages/Login.tsx` | Fix redirectTo |
| `src/pages/Signup.tsx` | Fix trial copy |
| `src/pages/Settings.tsx` | Disable add member |
| `src/context/DataContext.tsx` | Fix stale closure, order delete stock refresh, remove order_lines listener, expose refreshAll, fix basePrice |
| `src/services/api.ts` | Expose refreshAll |
| `src/pages/Performance.tsx` | Fix custom period, sales team click, pull-to-refresh |
| `src/pages/Distributors.tsx` | Add ExportPdfModal |
| `src/components/layout/AppLayout.tsx` | Reorder bottom nav |
| `src/pages/Dashboard.tsx` | Fix week filter |
| DB Migration | Enable realtime publication |

## Implementation Order
1. Critical auth fixes (Reset password page, redirectTo, trial copy)
2. Critical data fixes (stale closure, team member)
3. High fixes (realtime, order delete, pull-to-refresh, custom period, basePrice, Distributors PDF)
4. Medium fixes (bottom nav, sales team click, dashboard filter)

