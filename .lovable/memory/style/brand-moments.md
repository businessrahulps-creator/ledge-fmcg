---
name: Brand moments
description: The 4 designated places where Ledge Gradient Purple/Coral may appear in-app
type: constraint
---
The Ledge brand gradient (Purple #7C3AED → Coral #FF8A3D) and Gradient Purple solo are RATIONED to exactly 4 surfaces:

1. SplashScreen — soft gradient halo behind the wordmark
2. EmptyState (src/components/ui/empty-state.tsx) — soft gradient halo behind the icon
3. Order saved celebration (src/pages/NewOrder.tsx) — confetti palette on first-ever order
4. AppSidebar — gradient L mark inside the official Ledge logo lockup (image asset, not CSS text gradient)

**Never** apply Purple/Coral/brand-gradient to: buttons, links, badges, table rows, sidebar background, card backgrounds, hover states, charts, PDFs, status pills.

**Why:** Rationing keeps brand energy premium. If brand colors appear everywhere, they stop feeling like Ledge moments and the data-dense ops UI becomes loud and fatiguing.

**How to apply:** Use the `.brand-gradient-text`, `.brand-gradient-bg`, `.brand-gradient-soft-bg` utilities defined in src/index.css, or the `--brand-purple` / `--brand-coral` / `--brand-gradient` CSS variables. The sidebar header uses `src/assets/ledge-logo.png` (full lockup) and `src/assets/ledge-mark.png` (collapsed). Never hardcode the hex values.
