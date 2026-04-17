

## Plan — Categories 2–5 (suggestions 5–10)

Implementing the remaining 6 suggestions across 4 categories. One category at a time, minimal & backwards-compatible.

---

### Category 2 — Performance & Responsiveness

**#5 Memoize heavy DataContext selectors**
Audit `src/context/domains/*.ts` for `.reduce`/`.filter`/`.map` chains computed on every render. Wrap the top offenders in `useMemo` keyed on source arrays.
- Likely targets: `useOrdersDomain` (totals, dealer rollups), `useBillingDomain` (outstanding aggregates), `useStockDomain` (stock health computations), `useTargetsDomain` (achievement %).
- Verify with `code--view` first; only memoize where the function is actually called repeatedly per render.

**#6 Virtualize long lists (Orders, Stock items)**
Add `@tanstack/react-virtual` (small, ~5KB, already common in shadcn projects). Apply only when list length > 100 to avoid changing UX for typical accounts.
- `src/pages/Orders.tsx` — virtualize the desktop `<tbody>` rows AND the mobile card list.
- `src/pages/Stock.tsx` — virtualize the products table.
- Keep pagination intact as a fallback; virtualization layered on top of `paginatedOrders` is overkill, so apply to `filtered` directly when length > 100 and skip pagination in that branch.
- Decision: simpler & safer — virtualize *within* the current paginated slice only when slice > 100. Avoids changing pagination UX. (Will confirm during implementation by reading current page sizes.)

---

### Category 3 — Reliability & Edge Cases

**#7 Global Supabase error → toast funnel**
Add a tiny helper `src/utils/handleSupabaseError.ts` that takes an error/PostgrestError and shows a user-friendly sonner toast with a sensible default message (network vs auth vs constraint vs generic). Log full error to `errorLog`.
- Wire into existing mutation paths in `src/services/api.ts` and the domain hooks where `.from(...).insert/update/delete` is called. Replace ad-hoc `toast.error(error.message)` calls.

**#8 Offline write queue flush on reconnect**
Inspect `src/lib/offline-store.ts` to see queue shape. Add:
- `flushPendingWrites()` exported function that iterates the queue and replays each via the api layer.
- `useOnlineStatus` hook (already exists) gains a `useEffect` that calls `flushPendingWrites()` on `online` event, then shows `toast.success("Synced N offline changes")`.
- Failed replays stay in queue with a retry counter; surface a single error toast if any fail.

---

### Category 4 — Code Quality / Maintainability

**#9 Consolidate duplicate landing components**
Two folders: `src/components/landing/*` (top-level) vs `src/components/landing/sections/*`.
- Read both sets, identify which is actually imported by the live landing page (`src/pages/Index.tsx` likely).
- Delete the unused set. No visual change.
- Update any stale imports.

---

### Category 5 — Indian FMCG Specific Improvements

**#10 GSTIN auto-uppercase + state-code prefill**
- Add `INDIAN_STATE_CODES` map in `src/utils/validators.ts` (e.g. `"27" → "Maharashtra"`).
- In `DealerDetail.tsx` (and any dealer create modal): on GSTIN `onChange`, force uppercase. When 2+ chars entered and state field is empty, auto-fill state from the code lookup.
- Non-destructive: only prefill when state is blank — never overwrite a user value.

---

### Files touched (all 4 categories)
- **Edited:** `src/context/domains/useOrdersDomain.ts`, `useBillingDomain.ts`, `useStockDomain.ts`, `useTargetsDomain.ts` (memoization), `src/pages/Orders.tsx`, `src/pages/Stock.tsx` (virtualization), `src/services/api.ts` + relevant domain hooks (error funnel), `src/lib/offline-store.ts`, `src/hooks/use-online-status.tsx` (queue flush), `src/pages/Index.tsx` or imports (landing dedupe), `src/pages/DealerDetail.tsx`, `src/utils/validators.ts` (GSTIN/state).
- **New:** `src/utils/handleSupabaseError.ts`.
- **Possibly removed:** one of the two `src/components/landing/*` subfolders (TBD after audit).
- **Dep added:** `@tanstack/react-virtual` (only one new dep, minimal & justified for #6).

### Stays the same
- All business logic, RLS, real-time sync, PWA behavior, Indian locale, mobile-first design, design tokens, validation rules.

### Execution order
After approval I'll ship Category 2 → reply `CATEGORY COMPLETE: Performance & Responsiveness` → Category 3 → Category 4 → Category 5 → final `ALL IMPROVEMENTS COMPLETE`.

