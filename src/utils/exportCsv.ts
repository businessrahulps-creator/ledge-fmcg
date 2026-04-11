import { toast } from "sonner";

/**
 * Escape a CSV cell value — wraps in quotes if it contains commas, quotes, or newlines.
 */
function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate and download a CSV file from headers + rows.
 * Includes UTF-8 BOM for Excel compatibility with ₹ and Indian characters.
 */
export function exportCsv(filename: string, headers: string[], rows: string[][]) {
  if (rows.length === 0) {
    toast.error("Nothing to export", { description: "No data matches the current filters." });
    return;
  }

  const csvLines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const BOM = "\uFEFF";
  const csvContent = BOM + csvLines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success("CSV exported successfully", {
    description: `${rows.length} row${rows.length === 1 ? "" : "s"} exported.`,
  });
}

/**
 * Generate a dated filename: {entity}_{YYYY-MM-DD}.csv
 */
export function csvFilename(entity: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${entity}_${today}.csv`;
}
