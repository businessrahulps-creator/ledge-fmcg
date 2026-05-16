
## The problem (from your screenshot)

Your sidebar content overflows on shorter viewports (laptop screens, browsers with a bookmarks bar). In the screenshot, "Billing" is clipped at the top and you can see the Work group has been scrolled past — but **nothing signals that**: no fade, no scrollbar, no indicator. Users assume what they see is everything.

Same pattern hurts the mobile Menu sheet (already has a bottom fade, but no top fade and no scroll-into-view on the active item).

## Four fixes (small, additive, no IA changes)

### 1. Scroll-edge fade indicators — primary fix
Show a soft 24px fade at the top of the sidebar scroll area when there is content scrolled above, and a fade at the bottom when there is content below. The fade is the universally understood "more here" signal (used by iOS, Linear, Notion, Figma).

- Implementation: `useRef` on the `SidebarContent` scroll node, listen to `scroll` + `ResizeObserver`, toggle two `data-` attributes (`data-fade-top`, `data-fade-bottom`).
- Render two `pointer-events-none` gradient overlays (`bg-gradient-to-b from-card` / `to-card`) absolutely positioned, fading in/out via CSS based on those attributes.

### 2. Auto-scroll active item into view on route change
When the user clicks (or navigates to) an item that lives below the fold, scroll it into view inside the sidebar so it's always visible — they should never land on a page whose nav item is hidden.

- In `AppSidebar`: on `location.pathname` change, find the active row by `data-active` and call `scrollIntoView({ block: "nearest" })` on its containing scroll area. `nearest` avoids jumpy behaviour when the item is already visible.

### 3. Tighten density so most laptop viewports don't scroll at all
Right now we have 14 visible rows + 4 section headers + footer. On a 768px-tall viewport with browser chrome (~640px usable), it overflows. Small targeted cuts:

- Section group `mt-2 pt-2` → `mt-1 pt-1` (saves ~8px × 3 groups = 24px).
- Header padding `p-4` → `p-3` (saves 8px).
- Footer `pt-2` → `pt-1` and `pb-4` → `pb-3` (saves 6px).
- Net ~40px reclaimed — enough to fit everything on a 13" MacBook viewport.

Row height stays at 36px (don't compromise tap-target / readability).

### 4. Refined hover-visible scrollbar
The macOS-default invisible scrollbar is part of why no one notices the overflow. Add a thin (4px) scrollbar that's transparent at rest and fades in on hover/scroll inside `SidebarContent` only (not global). Pure CSS via `::-webkit-scrollbar` + Firefox `scrollbar-width: thin; scrollbar-color: …`.

## What this does NOT change
- No IA changes — same 4 sections, same items.
- No width changes — stays at 280px.
- No mobile bottom-bar changes.
- Mobile Menu sheet gets the same top+bottom fade treatment + auto-scroll-active for parity.

## Files affected
- `src/components/layout/AppSidebar.tsx` — scroll refs, fade overlays, auto-scroll-active, density tweaks.
- `src/components/layout/AppLayout.tsx` — mirror the fade + auto-scroll-active inside the mobile Menu sheet list.
- `src/index.css` — add `.scroll-fade-mask` helper class and the thin custom-scrollbar utility (e.g., `.scrollbar-thin-hover`).

## Verification
- Resize browser to 720px tall on `/dashboard` — top fade should appear; scrolling reveals all items.
- Click "Settings" — sidebar auto-scrolls it into view; on going back to "Dashboard", Dashboard scrolls back into view.
- On 1080p+ tall viewports — no fade visible (content fits, nothing to scroll to). No visual regression.
- Mobile: open Menu sheet — top fade appears after scrolling, bottom fade hides when reaching end.
