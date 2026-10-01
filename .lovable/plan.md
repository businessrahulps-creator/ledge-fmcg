# Build-ready check: logic, functions and speed

Goal: find every remaining bug, wrong number or slow spot before handover, fix the safe ones, and bring the rest to you to decide. Budget: up to 100 credits, stopping early if the work finishes sooner.

## How the review runs

Six reviewers run at the same time. Each area gets two independent reviewers (Astra and Fable). A finding only counts when both agree, or when a test or a check of the saved data proves it.

1. **Money and GST**: orders, sending and billing, GST bills, payments, credit notes, money to collect, dealer statements, credit limits, rounding, IST dates.
2. **Stock and buying**: stock movements per godown, average buying cost, purchase bills, returns, supplier payments, supplier balances, cancelling bills.
3. **Access and safety**: each role (owner, manager, accountant, salesperson, viewer) sees and changes only what it should, at the screen level and behind the screens. Also checks that no business can see another's data, that a double tap saves only once, and that a failed step undoes everything.
4. **Reports and Tally**: every report's totals compared with the dashboard and My Business; CSV, Excel and PDF output; the Tally file's balances and GST rates.
5. **Shop visits, Today's work and offers**: promises, new shop → dealer, the "buy X get Y" offer and discounts, threshold rules.
6. **Speed**: load time for Dashboard, Orders, Money to collect, Reports and My Business; download size; repeated or slow data requests; screens that redraw too often; slow database queries and missing indexes.

## Hands-on checks

- **Saved-data cross-check**: dealer balances against bills, payments and returns; stock against its history; supplier balances; sequence numbers with no gaps or repeats; no orphan records.
- **Browser run as owner on phone (393px) and computer (1280px)**: order → send & bill → payment → return → purchase bill → supplier payment → visit with promise → new shop → dealer → every report export, including Tally. The numbers must agree on every screen.
- **Speed measured before and after each speed fix**: first open and repeat open of the key screens, timed in the test browser.

## Fixing rules

- Fix "must fix" and "should fix" items with evidence. Each fixed calculation gets a new automatic check. All 368 existing checks must keep passing.
- Nothing that changes a business rule, old saved data or a GST bill gets changed without asking you. Those go on a decision list.
- Page names, the menu order (Dashboard first) and plain-language labels stay as they are.

## Still waiting on you (unchanged unless you say otherwise)

- Who can use "Send & make bill".
- Whether stock reports should be limited to people who manage stock.
- Older demo bills with tax rounded to the rupee (left as they are).
- Testing as a salesperson or manager needs a test login invited from Team Settings. Without one, those roles are checked by reading the code only.

## What you get at the end

A plain-words report: what was fixed, speed before and after, what was checked and how, and the decision list.

## Technical details

- Reviewers run as parallel subagents with full-file reads. Output per finding: severity (must/should/small), file:line, impact and exact fix.
- Database checks run as read-only SQL: reconciliation queries, `supabase--linter`, `slow_queries` and `db_health`, plus a review of RLS and SECURITY DEFINER functions against the revoke checklist.
- Speed: Playwright timing with network capture, a Vite bundle size check, DataContext/realtime fan-out review, React render hot spots and query indexes. Schema fixes are additive migrations only.
- Results go into roadmap.md and AGENTS.md where a rule changes.
