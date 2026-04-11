

# Clean Mock Data Files to Type-Only Exports

## What we're doing
Stripping `src/data/mock-data.ts` and `src/data/godown-data.ts` down to only the exports that are actually used across the codebase, removing all hardcoded sample data arrays.

## Changes

### 1. `src/data/mock-data.ts`
**Keep:**
- Interfaces: `Distributor`, `Product`, `Salesperson`, `OrderLine`, `Order`
- Utility functions: `formatCurrency`, `formatNumber` (pure formatting helpers, no static data)

**Remove:**
- `salespersons` array
- `distributors` array
- `products` array
- `orders` array

### 2. `src/data/godown-data.ts`
**Keep:**
- Interfaces: `GodownLocation`, `StockItem`, `StockDeduction`
- Type: `StockHealth`
- Function: `getStockHealth` (pure logic, used in `Stock.tsx`)

**Remove:**
- `godownLocations` array
- `stockItems` array
- `stockDeductions` array
- `generateSparklineData` function
- `getGodownStats` function (references removed arrays)
- `getOverallStats` function (references removed arrays)
- `getTimeAgo` function
- `import { products } from "./mock-data"` (top-level import no longer needed)

### 3. Import fixes
No import changes needed — all consumers already import only types and pure functions that are being retained.

