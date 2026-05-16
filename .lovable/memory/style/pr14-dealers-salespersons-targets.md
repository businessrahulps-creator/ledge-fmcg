---
name: PR14 Dealers/Salespersons/Targets
description: Promoted credit-risk surfaces, team revenue strip, and named behind-target lists
type: design
---
**Distributors**: Added portfolio aggregations (overLimit count + ₹ over-limit, approaching count). SignalCard (destructive if any over limit, else warning if approaching) above 4-cell KpiStrip (Active dealers / Total outstanding / Approaching limit / Over limit).

**Salespersons**: 4-cell KpiStrip (Team size / Total revenue / Total orders / Top performer name). No SignalCard — performance signaling lives on Targets page.

**Targets**: Replaced the generic 4-card summary grid with KpiStrip + optional SignalCard. When overall status is `needs_attention` it's destructive; `behind` is warning. Caption names up to 3 behind-target salespersons (<60% pace) so the alert is actionable, not just a percentage.

Performance.tsx + DealerDetail/SalespersonDetail deferred to PR15 — Performance is 1054 lines and needs its own composition pass.
