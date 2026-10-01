import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileSpreadsheet, FileText, FileDown, Search, Share2, Star, RotateCcw, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCan } from "@/hooks/useCan";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { todayKey } from "@/utils/dateKey";
import { GROUPS, REPORTS, reportById } from "@/lib/reports/registry";
import type { ReportSection, SummaryItem } from "@/lib/reports/types";
import { allRows, cellText, hasTotals, summaryText, totalsOf } from "@/lib/reports/format";
import { PERIODS, periodRange, previousRange, rangeLabel, type PeriodId } from "@/lib/reports/periods";
import { exportCsv, exportExcel, exportPdf, runExport, sharePdf, type ExportContext } from "@/lib/reports/exporters";
import { logExport } from "@/lib/reports/tallyData";
import { TallyExportPanel } from "@/components/reports/TallyExportPanel";

const FAV_KEY = "ledge:reports:favs";
const RECENT_KEY = "ledge:reports:recent";
type Recent = { id: string; period: PeriodId; from: string; to: string; format: string; at: number };
const readLS = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
const PREVIEW = 50;

export default function Reports() {
  const canMoney = useCan("see_money");
  const canStock = useCan("manage_stock");
  const { profile, user, companyId } = useAuth();
  const { companyInfo } = useData();
  const [params, setParams] = useSearchParams();

  const allowed = useMemo(() => REPORTS.filter(r => r.capability == null || (r.capability === "see_money" ? canMoney : canStock || canMoney)), [canMoney, canStock]);
  const selected = params.get("r") || allowed[0]?.id || "";
  const isTally = selected === "tally";
  const def = isTally ? null : reportById(selected) && allowed.some(a => a.id === selected) ? reportById(selected)! : null;

  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<PeriodId>("month");
  const [custom, setCustom] = useState(() => periodRange("month"));
  const range = period === "custom" ? custom : periodRange(period);
  const [compare, setCompare] = useState(false);
  const [include, setInclude] = useState({ company: true, summary: true, table: true });
  const [favs, setFavs] = useState<string[]>(() => readLS(FAV_KEY, []));
  const [recent, setRecent] = useState<Recent[]>(() => readLS(RECENT_KEY, []));

  const [sections, setSections] = useState<ReportSection[] | null>(null);
  const [prevSummary, setPrevSummary] = useState<SummaryItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const pick = (id: string) => setParams(id ? { r: id } : {}, { replace: true });

  useEffect(() => {
    if (!def) { setSections(null); return; }
    let live = true;
    setLoading(true); setError(null);
    const p = def.usesDates ? range : { from: todayKey(), to: todayKey() };
    const prev = compare && def.usesDates && def.summary ? previousRange(range.from, range.to) : null;
    Promise.all([def.fetch(p), prev ? def.fetch(prev) : Promise.resolve(null)])
      .then(([s, ps]) => { if (!live) return; setSections(s); setPrevSummary(ps && def.summary ? def.summary(allRows(ps)) : null); })
      .catch(() => live && setError("Couldn't load this report. Check your internet and try again."))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def?.id, range.from, range.to, compare]);

  const rows = useMemo(() => (sections ? allRows(sections) : []), [sections]);
  const summary = useMemo(() => (def?.summary && sections ? def.summary(rows) : []), [def, rows, sections]);
  const totals = useMemo(() => (def && hasTotals(def.columns) ? totalsOf(def.columns, rows) : null), [def, rows]);
  const periodLabel = def && !def.usesDates ? rangeLabel(todayKey(), todayKey()) : rangeLabel(range.from, range.to);
  const madeBy = profile?.full_name || user?.email || "";

  const ctx = (): ExportContext | null => def && sections ? ({
    def, sections, periodLabel, madeBy, include,
    summary: summary.map((s, i) => {
      const p = prevSummary?.[i];
      if (!compare || !p) return s;
      const diff = s.value - p.value;
      return { ...s, label: `${s.label} (${diff >= 0 ? "up" : "down"} ${summaryText({ ...s, value: Math.abs(diff) })})` };
    }),
    company: { name: companyInfo?.name || "", address: companyInfo?.address || "", gstin: companyInfo?.gstin || "", logoUrl: companyInfo?.logoUrl || undefined },
  }) : null;

  const doExport = useCallback(async (format: "pdf" | "xlsx" | "csv" | "whatsapp") => {
    const c = ctx(); if (!c || !def) return;
    setBusy(format);
    const label = { pdf: "PDF", xlsx: "Excel file", csv: "CSV file", whatsapp: "PDF" }[format];
    const count = await runExport(label, () => format === "pdf" ? exportPdf(c) : format === "xlsx" ? exportExcel(c) : format === "csv" ? exportCsv(c) : sharePdf(c));
    setBusy(null);
    if (count <= 0) return;
    const r: Recent = { id: def.id, period, from: range.from, to: range.to, format, at: Date.now() };
    const next = [r, ...recent.filter(x => !(x.id === r.id && x.format === r.format))].slice(0, 10);
    setRecent(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    if (companyId) logExport({ company_id: companyId, user_name: madeBy, report_id: def.id, format, params: { from: range.from, to: range.to }, row_count: count });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, sections, summary, prevSummary, include, period, range.from, range.to, recent, companyId, madeBy, compare]);

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(next); localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  const term = q.trim().toLowerCase();
  const match = (t: string, d: string) => !term || t.toLowerCase().includes(term) || d.toLowerCase().includes(term);
  const favList = allowed.filter(r => favs.includes(r.id) && match(r.title, r.description));

  const ReportButton = ({ id, title, description }: { id: string; title: string; description: string }) => (
    <div className={cn("group flex items-start gap-1 rounded-md", selected === id ? "bg-muted" : "hover:bg-muted/60")}>
      <button type="button" onClick={() => pick(id)} aria-current={selected === id ? "page" : undefined}
        className="flex-1 min-w-0 text-left px-3 py-2.5 min-h-11">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground line-clamp-2">{description}</span>
      </button>
      {id !== "tally" && (
        <button type="button" onClick={() => toggleFav(id)} aria-label={favs.includes(id) ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
          className="p-3 text-muted-foreground hover:text-foreground">
          <Star className={cn("h-4 w-4", favs.includes(id) && "fill-foreground text-foreground")} />
        </button>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <PageHeader title="Reports" subtitle="Pick a report, pick dates, download as PDF, Excel, CSV or for Tally." />

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Report list */}
          <nav aria-label="Reports" className="space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search reports" aria-label="Search reports" className="pl-9" />
            </div>
            {favList.length > 0 && (
              <section>
                <h2 className="px-3 pb-1 text-xs font-semibold text-muted-foreground">Favourites</h2>
                {favList.map(r => <ReportButton key={`f-${r.id}`} id={r.id} title={r.title} description={r.description} />)}
              </section>
            )}
            {GROUPS.map(g => {
              const list = allowed.filter(r => r.group === g && match(r.title, r.description));
              if (!list.length) return null;
              return (
                <section key={g}>
                  <h2 className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{g}</h2>
                  {list.map(r => <ReportButton key={r.id} id={r.id} title={r.title} description={r.description} />)}
                </section>
              );
            })}
            {canMoney && match("Tally export", "Send bills, payments and purchases to TallyPrime") && (
              <section>
                <h2 className="px-3 pb-1 text-xs font-semibold text-muted-foreground">Tally</h2>
                <ReportButton id="tally" title="Tally export" description="Send bills, payments and purchases to TallyPrime." />
              </section>
            )}
          </nav>

          {/* Report body */}
          <main className="min-w-0 space-y-4">
            {!def && !isTally && <p className="text-sm text-muted-foreground">Pick a report from the list.</p>}

            {(def?.usesDates || isTally) && (
              <div className="flex flex-wrap items-end gap-3">
                <SegmentedControl<PeriodId> label="Dates" value={period} onChange={setPeriod} options={PERIODS} className="flex-wrap" />
                {period === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input type="date" aria-label="From date" value={custom.from} max={custom.to} onChange={e => e.target.value && setCustom(c => ({ ...c, from: e.target.value }))} className="w-40" />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input type="date" aria-label="To date" value={custom.to} min={custom.from} max={todayKey()} onChange={e => e.target.value && setCustom(c => ({ ...c, to: e.target.value }))} className="w-40" />
                  </div>
                )}
                {def?.summary && (
                  <label className="flex items-center gap-2 text-sm text-foreground min-h-11">
                    <Switch checked={compare} onCheckedChange={setCompare} /> Compare with the period before
                  </label>
                )}
              </div>
            )}

            {isTally && <>
              <div><h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-5 w-5" /> Tally export</h2>
                <p className="text-sm text-muted-foreground">Makes a file your accountant imports into TallyPrime. Nothing in Ledge changes.</p></div>
              <TallyExportPanel from={range.from} to={range.to} companyName={companyInfo?.name || ""} />
            </>}

            {def && <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{def.title}</h2>
                  <p className="text-sm text-muted-foreground">{def.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{def.usesDates ? periodLabel : `As on today, ${periodLabel}`}{sections ? ` · ${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => doExport("pdf")} loading={busy === "pdf"} disabled={!sections || !!busy}><FileText className="h-4 w-4" /> PDF</Button>
                  <Button variant="outline" onClick={() => doExport("xlsx")} loading={busy === "xlsx"} disabled={!sections || !!busy}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
                  <Button variant="outline" onClick={() => doExport("csv")} loading={busy === "csv"} disabled={!sections || !!busy}><FileDown className="h-4 w-4" /> CSV</Button>
                  <Button variant="outline" onClick={() => doExport("whatsapp")} loading={busy === "whatsapp"} disabled={!sections || !!busy}><Share2 className="h-4 w-4" /> WhatsApp</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>In the PDF:</span>
                {([["company", "Company details"], ["summary", "Summary"], ["table", "Table"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-1.5"><Checkbox checked={include[k]} onCheckedChange={v => setInclude(s => ({ ...s, [k]: v === true }))} /> {l}</label>
                ))}
              </div>

              {summary.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {summary.map((s, i) => {
                    const p = compare ? prevSummary?.[i] : undefined;
                    const diff = p ? s.value - p.value : 0;
                    return (
                      <div key={s.label} className="rounded-md border border-border p-3">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-xl font-semibold tabular-nums text-foreground">{loading ? "–" : summaryText(s)}</p>
                        {p && !loading && <p className="text-xs text-muted-foreground">{diff === 0 ? "Same as before" : `${diff > 0 ? "Up" : "Down"} ${summaryText({ ...s, value: Math.abs(diff) })} from ${summaryText(p)}`}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {error && <div className="rounded-md border border-border p-4 text-sm text-foreground">{error}</div>}

              {!error && (
                <div className="rounded-md border border-border overflow-x-auto" aria-busy={loading}>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>{def.columns.map(c => <th key={c.key} scope="col" className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap", c.type === "money" || c.type === "number" ? "text-right" : "text-left")}>{c.header}</th>)}</tr>
                    </thead>
                    <tbody>
                      {loading && <tr><td colSpan={def.columns.length} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>}
                      {!loading && sections && rows.length === 0 && (
                        <tr><td colSpan={def.columns.length} className="px-3 py-8 text-center text-muted-foreground">{def.usesDates ? `Nothing between ${periodLabel}.` : "Nothing to show right now."}</td></tr>
                      )}
                      {!loading && sections?.map(s => {
                        const shown = s.rows.slice(0, PREVIEW);
                        return [
                          sections.length > 1 ? <tr key={`h-${s.name}`} className="bg-muted/40"><td colSpan={def.columns.length} className="px-3 py-1.5 text-xs font-semibold text-foreground">{s.name} · {s.rows.length}</td></tr> : null,
                          ...shown.map((r, i) => (
                            <tr key={`${s.name}-${i}`} className="border-t border-border">
                              {def.columns.map(c => <td key={c.key} className={cn("px-3 py-2 text-foreground", c.type === "money" || c.type === "number" ? "text-right tabular-nums whitespace-nowrap" : (c.weight ?? 1) < 2 ? "whitespace-nowrap" : "")}>{cellText(c, r[c.key])}</td>)}
                            </tr>
                          )),
                        ];
                      })}
                    </tbody>
                    {!loading && totals && rows.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-foreground font-semibold">
                          {def.columns.map((c, i) => <td key={c.key} className={cn("px-3 py-2 text-foreground", c.type === "money" || c.type === "number" ? "text-right tabular-nums whitespace-nowrap" : "")}>{i === 0 ? "Total" : c.total ? cellText(c, totals[c.key]) : ""}</td>)}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {!loading && rows.length > PREVIEW && <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">Showing the first {PREVIEW} of {rows.length} rows. Totals and downloads include all rows.</p>}
                </div>
              )}
              {!loading && def.note && rows.length > 0 && def.note(rows) && <p className="text-sm text-foreground">{def.note(rows)}</p>}
            </>}

            {recent.length > 0 && (
              <section className="pt-2">
                <h2 className="text-xs font-semibold text-muted-foreground mb-2">Recent downloads</h2>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {recent.filter(r => allowed.some(a => a.id === r.id)).map(r => (
                    <li key={`${r.id}-${r.format}-${r.at}`} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-foreground">{reportById(r.id)?.title} · {r.format.toUpperCase()} · <span className="text-muted-foreground">{rangeLabel(r.from, r.to)}</span></span>
                      <Button size="sm" variant="ghost" onClick={() => { pick(r.id); setPeriod(r.period); if (r.period === "custom") setCustom({ from: r.from, to: r.to }); }}>
                        <RotateCcw className="h-3.5 w-3.5" /> Open again
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
