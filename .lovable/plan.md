

# Perplexity-Style Collapsed Sidebar

## Problem
The collapsed sidebar shows bare icons floating in a narrow column — no labels, no visual containers — making it hard to identify items and looking unfinished compared to the expanded state.

## Perplexity's Approach
Each collapsed nav item is a vertically stacked column: icon inside a subtle rounded background circle, with a tiny label underneath. Items are centered and well-spaced, creating a dock-like feel.

## Solution

**File: `src/components/layout/AppSidebar.tsx`**

Update `renderNavItem` so that when `collapsed`, each item renders as a centered column layout:

```text
  ┌─────────┐
  │  (icon) │  ← 36×36 rounded-xl bg on hover/active
  │  Label  │  ← text-[10px] font-medium, truncated
  └─────────┘
```

Specific changes:
1. When collapsed, switch the NavLink layout from `flex items-center gap-3` (horizontal) to `flex flex-col items-center gap-0.5` (vertical stack)
2. Icon gets a wrapper `div` with `h-9 w-9 flex items-center justify-center rounded-xl` — active state gets `bg-sidebar-accent`, hover gets `hover:bg-sidebar-accent/50`
3. Always show a tiny label: `<span className="text-[10px] font-medium leading-tight">` — even when collapsed
4. Apply same pattern to the Settings footer item
5. Increase `SidebarGroup` vertical spacing slightly when collapsed for breathing room

**File: `src/components/ui/sidebar.tsx`**
- Widen `SIDEBAR_WIDTH_ICON` from `"3rem"` to `"4.5rem"` so labels fit without clipping

## What stays the same
- Expanded sidebar is completely unchanged
- All nav links, routes, icons, active detection, logo logic, realtime subscription — untouched
- Mobile sheet sidebar unchanged (it always shows expanded)

