

# Final Site-Wide QA, CTO Review & Adversarial Stress Test

## Fresh Audit Results

After a complete independent review of every page, component, context, database schema, RLS policy, and data flow:

### CRITICAL — None found

All previously identified critical issues have been correctly resolved:
- Nested Label in Billing.tsx — fixed (line 756 is a single `<Label>`)
- Dark mode leak on landing page — fixed (colorScheme: "light")
- Credit guard uses netOrderTotal — confirmed correct (line 246-248)
- Signup email confirmation race — fixed (checks authData.session before calling RPC)
- Realtime subscriptions — now use targeted safeRefetch instead of fetchAll
- DealerDetail/SalespersonDetail 404 handling — both correctly return "not found" UI
- Vehicle/driver on GST invoices — implemented with validation and PDF rendering
- Billing pagination — implemented with ListPagination (15 per page)
- Billing date filter — implemented with TimePeriodFilter

### HIGH — None found

All previous high-priority items have been addressed in prior passes.

### MEDIUM

**M1. Distributor delete does not check for existing orders**
`Distributors.tsx` line 95-101: `deleteDistributor(deleteId)` proceeds without checking if the dealer has orders. Deleting a dealer with existing orders leaves orphaned `distributor_id` references. The delete confirmation dialog should warn about linked orders and either block deletion or show a count.

**M2. NewOrder: duplicate product selection not prevented**
`NewOrder.tsx` line 452: The product dropdown shows all products regardless of what's already selected on other lines. Users can accidentally add the same product twice, creating confusing data.

### LOW / POLISH

**L1. NewOrder save button `bottom-28` on mobile**
Line 672: `sticky bottom-28` positions the save button 112px from bottom. On very small phones this could overlap with content, though `pb-28` on the sidebar div (line 567) provides matching padding. This is cosmetically acceptable but not ideal on iPhone SE.

**L2. Billing: `buyer_address` populated from `dealer.location` not `dealer.address`**
Line 138: `setBuyerAddress(dealer?.location || "")` uses `location` (short city name) instead of the full `address` field. For GST invoices, the full registered address is more appropriate.

---

## Implementation Plan

### Pass 1: Fix buyer address using dealer.address (L2)
| File | Fix |
|------|-----|
| `src/pages/Billing.tsx:138` | Change `dealer?.location` to `dealer?.address \|\| dealer?.location` so full address is preferred |

### Pass 2: Warn on dealer delete if orders exist (M1)
| File | Fix |
|------|-----|
| `src/pages/Distributors.tsx:95-101` | Check if dealer has orders before deleting; show warning count in dialog |

### Pass 3: Filter already-selected products from dropdown (M2)
| File | Fix |
|------|-----|
| `src/pages/NewOrder.tsx:452` | Filter `products.map()` to exclude product IDs already selected on other lines |

Total: 3 files, ~15 lines of surgical changes. Zero new features. All existing behavior preserved.

