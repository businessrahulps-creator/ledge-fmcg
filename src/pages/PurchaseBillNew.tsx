import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/services/api";
import { formatCurrency } from "@/data/mock-data";
import { todayKey } from "@/utils/dateKey";
import { buyingRpc, useBuying } from "@/hooks/useBuying";
import { calcBill, calcLine, isInterState, GST_RATES } from "@/lib/payables";
import { SupplierDialog } from "@/components/buying/BuyingDialogs";

interface Line { key: string; productId: string; quantity: number | null; rate: number | null; gstRate: number }
const blank = (): Line => ({ key: crypto.randomUUID(), productId: "", quantity: null, rate: null, gstRate: 18 });

export default function PurchaseBillNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { companyId } = useAuth();
  const api = useApi();
  const products = api.products.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const { suppliers, reload } = useBuying();
  const [supplierId, setSupplierId] = useState(params.get("supplier") || "");
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState(todayKey());
  const [godownId, setGodownId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([blank()]);
  const [companyState, setCompanyState] = useState("");
  const [addSupplier, setAddSupplier] = useState(false);
  const [key] = useState(() => crypto.randomUUID());

  useEffect(() => { if (!godownId && godowns.length === 1) setGodownId(godowns[0].id); }, [godowns, godownId]);
  useEffect(() => {
    if (!companyId) return;
    supabase.from("companies").select("state_code").eq("id", companyId).maybeSingle().then(({ data }) => setCompanyState(data?.state_code || ""));
  }, [companyId]);

  const supplier = suppliers.find(s => s.id === supplierId);
  const inter = isInterState(supplier?.stateCode || "", companyState);
  const valid = lines.filter(l => l.productId && (l.quantity || 0) > 0 && l.rate !== null);
  const totals = useMemo(() => calcBill(valid.map(l => ({ quantity: l.quantity!, rate: l.rate!, gstRate: l.gstRate })), inter), [valid, inter]);
  const sorted = useMemo(() => [...products].sort((a, b) => (a.itemKind === "raw_material" ? 0 : 1) - (b.itemKind === "raw_material" ? 0 : 1) || a.name.localeCompare(b.name)), [products]);

  const setLine = (k: string, patch: Partial<Line>) => setLines(ls => ls.map(l => (l.key === k ? { ...l, ...patch } : l)));
  const pickProduct = (k: string, id: string) => {
    const p = products.find(x => x.id === id);
    setLine(k, { productId: id, gstRate: p?.gstRate ?? 18, rate: p?.avgCost ? p.avgCost : null });
  };

  const save = async () => {
    if (!supplierId) { toast.error("Choose the supplier"); return; }
    if (!billNo.trim()) { toast.error("Enter the supplier's bill number", { description: "It's printed on the bill they gave you." }); return; }
    if (!godownId) { toast.error("Choose which godown the goods went to"); return; }
    if (valid.length === 0) { toast.error("Add at least one item with quantity and rate"); return; }
    const ids = valid.map(l => l.productId);
    if (new Set(ids).size !== ids.length) { toast.error("Same item added twice", { description: "Combine it into one line." }); return; }
    const res = await buyingRpc<{ bill_id: string }>("record_purchase_bill_atomic", {
      p_supplier_id: supplierId, p_supplier_bill_no: billNo.trim(), p_bill_date: date, p_godown_id: godownId,
      p_lines: valid.map(l => ({ product_id: l.productId, quantity: l.quantity, rate: l.rate, gst_rate: l.gstRate })),
      p_notes: notes, p_idempotency_key: key,
    }, "Couldn't save this purchase bill");
    if (!res) return;
    await reload();
    toast.success("Purchase bill saved", { description: "Stock has gone up and the amount is added to what you owe." });
    navigate(`/buying/bills/${res.bill_id}`, { replace: true });
  };

  return (
    <AppLayout>
      <PageHeader title="Add purchase bill" subtitle="Type in the bill your supplier gave you. Saving adds the items to stock." breadcrumbs={[{ label: "Buying", href: "/buying" }, { label: "Add purchase bill" }] as any} />
      <form className="space-y-5 max-w-3xl" onSubmit={e => { e.preventDefault(); void save(); }}>
        <section className="rounded-md border border-border bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Supplier *</Label>
            <div className="flex gap-2">
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Choose supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => setAddSupplier(true)}><Plus className="h-4 w-4" />New</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Supplier's bill no. *</Label><Input value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. SLP/245" /></div>
            <div className="space-y-1.5"><Label>Bill date</Label><Input type="date" value={date} max={todayKey()} onChange={e => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Goods went to which godown? *</Label>
            <Select value={godownId} onValueChange={setGodownId}>
              <SelectTrigger><SelectValue placeholder="Choose godown" /></SelectTrigger>
              <SelectContent>{godowns.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </section>

        <section className="rounded-md border border-border bg-card p-4 space-y-3" aria-label="Items">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Items on the bill</h2>
            <p className="text-[11px] text-muted-foreground">Rates before GST · {inter ? "Other state: IGST" : "Same state: CGST + SGST"}</p>
          </div>
          {lines.map((l, i) => {
            const c = l.productId && l.quantity && l.rate !== null ? calcLine({ quantity: l.quantity, rate: l.rate, gstRate: l.gstRate }, inter) : null;
            const p = products.find(x => x.id === l.productId);
            return (
              <div key={l.key} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex gap-2">
                  <Select value={l.productId} onValueChange={v => pickProduct(l.key, v)}>
                    <SelectTrigger className="flex-1" aria-label={`Item ${i + 1}`}><SelectValue placeholder="Choose item" /></SelectTrigger>
                    <SelectContent>
                      {sorted.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.itemKind === "raw_material" ? " · raw material" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {lines.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove item" onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))}><Trash2 className="h-4 w-4" /></Button>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Quantity{p?.unit ? ` (${p.unit})` : ""}</Label><NumberInput value={l.quantity} onValueChange={v => setLine(l.key, { quantity: v })} min={0} allowEmpty /></div>
                  <div className="space-y-1"><Label className="text-xs">Rate per unit (₹)</Label><NumberInput value={l.rate} onValueChange={v => setLine(l.key, { rate: v })} min={0} allowDecimal allowEmpty /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">GST %</Label>
                    <Select value={String(l.gstRate)} onValueChange={v => setLine(l.key, { gstRate: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {c && <p className="text-xs text-muted-foreground text-right num tabular-nums">{formatCurrency(c.taxable)} + GST {formatCurrency(c.total - c.taxable)} = <span className="text-foreground font-medium">{formatCurrency(c.total)}</span></p>}
              </div>
            );
          })}
          <Button type="button" variant="outline" onClick={() => setLines(ls => [...ls, blank()])}><Plus className="h-4 w-4" />Add another item</Button>
        </section>

        <section className="rounded-md border border-border bg-card p-4 space-y-1 text-sm num tabular-nums">
          <div className="flex justify-between"><span className="text-muted-foreground">Amount before GST</span><span>{formatCurrency(totals.subtotal)}</span></div>
          {inter ? <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span>{formatCurrency(totals.igst)}</span></div>
            : <><div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>{formatCurrency(totals.cgst)}</span></div>
               <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>{formatCurrency(totals.sgst)}</span></div></>}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span>Bill total</span><span>{formatCurrency(totals.total)}</span></div>
          <p className="text-[11px] text-muted-foreground">If the supplier's total is a few paise different (rounding), that's normal.</p>
        </section>

        <div className="space-y-1.5 max-w-3xl"><Label>Note</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/buying")}>Cancel</Button>
          <Button type="submit" onClick={save}>Save purchase bill</Button>
        </div>
      </form>
      <SupplierDialog open={addSupplier} onOpenChange={setAddSupplier} onSaved={id => setSupplierId(id)} />
    </AppLayout>
  );
}
