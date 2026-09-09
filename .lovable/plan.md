# Give the app a clear pecking order

Right now every screen is white cards on bone, one text size, one weight. Nothing tells the eye
what matters, so you read everything. The fix is not "more colour everywhere" — it is a small,
strict set of rules applied the same way on every screen.

## What the review panel pushed back on

The first draft said "dark gradient band" and left it there. Four corrections went in:

- **A gradient that draws attention must never sit behind a number you have to read.** The band
  is dark Midnight; the gradient is a slow, low-contrast wash across it, deepest at the far edge,
  never under the figures.
- **One dark band per screen, maximum.** Two dark blocks and the hierarchy collapses again.
- **Colour cannot be the only signal.** Every red or terracotta state also carries a word and an
  icon, so it survives poor screens, sunlight and colour blindness.
- **Density, not just size.** Half the flatness comes from equal spacing everywhere. Important
  blocks get more air around them; supporting detail gets tighter.

## The rules (the whole system)

1. **One hero per screen.** The single most important number sits in a dark Midnight band with a
   soft gradient wash and white text. Nothing else on that screen may be that loud.
2. **Three levels of type, no in-between.** Hero number (Playfair, large) / section label (small
   caps, muted, wide-tracked) / body and detail (small, muted).
3. **Colour means one thing.** Green = received or on track. Terracotta = needs attention. Red =
   overdue or blocked. Grey = neutral fact. Never decorative, always paired with a word.
4. **Facts look like facts, inputs look like inputs.** Read-only details lose their box and become
   plain label-over-value; only genuinely editable fields keep a bordered field.
5. **One primary button per screen.** Everything else is quiet.
6. **Space carries rank.** Generous space above and below the hero; supporting sections sit
   closer together.

## Phase 1 — The order page

- Dark gradient money band at the top: **Total**, **Received**, **Balance** across it, balance in
  green when clear and terracotta when money is still due, with order number and dealer inside
  the band so the page identifies itself in one glance.
- Directly under it, the order's journey as one horizontal track: Booked, Dispatched, Billed,
  Delivered, Paid — done steps solid, current step highlighted, remaining steps grey, each with
  its date when known.
- Dealer, sales person, date, payment mode, item count become quiet plain-text facts in a single
  strip instead of four identical boxes.
- Items, Documents and History keep their content exactly, re-ranked to read as supporting detail.
- Buttons: Record payment / Dispatch & bill is the one loud action; Invoice, WhatsApp, Record
  return and Save go quiet.
- On a phone the band stacks to two rows (Total, then Received and Balance) and the journey track
  scrolls horizontally with the current step in view.

## Phase 2 — My Business (Insights)

- "What needs your attention" moves to the very top as the loudest block, ranked by money at
  stake, using the same red/terracotta meanings.
- Net position becomes the dark hero band, identical in build to the order page.
- The four KPI tiles get a strict shape: label, big number, one comparison line — coloured left
  edge only when the number is bad.
- Charts and lists drop to quiet surfaces so they stop competing with the figures.
- Zero and no-data states get a visibly different, calmer treatment so an empty demo period never
  looks like a broken screen.

## Phase 3 — Dashboard and Orders list

- Dashboard gets the same hero band and attention block, so the two overview screens read as one
  product.
- Orders list: amount and balance become the dominant column, status colours follow the shared
  meanings, and scanning runs dealer → money → status.

## Phase 4 — Everything else

Stock, Dealers, Sales Team, Targets, Schemes, Money to Collect, Returns: same rules, no new
layouts, only re-ranking.

## How we judge each phase

- Squint at the screen: exactly one thing should survive.
- Every state readable at arm's length on a phone in daylight.
- Text contrast at or above 4.5:1, including white text on the darkest and lightest points of
  the gradient.
- No information, field, number or action removed anywhere.

## What does not change

Every field, number, button and action stays. No business logic, no data, no routes. The public
website keeps its own separate look. Printed and PDF output stays ink-light — the dark band
renders as a plain rule, never a solid block of ink.

## Technical notes

- App-scoped tokens in `src/index.css` only: `--gradient-hero` (Midnight base with a low-contrast
  wash), `--surface-quiet`, and rank utilities `.rank-hero` / `.rank-section` / `.rank-quiet`.
  `.lp-theme` and landing tokens untouched.
- Two new shared primitives in `src/components/ui/`: `HeroBand` and `JourneyTrack`. Everything
  else extends what exists — `KpiStrip`, `SignalCard`, `StatusBadge` gain a `tone`/rank prop
  rather than gaining parallel copies.
- Status colour and wording mapping stays centralised in `StatusBadge`, so one status never means
  two things in two places.
- Files by phase: `src/pages/OrderDetail.tsx`; then `src/pages/Command.tsx` and
  `src/components/command/*`; then `src/pages/Dashboard.tsx` and `src/pages/Orders.tsx`; then the
  remaining pages.
- Print: `src/styles/command-print.css` and the `@react-pdf` documents get the band flattened to
  a rule so exports stay legible and cheap to print.
- Per phase: typecheck, full Vitest suite, plus authenticated desktop and phone screenshots of
  every touched screen before starting the next phase. A contrast check on the band ships with
  Phase 1 as a test so later colour edits cannot silently break it.

## Risks

- Dark bands can look heavy if they creep beyond one per screen — the rule is enforced by having
  a single `HeroBand` component and reviewing each screen's screenshot.
- Re-ranking touches many pages; phases are shippable independently, so we can stop after any
  phase and the app stays coherent.
