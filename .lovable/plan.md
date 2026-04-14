

# Fix Overflow, Sparklines & Icon Colors

## Issues identified

1. **#ORD-243 row overflows** in `DashboardSvg`: Container bottom is at y=348 (y=244 + height=104). The 5th row renders at y=348, right at the edge — text baseline sits outside. Fix: remove the 5th order row (keep 4 rows).

2. **Sparklines look artificial**: All 4 KPI sparklines trend upward — feels fake and distracting. Fix: remove sparklines entirely from `DashboardSvg`. The KPI cards look cleaner without them.

3. **Icon colors mismatch**: Icons across Problem, WhyOrdra, Features, Pricing, and HowItWorks badges all use teal `#0D9488` with `bg-[#F0FDFA]`. The button color is charcoal `#27272A`. Fix: change all icon colors to `text-[#27272A]` and their circle backgrounds to `bg-[#F4F4F5]` (light neutral gray).

## Files modified (5)

1. **`src/components/landing/illustrations/SvgIllustrations.tsx`**
   - Remove `#ORD-243` (5th entry) from the `orders` array in `DashboardSvg`
   - Remove all 4 sparkline `<motion.path>` elements and the `sparklines` array

2. **`src/components/landing/sections/HowItWorks.tsx`**
   - Badge: `bg-[#F0FDFA] text-[#0D9488]` → `bg-[#F4F4F5] text-[#27272A]`

3. **`src/components/landing/sections/Problem.tsx`**
   - Icon circle: `bg-[#F0FDFA]` → `bg-[#F4F4F5]`, icon: `text-[#0D9488]` → `text-[#27272A]`

4. **`src/components/landing/sections/WhyOrdra.tsx`**
   - Same icon color swap

5. **`src/components/landing/sections/Features.tsx`**
   - Same icon color swap

6. **`src/components/landing/sections/Pricing.tsx`**
   - Same icon color swap

## What does NOT change
- All text, copy, layout, spacing, section order
- SVG structure for OrderFormSvg, DashboardMiniSvg, InvoiceStockSvg
- Device frames, animations, GradientStage

