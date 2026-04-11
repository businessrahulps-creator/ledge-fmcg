

# Bug #11: Offline Data Caching + Mutation Queue — DONE

## Summary
Added IndexedDB-based caching (idb-keyval) and offline mutation queue to DataContext. All entity data is cached after each fetch. When offline, cached data is served with a subtle banner. Mutations are queued in IDB and replayed on reconnect.

## Files Changed
| File | Change |
|------|--------|
| `package.json` | Added `idb-keyval` |
| `src/lib/offline-store.ts` | New — IDB cache + mutation queue helpers |
| `src/context/DataContext.tsx` | Cache on fetch, offline fallback, queue mutations, sync on reconnect |
| `src/components/layout/AppLayout.tsx` | Offline banner with WifiOff icon |
