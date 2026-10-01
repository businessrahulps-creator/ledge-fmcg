import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { formatCurrency } from "@/data/mock-data";
import { buyingRpc, useBuying, type SupplierPayment } from "@/hooks/useBuying";
import { billPaidStatus } from "@/lib/payables";
import { SupplierDialog, PaySupplierDialog, ReasonDialog } from "@/components/buying/BuyingDialogs";
import { PaidPill } from "@/pages/Buying";

const fmtDate = (k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const MODE: Record<string, string> = { cash: "Cash", upi: "UPI", bank_transfer: "Bank", cheque: "Cheque" };

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { suppliers, bills, returns, payments, balances, loaded, reload } = useBuying();
  const s = suppliers.find(x => x.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [voiding, setVoiding] = useState<SupplierPayment | null>(null);
  const myBills = bills.filter(b => b.supplierId === id);
  const myPays = payments.filter(p => p.supplierId === id);
  const status = useMemo(() => (s ? billPaidStatus(s, bills, returns, payments) : new Map()), [s, bills, returns, payments]);

  if (!s) return <AppLayout><p className="text-sm text-muted-foreground py-10">{loaded ? "This supplier wasn't found." : "Loading…"}</p></AppLayout>;
  const owed = balances.get(s.id) || 0;
  const returnedTotal = returns.filter(r => r.supplierId === s.id && myBills.some(b => b.id === r.billId && b.status === "posted")).reduce((n, r) => n + r.grandTotal, 0);

  return (
    <AppLayout>
      <PageHeader
        title={s.name}
        subtitle={[s.phone, s.address].filter(Boolean).join(" · ") || "Supplier"}
        breadcrumbs={[{ label: "Buying", to: "/buying?tab=suppliers" }, { label: s.name }]}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="outline" onClick={() => navigate(`/buying/new?supplier=${s.id}`)}>Add purchase bill</Button>
            <Button onClick={() => setPayOpen(true)} disabled={owed <= 0}>Pay supplier</Button>
          </div>
        }
      />
      <div className="max-w-3xl space-y-4">
        <section className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{owed < 0 ? "They owe you (you paid extra)" : "Money you owe them"}</p>
          <p className="text-3xl font-semibold num tabular-nums">{formatCurrency(Math.abs(owed))}</p>
          <p className="text-xs text-muted-foreground mt-1 num tabular-nums">
            {s.openingBalance > 0 && <>Opening {formatCurrency(s.openingBalance)} + </>}
            Bills {formatCurrency(myBills.filter(b => b.status === "posted").reduce((n, b) => n + b.grandTotal, 0))}
            {returnedTotal > 0 && <> − Returns {formatCurrency(returnedTotal)}</>}
            {" "}− Paid {formatCurrency(myPays.filter(p => p.status === "posted").reduce((n, p) => n + p.amount, 0))}
          </p>
          {s.gstin && <p className="text-xs mt-2 flex items-center gap-1">GSTIN <span className="font-mono">{s.gstin}</span><CopyButton value={s.gstin} label="Copy GSTIN" /></p>}
        </section>

        <section className="rounded-md border border-border bg-card" aria-label="Purchase bills">
          <h2 className="px-4 pt-3 text-sm font-semibold">Purchase bills</h2>
          {myBills.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No bills yet.</p> : (
            <ul className="divide-y divide-border">
              {myBills.map(b => (
                <li key={b.id}>
                  <Link to={`/buying/bills/${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                    <div><p className="text-sm font-medium">Bill {b.supplierBillNo}</p><p className="text-xs text-muted-foreground">{fmtDate(b.billDate)}</p></div>
                    <div className="text-right"><p className="num tabular-nums text-sm">{formatCurrency(b.grandTotal)}</p><PaidPill status={b.status === "cancelled" ? "cancelled" : status.get(b.id)?.status || "unpaid"} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-border bg-card" aria-label="Payments">
          <h2 className="px-4 pt-3 text-sm font-semibold">Payments</h2>
          {myPays.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No payments yet.</p> : (
            <ul className="divide-y divide-border">
              {myPays.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className={p.status === "voided" ? "line-through text-muted-foreground" : "font-medium"}>{formatCurrency(p.amount)} · {MODE[p.mode] || p.mode}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(p.paidOn)}{p.reference && ` · Ref ${p.reference}`}{p.status === "voided" && ` · Cancelled: ${p.voidReason}`}</p>
                  </div>
                  {p.status === "posted" && <Button size="sm" variant="ghost" onClick={() => setVoiding(p)}>Cancel payment</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SupplierDialog open={editOpen} onOpenChange={setEditOpen} supplier={s} />
      <PaySupplierDialog open={payOpen} onOpenChange={setPayOpen} supplier={s} />
      <ReasonDialog open={!!voiding} onOpenChange={v => !v && setVoiding(null)} title="Cancel this payment?"
        description={`Use this only if the payment of ${voiding ? formatCurrency(voiding.amount) : ""} was entered by mistake. What you owe goes back up.`}
        confirmLabel="Cancel payment"
        onConfirm={async reason => {
          const ok = await buyingRpc("void_supplier_payment_atomic", { p_payment_id: voiding!.id, p_reason: reason }, "Couldn't cancel this payment");
          if (ok) { await reload(); toast.success("Payment cancelled"); }
          return !!ok;
        }} />
    </AppLayout>
  );
}
