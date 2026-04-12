

# Add Unit Tests for All Business Logic Utilities

## What
Write 7 test files covering every pure business logic function, then delete the placeholder test. This gives a safety net for all money, date, score, and export calculations before real customers start using the app tomorrow.

## Files to Create

| # | File | Functions Tested |
|---|------|-----------------|
| 1 | `src/utils/numberToWords.test.ts` | `numberToWords()` — zero, ones, teens, tens, hundreds, thousands, lakhs, crores, paise, negatives |
| 2 | `src/utils/formatDate.test.ts` | `formatIndianDate()` — null/undefined → "—", invalid → "—", YYYY-MM-DD string, ISO string, Date object, DD/MM/YYYY output format |
| 3 | `src/utils/dealerScorecard.test.ts` | `getChurnRisk()`, `buildScorecard()` — empty → high, recent+paid → low, old → high, value/payment aggregation |
| 4 | `src/utils/salespersonScorecard.test.ts` | `getPerformanceHealth()`, `getPerformanceInsight()`, `buildSalespersonScorecard()` — scheme-adjusted revenue, frequency, insight strings |
| 5 | `src/utils/exportCsv.test.ts` | `csvFilename()` — dated filename format |
| 6 | `src/utils/exportPdf.test.ts` | `formatCurrencyPdf()`, `pdfFilename()` — "Rs." prefix, Indian comma grouping, dated filenames |
| 7 | `src/utils/sanitize.test.ts` | `sanitizeInput()` — HTML stripping, script tags, control chars, whitespace collapse |

## File to Delete
- `src/test/example.test.ts` — placeholder with no real assertions

## Technical Approach
- All tests use `vi.useFakeTimers()` where dates matter (scorecards, filenames) for determinism
- Scorecard tests create minimal `Order` stub objects with only the fields each function reads
- No React rendering, no Supabase mocking — pure function tests only
- `escapeCell` is not exported from `exportCsv.ts`, so we only test `csvFilename()`

## Key Test Cases

**numberToWords**: `0 → "Zero Rupees Only"`, `1234.56 → "One Thousand Two Hundred and Thirty Four Rupees and Fifty Six Paise Only"`, `123456 → includes "One Lakh"`, `10000000 → includes "One Crore"`, negative amounts prefixed with "Minus"

**formatIndianDate**: `null → "—"`, `"2025-01-15" → "15/01/2025"`, `"garbage" → "—"`, Date object → DD/MM/YYYY

**dealerScorecard**: Empty orders → high risk. Order 10 days ago + paid → low risk. Order 45 days ago + 50% paid → medium. Order 90 days ago → high.

**salespersonScorecard**: Scheme-adjusted revenue = `total - schemeSavings`. High health + high efficiency → "Consistent performer" insight. Low health + 90 days inactive → "Needs attention" insight.

**sanitize**: `"<script>alert(1)</script>Hello" → "Hello"`, `"a\x00b" → "a b"`, `"  too   many   spaces  " → "too many spaces"`

## No Database or UI Changes
Zero impact on any existing code. Only adds test files and removes the placeholder.

