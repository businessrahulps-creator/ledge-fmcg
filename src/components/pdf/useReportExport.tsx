import { downloadPdf, pdfFilename } from "@/utils/exportPdf";

/** Which parts of the document the user ticked in the export dialog. */
export interface ReportSectionSelection {
  company?: boolean;
  summary?: boolean;
  table?: boolean;
}

interface CompanyLike {
  name: string;
  address: string;
  gstin: string;
  logoUrl?: string;
}

export interface ReportExportOptions {
  /** Base name for the file; the date is appended by pdfFilename. */
  fileType: string;
  fileSuffix?: string;
  company: CompanyLike;
  selection: ReportSectionSelection;
  title: string;
  subtitle?: string;
  summary: { label: string; value: string }[];
  columns: { header: string; width: string; align?: "left" | "right" }[];
  rows: string[][];
}

/**
 * One place for the "open the PDF dialog, build the report, download it" step
 * that every report screen shares. The heavy PDF renderer is still imported
 * only on click, so no screen pays for it up front.
 */
export async function exportReportPdf(opts: ReportExportOptions): Promise<void> {
  const { ReportPdf } = await import("@/components/pdf/ReportPdf");
  const sel = opts.selection;
  await downloadPdf(
    pdfFilename(opts.fileType, opts.fileSuffix),
    <ReportPdf
      companyName={opts.company.name}
      companyAddress={opts.company.address}
      gstin={opts.company.gstin}
      logoUrl={opts.company.logoUrl}
      title={opts.title}
      subtitle={opts.subtitle}
      showCompany={sel.company}
      showSummary={sel.summary && opts.summary.length > 0}
      showTable={sel.table}
      summary={opts.summary}
      columns={opts.columns}
      rows={opts.rows}
    />
  );
}
