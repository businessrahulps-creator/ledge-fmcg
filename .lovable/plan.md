# Mobile polish + speed: get to 10/10

Two audits are done — one screen-by-screen on the phone, one on why the app feels slower than before. Findings and the fix order below.

## Why it feels slower

The app loads your entire history before the main screens settle: about 10,000 records (820 orders with 3,260 items, 454 bills with 1,890 lines, 3,000+ stock entries, schemes, targets, claims). Worse, any single change — one new order, one payment — throws all of that away and reloads it, and every screen then recalculates its totals from scratch. Nothing broke; the data simply grew, so the same design that felt instant at 100 orders now drags at 820.

The money desk also reloads payments and credit notes on its own on top of that, without paging — past 1,000 payments it would silently stop showing the rest.

## Round 1 — Speed (biggest win first)

1. Load only what a screen needs, when it needs it. The home screen, Orders and the money desk get recent data first (last 90 days) and pull older records when the user filters back further, instead of everything up front.
2. Stop the full reload on every change. When one order or payment changes, update that one record in place rather than re-downloading the table.
3. Fix the money desk's own payment load so it pages properly and reuses what's already loaded instead of fetching twice.
4. Cut repeated recalculation: the home screen currently walks the full order list about ten separate times; do it in one pass.
5. Add a real loading shape to Insights and Performance (today they show nothing until the charts land).

Target: home screen usable in about a second on a phone, and recording a payment or booking an order feels instant instead of freezing the screen.

## Round 2 — Mobile, screen by screen

Rated against the Appllama skill's bar (thumb-reachable actions, no sideways scrolling, one visual system, every state designed).

Things that make it 8/10 today:

- Sideways-scrolling tables with no phone version: the Documents list on an order, the outstanding-bills list on a dealer, and all five report tabs. On a phone these need ~560px of width, so people scroll sideways to read a number.
- Buttons too small to hit reliably: row actions across the money desk, Stock, Schemes, Settings team list, Company logo, and the back arrow on dealer and salesperson pages run 26–40px. The bar is 44px.
- New Order has no fixed Save button — with several products added, Save scrolls off the bottom and people hunt for it. Quantity and price boxes are also 40px tall, slightly too small for thumbs.
- Recording a return opens a cramped scrolling pop-up for a two-step task; it should open as a full sheet like the payment box already does.
- Tab strips on Insights, Performance and Reports scroll sideways with the scrollbar hidden and no hint that more tabs exist.
- Icon-only actions in the money list ("…" menus) with no words next to them on the most money-critical rows.

Fix order: Reports tables and the two detail tables get proper phone cards → touch targets raised to 44px everywhere → sticky Save on New Order → return flow becomes a sheet → scroll hints on tab strips.

## Round 3 — One visual system

Small inconsistencies that read as "assembled from parts":

- Four corner radii used for the same kinds of things (pop-ups are 6px on Stock, 12px on orders). Lock one scale: cards 8, pop-ups 12, pills round, inputs 6.
- Two different empty-state components, two different status-pill implementations, three different ways of making numbers line up.
- Page titles hand-written on 11 screens instead of using the shared title component, so heading sizes drift.
- Dates written three different ways; one export prints the date in the browser's format instead of Indian format.
- Two stray emoji in the interface (order success message, Help page).

## Round 4 — Verify

Each round ends with: checks and tests pass, then a signed-in run through the demo account on a phone-sized screen and on desktop — home, Orders, New Order, an order page, money desk, returns, Stock, Dealers, Reports — looking for anything that jumps, truncates, or can't be tapped.

## Not in scope

Rebuilding as a native app, offline mode, or any change to how money is calculated, bills are raised, or stock moves. This is speed and presentation only.

## Technical notes

- **Data layer**: introduce a window parameter on the heavy fetches in `DataContext.fetchAll` (`orders`, `invoices`, `order_lines`, `invoice_lines`, `claims`) defaulting to 90 days, with an explicit "load older" path driven by the date filters on Orders/Billing/Reports. Realtime handlers in `DataContext.tsx:404-454` switch from table-wide `safeRefetch` to payload-driven single-row upsert into the existing arrays, keeping the 250ms debounce only for burst inserts.
- `useCollections.ts:39-53` gets `fetchAllChunked` paging and reads invoices from context rather than refetching; `useReceivables` memoises across Billing/Command mounts.
- `Dashboard.tsx:104-218` collapses ~10 full-array passes into one reducer keyed by period; same treatment for `OverviewTab`/`ProductsTab`/`PeopleTab` nested loops.
- Skeletons: `Command.tsx:74` and `Performance.tsx:134` render `ListPageSkeleton`-shaped placeholders.
- Mobile: add card fallbacks mirroring the Orders/Billing dual-render pattern to `OrderDetail.tsx:668-706`, `DealerDetail.tsx:302`, and the five `src/components/reports/*`; raise icon buttons to `h-11 w-11` (`Billing.tsx:358`, `Stock.tsx:502-599`, `Settings.tsx:330-360`, `Schemes.tsx:635-644`, `Company.tsx:271`, `DealerDetail.tsx:131,668`, `SalespersonDetail.tsx:60`); sticky footer CTA in `NewOrder.tsx:752`; Claims `NewClaimDialog` → `Sheet`; edge-fade affordance utility for `scrollbar-hide` strips.
- System: radius tokens applied across dialogs/cards/pills; `EmptyState` folded into `EmptyCard`; bill-status pills routed through `StatusBadge`; a single `Money` text class replacing the three tabular-numeral mechanisms; `PageHeader` adopted on the 11 hand-rolled headers; all dates through `formatIndianDate` (fixes `Command.tsx:341`).
