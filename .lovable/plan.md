

Root cause is in the shared tooltip primitive, not the refresh button itself.

## What’s happening
- `RefreshAppButton` is using `TooltipContent side="bottom"`.
- The shared `src/components/ui/tooltip.tsx` renders `TooltipPrimitive.Content` directly, without a `TooltipPrimitive.Portal`.
- In `AppLayout`, the header sits inside containers with `overflow-hidden`, so the tooltip is being clipped and visually appears to slide under the dashboard area when hovered.

## Fix
### 1) Update the shared tooltip component
**File:** `src/components/ui/tooltip.tsx`
- Wrap `TooltipPrimitive.Content` in `TooltipPrimitive.Portal`, matching how the project already handles popovers/dropdowns.
- Keep the current styling and animations.
- Slightly increase breathing room with a safer default offset if needed, but no visual redesign.

### 2) Keep the refresh button simple
**File:** `src/components/layout/RefreshAppButton.tsx`
- Leave the button styling and tooltip label as-is unless the portal fix reveals a minor spacing issue.
- If needed, only make a tiny positioning tweak such as `sideOffset={8}` on this button’s tooltip.

## Expected result
- Hovering the refresh icon shows “Check for updates” fully above the app UI instead of being clipped under the dashboard.
- Same fix also improves any other tooltip using this shared component.

## Files to change
1. `src/components/ui/tooltip.tsx`
2. `src/components/layout/RefreshAppButton.tsx` only if a tiny offset adjustment is still needed after the portal fix

## Out of scope
- No changes to refresh/update logic
- No changes to the syncing indicator
- No changes to header layout, bell, clock, or role badge

