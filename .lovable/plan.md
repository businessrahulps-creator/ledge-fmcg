

# ISSUE 2 — Faster perceived load with independent section skeletons

## Root cause (verified)
1. `DataContext.fetchAll` sets ONE global `loading=true` while making 11 parallel Supabase queries + 4 sub-batches. Pages can't render until **everything** finishes.
2. Every page does `if (isLoading) return <Skeleton />` — gating the whole page on the slowest query.
3. `usePageLoading` wraps `api.loading` (no min-delay since `delay=0`), so the page-blocking skeleton sticks for the full network round-trip.
4. The IDB cache fallback only fires on errors/offline — fresh sessions never see cached data even if it's there.

## Fix — surgical, targeted changes

### A. `DataContext.tsx` — load cache first (instant paint), then upgrade to fresh data
- On `useEffect` mount with `companyId`, **call `loadFromCache(companyId)` synchronously first**. If cache returns data, set `loading=false` immediately so pages render.
- Then run `fetchAll` in the background — it overwrites state as fresh data lands, but the page is already visible.
- Add a new flag `isRefreshing` (separate from `loading`) so pages can show a subtle "syncing" indicator without re-blocking.
- For brand-new accounts (no cache), still go through the loading path — but render skeletons faster (next change).

### B. Replace blocking page skeletons with **inline section skeletons** in dashboard + heavy pages
- Remove the `if (isLoading) return <Skeleton />` gate from: **Dashboard, Orders, Stock, Distributors, Salespersons, Schemes, Targets, Performance, Claims**.
- Pages render their layout immediately. Each section (KPI cards, charts, lists, tables) checks `isLoading && data.length === 0` and shows a small inline skeleton just for that block.
- Existing empty-state UIs already handle `data.length === 0` gracefully — we only show skeletons during the very first load when cache is empty.

### C. Tiny per-section skeleton helpers in `src/components/ui/page-skeleton.tsx`
- Add small, reusable atoms: `<KpiCardSkeleton />`, `<ListRowSkeleton />`, `<TableRowSkeleton />`, `<ChartSkeleton />`. Each animates with `animate-pulse` using semantic tokens (`bg-muted`).

### D. Drop the artificial 0ms timer in `usePageLoading`
- Currently it always returns `true` for one tick after mount. Change so that when `dataLoading` is provided, we just return `dataLoading` directly (no synthetic "timerDone" gate). This removes one render of unnecessary skeleton flash.

### E. Real-time + day-of-week filter
- Untouched. Real-time channel still wires up in DataContext; day filter is pure client-side state in Dashboard.

## Files changed (≤12, mostly tiny)
1. `src/context/DataContext.tsx` — cache-first load, expose `isRefreshing` (~25 line change in two `useEffect`s)
2. `src/services/api.ts` — expose `isRefreshing`
3. `src/hooks/use-loading.ts` — drop synthetic timer
4. `src/components/ui/page-skeleton.tsx` — add atom skeletons (additive only)
5. `src/pages/Dashboard.tsx` — remove blocking gate, add inline skeletons to KPI / sparkline / activity sections
6. `src/pages/Orders.tsx` — remove blocking gate, inline table-row skeletons
7. `src/pages/Stock.tsx` — remove blocking gate, inline section skeletons
8. `src/pages/Distributors.tsx` — remove blocking gate
9. `src/pages/Salespersons.tsx` — remove blocking gate
10. `src/pages/Schemes.tsx` — remove blocking gate
11. `src/pages/Targets.tsx` — remove blocking gate
12. `src/pages/Performance.tsx` — remove blocking gate (charts get inline skeleton)

## Out of scope
- No change to fetch strategy itself (still one bulk fetch — splitting into separate queries per domain is a bigger architectural change for later).
- No change to real-time subscription behavior.
- No change to Reports/Settings/Billing/Help/Company (already lazy-loaded with Suspense; no `usePageLoading` gate there).
- No change to ISSUE 1 work.

