# Fix three mobile UI issues

## 1. The "first week" guide flashes on and off

On a phone the app loads your business in two waves. Dealers, products and team arrive first; orders arrive a moment later. The guide is drawn during that gap, sees no orders yet, decides "Create your first order" is still pending, and shows itself — then hides again once the orders land. Nothing is wrong with your setup; it is a timing flicker.

Fix:
- Hold the guide back until all business data has finished loading, so it never draws a half-loaded verdict.
- Once the six chapters have been completed, remember that permanently, so a slow start can never resurface the guide again.
- Same guard for the small progress ribbon that rides with it.

## 2. Order date field overflowing

The date box on New Order uses the phone's native date control, which pushes its own wide internal layout and spills past the field on narrow screens, while the date itself sits oddly centred.

Fix:
- Constrain the field to the column width, allow it to shrink, and left-align the value so it reads like the other fields.
- Give the native date control the same height, padding and font as the dealer and sales person pickers so the row looks consistent.

## 3. Summary sitting under the Save Order button, scrolling like parallax

On a phone the Save Order bar is pinned inside the same column as the Summary card. The card slides underneath the pinned bar as you scroll, which reads as a parallax glitch, and the Summary ends up visually below the button.

Fix:
- On phones, lift the Save Order bar out of the column flow so it is a genuine bottom action bar, sitting above the page with a solid surface and a clean top edge — nothing ever appears to slide under a transparent panel.
- Order the phone layout so Summary and Schemes read above the action bar, with enough bottom padding that the last card clears the bar and the tab bar.
- Desktop layout stays exactly as it is today.

## Technical notes

- `src/components/onboarding/FirstWeek.tsx`: gate render on the data-context `loading` flag (and orders having been fetched) before computing `activeIdx` / `isComplete`; persist a `ledge_first_week_done` flag in localStorage once `isComplete` is first observed with data loaded, and return null on that flag thereafter.
- `src/pages/NewOrder.tsx` line ~450: date `Input` gets `w-full min-w-0 block` plus `text-left` and matching `h-10 md:h-12` paddings; add an `appearance-none`-style rule for the webkit date edit fields in `index.css` if the native control still overflows.
- `src/pages/NewOrder.tsx` line ~770: replace the `sticky bottom-0` wrapper with a `fixed inset-x-0 bottom-[nav] md:static` action bar using an opaque `bg-background` (not `/95` blur) and safe-area padding; bump the sidebar `pb-32` to clear the bar and the bottom tab bar.
- No pricing, totals, scheme or GST logic touched — layout and render-gating only.

## Verification

Type check, tests, build, then a 393x800 browser pass: dashboard reload (guide must not flash), New Order date field at narrow width, and scrolling New Order to confirm nothing slides under the Save bar.
