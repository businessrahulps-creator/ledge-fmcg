

# Swipeable Bottom Navigation — Apple Music Style

## Concept
Remove the "More" button + bottom drawer. Instead, make the entire bottom nav bar a **horizontally scrollable strip** containing all 7 nav items (Home, Orders, Stock, Reports, Dealers, Sales Team, Settings) plus Log out. The user swipes left/right to reveal more items — exactly like Apple Music's tab bar behavior on iOS.

## How it works
- All nav items sit in a single horizontal row inside a `overflow-x-auto` container with hidden scrollbar
- The strip is wider than the screen, so items like Dealers, Sales Team, Settings are off-screen to the right
- User drags/swipes horizontally to see them — no tap needed, no sheet popup
- A subtle fade gradient on the right edge hints that more items exist
- When navigating to a "hidden" item (e.g. Dealers), the strip auto-scrolls to show the active item using `scrollIntoView`

## Visual
```text
┌──────────────────────────────┐
│ [Home] [Orders] [Stock] [Reports] [Dealers] [Sales] [Settings] [Logout]
│  ◄──── visible ────►  ◄── swipe to reveal ──►
└──────────────────────────────┘
```

## Changes — single file: `src/components/layout/AppLayout.tsx`

1. **Merge nav arrays**: Combine `mobileNav` + `moreLinks` + Log out into one flat `allMobileNav` array
2. **Remove**: `moreOpen` state, `isMoreActive`, the "More" button, the entire `<Drawer>` block, Drawer imports
3. **Replace `<nav>` internals**: Wrap all nav items in a horizontal scroll container:
   - `overflow-x-auto scrollbar-hide` (CSS utility to hide scrollbar)
   - `flex-nowrap` so items stay in one row
   - Each item has `flex-shrink-0` and fixed width (~64px)
4. **Right fade hint**: Add a `pointer-events-none` gradient overlay on the right edge of the nav bar (`bg-gradient-to-l from-card to-transparent`) so users see there's more to scroll
5. **Auto-scroll to active**: Use a `useRef` on the nav container + `useEffect` watching `location.pathname` to call `activeElement.scrollIntoView({ inline: 'center', behavior: 'smooth' })` so the active tab is always visible
6. **Add scrollbar-hide utility**: Add `.scrollbar-hide::-webkit-scrollbar { display: none }` and `-ms-overflow-style: none; scrollbar-width: none` to `src/index.css`

## Result
- No more popup/drawer — feels native and fluid
- One-handed thumb swipe to access all destinations
- Active item always scrolls into view automatically
- Maintains the existing animated pill indicator (`layoutId="nav-pill"`)

