

# Fix TrustBar Stats — Single Line on Mobile

## Problem
At 390px, the stat texts ("₹0 setup cost", "4 user roles built-in", "Works offline") wrap to multiple lines because `text-[18px]` is too large for a 3-column grid on mobile.

## Fix — `src/components/landing/sections/TrustBar.tsx` line 38

Reduce mobile font size from `text-[18px]` to `text-[13px]` and remove horizontal padding on mobile so all three stats fit on one line:

```
- <div className="text-center px-4">
-   <div className="font-heading font-extrabold text-[18px] md:text-[20px] text-[#1A1A1A] mb-1">
+ <div className="text-center px-1 md:px-4">
+   <div className="font-heading font-extrabold text-[13px] md:text-[20px] text-[#1A1A1A] mb-1 whitespace-nowrap">
```

- `text-[13px]` on mobile → fits all three in one line at 390px
- `whitespace-nowrap` prevents any wrapping
- `px-1` on mobile reduces wasted space between columns
- Desktop stays at `text-[20px]` with `px-4`

## What does NOT change
- Stat text content, section layout, animations, colors, pull quote

