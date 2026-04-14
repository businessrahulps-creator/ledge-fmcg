

# Status + Infrastructure Badge in Footer Grid (4th Column)

## Concept

Place the animated status badge and AWS infrastructure line as the **4th column** in the existing `grid-cols-2 md:grid-cols-4` grid — right next to the Legal column. This fills the empty space naturally without adding a new row.

## Layout

```text
Product       Company       Legal              Status
─────────     ─────────     ──────────────     ─────────────────────
Features      About Us      Privacy Policy     ● All systems operational
Pricing       Contact       Terms of Service   ☁ AWS · Asia Pacific (Mumbai)
                            Refund Policy
```

## What gets built

**`src/components/landing/sections/Footer.tsx`** — single file change:

- Add a 4th `<div>` inside the grid after the `columns.map()` loop
- **Status badge**: A pill with a pulsing green dot (`animate-pulse`), text "All systems operational", and a shimmer border effect (CSS `@keyframes` via inline style or Tailwind arbitrary `animate-[shimmer_3s_linear_infinite]`)
- **AWS line**: Below the pill, muted text "Hosted on AWS · Asia Pacific (Mumbai)" with an inline monochrome AWS SVG logo (~20px wide)
- Framer Motion `motion.div` with `initial={{ opacity: 0, y: 8 }}` / `whileInView={{ opacity: 1, y: 0 }}` for entrance

**`tailwind.config.ts`** — add `shimmer` keyframe for the gradient border sweep animation

## What does NOT change
- The 3 existing link columns (Product, Company, Legal)
- Copyright bar, social icons
- No new dependencies

