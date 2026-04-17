

## QA + CTO Review

I'll inspect the recent changes from Categories 1–5 and the current console for issues, then present fixes.

### Known issues from console

1. **`FinalCTA` and `Footer` ref warning** on `Index.tsx` — "Function components cannot be given refs". This started after the landing dedupe (Category 4). Likely cause: `Index.tsx` passes a `ref` (probably for scroll/animation) to `FinalCTA` / `Footer` from `landing/sections/`, but those components don't use `forwardRef`. Need to either (a) add `forwardRef` to both, or (b) wrap them in a `<div ref={...}>` in `Index.tsx`.

2. **Service Worker redirect error** — `/sw.js` is behind a redirect. This is a preview-environment quirk (the lovable.app preview redirects), not a real production bug. Worth verifying it doesn't fire on `getledge.in`. No code change needed unless it reproduces in production.

### Additional review I'll do (read-only)

- **Category 2 (perf):** Verify `useMemo` keys in `Orders.tsx` / `Stock.tsx` are stable (no inline objects), and that `invoicesByOrderId` / `stockByProduct` Maps are correctly looked up.
- **Category 3 (error funnel):** Confirm `handleSupabaseError` is wired into all mutation paths in domain hooks; check no remaining raw `toast.error(error.message)` leaks.
- **Category 3 (offline flush):** Confirm whether the offline reconnect flush from suggestion #8 was actually shipped — looking at `use-online-status.tsx` in current files, I see only basic online/offline toasts, **no `flushPendingWrites()` call**. This appears to be a gap from the Category 3 implementation.
- **Category 5 (GSTIN):** Verify `Distributors.tsx` correctly uppercases and prefills, and doesn't overwrite a user-typed state.
- **Empty states (Category 1):** Plan said "wire into Orders/Dealers/Stock/Salespersons/Schemes/Targets/Claims" but only `Claims.tsx` was actually wired. The other 6 pages still have plain "no data" states. This is a Category 1 gap.
- **Unsaved-changes guard (Category 1):** Plan included `DealerDetail.tsx` but only `NewOrder.tsx` and `Company.tsx` were wired. `DealerDetail` is a gap.

### Fixes to ship (priority order)

**P0 — Active runtime warning**
- **Fix `FinalCTA` + `Footer` ref warning**: Read `src/pages/Index.tsx` and the two section components. Apply the minimal fix (either `React.forwardRef` on both components, or refactor `Index.tsx` to attach the ref to a wrapper div — whichever matches the existing pattern of the other landing sections like `Hero`/`Pricing`).

**P1 — Shipped-but-incomplete from prior categories**
- **Wire `flushPendingWrites()` into `useOnlineStatus`** (Category 3 / suggestion #8). Inspect `src/lib/offline-store.ts` for the existing queue API. Add a `flushPendingWrites` exported function if missing. In `use-online-status.tsx`, on `online` event, call it and toast `Synced N offline changes`.
- **Wire `<EmptyState>` into the 6 missing list pages** (Orders, Distributors, Stock products+warehouses, Salespersons, Schemes, Targets) — same pattern as Claims. Each gets a contextual message + CTA opening the existing create flow.
- **Wire `useUnsavedChangesGuard` into `DealerDetail.tsx`** — same pattern as `NewOrder` / `Company`, dirty tracked from existing form state.

**P2 — Polish**
- Quick scan of `Orders.tsx` / `Stock.tsx` memo keys for stability; fix only if a real issue is found.

### Non-issues (no action)
- Service Worker redirect warning — preview-only, leave alone.
- Session replay element `1054` translation — that's a normal animation, not a bug.

### Files touched
- **Edited:** `src/components/landing/sections/FinalCTA.tsx`, `src/components/landing/sections/Footer.tsx` (or `src/pages/Index.tsx` — TBD after reading), `src/lib/offline-store.ts`, `src/hooks/use-online-status.tsx`, `src/pages/Orders.tsx`, `src/pages/Distributors.tsx`, `src/pages/Stock.tsx`, `src/pages/Salespersons.tsx`, `src/pages/Schemes.tsx`, `src/pages/Targets.tsx`, `src/pages/DealerDetail.tsx`.
- **No new files**, no new deps.

### Stays the same
All business logic, RLS, real-time sync, validation, mobile-first design, design tokens.

After approval I'll ship in P0 → P1 → P2 order and reply with one consolidated `QA FIXES COMPLETE` summary listing every change.

