

# Fix: Scheme Integration Gaps — Complete Business-Ready Implementation

## Problems Found

1. **Schemes are NOT stored on orders.** The auto-apply engine in NewOrder only shows a live preview, but when the order is saved, no scheme data is persisted. Once saved, scheme info is lost forever.
2. **Order detail dialog shows zero scheme info.** When you click an order in the Orders page, there's no indication of which schemes were applied or savings earned.
3. **Performance page re-computes savings by guessing.** It runs all current active schemes against historical orders — this is wrong because schemes may have changed, expired, or been deleted since the order was created.
4. **The Schemes page itself works** (CRUD is functional), but the downstream integration is broken.
5. **PDF invoice doesn't include scheme savings.**

## Solution: Store Scheme Savings on Orders

### Database Changes

**Migration: Create `order_schemes` table**
```sql
CREATE TABLE public.order_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  scheme_id uuid,
  scheme_name text NOT NULL,
  scheme_label text NOT NULL DEFAULT '',
  savings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- + RLS policies (company-scoped via order join)
-- + Realtime
```

**Migration: Add `scheme_savings` column to `orders`**
```sql
ALTER TABLE public.orders ADD COLUMN scheme_savings numeric NOT NULL DEFAULT 0;
```

This gives us a permanent record of what was applied and how much was saved.

### Code Changes

**1. `src/data/mock-data.ts`** — Add `schemeSavings: number` and `appliedSchemes: OrderScheme[]` to the `Order` interface.

**2. `src/context/DataContext.tsx`** — Fetch `order_schemes` alongside orders. When saving a new order, also insert into `order_schemes` for each applied scheme.

**3. `src/pages/NewOrder.tsx`** — On save, persist scheme data: insert `order_schemes` rows and set `scheme_savings` on the order. (Auto-apply logic already works correctly.)

**4. `src/pages/Orders.tsx`** — In the order detail dialog, after the items table, show a "Schemes Applied" section (green box with Gift icon) if the order has any applied schemes — showing scheme name, label, and savings. This is read-only from stored data.

**5. `src/pages/Performance.tsx`** — Replace the guesswork computation with actual stored `scheme_savings` from orders. Sum `scheme_savings` across filtered orders for accurate totals. Use `order_schemes` for top-performing scheme breakdown.

**6. `src/components/pdf/OrderInvoicePdf.tsx`** — Add a "Scheme Savings" line below the items total if applicable, showing the discount applied.

**7. `src/services/api.ts`** — No structural changes needed; schemes and orders already exposed.

**8. `src/lib/offline-store.ts`** — Add `"order_schemes"` entity for IDB caching.

### Console Warning Fix
- The `Dialog` and `AlertDialog` ref warnings in `Schemes.tsx` — fix by ensuring functional components used as children are wrapped with `forwardRef` where needed, or restructure JSX.

## Files Touched
- 1 migration (create `order_schemes` + add `scheme_savings` to orders)
- `src/data/mock-data.ts` (Order interface)
- `src/context/DataContext.tsx` (fetch + persist scheme data with orders)
- `src/pages/NewOrder.tsx` (save scheme data on order creation)
- `src/pages/Orders.tsx` (show schemes in order detail dialog)
- `src/pages/Performance.tsx` (use stored data instead of guessing)
- `src/components/pdf/OrderInvoicePdf.tsx` (scheme savings line)
- `src/lib/offline-store.ts` (cache order_schemes)
- `src/pages/Schemes.tsx` (fix console warnings)

