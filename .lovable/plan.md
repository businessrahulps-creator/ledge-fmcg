# Final Landing Polish — "Pill, Proof, Preview"

## What I'm learning from your references

Looking at IMG_2804/2805/2806 (pill controls, status chips, Ask AI button), IMG_2808 (Ticketapp feature cards with mini product previews), and IMG_2817–2820 (Coach insight panel, spending pattern card, safe-to-spend arc, bottom nav with progress ring) — four traits repeat:

1. **Pill geometry everywhere.** Fully-rounded capsules, not boxy cards. Soft, layered white shadows (top inner highlight + ambient drop), no harsh borders.
2. **Status-as-pill.** Tiny rounded-square color tile + matching tinted text in one capsule (Pending / Submitted / Success). Zero borders, all weight comes from the color tile.
3. **Insight micro-panels.** A small tinted-bg block *inside* a white card with a header row ("Coach insight"), one line of copy, and a colored "See breakdown →" link.
4. **Mini product previews in feature cards.** The illustration zone shows the real product (rows, charts, chips) — not generic art. That's what makes Ticketapp feel like a "billion-dollar app."

Our current landing has the tinted cards (PR from last turn) but lacks the **pill vocabulary, the status chips, the insight panels, and real product micro-previews**. This plan adds those four things only.

## Plan: four additions, zero rewrites

### 1. Pill primitives in `index.css` (additive, no breaking changes)

Add a small family under the existing `lp-*` namespace:

- `.lp-pill` — base capsule (white, fully rounded, layered shadow `inset 0 1px 0 white, 0 1px 2px rgba(15,31,58,.06), 0 8px 24px -12px rgba(15,31,58,.18)`). Used as the chrome for everything below.
- `.lp-pill-status` + 5 variants `--success / --info / --warn / --danger / --neutral`. Renders an 18px rounded-square color tile (lucide icon inside) + tinted label, all inside one capsule. Maps to brand semantic tokens: Forest=success, Midnight=info, Terracotta=warn, muted=neutral.
- `.lp-pill-metric` — capsule with a small icon tile on the left + label + delta chip on the right (the IMG_2818 "Dining +12%" pattern).
- `.lp-pill-gradient` — the "Ask AI" gradient capsule (Terracotta→Midnight) for the one earned hero/CTA moment. Built on existing `lp-capsule-cta` styling, exposed as a compact pill variant.
- `.lp-insight` — tinted micro-panel (Bone or faint Forest bg, 12px radius, soft inset). Header row uses a 16px monoline icon + label in muted-foreground; body line in foreground; footer link in Forest.

All built from existing HSL tokens (Midnight/Forest/Terracotta/Bone). No new colors, no new fonts.

### 2. Apply pills where they earn their keep (six surgical spots)

```text
Hero        → replace the small "Built in Kerala" text with an lp-pill-status --success
            → trust strip below CTA becomes 3 lp-pill chips (Offline-ready · GST-ready · Made in Kerala)
TrustBar    → swap the row of plain logos for lp-pill containers (one per logo) — feels intentional
Problem     → on the Terracotta hero card, add an lp-pill-status --warn ("Excel night · 11:47pm") above the headline
WhyLedge    → on the Midnight card, add an lp-insight panel ("Coach insight" pattern) with one real Ledge line, e.g. "Your top 3 dealers haven't ordered in 12 days. Tap to nudge."
Outcome     → the "Revenue recovered" Forest card gets an lp-pill-metric row inside (₹14.2L · +18% this quarter)
FinalCTA    → primary CTA becomes lp-pill-gradient; secondary stays ghost
```

No section gets more than **one** pill cluster. That's the rationing rule — pills are accents, not wallpaper.

### 3. Replace 2 of the 6 Features bento cards with **real product micro-previews** (the Ticketapp move)

Currently Features.tsx has icon + headline + body. We'll upgrade the two largest cards to include a small **non-interactive product preview** rendered in JSX (no images):

- **Dealer Intelligence** (Forest tint): show a stacked list of 3 fake dealer rows with `lp-pill-status` chips (Active / Slow / At risk) — matches IMG_2808 Package Selling card.
- **Returns & Claims** (Terracotta tint): show a mini timeline with 3 `lp-pill-status` nodes (Submitted → Approved → Paid) with a tiny ₹ amount.

Other 4 cards stay as-is (icon + copy). This gives the page two "wow" moments without bloating.

### 4. Type & rhythm tightening (tiny but high-leverage)

- All new pills use **Inter 13/14px medium**, never Playfair (Playfair stays reserved for headlines).
- Add 1 utility `.num-tabular` (`font-feature-settings: "tnum"`) and apply to every metric/number inside pills — fixes the jitter you get with proportional digits.
- Increase vertical air around tinted cards by 8px so the new pills don't crowd the headlines.

## Out of scope (intentionally)

- No new colors, fonts, animations beyond a 200ms ease on pill hover.
- No changes to Pricing, Founder, HowItWorks, Footer, Navbar, LedgeIntelligence (already dense enough).
- No changes to the app (`/app/*`) — landing only.
- No new images or assets — all previews rendered in JSX with existing tokens.

## Files touched

```text
src/index.css                                    (+~120 lines of lp-pill-* / lp-insight)
src/components/landing/sections/Hero.tsx         (status pill + 3 trust pills)
src/components/landing/sections/TrustBar.tsx     (wrap logos in lp-pill)
src/components/landing/sections/Problem.tsx      (warn pill on Terracotta card)
src/components/landing/sections/WhyLedge.tsx     (lp-insight panel on Midnight card)
src/components/landing/sections/Outcome.tsx      (lp-pill-metric on Forest card)
src/components/landing/sections/Features.tsx     (2 cards get JSX micro-previews)
src/components/landing/sections/FinalCTA.tsx     (CTA → lp-pill-gradient)
mem://style/landing-pill-system                  (new memory: pill vocabulary + rationing rule)
mem://index.md                                   (one new line)
```

## Why this lands the "billion-dollar" feel

Your references don't win with color — they win with **a consistent component vocabulary** repeated at every scale: status, metric, control, insight. Right now Ledge has cards and headlines but no shared micro-grammar. Adding one pill family + one insight panel + two real product previews gives the eye the same "this team thought about every 40px" signal that Slowspace, Ticketapp, and the iOS reference shots all share — without redesigning a single section.

## Verification

After implementation: scroll the landing at 1440px and 390px, confirm pills line up on the baseline grid, hover states are subtle (no scale, just shadow lift), and the gradient CTA is the only saturated element per viewport.
