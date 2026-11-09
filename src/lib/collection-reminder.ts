import type { ReceivableRow } from "@/lib/receivables";
import { formatIndianDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";

export function collectionTermsText(days: number | null | undefined, rows: ReceivableRow[]): string {
  if (days == null) return "";
  const bills = rows.filter(r => r.due > 0 && r.dueDate).map(r =>
    `${r.invoiceNumber}: ${formatCurrency(r.due)} due on ${formatIndianDate(r.dueDate ?? "")}${(r.daysLate ?? 0) > 0 ? ` (late by ${r.daysLate} days)` : ""}.`);
  return [`Credit time: ${days} days.`, ...bills].join("\n");
}