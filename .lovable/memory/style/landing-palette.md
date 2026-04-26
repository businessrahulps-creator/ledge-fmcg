---
name: Landing palette (restraint)
description: Landing uses white/paper neutrals with a single indigo accent. Purple gradient is reserved for ONE earned moment per page.
type: design
---
The **landing page** runs on restraint. White space does the work.

**Backgrounds** (alternating rhythm, no wallpaper gradients):
- White `#FFFFFF` — Hero (with one soft top haze via `lp-mesh-soft-warm`), HowItWorks, WhyOrdra, Pricing, Outcome
- Paper `#FAFAFB` (`lp-section-paper`) — Problem, Features, Testimonials
- Soft lavender `#F4F4F8` (`lp-mesh-dark`, repurposed) — FinalCTA. Calm light close, not a dark nightclub.

**Text**: Headings `#0A0F1C`, body `#475569`/`#64748B`, mute `#94A3B8`, hairline borders `#ECEEF2`.

**Single accent**: Indigo `#4F46E5`. Earned uses only:
- Tiny dot in `.lp-eyebrow` chips
- Pricing "Most Popular" border + icon tile (one card)
- Hover state on links
- The ONE gradient line in the Founder quote ("Start free…") via `.lp-gradient-text-cool`

**Forbidden** (was overused, now gone):
- Purple radial mesh wallpaper behind sections
- Gradient text in headlines, stat numbers, step labels, comparison pills
- Purple-tinted card shadows / halos
- Gradient avatar circles, gradient check bullet rings
- Dark `lp-mesh-dark` with violet+blue glows on FinalCTA

**Typography rule**: `font-semibold` replaces `font-extrabold`. Tracking eases from `-0.04em` to `~-0.022em`. Hero H1 caps at 52px; section H2 caps at 40px. Body line-height 1.5–1.55.

**Why**: User explicitly called out the previous design as "cheap, generated, not designed" — purple was wallpaper, headlines shouted at the same volume in every section, mesh + grid + noise + glow stacked into muddy banding. The Cluely reference earns calm by giving the page silence.

**How to apply**: Default to white or paper. Reach for indigo only when an element genuinely needs to be *the* accent in its viewport. The brand gradient utility appears at most ONCE per page — currently in the Founder quote.
