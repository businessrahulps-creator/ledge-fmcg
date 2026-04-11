

# Fix: Revenue KPI Number Truncation

## Problem
The Revenue KPI card shows "₹1,3..." because `truncate` (text-overflow: ellipsis) is applied to all KPI values. While it prevents overflow, it makes the most important number on the dashboard unreadable.

## Solution
Remove `truncate` from KPI values and instead use responsive font sizing that naturally fits the container. Revenue values in INR (e.g., "₹1,34,567") are longer than simple counts, so the font size should scale down gracefully.

## Changes

**`src/pages/Dashboard.tsx`** (line 102):
- Remove `truncate` from the KPI value `<p>` tag
- Use smaller base size with responsive scaling: `text-lg sm:text-xl md:text-3xl`
- Keep `tabular-nums` and `tracking-tight` for clean number rendering
- Add `break-all` as a safety net so numbers wrap rather than overflow

**`src/data/mock-data.ts`** (line 62):
- Change `maximumFractionDigits` from `2` to `0` to drop decimal places — KPI cards don't need paisa-level precision, and shorter strings fit better

## What stays the same
- All other KPI cards (Orders, Pending, Dispatched) are unaffected since their values are short
- No data flow, formatting logic, or component structure changes

