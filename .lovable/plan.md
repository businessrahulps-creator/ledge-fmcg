# Give the app a clear pecking order

Right now every screen is white cards on bone, one text size, one weight. Nothing tells the eye
what matters, so you read everything. The fix is not "more colour everywhere" — it is a small,
strict set of rules applied the same way on every screen.

## The rules (the whole system, in five lines)

1. **One hero per screen.** The single most important number gets a dark Midnight band with a
   soft Midnight-to-Terracotta gradient wash and white text. Nothing else on that screen may be
   that loud.
2. **Three levels of type.** Hero number (large, Playfair) / section titles (small caps, muted)
   / body and labels (small, muted). No in-between sizes.
3. **Colour means something.** Green = money received or on track. Terracotta = needs attention.
   Red = overdue or blocked. Grey = neutral facts. Colour is never decoration.
4. **Facts look like facts, inputs look like inputs.** Read-only details lose their box and
   become plain label-over-value; only genuinely editable fields keep a bordered field.
5. **One primary button per screen.** Everything else is quiet.

## Phase 1 — The order page

- A dark gradient money band at the top: **Total**, **Received**, **Balance** side by side,
  balance in green when clear and terracotta when money is still due, with the order number and
  dealer name sitting inside the band.
- Directly under it, the order's journey as a single horizontal track: Booked, Dispatched,
  Billed, Delivered, Paid — completed steps solid, current step highlighted, remaining steps grey.
- Dealer, sales person, date, payment mode, items count become quiet plain-text facts in one
  strip, not four look-alike boxes.
- Items, Documents, History stay exactly as they are in content — just re-ranked visually so
  they read as supporting detail.
- Buttons: Record payment / Dispatch & bill becomes the one loud action; Invoice, WhatsApp,
  Record return, Save become quiet.

## Phase 2 — My Business (Insights)

- "What needs your attention" moves to the very top of the page as the loudest block, ranked
  by money at stake, using the same red/terracotta meanings.
- Net position becomes the dark gradient hero band, matching the order page.
- The four KPI tiles get a strict layout: label, big number, one short comparison line — and a
  coloured left edge only when the number is bad.
- Charts and lists below drop to quiet surfaces so they stop competing with the numbers.

## Phase 3 — Dashboard and Orders list

- Dashboard gets the same hero band and attention block, so the two "overview" screens feel
  like one product.
- Orders list: amount and balance become the visually dominant column; status colours follow
  the same meanings; row scanning is left-to-right, dealer then money then status.

## Phase 4 — Everything else

Stock, Dealers, Sales Team, Targets, Schemes, Money to Collect, Returns: apply the same five
rules. No new layouts, only re-ranking.

## What does not change

Every field, number, button and action stays. No business logic, no data, no routes. The public
website keeps its own separate look.

## Technical notes

- Add hierarchy tokens to `src/index.css` under the app scope only: `--gradient-hero`
  (Midnight → Terracotta wash), `--surface-quiet`, and text-rank utilities
  (`.rank-hero`, `.rank-section`, `.rank-quiet`). Landing `.lp-theme` untouched.
- New shared primitives in `src/components/ui/`: `HeroBand` (dark gradient money band) and
  `JourneyTrack` (order lifecycle steps). Reuse existing `KpiStrip`, `SignalCard`, `StatusBadge`
  rather than inventing parallel components; extend them with a `tone` rank instead.
- Status colour mapping is centralised in `StatusBadge` so green/terracotta/red keep one meaning
  app-wide.
- Screens touched per phase: `src/pages/OrderDetail.tsx`; then `src/pages/Command.tsx` plus
  `src/components/command/*`; then `src/pages/Dashboard.tsx` and `src/pages/Orders.tsx`; then the
  remaining pages.
- Verification each phase: typecheck, existing Vitest suite, and authenticated desktop + mobile
  screenshots of the touched screens before moving on.
