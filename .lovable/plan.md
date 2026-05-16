
# Enterprise Stabilisation & Performance Audit

## What an MS perf review actually finds in this codebase

I read `DataContext`, `data-utils`, `App.tsx`, `vite.config.ts`, and the four heaviest pages (Dashboard 647 LOC, Orders 499, Stock 1046, Billing 1092). The visual layer is already enterprise-grade. The runtime architecture is not. Five concrete root causes explain "glitchy / slow to load / online-product feeling":

### Root causes (in order of impact)

**1. Single global DataProvider fetches the entire tenant on login.**
`fetchAll` runs 11 parallel `fetchAllChunked` calls (orders, distributors, salespersons, products, godowns, stock_items, schemes, secondary_sales, targets, claims, invoices) — *then* two more chunked `IN` queries for `order_lines` and `order_schemes` across **every order id**, plus `claim_lines` and `invoice_lines` across every claim/invoice id. For a 6-month-old distributor (~3k orders, ~15k order lines, ~500 claims) this is dozens of MB and 20+ round-trips before any page can paint with real data. Dashboard waits on Billing's invoices. Stock waits on Orders. That's the "loading forever" feeling.

**2. Computed selectors are O(N×M) and run on every provider render.**
`computedProducts` walks every order × every line × every product on each render of `DataContext`. `computedDistributors` and `computedSalespersons` do similar. With 3k orders and 100 products that's ~300k operations per re-render — and the provider re-renders on every state change anywhere in the tree because the `value` object is a fresh literal.

**3. Realtime fans out 11 channels and full refetches on every event.**
A single inserted row triggers `safeRefetch()` which re-pulls the whole table (chunked, 1000 at a time). One user adding one order causes every other tab to redownload the entire orders table. Under any concurrency this thrashes.

**4. `@tanstack/react-query` is installed and provided — but unused.**
`QueryClientProvider` wraps the app, yet not a single `useQuery` exists. All server state lives in `useState` inside a context, which means: no request dedup, no stale-while-revalidate, no cache key invalidation, no automatic background refresh, no DevTools.

**5. Heavy lists render every row.**
Stock (1046 LOC) and Billing (1092 LOC) tables aren't virtualized. Once a distributor has >500 invoices the table alone forces 5000+ DOM nodes per render. We already have `@tanstack/react-virtual` candidates noted in the roadmap PR8b but never landed.

Plus a few smaller leaks: bundle has no manual chunking (Recharts, jsPDF, html2canvas are likely in entry-adjacent chunks), `DataContext` `value` is unstable, `fetchAllChunked` paginates serially (1000 rows then wait then next 1000), and the `offline-store` IDB layer is still imported even though offline mode is paused.

---

## The plan — 6 PRs, ordered by ROI

Each PR is independently shippable and verifiable. PRs 1–3 give the user 80% of the felt speedup. PRs 4–6 are polish + future-proofing.

### PR-A · Slim DataContext: load only what each page needs

The single biggest win. Stop fetching everything upfront.

- Keep `DataContext` for **the small, always-needed slices**: company info, distributors, salespersons, products, locations, schemes (these are O(hundreds), needed by selectors everywhere).
- **Remove from initial fetch**: `orders`, `order_lines`, `order_schemes`, `stock_items`, `claims`, `claim_lines`, `invoices`, `invoice_lines`, `secondary_sales`, `targets`.
- Move those into **per-page React Query hooks** (`useOrdersQuery`, `useInvoicesQuery`, `useClaimsQuery`, `useStockItemsQuery`, `useTargetsQuery`). Each page fetches its own data with proper `queryKey`, `staleTime: 30s`, `gcTime: 5m`. Dashboard composes the lightweight summary query (`useDashboardSummary`) that pulls aggregates server-side via a new RPC (`get_dashboard_summary(company_id, range)`), not by downloading every order.
- Replace the O(N×M) `computedDistributors` / `computedSalespersons` / `computedProducts` aggregates with **the DB columns already maintained** by the `refresh_entity_aggregates` trigger (`total_orders`, `total_value`, `outstanding_amount`, `total_sold`). The trigger already keeps them correct — the client-side recompute is duplicate work.
- Freeze the `DataContext` `value` with `useMemo` keyed on actual references.

Expected result: time-to-interactive on /dashboard drops from ~"all-data-loaded" to ~one small summary query. Memory footprint cut by an order of magnitude.

### PR-B · Throttle & narrow realtime

- Replace per-table full refetches with **invalidation only**: realtime handler calls `queryClient.invalidateQueries({ queryKey: ["orders", companyId] })`. React Query then refetches only if a consumer is mounted.
- Coalesce events: 250ms trailing debounce per table so a bulk insert (100 order_lines on a new order) triggers one refetch, not 100.
- Drop subscriptions for tables no page is currently viewing (lazy-subscribe inside the page's query hook via `useEffect`).

### PR-C · Virtualize the three big tables

Wire `@tanstack/react-virtual` into:
- Orders table (already has the `<DataTable>` primitive from PR6 of the previous roadmap — promote it here).
- Stock items table.
- Billing invoices table.

Threshold: virtualize when rows > 80. Keeps DOM under ~1500 nodes always.

### PR-D · Bundle surgery

- Manual `rollupOptions.output.manualChunks` for the three known whales:
  - `recharts` + `d3-*` → `chunk-charts`
  - `jspdf` + `html2canvas` + `@react-pdf/renderer` → `chunk-pdf`
  - `framer-motion` / `motion` → `chunk-motion`
  Verify Recharts split doesn't trigger the published-blank-app bug (vite config has a comment about this — we'll test on a preview deploy before promoting).
- Move PDF imports behind dynamic `import()` inside `ExportPdfModal` open handler so they never enter the entry graph.
- Audit `src/assets` for any PNG > 100 KB → convert via `vite-imagetools` to AVIF + WebP fallback.

### PR-E · Memoization + render hygiene pass

- Wrap `DataContext` consumers' destructured slices with **selector hooks** (`useOrders()`, `useDistributors()`) backed by `useSyncExternalStore` so a Stock update doesn't re-render the Dashboard.
- Replace anonymous render functions in lists with stable `useCallback`-ed renderers.
- Add `React.memo` to `SignalCard`, `KpiStrip`, `KpiCell`, `StatusBadge`, `InsightLine` (all rendered in tight grids on Dashboard/Performance).
- Remove the still-imported `offline-store` IDB layer from the read path while offline mode stays paused. It currently runs `getCachedData` and `cacheData` on every fetch even though no SW serves them. Keep the file, gate the calls behind the existing offline flag.

### PR-F · Server-side aggregates for Dashboard

Replace the dashboard's client-side reduces with one RPC:

```sql
create or replace function public.get_dashboard_summary(
  p_company_id uuid,
  p_from date,
  p_to date
) returns jsonb ...
```

Returns: this-month revenue / orders / outstanding / delivered, top 5 dealers by value, top 5 SKUs by qty, daily breakdown array. One round-trip, ~2 KB payload, indexed scan. The `/dashboard` route becomes near-instant even with years of history.

---

## Technical details

```text
Before                                After (PR-A)
───────────────────────────────────────────────────────────────
Login → /dashboard                    Login → /dashboard
  └─ DataProvider                        └─ DataProvider
     ├─ companies               (1 RPC)     ├─ companies            (1 RPC)
     ├─ distributors            (≤N)        ├─ distributors         (≤N)
     ├─ salespersons            (≤N)        ├─ salespersons         (≤N)
     ├─ products                (≤N)        ├─ products             (≤N)
     ├─ godowns                 (1)         ├─ godowns              (1)
     ├─ stock_items             (chunked)   └─ schemes              (1)
     ├─ orders                  (chunked)
     ├─ schemes                 (1)      Dashboard mounts:
     ├─ secondary_sales         (chunked)   └─ get_dashboard_summary(co, range)  (1 RPC)
     ├─ targets                 (chunked)
     ├─ claims                  (chunked)Orders mounts → useOrdersQuery()
     ├─ invoices                (chunked)Stock  mounts → useStockItemsQuery()
     ├─ order_lines     (IN chunks of 500)Billing mounts → useInvoicesQuery()
     ├─ order_schemes   (IN chunks of 500)
     ├─ claim_lines     (IN chunks of 500)
     └─ invoice_lines   (IN chunks of 500)
   then O(N×M) client recompute
```

Files most affected:
- `src/context/DataContext.tsx` — shrink to the 6 always-needed slices, drop computed aggregates.
- `src/context/domains/*` — repurpose into React Query hooks (`useOrdersDomain` → `useOrdersQuery` + mutation hooks).
- New: `src/hooks/queries/useDashboardSummary.ts`, `useOrdersQuery.ts`, `useInvoicesQuery.ts`, `useClaimsQuery.ts`, `useStockItemsQuery.ts`, `useTargetsQuery.ts`.
- New: `supabase/migrations/<ts>_dashboard_summary_rpc.sql`.
- `vite.config.ts` — add `build.rollupOptions.output.manualChunks`.
- `src/pages/Dashboard.tsx`, `Orders.tsx`, `Stock.tsx`, `Billing.tsx` — switch from `useData()` slices to the new query hooks; add virtualization on the table.

Realtime stays in `DataContext` but only invalidates query keys; no refetch in the provider itself.

## How we'll verify each PR

- Lighthouse **TBT** and **LCP** on `/dashboard` (Chrome DevTools, throttled to "Slow 4G + 4× CPU").
- `browser--performance_profile` before/after for JS-heap, DOM nodes, long-task count.
- Network panel: number of requests on cold login → should drop from ~14 to ~6.
- A real distributor seed (3k orders) in the test account — measure dashboard time-to-paint.

## Out of scope (deliberately)

- AI features roadmap (separate plan in memory).
- Landing page (separate rebrand).
- Offline/PWA mode (still paused per memory).
- Re-introducing service worker caching.

## Sequencing

PR-A first (largest win, unblocks the rest), then F (dashboard RPC) since it depends on A's structure, then B → C → D → E in any order. Total: roughly 8–12 focused hours.
