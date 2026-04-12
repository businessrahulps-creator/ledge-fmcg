

# Rethink Billing "New Document" Order Picker

## The Problem

The current order picker in Billing uses a `Popover` + `Command` combobox. Issues:
1. **Not scrollable on mobile** — the popover clips or overflows
2. **Doesn't scale** — with 5,000 orders, the entire list renders inside a small dropdown
3. **Inconsistent** — Claims uses a much better two-step Dialog pattern that users already like

## Solution

Replace the inline Popover-based order picker with a **two-step Dialog pattern matching Claims**:

- **Step 1**: Full-screen-friendly dialog with search input + scrollable order list (cards, not combobox items). Orders grouped as "Needs Invoice" first, then "Has Documents". Each card shows order number, dealer, date, amount, and existing document badges.
- **Step 2**: The rest of the form (doc type, buyer details, lines, GST config) — exactly as it exists today.

This gives us:
- Proper `max-h-[45vh] overflow-y-auto` scrollable list (same as Claims)
- Search filtering that works at any scale
- Touch-friendly card-based selection on mobile
- A "Back" button to change order selection (same as Claims step navigation)

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Billing.tsx` | Replace Popover/Command order picker with two-step Dialog flow (~80 lines changed) |

**1 file modified. No new files. No new dependencies. No database changes.**

## Key Implementation Details

- Remove `Popover`, `PopoverContent`, `PopoverTrigger`, `Command*`, `ChevronsUpDown`, `Check` imports (no longer needed)
- Remove `orderPickerOpen` state
- Add `step` state (1 = pick order, 2 = fill form) — mirrors Claims pattern
- Step 1: search input + `max-h-[45vh] overflow-y-auto` scrollable list of order cards grouped by "Needs Invoice" / "Has Documents"
- Step 2: existing form content (doc type, buyer, lines, GST) + "Back" button in footer
- When `showCreate` opens without a pre-selected order (e.g. from URL param), start at step 1; with pre-selected order, start at step 2
- Mobile: dialog already has `max-w-[calc(100vw-2rem)]` which is correct

