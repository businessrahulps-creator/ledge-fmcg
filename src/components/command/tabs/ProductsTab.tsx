import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Package, Gift, PackageX, AlertTriangle, ArrowRight } from "lucide-react";
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

    // Stock-out risk: top-revenue SKUs that are out OR critically low this period
    const stockOutRisk = rows.filter((r) => r.stockHealth !== "ok").slice(0, 5);

    // Scheme impact (period) — total + top 3 by savings
    const schemeAgg = new Map<string, { id: string | null; name: string; savings: number; orders: number }>();
    let schemeSavings = 0;
    let ordersWithSchemes = 0;
    for (const o of now) {
      const has = (o.schemeSavings || 0) > 0 || (o.appliedSchemes?.length || 0) > 0;
      if (has) ordersWithSchemes += 1;
      schemeSavings += o.schemeSavings || 0;
      for (const s of o.appliedSchemes || []) {
        const key = s.schemeId || s.schemeName;
        const cur = schemeAgg.get(key) || { id: s.schemeId, name: s.schemeName, savings: 0, orders: 0 };
        cur.savings += s.savings || 0;
        cur.orders += 1;
        schemeAgg.set(key, cur);
      }
    }
    const topSchemes = [...schemeAgg.values()].sort((a, b) => b.savings - a.savings).slice(0, 3);

    // Dead stock: stock > 0, no movement in period
    const movedIds = new Set<string>();
    for (const o of now) for (const l of o.lines) movedIds.add(l.productId);
    const dead = products
      .map((p) => ({ ...p, stock: stockByProduct.get(p.id) || 0 }))
      .filter((p) => p.stock > 0 && !movedIds.has(p.id))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    return { rows, stockOutRisk, schemeSavings, ordersWithSchemes, topSchemes, dead };
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
                  <tr key={r.id} className="group transition-colors hover:bg-accent/40">
                    <td className="py-2 pr-2 max-w-[260px] truncate">
                      <Link to={`/stock?sku=${r.id}`} className="story-link inline-flex items-center gap-1 text-foreground">
                        {r.name}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-60 group-hover:translate-x-0" />
                      </Link>
                    </td>
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

      {computed.stockOutRisk.length > 0 && (
        <Card className="p-4 border-warning/40">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Stock-out risk on top SKUs
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Your best-selling SKUs are out or critically low. Revenue at risk if not restocked.
          </p>
          <ul className="divide-y divide-border/60">
            {computed.stockOutRisk.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <Link to={`/stock?sku=${r.id}`} className="story-link block truncate text-sm text-foreground">{r.name}</Link>
                  <p className="text-[11px] text-muted-foreground">{formatCurrency(r.rev)} revenue this period</p>
                </div>
                <span className={`num text-xs font-semibold ${r.stockHealth === "out" ? "text-destructive" : "text-warning"}`}>
                  {r.stockHealth === "out" ? "Out" : `${r.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

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
              {computed.topSchemes.length > 0 && (
                <ul className="mt-3 divide-y divide-border/60 border-t border-border/60 pt-2">
                  {computed.topSchemes.map((s) => {
                    const inner = (
                      <div className="flex items-center justify-between gap-3 py-1.5">
                        <span className="truncate text-sm text-foreground">{s.name}</span>
                        <span className="num text-xs text-muted-foreground">{formatCurrency(s.savings)}</span>
                      </div>
                    );
                    return (
                      <li key={s.id || s.name}>
                        {s.id ? (
                          <Link to={`/schemes/${s.id}`} className="block transition-colors hover:bg-accent/40 -mx-1 px-1 rounded">{inner}</Link>
                        ) : inner}
                      </li>
                    );
                  })}
                </ul>
              )}
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
                <li key={p.id} className="group flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{p.name}</p>
                    <span className="num text-[11px] text-muted-foreground">{p.stock} {p.unit}</span>
                  </div>
                  <Link
                    to={`/stock?sku=${p.id}`}
                    className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 inline-flex items-center gap-1"
                  >
                    Review stock <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
