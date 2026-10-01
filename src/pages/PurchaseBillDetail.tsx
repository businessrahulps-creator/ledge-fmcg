import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { useApi } from "@/services/api";
import { formatCurrency } from "@/data/mock-data";
import { todayKey } from "@/utils/dateKey";
import { buyingRpc, useBuying } from "@/hooks/useBuying";
import { billPaidStatus } from "@/lib/payables";
import { ReasonDialog } from "@/components/buying/BuyingDialogs";
import { PaidPill } from "@/pages/Buying";

interface BLine { id: string; product_name: string; unit: string; quantity: number; rate: number; gst_rate: number; taxable_value: number; line_total: number }
interface RLine { bill_line_id: string; quantity: number; return_id: string }
const fmtDate = (k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PurchaseBillDetail() {
  const { id } = useParams();
  const api = useApi();
  const godowns = api.stock.locations.list();
  const { bills, suppliers, returns, payments, loaded, reload } = useBuying();
  const bill = bills.find(b => b.id === id);
  const supplier = suppliers.find(s => s.id === bill?.supplierId);
  const [lines, setLines] = useState<BLine[]>([]);
  const [rlines, setRlines] = useState<RLine[]>([]);
  const [returnOpen, setReturnOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadLines = useCallback(async () => {
    if (!id) return;
    const myReturns = returns.filter(r => r.billId === id).map(r => r.id);
    const [l, r] = await Promise.all([
      supabase.from("purchase_bill_lines").select("id,product_name,unit,quantity,rate,gst_rate,taxable_value,line_total").eq("bill_id", id).order("created_at"),
      myReturns.length ? supabase.from("purchase_return_lines").select("bill_line_id,quantity,return_id").in("return_id", myReturns) : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (l.error) handleSupabaseError(l.error, { source: "buying:lines", title: "Couldn't load the items on this bill" });
    setLines((l.data || []).map((x: any) => ({ ...x, rate: Number(x.rate), gst_rate: Number(x.gst_rate), taxable_value: Number(x.taxable_value), line_total: Number(x.line_total) })));
    setRlines(r.data || []);
  }, [id, returns]);
  useEffect(() => { void loadLines(); }, [loadLines]);

  const returnedByLine = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rlines) m.set(r.bill_line_id, (m.get(r.bill_line_id) || 0) + r.quantity);
    return m;
  }, [rlines]);
  const st = bill && supplier ? billPaidStatus(supplier, bills, returns, payments).get(bill.id) : undefined;
  const myReturns = returns.filter(r => r.billId === id);

  if (!bill) {
    return <AppLayout><p className="text-sm text-muted-foreground py-10">{loaded ? "This purchase bill wasn't found." : "Loading…"}</p></AppLayout>;
  }
  const cancelled = bill.status === "cancelled";
  const canReturn = !cancelled && lines.some(l => l.quantity - (returnedByLine.get(l.id) || 0) > 0);

  return (
    <AppLayout>
      <PageHeader
        title={`Bill ${bill.supplierBillNo}`}
        subtitle={`${bill.supplierName} · ${fmtDate(bill.billDate)} · ${godowns.find(g => g.id === bill.godownId)?.name || "Godown"}`}
        breadcrumbs={[{ label: "Buying", to: "/buying" }, { label: `Bill ${bill.supplierBillNo}` }]}
        actions={!cancelled && (
          <div className="flex gap-2">
            {canReturn && <Button variant="outline" onClick={() => setReturnOpen(true)}>Return to supplier</Button>}
            {myReturns.length === 0 && <Button variant="outline" onClick={() => setCancelOpen(true)}>Cancel bill</Button>}
          </div>
        )}
      />
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-4">
          <div className="flex-1 min-w-[10rem]">
            <p className="text-xs text-muted-foreground">Bill total</p>
            <p className="text-2xl font-semibold num tabular-nums">{formatCurrency(bill.grandTotal)}</p>
          </div>
          {!cancelled && st && <div><p className="text-xs text-muted-foreground">Still to pay on this bill</p><p className="text-lg font-semibold num tabular-nums">{formatCurrency(st.due)}</p></div>}
          <PaidPill status={cancelled ? "cancelled" : st?.status || "unpaid"} />
          {supplier && <Link to={`/buying/suppliers/${supplier.id}`} className="text-sm underline underline-offset-2">Open supplier</Link>}
        </div>
        {cancelled && <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">Cancelled. Reason: {bill.cancelReason}. The stock from this bill was taken back out.</p>}

        <section className="rounded-md border border-border bg-card" aria-label="Items">
          <ul className="divide-y divide-border">
            {lines.map(l => {
              const back = returnedByLine.get(l.id) || 0;
              return (
                <li key={l.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{l.product_name}</p>
                    <p className="text-xs text-muted-foreground">{l.quantity} {l.unit} × {formatCurrency(l.rate)} · GST {l.gst_rate}%{back > 0 && ` · ${back} returned`}</p>
                  </div>
                  <p className="num tabular-nums shrink-0">{formatCurrency(l.line_total)}</p>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border px-4 py-3 text-sm space-y-1 num tabular-nums">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount before GST</span><span>{formatCurrency(bill.subtotal)}</span></div>
            {bill.supplyType === "inter" ? <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span>{formatCurrency(bill.igst)}</span></div>
              : <><div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>{formatCurrency(bill.cgst)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>{formatCurrency(bill.sgst)}</span></div></>}
          </div>
        </section>

        {myReturns.length > 0 && (
          <section className="rounded-md border border-border bg-card p-4" aria-label="Returns">
            <h2 className="text-sm font-semibold mb-2">Returned to supplier</h2>
            <ul className="space-y-1 text-sm">
              {myReturns.map(r => <li key={r.id} className="flex justify-between"><span>{fmtDate(r.returnDate)}{r.reason && ` · ${r.reason}`}</span><span className="num tabular-nums">− {formatCurrency(r.grandTotal)}</span></li>)}
            </ul>
          </section>
        )}
        {bill.notes && <p className="text-sm text-muted-foreground">Note: {bill.notes}</p>}
      </div>

      <ReturnDialog open={returnOpen} onOpenChange={setReturnOpen} billId={bill.id} billDate={bill.billDate} lines={lines} returnedByLine={returnedByLine}
        onDone={async () => { await reload(); }} />
      <ReasonDialog open={cancelOpen} onOpenChange={setCancelOpen} title="Cancel this purchase bill?"
        description="The items are taken back out of stock and the amount is removed from what you owe. Only possible if you haven't paid for it and the stock is still there."
        confirmLabel="Cancel bill"
        onConfirm={async reason => {
          const ok = await buyingRpc("cancel_purchase_bill_atomic", { p_bill_id: bill.id, p_reason: reason }, "Couldn't cancel this bill");
          if (ok) { await reload(); toast.success("Purchase bill cancelled"); }
          return !!ok;
        }} />
    </AppLayout>
  );
}

function ReturnDialog({ open, onOpenChange, billId, billDate, lines, returnedByLine, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; billId: string; billDate: string; lines: BLine[]; returnedByLine: Map<string, number>; onDone: () => Promise<void>;
}) {
  const [qty, setQty] = useState<Record<string, number | null>>({});
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayKey());
  const [key, setKey] = useState("");
  useEffect(() => { if (open) { setQty({}); setReason(""); setDate(todayKey()); setKey(crypto.randomUUID()); } }, [open]);
  const est = lines.reduce((n, l) => n + ((qty[l.id] || 0) / l.quantity) * l.line_total, 0);

  const save = async () => {
    const picked = lines.filter(l => (qty[l.id] || 0) > 0).map(l => ({ bill_line_id: l.id, quantity: qty[l.id] }));
    if (picked.length === 0) { toast.error("Enter how many of each item you are sending back"); return; }
    const res = await buyingRpc("return_purchase_atomic", { p_bill_id: billId, p_lines: picked, p_reason: reason, p_return_date: date, p_idempotency_key: key }, "Couldn't save this return");
    if (!res) return;
    await onDone();
    toast.success("Return saved", { description: "Stock has gone down and what you owe is reduced." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Return to supplier</DialogTitle><DialogDescription>Items you are sending back. Stock goes down and you'll owe less.</DialogDescription></DialogHeader>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save(); }}>
          {lines.map(l => {
            const left = l.quantity - (returnedByLine.get(l.id) || 0);
            if (left <= 0) return null;
            return (
              <div key={l.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="text-sm font-medium">{l.product_name}</p><p className="text-[11px] text-muted-foreground">Up to {left} {l.unit}</p></div>
                <NumberInput className="w-24" value={qty[l.id] ?? null} onValueChange={v => setQty(q => ({ ...q, [l.id]: v }))} min={0} max={left} allowEmpty aria-label={`Return quantity for ${l.product_name}`} />
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Return date</Label><Input aria-label="Return date" type="date" value={date} min={billDate} max={todayKey()} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Reason</Label><Input aria-label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Damaged" /></div>
          </div>
          <p className="text-sm">You'll owe about <span className="font-semibold num tabular-nums">{formatCurrency(est)}</span> less (including GST).</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" onClick={save}>Save return</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
