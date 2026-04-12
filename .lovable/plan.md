

# Feature #3: Smart Scheme Auto-Apply Engine

## Overview
Add a complete Schemes system: a new `schemes` database table, a Schemes management page accessible from the sidebar, automatic scheme detection in the New Order form, and a Scheme Performance widget on the Performance page.

## Database Changes

### Migration: Create `schemes` table
```sql
CREATE TABLE public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  scheme_type text NOT NULL DEFAULT 'percentage',  -- 'percentage' | 'buy_x_get_y' | 'flat_discount'
  discount_percent numeric NOT NULL DEFAULT 0,      -- for percentage type
  buy_qty integer NOT NULL DEFAULT 0,               -- for buy_x_get_y
  free_qty integer NOT NULL DEFAULT 0,              -- for buy_x_get_y
  flat_amount numeric NOT NULL DEFAULT 0,           -- for flat_discount
  min_order_value numeric NOT NULL DEFAULT 0,       -- minimum order total to qualify
  min_qty integer NOT NULL DEFAULT 0,               -- minimum product qty to qualify
  product_id uuid,                                  -- NULL = all products
  dealer_id uuid,                                   -- NULL = all dealers
  is_active boolean NOT NULL DEFAULT true,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,                                 -- NULL = no expiry
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- RLS: company-scoped CRUD
CREATE POLICY "Company members can view schemes" ON public.schemes FOR SELECT TO authenticated USING (company_id = get_company_id());
CREATE POLICY "Super admins can insert schemes" ON public.schemes FOR INSERT TO authenticated WITH CHECK (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update schemes" ON public.schemes FOR UPDATE TO authenticated USING (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin')) WITH CHECK (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete schemes" ON public.schemes FOR DELETE TO authenticated USING (company_id = get_company_id() AND has_role(auth.uid(), 'super_admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.schemes;
```

## Code Changes

### 1. New: `src/pages/Schemes.tsx`
- Card-based view of all schemes with clear labels ("Buy 10 Get 2 Free", "10% Off orders above ₹5,000")
- Add/Edit dialog with simple form: name, type selector (3 types), conditions, validity dates, optional product/dealer filter
- Activate/deactivate toggle per scheme card
- Only Super Admin can add/edit/delete; others can view

### 2. Modify: `src/components/layout/AppSidebar.tsx`
- Add `{ title: "Schemes", url: "/schemes", icon: Gift }` to `manageNav` array (after Sales Team)

### 3. Modify: `src/App.tsx`
- Add route: `/schemes` → `<ProtectedRoute><Schemes /></ProtectedRoute>`

### 4. Modify: `src/context/DataContext.tsx`
- Add `schemes` state array, fetch from `schemes` table in `fetchAll`
- Add CRUD operations using the existing `makeOfflineCrud` pattern
- Add `schemes` to IDB cache and realtime subscription
- Expose via context: `schemes`, `addScheme`, `updateScheme`, `deleteScheme`

### 5. Modify: `src/lib/offline-store.ts`
- Add `"schemes"` to the `ENTITIES` array for IDB caching

### 6. Modify: `src/services/api.ts`
- Add `schemes` section to the API object

### 7. Modify: `src/pages/NewOrder.tsx`
- Add scheme auto-detection logic: after order lines are filled, compute eligible schemes based on order total, product quantities, dealer, and date
- Show a "Schemes Applied" box in the sidebar summary area (between Summary and Save button) with green styling showing each applied scheme and calculated savings
- Adjust displayed total to show "before/after scheme" savings

### 8. Modify: `src/pages/Performance.tsx`
- Add a "Scheme Performance" widget below Credit at Risk showing:
  - Total schemes active
  - Total savings generated (computed from orders in period)
  - This is a simple informational card, not a complex chart

### 9. Data model for scheme type interface
```typescript
interface Scheme {
  id: string;
  name: string;
  description: string;
  schemeType: 'percentage' | 'buy_x_get_y' | 'flat_discount';
  discountPercent: number;
  buyQty: number;
  freeQty: number;
  flatAmount: number;
  minOrderValue: number;
  minQty: number;
  productId: string | null;
  dealerId: string | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
}
```

## Key Design Decisions
- Scheme savings are computed client-side at order time (not stored on the order). This keeps the orders table untouched.
- For the Performance widget, savings are re-computed from orders + schemes data in the filtered period.
- Scheme application is advisory (shown as preview), not blocking — users see savings but the order total remains the original amount. The savings info is displayed for awareness.
- Only Super Admin can manage schemes (RLS enforced). All roles can view.

## Files touched
- 1 migration (schemes table + RLS + realtime)
- `src/pages/Schemes.tsx` (new)
- `src/components/layout/AppSidebar.tsx` (add nav item)
- `src/App.tsx` (add route)
- `src/context/DataContext.tsx` (schemes CRUD + fetch + cache)
- `src/lib/offline-store.ts` (add entity)
- `src/services/api.ts` (add schemes API)
- `src/pages/NewOrder.tsx` (auto-apply preview)
- `src/pages/Performance.tsx` (scheme widget)
- `src/data/mock-data.ts` (Scheme interface)

