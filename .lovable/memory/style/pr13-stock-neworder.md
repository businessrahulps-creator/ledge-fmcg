---
name: PR13 Stock/NewOrder
description: SignalCard + KpiStrip applied to Stock hero and NewOrder credit-limit gate
type: design
---
Stock page now opens with optional `SignalCard` (destructive when criticalCount>0, warning when only lowCount>0) above a 4-cell `KpiStrip` (Total SKUs / Stock value / Low stock / Warehouses). Accountants do not see "Stock value" cell. Aggregations use `getStockHealth` over `stockItemsList`.

NewOrder's inline credit-limit warning was promoted from a plain destructive box to a `SignalCard` ("CREDIT LIMIT BREACH") showing projected vs limit and the over-limit ₹ amount as the hero number.

Orders.tsx already received the same treatment in PR12.
