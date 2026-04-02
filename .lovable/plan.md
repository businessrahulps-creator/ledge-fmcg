

# Mobile-First Overhaul for Ordra

## Issues Found

Based on the visual audit across all pages at 390px viewport:

1. **Godown Overview**: KPI cards with `text-[40px]` cause text overflow (₹7,99,94... gets cut off)
2. **Dashboard**: KPI cards stack single-column but use `p-6` padding wastefully; Recent Orders table is desktop-only with no mobile card view
3. **Reports**: Tables render full desktop layout on mobile — no card view; tab bar "Dispatch" gets cut off
4. **Settings**: Team member rows have cramped layout on mobile with role badges and action buttons overflowing
5. **New Order**: Product line items use `sm:grid-cols-12` grid that stacks awkwardly; sidebar summary pushes below the fold with no clear separation
6. **Bottom nav bar**: 5 items squeezed at 390px — icons/labels are small; missing access to Products, Salespersons, Settings
7. **Header**: Only shows logo on mobile — no page context or user actions
8. **No PWA install prompt**: Users cannot install the app from the browser
9. **Typography**: Page titles at `text-2xl` (32px) are oversized for mobile; body padding `p-4` is tight
10. **Touch targets**: Some buttons (edit/delete icons) are 32px — below the 44px minimum for mobile
11. **Products page**: Desktop table with no mobile card view for product list
12. **Salespersons page**: Cards work well but dialog content may overflow on mobile

## Plan

### 1. Global Layout & Spacing Fixes (AppLayout, index.css)

- Reduce main content padding from `p-4` to `px-3 py-4` on mobile
- Increase bottom nav icon size from `h-5 w-5` to `h-6 w-6`, increase `py-2.5` to `py-3`
- Add safe-area-inset padding for bottom nav (`pb-[env(safe-area-inset-bottom)]`)
- Increase `pb-24` to `pb-28` to account for larger bottom nav
- Ensure header height is `h-12` on mobile (compact)

### 2. Typography Scale Adjustments (all pages)

- Page titles: `text-xl` on mobile, `md:text-2xl` on desktop
- Page descriptions: `text-xs` on mobile, `md:text-sm`
- Section headers: `text-sm font-semibold` on mobile, `md:text-base`
- KPI values: reduce from `text-xl`/`text-[40px]` to mobile-appropriate sizes

### 3. Dashboard Mobile Fixes

- KPI cards: tighter padding `p-4` on mobile, `md:p-6`
- KPI values: `text-lg` on mobile, `md:text-xl`
- Recent Orders: add mobile card view (like Orders page) instead of table
- Top Distributors/Products: reduce spacing

### 4. Godown Overview Mobile Fixes

- KPI `text-[40px]` → `text-2xl` on mobile, `md:text-[40px]`
- KPI card padding: `p-4` on mobile, `md:p-8`
- Godown location cards: `p-4` on mobile

### 5. Reports Mobile Overhaul

- Tab bar: make horizontally scrollable with `overflow-x-auto` and `flex-nowrap`
- All report tables: add mobile card view (hidden table, visible cards below `md`)
- TimePeriodFilter: full-width on mobile
- Summary stats: wrap properly on mobile

### 6. Settings Mobile Fixes

- Team member rows: stack name/role vertically on mobile, move actions to right
- Subscription grid: `grid-cols-1` on mobile, `sm:grid-cols-2`

### 7. New Order Mobile Optimization

- Order Details: `grid-cols-1` on mobile (already handled by `sm:grid-cols-3`)
- Product line items: ensure clean single-column stack with larger touch targets
- Move sidebar (Payment + Summary) to sticky bottom sheet pattern or just below the form
- Save Order button: sticky at bottom on mobile

### 8. Products & Salespersons Pages

- Products: ensure mobile card view exists and works (already has one based on summary)
- Verify all edit/delete buttons meet 44px touch target

### 9. Touch Target Fixes (global)

- All icon buttons: minimum `h-10 w-10` (40px) on mobile
- All interactive cards: adequate padding for thumb tapping
- Status badges: ensure adequate size

### 10. PWA Install Prompt

- Add a `manifest.json` with app name, icons, and `display: "standalone"` to enable Add to Home Screen
- Add mobile-optimized meta tags to `index.html` (theme-color, apple-mobile-web-app-capable)
- No service worker needed — just installability via manifest
- Add an install banner component that detects the `beforeinstallprompt` event and shows a dismissible prompt

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/AppLayout.tsx` | Bottom nav sizing, padding, safe areas |
| `src/pages/Dashboard.tsx` | Mobile card view for orders, KPI sizing |
| `src/pages/GodownOverview.tsx` | KPI text/padding responsive classes |
| `src/pages/GodownInventory.tsx` | Verify mobile card view |
| `src/pages/Reports.tsx` | Scrollable tab bar |
| `src/components/reports/DistributorReport.tsx` | Mobile card view |
| `src/components/reports/ProductReport.tsx` | Mobile card view |
| `src/components/reports/PaymentReport.tsx` | Mobile card view |
| `src/components/reports/DispatchReport.tsx` | Mobile card view |
| `src/pages/Settings.tsx` | Team member layout, subscription grid |
| `src/pages/NewOrder.tsx` | Mobile form flow, sticky save button |
| `src/pages/Orders.tsx` | Minor touch target fixes |
| `src/pages/Products.tsx` | Touch target fixes |
| `src/pages/Salespersons.tsx` | Touch target fixes |
| `src/pages/Distributors.tsx` | Touch target fixes |
| `index.html` | PWA meta tags |
| `public/manifest.json` | New — PWA manifest for installability |
| `src/components/InstallPrompt.tsx` | New — install banner component |

