# Plain-language pass: an app a 15-year-old can use

## Goal
Every word on screen should say what it means in everyday words. A shop owner or field salesman who has never used business software should know what each button does and what each number means just by reading it. Nothing is removed — same pages, same buttons, same rules — only the words and small hints change.

## Rules for every label
1. Everyday words first, trade word second only if users expect it: "Money dealers owe you" (not "Outstanding"), "Product code" (not "SKU"), "Sent to dealer" (not "Dispatched"), "Returns" (not "Claims").
2. Buttons say the action and the thing: "Save order", "Send bill on WhatsApp" — never "Submit", "OK", "Proceed".
3. Numbers say what they count and for when: "Orders this week: 36", not "Orders (7D)".
4. No short forms or jargon: AOV, 7D, YTD, KPI, aging, pipeline, drill-down, signals, ledger, SKU, realtime, sync.
5. Empty screens say what to do next: "No orders yet. Tap New order to book your first one."
6. Errors say what went wrong and how to fix it, in one sentence, no codes.
7. One word per idea everywhere (one name for "bill", one for "dealer", one for "payment").
8. GST words that appear on legal documents (GSTIN, HSN, Tax invoice, Credit note) stay as-is, with a one-line plain hint next to them. Printed GST bills are not changed.

## How Astra helps
1. Collect every on-screen text from the signed-in app (pages, menus, buttons, table headings, empty states, toasts, errors, form hints) into one list, grouped by page.
2. Astra reviews the list plus screenshots of each page (demo business, phone and desktop) and, for every label, returns: is it clear to a 15-year-old (yes/no), a plainer version, and why.
3. I check Astra's suggestions against the rules above and the business meaning (money words must stay exact), and build one approved word list (glossary).
4. After the change, Astra reviews new screenshots once more and flags anything still unclear.

## What changes, in order
1. **Glossary + menu names** — side menu, bottom bar, page titles (e.g. "My Business" stays, "Reports" tab becomes "Detailed reports", "Schemes" becomes "Offers & schemes").
2. **Money words** — Dashboard, My Business, Money to collect, dealer pages: outstanding, aging buckets ("Owed 1–30 days"), collections, credit limit, advances, credit notes.
3. **Order flow** — New order, order list, order page: statuses, buttons, step hints.
4. **Stock, dealers, team, targets, returns, settings** — headings, table columns, form fields.
5. **Empty screens, success messages and errors** across the app.
6. **Small "?" hints** next to the few numbers that still need a trade word, explaining it in one sentence.

## Checks
- Walk every page with the demo business on phone and desktop; screenshot before and after.
- Astra's final review shows no label marked unclear.
- All automatic tests pass (tests that look for old wording get updated), app builds cleanly.
- Nothing missing: same buttons, same pages, same numbers.

## Not changing
- The landing page and the Ops admin panel (separate passes if wanted).
- Printed bills, credit notes and statements (legal GST documents).
- Any business rule, calculation or permission.

## Technical details
- Extract strings with a script over src/pages and src/components (JSX text, aria-label, placeholder, title, toast calls) into /tmp/labels.json grouped by file.
- Astra via AI gateway (openai/gpt-6-astra, Responses API, image inputs) from /tmp scripts only; no app code.
- Glossary saved to project memory so future screens follow it; shared label constants in src/lib/labels.ts for words used in many places (status names, money terms).
- Work page group by page group; run bunx tsgo --noEmit and bunx vitest run after each group.
