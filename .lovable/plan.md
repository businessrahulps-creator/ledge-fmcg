

# Role-Based Access Control — Accountant View-Only on Stock

## Overview
Add role awareness to the AuthContext, restrict the Stock page UI for accountants, tighten RLS policies, and show a role badge in the header.

## 1. AuthContext — expose user role

Add `userRole` state to `AuthContext`. After fetching the profile, query `user_roles` table for the current user and expose the role string (e.g. `"accountant"`, `"super_admin"`, `"sales_manager"`).

**File**: `src/context/AuthContext.tsx`
- Add `userRole: string | null` to state and context type
- After `fetchProfile`, do a secondary fetch: `supabase.from('user_roles').select('role').eq('user_id', userId).single()` → set `userRole`
- Expose `userRole` and a convenience `isAccountant` boolean in the context value

## 2. Stock page — conditional UI for accountants

**File**: `src/pages/Stock.tsx`
- Import `useAuth` and read `isAccountant`
- **Products tab**: hide "Add Product" button, hide edit/delete action buttons in table rows and mobile cards, hide empty-state "Add Product" button
- **Warehouses tab**: hide "Add Warehouse" button, hide edit/delete buttons on warehouse cards
- **Inventory section**: hide "Add Stock" button, make inventory rows non-clickable (no edit dialog)
- All read-only views (lists, search, health badges, totals) remain visible
- Do NOT render any of the edit/add/delete Dialogs when `isAccountant` is true

## 3. Role badge in header

**File**: `src/components/layout/AppLayout.tsx`
- Import `useAuth`, read `userRole`
- Show a small Badge next to the notification bell displaying the role (e.g. "Accountant", "Super Admin")

## 4. Database migration — tighten RLS

Restrict `INSERT`, `UPDATE`, `DELETE` on `products`, `godowns`, and `stock_items` to exclude accountant role. Modify existing policies to add `NOT has_role(auth.uid(), 'accountant')` condition.

```sql
-- Products: restrict write operations
DROP POLICY "Company members can insert products" ON products;
CREATE POLICY "Non-accountant members can insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'));

DROP POLICY "Company members can update products" ON products;
CREATE POLICY "Non-accountant members can update products" ON products
  FOR UPDATE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'))
  WITH CHECK (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'));

DROP POLICY "Company members can delete products" ON products;
CREATE POLICY "Non-accountant members can delete products" ON products
  FOR DELETE TO authenticated
  USING (company_id = get_company_id() AND NOT has_role(auth.uid(), 'accountant'));

-- Same pattern for godowns and stock_items (6 more policies)
```

SELECT policies remain unchanged — accountants can still read everything and receive realtime updates.

## Files changed
| File | Change |
|------|--------|
| `src/context/AuthContext.tsx` | Add `userRole` / `isAccountant` to context |
| `src/pages/Stock.tsx` | Conditionally hide all write UI for accountants |
| `src/components/layout/AppLayout.tsx` | Show role badge in header |
| Migration SQL | Tighten 9 RLS policies on products, godowns, stock_items |

## What stays untouched
- All other pages (Orders, Dealers, Sales Team, Reports, Settings, Dashboard)
- Realtime subscriptions (SELECT policies unchanged)
- DataContext, services/api

