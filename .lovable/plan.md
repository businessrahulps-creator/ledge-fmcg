

# Add Dealer Ledger / Outstanding View to DealerDetail

## Problem

DealerDetail shows orders and totals but no running balance or payment ledger. Business owners need to see a chronological view of how outstanding built up — each order adding to the balance, each payment reducing it.

## Solution

Add a **"Ledger"** tab to DealerDetail (alongside Overview, Orders, Secondary Sales). It shows a chronological table of all transactions — orders (debit) and payments (credit) — with a running balance column.

### Design

```text
Tabs: [Overview] [Orders (12)] [Ledger] [Secondary Sales]

┌─────────┬──────────────┬──────────┬──────────┬───────────┐
│ Date    │ Particulars  │ Debit(₹) │ Credit(₹)│ Balance(₹)│
├─────────┼──────────────┼──────────┼──────────┼───────────┤
│ 01 Apr  │ ORD-0045     │ 24,000   │    —     │ 24,000    │
│ 03 Apr  │ Payment Recd │    —     │ 10,000   │ 14,000    │
│ 07 Apr  │ ORD-0052     │ 18,500   │    —     │ 32,500    │
└─────────┴──────────────┴──────────┴──────────┴───────────┘
                                      Outstanding: ₹32,500
```

### Logic

- **Debit entries**: Each order creates a debit of `order.total - order.schemeSavings`
- **Credit entries**: Orders with `paymentStatus === "paid"` generate a matching credit entry on the same date (since we don't have a separate payments table, paid orders = payment received)
- **Partial payments**: Orders with `paymentStatus === "partial"` — credit = 50% of order value (heuristic, since no partial amount field exists)
- Sort all entries chronologically, compute running balance
- Show summary row at bottom with total debits, total credits, and closing balance

### Implementation

**`src/pages/DealerDetail.tsx`** — single file change:

1. Add a new `TabsTrigger` for "Ledger"
2. In `TabsContent value="ledger"`:
   - Build ledger entries from `dealerOrders` using `useMemo`
   - Each order → debit entry; paid/partial orders → credit entry
   - Sort by date, compute running balance
   - Render as a glass-card table (desktop) and card list (mobile)
   - Summary footer with closing outstanding

**1 file modified. No new files. No new dependencies. No database changes.**

