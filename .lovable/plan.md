## Goal

When the user triggers print on `/command` (via the Printer button or `Shift+P`), show an in-app Print Preview that reflects the actual paginated output. They scroll through the simulated A4 pages, confirm everything looks right, then click "Print now" to fire the real print dialog. No more "click print → realise it looks wrong → cancel → tweak → repeat".

## Approach — iframe-based WYSIWYG preview

The cleanest way to guarantee what-you-see-is-what-prints is to render the same Command view inside an iframe sized to A4 width, with the existing `@media print` rules promoted to also apply via a `.print-mode` class. The iframe becomes the source of truth — clicking "Print" calls `iframe.contentWindow.print()` so only the iframe content is sent to the printer, sidestepping any future regressions in app shell print CSS.

### 1. New `PrintPreviewDialog.tsx` (`src/components/command/`)

Full-screen Radix `Dialog` with a slim toolbar:

```
┌─────────────────────────────────────────────────────────────┐
│  Print Preview · Last 30 days · 3 pages    [Close]  [Print] │
├─────────────────────────────────────────────────────────────┤
│  ┌──── A4 page 1 ────┐                                       │
│  │ (live Command UI) │   ← iframe, 794px wide, scrollable   │
│  └───────────────────┘                                       │
│  ─ ─ ─ page break ─ ─ ─                                      │
│  ┌──── A4 page 2 ────┐                                       │
│  …                                                           │
└─────────────────────────────────────────────────────────────┘
```

- iframe `src="/command?print=1&period=<current>&tab=<current>&view=<current>"` — carries the user's current filters so the preview matches what they're looking at.
- iframe width: 794px (A4 portrait @ 96dpi). Toolbar adds horizontal scroll on small viewports.
- Page-break visualization: inside the iframe body, a repeating linear-gradient draws a faint dashed horizontal line every 1123px (A4 portrait height) so the user can literally see where each page will split. Computed once on load; pure CSS, zero JS pagination math.
- Page count read from `iframe.contentDocument.body.scrollHeight / 1123` and shown in the toolbar.
- "Print" button → `iframe.contentWindow?.focus(); iframe.contentWindow?.print();`.
- `afterprint` listener on the iframe closes the dialog automatically.
- `Esc` closes via Radix default.

### 2. `/command` route — print mode

Command.tsx detects `?print=1` via `useSearchParams`:

- Wraps its root in `<body data-print-preview>` (set via `useEffect`) and renders only the section content (no sidebar/topbar/bottom-nav — those already live in AppLayout but we mount the route inside a stripped layout when `print=1`).
- The existing `@media print` selectors in `src/styles/command-print.css` get a sibling rule set scoped under `body[data-print-preview]` so the same hiding/flattening behaviour activates on screen inside the iframe. Refactor: extract the shared rule block into a mixin-like CSS group used by both selectors — no duplication.
- A tiny header on the print page mirrors `<p data-print-only>` content (period + generated-at) — already in place.

To avoid double app shell mounting, gate AppLayout in `App.tsx` (or wherever it wraps `/command`) with a check: if `?print=1`, render the route bare. Cleanest: a new `PrintShell` layout used by a sibling route entry that points to the same Command component.

### 3. Trigger points

- `PrintButton.tsx` → opens `PrintPreviewDialog` (state lifted to Command.tsx).
- `useCommandShortcuts` → `Shift+P` opens the preview (currently calls `window.print()` directly).
- `P` remains the branded PDF export (unchanged).
- `KeyboardCheatSheet` updates the `Shift+P` label from "Browser print" to "Print preview".

### 4. Files

- New: `src/components/command/PrintPreviewDialog.tsx`
- Modified: `src/components/command/PrintButton.tsx` (accept `onClick` prop, lift state)
- Modified: `src/pages/Command.tsx` (mount dialog, read `?print=1`, pass to shortcuts)
- Modified: `src/hooks/useCommandShortcuts.ts` (rename `onPrintBrowser` semantics to `onPrintPreview`)
- Modified: `src/components/command/KeyboardCheatSheet.tsx` (label)
- Modified: `src/styles/command-print.css` (mirror `@media print` rules under `body[data-print-preview]`)
- Modified: route config to mount `/command?print=1` outside AppLayout (likely `src/App.tsx`)

## Out of scope

- True per-page pagination preview with widow/orphan controls (would need a paged-media polyfill like `pagedjs`; overkill for V1).
- Editing margins/orientation from the preview toolbar — the browser's native print dialog already exposes those after "Print now".
