

# Enterprise Visual Overhaul — From Startup Blue to Billion-Dollar B2B

## Core Problem

The current `--primary: 217 78% 51%` (#2563EB) is Stripe/Vercel-grade consumer blue. Enterprise B2B products like Dynamics 365, Power BI, SAP, and Salesforce use deeply muted, desaturated accent tones. The background tokens were improved but cards still feel flat. The overall depth system needs one more calibration pass.

## Token Changes (index.css only — single file, surgical)

### Primary Accent: Consumer Blue → Corporate Indigo
| Token | Current | New | Hex Approx |
|-------|---------|-----|------------|
| `--primary` (light) | `217 78% 51%` | `222 47% 42%` | `#3B5998` → muted navy-indigo |
| `--ring` (light) | `217 78% 51%` | `222 47% 42%` | Match primary |
| `--primary` (dark) | `217 91% 60%` | `222 60% 58%` | Slightly brighter for dark contrast |
| `--ring` (dark) | `217 91% 60%` | `222 60% 58%` | Match |
| `--accent` (dark) | `217 91% 60%` | `222 60% 58%` | Match |
| `--sidebar-primary` (dark) | `217 91% 60%` | `222 60% 58%` | Match |
| `--sidebar-ring` (dark) | `217 91% 60%` | `222 60% 58%` | Match |

### Background & Surface Depth
| Token | Current | New | Why |
|-------|---------|-----|-----|
| `--background` | `220 14% 96%` | `220 16% 94%` | Slightly darker bg creates more card contrast |
| `--card` | `0 0% 100%` | `0 0% 99.5%` | Barely warm white — not sterile |
| `--foreground` | `0 0% 11%` | `222 20% 14%` | Warmer, richer black with slight navy tint |
| `--card-foreground` | `0 0% 11%` | `222 20% 14%` | Match |
| `--muted-foreground` | `0 0% 44%` | `220 10% 44%` | Tinted gray text |

### Glass Card Elevation
Current shadow is good but the border opacity is still too thin. Bump `border-border/60` to `border-border/50` and add a 1px inset highlight for depth:
```
.glass-card {
  shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]
}
```

### Progress Bars (Dashboard)
Current `bg-primary/50` is too vivid with the new muted primary. Change to `bg-primary/40` for a quieter feel.

## Files Changed

| File | What |
|------|------|
| `src/index.css` | ~14 token value changes + glass-card shadow refinement |
| `src/pages/Dashboard.tsx` | Progress bar opacity `bg-primary/50` → `bg-primary/40` |

**2 files. No behaviour changes. No new dependencies. No dark mode regressions (dark tokens explicitly updated). Pure palette and depth elevation.**

## What This Achieves

- Primary accent shifts from consumer Stripe-blue to a sophisticated navy-indigo that reads "enterprise"
- Background gets slightly more depth so cards float properly
- Foreground text gets a warmer, richer tone instead of flat black
- Glass cards gain an inset highlight creating real material depth
- Overall feel moves from "indie SaaS" to "Dynamics 365 / Power BI" territory

