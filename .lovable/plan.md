# Credit days for dealers

## What the owner gets
- A new **Credit days** box in the Add / Edit Dealer form, next to Credit Limit. Quick picks 15 / 30 / 45 / 60, or type any number from 1 to 365. Leave it empty for "No fixed days".
- Existing and new dealers start with no fixed days, so nothing changes until you set it.
- Turned off when the dealer is "No credit (cash only)".
- **Show only, never block:** orders save exactly as they do today. Late bills are just marked.

## Where it shows up
- **Dealer page & dealer list:** "30 days credit". If a bill is past its days, a "Late by 12 days" tag and the late amount appear.
- **Internal dealer unpaid list only:** each bill gets a **Due on** date (bill date + credit days) and a "Late" tag once that date has gone by. The Billing interface is unchanged.
- **Today's work:** the "money to collect" card says "₹X is past the 30-day credit time" instead of always using 30 days. Dealers with no fixed days keep today's wording.
- **Dealer statement PDF and payment reminders:** show the credit days and the due date for each bill.
- **Activity:** changes to credit days are recorded with before and after values, like credit limit changes are now.

## Rules
- Due date = bill date + credit days. A bill counts as late only while money is still owed on it after payments, credit notes and dealer credit. This uses the same "oldest bill paid first" rule as today.
- Changing credit days follows the same permission as changing the credit limit: owner or manager (override credit limit / manage team). The server checks this, not just the screen.
- Bills already made follow the dealer's current setting (we don't save it on each bill), so changing the days updates the due dates straight away.
- The 0–30 / 31–60 / 61–90 / 90+ age groups in reports stay the same. "Late" is shown as an extra label.

## Technical details
- Migration: `ALTER TABLE distributors ADD COLUMN credit_days integer NULL CHECK (credit_days BETWEEN 1 AND 365)`. This is an additive change; current grants and policies already cover it. Extend `tg_protect_distributor_columns` so a `credit_days` change needs the same capability as `credit_limit`. `tg_audit_row` already records the column change.
- Types: add `creditDays: number | null` to the Distributor type; map it in `data-utils.ts` and `useDealersDomain.ts` (save and load), and add it to the `exportBackup` fields.
- `src/lib/receivables.ts`: add `dueDate` and `daysLate` to `ReceivableRow` when the dealer has creditDays. Work them out after the dealer-credit step. Add a pure helper `dueDateFor(invoiceDate, creditDays)` in a new `src/lib/credit-terms.ts`.
- `src/lib/intelligence.ts`: the collect rule uses each dealer's creditDays to decide what counts as late, and falls back to 30 when it is null (today's behaviour).
- UI: Distributors.tsx form (NumberInput, integer 1–365, chips), DealerDetail internal receivables rows, DealerStatementPdf and collection reminder text. Do not change Billing.tsx, OrderDetail.tsx, NewOrder.tsx, invoice PDFs, thermal printouts, or invoice share text.
- Tests: due date = bill date + days; a bill exactly on its due date is not late and is late the next day; a paid-off bill is never late; null days means never late; values outside 1–365 are rejected; the intelligence card uses the dealer's days.
- Record a rule in AGENTS.md: credit days are display-only and never block saving.
