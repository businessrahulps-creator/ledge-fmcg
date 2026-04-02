

# Fix Preview Dashboard — Nav Icons & Desktop Layout

## Issues Identified

1. **Navigation icons too large and dated**: `w-5 h-5` icons look heavy. Icons like `LayoutDashboard`, `ShoppingCart`, `Warehouse` feel old-school — need sleeker alternatives.
2. **Desktop is just a stretched mobile view**: Everything uses `px-5` with no max-width or responsive columns. KPI cards, sections, and orders all stretch edge-to-edge at 863px+, looking odd.

## Changes (only `src/pages/PreviewDashboard.tsx`)

### 1. Swap to more modern Lucide icons
- `LayoutDashboard` → `House` (cleaner home icon)
- `ShoppingCart` → `Receipt` (modern order/receipt feel)
- `Warehouse` → `Box` (simpler, lighter)
- `Users` → `UserRound` (single modern user icon)
- `BarChart3` → `ChartNoAxesCombined` (sleeker chart)
- Nav icon size: `w-5 h-5` → `w-[18px] h-[18px]`, `strokeWidth` from 2/1.5 → 1.8/1.5

### 2. Desktop-responsive layout
- Wrap the main content in a container with `max-w-lg mx-auto` on mobile and `md:max-w-5xl` on desktop
- **Header**: stays full-width but constrained
- **KPI grid**: `grid-cols-2` on mobile → `md:grid-cols-4` on desktop
- **Sections (Distributors, Products, Orders)**: on desktop, use a `md:grid md:grid-cols-2 md:gap-6` layout so Top Distributors and Top Products sit side-by-side
- **Recent Orders**: full width on desktop with a cleaner card grid
- **Bottom nav**: hide on desktop (`md:hidden`), since the page is a preview and desktop users would use the sidebar

### 3. Minor spacing refinements
- Desktop padding: `px-5` → `px-5 md:px-8`
- Bottom nav: add `md:hidden` so it only shows on mobile viewports

