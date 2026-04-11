

# Add Date Range Subtitle to Performance PDF

## Problem
The PDF subtitle currently shows only the period label (e.g. "30D", "7D", "YTD"). It should show the actual date range like "01 Apr 2026 – 11 Apr 2026" so the printed report is self-documenting.

## Changes — `src/pages/Performance.tsx`

**Single change in the `onGenerate` callback (~line 800-805):**

Replace the `periodLabel` logic to always compute and show the actual date range, regardless of whether the period is "custom" or a preset:

- For **custom**: keep existing `format(customFrom) – format(customTo)` logic
- For **presets** (today, 7d, 30d, etc.): use `getCutoffDate(period)` to compute the start date and `new Date()` as the end date, then format as `"30D · 12 Mar 2026 – 11 Apr 2026"`

This gives the PDF subtitle like:
- `"Today · 11 Apr 2026"`
- `"7D · 04 Apr 2026 – 11 Apr 2026"`
- `"01 Mar 2026 – 11 Apr 2026"` (custom)

The `getCutoffDate` function already exists at line 59 and computes the exact cutoff for each period — we just reuse it.

No new files, no logic changes to filtering. ~5 lines modified in the `onGenerate` callback.

