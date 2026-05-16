---
name: Billion-dollar roadmap
description: 12-PR plan to bring Ledge to MS-grade quality; tracks shipped items
type: feature
---
# Roadmap

Source: `.lovable/plan.md`.

## Shipped
- PR1 PageHeader primitive (`src/components/ui/page-header.tsx`)
- PR2 TopProgress bar (`src/components/ui/top-progress.tsx`)
- PR3 Undo-toast helper (`src/lib/use-undoable-action.ts`, wired in Distributors)
- PR4 Universal Cmd/Ctrl+K palette (`src/components/CommandPalette.tsx`)
- PR5 Per-route skeletons wired in `src/App.tsx`
- PR6 DataTable v2 primitive (`src/components/ui/data-table.tsx`)
- PR7 Autosave primitives: `src/hooks/use-autosave.ts` + `src/components/ui/save-indicator.tsx` (not yet wired)
- PR8a Row-hover prefetch on Orders rows
- PR9 Dashboard AI digest (`dashboard-digest` fn + `<TodayDigest>`)
- PR10 Inline "explain this number" — edge function `explain-metric` (Gemini 2.5 Flash) + `<ExplainButton>` ✦ component. Wired into Dashboard "This Month" cells (Revenue/Orders/Outstanding/Delivered). Pattern: pass `metric`, `value`, `context[]` bullets; popover memoises result per open.
- PR11 Keyboard shortcuts — `<KeyboardShortcuts>` mounted in AppLayout. Maps: `?` overlay, `n` new order, `g`-prefix nav (`g d/o/b/s/e/t/r/p`). Skips when typing in input/textarea/contentEditable. Two-key chord has 1.2s window.
- PR12a Polish: `<SmartTime>` component (`src/components/ui/smart-time.tsx`) — just now → N min ago → today HH:MM → Yesterday → Tue 12 May → 12 May 2024. Self-updates every 60s. Tabular-nums + focus rings already covered in index.css.

## Next / Not yet wired
- Wire `useAutosave` into Company + Settings forms
- Roll out `<DataTable>` to Orders / Billing / Stock
- Replace ad-hoc time displays with `<SmartTime>`
- Add ExplainButton to Daily Breakdown KPIs + Performance/Reports tiles
- PR8b Virtualize Orders + Stock when row counts justify

## Notes
- AI edge functions use `LOVABLE_API_KEY` (auto-provided). Model: `google/gemini-2.5-flash`.
- Two AI fns deployed: `dashboard-digest`, `explain-metric`.
