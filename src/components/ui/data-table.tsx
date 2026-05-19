import { ReactNode, useMemo, useState } from "react";
import { ArrowUpDown, Download, Rows3, Rows4, Rows2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportXlsx, xlsxFilename } from "@/utils/exportXlsx";

export type DataTableDensity = "compact" | "comfortable" | "spacious";

export interface DataTableColumn<T> {
  /** Stable key — also used as CSV header fallback. */
  id: string;
  /** Header label. */
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Optional sort accessor. If omitted, column is not sortable. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Optional CSV value. Falls back to sortValue or cell text. */
  csvValue?: (row: T) => string | number;
  /** Tailwind width / alignment class. */
  className?: string;
  /** Header-only class (e.g. `text-right`). */
  headerClassName?: string;
  /** Hide on mobile breakpoints. */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  /** Optional caption / aria-label. */
  ariaLabel?: string;
  /** Show density toggle + CSV export toolbar. */
  toolbar?: boolean;
  /** Filename prefix for CSV export. */
  csvName?: string;
  /** Initial density. Default comfortable. */
  defaultDensity?: DataTableDensity;
  className?: string;
}

const ROW_PAD: Record<DataTableDensity, string> = {
  compact: "py-1.5",
  comfortable: "py-3",
  spacious: "py-4",
};

/**
 * DataTable v2 — sticky header, optional sort, density toggle, CSV export.
 *
 * Visual: respects design-system tokens (no raw hex). Sticky header band uses
 * `bg-card/95 backdrop-blur` so long scroll lists keep column context.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyState,
  ariaLabel,
  toolbar = false,
  csvName = "export",
  defaultDensity = "comfortable",
  className,
}: DataTableProps<T>) {
  const [density, setDensity] = useState<DataTableDensity>(defaultDensity);
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, sort, columns]);

  const toggleSort = (id: string) => {
    setSort((cur) => {
      if (!cur || cur.id !== id) return { id, dir: "asc" };
      if (cur.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  };

  const handleExport = () => {
    const headers = columns.map((c) =>
      typeof c.header === "string" ? c.header : c.id
    );
    const rowsCsv = sorted.map((r) =>
      columns.map((c) => {
        if (c.csvValue) return String(c.csvValue(r));
        if (c.sortValue) {
          const v = c.sortValue(r);
          return v == null ? "" : String(v);
        }
        return "";
      })
    );
    exportXlsx(xlsxFilename(csvName), headers, rowsCsv);
  };

  return (
    <div className={cn("rounded-md border border-border bg-card shadow-depth-2", className)}>
      {toolbar && (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <div className="text-xs text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "row" : "rows"}
          </div>
          <div className="flex items-center gap-1">
            <DensityToggle value={density} onChange={setDensity} />
            <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 gap-1.5 px-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => {
                const isSorted = sort?.id === c.id;
                const sortable = !!c.sortValue;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    className={cn(
                      "px-3 py-2 font-medium",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.headerClassName
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.id)}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {c.header}
                        <ArrowUpDown
                          className={cn(
                            "h-3 w-3 opacity-50",
                            isSorted && "opacity-100 text-foreground"
                          )}
                        />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {emptyState ?? "No data"}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/40 last:border-b-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/40"
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        "px-3 align-middle",
                        ROW_PAD[density],
                        c.hideOnMobile && "hidden md:table-cell",
                        c.className
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DensityToggle({
  value,
  onChange,
}: {
  value: DataTableDensity;
  onChange: (v: DataTableDensity) => void;
}) {
  const opts: { id: DataTableDensity; icon: typeof Rows2; label: string }[] = [
    { id: "compact", icon: Rows4, label: "Compact" },
    { id: "comfortable", icon: Rows3, label: "Comfortable" },
    { id: "spacious", icon: Rows2, label: "Spacious" },
  ];
  return (
    <div className="flex items-center rounded-md border border-border/60 p-0.5">
      {opts.map((o) => {
        const active = o.id === value;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-label={o.label}
            aria-pressed={active}
            className={cn(
              "h-6 w-6 inline-flex items-center justify-center rounded transition-colors",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
