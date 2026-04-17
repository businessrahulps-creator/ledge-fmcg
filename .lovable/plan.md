

## Plan — Category 1: UX / Polish (suggestions 1–4)

I'll explore the relevant files first, then present the concrete edits per suggestion. Since this is plan mode, I'll lay out exactly what changes in each file. After approval, I implement Category 1, reply with the completion line, and proceed to Category 2 in the next turn.

### Suggestion 1 — Indian number formatting everywhere (lakhs/crores)

**Goal:** Ensure all currency renders use `en-IN` grouping (₹12,45,678).

**Approach:** Audit `src/utils/` and pages for currency formatting. Most code likely already uses `Intl.NumberFormat('en-IN')`, but a few PDFs and dashboard tiles use raw `toLocaleString()` or manual formatters. Centralize via a single helper.

**Plan:**
- Add `formatINR(n)` and `formatINRCompact(n)` to `src/utils/formatDate.ts` (or new `src/utils/formatCurrency.ts`).
- Audit & replace inconsistent call sites in: `Dashboard.tsx`, `Reports.tsx`, `Performance.tsx`, `OrderDetail.tsx`, `DealerDetail.tsx`, `SalespersonDetail.tsx`, PDF components (`OrderInvoicePdf`, `GstInvoicePdf`, `DealerStatementPdf`, `PerformanceReportPdf`, `SalespersonStatementPdf`), and report components.
- Keep existing `formatCurrencyPdf` in `exportPdf.ts` but route it through the same helper for consistency.

### Suggestion 2 — Empty-state illustrations & CTAs on every list page

**Goal:** Friendly empty states with a primary CTA on Orders, Dealers, Stock, Salespersons, Distributors, Schemes, Targets, Claims.

**Approach:** Create one reusable `<EmptyState>` component (icon + title + description + CTA button), use lucide icons (already in deps — no new dep). Drop into each list page where the current "No data" / blank state lives.

**Plan:**
- New file: `src/components/ui/empty-state.tsx` — small component: `{ icon, title, description, actionLabel, onAction }`.
- Wire into: `Orders.tsx`, `Distributors.tsx` (Dealers), `Stock.tsx` (both Products + Warehouses tabs), `Salespersons.tsx`, `Schemes.tsx`, `Targets.tsx`, `Claims.tsx`.
- Each gets a contextual message + CTA that opens the existing "create" flow (no new logic).

### Suggestion 3 — Confirm-before-leave on dirty forms

**Goal:** Prevent accidental data loss on `NewOrder`, `DealerDetail`, `Company`.

**Approach:** Use React Router's `useBlocker` (already on react-router-dom v6+). One small hook wraps it.

**Plan:**
- New hook: `src/hooks/use-unsaved-changes-guard.ts` — accepts a `boolean isDirty`, blocks navigation, shows a confirm dialog (use existing `AlertDialog` from `@/components/ui/alert-dialog`).
- Also wires `beforeunload` for tab close / refresh.
- Wire into `NewOrder.tsx`, `DealerDetail.tsx`, `Company.tsx` — track dirty state from existing form state (each already has local form state).

### Suggestion 4 — Skeleton parity across lazy routes

**Goal:** `Performance` and `Claims` lazy fallbacks should match their actual layout (dashboard-like, not list-like).

**Approach:** Add small variant to existing `page-skeleton.tsx`.

**Plan:**
- Edit `src/components/ui/page-skeleton.tsx` — add `DashboardPageSkeleton` (KPI grid + chart blocks) export alongside existing `ListPageSkeleton`.
- Edit `src/App.tsx` (or wherever `lazy(...)` fallbacks are configured) — use `DashboardPageSkeleton` for `Performance` and `Claims` routes.

### Files touched (Category 1)
- **New:** `src/utils/formatCurrency.ts`, `src/components/ui/empty-state.tsx`, `src/hooks/use-unsaved-changes-guard.ts`
- **Edited:** `src/components/ui/page-skeleton.tsx`, `src/App.tsx`, `src/utils/exportPdf.ts`, `src/pages/Dashboard.tsx`, `src/pages/Reports.tsx`, `src/pages/Performance.tsx`, `src/pages/OrderDetail.tsx`, `src/pages/DealerDetail.tsx`, `src/pages/SalespersonDetail.tsx`, `src/pages/Orders.tsx`, `src/pages/Distributors.tsx`, `src/pages/Stock.tsx`, `src/pages/Salespersons.tsx`, `src/pages/Schemes.tsx`, `src/pages/Targets.tsx`, `src/pages/Claims.tsx`, `src/pages/NewOrder.tsx`, `src/pages/Company.tsx`, plus PDF components listed above.

### Stays the same
- All business logic, validation, RLS, real-time sync, PWA behavior, mobile-first layout, design tokens.
- No new dependencies.

After Category 1 ships I'll proceed to Category 2 (Performance) in the next message, following the same plan-then-implement pattern.

