

# Visual Design Refresh — Uniform Cards, Icons, Symmetry

## What changes

### 1. Spacing increase (all section files)
- Section padding: `py-20 md:py-28` → `py-24 md:py-32`
- Section heading margin-bottom: `mb-16` → `mb-20`

### 2. Problem section → 2x2 symmetric grid (`Problem.tsx`)
- Change from 4+8 column sticky layout to centered headline + 2x2 card grid
- Add Lucide icons rendered at top of each card (thin-line, `strokeWidth={1.5}`, size 24, `text-[#0D9488]`)
- Icons: `MessageCircle`, `Table`, `Compass`, `Laptop` (already imported)
- All 4 cards: equal height via `h-full` on grid items + `flex flex-col` on card

### 3. Features section — add icons + equal height (`Features.tsx`)
- Render `<feature.icon>` at top of each card (same thin-line style)
- Icons already in data array: `BarChart3`, `ClipboardCheck`, `Users`, `Package`, `IndianRupee`, `CloudOff`
- Cards: add `h-full flex flex-col`, description gets `flex-1`

### 4. Why Ledge → 2x2 card grid with icons (`WhyOrdra.tsx`)
- Replace border-left list layout with 2x2 card grid (matching testimonials)
- Add icons: `Smartphone`, `WifiOff`, `Shield`, `FileText` from lucide-react
- Cards: `bg-white rounded-3xl p-8 border border-[#E8E5E0]` with icon at top
- Equal height: `h-full flex flex-col`

### 5. Pricing — add icons to tiers (`Pricing.tsx`)
- Add icons per tier: `Gift` (Free), `TrendingUp` (Growth), `Layers` (Scale), `Building2` (Enterprise)
- Render above plan name, thin-line `strokeWidth={1.5}` size 24

### 6. How It Works — add icons to step badges (`HowItWorks.tsx`)
- Add icons: `Smartphone` (step 1), `LayoutDashboard` (step 2), `Truck` (step 3)
- Render icon next to badge number

### 7. Testimonials — already symmetric ✓
- Only spacing increase needed

### 8. Hero, TrustBar, Navbar, FinalCTA, Footer, DeviceFrames
- Only spacing increase (py-24/py-32)
- No structural changes

## Files modified

| File | Changes |
|------|---------|
| `Problem.tsx` | 2x2 grid layout, render icons, equal-height cards |
| `Features.tsx` | Render icons, equal-height cards |
| `WhyOrdra.tsx` | 2x2 card grid with icons (replacing border-left blocks) |
| `Pricing.tsx` | Add tier icons |
| `HowItWorks.tsx` | Add step icons |
| `Hero.tsx` | Spacing increase |
| `TrustBar.tsx` | Spacing increase |
| `Testimonials.tsx` | Spacing increase |
| `FinalCTA.tsx` | Spacing increase |
| `Footer.tsx` | No change |
| `Navbar.tsx` | No change |

## What does NOT change
- All text/copy verbatim
- Component structure, section order, card counts
- All Framer Motion animations
- Color palette (#F8F7F5, #1A1A1A, #0D9488, etc.)
- Responsive breakpoints
- Mockup content and device frames
- All Links, hrefs, routing

