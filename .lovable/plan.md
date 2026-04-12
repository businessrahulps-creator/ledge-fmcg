

# Dashboard Contrast & Readability Fix

## Root Cause

The "washed-out" feeling comes from **insufficient contrast between layers**:

| Element | Current Value | Problem |
|---------|--------------|---------|
| Background | `220 14% 97%` (~#F5F6F8) | Too close to white cards — only 3% lightness difference |
| Border | `220 9% 87%` (~#DCDEE3) | Too faint, cards don't "pop" from background |
| Glass-card shadow | `rgba(0,0,0,0.04)` | Nearly invisible — no depth perception |
| Muted foreground | `220 10% 40%` | Acceptable, but section labels at `/60` opacity become unreadable |
| Section labels | `text-muted-foreground/60` | ~24% effective opacity — far too faint |

The result: white cards on near-white background with ghost borders and invisible shadows = everything blends into a flat, lifeless sheet.

## Solution — 4 Targeted Token Adjustments

All changes in `src/index.css` only. No component changes.

### 1. Darken background for card separation
`--background: 220 14% 97%` → `220 14% 95%` (~#EDEEF2)

This creates a 5% lightness gap between background and white cards — enough for clear layering without feeling heavy.

### 2. Strengthen border definition
`--border: 220 9% 87%` → `220 9% 84%` (~#D2D4DA)

Borders become visible without being harsh. Cards gain a definite edge.

### 3. Boost glass-card shadows for depth
Current: `shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.04)]`
New: `shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.06),0_4px_14px_rgba(0,0,0,0.06)]`

Subtle but meaningful — cards will "float" above the background.

### 4. Strengthen section labels
`text-muted-foreground/60` → `text-muted-foreground/70`

Section labels ("HOME", "MANAGE", "ANALYZE") become readable.

---

**1 file changed (`src/index.css`), 4 line edits. No layout, component, or behaviour changes. Fully reversible.**

