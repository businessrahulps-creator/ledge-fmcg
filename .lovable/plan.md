## Problem

The Stock page exposes **two overlapping affordances** that conflict with each other:

1. **"Add Stock"** button (top-right) → adds quantity to existing balance (delta).
2. **"Edit Inventory"** dialog (per row) → shows the **current quantity in an editable field** (absolute set).

Users opening *Edit Inventory* see `221` and instinctively type `50` next to it or replace it with `+50`, not realizing they just **overwrote 221 → 50**. Others freeze and try to mentally compute `221 + 50 = 271` before typing it back. Both flows lose user trust around inventory accuracy — the most safety-critical number in the app.

Root cause: a single text field is being used for two semantically different operations (set vs. adjust), with no indication of which is happening.

## Proposed Solution: Intent-First Stock Adjustment

Replace the raw "Quantity" input in *Edit Inventory* with an **intent picker + delta input**, and surface a clear before/after preview so the user always sees what's about to happen.

### New Edit Inventory dialog layout

```
┌─ Edit Inventory ──────────────────────────────┐
│  AquaPure Packaged Water 5L · APW–5L           │
│                                                │
│  Current stock: 221 units                      │
│                                                │
│  What do you want to do?                       │
│  ( • Add stock )  ( Remove stock )  ( Set exact )│
│                                                │
│  Quantity to add                               │
│  [ 50            ]   units                     │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ New stock will be: 221 + 50 = 271 units  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Low stock threshold                           │
│  [ 59            ]                             │
│                                                │
│  [Remove from Warehouse]                       │
│  [Cancel]               [Save Changes]         │
└────────────────────────────────────────────────┘
```

### Three intents (segmented control)

| Intent | Field label | Computed result | When users pick this |
|---|---|---|---|
| **Add stock** *(default)* | "Quantity to add" | `current + delta` | New shipment received, restock |
| **Remove stock** | "Quantity to remove" | `current − delta` (clamped ≥ 0) | Damage, expiry, manual write-off |
| **Set exact** | "New quantity" | `delta` (absolute) | Stock count correction after audit |

- Default intent = **Add stock** (most common action, and matches what users were trying to do incorrectly).
- The delta input always **starts empty** — never pre-filled with the current quantity. This eliminates the "do I edit this number?" confusion entirely.
- A **live preview line** ("New stock will be: 221 + 50 = **271 units**") sits directly under the input. For *Remove*, it shows the subtraction; for *Set exact*, it shows just the absolute value with a subtle warning style if the change is large (e.g., >50% delta from current).

### Threshold stays as a direct edit
The low-stock threshold is a configuration value (not a running balance), so it remains a normal `NumberInput` — there's no ambiguity there.

### Audit trail
Every save logs to `activity_log` with the intent and delta, e.g. *"Added 50 units to AquaPure 5L (221 → 271)"* — much more useful than the current "updated stock item" entry.

## Consolidating the two flows

Once *Edit Inventory* supports "Add stock" properly, the standalone **"Add Stock" top-right button** becomes redundant for products already in the warehouse. We keep it but **rescope its purpose**:

- Rename it to **"Add New Product to Warehouse"** (or similar) and only allow selecting products that are *not yet* present in this warehouse.
- For products already present, clicking that button could even short-circuit and open the row's Edit dialog with intent pre-selected to "Add stock".

This removes the "two doors that do the same thing" problem.

## Files to change

- **`src/pages/Stock.tsx`**
  - Replace the Quantity `NumberInput` in the Edit Inventory dialog with an intent segmented control + delta input + computed preview.
  - Update `saveStockItemFn` to apply the intent (`current + delta`, `current − delta` clamped, or `delta`) when persisting.
  - Update `handleAddStock` and the *Add Stock* dialog: filter the product dropdown to products not already stocked at the selected warehouse; rename the trigger button + dialog title to make its purpose distinct.
  - Use existing `NumberInput` for the delta field (`allowEmpty`, `min={1}` for Add/Remove, `min={0}` for Set exact).
- **`src/utils/activityLog.ts`** (lightweight): extend the stock-item update log entry to include before/after quantities and intent.
- **`mem://features/stock-management`**: update note to record the intent-based adjustment pattern.

## What we're explicitly NOT doing now

- No new database schema (no `stock_movements` ledger table). The next-month RBAC/audit pass is a better moment for that. For now, `activity_log` carries the breadcrumb.
- No batch adjustments (multi-row select + adjust). One row at a time is fine for V1.
- No barcode-scan flow — also a future polish item.

## Why this works for the user base

- **Mobile users** never have to position a cursor inside a pre-filled number — they just type the delta. No more "01 / can't backspace zero" follow-on confusion.
- **The mental math goes away** — the dialog does the arithmetic and shows it.
- **Mistakes become visible before save** — the live preview line acts as a built-in confirmation.
- **Matches how distributors actually think**: "I received 50 cartons today" → pick *Add stock*, type *50*, done.
