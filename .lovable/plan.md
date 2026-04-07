

# Elevate Product Mockups to Apple/Stripe Quality

## The Problem

The current mockups (Hero dashboard, HowItWorks order/dashboard/stock) are flat HTML wireframes sitting on white backgrounds. They look like quick prototypes — tiny text, no atmosphere, no depth. Stripe wraps their product in rich gradient environments with perspective, glow, and device frames. Apple floats UI in dramatic lighting. We have none of that.

## The Strategy

We won't replace the mockups with images — we'll wrap them in **cinematic presentation layers**. The mockup content stays (it's accurate to the product), but every mockup gets:

1. **An ambient stage** — a gradient backdrop panel with subtle noise/glow behind each mockup
2. **A proper device frame** — macOS browser chrome (Hero) or phone bezel (HowItWorks Step 1), with realistic proportions
3. **Depth and atmosphere** — layered shadows, subtle border glow, perspective transforms
4. **Polish details** — refined spacing, better font sizing inside mockups, status indicator dots

## What Changes Per Section

### Hero — `DashboardMockup` in Hero.tsx
- Add a **rich gradient stage** behind the browser frame — a soft purple-to-indigo mesh that makes the mockup float, not just sit on white
- Enlarge the mockup slightly and improve internal spacing
- Add a subtle **outer glow ring** (box-shadow with indigo tint) for depth
- Refine the perspective transform to feel more natural (currently `rotateY(-4deg)` — add subtle `rotateX(2deg)` for a looking-down-at-desk feel)
- Add faint **floating accent dots or grid lines** behind the mockup for visual texture

### HowItWorks Step 1 — `OrderMockup`
- Wrap in a **phone device frame** — rounded corners, notch silhouette at top, home indicator bar at bottom
- Place on a soft gradient backdrop card (lavender-to-white)
- Add layered shadow (close tight shadow + far ambient shadow)

### HowItWorks Step 2 — `DashboardMiniMockup`
- Wrap in a **browser window frame** (same chrome as Hero but smaller)
- Place on gradient backdrop
- Add the same layered shadow treatment

### HowItWorks Step 3 — `StockMockup`
- Wrap in browser window frame
- Place on gradient backdrop
- Add depth shadows

### Shared: New `DeviceFrame` components
Create reusable wrapper components:
- `BrowserFrame` — macOS-style chrome with traffic lights, URL bar, rounded corners
- `PhoneFrame` — mobile device silhouette with notch and home bar
- `GradientStage` — ambient backdrop with configurable gradient colors, optional grid/dot pattern

## Files to Change

| File | What |
|------|------|
| `src/components/landing/DeviceFrames.tsx` | **New** — `BrowserFrame`, `PhoneFrame`, `GradientStage` reusable components |
| `src/components/landing/sections/Hero.tsx` | Wrap `DashboardMockup` in `GradientStage`; refine perspective; add glow shadow; improve internal mockup spacing |
| `src/components/landing/sections/HowItWorks.tsx` | Wrap `OrderMockup` in `PhoneFrame` + `GradientStage`; wrap `DashboardMiniMockup` and `StockMockup` in `BrowserFrame` + `GradientStage` |

## What Stays the Same

- All mockup data and content (dealer names, KPIs, product rows)
- All text copy and section structure
- Animation system (AnimateIn, framer-motion)
- Color palette and typography
- Mobile responsiveness

## Visual Result

Each product mockup will feel like a **product shot in a photoshoot** — floating on a rich gradient stage with realistic device chrome, layered shadows, and subtle atmospheric details. The landing page will go from "wireframes on a white page" to "this is what the product actually looks like, presented beautifully."

