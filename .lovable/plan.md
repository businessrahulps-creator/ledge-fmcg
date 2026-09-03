# Landing re-palette: Electric / Ink / Lime

Adopt the new five-colour palette as the design system and apply it to the landing page. `/app` keeps its current look until a later pass, but the tokens are authored so the app can switch by promoting one scope.

## The palette

| Name | Hex | HSL | Role |
| --- | --- | --- | --- |
| Electric Blue | `#1B57F5` | `224 91% 53%` | Primary. CTAs, full-bleed colour blocks, links |
| Ink | `#1B2130` | `224 28% 15%` | Dark blocks, headings on light |
| Lime | `#C8F250` | `75 85% 63%` | Accent only — badges, underline swoosh, arrows, one data point |
| Lavender Mist | `#E5E4F0` | `244 26% 92%` | Page ground (replaces Bone) |
| White | `#FFFFFF` | `0 0% 100%` | Cards, inner panels, text on Electric/Ink |

Palette laws:
- Lime is never a CTA fill and never a background for body text. It is a highlighter: pill, one emphasised word, a swoosh, a single dot.
- Electric and Ink alternate as the two loud blocks; never adjacent without white or lavender between them.
- No terracotta, forest, or bone survives on the landing page.

## Design critique of a straight swap

A pure find-and-replace would leave the page reading as "the old site, painted blue". Three things in the reference make it feel expensive, and a colour swap alone gets none of them:

1. **Colour is the layout.** In the reference, blocks of saturated colour *are* the sections — edge-to-edge, no card sitting politely on a neutral page. Our current landing is a light page with cards floating on it.
2. **One idea per block.** Each panel holds a single statement, one number, or one small object. Ours packs a heading, paragraph, and grid into the same rectangle.
3. **Type does the shouting, not the effects.** Huge weight contrast, an italic word underlined in lime, and tiny all-caps eyebrows. Ours leans on shadows, glass, meshes, and shimmer for interest.

So the plan is a re-palette *plus* three cheap structural moves that make the palette land. No copy rewrite, no new sections.

## The three moves

**1. Full-bleed colour blocks.** Sections stop being "cards on a page". Problem, Outcome, LedgeIntelligence, and FinalCTA become edge-to-edge Electric or Ink panels with generous inner radius on their content, alternating against lavender and white sections. The page becomes a rhythm: mist → white → Electric → mist → Ink → white → Electric.

**2. A typographic accent kit.** Three small primitives, used sparingly:
- lime underline swoosh under one italic word per section heading
- tiny all-caps lime eyebrow on dark and Electric blocks
- one oversized statistic per page region, set in the heading face at display scale on a dark block

**3. Effects diet.** Remove the warm meshes, glass frost, noise, vignette, and shimmer from the sections that become solid colour. Flat, confident colour reads more expensive than layered gradient. Shadows stay only on white cards resting on lavender, and become cool Ink-tinted instead of warm.

## How the tokens are structured

1. **Brand layer in `src/index.css`** — the five hexes as raw HSL variables (`--brand-electric`, `--brand-ink`, `--brand-lime`, `--brand-mist`) alongside the existing V2 anchors.
2. **Scoped landing theme** — the landing root in `src/pages/Index.tsx` gets an `lp-theme` class. Inside it, semantic tokens (`--background`, `--primary`, `--accent`, `--card`, `--border`, `--muted`, `--ring`, all foregrounds) remap to the new palette. Nothing outside that scope changes, so `/app`, auth, and onboarding are untouched.
3. **Later app switch** — moving the app over is "promote the `lp-theme` block into `:root`", a single follow-up PR.

## Surfaces to re-colour

- **Card variants** — drop `terracotta`/`forest`/`bone`, add `electric`, `ink`, `mist`, `white`. `LandingCard`'s variant map and the `.lp-card-*` / `.lp-vcard--*` rules rewritten with correct foregrounds per variant.
- **Feature visuals** — the SVG illustrations (dealer roster, stock health, scheme arc, team bars, GST invoice, claim timeline, revenue chart) repainted in Electric/Ink/Lime/white, each with one lime highlight so the eye lands somewhere.
- **Nav** — capsules on lavender, Electric CTA pill, Lime status dot, Ink wordmark.
- **Hero** — lavender ground, white product frame, Electric primary CTA, lime swoosh on one headline word, lime proof-chip dot.
- **Every section** — TrustBar, Problem, HowItWorks, Outcome, LedgeIntelligence, Features, WhyLedge, Testimonials, Founder, Pricing, FinalCTA, Footer each get an assigned block colour following the rhythm above.
- **Primitives** — pills, buttons, eyebrows, capsule CTA, progress, proof chips repointed at the new tokens. Names and APIs unchanged; only internals move.

## Technical notes

- All values HSL via semantic tokens; no raw hex in components.
- `src/components/landing/constants.ts` keeps its documented exceptions (WhatsApp green, Mac window dots).
- `src/test/brand-placement.test.ts` updated to the new variant names.
- Contrast check on every pairing: white and lime on Electric, white on Ink, Ink on lavender, Ink on lime. Lime text only on Ink, never on Electric or white.
- Verification: full typecheck, full Vitest, Playwright screenshots at 390 / 768 / 1440, plus a grep proving no warm hex or `forest|terracotta|bone` class survives in `src/components/landing`.
- Memory updated with the new palette as landing source of truth, noting `/app` is still on V2 pending the follow-up.

## Out of scope

Copy, typography families, section order, and all `/app` screens stay as they are.
