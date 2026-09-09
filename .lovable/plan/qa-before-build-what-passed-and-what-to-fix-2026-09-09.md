# QA before build — what passed and what to fix

## Checks run

| Check | Result |
| --- | --- |
| Type check | Pass |
| Tests (22 files, 266 tests) | Pass |
| Build | build OK (latest entry) |
| Page errors — Dashboard, My Business, Order page, desktop + phone | None |
| Lint | **Fails to start** — bad rule setting |

Three issues found. All are small, and none touch business logic.

## 1. Lint is broken (blocks a clean build gate)

`eslint.config.js` sets `"no-console": ["warn", { allow: [] }]`. An empty
allow-list is invalid, so ESLint refuses to run at all and the whole
codebase currently goes unchecked.

Fix: change it to `"no-console": "warn"`. Then run lint once and, if any new
console warnings surface in files touched recently, route them through the
existing `logError` helper as we already do elsewhere.

## 2. An order can say "Paid" while showing money still to collect

On order `ABD-2026-0552` the dark band shows a green **Paid** chip, the
balance figure reads ₹18,000 to collect, and the journey step reads
**Paid — Not yet**. Three statements, two of them contradicting each other.
The chip comes from the old order-level payment field; the balance and the
journey come from actual receipts.

Fix: when an order has no bill yet, the band shows the delivery chip only.
Once a bill exists, the money chip is derived from receipts (Paid / Part paid
/ Not paid yet) so the chip, the balance figure and the journey always agree.
No data changes, no change to how payments are recorded.

## 3. On a phone, the item name in an order is unreadable

In the Items row the product name collapses to "Aq…" because the quantity and
rate boxes take fixed width. Fix: on phones the product name sits on its own
line above quantity and rate, so the full name is always visible. Desktop
stays exactly as it is.

## Minor, optional

- The "This Month · Sept 2026" pill stretches the full width on a phone;
  it should hug its text.
- Empty space under the week sparkline inside the dashboard band can be
  tightened slightly.

## Technical notes

- Files touched: `eslint.config.js`, `src/pages/OrderDetail.tsx` (chip
  selection only), `src/components/orders/*` item row markup,
  `src/pages/Dashboard.tsx` (pill class).
- Nothing in the payment, dispatch, billing or return flows changes.
- After the fixes: re-run type check, tests, lint, and re-capture the order
  page and dashboard at desktop and phone widths.
