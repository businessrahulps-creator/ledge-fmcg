# Fix: "Dispatch & bill" fails for businesses without a state

## What's wrong
The client (Podaran Tilo Juice) pressed Dispatch & bill 5 times on ORD-2026-0001. Every try failed with "Some required information is missing". The real reason is in the error records: the GST bill needs a **place of supply** (a state). Ledge works it out from the dealer's GST number, then the dealer's state, then the business's own state. This business has **no GST number and no state**, and dealer Ajmeer has neither, so there's no state to use and the bill is refused. Stock, items and payment are all fine.

The message the client saw doesn't say what's missing, so they couldn't fix it themselves.

## Fix
1. **Ask for the state right there.** When the business has no state set, Dispatch & bill opens a short "Which state is your business in?" picker (Indian states with codes). Saving it updates My Business, then dispatch continues in one go. Owner-only (manage_business); others see "Ask the owner to add your business state in My Business".
2. **Dealer state is optional.** If the dealer has no GST number or state, the bill uses the business's state (same-state GST: CGST + SGST), as it does today.
3. **Clear message from the server.** The dispatch save checks for a missing state up front and refuses with "Add your business state in My Business before billing" instead of the database's not-null error. Nothing is half-saved (same all-or-nothing save).
4. **Correct reason in Activity.** The "Order not sent" entry records the real reason.
5. **Warn earlier.** My Business shows a "State needed for GST bills" note when empty; Today's work/setup checklist includes it.

## Not changed
No state is guessed or filled in for the client. GST bills stay unchanged once made. No change to stock, payments or numbering.

## Technical details
- Migration: in `dispatch_and_bill_order_atomic`, after computing `v_pos`, `RAISE EXCEPTION 'business_state_missing' USING HINT=...` when `v_pos` is null; same guard for `v_seller_state` null. Pass through the identical body otherwise.
- Map `business_state_missing` in `handleSupabaseError` to the plain message.
- Dispatch dialog in OrderDetail: pre-check `company.state_code`/GSTIN; inline state Select saving via existing company update path, then call the RPC.
- Vitest: error mapping test + "missing state blocks dispatch" rule test.
- Verify: Playwright on a test company with no state; confirm prompt, save, bill created with intra-state GST.
