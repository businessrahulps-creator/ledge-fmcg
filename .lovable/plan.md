

# Fix: Accidental Pull-to-Refresh on Mobile

## Problem
The custom pull-to-refresh hook triggers too easily. The threshold is only 80px with a 0.5x multiplier, meaning a ~160px upward scroll overshoot triggers a full page refresh. On mobile, normal scrolling back to the top frequently causes accidental refreshes.

Two issues:
1. **Threshold too low** — 80px is very easy to hit accidentally
2. **No guard against the browser's native pull-to-refresh** — both can fire simultaneously
3. **No minimum vertical intent check** — any tiny upward drag from scroll-top triggers pull mode

## Fix

### `src/hooks/use-pull-to-refresh.ts`
1. **Raise default threshold** from `80` to `120` — requires more deliberate pull
2. **Reduce rubber-band multiplier** from `0.5` to `0.35` — more resistance, harder to accidentally hit threshold
3. **Add a dead zone** — ignore pulls under 10px to filter out scroll bounce
4. **Disable browser native overscroll-behavior** on the container via CSS to prevent double-refresh

### `src/index.css`
5. **Add `overscroll-behavior-y: contain`** to the body/html to suppress the browser's built-in pull-to-refresh globally on mobile

## Files Changed
- `src/hooks/use-pull-to-refresh.ts` — increase threshold, reduce multiplier, add dead zone
- `src/index.css` — add `overscroll-behavior-y: contain` to prevent native pull-to-refresh

