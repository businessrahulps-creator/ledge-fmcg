## Problem

Order `ABD-2026-0545` shows **Items: 0**, **Subtotal ₹0**, and **Total ₹0** in the UI even though the database has 1 line item and `orders.total = 18,00,000`. This is not specific to this order — it affects every order whose `order_lines` rows fell past row 1000 of the company's combined fetch.

## Root cause

In `src/context/data-utils.ts`, the `batchIn` helper:

```ts
const { data } = await supabase.from(table).select("*").in(column, chunk);
```

issues a single SELECT per 500-id chunk and trusts Supabase to return everything. Supabase silently caps any single SELECT at **1000 rows**. The current company has **1,913 `order_lines` rows** — so ~900 line rows are dropped on every page load. Affected orders display zero items and a zero total even though the order header loaded correctly.

The same bug applies to `claim_lines`, `invoice_lines`, and `order_schemes` — all four child-table fetches in `DataContext.tsx` go through `batchIn`.

Note: `useOrdersDomain.safeRefetch` already uses `fetchAllChunked` correctly, so realtime refetches are unaffected — only the initial app load and full `refreshAll` hit the bug.

## Fix

Make `batchIn` paginate each chunk the same way `fetchAllChunked` does (using `.range(from, to)` until a short page is returned). One narrow change, no call-site changes needed.

### `src/context/data-utils.ts`

```ts
export async function batchIn(table: string, column: string, ids: string[]) {
  if (ids.length === 0) return [];
  const ID_CHUNK = 500;
  const PAGE = 1000;
  const MAX_PAGES = 200; // 200k rows/chunk safety cap
  const results: any[] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK);
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE;
      const to = from + PAGE - 1;
      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .in(column, chunk)
        .range(from, to) as any;
      if (error) throw error;
      const rows = (data || []) as any[];
      results.push(...rows);
      if (rows.length < PAGE) break;
    }
  }
  return results;
}
```

This mirrors the pattern already used by `fetchAllChunked` and `useOrdersDomain.safeRefetch`, so it's the same safe shape the codebase already trusts.

## QA after the fix

1. Hard refresh the app, open `/orders/aa36bc04-43a5-4fb8-90ff-503a7398f668` → Items section should show the line, Total should read ₹18,00,000, Subtotal should match.
2. Spot-check `/orders` list: a few more orders that previously had blank totals should now show their real totals.
3. QA the dispatch flow (the feature the user asked about) on a fresh pending order:
   - Open a pending order, change Delivery Status → Dispatched → Save.
   - "Confirm dispatch & deduct stock" modal should open, list each line with `Need / Available / After`, highlighting any negative rows.
   - Confirm → toast success, status flips to Dispatched, Stock page reflects the reduction, `stock_deductions` gets `source = 'auto_dispatch'` rows.
   - Flip the same order back to Pending → toast success, stock restored, a `return_reversal` audit row appears.
4. Confirm no console errors and no regressions in Billing (claim_lines) or Invoices (invoice_lines), since both use `batchIn`.

## Out of scope

- No schema changes.
- No UI changes.
- Dispatch RPCs from the previous turn stay as-is; only the data-loading helper changes.
