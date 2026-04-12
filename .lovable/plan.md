

# Fix: Dealers Not Showing — Missing `setDistributors` Call

## Root Cause

In `src/context/DataContext.tsx`, the initial data fetch maps distributor rows into the `dists` array (lines 374-382) but **never calls `setDistributors(dists)`**. Every other entity (salespersons, products, godowns, etc.) has its setter called immediately after mapping, but distributors was accidentally omitted.

The data is fetched from the database successfully, mapped correctly, then thrown away.

## Fix

| File | Change |
|------|--------|
| `src/context/DataContext.tsx` | Add `setDistributors(dists);` after line 382 (after the dists mapping, before the salespersons mapping) |

One-line fix. Also need to add the corresponding `cacheData` call to match other entities:

```typescript
// After line 382:
setDistributors(dists);
cacheData(cId, "distributors", dists);
```

This mirrors how every other entity is handled in the same function.

