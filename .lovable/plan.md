## Plan: Include order total in new-order notification

### Change
Single-line edit in `src/pages/NewOrder.tsx` (line 262).

**Before:**
```ts
addNotification("order_placed", "New Order Created",
  `${result.orderNumber} for ${dealer?.name} has been placed.`);
```

**After:**
```ts
addNotification("order_placed", "New Order Created",
  `${result.orderNumber} for ${dealer?.name} — ${formatCurrency(netOrderTotal)}`);
```

### Why these values
- `netOrderTotal` (line 182) — already computed as `orderTotal - totalSchemeSavings`, matches the "Net Total" the user sees on the order summary, so the notification matches what was actually billed.
- `formatCurrency` — already imported and used throughout the file (line 449, 569, 607); produces Indian-grouped INR like `₹45,200`.

### Out of scope
- No DB migration (notification text is a freeform `description` string).
- No changes to the realtime hook, bell badge, or notification dropdown — already working.
- No changes to toast text.

### Verification after edit
1. Create a test order → confirm bell dropdown shows `ORD-XXXX for <Dealer> — ₹X,XXX`.
2. Type-check passes (no new symbols introduced).