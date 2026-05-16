
# Landing Copy Refresh — Aligned to Pitch Deck

The deck has tighter, more confident framing than the current landing copy. This pass adopts the deck's voice across the page. **Copy only — no layout, color, component, or asset changes.**

## Hero
- **Eyebrow:** `The Operating System for Kerala's FMCG Businesses`
  (current: "The Operating System for Factory + Field")
- **Headline (H1):** `Orders. Payments. Stock. Invoices. Reports. One mobile app.`
  *Alt option A:* `One mobile app for orders, payments, stock and reports.`
  *Alt option B (more emotive, deck-aligned):* `Run your distribution business with total clarity.`
- **Subhead:** `Built for distributors and FMCG owners in Kerala. Mobile-first. Works offline. Recover the 5–10% revenue that quietly leaks between your factory and your field — every year.`
- **Primary CTA:** `Start Free for 30 Days` · **Secondary:** `See how it works`
- **Trust line:** `No card needed · 30-minute onboarding · Works on any phone · Built in India`

> Recommendation: ship option **A** as H1 (it mirrors the deck's product-line drumbeat and is the strongest scroll-stopper). Keep "Run your factory…" retired.

## Problem section
- **H2:** `The Old Way Is Bleeding You Dry`
- **Sub:** `You're running on yesterday's data. Your competitors aren't.`
- **4 cards** (titles + one-liners from deck):
  - Lost Orders — *WhatsApp chits. Half get lost.*
  - Payment Chaos — *Cash, UPI, cheque. No single truth.*
  - Blind Stock — *Empty shelf? You find out last.*
  - Excel Nights — *Two days to build one report.*

## Stakes strip (TrustBar / numbers band)
Use the deck's "silent leak" stats:
- `2–3 hrs` — Wasted daily per salesperson, on paperwork instead of selling
- `5–10%` — Revenue lost to missed orders, wrong schemes, late collections
- `₹10L–₹1Cr` — Quietly gone every year. Silent. Invisible. Until it's too late.

## Why Ledge (comparison)
- **H2:** `Every tool exists. None built for you.`
- Crossed-out chips: `Tally`, `Zoho Books`, `Vyapar / Khatabook`
- Ledge column bullets:
  - Mobile-first. Offline-ready. Any phone.
  - Basics in 30 minutes. No trainer.
  - Schemes, warehouses, credit control — built in.
  - No desktop. No IT. No excuses.

## Features ("Simple Tools. Extraordinary Results.")
Rename cards + one-liners to deck wording:
- **Dealer Intelligence** — Full history, credit & behaviour, instant.
- **Stock Health** — Green, amber, red — before problems hit.
- **Schemes & Targets** — Auto-tracked. Always accurate.
- **Team Performance** — Every rep's orders and targets, live.
- **GST Automation** — Invoices, estimates, credit notes — one tap.
- **Returns & Claims** — Handled cleanly. No arguments.

## Outcome ("Before & After Ledge")
- **H2:** `Before & After Ledge`
- Before column: 2–3 days per report · Call 5 people to check stock · Chase payments on WhatsApp · No idea who's performing.
- With Ledge column: Live dashboard for orders, revenue, payments · 5 reports ready instantly · Any report in 60 seconds · Full visibility, zero chasing.
- Outcome chips: `80+ hrs recovered/month` · `80% admin eliminated` · `8–12% sales uplift`

## Ledge Intelligence (AI)
- **Eyebrow:** `AI · Launching in 3 months · Founding members get early access free`
- **H2:** `Ledge Co-Pilot`
- **Sub:** `Ledge thinks. You lead.`
- 4 capability cards:
  - **Natural Language Queries** — Ask in English or Malayalam. Get instant answers.
  - **Voice Order Entry** — Speak the order. Done in 20 seconds.
  - **Photo-to-Order** — Photograph a chit. Ledge fills it instantly.
  - **Smart Scheme Suggestions** — AI tells you who'll buy, before you pitch.

## Pricing
- **H2:** `The offer that makes saying no feel irrational.`
- Price line: `₹2,500 / month` · sub: `Competitors charge ₹5,000–₹15,000+. Ledge delivers more for 50–80% less.`
- Annual nudge: `Commit 1 year → pay only 10 months. Two months free.`
- Value bullets ("What ₹2,500 actually buys you"):
  - 80+ hrs saved/month → ₹40,000+ recovered labour cost
  - ₹10L–₹1Cr/year recovered from silent leaks
  - ₹10K–₹20K/month saved on accountant outsourcing (auto GST)
  - AI Co-Pilot — free early access for founding members

## Final CTA
- **H2:** `One app. Every role. Total clarity.`
- **Sub:** `Start free for 30 days. No card needed. Setup in 30 minutes.`
- Primary: `Start Free Trial` · Secondary: `Talk to founder · +91 81380 84689`

## Footer tagline
`Orders. Payments. Stock. Invoices. Reports. One effortless mobile experience.`

---

## Files to edit (copy only)
- `src/components/landing/sections/Hero.tsx`
- `src/components/landing/sections/Problem.tsx`
- `src/components/landing/sections/TrustBar.tsx`
- `src/components/landing/sections/WhyLedge.tsx`
- `src/components/landing/sections/Features.tsx`
- `src/components/landing/sections/Outcome.tsx`
- `src/components/landing/sections/LedgeIntelligence.tsx`
- `src/components/landing/sections/Pricing.tsx`
- `src/components/landing/sections/FinalCTA.tsx`
- `src/components/landing/sections/Footer.tsx`
- Update SEO `<title>` / meta description in `index.html` to match Hero.

## Out of scope
- No new sections, components, images, colors, or layout edits.
- No changes to app pages or backend.
- Founder section and Testimonials text stay as-is unless you want them refreshed too.

## Open questions before I implement
1. **H1 pick:** option A (`Orders. Payments. Stock. Invoices. Reports. One mobile app.`) or option B (`Run your distribution business with total clarity.`)? My recommendation: **A**.
2. **Geographic framing:** keep deck's "Kerala's FMCG businesses" in the eyebrow, or broaden to "India's FMCG distributors"? Deck says Kerala — I'll keep Kerala unless you say otherwise.
3. **AI language pair:** deck says "English or Hindi" — for Kerala framing, should it be **English or Malayalam**? I've drafted it as Malayalam.
