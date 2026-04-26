
# Landing Page — Final Polish Pass

A fresh chief-designer audit (desktop 1505w + mobile 375w) against your screenshots. Calling out everything broken in one pass.

---

## Audit findings

### What you flagged (confirmed)
1. **`[ 01 ] [ 02 ] …` brackets are everywhere** — Outcome, Problem, Features, WhyOrdra, HowItWorks, Testimonials, Founder. Reads as decoration, not signal. Kill them globally.
2. **Outcome cards still overflow.** `₹10L–₹1Cr` and `₹10K–₹20K` use `whitespace-nowrap` at 30–36px inside narrow columns — the second one breaks the box on the right of the screenshot. The hero tile's `lp-glass-micro` block also pushes the card taller than its siblings, ruining the row.
3. **Features section is broken.** The bento layout (3/3/3/3/2/2/2 col-span on a 6-col grid) leaves cards 5 & 6 visibly cropped at the bottom of the screenshot. Hero "Live business dashboard" tile has competing weights (eyebrow + title + description + 3-up KPI mini-card) — too busy.
4. **`Start free. … walk away.`** — current `lp-gradient-text-cool` (purple → indigo → blue) feels cheap and clashes with the now-restrained palette. Needs a flat, confident treatment.
5. **`[ FOUNDER · 2026 ]`** — meta line adds no value, must go.
6. **Pricing cards broken** — "Most Popular" badge sits on top of the card border (negative `-top-3`) and gets clipped because `lp-bento-hero` has `overflow: hidden`. The Free card's `₹` is misaligned (sub-baseline). The Growth card's price block in `lp-glass-micro` is much taller than the other three cards' price blocks → row never aligns.
7. **`30-day free trial. No card. Cancel anytime.`** — currently buried inline in a paragraph. Needs a subtle, confident chip treatment.
8. **CTA button animation is poor.** Currently just a 2px translateX on the inner pill. Reference shows a confident slide + arrow chamber transition. Needs proper choreography.
9. **`₹2.4Cr tracked this week` chip** — current indigo→sky gradient is too saturated and visually competes with the dashboard mockup it floats below. Doesn't match the now-soft palette.

### Additional issues found in audit

10. **Hero CTA row** — `gap-4 sm:gap-6` between capsule and "See how it works →" is too tight on mobile; secondary link butts up against the capsule's arrow chamber.
11. **WhyOrdra "Built different" eyebrow + h2** — works, but the giant `[ 02 ]` `lp-bento-numeral--lg` (22px) on the hero tile is louder than the headline of the card itself ("Works when the network doesn't"). Inverted hierarchy.
12. **HowItWorks** — `[ 01 ] [ 02 ] [ 03 ]` is doubled with `STEP 01` text right below it. Redundant.
13. **Mobile (375w)** — Outcome's 4-column grid stacks fine, but the outer `rounded-[24px] border` wrapper adds unnecessary visual weight on mobile (a frame around already-framed cards). Pricing's "Most Popular" badge clipping is worse on mobile.
14. **FinalCTA proof chip** — `lp-glass-frost` with the indigo top-edge highlight reads OK, but `Used by FMCG teams across 12 Indian states` is unverifiable copy; consider softening.
15. **Outcome's `90 days` pill** — fine, but the trailing `.` after the pill sits awkwardly far right because of the pill's padding.

---

## The fix plan

### A. Global cleanup — remove bracketed numerals everywhere

Strip `[ 01 ] [ 02 ] …` from:
- `Outcome.tsx` (4 cards, hero tile)
- `Problem.tsx` (4 cards)
- `Features.tsx` (6 cards)
- `WhyOrdra.tsx` (4 cards, replace giant numerals)
- `HowItWorks.tsx` (3 steps — keep the `STEP 01` text label, kill the bracketed version)
- `Testimonials.tsx` (4 cards)
- `Founder.tsx` (`[ FOUNDER · 2026 ]` line)

CSS: keep `.lp-bento-numeral` defined for now (still referenced in some places we'll clean) but stop using it. Remove `.lp-bento-numeral--lg`.

### B. Outcome — fix overflow + alignment

- Drop `whitespace-nowrap` on `value`. Reduce stat font from 30–36px to **`text-[26px] md:text-[28px]`** so `₹10L–₹1Cr` and `₹10K–₹20K` fit comfortably on one line in their column.
- Hero tile (Revenue recovered): remove the inner `lp-glass-micro` wrapper around the value — it inflates height and breaks row alignment. Keep value/unit inline like the other 3 cards but add a subtle indigo accent (text color `#3730A3` on the value only).
- Remove the outer `rounded-[24px] border bg-white p-3` frame on mobile (`md:` only) — frame-in-frame reads heavy on small screens.
- Move the `.` after the `90 days` pill closer with negative margin (`ml-[-2px]`).

### C. Features — full redesign

This was the biggest call-out. Replacing the broken bento with a clean, confident **uniform 3-column grid** (which is how the reference image 2 actually reads — 6 equal-feeling tiles, one promoted).

- Drop the variable `col-span` math. Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with all tiles equal size. 6 tiles = 2 rows of 3. Clean.
- Hero tile (`Live business dashboard`) keeps `lp-bento-hero` styling but **simplified contents**: live-dot + eyebrow + title + description + ONE inline KPI line (`₹4.2L revenue today · 28 orders · 12 dispatched`) — not a 3-column micro-card. Reduces visual noise dramatically.
- Other 5 tiles: standard `lp-card` with icon-tile + title + description. No numerals.
- Tighten card padding to `p-7` and ensure `auto-rows-fr` so all rows line up.

### D. Founder — flat treatment + cleanup

- Remove `[ FOUNDER · 2026 ]` line entirely.
- Replace `lp-gradient-text-cool` on `Start free. If it's not running your business in 30 days, walk away.` with a **flat indigo** `text-[#4F46E5]` at the same font weight. Premium, confident, not generated.
- Keep the rest of the founder block as-is.

### E. Pricing — fix the broken cards

- "Most Popular" badge: change `lp-bento-hero` to allow badge to overflow. Either remove `overflow-hidden` on the highlighted variant, or restructure: place badge as a **pill INSIDE the top of the card** (top-right, normal flow) instead of `absolute -top-3`. Cleaner, no clipping.
- Free card `₹0`: re-baseline the `₹` symbol (currently `text-[15px]` next to a 40px digit pushes it to subscript-feel). Wrap in a flex container with `items-baseline` and lift `₹` to `text-[24px]` so it sits properly.
- Remove the `lp-glass-micro` wrapper around Growth's price. Use the same inline price pattern as the other 3 cards. This fixes row-alignment AND removes the "card-in-card" feel that screenshot 4 shows looks busy.
- Subtle highlight for the "30-day free trial. No card. Cancel anytime." line: extract from the paragraph and render as **its own pill** below the headline:
  ```
  [ ✓ 30-day free trial   ✓ No card   ✓ Cancel anytime ]
  ```
  Single rounded chip, `bg-[#F4F4F8]`, hairline border, three checkmarks separated by hairline dividers. Subtle, confident, scannable.

### F. Capsule CTA — better animation

Current motion is flat. Upgrade choreography (CSS-only, GPU):
- **Outer track**: subtle press-in shadow on hover (deeper inset).
- **Inner pill**: slides `translateX(4px)` (was 2px) AND lifts `translateY(-1px)` with a softer shadow lift — gives it a "released" feel.
- **Arrow chamber**: arrow translates `translateX(6px)` AND the chamber background brightens to a faint indigo tint (`rgba(79,70,229,0.06)`).
- Easing: switch from `cubic-bezier(0.22,1,0.36,1)` (already good) but lengthen to **320ms** for the inner pill so the slide reads instead of snaps.
- Add `:active` press state — inner pill nudges back `translateX(1px) scale(0.99)`.

### G. Hero proof chip — palette fix

`₹2.4Cr tracked this week` — recolor from saturated indigo→sky gradient to match landing palette:
- Replace `.lp-progress-glass` background with a **subtle frosted dark chip**: `bg-[#0A0F1C]/90` + `backdrop-blur-md`, white text, soft white inner highlight. Calm, premium, sits naturally against the soft white hero mesh instead of fighting it.
- Keep the live dot but switch to a soft indigo `#818CF8` (not green — green reads "online status," not "money").
- Remove the saturated outer blue glow shadow; replace with a soft neutral graphite drop shadow.

### H. Hero CTA spacing

- Increase mobile gap to `gap-5 sm:gap-7` between capsule and secondary link so the arrow chamber doesn't crowd "See how it works →".

### I. WhyOrdra — fix inverted hierarchy

Since we're killing all bracketed numerals, the `lp-bento-numeral--lg` issue disappears naturally. Hero tile keeps the offline-ready chip + indigo wash + watermark icon. Clean.

### J. HowItWorks — single step indicator

Already has a `STEP 01` text label below the (now-removed) bracketed numeral. Keep just the `STEP 01` label. Done.

### K. Mobile polish

- Outcome: drop outer frame on mobile (covered in B).
- Hero CTA spacing (covered in H).
- Pricing badge clipping (covered in E).
- Features grid stacking already works once the bento math is removed.

---

## Files that will change

**Section components** (all in `src/components/landing/sections/`):
- `Outcome.tsx` — strip numerals, fix font sizes, drop hero glass-micro, mobile frame off
- `Problem.tsx` — strip numerals
- `Features.tsx` — full redesign: uniform 3-col grid, simplified hero tile
- `WhyOrdra.tsx` — strip giant numerals
- `HowItWorks.tsx` — strip bracketed numerals (keep STEP labels)
- `Testimonials.tsx` — strip numerals
- `Founder.tsx` — remove `[ FOUNDER · 2026 ]`, flat indigo color on key line
- `Pricing.tsx` — fix Most Popular badge clipping, fix `₹0` baseline, drop glass-micro on Growth price, add benefits chip
- `Hero.tsx` — recolor proof chip, widen CTA gap

**CSS** (`src/index.css`):
- Update `.lp-capsule-cta` hover/active choreography (longer ease, larger translate, arrow chamber tint, lift)
- Update `.lp-progress-glass` to neutral dark frosted chip palette
- Remove `.lp-bento-numeral--lg` (orphaned)
- Add `.lp-pricing-trust-chip` for the new "30-day · No card · Cancel anytime" chip

**Memory**:
- Update `.lovable/memory/style/landing-palette.md`: remove the bracketed-numeral guidance (rejected by user), note that the proof chip palette must remain neutral (not saturated indigo).

---

## Why this works

The bracketed numerals were a typographic crutch that read as "designed" but actually fragmented every section's hierarchy. Removing them lets the headlines and content do the talking. The Features redesign replaces broken bento math with a confident uniform grid (the reference's actual lesson: **rhythm > variety**). The capsule CTA finally moves with intent. And the proof chip stops fighting the page.

Restraint, again — but applied correctly this time.
