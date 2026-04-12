

# Feature #5: Dealer Performance Scorecard + Churn Risk

## Overview
Add a Performance Scorecard section inside the existing dealer detail dialog (Distributors page), a churn risk indicator, a "Generate Dealer Statement PDF" button, and a "Top Dealers Performance" widget on the Performance page linking to individual scorecards.

## Changes

### 1. `src/pages/Distributors.tsx` — Scorecard in Dealer Detail Dialog

After the existing 4 stat cards and credit health section (line ~382), insert a new **"Performance Scorecard"** section:

**Metrics computed from `selectedOrders`:**
- **Orders (30/60/90 days):** Count orders within each window, show trend arrow (↑/↓) comparing 30d vs previous 30d
- **Total Value:** Sum of order totals for this dealer in period
- **Average Order Value:** Total / count
- **Payment Timeliness:** % of orders with `paymentStatus === "paid"` (on-time %)
- **Churn Risk:** Computed from days since last order + payment behavior:
  - **Low** (green): Ordered within 30 days, >60% on-time payment
  - **Medium** (amber): Ordered within 60 days OR 30-60% on-time
  - **High** (red): No orders in 60+ days OR <30% on-time

**Visual treatment:**
- Progress bars for payment timeliness
- Color-coded churn risk badge (green/amber/red with icon)
- Trend arrows (↑↓→) on order count comparisons

**"Generate Dealer Statement PDF" button** — replaces the existing basic Export PDF button in the dealer detail header. Generates a professional branded PDF containing:
- Company header (from `api.companyInfo`)
- Dealer info section
- Scorecard metrics table
- Churn risk assessment
- Order history summary table

Uses existing `downloadPdf` + a new `DealerStatementPdf` component.

### 2. `src/components/pdf/DealerStatementPdf.tsx` — New file

A `@react-pdf/renderer` Document component rendering:
- PdfHeader with company branding
- Dealer details section (name, location, contact, credit)
- Performance scorecard table (orders 30/60/90d, AOV, payment timeliness, churn risk)
- Order history table (order number, date, amount, payment status)
- PdfFooter

### 3. `src/pages/Performance.tsx` — Top Dealers Performance Widget

Add a new widget after the existing "Credit at Risk" section (~line 525) and before "Scheme Performance":

**"Top Dealers Performance"** card showing top 5 dealers with:
- Name, revenue in period, order count, churn risk badge
- Each row is clickable → navigates to `/distributors` (and could set a query param, but for simplicity just navigates)
- Uses the same churn risk calculation logic

### 4. Shared Churn Risk Utility

Create a small helper function (inline or in a utils file) to compute churn risk given a dealer's orders array. This avoids duplicating logic between Distributors and Performance pages.

**Logic:**
```typescript
function getChurnRisk(dealerOrders: Order[]): "low" | "medium" | "high" {
  if (dealerOrders.length === 0) return "high";
  const now = new Date();
  const sorted = [...dealerOrders].sort((a, b) => b.date.localeCompare(a.date));
  const daysSinceLastOrder = (now.getTime() - new Date(sorted[0].date).getTime()) / 86400000;
  const paidPct = dealerOrders.filter(o => o.paymentStatus === "paid").length / dealerOrders.length * 100;
  
  if (daysSinceLastOrder <= 30 && paidPct >= 60) return "low";
  if (daysSinceLastOrder <= 60 || paidPct >= 30) return "medium";
  return "high";
}
```

## Files Touched
- `src/utils/dealerScorecard.ts` — New: churn risk calculator + scorecard data builder
- `src/components/pdf/DealerStatementPdf.tsx` — New: branded statement PDF
- `src/pages/Distributors.tsx` — Add scorecard section + statement PDF button in dealer detail dialog
- `src/pages/Performance.tsx` — Add Top Dealers Performance widget

## No database changes needed
All data is computed from existing `orders` table. No new tables or columns required.

