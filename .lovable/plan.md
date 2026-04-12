

# Scalable Order Selector for Billing

## Problem
The order picker in "New Document" is a plain dropdown listing ALL orders. At 500+ orders/day, this is unusable — no search, no filtering, no visual cues about which orders already have invoices.

## Solution: Searchable Order Picker with Smart Defaults

Replace the `<Select>` dropdown with a **searchable command palette** (using the existing `cmdk`-based Command component already in the project) that includes:

1. **Real-time search** — type order number, dealer name, or amount to instantly filter
2. **Smart sorting** — show orders WITHOUT billing documents first (the ones most likely needing invoices), then orders that already have documents
3. **Visual indicators** — each row shows: order number, dealer name, date, amount, and a small badge if documents already exist (e.g., "Estimate", "GST Invoice")
4. **Recent-first** — sorted by date descending so today's orders appear at top

### UI Behavior
- Click "Select an order" → opens a popover with a search input + scrollable list
- User types to filter (searches across order number, dealer name)
- Each order row shows: `ORD-2026-0045 · Sharma Traders · ₹40,500 · 31 Mar` and optionally a small "✓ GST Invoice" badge
- Orders with no documents get a subtle highlight or appear in an "Needs Invoice" group
- Selecting an order works exactly as today (populates buyer + line items)

## File Changes

| File | Change |
|------|--------|
| `src/pages/Billing.tsx` | Replace the `<Select>` order picker (lines 538-549) with a `Popover` + `Command` component. Add search state, grouped/sorted order list, and billing status indicators per order. |

No new files, no database changes. Uses existing `cmdk` Command component and Popover from the UI library.

## Technical Detail

```text
┌─────────────────────────────────────────────┐
│ 🔍 Search orders...                        │
├─────────────────────────────────────────────┤
│ ── Needs Invoice ──────────────────────────│
│ ORD-2026-0045 · Sharma Traders    ₹40,500  │
│ 31 Mar · Rajesh Kumar                      │
│                                             │
│ ORD-2026-0044 · Gupta & Sons     ₹64,000  │
│ 30 Mar · Priya Verma                       │
│                                             │
│ ── Has Documents ──────────────────────────│
│ ORD-2026-0043 · Patel Dist.  ₹28K  [EST]  │
│ 29 Mar · Amit Shah                         │
└─────────────────────────────────────────────┘
```

