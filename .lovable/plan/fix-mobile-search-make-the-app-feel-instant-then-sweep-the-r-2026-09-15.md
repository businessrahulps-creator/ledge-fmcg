# Fix mobile search, make the app feel instant, then sweep the rest

Three confirmed problems, then a full screen-by-screen sweep using the design/motion
skill you linked (Emil Kowalski's skills: apple-design, animate, review-animations).

## 1. Search on the phone is genuinely broken

What is happening today: the phone search screen is built as **two separate search
engines stuck together** — the box you type in at the top, and a second hidden box
that actually drives the result list. That is why you see a stray empty search strip
under the header, why "Orders" sits highlighted before you type anything, and why
results feel out of step with what you type.

Fix: one search, one list. The box you type in drives the list directly.

- One search box, full width, big text, keyboard opens straight away.
- A clear (x) button, and the back arrow closes the screen.
- Results update as you type, with sensible order: what you searched for first
  (orders, dealers, products), then pages to jump to, then quick actions.
- Nothing is pre-highlighted before you type.
- Tapping a result closes the search and goes there — one tap, no double-tap.
- Empty and "no matches" states read in plain words.

## 2. Tapping a menu item feels stuck

Today the app deliberately waits up to 400ms before showing any loading sign, so a
slow phone shows a frozen screen and people tap again.

- The thin progress line at the top of the screen now also runs while a page is
  being fetched, not only while data refreshes.
- The tapped item reacts on touch-down (not on release) so the press registers
  instantly.
- The page's skeleton appears after ~120ms instead of 400ms.
- Menu sheet and bottom bar start fetching a page the moment your finger touches
  the item, so by the time you lift it the page is usually already there.
- The Menu sheet closes immediately on tap instead of waiting out a timer, and the
  search hand-off from the menu drops its 120ms delay.

## 3. Screen-by-screen sweep (phone and desktop)

Walk every screen signed into the demo account at phone width and desktop width,
and fix what is found. Known candidates already spotted:

- Page-change animation makes every navigation wait for the old page to fade out
  first — shorten it so pages swap crisply.
- Press feedback missing on many rows and cards (buttons react, list rows don't).
- Sheets, dialogs and dropdowns use a mix of easings and durations — settle on one
  set, exits faster than entrances.
- Anything else found in the walk gets listed and fixed in the same pass.

Each fix is verified the same way as before: build + tests, then a signed-in run on
your demo data at phone and desktop size, reporting one item at a time.

## Technical notes

- `CommandPalette.tsx`: on mobile, render a single `cmdk` `Command` root wrapping
  both the header `CommandInput` and `CommandList` (pass the input through
  `MobileSearchSheet`'s `headerSlot` from inside that root). Remove the second
  `Command` + `sr-only` mirror input (the source of the stray input wrapper) and
  the `shouldFilter={false}` split. Keep `value`-based filtering so recent/nav/data
  groups all match one query.
- Route feedback: drive `TopProgress` from a navigation-pending signal (location
  change + lazy chunk resolution) in `AppLayout.tsx`; lower `DelayedSuspense`
  default to ~120ms and give the null-fallback boundaries a real skeleton.
- Prefetch: call the existing `routeImporters[path]` on `onPointerDown`/`onTouchStart`
  for bottom-nav links and menu-sheet links (`route-prefetch.ts` already exports them).
- Motion: per apple-design/animate — feedback on pointer-down, exits shorter than
  entrances, springs only where a gesture carried momentum, all honoring
  `prefers-reduced-motion`.

## Not in scope

Money calculations, bill raising, stock movements, offline mode, or any change to
business rules — this is presentation and responsiveness only.
