import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/data/mock-data";
import { useBuying, type Supplier } from "@/hooks/useBuying";
import { billPaidStatus } from "@/lib/payables";
import { SupplierDialog, PaySupplierDialog } from "@/components/buying/BuyingDialogs";
import { todayKey } from "@/utils/dateKey";

const fmtDate = (k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const STATUS_LABEL = { paid: "Paid", partial: "Partly paid", unpaid: "Unpaid" } as const;

export function PaidPill({ status }: { status: "paid" | "partial" | "unpaid" | "cancelled" }) {
  const label = status === "cancelled" ? "Cancelled" : STATUS_LABEL[status];
  const cls = status === "paid" ? "border-success/40 text-success" : status === "cancelled" ? "border-border text-muted-foreground line-through" : status === "partial" ? "border-warning/50 text-foreground" : "border-destructive/40 text-destructive";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

export default function Buying() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "bills";
  const { suppliers, bills, returns, payments, balances, totalOwed, loading, loaded } = useBuying();
  const [q, setQ] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [paying, setPaying] = useState<Supplier | null>(null);

  const statusByBill = useMemo(() => {
    const m = new Map<string, { due: number; status: "paid" | "partial" | "unpaid" }>();
    for (const s of suppliers) for (const [k, v] of billPaidStatus(s, bills, returns, payments)) m.set(k, v);
    return m;
  }, [suppliers, bills, returns, payments]);

  const query = q.trim().toLowerCase();
  const shownBills = bills.filter(b => !query || b.supplierName.toLowerCase().includes(query) || b.supplierBillNo.toLowerCase().includes(query));
  const shownSuppliers = suppliers.filter(s => !query || s.name.toLowerCase().includes(query) || s.phone.includes(query));
  const today = todayKey();
  const owing = suppliers
    .map(s => {
      const owed = balances.get(s.id) || 0;
      const unpaidBills = bills.filter(b => b.supplierId === s.id && (statusByBill.get(b.id)?.due || 0) > 0);
      const oldest = unpaidBills.reduce<string | null>((o, b) => (!o || b.billDate < o ? b.billDate : o), null);
      return { s, owed, oldestDays: oldest ? dayDiff(oldest, today) : null, unpaid: unpaidBills.length };
    })
    .filter(x => x.owed > 0)
    .sort((a, b) => b.owed - a.owed);

  return (
    <AppLayout>
      <PageHeader
        title="Buying"
        subtitle="What you buy from suppliers, and what you owe them."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSupplierOpen(true)}><Plus className="h-4 w-4" />Add supplier</Button>
            <Button onClick={() => navigate("/buying/new")} disabled={loaded && suppliers.length === 0} title={suppliers.length === 0 ? "Add a supplier first" : undefined}>
              <Plus className="h-4 w-4" />Add purchase bill
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Money you owe suppliers</p>
          <p className="text-xl font-semibold num tabular-nums">{formatCurrency(totalOwed)}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Bought this month</p>
          <p className="text-xl font-semibold num tabular-nums">{formatCurrency(bills.filter(b => b.status === "posted" && b.billDate.startsWith(today.slice(0, 7))).reduce((n, b) => n + b.grandTotal, 0))}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">GST included in this month's purchases</p>
          <p className="text-xl font-semibold num tabular-nums">{formatCurrency(bills.filter(b => b.status === "posted" && b.billDate.startsWith(today.slice(0, 7))).reduce((n, b) => n + b.totalTax, 0))}</p>
          <p className="text-[11px] text-muted-foreground">Ask your accountant how much you can claim back.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setParams({ tab: v }, { replace: true })}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="bills">Purchase bills</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="pay">Money to pay</TabsTrigger>
          </TabsList>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === "pay" ? "Search supplier" : "Search supplier or bill no."} className="pl-9" />
          </div>
        </div>

        <TabsContent value="bills" className="mt-4">
          {loading && !loaded ? <p className="text-sm text-muted-foreground py-8">Loading…</p>
          : shownBills.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="font-medium">{bills.length ? "No bills match your search" : "No purchase bills yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">{suppliers.length === 0 ? "Start by adding a supplier, then add the bill they gave you." : "When goods arrive, add the supplier's bill here. Stock goes up automatically."}</p>
              {suppliers.length === 0 && <Button className="mt-3" onClick={() => setSupplierOpen(true)}>Add supplier</Button>}
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {shownBills.map(b => {
                const st = b.status === "cancelled" ? "cancelled" : statusByBill.get(b.id)?.status || "unpaid";
                return (
                  <li key={b.id}>
                    <Link to={`/buying/bills/${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{b.supplierName}</p>
                        <p className="text-xs text-muted-foreground">Bill {b.supplierBillNo} · {fmtDate(b.billDate)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="num tabular-nums font-medium">{formatCurrency(b.grandTotal)}</p>
                        <PaidPill status={st as any} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          {shownSuppliers.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="font-medium">{suppliers.length ? "No suppliers match your search" : "No suppliers yet"}</p>
              <Button className="mt-3" onClick={() => setSupplierOpen(true)}>Add supplier</Button>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {shownSuppliers.map(s => (
                <li key={s.id}>
                  <Link to={`/buying/suppliers/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{[s.phone, s.gstin].filter(Boolean).join(" · ") || "No phone or GSTIN"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground">You owe</p>
                      <p className="num tabular-nums font-medium">{formatCurrency(balances.get(s.id) || 0)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pay" className="mt-4">
          {owing.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="font-medium">You don't owe any supplier right now</p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {owing.filter(x => !query || x.s.name.toLowerCase().includes(query)).map(({ s, owed, oldestDays, unpaid }) => (
                <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={`/buying/suppliers/${s.id}`} className="min-w-0 hover:underline">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {unpaid} unpaid bill{unpaid === 1 ? "" : "s"}{oldestDays !== null && ` · oldest ${oldestDays} day${oldestDays === 1 ? "" : "s"} old`}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <p className="num tabular-nums text-lg font-semibold">{formatCurrency(owed)}</p>
                    <Button size="sm" onClick={() => setPaying(s)}>Pay supplier</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <SupplierDialog open={supplierOpen} onOpenChange={setSupplierOpen} />
      <PaySupplierDialog open={!!paying} onOpenChange={v => !v && setPaying(null)} supplier={paying} />
    </AppLayout>
  );
}
