

# Full Landing Page Audit + Overhaul

## Audit Summary

**What's wrong:**

1. **FinalCTA** — Still dark (`bg-midnight`), uses `bg-violet` CTA button, and has emojis in trust badges
2. **Footer** — Still dark (`bg-charcoal`) with dark borders — doesn't match the light app aesthetic
3. **Hero** — Placeholder mockup frame says "Dashboard Screenshot" (empty gray box). Trust chips use decorative "✦" symbols
4. **HowItWorks** — Three placeholder boxes say "Order Creation Screenshot" etc. (empty)
5. **TrustBar** — Placeholder logo bars (gray rectangles)
6. **Copy polish needed** — A few spots still feel slightly templated; ensure no emojis anywhere

## Changes

### 1. FinalCTA (`FinalCTA.tsx`) — Convert to Light

- Section bg: `bg-[#FAFAFA]` instead of `bg-midnight`
- Headline: `text-midnight` instead of `text-white`
- Subheadline: `text-graphite` instead of `text-silver`
- Primary CTA: `bg-ink text-white hover:bg-ink-light` (black, matches rest of page)
- Secondary CTA: `border border-fog text-midnight hover:border-midnight`
- Trust badges: `bg-white border border-fog text-graphite` instead of `bg-onyx text-silver`
- Remove all emojis from badges. New text: "Bank-grade encryption", "Works on any phone", "Data stored in India", "Go live today"

### 2. Footer (`Footer.tsx`) — Convert to Light

- Section bg: `bg-white` instead of `bg-charcoal`
- Border: `border-t border-fog` instead of `border-slate-border`
- Column headers: `text-midnight` instead of `text-white`
- Column links: `text-graphite hover:text-midnight` instead of `text-silver hover:text-white`
- Bottom bar border: `border-fog`
- Logo text: `text-midnight`
- Copyright: `text-lp-zinc`
- Social icons: `text-lp-zinc hover:text-midnight`

### 3. Hero (`Hero.tsx`) — Replace Placeholder with Built Dashboard Mockup

Replace the empty gray box with an inline dashboard mockup component (similar to `HeroSection.tsx`'s `DashboardMockup` but styled to match the light app aesthetic):
- Light bg mockup with browser chrome (subtle gray, not dark)
- Show sidebar nav, 4 KPI cards (glassmorphic white cards with subtle shadows), a bar chart, and recent orders table
- Use the app's actual colors: white bg, `border-fog`, emerald/amber/red status badges
- Keep the perspective tilt and shadow
- Remove "✦" from trust chips — use plain text: "Works offline", "Any Android or iPhone", "Setup in 5 minutes"

### 4. HowItWorks (`HowItWorks.tsx`) — Replace Placeholders with Inline Mockups

Replace the three empty placeholder boxes with simple inline UI mockups that suggest the actual screens:

- **Step 1** ("Order Creation"): A phone-frame mockup showing a simplified order form — dealer name dropdown, product list with quantities, total amount, "Place Order" button
- **Step 2** ("Dashboard"): A compact dashboard mockup — 4 small KPI tiles, a mini bar chart
- **Step 3** ("Stock Health"): A table-like mockup showing 3-4 product rows with colored health badges (green/amber/red)

Each mockup: `bg-white rounded-2xl border border-fog p-4` with realistic-looking UI elements built in JSX (not images).

### 5. TrustBar (`TrustBar.tsx`) — Replace Logo Placeholders

Replace the gray rectangle logo placeholders with realistic text-based company name placeholders:
- Show 6 company names in gray text (e.g., "FreshVale Foods", "SouthSpice", "GreenLeaf FMCG", "TamilNadu Retail", "MadhyaBharat Foods", "Prime Agencies") — these match testimonial companies
- Style: `text-lg font-semibold text-[#C4C4C4]` — subtle enough to read as "client logos" without needing actual images

### 6. Copy Cleanup (Minor)

- Hero trust chips: remove "✦" prefix
- FinalCTA badges: remove emojis, use plain text
- No other copy changes needed — previous overhaul already nailed the tone

## Files Changed

| File | Changes |
|---|---|
| `src/components/landing/sections/FinalCTA.tsx` | Light bg, ink CTA, no emojis in badges |
| `src/components/landing/sections/Footer.tsx` | Light bg, dark text, fog borders |
| `src/components/landing/sections/Hero.tsx` | Inline dashboard mockup replaces placeholder, remove "✦" from chips |
| `src/components/landing/sections/HowItWorks.tsx` | 3 inline UI mockups replace placeholder text |
| `src/components/landing/sections/TrustBar.tsx` | Company name text replaces gray rectangles |

No CSS token or Tailwind config changes needed — all existing tokens support this.

