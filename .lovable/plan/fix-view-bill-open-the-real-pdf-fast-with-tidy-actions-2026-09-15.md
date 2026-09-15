# Fix "View bill" — open the real PDF, fast, with tidy actions

## What's broken (verified in the code)

1. **Chrome blocks the bill tab.** The app builds the PDF first and only then asks the browser to open a tab. By that time the click is "over", so Chrome treats it as a pop-up and blocks it — the exact error you saw. The fall-back modal then appears, which is not what you want either.
2. **It feels slow and silent.** Building a bill PDF loads a heavy PDF engine on every single click, with no spinner and no "preparing…" feedback. Nothing happens for a couple of seconds, so it feels broken. The same bill is rebuilt from scratch every time you click it again.
3. **The menu looks bad.** The menu rows have no space between the icon and the words ("View bill", "Open order", "Remind on WhatsApp" run into their icons), rows are cramped, and the highlight is a heavy dark brown block. The Documents tab uses three bare icons with no labels, so people can't tell what they do.
4. **Two competing patterns.** Some rows show a worded button, some show icon-only buttons, and the same action appears both as the main button and again inside the menu — duplicated and confusing.
5. **List slowness.** For every row the page scans the whole order list to find the matching order (819 orders × rows), redone on every keystroke in search. This drags the whole Money page.
6. **Download has the same silence** — no feedback, and the file link is released immediately, which can cut off the download on slower machines.

## What I'll change

**Opening a bill**
- Open the browser tab the instant the button is clicked, show a "Preparing bill…" page in it, then swap in the PDF when it's ready. Chrome no longer blocks it, and the bill opens in the browser's own PDF viewer, as you asked.
- Keep each built bill in memory for the session, so opening the same bill again is instant.
- Show a small inline spinner on the button while it prepares, and a plain message if it genuinely fails.
- Same behaviour on the order page's Bill button.
- The modal preview stays only as a last-resort fallback (e.g. if the tab can't be opened at all).

**Action buttons and menu**
- One consistent pattern on every row: one worded primary button (Record payment when money is due, otherwise View bill) plus a "…" menu holding the rest — and the primary action is no longer repeated inside the menu.
- Fix the menu itself: proper spacing between icon and label, comfortable row height, muted hover instead of the heavy brown block, and a light divider before WhatsApp.
- Documents tab: replace the three unlabelled icons with the same one-button-plus-menu pattern (View bill / Download PDF / Send on WhatsApp / Open order), so the actions read in words.
- Touch targets stay finger-sized on mobile.

**Speed**
- Build a one-time lookup of orders by id instead of re-scanning the list per row.
- Debounce the search box so typing doesn't recompute the whole page on every letter.

## QA before I report back

- Red-team pass over the Money page: pop-up blocked, slow network, bill with no linked order, credit-note rows, zero-due bills, a bill that fails to build, repeated rapid clicks, mobile width.
- Run the type check, the full test suite and a build.
- Then drive the real app signed in on the demo data: open a bill from To collect and from Documents, confirm the PDF opens in a new tab with no Chrome block, check the download, the WhatsApp reminder text and the menu appearance on desktop and mobile.

## Technical notes

- `openInvoiceInNewTab` in `InvoicePreviewDialog.tsx`: `window.open()` synchronously inside the click handler, write a placeholder document, then `win.location.replace(objectUrl)` once `buildInvoiceBlob` resolves; revoke on tab unload with a generous timeout. Add a module-level `Map<invoiceId, Blob>` cache.
- `Billing.tsx`: `pendingBillId` state for the button spinner; `ordersById` memo; debounced search value via the existing `use-debounce` hook; shared `RowActions` block for collections rows, mobile cards and document rows.
- `ui/dropdown-menu.tsx` `DropdownMenuItem`: add `gap-2`, slightly taller rows, softer focus background — applies app-wide, so I'll sanity-check other menus (Orders, Dealers, Stock) after the change.
