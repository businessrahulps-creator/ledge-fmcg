
# V1 Restructuring — Complete

## What Changed
- **Stock page** (`/stock`): Merged Products + Warehouses into one tabbed page with full CRUD + Add Stock
- **Dealers** (`/distributors`): Renamed from Distributors, added Add/Edit/Delete CRUD
- **Sales Team** (`/salespersons`): Renamed from Salespersons
- **Navigation**: Flattened sidebar (no sub-menus), updated mobile nav (Stock replaces Godown)
- **Labels**: All "Distributor" → "Dealer", "Salesperson" → "Sales Person/Team", "Godown" → "Warehouse" across Dashboard, Orders, NewOrder, Reports
- **Deleted**: GodownOverview, GodownInventory, GodownAlerts, Products, TransferStockModal, StockDetailPanel
- **Old routes** (`/products`, `/godown/*`) redirect to `/stock`
