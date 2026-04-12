

# Add Daily & Weekly Target Periods

## Problem
Currently the Targets page only supports monthly periods. Indian FMCG sales teams commonly work on daily and weekly targets too — a salesperson might have a daily target of ₹10,000 or a weekly target of 50 orders.

## What Changes

### 1. `src/pages/Targets.tsx` — Add period type selector + dynamic date options

- Add a **Period Type** toggle/selector: "Daily", "Weekly", "Monthly" (default Monthly)
- When **Daily** is selected: show a date picker (today ± 7 days), period_start = selected date, period_end = same date
- When **Weekly** is selected: show week options (current week, last week, next week), period_start = Monday of that week, period_end = Sunday
- When **Monthly** is selected: keep existing month dropdown behavior
- The `periodType` value ("daily" | "weekly" | "monthly") is stored in each target record
- Update `getTarget()` to also match on `periodType`
- Update `handleSave()` to pass the selected `periodType`

### 2. `src/context/DataContext.tsx` — No schema change needed
The `targets` table already has `period_type` column with default `'monthly'`. The `Target` interface already has `periodType: string`. Just need to ensure `periodType` is passed through correctly in create/update.

### 3. Detail views (`Distributors.tsx`, `Salespersons.tsx`) — Show active targets
- Check for daily target (today), weekly target (this week), and monthly target (this month)
- Display whichever exists, or show the most granular one

### 4. `Performance.tsx` — Targets widget
- Filter targets by the dashboard's selected period type naturally (the widget already filters by period)

## No database migration needed
The `period_type` column already exists and accepts any text value. "daily" and "weekly" will work without schema changes. The unique constraint `(company_id, entity_type, entity_id, period_type, period_start)` already differentiates daily/weekly/monthly targets for the same entity.

## Files Modified
- `src/pages/Targets.tsx` — Period type selector, dynamic date generation, updated filtering
- `src/pages/Distributors.tsx` — Show daily/weekly/monthly targets in detail view  
- `src/pages/Salespersons.tsx` — Same
- `src/pages/Performance.tsx` — Minor filter update

