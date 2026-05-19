## /command — bug fixes & perf pass

### What's actually broken (diagnosis)

**1. Print shows only one page, looks like a screenshot of the website**

`AppLayout` wraps everything in `<div className="flex h-dvh w-full overflow-hidden">` and the scroller is an inner `<main className="flex-1 overflow-y-auto overflow-x-hidden ...">`. On `window.print()`, the browser respects those rigid heights — the document becomes exactly one viewport tall with `overflow:hidden`, so the printer just captures that one frame instead of paginating real content. Our `command-print.css` overrides `main` width but never neutralizes the `h-dvh` / `overflow:hidden` on the ancestor shells, the sticky header, or the inner scroll-main. That is why the result feels like a "print of the website".

**2. Page can't scroll on /command**

Two contributing issues:

- **Nested `<main>`**: `AppLayout` already renders the scroll `<main>`. `Command.tsx` wraps its content in a *second* `<main data-command-root>`. Two `<main>` elements is invalid a11y, and more importantly, on some setups the inner element steals focus/scroll affordance and confuses the outer scroller (especially with the new `<KeyboardCheatSheet>` Radix Sheet mounted next to it).
- **Radix scroll-lock leak**: `WhatsAppBlastSheet` is rendered as `{blastPayload && <Sheet open=... />}`. When the user closes the sheet, `setBlastSignalId(null)` makes `blastPayload` null, which **unmounts** the Sheet *before* Radix's close cleanup runs. Radix Dialog/Sheet then never restores `body { pointer-events: auto }` and `body { overflow: hidden }`, which is exactly the "can't scroll, something is blocking" symptom. Same risk exists if `KeyboardCheatSheet` toggles fast.

**3. Misc perf hotspots**

- `Command.tsx` keeps a `lastUpdated` `useState` that re-renders the entire Command tree (including all charts) on every `api.loading` flip.
- `CommandLineChart`, `AgingStrip`, `PipelineFunnel`, `LeaderboardCard`, `CreditAtRiskCard`, `ActivityFeed` are not memoized — they re-render even when their inputs didn't change.
- Sparkline math in `OverviewTab.useMemo` already iterates `orders` 3× — fine, but it's recomputed when only `range` changes; we'll inline a single-pass reducer.

### Fixes

**A. Print: rebuild the print stylesheet so it actually paginates** (`src/styles/command-print.css`)

```text
@media print:
  html, body, #root, [data-app-shell], [data-app-shell] > *  →
    height: auto !important; max-height: none !important;
    overflow: visible !important; display: block !important;
  Hide: <aside>, [role="banner"], [data-mobile-nav], .command-no-print, [data-print-hide], [role="tablist"]
  main (both outer and inner) → height:auto; overflow:visible; padding:0; width:100%
  Cards → break-inside: avoid
  [data-print-break] → page-break-before
```

Tag `AppLayout`'s root wrapper with `data-app-shell` so the print rules can target it without rewriting layout. Tag the bottom mobile nav with `data-mobile-nav`.

Verify: `window.print()` on /command produces multi-page A4 with all sections, not a single screenshot.

**B. Scroll: stop the Radix leak and remove nested `<main>`** (`src/pages/Command.tsx`)

- Change inner `<main data-command-root>` → `<section data-command-root>` (keep aria-label).
- Render `WhatsAppBlastSheet` unconditionally: keep the last non-null `blastPayload` in a ref so the sheet has data to render during its close animation, and drive open purely from `!!blastSignalId`. The sheet then unmounts only *after* Radix's exit cleanup, restoring `body` styles.
- Same guard for `KeyboardCheatSheet` (already unconditional — confirm).
- Add a tiny "scroll-lock janitor" in `AppLayout` that, on every route change, resets `document.body.style.pointerEvents = ""` and `document.body.style.overflow = ""`. Cheap belt-and-suspenders against future Radix leaks.

**C. Perf: memoize hot children + scope `lastUpdated`**

- Move `lastUpdated` into a small `<MemoryStripMount>` subcomponent so its tick doesn't re-render charts.
- Wrap `CommandLineChart`, `AgingStrip`, `PipelineFunnel`, `LeaderboardCard`, `CreditAtRiskCard`, `ActivityFeed`, `CommandKpiCard` in `React.memo` with shallow prop comparison (they already take plain primitives/arrays).
- Collapse the 3 sparkline loops in `OverviewTab.useMemo` into a single pass over `orders`.

**D. Print button affordance**

Currently `<PrintButton>` is a 36×36 icon-only square with no visible label; users don't notice it. Keep size but add `<span className="sr-only">Print</span>` (already aria-labelled — fine) and add a print-only header inside `[data-command-root]` showing company name + period so the printed first page reads as a report header (currently only a `data-print-only` caption exists; we'll style it as a print title block).

### Out of scope

- Re-architecting AppLayout to lose the fixed-shell scroll model (would touch every page).
- A dedicated "Generate PDF" flow (html2canvas/jsPDF) — current ask is "fix print"; if browser print is good enough after these fixes we don't need it. We can revisit if you want a styled PDF export later.

### Verification checklist

1. /command scrolls smoothly on desktop + mobile viewport.
2. Open the "Silent & owing" WhatsApp blast sheet, close it → page still scrolls (no body lock leak).
3. `Cmd/Ctrl+P` on /command → A4 preview shows multiple pages with all sections (Hero, KPIs, Aging, Pipeline, Trend, Leaderboards, Credit-at-risk); no sidebar/topbar; cards don't break across pages.
4. React Profiler: switching period no longer re-renders unaffected charts.
