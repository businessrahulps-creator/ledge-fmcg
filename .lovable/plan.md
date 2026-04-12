

# Remove the Lonely "Accounting" Section

## Problem
After moving Billing to Overview, "Accounting" only contains "Company" — a single-item section header looks odd and wastes vertical space.

## Solution
**Dissolve "Accounting"** and move Company into the **Manage** section. Company settings (name, GST, bank details, logo) are operational configuration — it fits naturally alongside Dealers, Stock, and other entity management items.

```text
Sidebar
├── Overview
│   ├── Dashboard
│   ├── Orders
│   └── Billing
├── Manage
│   ├── Stock
│   ├── Dealers
│   ├── Sales Team
│   ├── Schemes
│   ├── Targets
│   ├── Returns
│   └── Company          ← moved here (last item, setup-oriented)
├── Analyze
│   ├── Reports
│   └── Performance
└── Settings
```

## Changes

| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Remove `accountingNav` array and its `<SidebarGroup>`. Add Company entry to the end of `manageNav`. Remove the Accounting section from the JSX. |

One file, ~15 lines removed, 1 line added. No other files affected.

