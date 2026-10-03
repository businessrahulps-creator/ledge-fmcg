# Speed pass 2: fix what actually makes Ledge slow to open

## What I found when I timed it

I opened the Dashboard signed in at phone size and timed what it loads.

- It takes about **5.5 seconds** before the Dashboard has finished loading.
- In that time the app makes **36 separate requests** for your business's data.
- Most of the wait isn't the app's own files. Ledge downloads your **whole business** before the Dashboard is complete: every order, then every line on every order (in 6 batches, one after another), plus every return, product, dealer, payment and bill.
- These downloads wait on each other in a chain: sign-in, then profile, then business details, then orders, then order lines. Each link adds a round trip, and each round trip is slow on phone internet.
- Some requests are repeated for no reason: your profile twice, your role twice, and the "what am I allowed to do" check five times.
- Shrinking the app's files last time saved about 200 KB. That's small next to this chain, which is why opening didn't feel faster.

## Step 1: Ask Astra (before changing anything)

Send Astra the timing above, how the app loads data today, and the ideas below. Ask it to:
- rank the ideas by speed gained versus risk
- point out anything we've missed (for example how the database looks up records, how big each download is, or how the server is set up)
- flag anything that could make a number on screen wrong

I'll check each Astra suggestion against the real code before using it. Suggestions that don't hold up get dropped and listed for you.

## Step 2: Likely fixes (final list depends on Astra)

1. **Show the last saved numbers instantly.** The app already keeps a copy of your data on the device. Show it straight away with a small "Updating…" note, then swap in fresh numbers. Money screens stay marked as updating until the fresh data arrives.
2. **Don't load order lines at startup.** Fetch them only when a screen needs them (order details, reports, returns). This removes the 6-batch chain.
3. **Stop the repeated requests** for profile, role and permissions, so each loads once.
4. **One request instead of many.** Fetch your business's starting data in one go on the server instead of about 20 separate trips.
5. **Load all at once, not in a chain.** Anything still needed is requested at the same time.
6. **Check the database's lookup indexes** for the biggest tables (orders, order lines, bills, payments), using the slow-query report.

## How we'll know it worked

- Time the Dashboard, Orders and Money to Collect pages before and after, at phone size with slowed-down phone internet, and on computer.
- Target: the Dashboard shows numbers in under 1.5 seconds on a repeat visit, and under 3 seconds on first sign-in.
- Every total on the Dashboard, Money to Collect and My Business must match before and after, to the paisa.
- All 380 automatic checks plus the screen tests must pass.

## What won't change

- No changes to how bills, payments, stock or balances are calculated or saved.
- GST bills stay unchangeable, and every save still goes through the same all-or-nothing server steps.
- The new one-request loader only reads data, and only for your own business (same access rules as today).

## Technical details

- Trace: 36 PostgREST calls, networkidle at about 5.5s. order_lines arrive in 6 chunks between 3.5s and 5.0s via fetchAllChunked/batchIn. There are duplicate profiles/user_roles calls and 5 parallel has_capability RPCs.
- Astra goes through the AI gateway (Responses API). Its inputs are DataContext.tsx, data-utils.ts, the domain hooks, useCollections, useCan, AuthContext and the trace.
- Planned changes:
  - Hydrate from offline-store getCachedData before the network finishes (stale-while-revalidate). The OFFLINE_MODE flag stays off; only the read cache is used.
  - Make order lines lazy in useOrdersDomain, with an ensureOrderLines(orderIds) helper.
  - Dedupe auth/capability fetches with React Query keys, or a single `my_capabilities` RPC.
  - Optional `bootstrap_company_data(company_id)` SECURITY INVOKER read-only RPC (RLS still applies), plus missing composite indexes (company_id, created_at).
- Verification: Playwright timing script with CDP network throttling (Fast 4G), a before/after totals comparison via SQL, vitest, and the e2e-agent suite.
