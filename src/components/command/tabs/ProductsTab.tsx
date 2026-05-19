import { useMemo } from "react";
import { useApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Package, Gift, PackageX } from "lucide-react";
import { formatCurrency } from "@/data/mock-data";
import { CommandEmptyState } from "../CommandEmptyState";
import { CardSkeleton } from "../CommandSkeleton";
import { ordersInPeriod, pctDelta, type PeriodRange } from "@/lib/command-signals";
import { DeltaPill } from "../DeltaPill";

interface Props {
  range: PeriodRange;
}

export function ProductsTab({ range }: Props) {
  const api = useApi();
  const loading = api.loading;
  const orders = api.orders.list();
  const products = api.products.list();
  const stockItems = api.stock.items.list();

  const computed = useMemo(() => {
    const prevRange: PeriodRange = { from: range.prevFrom, to: range.prevTo, prevFrom: range.prevFrom, prevTo: range.prevTo };
    const now = ordersInPeriod(orders, range);
    const prev = ordersInPeriod(orders, prevRange);

    const agg = (os: typeof orders) => {
      const m = new Map<string, { rev: number; qty: number; name: string }>();
      for (const o of os) {
        for (const l of o.lines) {
          const cur = m.get(l.productId) || { rev: 0, qty: 0, name: l.productName };
          cur.rev += l.lineTotal || 0;
          cur.qty += l.quantity || 0;
          m.set(l.productId, cur);
        }
      }
      return m;
    };
    const nowM = agg(now);
    const prevM = agg(prev);

    // Stock per product (sum across godowns)
    const stockByProduct = new Map<string, number>();
    for (const s of stockItems) stockByProduct.set(s.productId, (stockByProduct.get(s.productId) || 0) + (s.quantity || 0));

    const rows = [...nowM.entries()]
      .sort((a, b) => b[1].rev - a[1].rev)
      .slice(0, 10)
      .map(([id, v]) => {
        const prevRev = prevM.get(id)?.rev || 0;
        const stock = stockByProduct.get(id) || 0;
        const stockHealth: "ok" | "low" | "out" = stock === 0 ? "out" : stock < 10 ? "low" : "ok";
        return {
          id,
          name: v.name,
          rev: v.rev,
          qty: v.qty,
          delta: pctDelta(v.rev, prevRev),
          stockHealth,
          stock,
        };
      });

    // Scheme impact (period)
    const schemeSavings = now.reduce((s, o) => s + (o.schemeSavings || 0), 0);
    const ordersWithSchemes = now.filter((o) => (o.schemeSavings || 0) > 0).length;

    // Dead stock: stock > 0, no movement in period
    const movedIds = new Set<string>();
    for (const o of now) for (const l of o.lines) movedIds.add(l.productId);
    const dead = products
      .map((p) => ({ ...p, stock: stockByProduct.get(p.id) || 0 }))
      .filter((p) => p.stock > 0 && !movedIds.has(p.id))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    return { rows, schemeSavings, ordersWithSchemes, dead };
  }, [orders, products, stockItems, range]);

  if (loading) return <div className="space-y-4"><CardSkeleton height={280} /><CardSkeleton height={180} /></div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package className="h-4 w-4 text-muted-foreground" />
          SKU revenue
        </h3>
        {computed.rows.length === 0 ? (
          <CommandEmptyState title="No SKU revenue this period" hint="As orders log, top SKUs appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2">SKU</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                  <th className="py-2 pr-2 text-right">Revenue</th>
                  <th className="py-2 pr-2 text-right">vs prev</th>
                  <th className="py-2 pr-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {computed.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-2 max-w-[260px] truncate">{r.name}</td>
                    <td className="py-2 pr-2 text-right num">{r.qty}</td>
                    <td className="py-2 pr-2 text-right num">{formatCurrency(r.rev)}</td>
                    <td className="py-2 pr-2 text-right"><DeltaPill pct={r.delta} /></td>
                    <td className="py-2 pr-2 text-right">
                      <span className={`num text-xs font-medium ${r.stockHealth === "out" ? "text-destructive" : r.stockHealth === "low" ? "text-warning" : "text-foreground/70"}`}>
                        {r.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Gift className="h-4 w-4 text-muted-foreground" />
            Scheme impact
          </h3>
          {computed.schemeSavings === 0 ? (
            <CommandEmptyState title="No scheme savings this period" hint="Active schemes will show measured savings here." />
          ) : (
            <>
              <p className="font-heading text-[26px] leading-none num text-foreground">{formatCurrency(computed.schemeSavings)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Across {computed.ordersWithSchemes} order{computed.ordersWithSchemes === 1 ? "" : "s"}
              </p>
            </>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <PackageX className="h-4 w-4 text-muted-foreground" />
            Dead stock
          </h3>
          {computed.dead.length === 0 ? (
            <CommandEmptyState title="Nothing sitting idle" hint="Every stocked SKU moved this period." />
          ) : (
            <ul className="divide-y divide-border/60">
              {computed.dead.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <p className="truncate text-sm text-foreground">{p.name}</p>
                  <span className="num text-xs text-muted-foreground">{p.stock} {p.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
