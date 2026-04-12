

# Fix Mobile Nav Icons to Match Desktop Sidebar

## Problem
The mobile bottom nav and "More" sheet in `AppLayout.tsx` use different (older) icons than the desktop sidebar in `AppSidebar.tsx`.

## Icon Mismatches

| Item | Mobile (current) | Desktop (correct) |
|------|------------------|-------------------|
| Dealers | `Store` | `UserRound` |
| Team | `UsersRound` | `UserCheck` |
| Schemes | `Tags` | `Gift` |
| Reports | `BarChart3` | `ChartNoAxesCombined` |
| Billing | `Receipt` | `FileText` |
| Claims (Returns) | `RotateCcw` | `RotateCcw` ✓ (matches) |
| Performance | `TrendingUp` | `TrendingUp` ✓ (matches) |

Additionally, the desktop sidebar has "Company" (`Landmark`) in the Manage group — this is missing from the mobile "More" sheet entirely.

## Changes

**File:** `src/components/layout/AppLayout.tsx`

1. Update imports: replace `Store`, `UsersRound`, `Tags`, `BarChart3`, `Receipt` with `UserRound`, `UserCheck`, `Gift`, `ChartNoAxesCombined`, `FileText`, `Landmark`.
2. Update `moreGroups` array to use the correct icons and add the missing "Company" item.
3. Clean up unused icon imports.

**1 file, ~10 line changes. No layout or behaviour changes.**

