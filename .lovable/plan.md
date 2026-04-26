## Audit findings

The landing page currently leans on **"distribution"** and **"FMCG-only"** language. Your real positioning is broader and sharper:

> **Built for ambitious Indian business owners who run both factory and field operations.**

Below are the exact lines that conflict with this positioning and how I'll rewrite them. Visuals, layout, sections, and structure stay untouched — copy only.

---

### 1. `src/components/landing/sections/Hero.tsx`
- **Eyebrow** (line 32): `The Operating System for Indian FMCG`
  → **`The Operating System for Factory + Field`**
- **Headline** (lines 40-42): `Run your distribution / the way it deserves.`
  → **`Run your factory and field / the way they deserve.`**
- **Sub-headline** (lines 50-51): keep the "5–10% leak" line but reframe the noun:
  → `Orders, payments, stock, GST invoices, production — one mobile app. Recover the **5–10% that leaks every year between your factory and your field.**`

### 2. `src/components/landing/sections/Problem.tsx`
- **Eyebrow** (line 32): `The old way` — keep.
- **Headline** (lines 38-41): `Distribution is hard. / Your software shouldn't be.`
  → **`Running both sides is hard. / Your software shouldn't be.`**
- **Card 4 description** (line 25): `Tally, SAP — built for desktops. Your field team gave up by week two.` — keep (already speaks to field).

### 3. `src/components/landing/sections/HowItWorks.tsx`
- Step 01 title (line 26): `Field team places an order in 60 seconds.` — keep (already correct).
- No other changes.

### 4. `src/components/landing/sections/Outcome.tsx`
- Closing line (line 59): `Same team. Same geography. **More throughput. Better cash flow.**`
  → **`Same factory. Same field. More throughput. Better cash flow.`**

### 5. `src/components/landing/sections/Founder.tsx`
- Founder note (lines 48-52) — rewrite to match positioning:
  > "I built Ledge because I watched too many Indian business owners juggle a factory on one side and a field team on the other — with software that ignored both.
  >
  > Your team is in the field right now. Your floor is running. Your business deserves a system that keeps up — built in India, designed for the way you actually work.
  >
  > **Start free. If it's not running your business in 30 days, walk away.**"

### 6. `src/components/landing/sections/Testimonials.tsx`
- Section eyebrow stays "From the field" (line 34) — fits.
- Headline (line 37): `Owners who stopped guessing.` — keep.
- Roles: keep diversity (Owner, Operations Head, Warehouse Lead, Senior Sales Executive) — already covers both sides. No change.

### 7. `src/components/landing/sections/TrustBar.tsx`
- Stat 4 (line 16): `{ value: "Zero", label: "Stockouts after Ledge" }` — keep.
- Stat 1 label (line 13): `Gained daily, per salesperson` — broaden to `Gained daily, per field rep`.
- Stat 2 label (line 14): `Freed weekly for owners` — keep.
- Logos (lines 3-10): keep — they already read as a mix of FMCG/agencies.

### 8. `src/components/landing/sections/FinalCTA.tsx`
- Eyebrow (line 31): `Your business is ready` — keep.
- Headline (lines 38-40): `Ready to run your business / the way it deserves?` — keep (already broad).
- Sub-headline (lines 47-49): keep.

### 9. `src/components/landing/sections/Pricing.tsx`
- Plan taglines reference "spreadsheet" and "teams" — already neutral. **No changes.**

### 10. `index.html` (SEO + social cards) — lines 6, 18, 29-32
- `<title>`: `Ledge — FMCG Sales Management`
  → **`Ledge — The Operating System for Factory + Field`**
- `<meta name="description">` and `og:description` / `twitter:description`:
  > Old: *"Ledge — FMCG Sales Order Management for Indian Businesses. Manage distributors, orders, dispatch & payments."*
  > **New: *"Ledge runs your factory and your field on one mobile app — orders, stock, payments, GST, production. Built for ambitious Indian business owners."***
- `og:title` / `twitter:title`: match new title.

### 11. Memory update
- Update `mem://marketing/positioning` to record the new core line: *"Built for ambitious Indian business owners who run both factory and field operations — not just distribution, not just FMCG."*
- Update `mem://index.md` Core to replace the "Indian FMCG distribution" phrasing.

---

### What I am NOT changing
- All visuals, layouts, gradients, sections, components, routes, illustrations.
- Pricing structure, testimonials, founder photo.
- The word "FMCG" inside testimonial company names and on the in-app shell — those are not positioning statements.
- The dashboard mockup, How-It-Works flow, brand palette — all stay.

### Verification after edits
- `tsc --noEmit` to confirm no type breakage.
- Visual spot-check that no truncated/overflowing headlines appear at 1202px viewport.

Ready to apply these copy edits on approval.