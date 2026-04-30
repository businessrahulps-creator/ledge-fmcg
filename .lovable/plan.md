## Fix Pricing trust chip wrapping on mobile

**Problem:** On mobile the "30-day free trial · No card · Cancel anytime" chip wraps awkwardly — the vertical divider lines stay attached to the items above the wrap break, leaving a dangling `|` after "No card" and "Cancel anytime" on a second line with no leading divider (visible in your screenshot).

**Root cause:** `.lp-pricing-trust-chip` uses `flex-wrap: wrap` with the dividers as separate flex children. When items wrap, the dividers don't visually align with the new line.

### Fix

In `src/index.css`, add a mobile (`max-width: 480px`) override to `.lp-pricing-trust-chip` that:

1. Hides the `__divider` elements entirely on mobile (cleaner stacked look).
2. Slightly tightens row/column gap (`gap: 8px 12px`) and padding (`padding: 8px 14px`).
3. Drops item font size from 12.5px → 12px so all three items fit on two clean lines.

Result on mobile: the three checkmark items wrap as `30-day free trial · No card` on line 1 and `Cancel anytime` centered on line 2, with no orphan divider lines. Desktop appearance is unchanged.

No component changes — pure CSS edit, ~14 lines added to `src/index.css` around line 808.
