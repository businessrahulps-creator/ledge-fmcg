

# Replace Screenshot Mockups with Single-Color SVG Illustrations

## What's changing
The 4 static `.webp` screenshots (Hero dashboard, HowItWorks steps 1-3) get replaced with clean, minimalist SVG illustrations drawn in a single emerald color (`#0D9488`). Each SVG animates once on scroll — a subtle stroke-drawing effect + gentle fade/scale — then stops. Everything else stays identical.

## What does NOT change
- All text, copy, section structure, layout grids, spacing, symmetry
- Device frames (BrowserFrame, PhoneFrame, GradientStage) — kept exactly as-is
- Icons, buttons, colors, fonts, animations outside the mockups
- Features, Problem, WhyOrdra, Pricing, Testimonials, TrustBar sections

## Design rules
- **Single color only**: `#0D9488` (existing teal) for all strokes and fills
- **Fill opacity**: `0.06` for card backgrounds, `0.12` for active/accent areas — creates depth without adding colors
- **Stroke**: `1px`, `round` cap/join
- **Corner radius**: `6px` on cards, `4px` on smaller elements — matches the rounded modern feel
- **No text inside SVGs** — just abstract shapes representing UI elements (rectangles, lines, circles)
- **Responsive**: `viewBox` based, scales to container width

## Animation spec
- Trigger: `useInView({ once: true })`
- Entry: `opacity: 0 → 1` over 800ms + `scale: 0.98 → 1` over 800ms (spring, damping 30)
- SVG paths: `strokeDashoffset` draws lines over 1.2s with `ease-out`
- Card fills: stagger fade-in, 100ms apart
- Plays once. No looping. No bounce.

## SVG illustrations (4 total)

### 1. Hero Dashboard SVG (`DashboardSvg`)
```
┌────┐ ┌────┐ ┌────┐ ┌────┐   ← 4 KPI cards (rounded rects, teal fill 0.06)
└────┘ └────┘ └────┘ └────┘
┌──────────────────────────┐
│ ████ ██████ ███ ████████ │   ← Horizontal bar chart (4 bars, varying width)
│ ██████████ ████ ██       │
└──────────────────────────┘
┌──────────────────────────┐
│ ── ── ── ── ── ── ── ── │   ← 3 order rows (line + small rect per row)
│ ── ── ── ── ── ── ── ── │
│ ── ── ── ── ── ── ── ── │
└──────────────────────────┘
```
Used inside the existing `BrowserFrame` + `GradientStage` in Hero.

### 2. Order Form SVG (`OrderFormSvg`)
```
┌──────────────────┐
│ [▼ Dealer Name ] │   ← Dropdown (rounded rect + chevron)
├──────────────────┤
│ Product 1  Qty ₹ │   ← 3 product line rows
│ Product 2  Qty ₹ │
│ Product 3  Qty ₹ │
├──────────────────┤
│ [Scheme tag]     │   ← Small pill shape
│ ○ Cash ○ UPI     │   ← Radio circles
├──────────────────┤
│   [ Submit ▸ ]   │   ← Button rect
└──────────────────┘
```
Used inside the existing `PhoneFrame` + `GradientStage` in HowItWorks step 1.

### 3. Dashboard Mini SVG (`DashboardMiniSvg`)
Same concept as Hero but simplified — 3 KPI cards + a few order list rows. Used in `BrowserFrame` + `GradientStage` for step 2.

### 4. Invoice/Stock SVG (`InvoiceStockSvg`)
```
┌──────────────────────────┐
│ Item   Qty   Rate   Amt  │   ← Table header
│ ───── ───── ───── ─────  │
│ ───── ───── ───── ─────  │   ← 3-4 line item rows
│ ───── ───── ───── ─────  │
├──────────────────────────┤
│        CGST  [ ████ ]    │   ← GST breakdown boxes
│        SGST  [ ████ ]    │
│        Total [ ████ ]    │
├──────────────────────────┤
│   [↓ Download PDF]       │   ← Button-like rect with arrow icon
└──────────────────────────┘
```
Used in `BrowserFrame` + `GradientStage` for step 3.

## Files

### New (1)
`src/components/landing/illustrations/SvgIllustrations.tsx`
- Exports: `DashboardSvg`, `OrderFormSvg`, `DashboardMiniSvg`, `InvoiceStockSvg`
- Each is a React component rendering an inline `<svg>` with `viewBox`
- Uses `motion.rect`, `motion.line`, `motion.path` from framer-motion for the draw animation
- Uses `useInView` for scroll trigger

### Modified (2)
1. `src/components/landing/sections/Hero.tsx`
   - Remove `dashboardShot` import
   - Replace `<img>` inside `BrowserFrame` with `<DashboardSvg />`

2. `src/components/landing/sections/HowItWorks.tsx`
   - Remove all 3 `.webp` imports
   - Replace `OrderMockup` contents with `<OrderFormSvg />`
   - Replace `DashboardMiniMockup` contents with `<DashboardMiniSvg />`
   - Replace `StockMockup` contents with `<InvoiceStockSvg />`

