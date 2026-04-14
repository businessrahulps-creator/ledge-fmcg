

# Shrink "All systems operational" Badge for Mobile

## Problem
The status badge overflows its container on mobile (390px viewport) due to padding and font size.

## Fix — `src/components/landing/sections/Footer.tsx`

Reduce the badge's padding, gap, font size, and dot size:

- **Line 77** — Container: `gap-2 px-3.5 py-2` → `gap-1.5 px-2.5 py-1.5`
- **Line 87** — Dot wrapper: `h-2 w-2` → `h-1.5 w-1.5`
- **Lines 88-89** — Inner dots: `h-2 w-2` → `h-1.5 w-1.5`
- **Line 91** — Text: `text-[13px]` → `text-[11px]`

Single file, 4 small changes.

