

# Loading States + Debounced Search

## What We're Building
1. **Skeleton loading states** on Dashboard, Orders, Distributors, Salespersons, and Stock pages — frosted glass skeleton cards that shimmer for 300ms on mount
2. **Debounced search inputs** (300ms) on all 4 list pages: Orders, Distributors, Salespersons, Stock (2 inputs)
3. A reusable `useDebounce` hook and a `PageSkeleton` component set

## Changes

### 1. Create `src/hooks/use-debounce.ts`
A simple generic `useDebounce<T>(value, delay)` hook that returns the debounced value after `delay` ms.

### 2. Create `src/hooks/use-loading.ts`
A `usePageLoading()` hook that returns `isLoading: true` for the first 300ms after mount, then `false`. This simulates the API latency that will exist once Supabase is connected.

### 3. Create `src/components/ui/page-skeleton.tsx`
Reusable skeleton components styled with the frosted glass aesthetic:
- `DashboardSkeleton` — skeleton KPI cards (2x2 grid), skeleton bar charts, skeleton order rows
- `ListPageSkeleton` — skeleton search bar + N skeleton card rows (for Distributors, Salespersons, Stock)
- `TablePageSkeleton` — skeleton search bar + skeleton table rows (for Orders)

All skeletons use `glass-card` classes + the existing `Skeleton` component with `bg-muted/50` for the frosted look.

### 4. Update `src/pages/Dashboard.tsx`
- Import `usePageLoading`
- If `isLoading`, render `DashboardSkeleton` inside `AppLayout`
- Otherwise render existing content (no other changes)

### 5. Update `src/pages/Orders.tsx`
- Import `useDebounce` and `usePageLoading`
- Replace direct `search` usage in filter logic with `debouncedSearch`
- Show `TablePageSkeleton` while loading

### 6. Update `src/pages/Distributors.tsx`
- Import `useDebounce` and `usePageLoading`
- Debounce the search value for filtering
- Show `ListPageSkeleton` while loading

### 7. Update `src/pages/Salespersons.tsx`
Same pattern as Distributors.

### 8. Update `src/pages/Stock.tsx`
- Debounce both `productSearch` and `warehouseSearch`
- Show `ListPageSkeleton` while loading

## Technical Notes
- Search inputs remain controlled (instant typing feedback). Only the *filtered results* use the debounced value — no UI jank.
- The 300ms fake delay via `usePageLoading` will be trivially replaceable with real async loading states (e.g., TanStack Query `isLoading`) when Supabase is connected.
- Skeleton components use `backdrop-blur-xl bg-card/60 border-white/10` to match the existing glass-card aesthetic.

## File Summary
| Action | File |
|--------|------|
| Create | `src/hooks/use-debounce.ts` |
| Create | `src/hooks/use-loading.ts` |
| Create | `src/components/ui/page-skeleton.tsx` |
| Edit | `src/pages/Dashboard.tsx` |
| Edit | `src/pages/Orders.tsx` |
| Edit | `src/pages/Distributors.tsx` |
| Edit | `src/pages/Salespersons.tsx` |
| Edit | `src/pages/Stock.tsx` |

