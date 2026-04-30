## Fix Footer Status card overflowing on mobile

**Problem:** The "All systems operational" pill is wider than its parent card and bleeds outside the rounded border on narrow screens (visible in your screenshot). Cause: the pill uses `whitespace-nowrap` + `w-fit` and the card sits in a 1-column footer grid that becomes very narrow on mobile.

### Fix (Footer.tsx, status card block)

1. **Pill (line 155)**: add `max-w-full` so it can't exceed the card width. Keep `whitespace-nowrap` removed isn't necessary — instead change the text wrapper to allow wrapping at narrow widths: drop `whitespace-nowrap` from the inner span (line 168) and add `leading-tight` so a 2-line wrap looks clean. The text "All systems operational" is short enough to stay on one line at typical mobile widths but will gracefully wrap on extreme narrow viewports instead of clipping.
2. **AWS line (line 174)**: add `flex-wrap` so the logo + text don't push out of the card; the existing 12px text already fits.
3. **Card padding**: reduce mobile padding from `p-4` to `p-3.5` so the pill has more room (`p-3.5 sm:p-4`).

These three small changes keep the desktop look identical and stop the overflow on mobile.

No new components, ~3 className tweaks in `src/components/landing/sections/Footer.tsx` (lines 153, 155, 168, 174).
