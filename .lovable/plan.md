# Landing page v2 — Deck-synced, conversion-optimized, brand-aligned

A surgical enhancement of the existing landing page. Same structure, same routes, same nav/footer. Aggressive copy cut, deck-aligned outcome content, premium typographic hierarchy, founder section, and the new Ledge palette (Navy / Purple / Electric Blue / Teal / Amber / Violet — **no coral**).

---

## 1. Brand palette decisions (foundational)

The landing page currently uses warm-stone neutrals (`#F8F7F5`, `#1A1A1A`, `#52525B`). The deck shows a **cool, modern, navy/violet palette**. We'll shift the landing page (only — the in-app shell stays warm) to:

- **Background:** White `#FFFFFF` and Light Gray `#F5F6F8` alternating
- **Text:** Primary Navy `#0A0F1C` (headings) and Charcoal `#1F2937` (body)
- **Muted text:** Slate `#64748B`
- **Borders:** Gray `#E5E7EB`
- **Primary CTA:** Primary Navy `#0A0F1C` (high-contrast, premium)
- **Accent ribbons / numbers:** Gradient Purple `#7C3AED` and Electric Blue `#2563EB`
- **Success / outcome ticks:** Teal `#06B6A4`
- **Hover / urgency highlight:** Amber `#FFA800` (used sparingly)
- **Brand gradient (landing only):** Purple `#7C3AED` → Violet `#6C5CE7` → Electric Blue `#2563EB` (a coral-free gradient that respects the user's "no coral" instruction while staying on-brand)

> **Memory update:** I'll add a new memory note `mem://style/landing-palette` distinguishing the cool landing palette from the warm in-app palette. The existing `mem://style/brand-moments.md` remains valid — coral stays in the in-app brand-moments (splash, empty states, order celebration, sidebar logo) because that's where the official brand mark lives. Only the **landing page** drops coral.

---

## 2. Hero (rewrite)

**File:** `src/components/landing/sections/Hero.tsx`

- **Eyebrow** (new, small, gradient text): `THE OPERATING SYSTEM FOR INDIAN FMCG`
- **Headline** (huge — `text-[40px] md:text-[72px]`, `tracking-[-0.045em]`, Primary Navy):
  > Run your distribution business the way it deserves.
- **Sub-headline** (one bold line, `text-[20px] md:text-[26px]`, Charcoal):
  > Orders, payments, stock, GST invoices — one mobile app. Recover the **5–10% that leaks every year**.
- **Primary CTA:** `Start 30-Day Free Trial` (Primary Navy, white text, slightly larger, subtle Purple→Blue gradient ring on hover)
- **Secondary CTA:** `See How It Works` (ghost, navy border)
- **Trust line below CTAs:** `No card required · Setup in 15 minutes · Built in India`
- **Right column:** keep the existing `DashboardMockup` in `GradientStage` but swap variant from `indigo` to a new cool gradient that uses Purple→Electric Blue (no coral wash).

Cuts ~60% of current hero copy.

---

## 3. NEW — "The Outcome" section (the money section)

**New file:** `src/components/landing/sections/Outcome.tsx`
**Placed:** between `HowItWorks` and `Features` (early prominence, after the user has seen what Ledge is).

Visually **dominant**: Light Gray `#F5F6F8` background, generous vertical padding (`py-32 md:py-44`), centered eyebrow, a single short headline, then a 4-up grid of **giant numbers**.

- **Eyebrow:** `THE OUTCOME`
- **Headline** (`text-[32px] md:text-[52px]`):
  > What changes in the first 90 days.
- **4 stat cards** (no card chrome — just big numbers on the section bg):

| Number (huge, gradient text) | Label (one line) |
|---|---|
| **80+ hrs** | Recovered every month across your team |
| **₹10L–₹1Cr** | Revenue leak recovered every year |
| **8–12%** | Sales lift — same team, same dealers |
| **₹10K–₹20K** | Saved monthly on accountant outsourcing |

- Numbers styled `font-heading font-extrabold text-[56px] md:text-[88px] tracking-[-0.05em]` with `bg-clip-text` on the Purple→Blue gradient.
- Footer line below grid: `Same team. Same geography. More throughput. Better cash flow.`

This becomes the strongest visual block on the page.

---

## 4. Hard cuts on existing sections (75% copy reduction)

### `Problem.tsx`
- Title stays.
- Card descriptions: cut from ~50 words each → **one short sentence each** (~12 words). Examples:
  - "Voice notes. Paper chits. Half get lost by evening."
  - "Cash, UPI, cheque — no single source of truth."
  - "You learn a godown is empty when a dealer calls."
  - "Two days of Excel just to see last week."

### `HowItWorks.tsx`
- Title shortened: `How it works in 60 seconds.`
- Each step description: cut to **one sentence** (~15 words).
  - 01: `Salesperson opens Ledge, picks the dealer, adds products, submits. Sequential order number, instantly.`
  - 02: `Your dashboard updates live — revenue, dispatches, outstanding. No evening summary call.`
  - 03: `Dispatch marked → stock deducts, GST invoice generates, accountant skips Tally. Done.`

### `Features.tsx`
- Title shortened: `Everything your business needs. Nothing it doesn't.` (deck quote)
- Drop description paragraphs entirely. Each feature card becomes:
  - Icon + Bold one-line title + **one supporting line** (max 12 words).
- 6 features stay; visual density drops dramatically.

### `WhyOrdra.tsx` → rename block to **"Built different"**
- Title: `Powerful tools exist. None were built for you.` (deck quote)
- 4 cards → one-line content each.
- Add a small comparison row above the grid: `Tally · Zoho Books · Vyapar` struck through with `Ledge` highlighted in gradient text.

### `Testimonials.tsx`
- Title: `Owners who stopped guessing.`
- Cut quotes to **2–3 lines max** each. Keep the 4 names/roles (they're already South Indian + Pan-India: Pune, Kochi, Chennai, Bangalore — fits the audience).
- Lift one quote into a hero pull-quote slot inside `TrustBar`.

### `TrustBar.tsx`
- Keep marquee.
- Replace the 3-stat row with **4 deck stats**: `2-3 hrs gained daily` · `15-20 hrs freed weekly` · `80% admin eliminated` · `Zero stockouts`.
- Tighten pull-quote copy.

### `Pricing.tsx`
- Title: `Start free. Pay when it's running your business.` (already deck-aligned ✓).
- Sub-line: drop. Replace with: `30-day free trial. No card. Cancel anytime.`
- Cut every plan tagline to ≤8 words.
- Cut every feature bullet to ≤6 words.
- Highlighted plan (Growth) gets a subtle Purple→Blue gradient border.
- Add a single line above pricing grid: `Competitors charge ₹5,000–₹15,000+ for less.` (deck quote, builds value anchoring).

### `FinalCTA.tsx`
- Headline (urgency, deck-aligned):
  > Ready to run your business the way it deserves?
- Sub-line:
  > Start your 30-day free trial today. No card. No commitment. Just clarity — from day one.
- Primary CTA: `Start 30-Day Free Trial` (Primary Navy, prominent)
- Secondary CTA: WhatsApp button — Teal accent, `Chat with us on WhatsApp` (link to `wa.me/918138084689` from the deck)

---

## 5. NEW — Founder section

**New file:** `src/components/landing/sections/Founder.tsx`
**Placed:** between `Testimonials` and `Pricing` (warm, personal, primes the buying decision).

- **Asset:** Copy `user-uploads://Asha_Ps_Founder_CEO_Ledge.jpg` → `src/assets/asha-ps-founder.jpg`.
- **Layout:** Two columns on desktop. Left: portrait in a tall rounded frame (`rounded-[2rem]`, soft shadow, subtle Purple→Blue gradient ring `2px` offset). Right: founder note.
- **Background:** White, generous padding (`py-32 md:py-44`).
- **Eyebrow:** `FROM THE FOUNDER`
- **Note (her voice — confident, practical, South Indian FMCG owner tone, ~50 words):**
  > "I built Ledge because I watched too many distribution businesses lose lakhs to spreadsheets, voice notes and software nobody on the field would open.
  >
  > Your team is in the field right now. Your business deserves a system that keeps up — built in India, designed for the way you actually work.
  >
  > Start free. If it's not running your business in 30 days, walk away."
- **Signature line:** `Asha Ps · Founder, Ledge` + small WhatsApp link `+91 81380 84689`

---

## 6. Index page composition

**File:** `src/pages/Index.tsx`

New section order:
1. Navbar
2. Hero
3. TrustBar
4. Problem
5. HowItWorks
6. **Outcome** (new)
7. Features
8. WhyOrdra (rebranded "Built different")
9. Testimonials
10. **Founder** (new)
11. Pricing
12. FinalCTA
13. Footer

---

## 7. Navbar

**File:** `src/components/landing/sections/Navbar.tsx`

- Replace text wordmark with the official lockup: `<img src={ledgeLogo} className="h-7 w-auto" />` (using existing `src/assets/ledge-logo.png`).
- "Get Started Free" CTA → "Start Free Trial" (matches deck urgency).
- All hover/active states shift to Primary Navy `#0A0F1C`.

---

## 8. Files touched (summary)

**Edited:**
- `src/pages/Index.tsx` — add Outcome + Founder
- `src/components/landing/sections/Hero.tsx`
- `src/components/landing/sections/Navbar.tsx`
- `src/components/landing/sections/TrustBar.tsx`
- `src/components/landing/sections/Problem.tsx`
- `src/components/landing/sections/HowItWorks.tsx`
- `src/components/landing/sections/Features.tsx`
- `src/components/landing/sections/WhyOrdra.tsx`
- `src/components/landing/sections/Testimonials.tsx`
- `src/components/landing/sections/Pricing.tsx`
- `src/components/landing/sections/FinalCTA.tsx`
- `src/index.css` — add landing-only utility tokens (Navy text, Light Gray bg, coral-free gradient utility `.brand-gradient-cool`)

**Created:**
- `src/components/landing/sections/Outcome.tsx`
- `src/components/landing/sections/Founder.tsx`
- `src/assets/asha-ps-founder.jpg` (copied from upload)
- `mem://style/landing-palette.md` — documents the cool landing palette vs. warm in-app palette

**Untouched:** Footer, all routes, all in-app pages, all in-app brand-moment files (splash, empty-state, sidebar logo, NewOrder celebration). The original Purple→Coral brand-gradient memory and CSS variables stay intact for in-app use.

---

## 9. Out of scope (explicitly)

- No new routes or pages
- No changes to the in-app shell, dashboard, or any authenticated route
- No changes to the existing 4 in-app brand moments (splash/empty-state/sidebar/NewOrder)
- No changes to PDFs, badges, status pills, or charts
- No tests added (landing page is presentational; existing 114 tests remain green)

---

## 10. Verification after build

- `tsc` clean
- Visually scan each section at the user's current viewport (1202×841)
- Confirm zero coral / Purple→Coral gradient appears anywhere on the landing route
- Confirm copy reduction is visibly dramatic (whitespace, big type, fewer words per card)
- Confirm Asha's photo loads with skeleton fallback (same pattern as sidebar logo)
