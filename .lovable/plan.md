# Landing re-palette: Electric / Ink / Lime

Adopt the new five-colour palette as the design system, and apply it to the landing page only. `/app` keeps its current Midnight/Bone look until a later pass, but the tokens are authored so the app can switch by flipping one scope.

## The palette

| Name | Hex | HSL | Role |
| --- | --- | --- | --- |
| Electric Blue | `#1B57F5` | `224 91% 53%` | Primary. CTAs, big colour blocks, links |
| Ink | `#1B2130` | `224 28% 15%` | Dark surfaces, headings on light, alt block colour |
| Lime | `#C8F250` | `75 85% 63%` | Accent only — badges, underline strokes, chat bubbles, arrows |
| Lavender Mist | `#E5E4F0` | `244 26% 92%` | Page background (replaces Bone) |
| White | `#FFFFFF` | `0 0% 100%` | Cards, inner panels, text on Electric/Ink |

Rules that come with the palette:
- Lime is never a background for long text and never a CTA fill. It is a highlight: pills, one-word emphasis, underline swoosh, arrow, single data dot.
- Electric and Ink alternate as the two "loud" block colours. Never place them adjacent without white or lavender breathing room.
- No terracotta, no forest, no bone anywhere on the landing page after this pass.

## How it is structured

1. **New token layer in `src/index.css`** — add the five brand hexes as raw HSL variables (`--brand-electric`, `--brand-ink`, `--brand-lime`, `--brand-mist`) next to the existing V2 anchors, so both palettes are declared in one place.
2. **Scoped landing theme** — the landing root in `src/pages/Index.tsx` gets a `lp-theme` class. Inside that scope, the semantic tokens (`--background`, `--primary`, `--accent`, `--success`, `--card`, `--border`, `--muted`, `--ring`, foregrounds) are remapped to the new palette. Nothing outside that scope changes, so `/app`, auth, and onboarding are untouched.
3. **Later app switch** — moving the app over becomes "promote the `lp-theme` block into `:root`", which is one follow-up PR, not a rewrite.

## Landing surfaces to re-colour

- **Card variants** — the tinted/visual card system loses `terracotta`/`forest`/`bone` and gains `electric`, `ink`, `mist`, `white`, `lime` (lime reserved for small tiles). `LandingCard` variant map and the `.lp-card-*` / `.lp-vcard--*` CSS rules are rewritten to match, with correct foreground contrast for each.
- **Feature visuals** — the SVG illustrations (dealer roster, stock health, scheme arc, team bars, GST invoice, claim timeline, revenue chart) get their hardcoded brand hexes swapped to Electric/Ink/Lime/white.
- **Nav** — capsules on lavender, Electric CTA pill, Lime status dot, Ink wordmark.
- **Hero** — lavender page ground, white browser frame, Electric primary CTA, Lime accent on the proof chip and one emphasised word.
- **Section by section** — TrustBar, Problem, HowItWorks, Outcome, LedgeIntelligence, Features, WhyLedge, Testimonials, Founder, Pricing, FinalCTA, Footer each get a block colour assigned so the page alternates lavender → white → Electric → Ink rather than repeating one look.
- **Mesh/gradient/shadow helpers** — warm Midnight-tinted shadows and warm meshes become cool Ink-tinted; the striped-mark watermark tint is adjusted for the new dark surfaces.
- **Pills, buttons, eyebrows, capsule CTA, shimmer, progress, proof chips** — all `lp-*` primitives repointed at the new tokens. Primitive names and APIs do not change, only their internals.

## Technical notes

- Every value stays HSL via semantic tokens; no raw hex in components.
- `src/components/landing/constants.ts` keeps its documented exceptions (WhatsApp green, Mac window dots).
- `src/test/brand-placement.test.ts` is updated to assert the new variant names.
- Verification: full typecheck, full Vitest, and Playwright screenshots at 390 / 768 / 1440 to confirm contrast and that no warm colour survives.
- Memory updated with the new palette as the landing source of truth, noting `/app` is still on V2 pending the follow-up.

## Out of scope

Typography, layout, copy, spacing, and all `/app` screens stay exactly as they are.
