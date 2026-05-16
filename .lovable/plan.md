## Goal

Today `xlsx` and the `pdf()` renderer function are already loaded on demand, but **8 entry points still statically import a PDF "document" component** (`ReportPdf`, `PerformanceReportPdf`, `DealerStatementPdf`, `SalespersonStatementPdf`). Each of those modules statically pulls in `@react-pdf/renderer` (~400KB gz), so the heavy renderer ends up in the route chunk for Performance, DealerDetail, SalespersonDetail, and every Report tab — even for users who never click Export.

We'll match the pattern already used in `OrderDetail.tsx`, `Billing.tsx`, `Orders.tsx`, and `shareWhatsApp.ts`: import the PDF component inside the click handler, in parallel with `downloadPdf` doing its own dynamic import of the renderer.

## Files to update

| # | File | Currently static | Change |
|---|------|------------------|--------|
| 1 | `src/pages/DealerDetail.tsx` | `DealerStatementPdf` | Move to dynamic `import()` inside the Export Statement handler |
| 2 | `src/pages/SalespersonDetail.tsx` | `SalespersonStatementPdf` | Same |
| 3 | `src/pages/Performance.tsx` | `PerformanceReportPdf` | Same |
| 4 | `src/components/reports/DistributorReport.tsx` | `ReportPdf` | Move into `onGenerate` callback of `ExportPdfModal` |
| 5 | `src/components/reports/SalesTeamReport.tsx` | `ReportPdf` | Same |
| 6 | `src/components/reports/ProductReport.tsx` | `ReportPdf` | Same |
| 7 | `src/components/reports/PaymentReport.tsx` | `ReportPdf` | Same |
| 8 | `src/components/reports/DispatchReport.tsx` | `ReportPdf` | Same |

`ExportPdfModal` itself stays statically imported — it's a plain shadcn dialog with no `@react-pdf/renderer` dependency, so it's safe and avoids a flicker when opening the export modal.

## Pattern (copy from `OrderDetail.tsx`)

```ts
// at top
// PDF component is dynamically imported on click to keep @react-pdf/renderer
// out of the route chunk
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
// no static import of the *Pdf component

// inside the click / onGenerate handler
const { DealerStatementPdf } = await import("@/components/pdf/DealerStatementPdf");
await downloadPdf(
  pdfFilename("dealer-statement", dealer.name),
  <DealerStatementPdf {...props} />,
);
```

Where a callsite needs the component type (e.g. TypeScript prop typing), use a `type`-only static import — `import type { DealerStatementPdfProps } from "..."` — so only types are kept and the runtime module stays out of the chunk.

## Non-goals / things to leave alone

- `xlsx` is already dynamically loaded inside `exportCsv` / `exportBackup`. No change needed.
- `OrderDetail.tsx`, `Billing.tsx`, `Orders.tsx`, `shareWhatsApp.ts` — already follow the pattern.
- Do **not** lazy-load `ExportPdfModal` — it's lightweight and lazy-loading it would add a noticeable open delay.
- No changes to PDF templates, formatting, or export UX.
- No changes to backend, RLS, or data fetching.

## Verification

1. `bun run build` — confirm `@react-pdf/renderer` lands in a **separate chunk** (e.g. `assets/react-pdf-*.js`) and is no longer present inside the Performance / DealerDetail / SalespersonDetail / Reports route chunks. Inspect `dist/assets/*.js` sizes before/after.
2. Manually click each Export button in preview (Dealer statement, Salesperson statement, Performance PDF, all 5 report tabs) and confirm PDFs still download successfully.
3. Network tab on first load of `/performance` and `/dealers/:id` should no longer fetch the react-pdf chunk until the user clicks Export.

## Expected outcome

Route chunks for Performance, DealerDetail, SalespersonDetail, and Reports drop by roughly the `@react-pdf/renderer` weight. The renderer is fetched once on first Export click and cached for the rest of the session.
