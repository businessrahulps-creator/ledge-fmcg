# Audit fix roadmap (loop mode: fix → verify → next)

## Phase 1 — money agrees with itself
- [x] 1. Credit check uses GST-inclusive basis (NewOrder + OrderDetail edit)
- [x] 2. Money to collect includes advances on unbilled orders
- [x] 3. Money to collect nets credit notes
- [x] 4. One name per number: Order value (pre-GST) vs Billed (with GST)

## Phase 2 — stranded orders
- [x] 5. "Raise the bill" for dispatched-but-unbilled orders (server bills without touching stock; order page shows the GST-rate blocker with a link to Stock). Money flag still to add.
- [x] 6. Bill status badge reads real document state (Issued / Paid / Draft, shared helper in src/lib/bill-status.ts)
- [x] 7. Orders list delete guard matches order page

## Phase 3 — stock trustworthy
- [ ] 8. Stock movements written for every change; atomic manual adjust
- [ ] 9. Warehouse delete handles its stock
- [ ] 10. GST-rate-missing list (47 products)

## Phase 4 — verify
- [ ] 11. Targets duplicate-row check; Schemes toast-before-save check
- [ ] 12. Full signed-in lifecycle run on seed data
