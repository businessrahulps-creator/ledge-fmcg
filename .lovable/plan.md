

# Visual Refinement Plan — From Faded/Washed-Out to Premium Crisp

## Root Cause Analysis

Comparing the current Ledge screenshot against the Dub reference reveals one core problem: **the background is too dark/gray** (`220 16% 94%` ≈ `#EDEFF3`), which makes the entire UI feel washed-out and muddy. The Dub reference uses a near-white background (`~#FAFAFA`) with pure white cards, creating crisp separation through clean borders rather than background contrast. The current `inset_0_1px_0_rgba(255,255,255,0.6)` highlight on glass cards adds to the washed-out feel.

## Token Changes (src/index.css only)

| Token | Current | New | Why |
|-------|---------|-----|-----|
| `--background` | `220 16% 94%` | `220 14% 97%` | Lighter bg like Dub (#F5F6F8 → #F7F8FA) — crisp, not gray |
| `--card` | `0 0% 99.5%` | `0 0% 100%` | Pure white cards — clean separation against bg |
| `--muted-foreground` | `220 10% 44%` | `220 10% 40%` | Slightly darker secondary text for readability |
| `--border` | `220 9% 89%` | `220 9% 87%` | Slightly more visible borders like Dub |
| `--input` | `220 9% 89%` | `220 9% 87%` | Match border |
| `--sidebar-background` | `220 20% 98%` | `0 0% 100%` | Pure white sidebar like Dub |
| `--sidebar-border` | `220 9% 90%` | `220 9% 87%` | Match border |

## Glass Card Shadow Refinement (src/index.css)

Remove the inset white highlight (adds to washed-out feel). Use a clean, crisp shadow system like Dub:

```
shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.04)]
```

No `inset` highlight. The border `rgba(0,0,0,0.05)` ring is slightly stronger for definition.

## Card Hover Shadow

Slightly stronger hover for tactile feedback:
```
hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:border-border
```

## Dashboard Progress Bars (src/pages/Dashboard.tsx)

Progress bars `bg-primary/40` are fine with the new crisp palette — no change needed.

## Files Changed

| File | Changes |
|------|------|
| `src/index.css` | ~8 token updates + glass-card shadow cleanup |

**1 file. Pure token tuning. No layout, behaviour, or component changes.**

