---
name: Billion-dollar roadmap
description: 12-PR plan to bring Ledge to MS-grade quality; tracks shipped items
type: feature
---
# Roadmap

Source: `.lovable/plan.md`.

## Shipped
- PR1 PageHeader primitive (`src/components/ui/page-header.tsx`)
- PR2 TopProgress bar (`src/components/ui/top-progress.tsx`, wired in AppLayout)
- PR3 Undo-toast helper (`src/lib/use-undoable-action.ts`) — wired into Distributors.confirmDelete
- PR4 Universal Cmd/Ctrl+K palette (`src/components/CommandPalette.tsx`)
- PR5 Per-route skeletons wired in `src/App.tsx` (Dashboard/Orders/Billing/Stock/Dealers/Sales/Performance/Reports)
- PR6 DataTable v2 primitive (`src/components/ui/data-table.tsx`)
- PR7 Autosave primitives: `src/hooks/use-autosave.ts` + `src/components/ui/save-indicator.tsx` (debounced flush, dirty/saving/saved/error/offline state, flush on tab hide). **Not yet wired into pages** — opt-in for forms (NewOrder, Company, Settings).
- PR8a Row-hover prefetch: Orders rows call `prefetchRoute('/orders/:id')` on mouseEnter/focus/touch — chunk arrives before click. Pattern can extend to Dealer/Salesperson rows.
- PR9 Dashboard "Today" AI digest: edge function `dashboard-digest` (Gemini 2.5 Flash via Lovable AI Gateway, no key needed) + `<TodayDigest>` component rendered above the hero on Dashboard. SessionStorage cache keyed by ISO date (6h TTL). Auto-hidden when no real activity.

## Next
- PR8b Virtualize Orders + Stock tables (@tanstack/react-virtual) once row count justifies it
- PR10 Inline "explain this number" affordance on KPI tiles
- PR11 Keyboard shortcut overlay + `g`-prefix nav
- PR12 Polish pass (focus rings, tabular nums, smart timestamps, motion lockdown)
- Wire `useAutosave` into Company + Settings as first beta surfaces
- Roll out `<DataTable>` to Orders / Billing / Stock

## Notes
- Undo pattern: `useUndoableAction()` → `{ label, onOptimistic, onUndo, commit }`. Hide row in local state immediately; restore on undo; commit fires after 6s.
- AI digest: edge function uses `LOVABLE_API_KEY` (auto-provided). Model: `google/gemini-2.5-flash`. Prompt enforces 2 sentences, plain-English, Indian currency conventions.
- Row-hover prefetch: any list with detail routes should wire `onMouseEnter={() => prefetchRoute('/path/' + id)}`. `prefetchRoute` is idempotent via the warmed Set.
