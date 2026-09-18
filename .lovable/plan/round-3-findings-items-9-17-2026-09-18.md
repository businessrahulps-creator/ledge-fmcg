# Round-3 findings: items 9–17

Verified against the code before planning. One correction: **offline saving is currently switched off**
(`OFFLINE_MODE_ENABLED = false`). The offline branch in `addOrder` still invents a number and inserts
the order into the on-screen list, *then* calls a queue that now throws — so today an offline save
shows a fake order on screen and then errors. That makes item 9 worse than reported, and it is fixed
by removing the dead path rather than by reconciling numbers.

---

## What gets fixed

### 1. Offline order numbers (item 9)
Remove the offline branch in `addOrder`. While offline saving is off, booking without signal fails
cleanly with "You're offline — reconnect to book this order" and nothing is added to the list. No
invented number can ever reach a dealer. The number-reconciliation work is documented in the offline
revival notes for whenever offline mode comes back.

### 2. Order numbers on the calendar year vs invoices on the financial year (item 10)
This is a data-model decision and is **deferred out of this batch** — moving order numbering to the
financial year renumbers nothing retroactively but changes the sequence boundary mid-year, and it
should be done at a year-end, not in a bug-fix pass. Recorded as a decision to revisit. Say the word
and it moves into scope.

### 3. "undefined Crore" above ₹100 crore (item 11)
The crore group is rendered with a helper that only covers 0–99. It will use the full three-digit
renderer instead, so ₹100 crore and above read correctly. Tests added at 100 crore, 999 crore and
the existing ceiling.

### 4. Bad or stale detail links spin forever (item 12)
`OrderDetail`, `DealerDetail` and `SalespersonDetail` treat "the list is empty" as "still loading".
They will wait only while data is genuinely loading, then show the existing "not found" card with the
back button.

### 5. Switched-off end-to-end tests and untested money code (item 13)
- The two permanently skipped Playwright specs become conditional on `E2E_AUTH_STATE`, matching the
  third spec, so they run wherever a session exists instead of never.
- Unit tests added for `receivables.ts` (the file every screen reads balances from), plus
  `revenue.ts`, `bill-status.ts` and `aging.ts` — covering the cases the last three audit rounds
  found bugs in: cancelled orders, part payments, paise remainders, bucket boundaries.

### 6. Closing a return claim needs no permission (item 14)
`resolve_claim_atomic` gains the same `see_money` capability check the payment functions already use.
Anyone without it gets "You don't have permission to close claims."

### 7. Database functions are open by default (item 15)
Flip the pattern: revoke `EXECUTE` from `authenticated` across every function in the public schema,
then grant it back only to the named list the app actually calls from the browser. That list is
derived from the `supabase.rpc(...)` calls in the code, so a future function is locked until someone
deliberately opens it. The allowlist is written into the migration as the single source of truth.

### 8. Unsaved work lost on navigation (item 16)
Extend the guard so it also intercepts in-app navigation, and wire it to Stock, Schemes, Settings and
the order edit dialog alongside the two pages that have it. Leaving a screen with unsaved changes asks
first.

### 9. Dashboard sends figures and a dealer name to an AI service (item 17)
- The briefing no longer fires on load. It shows a short "Get today's briefing" prompt; the call
  happens on tap, the same way the explain popovers behave. Cached results still display immediately.
- The dealer name is removed from what is sent — the briefing refers to "your top dealer" instead, so
  no dealer-supplied text reaches the model prompt.

---

## Technical notes

- `useOrdersDomain.addOrder`: delete the `!navigator.onLine` block; return
  `{ success: false, error: ... }`. Leave `offline-store.ts` replay code intact behind the flag.
- `numberToWords`: `threeDigits(crore)` in place of `twoDigits(crore)`; values are bounded by the
  numeric column anyway, so no overflow guard needed beyond that.
- Detail guards: `if (api.loading) return <RouteSkeleton/>` only; drop `|| items.length === 0`.
- `resolve_claim_atomic`: add `IF NOT public.has_capability(auth.uid(), 'see_money') THEN RAISE ...`
  ahead of the company check, matching `record_invoice_payment_atomic`.
- Function grants migration: `REVOKE ... FROM authenticated` over `pg_proc` in `public` excluding
  trigger-returning functions, then `GRANT EXECUTE` to the explicit RPC allowlist.
- `use-unsaved-changes-guard`: keep `beforeunload`, add a `useBlocker`-equivalent confirm on route
  change (the app uses `BrowserRouter`, so this is a navigation-intercept wrapper rather than the data
  router API).
- `TodayDigest`: `useEffect` reads cache only; `fetchDigest` moves behind an explicit button.
  `Dashboard.tsx` stops passing `topDealer`; edge function drops the field from the prompt.

## Not in scope
Items listed as clean, the live-environment checks (edge function deployment, `verify_jwt` settings,
real policy list, multi-tab stress), and the financial-year order numbering decision above.
