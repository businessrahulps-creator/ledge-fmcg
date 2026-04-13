---
name: Centralized Order Pricing Engine
description: All scheme calculations (percentage, flat_discount, buy_x_get_y) centralized in src/lib/order-pricing.ts — single source of truth for gross, savings, and net totals
type: feature
---
- `computeOrderPricing()` in `src/lib/order-pricing.ts` is the ONLY place scheme logic runs
- NewOrder.tsx and OrderDetail.tsx both call this utility — no duplicated switch/case
- Billing.tsx proportionally adjusts unit prices when creating invoices from orders with scheme savings (trade discount reflected in invoice for correct GST)
- Dashboard, reports, and PDFs all use `o.total - o.schemeSavings` for net revenue
- Demo seed uses `flat_discount` (not `flat_amount`) to match the Scheme type
- 14 regression tests in `src/lib/__tests__/order-pricing.test.ts`
