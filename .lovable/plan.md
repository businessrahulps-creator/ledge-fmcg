

# Add Live IST Clock to Header

## New file: `src/components/layout/LiveClock.tsx`
A small component using `useState` + `setInterval(1000)` to display current IST time formatted via `Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })` followed by a dim "IST" label. Styled with `text-xs font-mono text-muted-foreground` to match the monochrome aesthetic.

## Modified: `src/components/layout/AppLayout.tsx`
Import `LiveClock` and place it in the header's right-side `div` (before the role badge), so the order is: LiveClock → Role Badge → NotificationCenter.

No other files touched.

