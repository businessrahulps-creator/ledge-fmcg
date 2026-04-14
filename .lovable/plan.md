

# Upgrade SVG Illustrations — Charcoal Color, Text Labels, Larger Size, More Detail

## Issues found in audit

1. **Wrong color**: SVGs use teal `#0D9488` but buttons use charcoal `#27272A`. The illustrations feel disconnected from the page's primary visual anchor.
2. **No text**: Pure abstract lines with no context — a viewer can't tell what the shapes represent without reading the section copy.
3. **Too small**: Hero mockup is `max-w-lg` (~512px). HowItWorks phone frame is `max-w-[280px]`. These feel like thumbnails, not hero-grade visuals.
4. **Too sparse**: The SVGs have minimal elements (e.g., DashboardMini has only 3 KPI cards and 4 rows). They feel like wireframe sketches, not premium product representations.
5. **ViewBox cramped**: `DashboardSvg` is 408×280 — small aspect ratio with tight padding. Needs more breathing room.

## Changes

### Color system (SvgIllustrations.tsx)
Replace all teal with charcoal:
- `C` → `#27272A`
- `FILL_BG` → `rgba(39,39,42,0.04)`
- `FILL_ACCENT` → `rgba(39,39,42,0.10)`
- Stroke width stays `1px`

### Add minimal SVG `<text>` labels
Small, tasteful labels using `font-size: 9-11px`, `fill: #27272A`, `opacity: 0.5-0.7`, `font-family: sans-serif`. These animate in with the same fade timing. Examples:

**DashboardSvg**: KPI labels — "Revenue", "Orders", "Dispatch", "Delivery". Bar chart title — "This Week". Order rows — "#ORD-247", "#ORD-246", "#ORD-245" with status pills "Delivered", "Pending", "Dispatched".

**OrderFormSvg**: "Select Dealer" in dropdown. Product rows — "Maggi 2-Min 12pk", "Surf Excel 1kg", "Parle-G 800g". Scheme pill — "Diwali 5+1". Radio labels — "Cash", "UPI", "Cheque". Button — "Place Order".

**DashboardMiniSvg**: KPI labels — "₹4.8L", "230", "₹57K". Section header — "Recent Orders". Row labels — "#247 Sharma Stores", "#246 Gupta Trading".

**InvoiceStockSvg**: Table headers — "Item", "Qty", "Rate", "GST", "Amount". GST labels — "CGST 9%", "SGST 9%", "Total". Button — "Download PDF".

### Increase size

**Hero.tsx**: Change `max-w-lg` to `max-w-2xl` on the mockup wrapper. The BrowserFrame fills the full column width.

**HowItWorks.tsx**: Phone frame `max-w-[280px]` → `max-w-[320px]`. Browser frames already scale to column width (no change needed). The visual column gets more breathing room.

**SVG viewBoxes**: Expand with more padding:
- `DashboardSvg`: `0 0 408 280` → `0 0 440 320` (more internal spacing between sections)
- `OrderFormSvg`: `0 0 240 400` → `0 0 260 440` (add a 4th product line, more vertical space)
- `DashboardMiniSvg`: `0 0 396 220` → `0 0 420 260` (5 rows instead of 4, more spacing)
- `InvoiceStockSvg`: `0 0 396 280` → `0 0 420 320` (5 data rows instead of 4)

### More detail (richer illustrations)

**DashboardSvg** additions:
- Add a 5th and 6th bar to the chart (8 total bars, varying widths)
- Add a mini sparkline (SVG path) inside each KPI card
- Add 2 more order rows (5 total)
- Add status pill labels next to row badges

**OrderFormSvg** additions:
- Add a 4th product line
- Add a subtotal/total section between the scheme tag and radio buttons
- Add a small "₹" symbol next to price lines

**DashboardMiniSvg** additions:
- Add a 5th order row
- Add a small "Live" pulse indicator (circle with opacity pulse) next to the header

**InvoiceStockSvg** additions:
- Add a 5th data row
- Add horizontal divider between GST area and table
- Add a small invoice number label at the top

### Animation refinements
- Text labels fade in 200ms after their parent element (creates a nice layered reveal)
- Sparklines inside KPI cards draw with `pathLength` after the card fades in
- Slightly longer stagger between elements (120ms instead of 80-100ms) for a more deliberate, premium choreography

## Files modified (3)

1. **`src/components/landing/illustrations/SvgIllustrations.tsx`** — Color swap, add text labels, expand viewBoxes, add more elements, refine animation timing
2. **`src/components/landing/sections/Hero.tsx`** — Change `max-w-lg` → `max-w-2xl`
3. **`src/components/landing/DeviceFrames.tsx`** — PhoneFrame `max-w-[280px]` → `max-w-[320px]`

## What does NOT change
- All section copy, layout structure, section order, spacing
- Device frame styling (BrowserFrame, GradientStage appearances)
- HowItWorks text, badges, icons
- Features, Problem, WhyOrdra, Pricing, Testimonials sections
- Button styles, fonts, animations outside SVGs

