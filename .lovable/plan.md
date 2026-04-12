

# Feature #5: Sales Team Performance Scorecard + Statement PDF

## Overview
Mirror the existing Dealer Performance Scorecard for salespersons — same visual layout, same utility pattern, plus a "Top Sales Team" widget on Performance page.

## Files to Create

### 1. `src/utils/salespersonScorecard.ts`
Symmetric to `dealerScorecard.ts`. Contains:
- `SalespersonScorecard` interface: `orders30d`, `orders60d`, `orders90d`, `ordersPrev30d`, `totalRevenue`, `totalRevenue30d`, `avgOrderValue`, `orderFrequency` (orders/week over 90d), `paymentCollectionEfficiency` (% paid), `daysSinceLastOrder`
- `PerformanceHealth` type: `"high" | "medium" | "low"`
- `getPerformanceHealth(orders)`: Returns health level based on order recency + payment collection (mirrors churn risk logic)
- `getPerformanceInsight(health, scorecard)`: Returns plain-English one-liner (e.g., "Strong closer but slow payment collection", "Consistent performer", "Needs attention — low activity")
- `buildSalespersonScorecard(orders)`: Computes all metrics
- `performanceHealthConfig`: Color/label map (High=green, Medium=amber, Low=red) — symmetric to `churnRiskConfig`

### 2. `src/components/pdf/SalespersonStatementPdf.tsx`
Symmetric to `DealerStatementPdf.tsx`. Professional branded PDF with:
- Company header (PdfHeader)
- Salesperson details (name, phone, email, region)
- Performance scorecard table (all metrics + health assessment)
- Order history table (order #, date, dealer name, amount, payment status)
- Summary totals box
- PdfFooter

## Files to Modify

### 3. `src/pages/Salespersons.tsx` — Profile Dialog Enhancement
Replace the basic profile dialog (lines 280-386) with the enhanced version:

**Header**: Add "Statement PDF" button (same style as dealer page) next to name.

**Info cards**: Keep existing Phone/Email/Region/Total Value grid.

**Performance Scorecard section** (new, after info cards): Exact same visual structure as Dealer Scorecard:
- Performance Health badge (replaces Churn Risk) with icon, label, insight line
- 2x2 metrics grid: Orders (30d) with trend arrow, Orders (90d), Avg Order Value, Revenue (30d)
- Payment Collection Efficiency progress bar
- Order Frequency stat

**Order History table**: Keep existing, update amounts to effective totals.

### 4. `src/pages/Performance.tsx` — Top Sales Team Widget
Add after the "Top Dealers Performance" widget (~line 577):
- "Top Sales Team" card with blue-purple accent
- Top 3 salespersons by revenue with order count + performance health badge
- Each row clickable → navigates to `/salespersons`
- Same visual style as Top Dealers widget

## Key Design Decisions
- Performance Health uses same logic pattern as Churn Risk (recency + payment %)
- "High" health = Low churn risk equivalent (green), "Low" health = needs attention (red)
- Insight line uses simple conditional logic based on metrics
- All amounts use effective totals (minus scheme savings)
- Statement PDF mirrors Dealer Statement PDF structure exactly

