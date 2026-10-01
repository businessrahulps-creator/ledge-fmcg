export type ColType = "text" | "money" | "number" | "date";

export interface ReportColumn {
  key: string;
  header: string;
  type?: ColType;
  /** Add this column up in the totals row. */
  total?: boolean;
  /** Relative width weight for PDF (default 1). */
  weight?: number;
}

export type ReportRow = Record<string, string | number | null>;

export interface ReportSection {
  name: string;
  rows: ReportRow[];
}

export interface ReportParams {
  from: string; // YYYY-MM-DD (IST day)
  to: string;   // YYYY-MM-DD inclusive
  /** Only this dealer (dealer statement). */
  dealerId?: string;
  /** Only dealers in this area. */
  area?: string;
}

export interface SummaryItem {
  label: string;
  value: number;
  kind: "money" | "number";
}

export type ReportGroup = "Sales" | "Money" | "Stock" | "Buying" | "GST" | "Team";

export interface ReportDef {
  id: string;
  group: ReportGroup;
  title: string;
  description: string;
  /** Capability needed to see this report. */
  capability: "see_money" | "manage_stock" | "manage_buying" | null;
  /** false = a snapshot of today, dates don't apply. */
  usesDates: boolean;
  columns: ReportColumn[];
  fetch: (p: ReportParams) => Promise<ReportSection[]>;
  summary?: (rows: ReportRow[]) => SummaryItem[];
  /** Short plain sentence for the bottom of the PDF. */
  note?: (rows: ReportRow[]) => string | null;
  /** Extra pickers shown above the report. "dealer" is required when listed. */
  filters?: ("dealer" | "area")[];
}
