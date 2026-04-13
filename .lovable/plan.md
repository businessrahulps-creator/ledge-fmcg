

# Visual Design Refresh — Cursor-Style Premium Aesthetic

## Design System Changes

### Color Palette
- Page background: warm off-white `#F8F7F5` (replacing white/indigo gradients)
- Card fill: `#FFFFFF` with very subtle border `#E8E5E0`
- Headings: `#1A1A1A` (deep charcoal, replacing `text-midnight`)
- Body text: `#52525B` (slate-600)
- Muted text: `#71717A` (slate-500)
- Primary accent: `#0D9488` (deep teal, replacing indigo-600) — used sparingly for CTAs and badges only
- Section alternation: `#F8F7F5` and `#FFFFFF` (no more indigo/violet washes)

### Typography
- Headlines stay Plus Jakarta Sans but tighter tracking `[-0.04em]` and slightly larger scale
- Body stays Inter, generous `leading-[1.75]`

### Cards
- `rounded-3xl` (up from 2xl)
- Shadow: `shadow-[0_1px_2px_rgba(0,0,0,0.04)]` (nearly invisible)
- Border: `border-[#E8E5E0]` (warm neutral, not indigo)
- No colored borders, no indigo tints

### Buttons
- Primary: `bg-[#0D9488] text-white rounded-2xl` with `hover:bg-[#0F766E] hover:scale-[1.01]`
- Secondary: `border border-[#D4D1CC] text-[#1A1A1A] rounded-2xl`
- Larger padding: `px-7 py-3`

### Spacing
- All sections: `py-20 md:py-28` (more generous)
- Card grid gaps: `gap-8`

## Files to Modify (visual-only, no text/structure changes)

### 1. `src/components/landing/sections/Navbar.tsx`
- Scrolled bg: `bg-[#F8F7F5]/95` with warm border
- CTA: teal rounded-2xl button
- Link hover: `hover:text-[#1A1A1A]`

### 2. `src/components/landing/sections/Hero.tsx`
- Background: solid `#F8F7F5` (remove radial gradient)
- Text colors: `#1A1A1A` heading, `#52525B` body
- CTAs: teal primary, warm neutral secondary
- Social proof: `#71717A`
- Dashboard mockup: replace indigo accents with teal; warm neutral borders

### 3. `src/components/landing/DeviceFrames.tsx`
- BrowserFrame: `border-[#E8E5E0]`, warm shadow, title bar `bg-[#F8F7F5]`
- PhoneFrame: darker neutral bezel `#1A1A1A` to `#27272A`
- GradientStage: soften to warm neutral ambient (remove indigo/violet radials, use subtle warm cream gradients)

### 4. `src/components/landing/sections/TrustBar.tsx`
- Section bg: `bg-[#F8F7F5]` (no indigo wash)
- Marquee text: `#C4C4C4` stays (already muted)
- Pull quote card: `bg-white border-[#E8E5E0]` (no violet wash)
- Quote mark: `text-[#D4D1CC]` (neutral, not indigo)

### 5. `src/components/landing/sections/Problem.tsx`
- Section bg: `bg-[#F8F7F5]`
- Cards: `rounded-3xl border-[#E8E5E0]` bg-white, no icon rendering (remove `<card.icon>` JSX but keep icon in data array for structure)
- Border-left on sticky headline removed or changed to `border-[#0D9488]` thin accent

### 6. `src/components/landing/sections/HowItWorks.tsx`
- Section bg: `bg-white`
- Step badge: `bg-[#F0FDFA] text-[#0D9488]` (teal tint, not purple)
- Text colors updated to new palette

### 7. `src/components/landing/sections/Features.tsx`
- Section bg: `bg-[#F8F7F5]`
- Cards: `rounded-3xl border-[#E8E5E0]`, remove icon rendering (no `<feature.icon>`)
- Hover: `hover:border-[#D4D1CC]` only (no translate)

### 8. `src/components/landing/sections/WhyOrdra.tsx`
- Section bg: `bg-white`
- Border-left: `border-[#0D9488]` (teal accent)
- Text colors updated

### 9. `src/components/landing/sections/Testimonials.tsx`
- Section bg: `bg-[#F8F7F5]`
- Cards: `rounded-3xl border-[#E8E5E0]`
- Quote mark: `text-[#D4D1CC]` (neutral)
- Divider: `border-[#E8E5E0]`

### 10. `src/components/landing/sections/Pricing.tsx`
- Section bg: `bg-white`
- Cards: `rounded-3xl border-[#E8E5E0]`
- Highlighted card: `border-2 border-[#0D9488]` with subtle teal shadow
- "Most Popular" badge: `bg-[#0D9488] text-white`
- Check icons: `text-[#0D9488]` (teal, not emerald)
- CTA buttons: teal primary for highlighted, warm neutral secondary for others

### 11. `src/components/landing/sections/FinalCTA.tsx`
- Background: `bg-[#F8F7F5]` (no gradient)
- CTA: teal rounded-2xl
- Text colors updated

### 12. `src/components/landing/sections/Footer.tsx`
- Background: `bg-[#F8F7F5]`
- Border: `border-[#E8E5E0]`
- Text colors updated

## What does NOT change
- All text content verbatim
- Component structure, section order, card counts
- All Framer Motion animations and AnimateIn usage
- Responsive behavior (grid breakpoints, mobile sheet menu)
- All Links, hrefs, and routing
- All mockup data (KPIs, orders, products)

