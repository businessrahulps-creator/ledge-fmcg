## Goal

Give every export triggered from the report footer (Excel, PDF, and PaymentReport's Aging Summary) a clear loading state plus success/error toasts, so users get feedback during the brief generation window and aren't left guessing if a click registered.

## Approach

Centralize the behavior inside `src/components/reports/ReportExportFooter.tsx` so all 5 reports inherit it without per-call boilerplate.

### 1. `ReportExportFooter` upgrades

- Accept handlers that may return `void | Promise<void>`.
- Internal `useState` tracks `excelLoading`, `pdfLoading` independently.
- On click: set loading → `await Promise.resolve(onExcel())` inside `try/catch` → toast on result → unset loading.
  - Success: `toast.success("Excel ready", { description: "Download started." })` / `"PDF ready"`.
  - Error: `toast.error("Export failed", { description: err.message })` and route through `logError` for console hygiene (no-console rule).
- Buttons show `Loader2` spinner (animate-spin) in place of the icon while loading and become `disabled`.
- Both Excel and PDF buttons are disabled while either is running to prevent double-fire.

### 2. New `extraAction` prop for typed slots (replaces ad-hoc `extra` JSX in PaymentReport)

```ts
extraAction?: {
  label: string;
  icon: LucideIcon;
  onClick: () => void | Promise<void>;
  title?: string;
};
```

Footer renders this with the same loading/toast wrapper. Keep the existing `extra: ReactNode` prop as an escape hatch for future custom slots, but migrate PaymentReport's Aging Summary button to `extraAction` so it gets the same UX.

### 3. PaymentReport migration

- Replace the inline `<Button>` inside `extra={…}` with `extraAction={{ label: "Aging Summary", icon: BarChart3, onClick: () => { … existing exportXlsx call … } }}`.
- Drop the now-unused `Button` import if nothing else needs it.

### 4. PDF flow nuance

`onPdf` in every report currently just calls `setPdfOpen(true)` and the actual PDF is generated inside a Dialog by `@react-pdf/renderer`. A success toast at click time would be misleading ("PDF ready" before it's rendered). Handling:

- If `onPdf` resolves synchronously in <50ms, **skip** the success toast (the dialog opening is its own feedback) but still show the spinner briefly and surface any thrown error as a toast.
- Errors thrown synchronously still produce `toast.error("Couldn't open PDF preview")`.

This keeps the toast meaningful: success toasts only fire for true file-download actions (Excel + Aging Summary), error toasts fire for all three.

## Files touched

- `src/components/reports/ReportExportFooter.tsx` — loading state, toast wrapper, `extraAction` prop, spinner.
- `src/components/reports/PaymentReport.tsx` — migrate Aging Summary button to `extraAction`.

No business-logic or data changes; presentation only.
