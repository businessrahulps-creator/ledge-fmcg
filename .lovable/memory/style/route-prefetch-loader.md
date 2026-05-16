---
name: Route prefetch + LedgeLoader
description: Performance fix for slow lazy-route navigation + branded Suspense loader
type: feature
---
Root cause of "4-7s first-time page load": lazy route chunks downloaded on click. Fix in three layers:

1. **Route prefetch** — `src/lib/route-prefetch.ts` is single source of truth for lazy importers. `App.tsx` consumes the map for `React.lazy()`. `<RoutePrefetcher />` mounted inside `ProtectedRoute` calls `prefetchAllRoutes()` once on mount → walks every authed route on `requestIdleCallback`. `NavLink` also warms on hover/touchstart/focus.

2. **Dynamic xlsx** — `exportCsv.ts` and `exportBackup.ts` `await import("xlsx")` inside the export function. `buildWorksheet(XLSX, headers, rows)` and `addSheet(XLSX, wb, ...)` now take XLSX as first arg. `exportCsv` is now async; existing call sites fire-and-forget.

3. **Vendor chunking** — `vite.config.ts` `build.rollupOptions.output.manualChunks`: `react-vendor`, `radix-vendor`, `supabase-vendor`, `charts`, `xlsx`, `icons`, `motion`, `date-fns`.

**LedgeLoader** (`src/components/ui/ledge-loader.tsx`): Suspense fallback for all lazy routes. Uses `useDelayedShow(250)` to suppress flash for fast/prefetched navs. Ledge mark with breathing animation + radial halo + rotating Playfair italic one-liner ("Stacking the ledger…", "Counting cartons…", etc). Lines shuffled per session.

**Keyframes added to tailwind**: `ledge-breathe` (scale 1↔1.04), `ledge-halo` (opacity+scale), `ledge-fade-in`, `ledge-line-in`.

Old `ListPageSkeleton`/`DashboardPageSkeleton` no longer used as Suspense fallbacks (kept for in-page data-loading states).
