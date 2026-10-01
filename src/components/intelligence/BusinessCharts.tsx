import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "@/services/api";
import { useReceivables } from "@/hooks/useReceivables";
import { useBusinessDay } from "@/hooks/useBusinessDay";
import { formatCurrency } from "@/data/mock-data";
import {
  forecastNext4Weeks, topUnpaidDealers, buyingLessPairs, topReturnedProducts, stockRunway,
  DEFAULT_INTEL_SETTINGS, type BarItem, type PairItem, type ForecastNotReady,
} from "@/lib/intelligence";

const shortDate = (k: string) =>
  new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const compact = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${Math.round(n / 1e3)}k` : `₹${Math.round(n)}`;
const pct = (v: number, max: number) => (v <= 0 ? 0 : Math.max(2, (v / max) * 100));

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

/** Name on its own line on phones (wraps, never cut off); value beside it from sm up. */
function RowHead({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2 text-sm">
      <span className="text-foreground break-words sm:truncate">{label}</span>
      <span className="num tabular-nums font-medium sm:shrink-0">{value}</span>
    </div>
  );
}

function RankedBars({ items, format }: { items: BarItem[]; format: (i: BarItem) => string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map(i => {
        const body = (
          <>
            <RowHead label={i.label} value={<>{format(i)}{i.note && <span className="text-xs text-muted-foreground font-normal"> · {i.note}</span>}</>} />
            <div className="mt-1 h-2 rounded-sm bg-muted overflow-hidden" aria-hidden>
              <div className="h-full bg-foreground/80" style={{ width: `${pct(i.value, max)}%` }} />
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
            <RowHead label={i.label} value={<span className="text-xs text-muted-foreground font-normal">down {formatCurrency(i.before - i.now)}</span>} />
            {([["Before", i.before, "bg-muted-foreground/40"], ["Recent", i.now, "bg-foreground/80"]] as const).map(([l, v, c]) => (
              <div key={l} className="mt-1 flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{l}</span>
                <div className="flex-1 h-2 rounded-sm bg-muted overflow-hidden" aria-hidden>
                  <div className={`h-full ${c}`} style={{ width: `${pct(v, max)}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-[11px] num tabular-nums">{v <= 0 ? "No orders" : compact(v)}</span>
              </div>
            ))}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const notReadyText = (r: ForecastNotReady) =>
  r.reason === "no_sales" ? "No sales yet. Once you have sales in 5 different weeks, we'll estimate the next 4 weeks."
  : r.reason === "few_sale_weeks" ? `You have sales in ${r.have} of the ${r.need} weeks needed for a fair estimate. Keep adding orders.`
  : `We need ${r.need} weeks since your first sale; you have ${r.have}. Check back soon.`;

function ForecastPanel({ today }: { today: string }) {
  const orders = useApi().orders.list();
  const f = useMemo(() => forecastNext4Weeks(orders, today), [orders, today]);
  const [showTable, setShowTable] = useState(false);
  if ("reason" in f) {
    return <Panel title="Sales likely in the next 4 weeks"><Empty text={notReadyText(f)} /></Panel>;
  }
  const wk = f.total / 4;
  const wLow = f.range ? f.range.low / 4 : null;
  const wHigh = f.range ? f.range.high / 4 : null;
  const data = [
    ...f.history.map(w => ({ label: shortDate(w.end), actual: w.sales })),
    ...f.next.map(w => ({ label: shortDate(w.end), expected: w.expected, range: wLow !== null ? [wLow, wHigh] as [number, number] : undefined })),
  ];
  (data[f.history.length - 1] as any).expected = f.history[f.history.length - 1].sales;
  return (
    <Panel title="Sales likely in the next 4 weeks" takeaway={`Estimate based on the last ${f.history.length} weeks. Sales after offers, before GST.`}>
      <p className="text-2xl font-semibold num tabular-nums">About {formatCurrency(f.total)}</p>
      <p className="text-xs text-muted-foreground">
        {f.range
          ? <>Likely between {formatCurrency(f.range.low)} and {formatCurrency(f.range.high)}, based on how close this estimate came {f.range.checks} times before.</>
          : <>Not enough past data yet to show a likely range.</>}
        {f.uncertain && " Uncertain: your weekly sales go up and down a lot."}
      </p>
      <div className="h-48 mt-3 -ml-2" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={compact} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              formatter={(v: any, name: string) => [Array.isArray(v) ? `${formatCurrency(v[0])} – ${formatCurrency(v[1])}` : formatCurrency(v), name === "actual" ? "Sales" : name === "expected" ? "Likely" : "Likely range"]}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
            />
            {f.range && <Area dataKey="range" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.15} isAnimationActive={false} />}
            <Line dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey="expected" stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">Solid line: real sales per week. Dashed line: likely sales.{f.range && " Grey band: likely range."}</p>
        <button type="button" onClick={() => setShowTable(v => !v)} aria-expanded={showTable} className="text-xs underline underline-offset-2 text-foreground">
          {showTable ? "Hide weekly numbers" : "Show weekly numbers"}
        </button>
      </div>
      {showTable && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">Sales per week and likely sales for the next 4 weeks</caption>
            <thead><tr className="text-muted-foreground text-left"><th className="py-1 font-medium">Week</th><th className="py-1 font-medium text-right">Real sales</th><th className="py-1 font-medium text-right">Likely</th></tr></thead>
            <tbody>
              {f.history.map(w => (
                <tr key={w.end} className="border-t border-border"><td className="py-1">{shortDate(w.start)} – {shortDate(w.end)}</td><td className="py-1 text-right num tabular-nums">{formatCurrency(w.sales)}</td><td className="py-1 text-right text-muted-foreground">—</td></tr>
              ))}
              {f.next.map(w => (
                <tr key={w.end} className="border-t border-border"><td className="py-1">{shortDate(w.start)} – {shortDate(w.end)}</td><td className="py-1 text-right text-muted-foreground">—</td>
                  <td className="py-1 text-right num tabular-nums">{formatCurrency(wk)}{wLow !== null && <span className="text-muted-foreground"> ({compact(wLow)}–{compact(wHigh!)})</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const today = useBusinessDay();

  const unpaid = useMemo(() => topUnpaidDealers(rows), [rows]);
  const less = useMemo(() => buyingLessPairs(orders, today), [orders, today]);
  const returned = useMemo(() => topReturnedProducts(claims as any, today), [claims, today]);
  const runOut = useMemo(() => {
    const { low, historyDays } = stockRunway({ orders, stockItems, products, settings: { ...DEFAULT_INTEL_SETTINGS, runwayDays: 1e9 }, today });
    const items: BarItem[] = low.filter(c => (c.meta!.days as number) <= 60).slice(0, 5).map(c => ({
      id: c.subjectId, label: c.title, value: c.meta!.days as number, note: `${c.meta!.qty} left`,
    }));
    return { items, enoughHistory: historyDays >= 30 };
  }, [orders, stockItems, products, today]);

  const top = unpaid.items[0];
  const daysText = (i: BarItem) => {
    const qty = Number(String(i.note).split(" ")[0]);
    if (qty <= 0) return "Out of stock";
    if (i.value < 1) return "Less than 1 day";
    const d = Math.floor(i.value);
    return `about ${d} day${d === 1 ? "" : "s"}`;
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="lg:col-span-2"><ForecastPanel today={today} /></div>

      <Panel
        title="Who owes us the most?"
        takeaway={top ? `${unpaid.dealers} dealer${unpaid.dealers === 1 ? "" : "s"} owe ${formatCurrency(unpaid.total)} in total. ${top.label} owes the most.` : undefined}
        seeAll="/billing"
      >
        {unpaid.items.length ? <RankedBars items={unpaid.items} format={i => formatCurrency(i.value)} /> : <Empty text="Nobody owes you money right now." />}
      </Panel>

      <Panel
        title="Who is buying less?"
        takeaway={`Recent: ${shortDate(less.mid)}–${shortDate(less.to)} compared with before: ${shortDate(less.from)}–${shortDate(less.mid)}. New dealers not included.`}
        seeAll="/today"
      >
        {less.items.length ? <PairedBars items={less.items} /> : <Empty text="No regular dealer is buying less than before." />}
      </Panel>

      <Panel
        title="What may run out soon?"
        takeaway={runOut.items.length ? "Estimate: stock now ÷ what was sent per day recently." : undefined}
        seeAll="/stock"
      >
        {runOut.items.length
          ? <RankedBars items={runOut.items} format={daysText} />
          : <Empty text={runOut.enoughHistory
              ? "Nothing is likely to run out in the next 2 months, based on the last 30 days."
              : "Not enough history yet. We need about 30 days of sent orders to estimate this."} />}
      </Panel>

      <Panel
        title="Which products come back most?"
        takeaway={returned.length ? "Returned quantity in the last 90 days. Rejected returns not counted." : undefined}
        seeAll="/claims"
      >
        {returned.length ? <RankedBars items={returned} format={i => `${i.value} returned`} /> : <Empty text="No returns in the last 90 days." />}
      </Panel>
    </div>
  );
}
