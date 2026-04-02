
# Roll Out Light Premium Design — Full Platform

## Design System Summary

The approved `/preview` design uses:
- **Background**: `#FAFAFA` (off-white)
- **Text**: `#111` primary, `#333` secondary, `#888`/`#999` muted, `#AAA`/`#BBB` subtle
- **Cards**: `bg-white border border-[#EBEBEB] shadow-sm rounded-2xl`
- **Status badges**: Soft backgrounds (`bg-emerald-50`, `bg-amber-50`, `bg-red-50`, `bg-blue-50`, `bg-orange-50`)
- **Icons**: Modern Lucide set (`House`, `Receipt`, `Box`, `UserRound`, `ChartNoAxesCombined`), `w-[18px] h-[18px]`, `strokeWidth={1.8}`
- **Bottom nav (mobile)**: Floating pill with `bg-white border-[#E8E8E8]`, animated active indicator
- **Desktop**: Sidebar hidden on mobile, content constrained with `max-w-5xl`

## Files to Change

### 1. Global Foundation

**`src/index.css`** — Update CSS variables for light-first theme:
- `--background` → `#FAFAFA` equivalent HSL
- `--card` → pure white
- `--border` → `#EBEBEB` equivalent
- `--foreground` → near-black `#111`
- `--muted-foreground` → `#888`
- Keep dark mode variables as-is for future support

**`src/components/ui/status-badge.tsx`** — Replace `status-*` utility classes with inline soft-color styles matching the preview (`bg-emerald-50 text-emerald-600`, etc.)

### 2. Layout Shell

**`src/components/layout/AppLayout.tsx`** — Major overhaul:
- Background: `bg-[#FAFAFA]`
- Swap mobile nav icons to modern set (`House`, `Receipt`, `Box`, `UserRound`, `ChartNoAxesCombined`)
- Replace flat bottom nav with floating pill design (rounded-2xl, shadow, framer-motion active pill)
- Icon size: `w-[18px] h-[18px]`, `strokeWidth={1.8}`
- Header: lighter, minimal — white bg, subtle border
- Content area: `max-w-lg mx-auto md:max-w-5xl md:px-8`
- Hide sidebar trigger on mobile (pill nav replaces it)

**`src/components/layout/AppSidebar.tsx`** — Update sidebar icons to match:
- `LayoutDashboard` → `House`, `ShoppingCart` → `Receipt`, `Warehouse` → `Box`, `Users` → `UserRound`, `BarChart3` → `ChartNoAxesCombined`
- Background: white, borders: `#EBEBEB`

### 3. All Pages (adapt to new design tokens)

Each page will get card styling updated from `border-border bg-card` → `bg-white border border-[#EBEBEB] shadow-sm rounded-2xl`, text colors to use the new palette, and responsive container constraints.

**`src/pages/Dashboard.tsx`** — Merge preview design in:
- Greeting header with day-of-week indicator
- KPI cards with preview styling
- Progress bars with grayscale gradients
- Recent orders with preview card design
- Responsive: `grid-cols-2 md:grid-cols-4` KPIs, `md:grid-cols-2` sections

**`src/pages/Orders.tsx`** — Card/table borders, status badges, search input styling

**`src/pages/NewOrder.tsx`** — Section cards, button styling, form inputs

**`src/pages/Distributors.tsx`** — Card grid styling, dialog styling

**`src/pages/Products.tsx`** — Table/card borders, dialog styling

**`src/pages/Salespersons.tsx`** — Card grid, profile dialog

**`src/pages/Reports.tsx`** — Tab styling

**`src/components/reports/DistributorReport.tsx`**, **`ProductReport.tsx`**, **`PaymentReport.tsx`**, **`DispatchReport.tsx`** — Table/card styling updates

**`src/pages/GodownOverview.tsx`** — KPI cards from dark glassmorphism → white card style, location cards

**`src/pages/GodownInventory.tsx`** — Table/card/filter styling

**`src/pages/GodownAlerts.tsx`** — Alert card styling

**`src/pages/Settings.tsx`** — Tab, team list, subscription card styling

**`src/pages/Login.tsx`** / **`src/pages/Signup.tsx`** — Background, card styling

**`src/components/godown/StockDetailPanel.tsx`** — Panel background/border

**`src/components/godown/TransferStockModal.tsx`** — Modal background/border

### 4. Cleanup

**`src/pages/PreviewDashboard.tsx`** — Delete (design absorbed into main pages)

**`src/App.tsx`** — Remove `/preview` route

## What Won't Change
- Landing page (`/`) — keeps its own dark theme
- Core UI primitives (`button.tsx`, `input.tsx`, `dialog.tsx`, etc.) — mostly fine, minor tweaks via CSS vars
- Data layer, routing logic, business logic — untouched
- Dark mode CSS vars — preserved for future use

## Execution Order
1. Global CSS + StatusBadge
2. AppLayout + AppSidebar (shell)
3. Dashboard (flagship page)
4. All other pages (batch)
5. Godown components
6. Delete preview, clean up route
