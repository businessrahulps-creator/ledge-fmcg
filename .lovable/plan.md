
The issue is not just a demo-account problem.

What I found from the code:

1. The problem is partly demo-data-specific
- The demo seed function creates schemes with `scheme_type: "flat_amount"`.
- The app UI and calculation logic expect `schemeType: "flat_discount"`.
- So demo accounts can absolutely show broken or skipped flat-discount behavior.

2. But the larger problem is site-wide architecture
- Scheme calculation is duplicated in multiple places:
  - `src/pages/NewOrder.tsx`
  - `src/pages/OrderDetail.tsx`
- Order PDF (`OrderInvoicePdf`) reads saved scheme data from the order.
- Billing/GST invoice flow does not use order scheme data at all; it rebuilds invoice lines from raw order lines and ignores `schemeSavings` / `appliedSchemes`.
- Some screens use gross totals, others use net totals:
  - dealer metrics/PDFs often use gross `o.total`
  - dashboard/targets/salesperson use net `o.total - schemeSavings`
- That means even if one issue was “fixed”, the app still shows inconsistencies elsewhere because there is no single source of truth for commercial totals.

Why it’s still happening even after fixes
- Previous fixes were likely local fixes.
- The real bug is structural: totals, savings, and scheme application are being computed and rendered through separate paths.
- So one PDF or page can be corrected while another path still uses old assumptions.

Different approach needed
We should stop patching individual screens and instead centralize the commercial math.

Plan

Phase 1 — Establish one source of truth for order pricing
- Create one shared pricing utility for:
  - gross total
  - scheme savings
  - net/effective total
  - applied scheme labels/details
- Replace duplicated scheme logic in:
  - `src/pages/NewOrder.tsx`
  - `src/pages/OrderDetail.tsx`

Phase 2 — Make every output consume the same computed values
- Update all PDFs and reporting surfaces to use the same shared commercial totals:
  - `src/components/pdf/OrderInvoicePdf.tsx`
  - `src/components/pdf/DealerStatementPdf.tsx`
  - `src/components/pdf/SalespersonStatementPdf.tsx`
  - billing document generation flow in `src/pages/Billing.tsx`
- Define explicit rules for every surface:
  - whether it shows gross total
  - whether it shows savings line-by-line
  - whether grand total must be net-after-schemes

Phase 3 — Fix demo seed + data consistency
- Correct demo seed scheme types so they match app logic.
- Review seeded orders so `scheme_savings` and `order_schemes` are internally consistent.
- This removes false negatives during demos.

Phase 4 — Audit site-wide usage of totals
- Standardize gross vs net across:
  - dashboard
  - targets
  - dealer/salesperson performance
  - reports
  - billing
- Add a clear rule:
  - operational revenue/reporting uses net
  - raw order value can still be shown as gross where explicitly labeled

Phase 5 — Add regression protection
- Add tests for:
  - percentage scheme
  - buy-x-get-y scheme
  - flat discount scheme
  - order edit recalculation
  - PDF totals matching saved order data
  - billing invoice generation from an order with savings

Expected outcome
- We’ll know exactly whether a number is gross, savings, or net everywhere.
- PDFs will stop drifting from on-screen totals.
- Demo and production accounts will behave the same.
- Future fixes won’t re-break another page.

Implementation scope once approved
- Shared pricing utility
- Refactor 2 order-entry paths to use it
- Refactor all affected PDFs and billing generation to consume unified totals
- Fix demo seed scheme type mismatch
- Add regression tests around schemes and PDFs
