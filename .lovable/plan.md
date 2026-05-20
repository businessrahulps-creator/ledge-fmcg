
# Surgical Resolution Plan

After investigating the codebase, **most of the previously-listed "blockers" were overstated or false**. Here's the real picture and a non-breaking path through it.

## Reality check (what I actually found)

| Was listed as | Reality |
|---|---|
| 🔴 Mock data still in DataContext | **False.** `mock-data.ts` only exports TypeScript types. All domain hooks (`useDealersDomain`, `useOrdersDomain`, `useStockDomain`, `useBillingDomain`, `useCatalogDomain`, `useTargetsDomain`) already query Supabase. Memory `mem://project/technical-status` is stale. |
| 🔴 PWA `/sw.js` redirect error | **Fixed last turn** — shipped `public/sw.js` kill-switch twin. |
| 🟠 Stabilisation PR-C/E/F pending | Memory says pending, but plan.md no longer references them. Need to confirm before touching anything. |
| 🟠 Billion-dollar roadmap 10/12 open | **False.** Per `mem://roadmap/billion-dollar`, PRs 1-12e are shipped. Only autosave-wiring + DataTable rollout to Orders/Billing/Stock + virtualization remain — all optional. |
| 🟠 Landing rebrand pending | Tracked in its own plan, not a build blocker. |
| 🟡 AI roadmap not started | Future work, not a blocker. |
| 🟡 No email domain (D2 digest blocked) | External dependency. |
| 🟡 Stock auto-deduction | Already implemented via `dispatch_order_atomic` RPC (saw it in DB functions). Memory is stale. |

So the actual "blocker" count is **1 real bug, already fixed**. The rest is stale memory + optional polish.

## Plan — three small, isolated passes

### Pass 1 — Refresh stale memory (zero code risk)
Update memory index so future-me stops chasing ghosts.
- `mem://project/technical-status`: rewrite to "Supabase-backed via domain hooks; DataContext is the session-state composer".
- `mem://logic/stock-management-logic`: note that auto-deduction shipped via `dispatch_order_atomic`.
- `mem://roadmap/billion-dollar`: mark complete; list the 3 optional remaining items.
- `mem://perf/stabilisation-pass`: verify PR-C/E/F status before claiming anything (read-only check first).

**Files:** memory only. No app code touched.

### Pass 2 — Verify the `sw.js` fix actually landed (5-minute sanity check)
- Confirm `public/sw.js` matches `public/service-worker.js`.
- Watch console after a hard refresh; the redirect error should be gone within one navigation.
- If any client is still wedged, document the manual "DevTools → Application → Service Workers → Unregister" workaround in the offline-mode memory.

**Files:** none (verification only). Memory note if needed.

### Pass 3 — Optional polish (only if you want it; each is independently revertible)
Pick zero, one, or all. Each ≤ 1 file, ≤ 30 LOC, no shared-state changes.

- **3a. DataTable rollout to Orders** — drop-in replacement of the table block, keep all filters/handlers. Highest visible win, lowest risk because `DataTable` is already used elsewhere.
- **3b. Wire `useAutosave` into Settings → Company form** — toast-less background save with `<SaveIndicator>`. Pure additive.
- **3c. Virtualize Orders list when count > 200** — `@tanstack/react-virtual` already in deps if used; if not, skip.

## What I will NOT touch (explicit safety rails)

- `DataContext.tsx` orchestration — works, performant, leave alone.
- Domain hooks — already shipping correct Supabase calls + `handleSupabaseError`.
- Auth flow, RLS policies, RPC functions — battle-tested.
- Design tokens, Fluent 2 primitives, brand pages — frozen per memory.
- Landing page — separate rebrand plan owns it.
- Mobile bottom nav — just refit last turn, leave alone.

## Recommended order

1. **Pass 1** (memory refresh) — 5 min, zero risk, prevents future false alarms.
2. **Pass 2** (sw.js verification) — 2 min.
3. **Pass 3a** only if you want a visible polish win — otherwise stop.

Total realistic scope: **memory hygiene + one verification + optionally one table swap**. Nothing that can break what we built.

## Question for you

Do you want me to run **just Pass 1 + Pass 2** (pure cleanup, no app code changes), or include **Pass 3a** (DataTable on Orders)?
