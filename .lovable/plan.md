## What the toast is

Source: `src/context/data-utils.ts` → `warnPaginationOnce()` (line 184), fired from `batchIn()` whenever a Supabase `IN (...)` query needs more than one 500-id chunk or more than one 1000-row page.

Your account has 550 `order_id`s → 2 chunks → toast fires on every full data load. It's a **developer diagnostic**, not something the user can act on. The truncation warning right below it (data actually dropped) is a real user concern and should stay.

## Fix

In `src/context/data-utils.ts`, inside `warnPaginationOnce`:

- Remove the `toast.message(...)` call.
- Keep `console.warn` and `logError` so we still see it in logs / admin errors.

The `warnTruncationOnce` toast stays untouched — that one signals incomplete data and is worth surfacing.

## Files

- `src/context/data-utils.ts` — drop ~4 lines (the `toast.message` block).

No behavior change, no data change — just stops the recurring info toast on accounts with >500 orders.
