

# Bug #11: Offline Data Caching + Mutation Queue

## Overview
Add IndexedDB-based caching and offline mutation queue to DataContext, plus a subtle offline banner in AppLayout. Uses `idb-keyval` (tiny IndexedDB wrapper, ~600B) for simplicity.

## 1. Install dependency
- `npm install idb-keyval` — minimal IndexedDB key-value store, no config needed

## 2. New file: `src/lib/offline-store.ts`
IndexedDB helper module with two concerns:

**Data Cache** — stores each entity set under keys like `cache:orders`, `cache:distributors`, etc.
- `cacheData(companyId, entityName, data)` — writes to IDB
- `getCachedData(companyId, entityName)` — reads from IDB
- `clearCache(companyId)` — clears all cached data for a company

**Mutation Queue** — stores pending offline mutations under `queue:mutations`
- Each entry: `{ id, timestamp, type: 'insert'|'update'|'delete', table, payload }`
- `enqueueMutation(mutation)` — appends to queue
- `getQueue()` / `clearQueue()` / `removeFromQueue(id)`

## 3. Update `src/context/DataContext.tsx`
**On successful fetch (online):** after each `fetchAll` and each `safeRefetch*`, persist data to IDB cache via `cacheData()`.

**On fetch failure (offline):** in the `fetchAll` catch block, if `!navigator.onLine`, load from IDB cache instead. Set a context flag `isOfflineData: boolean`.

**Mutations while offline:** wrap each CRUD function (addDistributor, updateOrder, etc.) — if `!navigator.onLine`:
- Apply change optimistically to local state (already happens)
- Enqueue the mutation to IDB queue with the Supabase operation details
- Skip the actual Supabase call
- Show toast: "Saved offline — will sync when back online"

**Sync on reconnect:** add an `online` event listener that:
1. Reads the queue from IDB
2. Replays each mutation against Supabase in order
3. On success: removes from queue, shows "Changes synced" toast
4. On failure: keeps in queue, shows error toast
5. After sync: triggers full `fetchAll` to get fresh server state

**Add to context:** `isOfflineData: boolean` flag for the banner

## 4. Update `src/hooks/use-online-status.tsx`
- Keep existing toast behavior
- Enhance the "back online" handler to also trigger sync (or just keep it as detection — DataContext handles sync independently via its own listener)

## 5. Update `src/components/layout/AppLayout.tsx`
- Import `useOnlineStatus` hook
- When offline, show a slim banner below the header: "Offline — using cached data" with a WifiOff icon
- Styled: `bg-amber-500/10 text-amber-600 text-xs text-center py-1` — subtle, non-intrusive
- Disappears automatically when back online

## 6. Realtime graceful pause
- Already handled: the Supabase realtime channel shows `CHANNEL_ERROR` when offline and auto-reconnects. No changes needed — it's already graceful.

## Files Changed
| File | Change |
|------|--------|
| `package.json` | Add `idb-keyval` dependency |
| `src/lib/offline-store.ts` | New — IDB cache + mutation queue helpers |
| `src/context/DataContext.tsx` | Cache on fetch, load cache when offline, queue mutations offline, sync on reconnect |
| `src/components/layout/AppLayout.tsx` | Offline banner |

## Technical Notes
- `idb-keyval` uses a single IndexedDB database with one object store — zero config, works in all browsers and PWA service workers
- Company-scoped cache keys prevent data leaks between accounts
- Queue replay is sequential to maintain order dependencies (e.g., create before update)
- `addOrder` offline will use a temporary UUID and local order number — on sync, the server assigns the real atomic order number (queue replay calls the full `addOrder` flow)
- No new pages, no layout changes beyond the 24px-tall offline banner

