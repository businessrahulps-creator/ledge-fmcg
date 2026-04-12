
# Fresh audit: offline sync + PWA

## What is still broken

### Critical
1. **Offline create is not durable enough**
   - `addOrder`, generic offline CRUD, and stock-item offline mutations update React state and queue, but they do **not reliably refresh IndexedDB cache immediately**.
   - Result: after an offline save, a refresh/reopen can load stale cached data and make it look like the save “never happened”.

2. **Queue replay logic is incomplete/inconsistent**
   - `DataContext.tsx` has special replay logic for `insert_order_atomic`.
   - `src/lib/offline-store.ts` manual replay helper does **not** support `insert_order_atomic`, so queue retry from Settings is broken/inconsistent.

3. **Temp ID chaining is broken**
   - Offline-created rows use temp IDs in local state.
   - If the user edits/deletes that same offline-created row before reconnect, later queued mutations still target the temp ID, which does not exist in the backend after replay.
   - This affects generic CRUD, stock items, and especially offline-created orders followed by later offline edits.

4. **Stock-item replay path does not match online path**
   - Online stock creation uses `upsert(... onConflict company_id,product_id,godown_id)`.
   - Offline replay currently uses plain `insert`, which can fail and leave the queue stuck.

5. **Queue success/failure state is too weak**
   - Retries exist in `syncQueue`, but there is no durable per-mutation attempt/error metadata in the queue itself.
   - Failed mutations remain opaque and hard to recover from safely.

### High
6. **Order replay depends on app-open online event only**
   - Sync runs on `online` and on effect mount, which is good, but there is no stronger guard around auth/session readiness before replay.
   - Reconnect races can still cause retry noise or apparent endless syncing.

7. **Offline-created orders are not reconciled cleanly back into local state**
   - The optimistic temp order stays local until full refetch.
   - If replay partially succeeds/fails, local state can feel inconsistent until all refetches finish.

8. **Notifications are still online-only**
   - `addNotification()` writes directly to backend and is not queue-aware.
   - It likely does not block the order save, but it is still an offline mutation gap.

## PWA audit

### Good
- `vite-plugin-pwa` is already configured with `devOptions.enabled = false`.
- Preview/iframe service-worker unregister guard exists in `src/main.tsx`.
- Manifest link, icons, install prompt logic, and install milestone logic are present.
- Offline data strategy is app-layer based (IndexedDB cache + queue), which is the correct core model for authenticated business data.

### Issues
1. **Manifest/theme mismatch**
   - `index.html` uses `theme-color: #3b82f6`
   - PWA manifest uses `theme_color: #121212`
   - This creates inconsistent install/browser chrome behavior.

2. **Offline capability is currently overstated**
   - The service worker mainly helps install/shell/fonts.
   - Business data offline support depends almost entirely on `DataContext` cache + queue, so that layer must be treated as the real source of truth.

3. **No background sync**
   - Sync only happens when the app is open and regains connectivity.
   - This is acceptable for now, but the queue logic must be made bulletproof.

## Surgical implementation plan

### Pass 1 — Make queue durable and deterministic
- Update `src/lib/offline-store.ts` to support richer queued mutation metadata:
  - mutation kind
  - local/temp id linkage
  - retry count / last error
- Add order-aware replay support to the shared replay helper so Settings retry and auto-sync use the same rules.

### Pass 2 — Fix offline create/update/delete chaining
- In `src/context/DataContext.tsx`:
  - queue **full order payloads** for offline order creation
  - store a `clientTempId` for offline-created orders
  - queue generic entity inserts with their generated offline UUID so later offline updates/deletes target the same persisted ID
  - make stock-item offline create replay via **upsert**, not plain insert
- Add small queue-compaction / ID-reconciliation logic so:
  - insert succeeds first
  - dependent updates/deletes for that same temp record get rewritten to the real persisted ID (or use client-provided UUID where safe)

### Pass 3 — Make replay reliable
- Keep replay strictly serial and ordered.
- Add max-3 retry handling in one shared path.
- Persist failure metadata for each mutation.
- After each successful replay:
  - remove it from the queue
  - update retry status
- After the full replay pass:
  - `safeRefetchOrders()`
  - `safeRefetchStockItems()`
  - refresh other affected entities as needed
  - rewrite cache immediately from fresh server data

### Pass 4 — Make offline saves survive refresh/reopen
- Whenever an offline mutation is accepted, immediately persist the optimistic state to IndexedDB cache:
  - orders
  - stock items
  - distributors/salespersons/products/godowns
  - order sequence/prefix when relevant
- This ensures “saved offline” remains visible even if the app reloads before reconnect.

### Pass 5 — PWA hardening (minimal, non-visual)
- Keep current preview-safe SW guard.
- Align manifest/browser theme-color values.
- Verify install flow remains untouched.
- Do **not** add new PWA features; only harden installability + offline correctness.

## Files to change
- `src/context/DataContext.tsx`
- `src/lib/offline-store.ts`
- `src/hooks/use-notifications.tsx` (only if needed to stop offline notification writes from bypassing the queue)
- `vite.config.ts` and/or `index.html` (theme/manifest consistency only)

## What will not change
- No UI redesign
- No new features
- No routing/auth flow changes
- No unrelated refactors
- No database schema changes unless absolutely required after implementation review

## Success criteria
1. Create order offline → it appears immediately and survives refresh.
2. Reconnect → order syncs once, gets real backend ID, order lines persist, stock deducts correctly if dispatched/delivered.
3. Create/update/delete other offline mutations → replay succeeds in order without temp-ID failures.
4. Settings manual retry uses the same replay rules as auto-sync.
5. PWA install still works, preview stays safe, and offline data behavior is driven by a reliable cache/queue layer.
