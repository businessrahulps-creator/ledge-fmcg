## Plan: Stock activity logging + warehouse fix + live Activity sheet

Three small, additive fixes — no UI text changes, no behavior regressions.

### 1. Add stock activity logging (`src/context/domains/useStockDomain.ts`)

The custom stock-item handlers bypass `makeOfflineCrud`, so they never call `deps.log`. Add fire-and-forget log calls **after** the successful DB write in each handler:

- **`addStockItem`** — after the `supabase.from("stock_items").upsert(...)` success branch:
  ```ts
  deps.log("stock_item", data.id, "created",
    `Added ${si.quantity} ${si.unit || "units"} of ${si.productName} to ${si.godownName}`,
    { productId: si.productId, godownId: si.godownId, quantity: si.quantity });
  ```
  Mirror the same call in the offline branch using `tempId`.

- **`updateStockItem`** — after `.update(...).eq("id", si.id)` success:
  ```ts
  deps.log("stock_item", si.id, "updated",
    `Updated ${si.productName} stock at ${si.godownName} to ${si.quantity}`,
    { productId: si.productId, godownId: si.godownId, quantity: si.quantity, threshold: si.threshold });
  ```

- **`deleteStockItem`** — after successful delete:
  ```ts
  deps.log("stock_item", id, "deleted", `Removed stock entry for ${si?.productName ?? "product"} at ${si?.godownName ?? "warehouse"}`);
  ```
  (capture the row from current `stockItems` state before deletion for the label).

- **`deductStockForOrder`** — leave as-is. The parent order-created activity entry already covers it; per-line entries would be noisy. (User can opt in later.)

### 2. Fix warehouse misclassification (`useStockDomain.ts` line ~20)

The `locCrud` factory is called with `"stock_item"` as `entityLogType`, so warehouse adds/edits/deletes appear under the Stock filter in Activity. Change to a dedicated type:

```ts
const locCrud = useMemo(() => makeOfflineCrud<GodownLocation>(
  deps, "godowns", setLocations, "locations",
  l => ({ name: sanitizeInput(l.name), ... }),
  "warehouse",            // ← was "stock_item"
  l => l.name,
), [...]);
```

Then in **`src/components/layout/ActivityLog.tsx`**, register the new entity type:
- Add to `ENTITY_ICONS`: `warehouse: Warehouse` (lucide-react `Warehouse` icon).
- Add to `ENTITY_LABELS`: `warehouse: "Warehouses"`.

This makes the filter dropdown show "Warehouses" as a distinct category. Existing historical rows logged as `stock_item` will keep their old type (acceptable — only future rows are reclassified).

### 3. Live Activity sheet via realtime subscription (`src/components/layout/ActivityLog.tsx`)

Currently the sheet fetches on open + on filter change. Add a Supabase realtime subscription that runs only while `open === true`:

```ts
useEffect(() => {
  if (!open || !companyId) return;
  const channel = supabase
    .channel(`activity_log:${companyId}`)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "activity_log", filter: `company_id=eq.${companyId}` },
      (payload) => {
        const row = payload.new as ActivityEntry;
        // Respect current filter
        if (filter !== "all" && row.entity_type !== filter) return;
        // Dedup against existing IDs (handles race with initial fetch)
        setEntries(prev => prev.some(e => e.id === row.id) ? prev : [row, ...prev]);
      })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [open, companyId, filter]);
```

Notes:
- Subscription tears down when sheet closes — no idle WebSocket cost.
- New rows prepend (matches `created_at desc` order).
- Dedup guards against the initial `fetchEntries` race.
- "Load more" pagination cursor (oldest `created_at`) remains correct because new rows are newer than the cursor.

### Migration step (one-time)
Enable realtime on `activity_log` if not already in the `supabase_realtime` publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
```
Will be added as a migration; safe no-op if already present (wrap in `DO` block to swallow `duplicate_object`).

### Verification
- Add a stock item in `Stock` page → Activity sheet shows new row instantly while open.
- Edit warehouse name → entry appears under "Warehouses" filter, not "Stock".
- Filter to "Warehouses" → only warehouse entries show; new ones appear live.
- Close + reopen sheet → no duplicates, no leaked subscriptions (check console).

### Out of scope
- Per-product stock-deduction logging on order create (deferred — parent order entry covers it).
- Backfilling historical `stock_item`-typed warehouse rows (cosmetic only).
- Any UI/copy changes beyond the new filter option label.
