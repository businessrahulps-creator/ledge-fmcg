import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "@/services/api";
import { useReceivables } from "@/hooks/useReceivables";
import { todayKey } from "@/utils/dateKey";
import { formatCurrency } from "@/data/mock-data";
import {
  forecastNext4Weeks, topUnpaidDealers, buyingLessPairs, topReturnedProducts, stockRunway,
  DEFAULT_INTEL_SETTINGS, type BarItem, type PairItem,
} from "@/lib/intelligence";

const shortDate = (k: string) =>
  new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const compact = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${Math.round(n / 1e3)}k` : `₹${Math.round(n)}`;

function Panel({ title, takeaway, seeAll, children }: { title: string; takeaway?: string; seeAll?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-md border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {seeAll && <Link to={seeAll} className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline shrink-0">See all</Link>}
      </div>
      {takeaway && <p className="text-xs text-muted-foreground mt-0.5">{takeaway}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const Empty = ({ text }: { text: string }) => <p className="text-sm text-muted-foreground py-4">{text}</p>;

function RankedBars({ items, format }: { items: BarItem[]; format: (n: number) => string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map(i => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-foreground">{i.label}</span>
              <span className="num tabular-nums font-medium shrink-0">{format(i.value)}{i.note && <span className="text-xs text-muted-foreground font-normal"> · {i.note}</span>}</span>
            </div>
            <div className="mt-1 h-2 rounded-sm bg-muted overflow-hidden">
              <div className="h-full bg-foreground/80" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
            </div>
          </>
        );
        return <li key={i.id}>{i.link ? <Link to={i.link} className="block rounded-sm hover:bg-muted/50 -mx-1 px-1 py-0.5">{body}</Link> : body}</li>;
      })}
    </ul>
  );
}

function PairedBars({ items }: { items: PairItem[] }) {
  const max = Math.max(...items.map(i => i.before), 1);
  return (
    <ul className="space-y-3">
      {items.map(i => (
        <li key={i.id}>
          <Link to={i.link} className="block rounded-sm hover:bg-muted/50 -mx-1 px-1 py-0.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-foreground">{i.label}</span>
              <span className="text-xs text-muted-foreground shrink-0">down {formatCurrency(i.before - i.now)}</span>
            </div>
            {[["Before", i.before, "bg-muted-foreground/40"], ["Last 30 days", i.now, "bg-foreground/80"]].map(([l, v, c]) => (
              <div key={l as string} className="mt-1 flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] text-muted-foreground">{l}</span>
                <div className="flex-1 h-2 rounded-sm bg-muted overflow-hidden">
                  <div className={`h-full ${c}`} style={{ width: `${Math.max(1, ((v as number) / max) * 100)}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-[11px] num tabular-nums">{compact(v as number)}</span>
              </div>
            ))}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ForecastPanel() {
  const orders = useApi().orders.list();
  const f = useMemo(() => forecastNext4Weeks(orders, todayKey()), [orders]);
  if (!f) {
    return (
      <Panel title="Sales likely in the next 4 weeks">
        <Empty text="We need about 6 weeks of sales before we can estimate. Keep adding orders." />
      </Panel>
    );
  }
  const data = [
    ...f.history.map(w => ({ label: shortDate(w.end), actual: w.sales })),
    ...f.next.map(w => ({ label: shortDate(w.end), expected: w.expected, range: [w.low, w.high] as [number, number] })),
  ];
  // Join the dashed line to the last real week.
  (data[f.history.length - 1] as any).expected = f.history[f.history.length - 1].sales;
  return (
    <Panel
      title="Sales likely in the next 4 weeks"
      takeaway={`Estimate based on the last ${f.history.length} weeks. Sales after offers, before GST.`}
    >
      <p className="text-2xl font-semibold num tabular-nums">About {formatCurrency(f.total)}</p>
      <p className="text-xs text-muted-foreground">
        Likely between {formatCurrency(f.low)} and {formatCurrency(f.high)}
        {f.uncertain && " · Uncertain: your weekly sales go up and down a lot"}
      </p>
      <div className="h-48 mt-3 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={compact} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              formatter={(v: any, name: string) => [Array.isArray(v) ? `${formatCurrency(v[0])} – ${formatCurrency(v[1])}` : formatCurrency(v), name === "actual" ? "Sales" : name === "expected" ? "Likely" : "Likely range"]}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
            />
            <Area dataKey="range" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.15} isAnimationActive={false} />
            <Line dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey="expected" stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">Solid line: real sales per week. Dashed line: likely sales. Grey band: likely range.</p>
    </Panel>
  );
}

/** My Business: real-data charts that each answer one plain question. */
export default function BusinessCharts() {
  const api = useApi();
  const orders = api.orders.list();
  const products = api.products.list();
  const stockItems = api.stock.items.list();
  const claims = api.claims.list();
  const { rows } = useReceivables();
  const today = todayKey();

  const unpaid = useMemo(() => topUnpaidDealers(rows), [rows]);
  const less = useMemo(() => buyingLessPairs(orders, today), [orders, today]);
  const returned = useMemo(() => topReturnedProducts(claims as any, today), [claims, today]);
  const runOut = useMemo(() => {
    const { low } = stockRunway({ orders, stockItems, products, settings: { ...DEFAULT_INTEL_SETTINGS, runwayDays: 1e9 }, today });
    return low.slice(0, 5).map(c => ({ id: c.subjectId, label: c.title, value: c.meta!.days as number }));
  }, [orders, stockItems, products, today]);

  const top = unpaid.items[0];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="lg:col-span-2"><ForecastPanel /></div>

      <Panel
        title="Who owes us the most?"
        takeaway={top ? `${unpaid.dealers} dealer${unpaid.dealers === 1 ? "" : "s"} owe ${formatCurrency(unpaid.total)} in total. ${top.label} owes the most.` : undefined}
        seeAll="/billing"
      >
        {unpaid.items.length ? <RankedBars items={unpaid.items} format={formatCurrency} /> : <Empty text="Nobody owes you money right now." />}
      </Panel>

      <Panel
        title="Who is buying less?"
        takeaway={less.length ? "Last 30 days compared with the 30 days before. New dealers not included." : undefined}
        seeAll="/today"
      >
        {less.length ? <PairedBars items={less} /> : <Empty text="No regular dealer is buying less than last month." />}
      </Panel>

      <Panel
        title="What may run out soon?"
        takeaway={runOut.length ? "Estimate: stock now ÷ what was sent per day in the last 30 days." : undefined}
        seeAll="/stock"
      >
        {runOut.length
          ? <RankedBars items={runOut} format={d => d <= 0 ? "Out of stock" : `about ${d} day${d === 1 ? "" : "s"}`} />
          : <Empty text="No products were sent in the last 30 days, so we can't estimate yet." />}
      </Panel>

      <Panel
        title="Which products come back most?"
        takeaway={returned.length ? "Returned quantity in the last 90 days. Rejected returns not counted." : undefined}
        seeAll="/claims"
      >
        {returned.length ? <RankedBars items={returned} format={n => `${n} returned`} /> : <Empty text="No returns in the last 90 days." />}
      </Panel>
    </div>
  );
}
