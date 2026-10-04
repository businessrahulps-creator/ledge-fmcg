# Activity & Alerts: QA, bug test and audit (Astra + Fable 5.5)

Goal: prove the Activity page, the activity history and the bell alerts work as intended on the live setup, and fix every real bug found. No features removed; GST documents stay unchangeable; history entries stay uneditable.

## 1. Independent reviews (in parallel)
- **Astra (heavy, max context):** reads the database side: the recording trigger, the refused-save recorder, the alert fan-out, the summary totals, and who can see what.
- **Fable 5.5 (max context, high settings):** reads the app side: Activity page, filters, India-time periods, before/after display, spreadsheet download, bell grouping, links, "See all activity".
- Each finding must name a file/line and a way to reproduce it. I check every finding myself; only confirmed ones get fixed.

## 2. Live tests (real saves, inside undo-able test runs where possible)
- Every recorded type writes exactly one entry with the right person, time, money in/out and before/after: order made/cancelled, sending, payment and void, return + credit note, purchase bill, supplier payment, stock change, dealer/product/offer edits, team access.
- Refused saves show "Failed"; a dropped connection shows "Not sure if saved"; rate cap holds.
- Nobody (not even the owner) can edit or delete history; another business can't read it; a salesperson without money access sees no money rows and can't open the page.
- Summary totals (orders, failed, money in/out, credit given) match a hand count from the real data for Today, 7 days, This month and custom dates, including the India midnight edge.
- **Bell:** create a second test team member, do actions as the owner, confirm the alert reaches them, bundles ("5 new orders"), opens the right page, isn't sent to the person who did it, and is hidden from people without money access.
- Browser checks on computer and phone: page opens, filters, "See changes", download, bell — no errors.

## 3. Fix, then re-verify
- Fix confirmed bugs, add an automatic check for each, rerun all checks (currently 387) and the live tests above.
- Short second Fable pass on just the fixes.

## 4. Report back
Plain list: what was confirmed working, bugs found and fixed, anything not tested and why. Then publish.

## Technical notes
- Server: `tg_audit_row`, `log_failed_attempt`, `tg_activity_notify`, `activity_summary`, `activity_log` RLS/grants. Client: `src/pages/Activity.tsx`, `src/lib/activity.ts`, `NotificationCenter.tsx`, `use-notifications.tsx`, `utils/activityLog.ts`, `handleSupabaseError.ts`.
- Models via the AI gateway: Astra (`openai/gpt-6-astra`), Fable 5.5 (newest Fable id confirmed at run time; fall back to 5.1 and say so if 5.5 is unavailable).
- Test team member and test data are cleaned up through audited paths (no deletes of money records).
