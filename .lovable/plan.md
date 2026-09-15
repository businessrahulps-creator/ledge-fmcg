# Fix slow app and orders that won't open

## What I checked first

On the preview, opening orders works — I opened a booked order, a fully paid billed order and an unpaid billed order on a phone-sized screen and all three loaded with no errors. So the failure you are seeing is almost certainly happening in the installed (home-screen) app and the published site, not in the code path itself: the installed app is still holding an old copy of the app's files from an earlier release, and when you tap an order it tries to load a file that no longer exists on the server. That also matches "the installed app feels slow".

The slowness has a second, separate cause that I can confirm from your data: every time the app opens it downloads your whole history before settling — 820 orders, 3,260 order item rows, 449 order scheme rows, 454 bills, plus stock, sales, claims and targets — and then writes all of it into phone storage. On a phone over mobile data that is the bulk of the wait.

## What I'll do

### 1. Make the installed app recover itself
- Ship a replacement cleanup worker at the old addresses so any phone that still has the old app installed wipes its stored copy and reloads fresh on next open.
- Add a safety net in the app: if opening a screen fails because a file is missing (the exact symptom you hit on orders), clear the stored copy and reload that screen once, automatically, instead of showing an error.
- Show a plain "Couldn't open this order — Try again" card with a working retry button if anything still fails, instead of a blank or error screen.

### 2. Cut the opening load
- Load only what the first screen needs, then bring in history quietly in the background: recent orders first (a few hundred), older ones only when you scroll, search or open a report.
- Stop pulling order item rows and scheme rows for every order in your history up front — they're only needed on the order you actually open, so load them per order.
- Stop copying the entire history into phone storage on every refresh; keep a small recent slice so the app still opens instantly offline-ish, without the write cost.
- Check the database for any query doing a full scan on a filtered column and add the missing index.

### 3. Make the mobile screens lighter
- Orders, Money to collect, Stock and Dealers: render only the rows on screen for long lists, and stop recalculating the full history on each keystroke while searching.
- Keep skeletons on first paint so screens never look frozen.

### 4. Verify
- Type check, full test suite, build.
- Phone-sized browser pass on real data: Dashboard, Orders (list → open an order → back), Money to collect, Returns, Stock, Dealers — measuring time to first useful screen before and after, and confirming an order opens every time.
- Publish, then open the published site on a phone-sized view and confirm the installed-app cleanup works and orders open.

## Not changing

No numbers, formulas, totals, GST rules, statuses or permissions change. This is loading, caching and screen rendering only.

## Technical notes

- `public/sw.js` and `public/service-worker.js`: keep/refresh the kill-switch worker; add a `chunk load error` handler in `src/main.tsx` + `ErrorBoundary` that unregisters workers, clears `caches`, and does a one-shot reload guarded by a `sessionStorage` flag.
- `src/context/DataContext.tsx` phase 2: bound the initial `orders` fetch (recent N by `created_at`) and defer the rest; drop the app-wide `batchIn("order_lines"/"order_schemes")` in favour of a per-order fetch (same pattern as `src/lib/invoice-lines.ts`) consumed by `OrderDetail`, dispatch and the reports that need lines; trim `persistAllToCache` payload.
- Route-level: confirm `routeImporters` chunks still match built filenames after the Performance/Reports deletions.
- Lists: windowing on `Orders.tsx`, `Billing.tsx`, `Stock.tsx`, `Distributors.tsx` row maps; debounce search input state.
- `supabase--slow_queries` + `EXPLAIN (ANALYZE, BUFFERS)` before adding any index.
