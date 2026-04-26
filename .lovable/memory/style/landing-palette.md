---
name: Landing palette (restraint + reference primitives)
description: Landing uses white/paper neutrals with indigo accent. Reference-inspired primitives (capsule CTA, frost, bento hero) are deployed at most ONCE per section.
type: design
---
The **landing page** runs on restraint. White space does the work.

**Backgrounds** (alternating rhythm, no wallpaper gradients):
- White `#FFFFFF` — Hero (with one soft top haze via `lp-mesh-soft-warm`), HowItWorks, WhyOrdra, Pricing, Outcome
- Paper `#FAFAFB` (`lp-section-paper`) — Problem, Features, Testimonials
- Soft lavender `#F4F4F8` (`lp-mesh-dark`) — FinalCTA. Calm light close.

**Text**: Headings `#0A0F1C`, body `#475569`/`#64748B`, mute `#94A3B8`, hairline borders `#ECEEF2`.

**Single accent**: Indigo `#4F46E5`. Earned uses only.

**Typography rule**: `font-semibold` replaces `font-extrabold`. Tracking `~-0.022em`. Hero H1 caps at 52px; section H2 caps at 40px.

---

## Reference-inspired primitives (added)

These come from three reference UIs (neumorphic capsule, frosted progress card, numbered bento). **Use each at most ONCE per section** — they are signatures, not wallpaper.

- **`.lp-capsule-cta`** — neumorphic pill-in-pill CTA with arrow chamber. Use via `<CapsuleCTA>` component. **The only primary CTA shape on the page.** Deployed at Hero (light) and FinalCTA (dark). Never use a flat dark pill anywhere else.
- **`.lp-glass-frost`** — content-grade frosted card with soft blue bloom + indigo→sky top-edge highlight. Used in Testimonials (front card), HowItWorks (device stages), FinalCTA (proof chip).
- **`.lp-progress-glass`** — blue-gradient capsule (indigo → sky) with shimmer. Hero proof chip only.
- **`.lp-bento-numeral`** / **`.lp-bento-numeral--lg`** — bracketed `[ 01 ]` mono numerals. Typographic thread across Problem, Features, Outcome, WhyOrdra, Testimonials, HowItWorks step labels, Founder byline.
- **`.lp-bento-hero`** — soft sky→indigo wash tile. **One filled tile per multi-card section, never more.** Currently: Outcome (Revenue card), Features (Live dashboard tile), WhyOrdra (Offline-ready tile), Pricing (Growth plan).
- **`.lp-glass-micro`** — tiny inner glass micro-card for use INSIDE `.lp-bento-hero` (e.g., Pricing's price block, Outcome's stat value, Features' KPI strip).
- **`.lp-live-dot`** — pulsing green dot for "Live" / real-time signals.

**Hierarchy rule**: Within any multi-card grid, exactly one card is the bento-hero, the rest stay neutral. Hierarchy through contrast, never equal weight.

**Why**: User explicitly called out the previous design as "cheap, generated, not designed". The references win because they stage one element per viewport. Frost + soft blue glow becomes our signature flourish (4–5 uses across the entire page), the neumorphic capsule becomes our unmistakable CTA shape, and bracketed numerals tie the page together as designed, not generated.
