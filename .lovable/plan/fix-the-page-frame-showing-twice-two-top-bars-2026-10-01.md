# Fix: the page frame showing twice (two top bars)

## What's happening
Every signed-in page sits inside one shared frame (side menu + top bar). Each page also asks: "Am I already inside the frame?" If yes, it doesn't draw another one.

That "am I inside the frame?" signal is created in the same file as the frame. When that file reloads in the preview (it happens every time I make a change while you have the preview open), a fresh copy of the signal is created. The frame that's already on screen still sends the old signal, but pages now check the new one. So a page thinks it's outside the frame and draws a second top bar inside the first one. That's the screenshot.

This only happens in the editor preview after a change. Your published app and customers aren't affected. A full page refresh also clears it.

## Fix
- Move the "inside the frame" signal into its own small file that never changes, so it survives preview reloads.
- Add a second safety check: if a page ever finds itself inside a frame anyway, it never draws another one.

Nothing else changes: same pages, same menu, same speed.

## Check
- Make a small change, switch between Dashboard, Orders, Sales team and My Business in the preview, and confirm only one top bar shows.
- Run all automatic tests and the type check.

## Technical details
- New `src/components/layout/shell-context.ts` exporting `ShellContext = createContext(false)`; `AppShell` and `AppLayout` import it from there (an HMR boundary that isn't re-evaluated when AppLayout.tsx is edited).
- Fallback guard: `AppLayoutFrame` sets `data-app-shell` on its root; `AppLayout` also checks a module-level mounted counter on `window` (`__ledgeShellMounted`) before rendering a frame.
