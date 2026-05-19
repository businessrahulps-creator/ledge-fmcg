## Bug

`PaymentReport`'s Aging Summary button feeds the **raw `orders`** array (and the full `distributors` list) into `computeDealerAging`. It ignores `period`, `scope`, and `paymentStatus` — so the user sees one dataset on screen and downloads a different one. Main XLSX/PDF use `filtered`; only this extra button is wrong.

## Semantic note

`computeDealerAging` itself skips orders via `isOutstandingOrder` and `orderOutstanding > 0`. So combining it with the on-screen `paymentStatus = "paid"` filter would correctly produce zero rows — that is the user's intent when they pick "paid only". The fix is honest: respect the filter even if the result is empty (the empty-state toast already handles that).

## Plan (frontend only, one file)

Edit `src/components/reports/PaymentReport.tsx`, the `extra` button at lines ~144–161:

1. Replace `computeDealerAging(orders, distributors)` with `computeDealerAging(filtered, distributors)` so it honours period + scope + status.
2. Append a period suffix to the filename for parity with how users read the main report: `xlsxFilename(\`payment-aging-summary-${period}\`)` — keeps the dated `_YYYY-MM-DD.xlsx` convention. (Optional polish; can drop if it complicates `xlsxFilename` semantics. Keeping minimal: leave filename alone unless you want it.)
3. Add a `title` tooltip update: "Export aging summary for current filters (XLSX)" so the button label matches behaviour.

That is the entire change — three lines touched. No helper changes, no other reports affected, no backend.

## Verification

- Set period to "This Week", click Aging Summary → row count ≤ rows visible in main table's dealers, and totals match per-dealer outstanding within that period.
- Set status to "Paid" → empty-state toast fires ("Nothing to export").
- Set scope to "Delivered only" → undelivered-but-outstanding dealers drop out.

## Out of scope

- Aging logic itself (`computeDealerAging`).
- Other reports — already verified to use `filtered`/`data` in the previous turn.
- PDF aging export (none exists yet).
