

# Fix Indian Date Locale: DD/MM/YYYY Everywhere

## What changes
Create a utility function `formatIndianDate` and replace all raw `{o.date}`, `{order.date}`, `{selected.date}`, `{selectedOrder.date}`, `{o.dispatchDate}`, `{selected.dispatchDate}` renders with it.

## New file: `src/utils/formatDate.ts`
```ts
export const formatIndianDate = (date: string | Date | null): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date + (date.length === 10 ? "T00:00:00" : "")) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(d);
};
```

## Files modified (import + find-replace `{x.date}` → `{formatIndianDate(x.date)}`)

| File | Occurrences |
|------|------------|
| `src/pages/Dashboard.tsx` | 2 — table `{order.date}`, mobile card `{o.date}` |
| `src/pages/Orders.tsx` | 4 — table, mobile card, detail dialog date, detail dialog (already covered) |
| `src/pages/Distributors.tsx` | 2 — dealer order table + mobile card |
| `src/components/reports/DistributorReport.tsx` | 1 — order table |
| `src/components/reports/PaymentReport.tsx` | 2 — table + mobile card |
| `src/components/reports/DispatchReport.tsx` | 3 — table, mobile card, detail dialog (date + dispatchDate) |

Total: ~14 occurrences across 6 files, plus 1 new utility file.

No changes to data layer, routing, or any other logic.

