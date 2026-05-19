# My Business — Follow-Up Brief

Captured during the /command overhaul audit. These were intentionally deferred from the
current 10-phase build so we can ship the visual + UX rebuild without scope creep.
Use this file as the brief for the next prompt.

## Deferred opportunities

### 1. Secondary sales velocity card
- Source: `secondary_sales` table (already populated by the sell-through entry flow).
- Today: "Top SKU by revenue" only reflects primary (dealer-billed) sales.
- Build: per-SKU sell-through velocity (units/day) on Products tab, side-by-side with
  primary revenue. Flag SKUs where primary >> secondary (channel stuffing risk).

### 2. Activity log "what changed today" feed
- Source: `activity_log.summary` filtered by current `company_id`.
- Today: not surfaced anywhere on /command.
- Build: collapsible feed on Overview ("Today" section) showing the last 10 entries —
  order placed, dealer added, target updated, scheme fired, etc. One line each, with
  `created_at` relative time + actor name + deep link to the entity.

### 3. Per-godown revenue split
- Source: `orders.godown_id` → `godowns.name`.
- Today: ignored entirely.
- Build: small donut + table on Overview ("By godown") showing dispatched revenue per
  warehouse. Click slice → /orders?godown=ID. Skip when only one godown exists.

### 4. Invoiced vs ordered card
- Source: `invoices.grand_total` (sum) vs `orders.total` (sum) for the period.
- Today: never compared.
- Build: revenue recognition gap card on Overview. Shows ₹ ordered, ₹ invoiced, and the
  delta with plain-English explanation. Requires confirming the recognition memo
  (`mem://logic/revenue-recognition`) before implementation.

### 5. Real WhatsApp / SMS reminder dispatch
- Source: currently `shareWhatsApp.ts` only generates `wa.me` share URLs.
- Today: "Remind" buttons (from Phase 5/6 of this round) will open WhatsApp Web with
  pre-filled text — owner still has to tap send.
- Build: server-side dispatch via WhatsApp Business API (or BSP). Needs vendor
  selection, secret, and an edge function. Track delivery state on the dealer row.

## Lower-priority items also flagged

- **Aging-bucket migration trend** — `dealer_aging_state.last_worst_bucket` already
  computed server-side, never read. Could plot "dealers moving 30→60→90+" over time.
- **Stock-out × top-revenue cross signal** — partly addressed in Phase 7 (Stock-out
  risk card), full cross-signal alerting comes later.
- **Server-side signal precomputation** — current `deriveSignals` runs client-side over
  all orders. Fine up to ~5k dealers; beyond that, move to a materialised view +
  edge function.
- **Polished date-range calendar** — current `<Input type="date">` is functional but
  not branded. Swap for `react-day-picker` range mode in the same look as DealerDetail.
- **Scheme lift analysis** — measured savings is shown, but not whether the scheme
  actually increased volume vs the pre-scheme baseline.

## Out of scope (do not build without explicit ask)

- Mutations to `auth`, `storage`, `realtime`, `vault`, or `supabase_functions` schemas.
- Any change to DataContext, domain hooks, or RLS policies.
- Touching any page outside `/command` to add new surfaces.
