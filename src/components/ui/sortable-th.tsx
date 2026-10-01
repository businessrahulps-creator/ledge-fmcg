import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortState<K extends string> = { key: K; dir: "asc" | "desc" } | null;

/** Sorts the whole list (call before paging). Text keys start A→Z, numbers start biggest first. */
export function useSortedRows<T, K extends string>(rows: T[], getValue: (row: T, key: K) => string | number) {
  const [sort, setSort] = useState<SortState<K>>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const m = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = getValue(a, sort.key), y = getValue(b, sort.key);
      return (typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" })) * m;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const toggle = (key: K, textual = false) =>
    setSort((s) => (s?.key !== key ? { key, dir: textual ? "asc" : "desc" } : { key, dir: s.dir === "desc" ? "asc" : "desc" }));
  return { sorted, sort, toggle };
}

export function SortableTh<K extends string>({
  sortKey, label, sort, onSort, className, textual,
}: {
  sortKey: K; label: string; sort: SortState<K>; onSort: (k: K, textual?: boolean) => void; className?: string; textual?: boolean;
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={className} aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey, textual)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
      >
        {label}
        <Icon className={cn("h-3 w-3", !active ? "text-muted-foreground" : "text-foreground")} aria-hidden />
      </button>
    </th>
  );
}
