## Goal
Lift the landing-page device mockups (Hero dashboard, How-It-Works phone + browser screens) from "Figma wireframe" feel to "real SaaS product" feel — in **one surgical pass**.

## Scope
Three files only. No new dependencies. No layout changes.
- `src/components/landing/illustrations/SvgIllustrations.tsx` — replace inner SVG bodies
- `src/components/landing/DeviceFrames.tsx` — minor frame polish
- `src/index.css` — ~15 lines of new keyframes/utilities

## Changes

### 1. `SvgIllustrations.tsx` — four mockups, real product feel

**`DashboardSvg`** (Hero)
- Replace 4 gray KPI bars with real values + delta chips: `₹12.4L +12% ↑`, `347 orders`, `289 dispatch`, `94% delivery`
- "This Week" gray bars → 7 animated bars (scaleY 0→1, 60ms stagger), Mon–Sun, with `Today` bar in indigo `#4F46E5` and others in `#E5E7EB`
- Recent Orders rows: real rupee values (`₹48,200`, `₹32,100` …), status pills with semantic color tokens
- Selected-row state on `#ORD-247`: 2px indigo left border + `bg-indigo-50/40`
- Add a `Live` dot (emerald) with 2s heartbeat in the Recent Orders header
- Add a one-shot scanline shimmer that sweeps top→bottom in 1.5s on view

**`OrderFormSvg`** (Phone — Step 01)
- Fill empty qty boxes with real numbers: `12`, `6`, `24`, `8`
- 4px category dot before each product name (warm palette: amber, blue, emerald, rose)
- "Place Order" button gets a subtle 2s pulse on view (`box-shadow` breathing)
- Subtotal value lives, scheme chip "Diwali 5+1" gets the indigo accent border

**`DashboardMiniSvg`** (Browser — Step 02)
- Replace the gray amount bars in the Recent Orders table with real rupee numerals (`₹48,200`, `₹32,100`, `₹19,800`, `₹56,400`, `₹14,250`)
- Status pills → semantic colors (Delivered = emerald, Pending = amber, Dispatched = indigo)
- Add a sparkline above the KPI row (animated `stroke-dashoffset` draw, 1.4s, indigo gradient stroke)
- `Live` dot on the Recent Orders header gets the same heartbeat pulse

**`InvoiceStockSvg`** (Browser — Step 03)
- Zebra-stripe alt rows (`#FAFAFB`)
- Highlight Total row with a soft indigo left bar + slightly bolder weight
- Download PDF button gets a one-shot shimmer sweep on view (1.5s)
- Add a tiny "Auto-generated" eyebrow above `INV-2026-0184` with a checkmark dot

### 2. `DeviceFrames.tsx` — depth polish

- `BrowserFrame`: bump shadow from `0 20px 60px -12px rgba(0,0,0,0.08)` to `0 30px 80px -16px rgba(15,23,42,0.10)` (warmer, deeper)
- `BrowserFrame`: add 1px inner top highlight `box-shadow: inset 0 1px 0 rgba(255,255,255,0.7)` for glass-edge feel
- `PhoneFrame`: replace `linear-gradient(145deg, #1A1A1A, #27272A)` with `linear-gradient(160deg, #18181B 0%, #27272A 50%, #2A2A2E 100%)` (ceramic Apple-device feel)
- `PhoneFrame`: same 1px inner highlight at top bezel edge
- `PhoneFrame`: deeper shadow `0 35px 80px -10px rgba(15,23,42,0.14)`

### 3. `src/index.css` — add ~15 lines

```css
@keyframes lp-shimmer-sweep {
  0% { transform: translateY(-100%); opacity: 0; }
  20%, 60% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes lp-live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
@keyframes lp-btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); }
  50% { box-shadow: 0 0 0 6px rgba(79,70,229,0.08); }
}
.lp-shimmer-sweep { animation: lp-shimmer-sweep 1.5s ease-out 0.4s 1 forwards; }
.lp-live-dot-pulse { animation: lp-live-pulse 2s ease-in-out infinite; }
.lp-btn-breathe { animation: lp-btn-pulse 2.4s ease-in-out infinite; animation-delay: 1s; }
.lp-row-selected { background: rgba(79,70,229,0.04); border-left: 2px solid #4F46E5; }
.lp-status-delivered { background: #ECFDF5; color: #047857; border: 1px solid #D1FAE5; }
.lp-status-pending { background: #FFFBEB; color: #B45309; border: 1px solid #FEF3C7; }
.lp-status-dispatched { background: #EEF2FF; color: #4338CA; border: 1px solid #E0E7FF; }
```

### 4. Animation triggering
- All SVGs already render inside `AnimateIn` / `motion.div` parents that fire on view — animations use pure CSS keyframes triggered by class presence, so they fire once the parent enters the viewport. No new Framer Motion logic needed.

## What we are intentionally NOT doing
- No real product screenshots (clashes with hand-crafted aesthetic)
- No new SVG illustrations from scratch
- No Lottie / new dependencies
- No 3D hover tilt (Hero already has rotateY/rotateX)
- No layout changes to Hero or HowItWorks sections

## Expected outcome
- 6/10 → 9/10 visual quality
- Mockups now read as "live product" instead of "wireframe"
- Hero dashboard clearly leads the visual hierarchy; Steps 01–03 support it
- Zero risk of regression: all changes are inside SVG bodies + frame chrome polish + additive CSS

## Files touched (3)
1. `src/components/landing/illustrations/SvgIllustrations.tsx` — replace 4 SVG bodies
2. `src/components/landing/DeviceFrames.tsx` — shadow + bezel polish
3. `src/index.css` — additive keyframes + utility classes