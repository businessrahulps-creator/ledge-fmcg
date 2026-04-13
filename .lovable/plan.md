

# Replace HTML Mockups with Real Screenshots

## The Problem
The Hero section (`DashboardMockup`), and HowItWorks section (`OrderMockup`, `DashboardMiniMockup`, `StockMockup`) use inline HTML divs styled to look like app screens. These read as wireframes/placeholders rather than a real product — undermining the premium feel.

## What We Need From You
Please upload **3 screenshots** of the actual Ledge app:

1. **Dashboard** — the main dashboard with KPIs, chart, and recent orders visible (used in Hero + HowItWorks step 2)
2. **New Order screen** — the mobile order creation form (used in HowItWorks step 1)
3. **Stock page** — the stock health table with colored badges (used in HowItWorks step 3)

Take these at the highest resolution possible. Desktop screenshots work best for the dashboard and stock views; a narrow/mobile viewport works best for the order screen.

## Implementation Plan

### 1. Add screenshot images to `/public/`
Save the uploaded images as optimized WebP/PNG files (e.g. `dashboard-shot.webp`, `order-shot.webp`, `stock-shot.webp`).

### 2. Refactor `Hero.tsx` — `DashboardMockup` component
- Remove the entire inline HTML mockup (KPI grid, chart bars, order rows — ~90 lines)
- Replace with a single `<img>` tag inside the existing `BrowserFrame` wrapper
- The image fills the frame naturally with `w-full` and proper `alt` text
- All surrounding layout (GradientStage, perspective transform, motion) stays identical

### 3. Refactor `HowItWorks.tsx` — all 3 mockup components
- **OrderMockup**: Remove `OrderMockupContent` HTML → replace with `<img>` inside existing `PhoneFrame`
- **DashboardMiniMockup**: Remove inline KPI/chart HTML → replace with `<img>` inside existing `BrowserFrame`
- **StockMockup**: Remove inline table HTML → replace with `<img>` inside existing `BrowserFrame`
- Each mockup component shrinks from 30-50 lines to ~5 lines

### 4. DeviceFrames stay untouched
The `BrowserFrame`, `PhoneFrame`, and `GradientStage` wrappers remain exactly as-is — they provide the premium macOS/phone chrome around the screenshot.

## What does NOT change
- All text/copy, section order, layout grids, animations
- Device frame components (traffic lights, notch, chrome)
- GradientStage backdrops and perspective transforms
- Color palette, spacing, typography, buttons
- Any section other than Hero and HowItWorks

## Net result
~200 lines of fragile HTML mockup code replaced with 3 clean `<img>` tags inside the same premium device frames. The page instantly looks like a real product, not a prototype.

