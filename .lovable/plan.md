

# Orders → Billing: Simplifying the Flow

## The Core Problem

Right now, Orders and Billing are two disconnected islands. A user can:
1. Create an order with products, dealer, quantities, prices
2. Separately create a billing document (invoice/estimate/etc.) by either manually re-entering all the same data OR "pulling" from an order

This creates **three major confusions**:

1. **Duplicate data entry** — Users can create invoices from scratch with full product details, completely bypassing orders. So what's the point of orders?
2. **No guidance** — Nothing tells users "create an order first, then generate an invoice from it." The two features feel like competing alternatives.
3. **No data integrity** — Billing documents created without linking to orders have no connection to stock, payment tracking, dealer outstanding, or any other system logic. The numbers float in isolation.

## The Solution: Order-First Billing

### Principle
**Orders are the source of truth. Billing documents are generated FROM orders, not created independently.**

### What Changes

**1. Remove standalone document creation from Billing**
- Remove the ability to manually add products/quantities/prices in the Billing dialog
- The "New Document" flow MUST start with selecting an order (required, not optional)
- Once an order is selected, line items auto-populate and are read-only

**2. Add a "Generate Invoice" action directly on Orders**
- In the Order detail modal, add a button: "Generate Invoice →"
- This opens the Billing creation dialog pre-filled with the order's data
- User only needs to choose doc type (Estimate, Proforma, GST Invoice) and add GST-specific fields (HSN, supply type, rate)

**3. Show billing status on Orders**
- Add a small badge/indicator on each order row showing if an invoice has been generated
- e.g., "No Invoice", "Estimate", "GST Invoice (Draft)", "GST Invoice (Final)"
- Clicking it navigates to the linked billing document

**4. Simplify document types**
- Remove "Invoice" (plain) as a type — it's confusing alongside "GST Invoice"
- Keep: **Estimate** → **Proforma** → **GST Invoice** (natural progression)
- Keep: **Credit Note** (for returns/adjustments, also linked to orders)

**5. Natural conversion flow**
- Estimate → can convert to Proforma or GST Invoice
- Proforma → can convert to GST Invoice
- GST Invoice → Draft → Final (locked)
- Each conversion creates a new document but links back to the same order
- Show the document chain on the order: "Estimate INV-001 → GST Invoice INV-003 (Final)"

### What Stays the Same
- Order creation flow (NewOrder page) — unchanged
- PDF generation — unchanged
- Company info for seller details — unchanged
- GST calculations — unchanged

## Implementation

### File Changes

| File | Change |
|------|--------|
| `src/pages/Billing.tsx` | Remove manual line-item entry. Make order selection required. Add "billing history" view per order. Remove "Invoice" doc type. |
| `src/pages/Orders.tsx` | Add "Generate Invoice" button in order detail modal. Add billing status badge to order rows. |
| `src/components/layout/AppSidebar.tsx` | Move Billing under Overview (next to Orders) instead of Accounting, since they're now tightly coupled. Keep Company in Accounting. |
| `src/context/DataContext.tsx` | Remove "invoice" from the `docType` union type. |

### Sidebar Restructure

```text
Sidebar
├── Overview
│   ├── Dashboard
│   ├── Orders
│   └── Billing          ← moved here (tightly coupled with Orders)
├── Manage
│   ├── Stock, Dealers, Sales Team, ...
├── Accounting
│   └── Company
├── Analyze
│   └── Reports, Performance
└── Settings
```

### Billing Page Behavior

**Creating a document:**
1. Click "New Document" → Dialog opens
2. Step 1: Select Order (required) — dropdown shows all orders
3. Step 2: Choose Doc Type (Estimate / Proforma / GST Invoice / Credit Note)
4. Line items auto-populate from order (read-only)
5. User fills GST-specific fields: HSN codes, supply type, GST rate, buyer GSTIN, state code
6. Create

**From Orders page:**
1. Open any order → Detail modal
2. Click "Generate Invoice" → Same dialog, order pre-selected
3. If order already has linked documents, show them with option to create another

### Order Detail Enhancement
- New section: "Documents" showing linked estimates/invoices
- "Generate Invoice" button (primary action alongside existing buttons)
- Badge on order list row: linked document status

### Data Integrity
- Every billing document MUST have a `sourceOrderId` (make it required, not optional)
- Stock deductions happen at order level (dispatch), not billing level — this is already correct
- Payment tracking remains on orders — billing is just the formal document

### Migration for Existing Data
- Any existing invoices without `sourceOrderId` remain accessible but marked as "Legacy"
- Going forward, all new documents require an order link

No database schema changes needed — `source_order_id` already exists on the invoices table (currently nullable, we keep it nullable for legacy but enforce in UI).

