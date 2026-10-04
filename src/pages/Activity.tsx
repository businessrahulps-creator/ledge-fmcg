import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartTime } from "@/components/ui/smart-time";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/hooks/useCan";
import { todayKey, addDaysToKey } from "@/utils/dateKey";
import { formatCurrency } from "@/utils/formatCurrency";
import { csvSafeText } from "@/lib/reports/exporters";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import {
  ACTIVITY_GROUPS, activityLink, describeChanges, groupOf, periodRange, type ActivityRow, type Period,
} from "@/lib/activity";

interface Summary {
  orders_made: number; orders_cancelled: number; orders_value: number | null;
  failed: number; unsure: number; money_in: number | null; money_out: number | null;
  credit_given: number | null; changes: number;
}

const PAGE = 50;

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`num mt-1 text-xl font-semibold ${tone === "good" ? "text-success" : tone === "bad" ? "text-destructive" : "text-foreground"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Activity() {
  const { companyId } = useAuth();
  const canMoney = useCan("see_money");
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState(addDaysToKey(todayKey(), -6));
  const [customTo, setCustomTo] = useState(todayKey());
  const [group, setGroup] = useState("all");
  const [person, setPerson] = useState("all");
  const [failedOnly, setFailedOnly] = useState(false);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  // India-time "today", refreshed at midnight / when the tab comes back.
  const [today, setToday] = useState(todayKey());
  useEffect(() => {
    const tick = () => setToday(prev => (prev === todayKey() ? prev : todayKey()));
    const id = window.setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(id); window.removeEventListener("focus", tick); };
  }, []);

  const { from, to } = useMemo(() => periodRange(period, today, customFrom, customTo), [period, today, customFrom, customTo]);

  // Each new filter/business bumps this; late replies from old requests are ignored.
  const genRef = useRef(0);
  const filterKey = `${companyId}|${from}|${to}|${group}|${person}|${failedOnly}`;

  type Cursor = { at: string; id: string } | null;
  const load = useCallback(async (cursor: Cursor) => {
    if (!companyId) return;
    const gen = cursor ? genRef.current : ++genRef.current;
    setLoading(true);
    try {
      // IST day boundaries, half-open: [from 00:00, day after `to` 00:00)
      let q = supabase.from("activity_log").select("*")
        .eq("company_id", companyId)
        .gte("created_at", `${from}T00:00:00+05:30`)
        .lt("created_at", `${addDaysToKey(to, 1)}T00:00:00+05:30`)
        .order("created_at", { ascending: false }).order("id", { ascending: false })
        .limit(PAGE);
      if (group !== "all") q = q.in("entity_type", ACTIVITY_GROUPS[group].types);
      if (person !== "all") q = q.eq("user_name", person);
      if (failedOnly) q = q.neq("outcome", "ok");
      // Entries saved at the same instant are not skipped between pages.
      if (cursor) q = q.or(`created_at.lt.${cursor.at},and(created_at.eq.${cursor.at},id.lt.${cursor.id})`);
      const { data, error } = await q;
      if (error) throw error;
      if (gen !== genRef.current) return;
      const list = (data ?? []) as unknown as ActivityRow[];
      setHasMore(list.length === PAGE);
      setRows(prev => (cursor ? [...prev, ...list.filter(r => !prev.some(p => p.id === r.id))] : list));
    } catch (e) {
      if (gen === genRef.current) handleSupabaseError(e, { source: "activity:list", title: "Couldn't load activity" });
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const sumGenRef = useRef(0);
  const loadSummary = useCallback(() => {
    if (!companyId) return;
    const gen = ++sumGenRef.current;
    supabase.rpc("activity_summary", { p_from: from, p_to: to }).then(({ data, error }) => {
      if (gen !== sumGenRef.current) return;
      if (error) { handleSupabaseError(error, { source: "activity:summary", title: "Couldn't load the totals" }); return; }
      setSummary(data as unknown as Summary);
    });
  }, [companyId, from, to]);

  useEffect(() => { setRows([]); load(null); }, [load]);
  useEffect(() => { setSummary(null); loadSummary(); }, [loadSummary]);

  // Live: new entries and totals update while you watch (debounced).
  useEffect(() => {
    if (!companyId) return;
    let t: number | undefined;
    const ch = supabase.channel(`activity-page:${companyId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log", filter: `company_id=eq.${companyId}` },
        () => {
          if (to !== todayKey()) return;
          window.clearTimeout(t);
          t = window.setTimeout(() => { load(null); loadSummary(); }, 400);
        })
      .subscribe();
    return () => { window.clearTimeout(t); supabase.removeChannel(ch); };
  }, [companyId, to, load, loadSummary]);

  const people = useMemo(() => Array.from(new Set(rows.map(r => r.user_name).filter(Boolean))).sort(), [rows]);

  const download = () => {
    const head = ["When (IST)", "Who", "What", "Type", "Result", "Money", "Amount", "Changes", "Reason"];
    const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
    const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [head.join(",")];
    for (const r of rows) lines.push([
      fmt.format(new Date(r.created_at)), csvSafeText(r.user_name || "System"), csvSafeText(r.summary),
      ACTIVITY_GROUPS[groupOf(r.entity_type)]?.label ?? r.entity_type,
      r.outcome === "ok" ? "Done" : r.outcome === "unknown" ? "Not sure if saved" : "Failed",
      r.money_direction === "in" ? "In" : r.money_direction === "out" ? "Out" : "",
      r.amount ?? "", csvSafeText(describeChanges(r).map(c => `${c.field}: ${c.from} → ${c.to}`).join("; ")),
      csvSafeText(String(r.metadata?.reason ?? "")),
    ].map(esc).join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `activity_${from}_to_${to}.csv`; a.click();
  };

  const money = (n: number | null | undefined) => (n == null ? "—" : formatCurrency(n));

  return (
    <AppLayout>
      <div className="space-y-5">
        <PageHeader
          title="Activity"
          subtitle="Everything that happened in your business — who did it and what changed"
          actions={<Button variant="outline" size="sm" className="touch-target" onClick={download} disabled={rows.length === 0}><Download className="mr-1.5 h-4 w-4" />Download</Button>}
        />

        <div className="flex flex-wrap items-end gap-2">
          <Select value={period} onValueChange={v => setPeriod(v as Period)}>
            <SelectTrigger className="w-[150px]" aria-label="Period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="custom">Pick dates</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && (
            <>
              <Input type="date" aria-label="From" className="w-[150px]" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} />
              <Input type="date" aria-label="To" className="w-[150px]" value={customTo} min={customFrom} max={todayKey()} onChange={e => setCustomTo(e.target.value)} />
            </>
          )}
        </div>

        <section aria-label="Summary" className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Orders made" value={String(summary?.orders_made ?? "—")} hint={summary?.orders_cancelled ? `${summary.orders_cancelled} cancelled` : undefined} />
          <Stat label="Failed" value={String(summary ? summary.failed : "—")} hint={summary?.unsure ? `${summary.unsure} not sure if saved` : "orders, payments, returns"} tone={summary?.failed ? "bad" : undefined} />
          {canMoney && <>
            <Stat label="Money in" value={money(summary?.money_in)} hint="payments received" tone="good" />
            <Stat label="Money out" value={money(summary?.money_out)} hint="paid to suppliers" />
            <Stat label="Net" value={summary?.money_in != null && summary?.money_out != null ? formatCurrency(summary.money_in - summary.money_out) : "—"} tone={(summary?.money_in ?? 0) - (summary?.money_out ?? 0) < 0 ? "bad" : undefined} />
            <Stat label="Credit given" value={money(summary?.credit_given)} hint="credit notes" />
          </>}
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-[160px]" aria-label="Type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everything</SelectItem>
              {Object.entries(ACTIVITY_GROUPS).filter(([k]) => canMoney || k !== "money").map(([k, g]) => <SelectItem key={k} value={k}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={person} onValueChange={setPerson}>
            <SelectTrigger className="w-[160px]" aria-label="Person"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              {people.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={failedOnly ? "default" : "outline"} size="sm" className="touch-target" onClick={() => setFailedOnly(v => !v)}>
            Failed only
          </Button>
        </div>

        <section aria-label="Timeline" className="rounded-md border border-border bg-card">
          {rows.length === 0 && !loading && <p className="p-8 text-center text-sm text-muted-foreground">Nothing happened in this period.</p>}
          <ul className="divide-y divide-border">
            {rows.map(r => {
              const changes = describeChanges(r);
              const link = activityLink(r);
              const isOpen = open === r.id;
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.outcome === "failed" ? "bg-destructive" : r.outcome === "unknown" ? "bg-warning" : r.money_direction === "in" ? "bg-success" : r.money_direction === "out" ? "bg-warning" : "bg-muted-foreground/40"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm text-foreground">
                          {r.outcome !== "ok" && <span className="mr-1 font-semibold text-destructive">{r.outcome === "unknown" ? "Not sure if saved:" : "Failed:"}</span>}
                          {link ? <Link to={link} className="hover:underline">{r.summary}</Link> : r.summary}
                        </p>
                        {r.amount != null && (canMoney || r.entity_type === "order") && (() => {
                          const cash = cashImpact(r);
                          return (
                            <span className={`num text-sm font-medium ${cash != null && cash > 0 ? "text-success" : "text-foreground"}`}>
                              {cash == null ? "" : cash > 0 ? "+" : cash < 0 ? "−" : ""}{formatCurrency(Math.abs(Number(r.amount)))}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.user_name || "System"} · <SmartTime date={r.created_at} />
                        {r.outcome !== "ok" && r.metadata?.reason ? ` · ${r.metadata.reason}` : ""}
                      </p>
                      {changes.length > 0 && (
                        <button onClick={() => setOpen(isOpen ? null : r.id)} className="mt-1 flex items-center gap-1 text-xs text-primary">
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isOpen ? "Hide changes" : `See ${changes.length} change${changes.length > 1 ? "s" : ""}`}
                        </button>
                      )}
                      {isOpen && (
                        <dl className="mt-2 space-y-1 rounded border border-border bg-muted/30 p-2 text-xs">
                          {changes.map(c => (
                            <div key={c.field} className="flex flex-wrap gap-x-2">
                              <dt className="font-medium text-foreground">{c.field}:</dt>
                              <dd className="text-muted-foreground"><span className="line-through">{c.from}</span> → <span className="text-foreground">{c.to}</span></dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="border-t border-border p-2">
              <Button variant="ghost" size="sm" className="w-full" disabled={loading} onClick={() => { const last = rows[rows.length - 1]; if (last) load({ at: last.created_at, id: last.id }); }}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
