

# Always Show English Labels on All Action Buttons

## Problem
Action buttons throughout the app hide their text labels on mobile (`hidden sm:inline`), leaving only icons. Non-tech-savvy Indian FMCG users can't identify what buttons like `FileText` or `Share2` icons mean.

## Solution
Remove `hidden sm:inline` from all `<span>` elements inside action buttons so English labels ("Invoice", "Share", "Export CSV", "Export PDF", "Delete") are always visible on every screen size.

## Files to Change (~10 files, same mechanical edit)

| File | Labels affected |
|------|----------------|
| `src/pages/Orders.tsx` | "Export CSV", "Export PDF", "Delete", "Invoice", "Share" |
| `src/pages/Distributors.tsx` | "Export CSV", "Export PDF" |
| `src/pages/Salespersons.tsx` | "Export PDF" (if present) |
| `src/pages/Stock.tsx` | "Export CSV", "Export PDF" (×2 — list + detail) |
| `src/components/reports/SalesTeamReport.tsx` | "Export CSV", "Export PDF" |
| `src/components/reports/DistributorReport.tsx` | "Export CSV", "Export PDF" |
| `src/components/reports/DispatchReport.tsx` | "Export CSV", "Export PDF" |
| `src/components/reports/ProductReport.tsx` | "Export CSV", "Export PDF" |
| `src/components/reports/PaymentReport.tsx` | "Export CSV", "Export PDF" |

**Note:** `src/pages/Settings.tsx` has `hidden sm:inline-flex` on role badges — this is a layout concern, not an action button, so it stays as-is.

## The Edit
For every match: change `<span className="hidden sm:inline">Label</span>` to `<span>Label</span>`.

No logic, layout, data flow, or styling changes. Pure label visibility fix.

