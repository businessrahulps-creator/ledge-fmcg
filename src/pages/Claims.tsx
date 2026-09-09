import { useState, useMemo } from "react";
import { RotateCcw, PackageX, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2, Plus, Search, AlertTriangle } from "lucide-react";
import { SignalCard } from "@/components/ui/signal-card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
import { toast } from "sonner";
import type { Claim, Invoice } from "@/context/DataContext";
import type { Order } from "@/data/mock-data";

const claimTypeLabels: Record<string, { label: string; icon: typeof RotateCcw; color: string }> = {
  return: { label: "Goods Returned", icon: RotateCcw, color: "bg-primary/10 text-primary" },
  damage: { label: "Damaged / Claim Only", icon: PackageX, color: "bg-warning/10 text-warning" },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", color: "bg-warning/10 text-warning", icon: PackageX },
  resolved: { label: "Resolved", color: "bg-success/10 text-success", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

function ClaimCard({
  claim, expandedId, setExpandedId, resolveNotes, setResolveNotes, resolvingId, onResolve, onReject,
}: {
  claim: Claim;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  resolveNotes: string;
  setResolveNotes: (v: string) => void;
  resolvingId: string | null;
  onResolve: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const typeInfo = claimTypeLabels[claim.claimType] || claimTypeLabels.return;
  const statusInfo = statusConfig[claim.status] || statusConfig.open;
  const TypeIcon = typeInfo.icon;
  const isExpanded = expandedId === claim.id;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpandedId(isExpanded ? null : claim.id)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{claim.orderNumber}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeInfo.color}`}>
                <TypeIcon className="h-3 w-3" />
                {typeInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {claim.distributorName} · {formatIndianDate(claim.createdAt)}
            </p>
            {claim.reason && (
              <p className="mt-1 text-xs text-muted-foreground truncate max-w-md">
                Reason: {claim.reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold">{formatCurrency(claim.totalClaimValue)}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {claim.lines.map((line, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium">{line.productName}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{line.quantity}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Stock impact:</span>
            <span className={`font-medium ${claim.restoreStock ? "text-success" : "text-muted-foreground"}`}>
              {claim.restoreStock ? "✓ Stock was restored to warehouse" : "No stock change (damage claim only)"}
            </span>
          </div>

          {claim.resolutionNotes && (
            <div className="text-xs">
              <span className="text-muted-foreground">Resolution notes: </span>
              <span>{claim.resolutionNotes}</span>
            </div>
          )}

          {claim.status === "open" && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Textarea
                placeholder="Add resolution notes (optional)…"
                value={expandedId === claim.id ? resolveNotes : ""}
                onChange={e => setResolveNotes(e.target.value)}
                className="min-h-[60px] text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onResolve(claim.id)} disabled={resolvingId === claim.id}>
                  {resolvingId === claim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {resolvingId === claim.id ? "Saving…" : "Resolve"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(claim.id)} disabled={resolvingId === claim.id}>
                  {resolvingId === claim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewClaimDialog({
  open, onOpenChange, orders, invoices, api,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orders: Order[];
  invoices: Invoice[];
  api: ReturnType<typeof useApi>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [good, setGood] = useState<Record<string, number>>({});
  const [damaged, setDamaged] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const billByOrderId = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoices.forEach(inv => {
      if (inv.docType === "gst_invoice" && inv.status === "final" && inv.sourceOrderId) map.set(inv.sourceOrderId, inv);
    });
    return map;
  }, [invoices]);

  const selectedBill = selectedOrder ? billByOrderId.get(selectedOrder.id) ?? null : null;

  const eligibleOrders = useMemo(() =>
    orders.filter(o => billByOrderId.has(o.id)),
    [orders, billByOrderId]
  );

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return eligibleOrders;
    const q = search.toLowerCase();
    return eligibleOrders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.distributorName.toLowerCase().includes(q)
    );
  }, [eligibleOrders, search]);

  const resetAndClose = () => {
    setStep(1);
    setSearch("");
    setSelectedOrder(null);
    setReason("");
    setGood({});
    setDamaged({});
    onOpenChange(false);
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setGood({});
    setDamaged({});
    setReason("");
    setStep(2);
  };

  const returnLines = (selectedBill?.lines ?? []).map(l => ({
    invoiceLineId: l.id,
    productName: l.productName,
    billedQty: l.quantity,
    unitPrice: l.unitPrice,
    goodQty: good[l.id] ?? 0,
    damagedQty: damaged[l.id] ?? 0,
  }));

  const returnValue = returnLines.reduce(
    (sum, l) => sum + (l.goodQty + l.damagedQty) * l.unitPrice, 0
  );

  const handleSubmit = async () => {
    if (!selectedOrder || !selectedBill) return;
    const payload = returnLines.filter(l => l.goodQty + l.damagedQty > 0);
    if (payload.length === 0) {
      toast.error("Enter how many pieces are coming back");
      return;
    }
    setSubmitting(true);
    const res = await api.claims.recordReturn(
      selectedOrder.id,
      payload.map(l => ({ invoiceLineId: l.invoiceLineId, goodQty: l.goodQty, damagedQty: l.damagedQty })),
      reason,
    );
    setSubmitting(false);
    if (res) {
      toast.success(`Return recorded — credit note ${res.creditNoteNumber}`, {
        description: `${formatCurrency(res.grandTotal)} credited${res.restocked ? " · good stock returned to the warehouse" : ""}`,
      });
      resetAndClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Record a return</DialogTitle>
              <DialogDescription>Pick the bill the goods are coming back against.</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or dealer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="max-h-[45vh] overflow-y-auto space-y-1.5">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <PackageX className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="mt-2 text-sm font-medium">Nothing to return yet</p>
                  <p className="text-xs text-muted-foreground">Only orders that have been dispatched and billed can be returned.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{order.orderNumber}</span>
                        <p className="text-xs text-muted-foreground truncate">{order.distributorName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                        <p className="text-xs text-muted-foreground">{formatIndianDate(order.date)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Return against {selectedBill?.invoiceNumber ?? selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>{selectedOrder?.distributorName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Why is it coming back? (optional)</Label>
                <Textarea
                  placeholder="Short reason, e.g. leaking bottles, wrong item sent…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">How many pieces are coming back?</Label>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium text-right w-16">Billed</th>
                        <th className="px-3 py-2 font-medium text-right w-24">Good</th>
                        <th className="px-3 py-2 font-medium text-right w-24">Damaged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnLines.map(line => {
                        const other = (k: "goodQty" | "damagedQty") => line.billedQty - (k === "goodQty" ? line.damagedQty : line.goodQty);
                        return (
                          <tr key={line.invoiceLineId} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium">{line.productName}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{line.billedQty}</td>
                            <td className="px-3 py-2 text-right">
                              <NumberInput
                                allowEmpty={false}
                                min={0}
                                max={other("goodQty")}
                                value={line.goodQty}
                                onValueChange={v => setGood(prev => ({ ...prev, [line.invoiceLineId]: v ?? 0 }))}
                                className="h-7 w-20 text-xs text-right ml-auto"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <NumberInput
                                allowEmpty={false}
                                min={0}
                                max={other("damagedQty")}
                                value={line.damagedQty}
                                onValueChange={v => setDamaged(prev => ({ ...prev, [line.invoiceLineId]: v ?? 0 }))}
                                className="h-7 w-20 text-xs text-right ml-auto"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Good pieces go back into the warehouse. Damaged pieces are credited but stay out of stock.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Credit note value (before tax)</span>
                <span className="font-semibold">{formatCurrency(returnValue)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={submitting}>
                Back
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                {submitting ? "Saving…" : "Record return"}
              </Button>
            </DialogFooter>

          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Claims() {
  const api = useApi();
  const claims = api.claims.list();
  const orders = api.orders.list();
  const invoices = api.invoices.list();
  const isLoading = usePageLoading(api.loading);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [tab, setTab] = useState("open");
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = tab === "all" ? claims : claims.filter(c => c.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.orderNumber.toLowerCase().includes(q) ||
        c.distributorName.toLowerCase().includes(q) ||
        c.claimType.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q)
      );
    }
    return list;
  }, [claims, tab, search]);

  const openCount = claims.filter(c => c.status === "open").length;
  const openValue = claims.filter(c => c.status === "open").reduce((s, c) => s + (c.totalClaimValue || 0), 0);


  const handleResolve = async (id: string) => {
    setResolvingId(id);
    await api.claims.update(id, { status: "resolved", resolutionNotes: resolveNotes });
    setResolvingId(null);
    setResolveNotes("");
    setExpandedId(null);
    toast.success("Claim resolved");
  };

  const handleReject = async (id: string) => {
    setResolvingId(id);
    await api.claims.update(id, { status: "rejected", resolutionNotes: resolveNotes });
    setResolvingId(null);
    setResolveNotes("");
    setExpandedId(null);
    toast.success("Claim rejected");
  };

  // Blocking page skeleton removed — empty-state handles first-paint.

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="relative pl-3">
            {/* Brand placement (PR-A): Terracotta rule — claims are warm conversations. */}
            <span
              aria-hidden
              className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-warning"
            />
            <h1 className="h1-display">Returns & Claims</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Track returned goods and damage claims against orders
            </p>
          </div>
          <Button size="sm" onClick={() => setNewClaimOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Record return
          </Button>
        </div>

        {/* Open claims — promoted warning surface (attention tier) */}
        {openCount > 0 && (
          <SignalCard
            tier="warning"
            icon={AlertTriangle}
            label="Open claims"
            caption={`${openCount} claim${openCount > 1 ? "s" : ""} awaiting your decision`}
            subCaption={openValue > 0 ? `${formatCurrency(openValue)} in claim value at stake` : undefined}
            value={openCount}
            valueSuffix={openCount > 1 ? "Open" : "Open"}
          />
        )}


        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order, dealer, type, reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                card
                icon={RotateCcw}
                title={tab === "open" ? "No returns or claims." : `No ${tab} claims.`}
                description={tab === "open" ? "When a dealer returns stock or raises a claim, it lives here." : "Claims will appear here once recorded."}
                actionLabel={tab === "open" ? "Record a return" : undefined}
                onAction={tab === "open" ? () => setNewClaimOpen(true) : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filtered.map(claim => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    resolveNotes={resolveNotes}
                    setResolveNotes={setResolveNotes}
                    resolvingId={resolvingId}
                    onResolve={handleResolve}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewClaimDialog
        open={newClaimOpen}
        onOpenChange={setNewClaimOpen}
        orders={orders}
        invoices={invoices}
        api={api}
      />
    </AppLayout>
  );
}
