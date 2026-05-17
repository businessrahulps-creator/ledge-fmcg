# Navigation Stability — Audit + Surgical Fix

## Audit: what the code actually does

I traced every entry point that could trigger a fetch or flip `loading`.

### What is already correct (do not touch)

| Concern | Reality | Evidence |
|---|---|---|
| Per-navigation fetch | **Never happens.** `fetchAll` runs only when `companyId` changes. | `DataContext.tsx:304-322` — single effect, deps `[companyId, fetchAll, loadFromCache]`; both callbacks are stable `useCallback`s. |
| React-Query staleTime / cacheTime | **N/A — no React Query in the app.** Data is plain React state in `DataContext`, shared above the router. State is preserved across navigation by construction. | `services/api.ts` is a thin selector over `useData()`. No `useQuery` anywhere. |
| Realtime subscribed/unsubscribed on nav | **Mounted once at provider.** Single channel `company-${companyId}` subscribed in `DataContext` effect, torn down only on `companyId` change or unmount. | `DataContext.tsx:379-428` |
| Per-page mount fetches | None. No page calls `refreshAll` on mount. `useEffect`s in pages only handle filters/sessionStorage/dialog params. | `rg refreshAll src/pages` → only handlers behind pull-to-refresh + manual button (Dashboard, Orders). |
| Skeleton gating (Orders / Billing / Stock) | Already `isLoading && X.length === 0`. Correct. | `Orders.tsx:171`, `Billing.tsx:482`, `Stock.tsx:352` |
| Distributors / Schemes / Targets / Claims / Performance / Dashboard / Reports | **Render no skeleton at all** — they declare `isLoading` but never gate UI on it. So no flicker there either. | `rg isLoading src/pages` shows declarations only. |

**Conclusion on PROBLEMS 1, 4, 5:** the symptoms cannot come from per-nav refetches or realtime churn — neither happens. The data layer is already structured the way the brief asks.

### What is actually wrong (root causes of the perceived flicker)

| # | Defect | File:Line | Effect the user sees |
|---|---|---|---|
| **A** | `refreshAll` calls `fetchAll(companyId, token)` with default `isBackground=false`, which sets `loading=true`. | `DataContext.tsx:438-442` | Hitting **Refresh** or **pull-to-refresh** flips `api.loading→true`, so Orders/Billing/Stock fall back to their skeleton (whenever the page happens to also be empty). Looks like "page broke". |
| **B** | Same bug in offline-sync replay path: `await fetchAll(companyId, token)` without `true`. | `DataContext.tsx:363-366` | After regaining connectivity, every page flashes a skeleton. |
| **C** | `fetchAll` is **two-phase**: phase 1 unblocks `loading` after critical data; phase 2 (orders, invoices, claims, targets, secondary_sales, stock_items) finishes 1–5 s later. During that window `loading=false` AND arrays are still empty. | `DataContext.tsx:176-302` | On first login (or any cold start, see D), a page navigated to during that window shows empty numbers, then "magically" fills. Reads as "data loaded again." |
| **D** | `OFFLINE_MODE_ENABLED = false` → `loadFromCache` is a no-op, so **every full page reload is cold**. The IDB warm-boot path that would mitigate (C) is intentionally disabled. | `lib/offline-store.ts:9`, `DataContext.tsx:143-167` | Hard refresh (F5) — which users mentally lump in with "navigation" — always shows the cold-start skeleton, even after they've already used the app. |
| **E** | No periodic refresh and no `visibilitychange` refresh. Data can sit > 5 min stale; user reopens the tab and the numbers are old until they manually refresh. | `DataContext.tsx` (absent) | Not the flicker complaint, but it is part of the brief (5-min staleness). |

PROBLEMS 1, 4 (no-refetch-on-nav), and 5 (realtime stays up) — **already satisfied by current architecture**. No code change needed; I'll note this in the response instead of forcing a no-op edit.

PROBLEMS 2, 3 — the perception is real, but the cause is defects A–E above, not skeleton gating logic.

## Fix plan — apply in order, smallest blast radius first

Each fix is one tiny edit. No UI files. No new dependencies. No restructure.

### Files touched (exactly 1)

1. `src/context/DataContext.tsx`

That's it. No `data-utils`, no `offline-store`, no pages, no UI primitives. Re-enabling the IDB cache is explicitly out of scope (memory says offline mode is paused).

### Fix A — `refreshAll` must be background-only
Change `refreshAll` (`DataContext.tsx:438-442`) to call `fetchAll(companyId, token, true)`. Result: `api.loading` stays false during a manual or pull-to-refresh; the existing `isRefreshing` flag handles the subtle "refreshing…" affordance. Skeleton no longer appears on refresh.

### Fix B — Sync-replay refetch must be background-only
`DataContext.tsx:363-366`: change `await fetchAll(companyId, token)` to `await fetchAll(companyId, token, true)`. Same reasoning as A.

### Fix C — Show stale-but-correct numbers during phase 2
Phase-2 entities (`orders`, `invoices`, `claims`, `targets`, `secondaryS̃ales`, `stockItems`) currently bind to fresh arrays only after phase 2 lands. We can't enable IDB caching (out of scope), but we can stop the **second** cold window: keep `loading=true` until phase 2 finishes on the **very first** fetch (cold start only), then for every subsequent `fetchAll` keep it background.

Implementation: add a `hasHydratedRef = useRef(false)`. Inside `fetchAll`:
- If `isBackground` OR `hasHydratedRef.current` → never flip `loading`.
- Only the cold first fetch keeps `loading=true` and only flips it false **after** phase 2 settles (move the `setLoading(false)` from phase 1's finally to the outer finally for the cold path).
- At the end of any successful fetch, `hasHydratedRef.current = true`.

Net effect: cold start shows a skeleton **once**, until *all* data is in. Every later fetch (realtime, refresh, sync, tick) is silent. Pages that already gate on `isLoading && X.length===0` stop flickering between empty-state and data.

### Fix D — Document, do not change
IDB cache is intentionally disabled (`OFFLINE_MODE_ENABLED = false`). I will not flip it without an explicit user OK — memory tags it as paused. Mention to the user in the response that the hard-reload cold-start is the unavoidable consequence of that decision, and offer to revive it as a follow-up.

### Fix E — 5-minute background tick + visibility refresh
Add one new `useEffect` in `DataProvider` (next to the existing realtime effect), gated on `companyId && authReady`:
- `setInterval` every 5 min → `fetchAll(companyId, ++fetchTokenRef.current, true)`.
- `document.addEventListener('visibilitychange', ...)`: when tab becomes visible and `Date.now() - lastFetchAtRef.current > 5*60*1000`, call the same background `fetchAll`.
- Track `lastFetchAtRef = useRef(0)`; stamp it at the end of every successful `fetchAll`.
- Cleanup on unmount/companyId change clears interval + listener.

All background — never flips `loading`.

## What this does NOT do (by design)

- No staleTime / cacheTime config (no React Query in the codebase).
- No change to skeleton-gating logic in pages (already correct where it matters).
- No realtime restructuring (already provider-level).
- No re-enable of IDB cache (paused per project memory).
- No new files, no new exports, no UI primitive edits.

## Verification

After the edit:
- `rg "fetchAll\(companyId, token\)" src/context/DataContext.tsx` → zero foreground calls outside the cold-start path.
- Manual refresh on `/orders` with data present → no skeleton, just a quiet `isRefreshing=true → false` cycle.
- Browser DevTools → Network throttle "Slow 3G", navigate /dashboard → /orders → /billing after first load → no new request fired; pages render instantly from in-memory state.
- After 5 min idle, watch network → one silent burst of the same queries; `loading` stays false the whole time.
- `visibilitychange` to a tab idle > 5 min → one silent burst, no skeleton.
- Cold login → skeleton stays up until ALL data (phase 1 + phase 2) is hydrated, then disappears once. No second flicker.