

# UX Fix: Time Period Filter Pills

## Issue
The current pills use `rounded-md` with tight spacing and small text (`text-xs`, `px-3 py-1.5`). The screenshot reference shows a cleaner design with:
- Fully rounded pills (`rounded-full`)
- More generous padding for better touch targets
- Slightly larger text for readability
- Cleaner visual separation between active/inactive states

## Changes

**File: `src/pages/Performance.tsx` (lines 336-359)**

Update the pill container and button styles:
- Container: `rounded-full` instead of `rounded-lg`, slightly more padding
- Buttons: `rounded-full`, `px-4 py-2`, `text-sm` for better touch targets and visual match
- Active state: keep `bg-primary text-primary-foreground shadow-sm` with `rounded-full`
- Inactive state: keep `text-muted-foreground hover:text-foreground`

This is a ~5-line CSS-only change, no logic modifications.

