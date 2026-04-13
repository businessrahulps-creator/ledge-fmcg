

# Animation & Micro-Interaction Overhaul — Complete Audit + Plan

## Part 1: Audit of Existing Animations

### A. Framer Motion Usage (17 files)

| Location | Current Motion | Issue |
|----------|---------------|-------|
| **AppLayout** — bottom nav pill | `layoutId="nav-pill"` with tween 0.25s | Good pattern but uses `type: "tween"` — should be spring for physicality |
| **AppLayout** — offline banner | `duration: 0.2` height/opacity | Too abrupt, no spring |
| **AppLayout** — More sheet items | `duration: 0.2, delay: i * 0.03` | Stagger too fast to perceive, linear feel |
| **Dashboard** — monthly summary | `duration: 0.25, ease: "easeOut"`, y:12 | Generic CSS easing, not physics-based |
| **Dashboard** — KPI cards | `delay: i * 0.06, type: "tween", duration: 0.25` | Stagger too tight (0.06s), tween feels flat |
| **Dashboard** — progress bars | `duration: 0.8, delay: 0.3 + i * 0.15` | Duration too long for a bar fill, no spring |
| **Dashboard** — mobile order cards | `delay: i * 0.05, duration: 0.2` | Fine but inconsistent with KPI stagger |
| **NewOrder** — order lines | `duration: 0.2`, exit `height:0` | Exit animation has no spring, feels abrupt |
| **Stock** — warehouse cards | `delay: i * 0.05, duration: 0.3` | Inconsistent timing vs Dashboard cards |
| **Stock** — inventory expand | `duration: 0.3` height/opacity | Should be spring for natural expand |
| **Distributors/Salespersons** — card grids | `motion` imported but used minimally | Inconsistent — some pages animate, some don't |
| **Billing** — invoice list | `duration` unspecified (defaults) | Inconsistent with rest of app |
| **Settings/Company** — tab content | `opacity: 0, y: 12` → animate | Same generic pattern everywhere |
| **NotificationCenter** — badge | `scale: 0` → `scale: 1` | No spring — pops in linearly |
| **InstallPrompt** — bottom sheet | `spring, damping: 25, stiffness: 300` | **Only place using proper springs** — good |
| **SetupChecklist** — onboarding | `duration: 0.4, ease: "easeOut"` | Generic, not spring |
| **Landing Hero** — fadeUp | `duration: 0.5, ease: "easeOut"` | Slow and generic |
| **AboutUs** — sections | `delay: i * 0.1, duration: 0.5` | Too slow, decorative stagger |
| **AnimateIn** — landing scroll | `duration: 0.5, delay, ease: "easeOut"` | Fine for scroll-triggered |

### B. CSS Animations (tailwind.config.ts)

| Animation | Issue |
|-----------|-------|
| `accordion-down/up` | 0.2s ease-out — adequate |
| `count-up` | 0.4s ease-out — fine |
| `slide-in` | 0.3s ease-out — generic |
| `fade-in` | 0.2s ease-out — adequate |
| `stagger-fade` | 0.35s cubic-bezier — decent |
| `marquee` | 30s linear — fine |

### C. CSS Utility Animations (index.css)

| Utility | Issue |
|---------|-------|
| `.glass-card` | `transition-all duration-200` — animating ALL properties is expensive |
| `.row-hover` | `transition-all duration-200` — same issue |
| `.card-hover` | `active:scale-[0.98]` — good pattern but CSS, not spring-based |

### D. Missing Animations

- **No page transitions** — content just appears
- **No skeleton → content crossfade** — skeleton disappears, content pops
- **No modal enter/exit spring** — using Radix defaults (CSS only)
- **No toast entrance spring** — Sonner defaults
- **Button press feedback** — only `active:scale-[0.98]` on `.card-hover`, nothing on regular buttons
- **No list item stagger on initial load** for Orders, Distributors tables

---

## Part 2: New Animation System

### Design Principles
1. **One spring to rule them all**: `{ type: "spring", damping: 26, stiffness: 200 }` — responsive, no overshoot, feels like Apple
2. **Quick spring for micro-interactions**: `{ type: "spring", damping: 20, stiffness: 300 }` — snappy taps, badges
3. **GPU-only properties**: Only animate `transform` (x, y, scale) and `opacity`. Never `height` directly — use `scaleY` or max-height with overflow.
4. **Consistent stagger**: 40ms between items (perceivable but fast)
5. **No decorative motion**: Remove slow fadeUp on landing if not scroll-triggered

### Spring Presets (new file: `src/lib/motion.ts`)

```text
spring.default  → { type: "spring", damping: 26, stiffness: 200 }
spring.snappy   → { type: "spring", damping: 20, stiffness: 300 }
spring.gentle   → { type: "spring", damping: 30, stiffness: 150 }
spring.bounce   → { type: "spring", damping: 15, stiffness: 200 }

stagger.default → 0.04  (40ms)
stagger.slow    → 0.06  (60ms)

fadeUp          → { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }
fadeIn          → { initial: { opacity: 0 }, animate: { opacity: 1 } }
scaleIn         → { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 } }
```

---

## Part 3: Implementation Plan (6 Passes)

### Pass 1: Create motion presets + fix CSS utilities
- **New file**: `src/lib/motion.ts` — spring presets, animation variants, stagger helper
- **Edit**: `src/index.css` — change `.glass-card`, `.row-hover`, `.card-hover` from `transition-all` to `transition-[transform,opacity,box-shadow,border-color]` for GPU efficiency
- **Edit**: `tailwind.config.ts` — no changes needed (CSS keyframes are fine as-is)

### Pass 2: AppLayout — nav pill + offline banner + More sheet
- **AppLayout**: Change nav pill from tween to `spring.snappy`, offline banner to `spring.default`, More sheet items stagger to 0.04s with `spring.default`
- Ensure `active:scale-90` on nav items is smooth

### Pass 3: Dashboard — KPIs, progress bars, order cards
- KPI cards: `spring.default` with 0.04s stagger, y:8 (not 20)
- Progress bars: `spring.gentle` with 0.06s stagger (not 0.8s duration)
- Monthly summary card: `spring.default`
- Mobile order cards: `spring.default` with 0.04s stagger
- Notification badge: `spring.bounce` for scale entrance

### Pass 4: CRUD pages — NewOrder, Stock, Distributors, Salespersons, Billing
- Order line items: `spring.snappy` for add/remove, AnimatePresence exit with opacity+scale (not height)
- Stock warehouse cards: `spring.default` with 0.04s stagger
- Stock inventory expand: `spring.default` for opacity+scaleY
- Distributors/Salespersons cards: Add consistent `spring.default` stagger
- Billing invoice list: Match Dashboard card pattern
- Settings/Company tab content: `spring.default` fadeUp

### Pass 5: Overlays — onboarding, install prompt, notification center
- SetupChecklist: `spring.default` for container, `spring.snappy` for celebration
- InstallPrompt: Already good (keep existing spring)
- NotificationCenter badge: `spring.bounce`

### Pass 6: Landing + About pages
- Hero fadeUp: Reduce to `spring.default`, y:12 (from y:20 + 0.5s)
- AboutUs sections: `spring.default` with 0.05s stagger
- AnimateIn: Keep scroll-triggered pattern but switch to spring

### Files Changed (all edits, no new features)
- `src/lib/motion.ts` — **NEW** (~40 lines)
- `src/index.css` — fix `transition-all` → specific properties
- `src/components/layout/AppLayout.tsx` — spring transitions
- `src/components/layout/NotificationCenter.tsx` — badge spring
- `src/pages/Dashboard.tsx` — consistent springs + stagger
- `src/pages/NewOrder.tsx` — order line springs
- `src/pages/Stock.tsx` — warehouse + inventory springs
- `src/pages/Distributors.tsx` — card stagger
- `src/pages/Salespersons.tsx` — card stagger
- `src/pages/Billing.tsx` — list spring
- `src/pages/Settings.tsx` — tab content spring
- `src/pages/Company.tsx` — content spring
- `src/components/onboarding/SetupChecklist.tsx` — springs
- `src/components/InstallPrompt.tsx` — no change (already good)
- `src/components/landing/sections/Hero.tsx` — spring transitions
- `src/components/landing/AnimateIn.tsx` — spring transition
- `src/pages/AboutUs.tsx` — spring transitions

### What This Does NOT Change
- No new features, components, or routes
- No changes to data flow, types, or API calls
- All existing classNames preserved
- No changes to Sonner toast config (already good)
- No page transition system (would require router changes — out of scope for polish pass)

