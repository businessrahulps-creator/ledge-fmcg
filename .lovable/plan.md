

## The real problem

The day-of-week pills (`S M T W T F S`) on the Dashboard are confusing because:

1. **No date is shown.** Users see "M" but don't know if that's *this* Monday, *last* Monday, or "Mondays in general".
2. **Mixed semantics in one row.** Days *before today this week* = this week's data. Days *after today this week* = last week's data (because the filter looks for "the most recent occurrence of selectedDay"). Today is Friday → S, M, T, W, T = this week; S (Sat), S (Sun) = last weekend. That silent jump across week boundaries is exactly what's tripping people up.
3. **Letters repeat.** Two "S"s and two "T"s with no other context.
4. **Default selection is today**, but if today has zero orders the user assumes the whole feature is broken.

## Proposal — replace the abstract day pills with a concrete "Last 7 days" date strip

Same shape (a horizontal row of 7 round buttons), but every pill shows a **real date**, in chronological order, ending today on the right. No more guessing which week.

### Visual

```text
 Sat   Sun   Mon   Tue   Wed   Thu   Today
  11    12    13    14    15    16    17
                                      ●
```

- Each pill: weekday short label on top (`Sat`, `Sun`, …, `Today`), date number below.
- 7 pills = the last 7 calendar days, oldest → newest, today always rightmost.
- Selected pill: filled primary; today gets a subtle dot indicator even when not selected.
- Default selected = **Today** (matches current behaviour, but now visually obvious).
- Caption under the row: `Showing orders for Fri, 17 Apr 2026` — same explicit-date pattern we just rolled out across Reports/Performance.
- Tooltip on the row: *"Showing the last 7 days. Tap any date to see orders for that day."*

### Why this fixes it

- **No more "is this last Monday or this Monday?"** — the date is right there on the pill.
- **No more silent week-crossing.** The window is always literally "the last 7 days ending today", just like Reports.
- **Consistency.** Same mental model as the rolling windows we just standardised in Reports/Performance/Billing.
- **Empty state still makes sense.** "No orders on Fri, 17 Apr" reads naturally; "No orders on Friday" reads like a bug.
- **Mobile-friendly.** 7 compact pills (`w-10 h-12`) fit comfortably on phones; same tap target size as today.

### Filter logic change

Replace the current `getDay()`-based filter with a simple date-equality match against the pill's actual ISO date. Simpler code, no week-boundary arithmetic, and the math now matches what the user sees.

### Files to change

1. **`src/pages/Dashboard.tsx`**
   - Remove `DAYS` / `DAY_LABELS` constants and `selectedDay` (number 0–6).
   - Add `last7Dates: Date[]` (oldest → today) and `selectedDate: string` (ISO `YYYY-MM-DD`), default to today's ISO.
   - Replace the day-pill row with a date-pill row: weekday label + day number, "Today" label on the rightmost pill, subtle dot for today.
   - Update `filteredOrders` to filter by `o.date === selectedDate`.
   - Update empty state copy: `No orders on {formatIndianDate(selectedDate)}`.
   - Add caption: `Showing orders for {weekday}, {formatIndianDate}`.
   - Wrap the row in a `Tooltip` explaining the rolling 7-day window.

### Out of scope
- The 7-day sparkline above is fine — it already shows `last7Days` chronologically with "Today" emphasised. No change.
- KPI cards continue to reflect the selected date.
- No changes to other pages.

