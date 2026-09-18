import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import type { InvoiceLine } from "@/context/data-types";
import { fetchInvoiceLines, forgetInvoiceLines } from "@/lib/invoice-lines";

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
  claim, expandedId, setExpandedId, onClose,
}: {
  claim: Claim;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onClose: (claim: Claim) => void;
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
            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={() => onClose(claim)}>
                <CheckCircle2 className="h-4 w-4" />
                Close this return
              </Button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

function NewClaimDialog({
  open, onOpenChange, orders, invoices, api, presetOrderId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orders: Order[];
  invoices: Invoice[];
  api: ReturnType<typeof useApi>;
  presetOrderId?: string | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [good, setGood] = useState<Record<string, number>>({});
  const [damaged, setDamaged] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  /** Pieces already sent back on earlier credit notes, per bill line. */
  const [alreadyReturned, setAlreadyReturned] = useState<Record<string, number> | null>(null);
  /** True when past returns could not be read — the form must stay locked. */
  const [returnedError, setReturnedError] = useState(false);
  /** Bill line items, fetched only for the bill being returned against. */
  const [billLines, setBillLines] = useState<InvoiceLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);

  const billByOrderId = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoices.forEach(inv => {
      // Any issued bill can be returned against — a bill that has since been
      // paid or sent is still a real bill; only an unissued draft is not.
      if (inv.docType === "gst_invoice" && inv.status !== "draft" && inv.sourceOrderId) map.set(inv.sourceOrderId, inv);
    });
    return map;
  }, [invoices]);

  const selectedBill = selectedOrder ? billByOrderId.get(selectedOrder.id) ?? null : null;

  // What has already gone back on earlier credit notes for this bill, so the
  // form can only offer what is still returnable.
  const selectedBillId = selectedBill?.id ?? null;
  useEffect(() => {
    let cancelled = false;
    if (!selectedBillId) { setAlreadyReturned(null); setReturnedError(false); return; }
    setAlreadyReturned(null);
    setReturnedError(false);
    api.claims.returnedQuantities(selectedBillId)
      .then(totals => { if (!cancelled) setAlreadyReturned(totals); })
      // A failed read must never look like "nothing has come back yet" —
      // that is how the same goods get credited twice.
      .catch(() => { if (!cancelled) setReturnedError(true); });
    return () => { cancelled = true; };
  }, [selectedBillId, api.claims]);

  // Line items for this one bill — they are not carried in the app-wide bill list.
  useEffect(() => {
    let cancelled = false;
    if (!selectedBillId) { setBillLines([]); setLinesLoading(false); return; }
    setLinesLoading(true);
    fetchInvoiceLines(selectedBillId).then(lines => {
      if (cancelled) return;
      setBillLines(lines);
      setLinesLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedBillId]);

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

  // Opened from an order page: jump straight to that order's return.
  useEffect(() => {
    if (!open || !presetOrderId || selectedOrder) return;
    const match = eligibleOrders.find(o => o.id === presetOrderId);
    if (match) selectOrder(match);
  }, [open, presetOrderId, selectedOrder, eligibleOrders]);

  const returnLines = (billLines.length > 0 ? billLines : selectedBill?.lines ?? []).map(l => {
    const returnedQty = alreadyReturned?.[l.id as string] ?? 0;
    return {
      invoiceLineId: l.id as string,
      productName: l.productName,
      billedQty: l.quantity,
      returnedQty,
      remainingQty: Math.max(0, l.quantity - returnedQty),
      unitPrice: l.unitPrice,
      gstRate: l.gstRate ?? selectedBill?.gstRate ?? 0,
      goodQty: good[l.id] ?? 0,
      damagedQty: damaged[l.id] ?? 0,
    };
  });

  // Preview must match the credit note the server actually raises: taxable value plus GST.
  const returnValue = returnLines.reduce(
    (sum, l) => sum + (l.goodQty + l.damagedQty) * l.unitPrice, 0
  );
  const returnTax = returnLines.reduce(
    (sum, l) => sum + (l.goodQty + l.damagedQty) * l.unitPrice * ((l.gstRate ?? 0) / 100), 0
  );
  const returnTotal = returnValue + returnTax;

  const handleSubmit = async () => {
    if (!selectedOrder || !selectedBill) return;
    if (!alreadyReturned) {
      toast.error("Still checking what has already come back", { description: "Wait a moment, or reopen this return." });
      return;
    }
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
      if (selectedBillId) forgetInvoiceLines(selectedBillId);
      toast.success(`Return recorded — credit note ${res.creditNoteNumber}`, {
        description: `${formatCurrency(res.grandTotal)} credited${res.restocked ? " · good stock returned to the warehouse" : ""}`,
      });
      resetAndClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose(); }}>
      {/* Full screen on phones — the return form was too cramped in a small box */}
      <DialogContent className="max-w-lg overflow-y-auto max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-h-[85vh]">
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
              {returnedError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Couldn't load what has already come back on this bill. Recording a return now could credit the
                    same goods twice. Close this and try again.
                  </span>
                </div>
              )}
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
                      {linesLoading && returnLines.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Loading the items on this bill…
                          </td>
                        </tr>
                      )}
                      {returnLines.map(line => {
                        // Only what is still returnable: billed, less anything sent back earlier.
                        const other = (k: "goodQty" | "damagedQty") => line.remainingQty - (k === "goodQty" ? line.damagedQty : line.goodQty);
                        return (
                          <tr key={line.invoiceLineId} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium">
                              {line.productName}
                              {line.returnedQty > 0 && (
                                <span className="block text-[10px] font-normal text-muted-foreground">
                                  {line.returnedQty} already returned · {line.remainingQty} left
                                </span>
                              )}
                            </td>
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

              <div className="space-y-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Value of goods</span>
                  <span className="num">{formatCurrency(returnValue)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>GST</span>
                  <span className="num">{formatCurrency(returnTax)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1 text-sm">
                  <span className="font-medium">Credit note total</span>
                  <span className="font-semibold num">{formatCurrency(returnTotal)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={submitting}>
                Back
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !alreadyReturned}>
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
  const [tab, setTab] = useState("open");
  const [searchParams, setSearchParams] = useSearchParams();
  const presetOrderId = searchParams.get("order");
  const [newClaimOpen, setNewClaimOpen] = useState(!!presetOrderId);
  const [search, setSearch] = useState("");
  const [closing, setClosing] = useState<Claim | null>(null);
  const [closeNotes, setCloseNotes] = useState("");
  const [savingClose, setSavingClose] = useState(false);

  const handleCloseClaim = async () => {
    if (!closing || savingClose) return;
    setSavingClose(true);
    const ok = await api.claims.resolveClaim(closing.id, closeNotes);
    setSavingClose(false);
    if (ok) {
      toast.success("Return closed", { description: `${closing.orderNumber} is now settled.` });
      setClosing(null);
      setCloseNotes("");
    }
  };

  useEffect(() => {
    if (presetOrderId) setNewClaimOpen(true);
  }, [presetOrderId]);

  const closeNewClaim = (v: boolean) => {
    setNewClaimOpen(v);
    if (!v && presetOrderId) {
      searchParams.delete("order");
      setSearchParams(searchParams, { replace: true });
    }
  };

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
              Goods coming back and the credit notes raised for them
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
                    onClose={c => { setClosing(c); setCloseNotes(""); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewClaimDialog
        open={newClaimOpen}
        onOpenChange={closeNewClaim}
        presetOrderId={presetOrderId}
        orders={orders}
        invoices={invoices}
        api={api}
      />

      <Dialog open={!!closing} onOpenChange={v => { if (!v && !savingClose) { setClosing(null); setCloseNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this return</DialogTitle>
            <DialogDescription>
              {closing ? `${closing.orderNumber} · ${closing.distributorName} · ${formatCurrency(closing.totalClaimValue)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="close-notes">What was decided? (optional)</Label>
            <Textarea
              id="close-notes"
              value={closeNotes}
              onChange={e => setCloseNotes(e.target.value)}
              placeholder="e.g. Credit note issued, dealer informed."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Closing a return cannot be undone. It does not change stock or money on its own.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosing(null)} disabled={savingClose}>Cancel</Button>
            <Button onClick={handleCloseClaim} disabled={savingClose}>
              {savingClose ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Close return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
