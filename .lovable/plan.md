# Widen Ledge's positioning: from "FMCG" to "distribution businesses"

## Recommendation

Widen it, but not to "all businesses". Ledge is built around dealers, field salesmen, godowns, credit limits, schemes, dispatch and GST bills. A salon, a restaurant or a small shop doesn't need any of that. They would sign up, feel lost and leave. If we say "for every business", we end up competing with Vyapar on cheap billing, which is its strongest ground.

The better move is **"for every business that sells through dealers and a field team"**: manufacturers, distributors, super-stockists and wholesalers. FMCG stays the lead example, and building materials, agri-inputs, pharma distribution, auto parts, electricals and consumer durables sit next to it. The About page already names most of these. The home page doesn't yet.

## Copy rewrite (home page)

**Top banner label**
- Now: "The Operating System for India's FMCG Businesses"
- New: "The operating system for India's distribution businesses"

**Main headline** (keep the current one; it's strong and says nothing about industry)
- "Orders. Payments. Stock. Invoices. Reports. One mobile app."

**Supporting line**
- New: "Built for Indian manufacturers, distributors and wholesalers who sell through dealers and a field team. FMCG, building materials, agri-inputs, pharma, auto parts, electricals. Recover the 5–10% that quietly leaks between your godown and your field."
- Also removes "Works offline", because offline mode is currently paused.

**New "Who it's for" strip** (placed under the trust bar)
- Heading: "If you sell through dealers, Ledge fits."
- Six industry chips: FMCG, Building materials, Agri-inputs, Pharma distribution, Auto parts, Electricals & durables.
- Line under them: "Not a shop billing app. Ledge is for businesses with dealers, salesmen and stock in more than one place."

**Problem / Features / Why Ledge sections**
- Swap FMCG-only words for neutral ones: "your products" instead of "your SKUs of biscuits", "your dealers" instead of "your retailers" where it fits. Keep the scheme and claim features, since they apply across these industries.

**Final call-to-action**
- New: "Run your distribution business from one app. Start free for 30 days."

**Page title and search description**
- Title: "Ledge — The operating system for India's distribution businesses"
- Description: "Orders, dealers, stock, GST bills and payments in one mobile app for Indian manufacturers, distributors and wholesalers. Start free for 30 days."

## Also updated
- About page, the file that tells AI search tools what Ledge is, and project memory (positioning note), so they all say the same thing.
- Testimonials stay as they are, with no invented industries added.

## Not changing
- The app itself, pricing, design and layout (apart from the one new strip).

## Technical details
- Files: `Hero.tsx`, `Index.tsx` (SeoHead), new `sections/WhoItsFor.tsx` using the existing `lp-*` primitives and semantic tokens, plus copy passes on `Problem.tsx`, `Features.tsx`, `WhyLedge.tsx`, `FinalCTA.tsx`, `AboutUs.tsx`, `index.html` meta, `public/llms.txt`, and `mem://marketing/positioning`.
- Run the landing design-system tests after the change.
