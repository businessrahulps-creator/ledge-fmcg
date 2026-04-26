## Audit — what's wrong with the current Outcome section

Looking at your screenshot honestly:

1. **Card numbers are oversized and inconsistent.** `text-[40-52px] tracking-[-0.035em]` works for "8–12%" but **breaks** on "₹10L–₹1Cr" and "₹10K–₹20K" — they wrap onto two lines, look cramped, and dwarf the actual labels. Hierarchy collapses: the number screams, the label whispers, nothing connects them.
2. **The cards are decorative, not informative.** Four identical white rectangles, each holding one stat. No icon, no visual cue, no proof — they read like generated filler. There's nothing to *look at*.
3. **The grid is too uniform and floats in white space.** No connective tissue between cards, no rhythm, no anchor. The eye has nothing to land on.
4. **"the first 90 days" deserves emphasis.** Right now it sits flat in `#0A0F1C semibold`. The promise of the section lives in those three words and they're invisible.

## The fix — visualize the outcome, don't just list it

### A. Headline: animate "90 days" as the earned brand moment

Replace the flat `<h2>` with a structured composition:

```
What changes in
the first  [ 90 days ]
            ▲ animated chip
```

- "90 days" becomes a **pill-shaped inline chip** with a soft indigo border + faint indigo wash (`bg-[#EEF0FF] border-[#C7D2FE]`), `font-semibold`, slightly larger weight than surrounding text.
- A **permanent, very subtle animation**: a slow indigo shimmer line sweeps across the chip every ~5s (reuses the existing `lp-shimmer-line` keyframe). Plus a gentle 1px breathing scale (`1.0 → 1.015 → 1.0`) on a 4s loop. Both respect `prefers-reduced-motion`.
- This gives the section ONE permanent visual heartbeat without adding noise.

### B. Cards: redesign for hierarchy, not just size

New card anatomy (top → bottom):

```
┌──────────────────────────┐
│  [icon]  ▎ THE METRIC    │  ← 28px icon tile (neutral graphite),
│                          │     eyebrow caption
│  80+                     │
│  hours                   │  ← stat: number 44px, unit 18px, on
│                          │     separate baselines (no wrapping)
│  ─────────               │  ← 24px hairline divider
│  Recovered every month   │
│  across your team        │  ← label, 14px slate
└──────────────────────────┘
```

Key typographic moves:
- **Split number + unit onto two lines** with deliberate sizing. So "₹10L–₹1Cr" becomes:
  - Line 1: `₹10L–₹1Cr` at 38px (not 52)
  - Line 2: `revenue/year` at 16px slate
- This solves the wrapping problem AND creates Apple-style typographic hierarchy. Numbers no longer fight the labels — they lead them.
- Drop the headline number from `text-[52px] tracking-[-0.035em]` → `text-[40px] tracking-[-0.022em] leading-[1]`. Restraint, not bombast.

### C. Visual interest per card (the "designed" feeling)

Each card gets ONE neutral graphite icon tile (32px, `bg-[#F4F4F8] border-[#ECEEF2]`, `#1F2937` icon) corresponding to its meaning:
- 80+ hrs → `Clock` icon
- ₹10L–₹1Cr → `TrendingUp` icon
- 8–12% → `LineChart` icon (sales lift)
- ₹10K–₹20K → `Wallet` icon

Plus a subtle **directional accent** on each card: a 2px-tall indigo gradient line at the top-left (12px wide), only visible on hover or as a static brand mark. Tiny detail, big "designed" payoff.

### D. Grid + composition

- Keep 4-column on desktop, but reduce gap from `gap-5/6` → `gap-4`, tighten card padding from `p-7/8` → `p-6`. Cards become denser and more confident.
- Add a faint hairline frame *around* the whole grid (1px `#ECEEF2` border, 24px rounded, 32px inner padding) so the four cards read as ONE composed unit, not four floating tiles.
- Reduce section vertical padding `py-28/36/40` → `py-24/28` — currently the section feels stranded in white space.

### E. The footer line

Current: `Same factory. Same field. More throughput. Better cash flow.` is one of the strongest lines on the page. Treat it as a quiet payoff:
- Move from `text-[19px] mt-24` to a contained pill: `inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#FAFAFB] border-[#ECEEF2]` with the same copy at 15px.
- Add a tiny `Sparkles` or `ArrowRight` icon at the end. Premium, contained, intentional.

## Files touched

- `src/components/landing/sections/Outcome.tsx` — full restructure (headline composition, new card anatomy with split number/unit + icons + dividers, framed grid, contained footer pill).
- `src/index.css` — add ONE new utility `.lp-pill-accent` for the animated "90 days" chip (indigo wash + shimmer + breathing keyframe). Reuses existing `lp-shimmer-line` infrastructure.

## What stays the same

- Indigo as single earned accent (used in chip + hover line only).
- Light section background, no purple wallpaper.
- `font-semibold` typography rule.
- `StaggerContainer` + `AnimateIn` motion wrapping (just retuned for the new card scale).
- All copy values — the four metrics and the closing line are unchanged.

## Expected feel

The section becomes the **proof moment** of the page: one quietly animated headline ("90 days" pulses softly, drawing the eye), four dense, informative cards with proper typographic hierarchy, framed as a single composed unit, closed by a contained payoff pill. No more wrapping numbers. No more decorative emptiness. Designed, not generated.