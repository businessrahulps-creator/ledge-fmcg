

# Move Company Information to Sidebar

## Problem
Company Information (name, GST, address, bank details) is critical for Billing documents but hidden inside Settings → Company tab. Users shouldn't have to hunt through Settings to update their invoice details.

## Approach
**Extract** the Company tab content into a dedicated `/company` page and add it to the **Accounting** sidebar section alongside Billing — since company details are primarily used for invoicing.

```text
Sidebar
├── Overview
│   ├── Dashboard
│   └── Orders
├── Manage
│   ├── Stock, Dealers, Sales Team, ...
├── Accounting          ← logical home
│   ├── Billing
│   └── Company         ← NEW
├── Analyze
│   └── Reports, Performance
└── Settings            ← keeps Team + Subscription tabs only
```

## Changes

| Action | File | What |
|--------|------|------|
| New | `src/pages/Company.tsx` | Standalone page with company info form (extracted from Settings) |
| Modify | `src/pages/Settings.tsx` | Remove the "Company" tab, keep Team + Subscription |
| Modify | `src/components/layout/AppSidebar.tsx` | Add `{ title: "Company", url: "/company", icon: Building2 }` to `accountingNav` |
| Modify | `src/App.tsx` | Add `/company` route |

## Details

- The Company page will use `AppLayout` and contain the same form (company name, GST, address, bank details, logo upload) currently in the Settings Company tab.
- Settings page tabs reduce from 3 to 2 (Team, Subscription). If only one tab remains meaningful, we can flatten it.
- The `Building2` icon (already imported in Settings) will be used for the sidebar item.
- No database or API changes needed — same `api.company` calls.

