# Blocker clean-up: access, money safety, and double-entry

Some of this list is already done in the last round. This plan says plainly what is already fixed, what is still open, and what must be checked on the live app before release.

## Already fixed (no work needed, worth re-testing)

- Money to Collect, Company, Team settings and Insights are now locked by role; a salesperson cannot open them and the menu hides them.
- Bills now use the state from the dealer's GSTIN, and a dealer cannot be saved with a state that contradicts the GSTIN.
- Scheme savings are recalculated on the server; two offers no longer stack unless a scheme is marked combinable.
- The payment screen refuses an overpayment outright instead of inviting a second tap.
- Order dates, targets, schemes and payment dates follow the India calendar.
- Credit limit 0 is no longer "unlimited" — dealers have No limit / Up to a limit / No credit.
- Dues of a few paise no longer disappear; a bill closes only at exactly zero.
- Amount in words is filled on the saved bill by the server.
- The "no access" card no longer flashes before the person's job is known.
- Payments and booking advances go through the money layer, so dealer dues update everywhere.

## Still open — in this order

### P0

1. **Returns and credit notes are open to everyone.** The Returns page has no role lock, so a salesperson can raise a credit note. Lock it behind the money permission, with the same friendly "not part of your role" card, and hide it from the menu.

### P1

2. **Delete still offered after a bill exists.** The Delete button only looks at delivery and payments, not at whether a GST bill was raised. Make it read "Cannot delete — this order has a bill" and stay disabled once a bill exists.
3. **Double-tap Save can book two orders.** The save lock goes on after the short-stock confirmation step, so two fast taps can slip through. Lock the button on the first tap and hold it until the save finishes, and send a per-attempt key so a repeat never books twice.
4. **Returns can be booked twice when history fails to load.** If the "already returned" fetch errors, the screen treats it as "nothing returned yet". Keep it blank instead, show "Couldn't load past returns — try again", and block the return until it loads.
5. **Offline orders lose the scheme.** An order saved offline goes up without its savings, so the dealer gets billed full price. Carry the savings and the matched offers through the offline queue (the server will still recheck them).
6. **WhatsApp order share says "Invoice".** A booking confirmation must not read like a tax bill. Change the wording to "Order confirmation" and add a line saying the tax invoice follows on dispatch.
7. **Returns page talks to the database directly.** Move its reads onto the shared data layer, the same way payments were moved, so refreshes stay consistent.

### P2 — smaller, same pass

8. Server-side credit check at booking (today the ceiling is only enforced at dispatch and in the app).
9. Changing a product's GST rate should not silently change older unbilled orders — keep the rate captured on the order line.
10. Insights should not flash open before the role is known (same treatment as the other locked pages).
11. Invite and team buttons should only show to people who can manage the team.
12. Going back from New Order should keep the draft.
13. Honest wording on delete-dealer, and the return preview should not overstate the rupees.
14. Invite sign-in button should not say Google when email is the path in front of the person.
15. Warn on duplicate dealer and product names.
16. The invite screen shows the invited email and job before sign-in — show only the company and job until the person signs in.

## Must be checked live before release

Google sign-up, tampering with an invite link, two tabs dispatching or paying the same order at once, one company reading another's data, every PDF, the phone layout, and recovery after a stale app version.

## Technical notes

- `/claims` gets `RequireCapability capability="see_money"`; `AppSidebar`/`AppLayout` tag the Returns item with the same capability.
- `OrderDetail` already computes `finalInvoice`; feed `hasBill` into the Delete button's `disabled` and label.
- `NewOrder`: move `setIsSaving(true)` above the short-stock acknowledgement branch, and pass a stable per-attempt idempotency key into `book_order_atomic`.
- `Claims.tsx` currently calls `supabase` directly for return history and clears `alreadyReturned` on error — route through `useApi()` and hold a distinct `error` state.
- Offline path in `useOrdersDomain` (the `!navigator.onLine` branch) must persist `schemeSavings` and `appliedSchemes` in the queued mutation.
- `shareWhatsApp.ts` line 20 hardcodes `Invoice ${order.orderNumber}` for the order summary.
- Item 8 is a new migration adding the credit ceiling check inside `book_order_atomic`.
- Tests: add cases for the delete-after-bill rule, double-save protection, the returns error state, offline scheme carry-through, and the booking credit check.
