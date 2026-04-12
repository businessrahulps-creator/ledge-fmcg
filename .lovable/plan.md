

# Feature #9: Claim & Return Easy Flow

## Recommendation: Hybrid Approach

**Why hybrid wins over the alternatives:**

- **Order detail button only**: Fast for the common case (damage spotted at delivery), but no central view for tracking open claims, generating reports, or following up with manufacturers. The business owner loses visibility.
- **Dedicated page only**: Great for management/reporting, but forces the user to navigate away from the order, manually look up the order number, and re-enter dealer/product info they already have. Too much friction for the field team.
- **Hybrid (recommended)**: A "Record Return / Claim" button inside the Order detail dialog pre-fills all context (order, dealer, products, quantities). A dedicated "Returns & Claims" page in the sidebar shows all claims with status tracking, filtering, and resolution workflow. Best of both worlds.

## Business Value

- **For the business owner**: Central claims register creates an audit trail for manufacturer disputes. "Total claims this month" becomes a reportable metric. Stock restoration is tracked automatically.
- **For godown staff**: Clear "Goods Returned → stock restored" vs "Damaged / Claim Only → no stock change" choice eliminates confusion about inventory impact.
- **For salespersons**: One-tap from the order they just delivered. No re-entering product details.

## Database

### New table: `claims`
```sql
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  order_id uuid NOT NULL,
  order_number text NOT NULL DEFAULT '',
  distributor_id uuid NOT NULL,
  distributor_name text NOT NULL DEFAULT '',
  claim_type text NOT NULL DEFAULT 'return',        -- 'return' | 'damage'
  status text NOT NULL DEFAULT 'open',               -- 'open' | 'resolved' | 'rejected'
  reason text NOT NULL DEFAULT '',
  resolution_notes text NOT NULL DEFAULT '',
  restore_stock boolean NOT NULL DEFAULT false,
  total_claim_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- claim_lines: which products and how many
CREATE TABLE public.claim_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
- RLS: company-scoped SELECT/INSERT/UPDATE/DELETE on `claims`; claim_lines via join to claims table
- `updated_at` trigger on claims

## Implementation Plan

### 1. New page: `src/pages/Claims.tsx`
- Header: "Returns & Claims" with count badge
- Tabs: "Open" | "Resolved" | "All"
- Each claim card shows: order number, dealer, type (Return / Damage), date, value, status badge
- Click to expand: see claim lines, reason, resolution notes
- "Resolve" button: mark as resolved with optional notes
- "New Claim" button (standalone, without order context — picks order from dropdown)
- Empty state with helpful guidance

### 2. Order detail dialog addition (`src/pages/Orders.tsx`)
- After the existing footer buttons (Delete, Invoice, WhatsApp), add a "Return / Claim" button (only visible when delivery status is "dispatched" or "delivered")
- Opens a modal pre-filled with order info and product lines
- User selects which products and quantities to claim
- Chooses claim type: "Goods Returned (stock will be restored)" or "Damaged / Claim Only (no stock change)"
- Enters a brief reason
- Submits → creates claim record, optionally restores stock

### 3. DataContext additions
- Add `Claim` and `ClaimLine` interfaces
- Add `claims` state, `addClaim`, `updateClaim` functions
- Fetch claims on load

### 4. Navigation
- Add "Returns" to sidebar under Manage group with `RotateCcw` icon

### 5. Stock restoration logic
- When `restore_stock = true` and claim is created, increment `stock_items.quantity` for each claimed product in the order's godown
- This happens in `addClaim` via a Supabase update call

## Files

| Action | File |
|--------|------|
| New migration | `claims` + `claim_lines` tables with RLS |
| New | `src/pages/Claims.tsx` |
| Modify | `src/context/DataContext.tsx` — claims state + CRUD |
| Modify | `src/services/api.ts` — expose claims |
| Modify | `src/pages/Orders.tsx` — "Return / Claim" button in order detail |
| Modify | `src/components/layout/AppSidebar.tsx` — add nav item |
| Modify | `src/App.tsx` — add route |

## UX Flow Summary

```text
Order Detail Dialog
  └─ [Return / Claim] button (shown for dispatched/delivered orders)
       └─ Modal: pre-filled products, qty selectors, type toggle, reason field
            └─ Submit → claim created, toast confirmation
                 └─ If "Goods Returned" → stock auto-restored

Returns & Claims Page (sidebar)
  └─ All claims listed with filters (Open/Resolved/All)
       └─ Click claim → expand details, resolve, add notes
```

