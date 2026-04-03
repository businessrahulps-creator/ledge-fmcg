

# Landing Page Color + Copy Overhaul

## Summary

Apply two changes across 12 files: (1) shift the color scheme from dark/violet to light/clean matching the app's aesthetic, and (2) warm up the copy tone to feel founder-to-founder.

## CSS Token Changes

**File: `src/index.css`** — Add new tokens to `:root`:
```
--ink: #111111;
--ink-light: #333333;
--accent: #4F46E5;
--accent-wash: #EEF2FF;
```

**File: `tailwind.config.ts`** — Add color mappings:
```
ink: { DEFAULT: "var(--ink)", light: "var(--ink-light)" },
"accent-indigo": "var(--accent)",
"accent-wash": "var(--accent-wash)",
```

## Section-by-Section Changes

### 1. Navbar (`Navbar.tsx`)
**Color:** Scrolled state → `bg-white/95 backdrop-blur-md border-b border-fog`. Logo border + text → `border-midnight` / `text-midnight`. Nav links → `text-graphite hover:text-midnight`. CTA → `bg-[#111] text-white hover:bg-[#333]`. Mobile hamburger icon → `text-midnight`. Mobile sheet stays dark (fine for overlay).

### 2. Hero (`Hero.tsx`)
**Color:** `bg-white` instead of `bg-midnight`. All text → dark (`text-midnight`, `text-graphite`). Primary CTA → `bg-[#111] text-white hover:bg-[#333]`. Secondary → `border border-fog text-midnight hover:border-midnight`. Trust chips → `bg-[#F5F5F5] text-graphite`. Mockup frame → `bg-[#FAFAFA] border border-fog`, remove violet glow/border, use subtle gray shadow.

**Copy rewrite:**
- H1: `"You shouldn't have to call 6 people to know how today went."`
- Sub: `"Your salespeople place orders on their phone. You see every order, every dealer, every rupee — live on your dashboard. Works offline. Replaces your WhatsApp groups, Excel sheets, and nightly phone calls."`
- Primary CTA: `"Try Ordra Free"`
- Secondary: `"Watch a 2-min demo →"`
- Trust chips: `"Works offline"` · `"Any Android or iPhone"` · `"Setup in 5 minutes"`

### 3. TrustBar (`TrustBar.tsx`)
**Color:** Keep `bg-[#FAFAFA]`. Quote mark → `text-[#111]` instead of `text-violet`. No other changes.

### 4. Problem (`Problem.tsx`)
**Color:** Card icons → `text-[#4F46E5]` instead of `text-violet`. Closing line → `text-[#4F46E5]` instead of `text-violet`. No copy changes — this section is already excellent.

### 5. HowItWorks (`HowItWorks.tsx`)
**Color:** Step badges → `bg-[#EEF2FF] text-[#4F46E5]` instead of `bg-violet-wash text-violet`. No copy changes.

### 6. Features (`Features.tsx`)
**Color:** Section bg → `bg-[#FAFAFA]` instead of `bg-midnight`. Cards → `bg-white border border-fog` instead of dark. Text → `text-midnight` and `text-graphite`. Icons → `text-[#4F46E5]`. Hover → `hover:border-[#D4D4D8]`.

**Copy rewrite:**
- Headline: `"What your team actually gets."`
- Subheadline: `"Every feature exists because an FMCG founder asked for it."`
- Card 1 title: `"Your business, at a glance"` — desc: `"Open Ordra and see four numbers: today's revenue, orders placed, pending dispatches, deliveries completed. Filter by day to spot patterns — maybe Tuesdays are slow in your Pune territory. Now you know, and you didn't have to call anyone."`
- Card 2 title: `"Orders that track themselves"` — desc: `"Your salesperson selects the dealer, picks products from your rate list, confirms pricing — done in under a minute. Every order moves through Placed → Dispatched → Delivered with clear status badges. You see it happen live."`
- Card 3 title: `"Every dealer, every salesperson — one tap"` — desc: `"Tap a dealer and see their region, last 20 orders, outstanding payments, and lifetime value. Tap a salesperson and see their territory, today's orders, and whether they've actually been active this week. No more keeping this in your head."`
- Card 4 title: `"Stock by godown, not guesswork"` — desc unchanged (already great)
- Card 5 title: `"Payments the way India pays"` — desc: `"Cash, UPI, cheque, credit — tracked how your business actually works. See what's been paid, what's partial, what's overdue at a glance. Replace the separate khata you've been maintaining since 2016."`
- Card 6 title: `"No signal? No problem."` — desc: `"Your salesperson is between Indore and Ujjain. Zero signal. They open Ordra, place the order, it saves locally. The moment connectivity returns — auto sync. No data lost. No order missed. This isn't a feature we bolted on. It's the foundation."`

### 7. WhyOrdra (`WhyOrdra.tsx`)
**Color:** Left border → `border-[#111]` instead of `border-violet`. No copy changes (already warm and specific).

### 8. Testimonials (`Testimonials.tsx`)
**Color:** Decorative quote mark → `text-[#111]` instead of `text-violet`.
**Copy:** Headline → `"Don't take our word for it."` (warmer than "Our product speaks for itself")

### 9. Pricing (`Pricing.tsx`)
**Color:** Highlighted card border → `border-2 border-[#111]` instead of `border-violet`. "Most Popular" badge → `bg-[#111]` instead of `bg-violet`. Growth CTA → `bg-[#111] text-white hover:bg-[#333]`. WhatsApp link → `text-[#4F46E5]` instead of `text-violet`.

### 10. FinalCTA (`FinalCTA.tsx`)
**Stays dark.** Only change: Primary CTA keeps `bg-violet` (this is the ONE section where violet accent is allowed — it pops against the dark bg). Trust badge bg → keep `bg-onyx`. No copy changes.

### 11. Footer (`Footer.tsx`)
**No changes.** Dark footer is standard and appropriate.

## Files Changed

| File | Action |
|---|---|
| `src/index.css` | Add 4 CSS tokens |
| `tailwind.config.ts` | Add 3 color mappings |
| `src/components/landing/sections/Navbar.tsx` | Light theme on scroll, dark text/logo, black CTA |
| `src/components/landing/sections/Hero.tsx` | White bg, dark text, new copy, black CTA, light mockup |
| `src/components/landing/sections/TrustBar.tsx` | Quote mark color change |
| `src/components/landing/sections/Problem.tsx` | Icon + closing line color to indigo |
| `src/components/landing/sections/HowItWorks.tsx` | Step badge colors to indigo wash |
| `src/components/landing/sections/Features.tsx` | Light bg, white cards, dark text, indigo icons, new copy |
| `src/components/landing/sections/WhyOrdra.tsx` | Border color to ink |
| `src/components/landing/sections/Testimonials.tsx` | Quote mark color, new headline |
| `src/components/landing/sections/Pricing.tsx` | Badge/border/CTA from violet to ink, WhatsApp link to indigo |
| `src/components/landing/sections/FinalCTA.tsx` | Keep dark, no changes needed |
| `src/components/landing/sections/Footer.tsx` | No changes |

