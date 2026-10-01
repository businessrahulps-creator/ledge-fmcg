import { useEffect, useState } from "react";
import { AlertTriangle, Download, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { buildTallyXml, LEDGER_LABELS, tallyWarnings, DEFAULT_LEDGERS, type TallyLedgers } from "@/lib/reports/tally";
import { loadLedgers, loadTallyBundle, logExport, recentTallyExports, saveLedgers, type TallyBundle, type TallyChoice } from "@/lib/reports/tallyData";
import { saveText } from "@/lib/reports/exporters";
import { rangeLabel } from "@/lib/reports/periods";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

const CHOICES: { key: keyof TallyChoice; label: string }[] = [
  { key: "sales", label: "Sales bills" }, { key: "creditNotes", label: "Credit notes" }, { key: "receipts", label: "Payments received" },
  { key: "purchases", label: "Purchase bills" }, { key: "supplierPayments", label: "Supplier payments" },
  { key: "masters", label: "Dealers, suppliers and products (masters)" },
];

export function TallyExportPanel({ from, to, companyName }: { from: string; to: string; companyName: string }) {
  const { companyId, user, profile } = useAuth();
  const [choice, setChoice] = useState<TallyChoice>({ sales: true, creditNotes: true, receipts: true, purchases: true, supplierPayments: true, masters: true, onlyNew: true });
  const [ledgers, setLedgers] = useState<TallyLedgers>(DEFAULT_LEDGERS);
  const [editLedgers, setEditLedgers] = useState<TallyLedgers | null>(null);
  const [bundle, setBundle] = useState<TallyBundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof recentTallyExports>>>([]);

  useEffect(() => { if (companyId) { loadLedgers(companyId).then(setLedgers); recentTallyExports().then(setHistory); } }, [companyId]);
  useEffect(() => { setBundle(null); }, [from, to, choice]);

  const check = async () => {
    setBusy(true);
    try { setBundle(await loadTallyBundle({ from, to }, choice, companyName, ledgers)); }
    catch (e) { handleSupabaseError(e as never, "Couldn't read the data for Tally"); }
    finally { setBusy(false); }
  };

  const download = async (kind: "xml" | "xlsx") => {
    if (!bundle || !companyId) return;
    setBusy(true);
    try {
      const base = `tally_${from}_to_${to}`;
      if (kind === "xml") {
        saveText(buildTallyXml({ ...bundle.input, ledgers }), `${base}.xml`, "application/xml");
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const add = (name: string, rows: object[]) => rows.length && XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
        const tax = (d: NonNullable<typeof bundle.input.sales>[number]) => ({ Number: d.number, Date: d.date, Party: d.party, "Before GST": d.byRate.reduce((s, b) => s + b.taxable, 0), CGST: d.cgst, SGST: d.sgst, IGST: d.igst, Total: d.total, Rates: d.byRate.map(b => `${b.rate}%`).join(", ") });
        add("Sales", (bundle.input.sales ?? []).map(tax));
        add("Credit notes", (bundle.input.creditNotes ?? []).map(tax));
        add("Purchases", (bundle.input.purchases ?? []).map(tax));
        add("Receipts", (bundle.input.receipts ?? []).map(r => ({ Date: r.date, Party: r.party, Mode: r.mode, Reference: r.reference, Amount: r.amount })));
        add("Supplier payments", (bundle.input.supplierPayments ?? []).map(r => ({ Date: r.date, Party: r.party, Mode: r.mode, Reference: r.reference, Amount: r.amount })));
        add("Parties", (bundle.input.parties ?? []).map(p => ({ Name: p.name, Type: p.kind === "dealer" ? "Dealer" : "Supplier", GSTIN: p.gstin ?? "", State: p.stateName ?? "" })));
        add("Items", (bundle.input.items ?? []).map(i => ({ Name: i.name, Unit: i.unit, HSN: i.hsn ?? "", "GST %": i.gstRate ?? "" })));
        if (!wb.SheetNames.length) { toast.error("Nothing to export in these dates"); return; }
        XLSX.writeFile(wb, `${base}.xlsx`);
      }
      // Only the XML counts as "sent to Tally" for the no-duplicates rule.
      await logExport({ company_id: companyId, user_name: profile?.full_name || user?.email || "", report_id: kind === "xml" ? "tally" : "tally_excel", format: kind, params: { from, to, ...choice }, row_count: bundle.ids.length, document_ids: kind === "xml" ? bundle.ids : [] });
      recentTallyExports().then(setHistory);
      toast.success(kind === "xml" ? "Tally file ready" : "Excel for Tally ready", { description: kind === "xml" ? "In TallyPrime: Gateway of Tally > Import > Masters, then Transactions." : undefined });
    } catch (e) {
      toast.error("Couldn't make the Tally file", { description: "Please try again." });
      console.warn(e);
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!editLedgers || !companyId || !user) return;
    try { await saveLedgers(companyId, user.id, editLedgers); setLedgers(editLedgers); setEditLedgers(null); toast.success("Tally names saved"); }
    catch (e) { handleSupabaseError(e as never, "Couldn't save Tally names"); }
  };

  const warnings = bundle ? tallyWarnings(bundle.input) : [];
  const total = bundle ? Object.values(bundle.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">What to send · {rangeLabel(from, to)}</p>
          <Button variant="outline" size="sm" onClick={() => setEditLedgers(ledgers)}><Settings2 className="h-4 w-4" /> Tally names</Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHOICES.map(c => (
            <label key={c.key} className="flex items-center gap-2 text-sm text-foreground min-h-11 md:min-h-0">
              <Checkbox checked={!!choice[c.key]} onCheckedChange={v => setChoice(s => ({ ...s, [c.key]: v === true }))} /> {c.label}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground pt-1">
          <Switch checked={choice.onlyNew} onCheckedChange={v => setChoice(s => ({ ...s, onlyNew: v }))} />
          Only new since last Tally export (no duplicates)
        </label>
        <Button onClick={check} loading={busy && !bundle}>Check before export</Button>
      </div>

      {bundle && (
        <div className="rounded-md border border-border p-4 space-y-3">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {Object.entries(bundle.counts).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums text-foreground">{v}</dd></div>
            ))}
          </dl>
          {total === 0 && <p className="text-sm text-muted-foreground">Nothing new to send for these dates.</p>}
          {warnings.length > 0 && (
            <ul className="space-y-1">
              {warnings.map(w => <li key={w} className="flex gap-2 text-sm text-foreground"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {w}</li>)}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => download("xml")} disabled={total === 0 || busy}><Download className="h-4 w-4" /> Download Tally file (XML)</Button>
            <Button variant="outline" onClick={() => download("xlsx")} disabled={total === 0 || busy}>Excel for Tally</Button>
          </div>
          <p className="text-xs text-muted-foreground">In TallyPrime: Gateway of Tally → Import → Masters first, then Transactions. Ask your accountant to check the ledger names once.</p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Last Tally exports</p>
          <ul className="divide-y divide-border rounded-md border border-border text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between gap-2 px-3 py-2">
                <span className="text-foreground">{rangeLabel(h.params?.from ?? "", h.params?.to ?? "")} · {h.row_count} entries</span>
                <span className="text-muted-foreground">{h.user_name} · {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(h.created_at))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!editLedgers} onOpenChange={o => !o && setEditLedgers(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tally names</DialogTitle>
            <DialogDescription>Use the same ledger names your accountant has in Tally. You only do this once.</DialogDescription>
          </DialogHeader>
          {editLedgers && (
            <div className="space-y-3">
              {(Object.keys(LEDGER_LABELS) as (keyof TallyLedgers)[]).map(k => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`tl-${k}`} className="text-xs">{LEDGER_LABELS[k]}</Label>
                  <Input id={`tl-${k}`} value={editLedgers[k]} onChange={e => setEditLedgers(s => s && ({ ...s, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLedgers(DEFAULT_LEDGERS)}>Use standard names</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
