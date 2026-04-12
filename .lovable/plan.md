

# Platform-Wide Modal Overload Fix — Mobile-First Detail Pages

## Audit Results

| Modal | Lines | Complexity | Verdict |
|-------|-------|-----------|---------|
| **Order Detail** (Orders.tsx) | ~300 | Info cards + items table + schemes + billing docs + payment/delivery editing + dispatch fields + 6 action buttons + claim sub-modal | **→ Full page** `/orders/:id` |
| **Dealer Profile** (Distributors.tsx) | ~490 | Info + scorecard + churn risk + targets + secondary sales + order history + WhatsApp/PDF actions | **→ Full page** `/distributors/:id` |
| **Salesperson Profile** (Salespersons.tsx) | ~250 | Info + performance scorecard + order history + PDF export | **→ Full page** `/salespersons/:id` |
| Dealer Add/Edit | ~120 | Form with 4 sections | **Keep modal** — single-purpose CRUD |
| Salesperson Add/Edit | ~30 | 4 fields | **Keep modal** |
| Stock Product/Warehouse CRUD | ~80 | Simple forms | **Keep modal** |
| Delete confirmations | ~30 | Single confirmation | **Keep modal** |
| Credit override | ~15 | Single confirmation | **Keep modal** |
| Claim/Return | ~100 | Focused action | **Keep modal** |
| Export PDF options | ~30 | Checkboxes + generate | **Keep modal** |

### Decision Rule
- **Modal**: Single-purpose, ≤5 fields, quick action (CRUD form, confirm, quick select)
- **Full page**: Information-rich, read+edit, multiple sections, actions toolbar

## Implementation Plan

### Phase 1: Order Detail Page (priority — most overloaded)

**New file**: `src/pages/OrderDetail.tsx`

- Route: `/orders/:id`
- Back button → `/orders`
- Clean sections with clear visual hierarchy:
  1. **Header**: Order number, date, status badges, action buttons (WhatsApp, Invoice PDF, Generate Invoice, Delete)
  2. **Summary cards**: Dealer, Salesperson, Total/Effective Total (2×2 grid)
  3. **Items table**: Product lines with scheme savings
  4. **Billing Documents**: Linked invoices table + "Generate Invoice" CTA
  5. **Status & Dispatch** (editable section): Payment mode/status toggles, delivery status, warehouse, dispatch date, vehicle, driver — with Save button
- Mobile layout: Stacked single-column, full-width cards, touch-friendly controls, safe-area padding
- Reuse all existing logic from the dialog (save, credit guard, claim modal stays as modal since it's a focused action)

**Changes to `src/pages/Orders.tsx`**:
- Replace `openOrder()` → `navigate(\`/orders/${order.id}\`)`
- Remove entire Order Detail Dialog (~300 lines), claim modal, credit override dialog, delete dialog — all move to OrderDetail page
- Keep list page clean: just search, filters, table

**Route in `src/App.tsx`**:
- Add `<Route path="/orders/:id" element={<ProtectedRoute><PageErrorBoundary><OrderDetail /></PageErrorBoundary></ProtectedRoute>} />`

### Phase 2: Dealer Detail Page

**New file**: `src/pages/DealerDetail.tsx`

- Route: `/distributors/:id`
- Back button → `/distributors`
- Tabbed layout: **Overview** | **Orders** | **Secondary Sales**
- Overview: Info cards, scorecard, targets, credit health
- Orders: Full order history table
- Keep Add/Edit dealer as modal (simple CRUD form)

**Changes to `src/pages/Distributors.tsx`**:
- Card click → `navigate(\`/distributors/${d.id}\`)`
- Remove Profile Dialog (~490 lines)

### Phase 3: Salesperson Detail Page

**New file**: `src/pages/SalespersonDetail.tsx`

- Route: `/salespersons/:id`
- Back button → `/salespersons`
- Sections: Info, Performance Scorecard, Order History
- Keep Add/Edit as modal

**Changes to `src/pages/Salespersons.tsx`**:
- Card click → `navigate(\`/salespersons/${s.id}\`)`
- Remove Profile Dialog (~250 lines)

## Files Changed

| File | Change |
|------|--------|
| `src/pages/OrderDetail.tsx` | **New** — Full order detail page with sections |
| `src/pages/Orders.tsx` | Remove dialog + claim modal (~400 lines removed), navigate to detail page |
| `src/pages/DealerDetail.tsx` | **New** — Full dealer profile page with tabs |
| `src/pages/Distributors.tsx` | Remove profile dialog (~490 lines removed), navigate to detail page |
| `src/pages/SalespersonDetail.tsx` | **New** — Full salesperson profile page |
| `src/pages/Salespersons.tsx` | Remove profile dialog (~250 lines removed), navigate to detail page |
| `src/App.tsx` | Add 3 new routes: `/orders/:id`, `/distributors/:id`, `/salespersons/:id` |

## Design Approach

- Maintain existing glassmorphic `glass-card` aesthetic
- Mobile: Single-column stacked layout, min 44px touch targets, `pb-safe` bottom padding
- Desktop: Multi-column grids where appropriate
- Back navigation: `ArrowLeft` button + breadcrumb-style subtitle
- Sticky action bar at bottom on mobile for primary actions (Save, WhatsApp, etc.)
- No horizontal overflow — all tables scroll within their container

