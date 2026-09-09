# Landing Page — Web Interface Guidelines Pass

I read Vercel's Web Interface Guidelines (the checklist behind that skill) and audited every landing section against it. The visual design is already strong — these are the craft details that separate a good page from a flawless one.

## What's wrong right now

**1. Pinch-zoom is disabled site-wide (worst issue)**
`index.html` blocks zooming (`user-scalable=no, maximum-scale=1`). On a page aimed at 18-to-55-year-old distributors in South India, older users physically cannot enlarge the text. This is also a straight accessibility failure.

**2. No "skip to content" link**
Keyboard and screen-reader users must tab through the entire navbar on every visit.

**3. Typography details**
- Straight apostrophes everywhere (`India's`, `You're`, `That's`) instead of proper curly ones — the single most visible "typeset by a developer" tell.
- A stray straight double-quote hanging at the end of the founder note.
- No `text-wrap: balance` on headings, so headlines drop lonely single-word last lines at some widths.
- Values that should never break across lines do: `⌘ K`, `₹2.4Cr`, `30 minutes`, `+91 87142 49485`.

**4. `transition: all`**
Three CTA/footer buttons and one CSS rule animate every property — this forces the browser to watch properties that never change and is a known scroll-jank contributor on the exact sections you already flagged as janky.

**5. Mobile notch safety**
The sticky bottom CTA bar and the WhatsApp floating button don't respect `env(safe-area-inset-bottom)`, so on iPhones with a home indicator they sit slightly too low.

**6. Anchor scroll offset**
Sections targeted by the search menu (`#features`, `#pricing`, `#founder`, …) have no `scroll-margin-top`, so the fixed navbar covers the heading you just jumped to.

## What I'd change

### Phase 1 — Accessibility (highest value)
- Allow zoom: viewport becomes `width=device-width, initial-scale=1`.
- Add a visually-hidden "Skip to Content" link that appears on first Tab and jumps to `<main>`.
- Add `scroll-margin-top` to every landing section so anchor jumps clear the navbar.
- Sweep icon-only controls (search icon, hamburger, social links) to confirm every one has an `aria-label`, and every decorative icon/SVG has `aria-hidden`.

### Phase 2 — Typography polish
- Replace straight apostrophes and quotes with typographic ones across all landing copy; fix the dangling quote in the founder note.
- Add `text-wrap: balance` to landing headings and `text-pretty` to body paragraphs.
- Non-breaking spaces for `⌘ K`, currency figures, the phone number, and "30 minutes".

### Phase 3 — Motion & performance
- Replace all `transition-all` with explicit property lists (`transition-colors`, `transition-transform`, etc.), including the one rule in the stylesheet.
- Re-confirm every landing animation has a `prefers-reduced-motion` path (the shader backdrop already does).

### Phase 4 — Mobile fit & finish
- Safe-area padding on the sticky CTA bar and WhatsApp button.
- `touch-action: manipulation` on landing tap targets to kill the 300ms double-tap delay.
- `overscroll-behavior: contain` on the mobile menu overlay so scrolling it doesn't drag the page behind.

### Deliberately not doing
- No layout, colour, or copy-meaning changes — the design system stays exactly as it is.
- Nothing inside `/app`; this pass is landing-only.

## Technical notes
Files touched: `index.html`, `src/index.css`, `src/pages/Index.tsx`, and the section/component files under `src/components/landing/`. Existing guardrail tests (`landing-design-system.test.ts`, `brand-placement.test.ts`) must stay green; I'll add a small test asserting the viewport allows zoom and that no landing file uses `transition-all`. Verification: full Vitest run plus Playwright screenshots at 390px and 1440px, and a keyboard-only tab pass through the header.
