# WhatsApp share text — validation plan

## What I checked

Every WhatsApp entrypoint in the app and what it pulls from:

| Caller | Source of truth | Period-aware? | Verdict |
|---|---|---|---|
| `shareOrderOnWhatsApp` (OrderDetail) | live `order` prop — dealer, date, lines, grand total | n/a (single order) | ✅ correct |
| `shareInvoiceOnWhatsApp` (Billing) | live `inv` (subtotal, CGST/SGST/IGST, grand total, buyer) | n/a (single invoice) | ✅ correct |
| `shareDealerOnWhatsApp` (DealerDetail) | live dealer object (`totalOrders`, `totalValue`, contact) | reflects current DataContext | ✅ correct |
| Distributors card "Remind" | live `d.outstandingAmount` from `paginatedDealers` (search/page reactive) | uses running balance, not period slice | ✅ correct by design |
| `CreditAtRiskCard` "Remind" | live `d.outstandingAmount`, `d.creditLimit` | running balance | ✅ correct by design |
| `WhatsAppBlastSheet` (Command) | `{dealer_name, outstanding, last_order_date}` merge fields, built from props `dealers` + `orders` | `outstanding` = running balance; `last_order_date` scans full orders array | ✅ semantically correct (chase the full balance, not a window slice) — but has a **stale-template bug** |

## Bugs found

**1. Stale `template` in `WhatsAppBlastSheet`** — `useState(defaultTemplate)` only seeds on first mount. If the sheet stays mounted (it does — Command renders it unconditionally per the earlier scroll-lock fix) and the parent switches it from "dormant chase" → "credit-blocked", the textarea keeps the prior template. Also fails to re-seed if dealer set changes mid-open.

**2. Zero test coverage** for any share-text builder. A period/total regression would ship silently.

## What I'll do

### A. Fix the stale template
- `WhatsAppBlastSheet`: re-seed `template` when `defaultTemplate` changes (effect with the prop as dep) **and** when the sheet transitions from closed → open. Keep user edits while the sheet is open with the same template prop.

### B. Add unit tests (`src/utils/__tests__/shareWhatsApp.test.ts` + `src/components/command/__tests__/WhatsAppBlastSheet.test.tsx`)
Locked-down assertions on the built strings:

1. **Order summary** — given an order with 2 lines, asserts message contains the exact `distributorName`, ISO date formatted as `en-IN`, every `productName × quantity = ₹lineTotal`, and the grand `Total` line equals `formatCurrency(order.total)`.
2. **Invoice summary (intra-state)** — asserts CGST + SGST lines present, IGST absent, subtotal + grand total match input.
3. **Invoice summary (inter-state)** — IGST present, CGST/SGST absent.
4. **Mutation reactivity** — call builder twice with the same order reference after mutating `order.total` and a `lines[i].quantity`; asserts the second string reflects the new numbers (catches any accidental memoisation).
5. **Blast sheet rendering** — render with 3 dealers (one missing phone), default template using all three merge fields; assert:
   - `{dealer_name}`, `{outstanding}` (formatted ₹), `{last_order_date}` resolved per dealer
   - dealer with no orders shows "no order on record"
   - reachable count = 2 of 3
6. **Blast sheet re-seeds** — rerender with a new `defaultTemplate` prop, assert the textarea text updates (currently fails — passes after fix A).
7. **Blast sheet reflects dealer changes** — rerender with a filtered `dealers` array (1 dealer), assert preview count drops to 1 and the remaining message uses the new dealer's `outstandingAmount`.

### C. Out of scope (flagging for confirmation)
- No share message currently embeds the **/command period label** (e.g. "Last 30 days"). The audit shows this is intentional — running balances and last-order dates don't change with the dashboard period. If you want the period stamped into blast messages (e.g. "as of last 30 days"), say the word and I'll add a `{period}` merge field + thread the active period from Command into the sheet.

## Files touched

- `src/components/command/WhatsAppBlastSheet.tsx` — template re-seed effect
- `src/utils/__tests__/shareWhatsApp.test.ts` — new
- `src/components/command/__tests__/WhatsAppBlastSheet.test.tsx` — new

No other production code changes.
