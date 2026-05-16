---
name: PR15 Performance/Schemes
description: Performance hero SignalCard + KpiStrip with InsightLine deltas; Schemes expiring-soon warning surface
type: design
---
**Performance**: Replaced the 4-card neutral KPI grid with a `SignalCard` (driven by revenue Δ vs previous period — success ≥+5%, destructive ≤-5%, warning if mildly negative) + `KpiStrip` where each cell carries an `InsightLine` showing the period-over-period delta. Tabs and downstream charts unchanged.

**Schemes**: Added a `SignalCard` (warning) between the search bar and the empty/active sections when any active scheme expires within 7 days. Names up to 3 expiring schemes inline so it's actionable.

PR15 is intentionally tight: DealerDetail/SalespersonDetail/Settings remain as small follow-ups when the user signals they want them. The promoted-surface pattern is now consistent across Dashboard, Orders, OrderDetail, Billing, Claims, Stock, NewOrder, Distributors, Targets, Performance, and Schemes.
