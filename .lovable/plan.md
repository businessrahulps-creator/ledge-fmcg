
# Copy Tweaks — Positioning Adjustments

Four small, surgical copy changes across the landing page.

## 1. "Distribution" → "FMCG"
Anywhere we say "distribution business" or "distributors", swap to "FMCG business" / "FMCG super-stockists".

- **Footer brand line:** `Orders. Payments. Stock. Invoices. Reports. One effortless mobile experience — built for India's FMCG super-stockists.`
- **Hero subhead:** `Built for super-stockists and FMCG owners across India. Mobile-first. Works offline. Recover the 5–10% that quietly leaks every year between your factory and your field.`

## 2. Audience → "Super-stockist"
Lead the audience framing with super-stockists (the deck's actual ICP).

- Hero subhead (above) leads with "super-stockists and FMCG owners".
- SEO `<meta description>`: `Orders, payments, stock, invoices and reports — one mobile app for India's FMCG super-stockists. Mobile-first, works offline. Start free for 30 days.`

## 3. "Kerala" → "India" (positioning)
Broaden geographic claim from Kerala to India in headlines/eyebrows.

- **Hero eyebrow:** `The Operating System for India's FMCG Businesses` (mobile: `OS for India's FMCG`).
- **SEO `<title>`:** `Ledge — The Operating System for India's FMCG Businesses`.
- **OG/Twitter title:** same as above.
- **Footer tagline:** drop "Kerala", replace with "India's FMCG super-stockists" (covered in #1).
- **Ledge Co-Pilot:** keep "English or Malayalam" only on the *Photo-to-Order / Voice / NLQ* cards? → switch to **"English, Hindi or Malayalam"** so we don't shrink the audience but still nod to home turf.

## 4. "Built in Kerala" tagline
Use "Built in Kerala" as the heritage line (instead of "Built in India").

- **Hero trust line:** `No card needed · 30-minute onboarding · Works on any phone · Built in Kerala`
- **FinalCTA trust line:** `No card required · Cancel anytime · Built in Kerala`

---

## Files to edit (copy only)
- `index.html` — `<title>`, `<meta name="description">`, og:title, twitter:title, og:description, twitter:description
- `src/components/landing/sections/Hero.tsx` — eyebrow, subhead, trust line
- `src/components/landing/sections/FinalCTA.tsx` — trust line
- `src/components/landing/sections/Footer.tsx` — brand line
- `src/components/landing/sections/LedgeIntelligence.tsx` — Voice / NLQ language phrasing

## Out of scope
- No layout, color, component, or asset changes.
- No edits to app pages.
- "Kerala's FMCG" already removed from H1; H1 stays: `Orders. Payments. Stock. Invoices. Reports. One mobile app.`

## Confirm before I implement
1. **Audience phrasing** — use `super-stockists and FMCG owners` (my proposal) or just `FMCG super-stockists`?
2. **Co-Pilot languages** — keep just `English or Hindi` (deck wording), or `English, Hindi or Malayalam`? My recommendation: **English or Hindi** to stay aligned with the deck and pan-India positioning.

If you reply with no objections, I'll ship as-drafted with **English or Hindi** for Co-Pilot.
