# Make the live app fast and remove navigation glitches

## What's actually happening (measured on getledge.in)

- The whole app ships as **one entry file: `/assets/index-CPpd_a9e.js` = 890 KB raw / 272 KB gzipped**. That's heavy for first paint on mobile India.
- Right after login, `<RoutePrefetcher />` calls `prefetchAllRoutes()`, which downloads **all 18 route chunks** in the background. On a slow connection this saturates bandwidth exactly while the user is trying to navigate → screens stall, Suspense fallback flashes, taps feel unresponsive. That is the "glitch."
- `<RoutePrefetcher />` is placed *inside* `<ProtectedRoute>`, so it remounts on every navigation. The dedupe `Set` makes subsequent calls no-ops, but the placement is fragile and triggers an extra idle-callback chain each time.
- `manualChunks` is intentionally disabled (recharts TDZ bug), so heavy libs (recharts, d3, framer-motion, lucide icons) end up either in the entry or duplicated across route chunks.
- Every `<Suspense>` falls back to a **full-screen `<LedgeLoader />`**. That replaces the current page with a loader on every navigation → looks like a flicker/glitch even when the chunk loads in 100 ms.
- `prefetchRoute` lookup for `/orders/new` strips the last segment and looks up `/orders/:id` — wrong chunk, harmless but wasteful.

## Plan

### 1. Stop the prefetch flood (biggest perceived-speed win)

- Replace blanket `prefetchAllRoutes()` with **smart, link-hover/visible prefetching** only:
  - Prefetch a route chunk when the user hovers/touches a sidebar link, or when the link scrolls into view (IntersectionObserver).
  - Keep the warmed `Set` to dedupe.
- Move `<RoutePrefetcher />` out of `<ProtectedRoute>` and into the authenticated layout (mounts once).
- Prefetch only the **likely-next 2 routes from the current page** on idle (e.g. from Dashboard → Orders, Distributors), not all 18.
- Fix `prefetchRoute` path normalisation (don't collapse `/orders/new` to `/orders/:id`).

### 2. Shrink the entry bundle

- Re-enable safe code splitting via **dynamic `import()` at usage sites** instead of `manualChunks` (which is what triggered the recharts TDZ bug):
  - Lazy-load `recharts` inside the chart wrapper components used by Dashboard / Reports / Performance only. Wrap each chart in its own `<Suspense>` with a small skeleton (not the full-screen loader).
  - Lazy-load `framer-motion` for non-critical animations (splash/celebration), keep static UI without it.
  - Lazy-load `sonner`/`Toaster` only after first render (`requestIdleCallback`) — they don't need to block first paint.
- Audit `lucide-react` imports — use named imports only (already tree-shakeable, just confirm no `import * as Icons`).
- Verify the result: target entry **≤ ~140 KB gzipped** (down from 272 KB).

### 3. Smooth out navigation (kill the flicker)

- Replace the full-screen `<LedgeLoader />` Suspense fallback on authenticated routes with a **layout-preserving skeleton** (sidebar/topbar stay, only the content area shows a subtle skeleton).
- Add a **150 ms delay** before showing any fallback — most chunks load faster than that, so the user never sees a loader for cached/fast routes.
- Add `<link rel="modulepreload">` for the chunk of the route the user is hovering, so the click → render gap is near-zero.

### 4. Lighten startup work

- Defer non-critical providers/effects until after first paint:
  - `<InstallPrompt />`, `<UpdatePrompt />`, `<OnlineStatusWatcher />` mount inside a `requestIdleCallback`.
- Confirm `DataContext` doesn't do heavy synchronous work on mount; if it does, defer the non-essential parts.

### 5. Verify

- Re-measure: published entry size, Lighthouse mobile score, manual nav between Dashboard → Orders → Distributors on throttled 4G.
- Confirm no recharts TDZ regression (the reason `manualChunks` was removed) — chart lazy-loading at component level avoids that bug because each chart owns its own dynamic import.

## Files likely to change

- `src/App.tsx` — move RoutePrefetcher, layout-preserving Suspense, idle-mounted prompts.
- `src/lib/route-prefetch.ts` — hover/visible prefetch API, path-normalisation fix, "next likely routes" map.
- `src/components/layout/AppSidebar.tsx` (and any nav link components) — wire hover/visible prefetch.
- New `src/components/ui/route-skeleton.tsx` — small content-area skeleton.
- New `src/components/charts/LazyChart.tsx` (and friends) — dynamic-import wrappers around recharts.
- `src/pages/Dashboard.tsx`, `src/pages/Reports.tsx`, `src/pages/Performance.tsx` — swap direct recharts imports for the lazy wrappers.
- `vite.config.ts` — no `manualChunks` change (keep current safe config).

## Out of scope

- Reviving the PWA / offline mode (still paused per memory).
- Backend / DataContext refactors beyond deferring obvious startup cost.
- Visual redesign of pages.
