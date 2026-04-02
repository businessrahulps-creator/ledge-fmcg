

# Final Audit & Restructuring Plan — V1

## Audit Findings

After reading every page, component, data file, and navigation element, here is the full list of issues — both the ones you raised and additional ones I found:

### Your 7 Issues (Confirmed)
1. **No warehouse CRUD** — GodownOverview only lists hardcoded locations, no add/edit/delete
2. **Warehouse click goes to wrong page** — Links to `/godown/inventory?location=g1` which is a global inventory page, not a warehouse-specific view
3. **Transfer Stock should be removed** — `TransferStockModal` and transfer button in `StockDetailPanel` need deletion
4. **No dealer CRUD** — Distributors page is read-only cards + profile dialog, no add/edit/delete
5. **Products and Inventory are split** — Products page (catalogue) and GodownInventory page (stock quantities) are separate with no way to add inventory
6. **Navigation flow is wrong** — Godown has 3 sub-pages (Overview, Inventory, Alerts) which is overengineered for what it does
7. **Naming is not human** — "Godown", "Salespersons", "Finished Stocks", "Distributors" are all jargon

### Additional Issues I Found
8. **Dashboard links to old routes** — "Top Distributors → View all" links to `/distributors`, "Top Products → View all" links to `/products` — both routes will change
9. **NewOrder page references old names** — Labels say "Distributor" and "Salesperson" in dropdowns
10. **Orders table says "Distributor"** — Column header and data references need renaming
11. **Report tabs say "Distributors"** — All 4 report components reference "distributor" terminology
12. **StockDetailPanel has transfer action** — Even after removing TransferStockModal, the panel still calls `onTransfer`
13. **Products page links to `/godown/inventory`** — Stock column navigates to old route
14. **GodownAlerts is a standalone page for ~4 items** — Overkill; low-stock badges inline are sufficient
15. **`stockTransfers` data in godown-data.ts** — Dead data after transfer removal
16. **No "Add Stock" anywhere** — User can't record stock received from a supplier/manufacturer
17. **Order detail view missing** — Clicking an order row does nothing (no detail/edit view) — noted but NOT fixing in V1

---

## What We're Building (V1 Scope)

### Naming Changes (Global)
| Old | New |
|---|---|
| Godown | Warehouse |
| Distributors | Dealers |
| Salespersons | Sales Team |
| Finished Stocks | Stock |
| Godown Overview | (merged into Stock) |

### New Page: `/stock` — Stock.tsx (replaces 4 pages)

Two tabs:

**Products tab** (default)
- Same as current Products page: table with CRUD
- Each row shows aggregated stock quantity across all warehouses (inline, no link to another page)
- Remove the link to `/godown/inventory`

**Warehouses tab**
- Warehouse cards (like current GodownOverview cards) with **Add Warehouse** button
- Each card: name, address, SKU count, stock value, low-stock count badge
- Edit/Delete actions on each card (dialog)
- Click a warehouse card → inline filter: shows that warehouse's inventory below the cards (same page, no route change)
- Inventory list shows: product, qty, health badge, est. value
- **Add Stock** button in the inventory section: dialog to select product, enter quantity received
- Low-stock items get warning badges inline (replaces the entire GodownAlerts page)

### Dealers page — CRUD added
- Add "Add Dealer" button (like Salespersons has "Add Salesperson")
- Add edit/delete actions on each card
- Add/Edit dialog: name, location, contact
- Keep the profile dialog (click card → order history)

### Navigation

**Desktop sidebar:**
```text
Dashboard
Orders
Stock           (new, replaces Products + Godown)
Dealers         (renamed)
Sales Team      (renamed)
Reports
---
Settings
Log out
```
No sub-menu. Flat.

**Mobile bottom bar:**
```text
Home    Orders    Stock    Reports    More
```
More drawer: Dealers, Sales Team, Settings, Log out

### Files to Delete (6)
- `src/pages/GodownOverview.tsx`
- `src/pages/GodownInventory.tsx`
- `src/pages/GodownAlerts.tsx`
- `src/pages/Products.tsx` (merged into Stock.tsx)
- `src/components/godown/TransferStockModal.tsx`
- `src/components/godown/StockDetailPanel.tsx`

### Files to Create (1)
- `src/pages/Stock.tsx` — unified Products + Warehouses with tabs

### Files to Modify (9)
- `src/App.tsx` — remove old routes, add `/stock`, rename `/distributors` route (keep same path, just page content changes)
- `src/components/layout/AppSidebar.tsx` — flatten nav, rename all labels, remove Godown sub-menu
- `src/components/layout/AppLayout.tsx` — rename mobile nav (Godown→Stock), update More drawer labels
- `src/pages/Distributors.tsx` — rename title to "Dealers", add CRUD (Add/Edit/Delete dialogs)
- `src/pages/Salespersons.tsx` — rename title to "Sales Team", rename button labels
- `src/pages/Dashboard.tsx` — update "Distributors" → "Dealers", "Products" → "Products" (keep), update links
- `src/pages/NewOrder.tsx` — rename labels: "Distributor" → "Dealer", "Salesperson" → "Sales Person"
- `src/pages/Orders.tsx` — rename "Distributor" column to "Dealer"
- `src/data/godown-data.ts` — remove `stockTransfers` array and `StockTransfer` interface

### Report Components — Label Updates Only
- `DistributorReport.tsx` → rename display text to "Dealer"
- Other 3 report files: update any "distributor" labels to "dealer"

### What This Does NOT Include (V1 Deferral)
- Order detail/edit view (clicking an order row)
- Real backend/database (still mock data)
- Stock auto-deduction when orders are placed
- Multi-user auth
- Export functionality (buttons exist but are no-ops)

### Does This Solve the Customer Problem?

For an FMCG company owner:
- **"How much stock do I have?"** → Stock page, Warehouses tab, click any warehouse
- **"Who are my dealers and how much did they order?"** → Dealers page, click any card
- **"Who sold the most this month?"** → Reports → Sales Team tab (already exists as Products tab, but dealer/product reports cover this)
- **"Add a new warehouse/dealer/product"** → Add buttons on every page
- **"I got new stock from the factory"** → Stock → Warehouses → select warehouse → Add Stock

The terminology is now plain English. The navigation is flat (6 items, no sub-menus). Every entity has full CRUD. A business owner from Kerala can open this and understand "Stock", "Dealers", "Orders" without any training.

### Implementation Order
1. Create `Stock.tsx` (the big new page)
2. Add CRUD to Dealers page + rename
3. Rename Salespersons → Sales Team
4. Update App.tsx routes
5. Update sidebar + mobile nav
6. Update Dashboard, Orders, NewOrder labels
7. Update report component labels
8. Clean up godown-data.ts
9. Delete old files

