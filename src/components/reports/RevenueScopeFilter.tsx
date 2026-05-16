import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order } from "@/data/mock-data";

export type RevenueScope = "delivered" | "all";

export function RevenueScopeFilter({
  value,
  onChange,
}: {
  value: RevenueScope;
  onChange: (v: RevenueScope) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RevenueScope)}>
      <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="delivered">Delivered Only</SelectItem>
        <SelectItem value="all">All Orders</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function applyRevenueScope<T extends Pick<Order, "deliveryStatus">>(
  rows: T[],
  scope: RevenueScope
): T[] {
  return scope === "delivered" ? rows.filter((o) => o.deliveryStatus === "delivered") : rows;
}
