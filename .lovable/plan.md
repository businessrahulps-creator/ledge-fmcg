

# Visual & Color Palette Refinement — Premium Enterprise Pass

## Design Audit

**Current Ledge (screenshot 4):**
- Primary is a saturated indigo/blue (`hsl(245, 75%, 52%)`) — reads "techy startup", not "enterprise calm"
- Background `hsl(220, 14%, 95%)` is cool-toned gray — feels sterile
- Cards are pure white `hsl(0, 0%, 100%)` against gray bg — high contrast creates visual noise
- Sparkline and progress bars use that same saturated blue — too loud
- Day-of-week pills use the bright blue fill — draws too much attention
- Overall: clean but reads as "SaaS template" rather than "premium enterprise tool"

**Target (Cursor screenshots 1-3):**
- Background is warm cream/stone (`#F5F3EF` range) — feels expensive, calm
- Cards sit on slightly lighter warm white — subtle depth without harshness
- Accent is a single muted teal/emerald stroke — confident but quiet
- Typography is large, heavy, high-contrast black on cream — authoritative
- Borders are barely visible warm grays — not cool/blue grays
- Status/badge colors are desaturated — nothing screams
- Overall: calm, warm, expensive, enterprise-grade

## Proposed Refined Palette

### Light Mode Token Changes (`src/index.css :root`)

| Token | Current | New | Rationale |
|-------|---------|-----|-----------|
| `--background` | `220 14% 95%` (cool gray) | `40 20% 95%` (warm stone) | Warm base like Cursor |
| `--foreground` | `222 20% 14%` | `30 10% 12%` (warmer near-black) | Softer contrast |
| `--card` | `0 0% 100%` (pure white) | `40 25% 99%` (warm white) | Cards feel organic |
| `--primary` | `245 75% 52%` (bright indigo) | `160 45% 40%` (muted teal) | Calm enterprise accent |
| `--primary-foreground` | unchanged | unchanged | |
| `--muted` | `220 14% 93%` | `35 15% 91%` (warm muted) | Consistent warmth |
| `--muted-foreground` | `220 10% 40%` | `30 8% 45%` | Slightly softer |
| `--border` | `220 9% 84%` | `35 10% 87%` | Warmer, subtler borders |
| `--ring` | `245 75% 52%` | `160 45% 40%` | Match new primary |
| `--secondary` | `220 14% 95%` | `35 15% 93%` | Warm secondary |
| `--accent` | `220 14% 95%` | `35 15% 93%` | Warm accent surface |
| `--sidebar-*` | cool tones | warm equivalents | Consistent warmth |
| `--surface` | `0 0% 100%` | `40 25% 99%` | Match card |

### Dark Mode — equivalent adjustments to warm the neutrals and use teal primary.

### Utility Class Adjustments (`src/index.css`)
- `.glass-card` — reduce shadow intensity slightly for a flatter, more premium feel
- `.status-*` badges — desaturate slightly to match the calmer palette

### Component File Changes

| File | What Changes |
|------|-------------|
| `src/index.css` | All CSS custom properties (light + dark), `.glass-card` shadow refinement |
| `tailwind.config.ts` | No structural changes — tokens flow through CSS vars |
| `src/components/ui/button.tsx` | No changes — inherits from `--primary` |
| `src/components/ui/status-badge.tsx` | Slightly desaturate badge backgrounds for premium feel |
| `src/pages/Dashboard.tsx` | Adjust sparkline opacity and progress bar classes to use new teal tones |
| `src/components/layout/AppSidebar.tsx` | Active indicator color flows from `--primary` (auto) |
| `src/components/layout/AppLayout.tsx` | Bottom nav pill backdrop — ensure warm tones |

### What Does NOT Change
- All component structure, props, and data flow
- All existing classNames (they reference semantic tokens which we're redefining)
- Any feature behavior, routing, or state management
- Mobile responsiveness patterns
- Dark mode structure (just token values)

### Implementation Order (3 safe passes)
1. **Pass 1**: `src/index.css` — redefine all CSS custom properties (light + dark mode)
2. **Pass 2**: `src/index.css` utilities + `status-badge.tsx` — desaturate glass-card shadows and status badges
3. **Pass 3**: `Dashboard.tsx` sparkline/progress bar class tweaks + verify sidebar/nav inherit correctly

Each pass is independently reversible by restoring the previous token values.

