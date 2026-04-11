

# Bug #11 Enhancement: Complete Offline Support

## Current State
The core offline system is already implemented and functional:
- IndexedDB caching via `idb-keyval` for all DataContext entities
- Mutation queue with offline CRUD for orders, distributors, salespersons, products, godowns, stock items
- Sync-on-reconnect with queue replay
- Offline banner with pending count and syncing animation
- Online/offline detection with toasts

## Remaining Gaps

### 1. Notifications not cached offline
`use-notifications.tsx` fetches from Supabase but has no IDB fallback — notifications disappear when offline.

### 2. Realtime not paused/resumed on connectivity change
The realtime channel stays subscribed when offline (causing console errors) and doesn't explicitly reconnect. Should unsubscribe when offline and resubscribe when online — both in DataContext and NotificationProvider.

### 3. "Back online — all changes synced" toast wording
The sync toast in DataContext already says "Back online — changes synced" but the spec wants "Back online — all changes synced". Minor text fix.

## Changes

### `src/lib/offline-store.ts`
- Add `"notifications"` to the `ENTITIES` tuple so notifications can be cached.

### `src/hooks/use-notifications.tsx`
- After fetching notifications, cache them to IDB via `cacheData(companyId, "notifications", ...)`.
- In the fetch `catch`/failure path, load cached notifications from IDB when `!navigator.onLine`.
- Wrap realtime subscription: only subscribe when `navigator.onLine`; listen for `online`/`offline` events to teardown and re-create the channel.

### `src/context/DataContext.tsx`
- **Realtime pause/resume**: wrap the realtime `useEffect` to check `navigator.onLine`. Add `online`/`offline` event listeners inside the effect to unsubscribe/resubscribe the channel dynamically.
- Fix sync toast text: "Back online — all changes synced".

### `src/components/layout/AppLayout.tsx`
- No changes needed — banner already works correctly.

## Technical Notes
- Realtime pause: on `offline` event, call `supabase.removeChannel(channel)`. On `online` event, re-create and subscribe the channel. This prevents console errors and unnecessary retry loops.
- Notifications cache uses the same `cacheData`/`getCachedData` pattern as other entities.
- All existing online flows remain 100% unchanged — changes are additive guards.

