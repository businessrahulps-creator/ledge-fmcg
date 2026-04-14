

# Fix "All systems operational" to single line on mobile

## Problem
The status badge text "All systems operational" wraps to two lines on mobile due to the container being too narrow.

## Fix
In `src/components/landing/sections/Footer.tsx` (line 91), add `whitespace-nowrap` to the text span so it stays on one line:

```
<span className="font-body text-[13px] font-medium text-[#3F3F46] relative whitespace-nowrap">
```

Single file, single line change.

