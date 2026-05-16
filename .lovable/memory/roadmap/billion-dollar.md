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
- PR4 Universal Cmd/Ctrl+K palette (`src/components/CommandPalette.tsx`)
- PR3 Undo-toast pattern — `src/lib/use-undoable-action.ts` (Gmail-style 6s undo, optimistic hide + restore-on-undo). Wired into Distributors.confirmDelete as flagship. Reuse for orders/claims/schemes.
- PR5 Per-route skeletons — wired in `src/App.tsx`: DashboardSkeleton (/dashboard), TablePageSkeleton (/orders, /billing, /stock), ListPageSkeleton (/distributors, /salespersons), DashboardPageSkeleton (/performance, /reports). Detail routes still use generic RouteSkeleton.
- PR6 DataTable v2 primitive (`src/components/ui/data-table.tsx`) — sticky header, optional sort, density toggle (compact/comfortable/spacious), CSV export, hideOnMobile. Not yet adopted by pages — opt-in primitive.

## Next
- PR7 Autosave + SaveIndicator on NewOrder, Company, Settings
- PR8 Smart prefetch on row hover; virtualize Orders + Stock
- PR9 Dashboard "Today" AI digest (Gemini)
- PR10 Inline "explain this number" affordance
- PR11 Keyboard shortcut overlay + `g`-prefix nav
- PR12 Polish pass (focus rings, tabular nums, smart timestamps, motion lockdown)

## Notes
- Undo pattern: use `useUndoableAction()` then call with `{ label, onOptimistic, onUndo, commit }`. Hide row from local state immediately; restore in onUndo; commit runs only after 6s window.
- DataTable rollout: migrate Orders table first (highest-traffic), then Billing, Stock. Don't migrate detail-page inline tables.
