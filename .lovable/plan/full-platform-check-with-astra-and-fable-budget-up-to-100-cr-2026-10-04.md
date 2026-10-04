# Full-platform check with Astra and Fable (budget: up to 100 credits)

## Goal
Check every part of Ledge from end to end: what's on screen, the business rules, the money maths and the security. Fix every real bug that's found, then check each fix.

## What gets checked
1. **Sales:** booking orders, offers and schemes, sending (stock and credit checks), GST bills, payments, cancelling and voiding, returns and credit notes, deleting orders.
2. **Money:** dealer unpaid amounts, Money to Collect, credit limits, and the dashboard totals matching what's recorded.
3. **Stock and buying:** godowns, stock changes, suppliers, purchase bills, purchase returns, supplier payments and supplier balances.
4. **People:** dealers, sales team, shop visits, new shops becoming dealers, promised payments showing up in Today's work.
5. **Team and access:** invites, extra access, job changes, removing people, the conflict check for two owners, and the bots and account menu.
6. **Insights:** Today's work, Activity, the bell, Reports and every download format (CSV, Excel, PDF, Tally).
7. **Security:** keeping each business's data separate, blocking direct writes, role limits, safe repeats of the same save, and protection against bad input.
8. **Screens:** every page on computer and phone, opened signed in with real data, with any errors noted.

## How it runs
- **Round 1 (Astra, maximum reasoning):** reviews the code and database rules area by area and lists real bugs with proof.
- **Round 2 (live checks by me):** live database tests against the server, the 390 app checks, the screen tests on computer and phone, and the money totals reconciled.
- **Fix:** only bugs with proof get fixed, each one small and safe. Standing rules are kept: GST bills never change, every save is all-or-nothing, voids are recorded.
- **Round 3 (Fable 5.1, maximum settings, a fresh approach):** re-checks every fix and looks for anything Astra missed. Its findings get fixed too.
- **Final check:** the app checks, live tests and screen tests are run again.

## Limits to know
- I'll stop at 100 credits and report what wasn't covered.
- You're the only person in your business, so screens for other jobs can only be shown by faking the data the app receives, not by signing in as them.
- Test entries will show up in Activity. Nothing real is deleted, and any test money is cancelled through the normal void flows.

## What you get at the end
A plain-language list of every bug found and fixed, what passed, and what's still unchecked.

## Technical details
- Astra: `openai/gpt-6-astra` via /v1/responses, effort max, streamed. Fable: `anthropic/claude-fable-5-1` via /v1/messages. Output limits are given in the prompt.
- Each review gets the source for its area plus the SQL from `pg_get_functiondef` for the related RPCs, policies and triggers.
- Live tests run through the REST API with the injected session. The Playwright scripts live in /tmp/browser/. Migrations go through the migration tool.
