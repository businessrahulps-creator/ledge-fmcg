# Fix: Tooltip blocking "Today" in Reports time filter

## Root cause
In `src/components/reports/TimePeriodFilter.tsx`, the `Tooltip` wraps the `SelectTrigger`. When the dropdown opens, the tooltip stays pinned to the trigger (still hovered/focused) and floats on top of the dropdown panel, physically covering the first item ("Today" / "Last 7 days" depending on viewport). It's also invisible to touch users since hover doesn't fire on mobile.

## Plan

**Edit `src/components/reports/TimePeriodFilter.tsx`:**

1. Remove the `Tooltip` wrapper around the `Select`.
2. Render a small info icon (`Info` from `lucide-react`) **next to** the Select trigger inside a flex container. The tooltip attaches to that icon only.
   - On mobile, the icon also acts as a tap target (Radix Tooltip opens on tap on touch devices when `delayDuration` is small / via focus).
3. Keep the helper text identical: *"Time windows are rolling — 'Last 7 days' means the last 7 days ending today, not the calendar week."*
4. Keep all exported helpers (`getPeriodRange`, `periodRangeLabel`, `filterByTimePeriod`, `periodLabel`) and the component's props/API unchanged so all five report consumers (`DistributorReport`, `ProductReport`, `PaymentReport`, `DispatchReport`, `SalesTeamReport`) work without modification.

## Result
- Dropdown options are never overlapped — tooltip is anchored to a separate icon outside the Select's portal area.
- Helper text remains discoverable (and now also discoverable on touch devices via tap).
- Zero changes to consumers, filtering logic, or report layouts.
