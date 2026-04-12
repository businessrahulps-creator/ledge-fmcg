

# Expand Help Page with Comprehensive Feature Guides

## Change

Replace the current 5 generic accordion sections with ~12 focused, feature-specific guides covering every major area of Ledge. Each section explains what the feature does, how to use it step-by-step, and practical tips.

## New Sections

| # | Section | Covers |
|---|---------|--------|
| 1 | Getting Started (keep, refine) | First 15 minutes setup |
| 2 | Daily Workflow (keep) | Morning-to-close routine |
| 3 | Orders | Creating, editing, statuses (payment + delivery), partial payments, order prefixes, linking to invoices |
| 4 | Dealers | Adding dealers, GSTIN, credit limits, outstanding tracking, ledger view |
| 5 | Sales Team | Adding salespersons, assigning regions, linking to orders |
| 6 | Stock & Warehouses | Products (SKU, HSN, price), warehouses, low-stock thresholds, stock health badges |
| 7 | Schemes & Discounts | Three scheme types (buy X get Y, percentage, flat), time-bound, product/dealer targeting |
| 8 | Billing & Invoices | Four document types (GST Invoice, Estimate, Proforma, Credit Note), draft vs finalized, linking orders, PDF/WhatsApp export |
| 9 | Claims & Returns | Two claim types (Goods Returned, Damaged/Claim Only), resolution workflow (open → resolved/rejected), linking to orders |
| 10 | Reports & Performance (keep, expand) | Five report types + targets + performance page |
| 11 | Tips & Best Practices (keep, expand) | Do's and don'ts with new billing/claims tips |

## Implementation

**`src/pages/Help.tsx`** — single file rewrite:

- Same structure: `AppLayout` > `Accordion type="multiple"`
- Same styling: `glass-card`, `prose prose-sm`, `text-muted-foreground`
- Each section uses the existing accordion pattern with `ol`/`ul` lists and `border-l-2` tip callouts
- Content is static JSX (no data fetching needed)
- Sections ordered by typical user journey: setup → daily use → feature deep-dives → advanced → tips

**1 file modified. No new files. No new dependencies. No database changes.**

