# Fix slow page loads + add a delightful loading moment

## Part A — Why pages feel slow (4–7s on first visit)

Every authenticated page in `src/App.tsx` is `React.lazy(() => import(...))`. On a first visit:

1. The browser must download that route's JS chunk over the network.
2. Plus any shared chunks it depends on (Radix, recharts, `xlsx`, date-fns…) that no earlier route already pulled in.
3. Once cached, the second visit is instant — which matches the reported symptom exactly.

Data fetching is **not** the bottleneck: `DataContext.fetchAll` runs once when `companyId` becomes available, not per route. The slowness is **chunk download time**, made worse by:

- No `manualChunks` in `vite.config.ts` → one large shared chunk is pulled on the first lazy nav.
- `xlsx` (~430 KB) is **statically** imported from `src/utils/exportCsv.ts` and `exportBackup.ts` (used by 6+ pages).
- No prefetching — chunks are only requested the moment the user clicks.

## Part B — Performance fixes (biggest win first)

### 1. Prefetch route chunks after login

Create `src/lib/route-prefetch.ts` as the single source of truth:

```text
{ "/orders": () => import("@/pages/Orders"), ... }
```

`App.tsx` consumes the same map for its `lazy()` calls. A small `<RoutePrefetcher />` mounted inside `ProtectedRoute` walks the map on `requestIdleCallback` after the dashboard is interactive, warming every chunk in the background.

Also add **hover/touchstart prefetch** to `src/components/NavLink.tsx` so a sidebar hover starts the download before the click.

### 2. Lazy-load heavy libraries used only for actions

- `src/utils/exportCsv.ts` and `src/utils/exportBackup.ts` → switch to `const XLSX = await import("xlsx")` inside the export function. Pulls ~430 KB out of the shared chunk; the cost is paid only when the user actually clicks "Export".

### 3. Vendor chunking for cache efficiency

Add `build.rollupOptions.output.manualChunks` to `vite.config.ts`:

```text
react-vendor → react, react-dom, react-router-dom
radix-vendor → @radix-ui/*
supabase     → @supabase/supabase-js, @tanstack/react-query
charts       → recharts (Performance only)
xlsx         → xlsx (export-only)
icons        → lucide-react
```

Vendor code is downloaded once, reused across every route, and stays cached across deploys when app code changes.

### Files touched

- `vite.config.ts` — manualChunks.
- `src/lib/route-prefetch.ts` — **new**, lazy map + idle prefetcher hook.
- `src/App.tsx` — import lazy components from the map.
- `src/components/layout/AppLayout.tsx` — mount `<RoutePrefetcher />`.
- `src/components/NavLink.tsx` — hover/touchstart prefetch.
- `src/utils/exportCsv.ts`, `src/utils/exportBackup.ts` — dynamic `import("xlsx")`.

## Part C — The "Ledge is thinking" loading moment

When a chunk **does** need a second or two (slow 3G, first visit before prefetch lands), the user should feel a calm, branded moment — not a stale skeleton. Apple-style: minimal, confident, almost silent, with subtle motion that carries personality.

### The concept — "Ledge"

A single brand mark (the striped-square Ledge logo) sits centered. Three things happen at once, gently:

1. **Breathing logo** — the mark scales 1.00 → 1.04 → 1.00 on a 1.6 s ease-in-out loop. Feels alive, not spinning.
2. **Stripe sweep** — the stripes inside the mark shift one notch every 0.8 s, like a heartbeat moving through them. This is the Ledge personality — our logo is literally made of stripes, so we animate what we already own instead of bolting on a generic spinner.
3. **Rotating one-liners** in Playfair italic underneath, fading through every ~1.8 s. Tone is founder-to-founder, dry, warm — not corporate. Examples:
   - "Stacking the ledger…"
   - "Counting cartons…"
   - "Checking the godown…"
   - "Reading the day…"
   - "Tying up loose ends…"
   - "Almost there."

Lines are pulled from a small array, shuffled per session so the same user doesn't see the same line every time.

### When it shows (and when it doesn't)

- **0 – 250 ms**: show **nothing**. Most prefetched navigations land here; a flash of any loader is worse than no loader.
- **250 ms – ∞**: fade in the Ledge moment over 200 ms. This is the React Suspense fallback for lazy routes.
- After the chunk resolves, fade out over 150 ms and the page fades in (the existing `animate-fade-in` works).

We keep the **structural skeletons** (`ListPageSkeleton`, `DashboardPageSkeleton`) for the brief window between "chunk arrived, data still loading" — those represent real content shape. The Ledge moment only owns the chunk-download window.

### Implementation

New component `src/components/ui/ledge-loader.tsx`:

- Container: full-card centered flex, `bg-bone`, no border, no shadow.
- Logo: existing Ledge mark SVG, ~64 px, `animate-[ledge-breathe_1.6s_ease-in-out_infinite]`.
- Stripes: implemented as `<rect>`s inside the SVG with a `clipPath` that shifts via `transform: translateX(...)` on a 0.8 s loop.
- Caption: Playfair italic, `text-muted-foreground`, ~14 px, key'd on the active line so React re-mounts and the fade-in animation replays.
- Delay gate: a `useDelayedShow(250)` hook returns `false` for the first 250 ms; component returns `null` until then.

New keyframes in `tailwind.config.ts`:

```text
ledge-breathe : 0% scale(1) → 50% scale(1.04) → 100% scale(1)
ledge-stripe  : 0% translateX(0) → 100% translateX(6px)
caption-in    : opacity 0 + translateY(4px) → opacity 1 + translateY(0)
```

All easings use the existing `ease-fluent` token to stay on-brand.

Wire it into `src/App.tsx` by swapping the existing `Suspense` fallback (`<DashboardPageSkeleton/>` / `<ListPageSkeleton/>`) for `<LedgeLoader/>` on the route-level Suspense boundaries. Skeletons remain in use **inside** pages for data-loading states.

### Files touched (Part C)

- `src/components/ui/ledge-loader.tsx` — **new**.
- `src/hooks/use-delayed-show.ts` — **new**, tiny 250 ms gate.
- `tailwind.config.ts` — three keyframes + animation names.
- `src/App.tsx` — replace Suspense fallbacks on lazy routes with `<LedgeLoader/>`.

## Validation

1. Build and inspect chunk names: expect `xlsx`, `charts`, `radix-vendor`, `react-vendor` as separate chunks.
2. DevTools → Network, throttle to "Fast 3G", login, wait 3 s, then click Orders / Stock / Performance — each should load in <500 ms (chunk already prefetched).
3. To verify the Ledge moment, disable the prefetcher temporarily and throttle to "Slow 3G"; confirm: <250 ms nothing → fade in → breathing logo + rotating caption → fade out into the page.
4. Confirm Export CSV/XLSX still works on Stock, Distributors, Reports.
5. Confirm Performance page still renders charts.

## Non-goals

- No business logic, data fetching, or page UI changes.
- No PWA/Workbox changes — once chunks are split sensibly, precaching already helps.
- No backend or Lovable Cloud instance changes — this is purely a frontend bundle + loader UX fix.
