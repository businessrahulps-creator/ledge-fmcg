import { useState, useMemo, useEffect, useRef } from "react";
import { QuickAddUnit } from "@/components/stock/ProductUnitsEditor";
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
import { supabase } from "@/integrations/supabase/client";
import { checkReturnLine, type ReturnUnitOption } from "@/lib/return-units";
import { formatQty } from "@/lib/quantity";

const claimTypeLabels: Record<string, { label: string; icon: typeof RotateCcw; color: string }> = {
  return: { label: "Goods Returned", icon: RotateCcw, color: "bg-primary/10 text-primary" },
  damage: { label: "Damaged / Claim Only", icon: PackageX, color: "bg-warning/10 text-warning" },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", color: "bg-warning/10 text-warning", icon: PackageX },
  resolved: { label: "Closed", color: "bg-success/10 text-success", icon: CheckCircle2 },
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
                  <th className="px-3 py-2 font-medium text-right">Quantity</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {claim.lines.map((line, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium">{line.productName}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {line.quantity}
                      {line.enteredUnit && line.enteredQuantity != null && (
                        <span className="block text-[10px]">typed as {formatQty(line.enteredQuantity)} {line.enteredUnit}</span>
                      )}
                    </td>
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

type SavedReturn = {
  creditNoteNumber: string | null; grandTotal: number; restocked: boolean;
  taxableTotal: number | null; taxTotal: number | null; roundOff: number | null; godownName: string | null; replayed: boolean;
  dealerName: string; orderNumber: string; billNumber: string;
  lines: { productName: string; mainUnit: string; unitName: string | null; factor: number;
    good: number; damaged: number; noCredit: number; enteredGood: number; enteredDamaged: number; enteredNoCredit: number }[];
};

/** The Saved step: every figure comes from the save response or from exactly what was sent. */
function SavedReturnView({ result, onAnother, onClose }: { result: SavedReturn; onAnother: () => void; onClose: () => void }) {
  const sum = (k: "good" | "damaged" | "noCredit") => result.lines.reduce((t, l) => t + l[k], 0);
  const mainUnits = Array.from(new Set(result.lines.map(l => l.mainUnit)));
  const unitLabel = mainUnits.length === 1 ? ` ${mainUnits[0]}` : "";
  const typed = (k: "good" | "damaged" | "noCredit") => {
    const ek = k === "good" ? "enteredGood" : k === "damaged" ? "enteredDamaged" : "enteredNoCredit";
    const parts = result.lines.filter(l => l.unitName && l[k] > 0).map(l => `${formatQty(l[ek])} ${l.unitName}`);
    return parts.length ? ` (typed as ${parts.join(", ")})` : "";
  };
  const showSplit = result.creditNoteNumber && result.taxableTotal !== null && result.taxTotal !== null;
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex items-center justify-between gap-3 ${strong ? "border-t border-border pt-1.5 text-sm" : "text-muted-foreground"}`}>
      <span className={strong ? "font-medium text-foreground" : ""}>{label}</span>
      <span className={`num text-right ${strong ? "font-semibold text-foreground" : ""}`}>{value}</span>
    </div>
  );
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <DialogTitle>Return saved</DialogTitle>
        </div>
        <DialogDescription>
          {result.dealerName} · Order {result.orderNumber} · Bill {result.billNumber}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-xs">
        <div className="rounded-lg border border-border px-3 py-2">
          {result.creditNoteNumber ? (
            <p className="text-sm">Credit note <span className="font-semibold num">{result.creditNoteNumber}</span></p>
          ) : (
            <p className="text-sm font-medium">No credit note issued – damaged goods without credit</p>
          )}
        </div>
        {result.creditNoteNumber && (
          <div className="space-y-1 rounded-lg border border-border bg-muted/20 px-3 py-2">
            {showSplit && row("Taxable credit", formatCurrency(result.taxableTotal!))}
            {showSplit && row("GST", formatCurrency(result.taxTotal!))}
            {showSplit && !!result.roundOff && row("Round off", formatCurrency(result.roundOff!))}
            {row("Total credited", formatCurrency(result.grandTotal), true)}
          </div>
        )}
        <div className="space-y-1.5 rounded-lg border border-border px-3 py-2">
          {row("Good goods restocked", `${formatQty(sum("good"))}${unitLabel}${typed("good")}`)}
          {sum("good") > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {result.restocked
                ? `Back in ${result.godownName ?? "the order's godown"}`
                : "Not added to stock (this order has no godown)"}
            </p>
          )}
          {row("Damaged goods with credit", `${formatQty(sum("damaged"))}${unitLabel}${typed("damaged")}`)}
          {row("Damaged goods without credit", `${formatQty(sum("noCredit"))}${unitLabel}${typed("noCredit")}`)}
        </div>
        {result.lines.length > 1 && (
          <ul className="space-y-0.5 text-[11px] text-muted-foreground">
            {result.lines.map(l => (
              <li key={l.productName}>{l.productName}: {l.good} good · {l.damaged} damaged credit · {l.noCredit} no credit ({l.mainUnit})</li>
            ))}
          </ul>
        )}
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" size="sm" onClick={onAnother}>Record another return</Button>
        <Button size="sm" onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  /** What the last successful save returned, plus exactly what was sent. Shown on the Saved step. */
  const [result, setResult] = useState<SavedReturn | null>(null);
  const savingRef = useRef(false);
  const presetUsedRef = useRef(false);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [good, setGood] = useState<Record<string, number>>({});
  const [damaged, setDamaged] = useState<Record<string, number>>({});
  const [noCredit, setNoCredit] = useState<Record<string, number>>({});
  /** Picked unit per bill line ("" = the bill's main unit). */
  const [unitPick, setUnitPick] = useState<Record<string, string>>({});
  /** Other units per product, read fresh for this bill. */
  const [productUnits, setProductUnits] = useState<Record<string, ReturnUnitOption[]>>({});
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
  // Hold the stable function itself — `api` is a fresh object every render.
  const fetchReturnedQuantities = api.claims.returnedQuantities;
  useEffect(() => {
    let cancelled = false;
    if (!selectedBillId) { setAlreadyReturned(null); setReturnedError(false); return; }
    setAlreadyReturned(null);
    setReturnedError(false);
    fetchReturnedQuantities(selectedBillId)
      .then(totals => { if (!cancelled) setAlreadyReturned(totals); })
      // A failed read must never look like "nothing has come back yet" —
      // that is how the same goods get credited twice.
      .catch(() => { if (!cancelled) setReturnedError(true); });
    return () => { cancelled = true; };
  }, [selectedBillId, fetchReturnedQuantities]);

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

  const [unitsReload, setUnitsReload] = useState(0);
  // Other units for the products on this bill (archived ones are never offered).
  const billProductIds = useMemo(
    () => Array.from(new Set(billLines.map(l => l.productId).filter((x): x is string => !!x))).sort().join(","),
    [billLines],
  );
  useEffect(() => {
    let cancelled = false;
    if (!billProductIds) { setProductUnits({}); return; }
    supabase.from("product_units").select("id, product_id, unit_name, conversion_factor")
      .in("product_id", billProductIds.split(",")).eq("is_archived", false).order("created_at")
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, ReturnUnitOption[]> = {};
        (data || []).forEach(u => {
          (map[u.product_id] ||= []).push({ id: u.id, name: u.unit_name, factor: Number(u.conversion_factor) });
        });
        setProductUnits(map);
      });
    return () => { cancelled = true; };
  }, [billProductIds, unitsReload]);

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
    if (savingRef.current) return;
    setStep(1);
    setResult(null);
    presetUsedRef.current = false;
    setSearch("");
    setSelectedOrder(null);
    setReason("");
    setGood({});
    setDamaged({});
    setNoCredit({});
    setUnitPick({});
    onOpenChange(false);
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setGood({});
    setDamaged({});
    setNoCredit({});
    setUnitPick({});
    setReason("");
    setStep(2);
  };

  // Opened from an order page: jump straight to that order's return.
  useEffect(() => {
    if (!open || !presetOrderId || selectedOrder || presetUsedRef.current) return;
    const match = eligibleOrders.find(o => o.id === presetOrderId);
    if (match) { presetUsedRef.current = true; selectOrder(match); }
  }, [open, presetOrderId, selectedOrder, eligibleOrders]);

  const returnLines = (billLines.length > 0 ? billLines : selectedBill?.lines ?? []).map(l => {
    const returnedQty = alreadyReturned?.[l.id as string] ?? 0;
    const mainUnit: ReturnUnitOption = { id: null, name: l.unit || "main unit", factor: 1 };
    const unitOptions = [mainUnit, ...(l.productId ? productUnits[l.productId] ?? [] : [])];
    const unit = unitOptions.find(u => (u.id ?? "") === (unitPick[l.id as string] ?? "")) ?? mainUnit;
    const remainingQty = Math.max(0, l.quantity - returnedQty);
    const entered = { good: good[l.id as string] ?? 0, damaged: damaged[l.id as string] ?? 0, noCredit: noCredit[l.id as string] ?? 0 };
    const check = checkReturnLine(entered, unit.factor, remainingQty);
    return {
      invoiceLineId: l.id as string,
      productName: l.productName,
      productId: l.productId,
      billedQty: l.quantity,
      returnedQty,
      remainingQty,
      mainUnitName: mainUnit.name,
      unitOptions,
      unit,
      check,
      entered,
      unitPrice: l.unitPrice,
      // Credit is raised on what was actually billed for the line — after any
      // discount — not the list price, which would overstate the refund.
      taxablePerPiece: l.quantity > 0 ? (l.taxableValue ?? l.quantity * l.unitPrice) / l.quantity : l.unitPrice,
      gstRate: l.gstRate ?? selectedBill?.gstRate ?? 0,
      // Whole main units, for the credit preview (0 while a part-unit is typed).
      goodQty: check.good ?? 0,
      damagedQty: check.damaged ?? 0,
    };
  });

  // Preview must match the credit note the server actually raises: taxable value plus GST.
  const returnValue = returnLines.reduce(
    (sum, l) => sum + (l.goodQty + l.damagedQty) * l.taxablePerPiece, 0
  );
  const returnTax = returnLines.reduce(
    (sum, l) => sum + (l.goodQty + l.damagedQty) * l.taxablePerPiece * ((l.gstRate ?? 0) / 100), 0
  );
  const returnTotal = returnValue + returnTax;

  // One key per return attempt: a retry after a dropped connection replays the
  // first save instead of filing the return twice.
  const returnKeyRef = useRef<string | null>(null);
  const handleSubmit = async () => {
    if (savingRef.current) return;
    if (!selectedOrder || !selectedBill) return;
    if (!alreadyReturned) {
      toast.error("Still checking what has already come back", { description: "Wait a moment, or reopen this return." });
      return;
    }
    const bad = returnLines.find(l => l.check.partUnit || l.check.overLimit);
    if (bad) {
      toast.error(bad.check.partUnit ? `Fix the amount for ${bad.productName}` : `Too many for ${bad.productName}`, {
        description: bad.check.partUnit
          ? `Enter a multiple of ${formatQty(bad.unit.factor)} ${bad.unit.name} (1 ${bad.mainUnitName}).`
          : `Only ${bad.remainingQty} ${bad.mainUnitName} left to return.`,
      });
      return;
    }
    const payload = returnLines.filter(l => l.check.totalMain > 0);
    if (payload.length === 0) {
      toast.error("Enter how much is coming back");
      return;
    }
    savingRef.current = true;
    setSubmitting(true);
    const sent = {
      dealerName: selectedOrder.distributorName,
      orderNumber: selectedOrder.orderNumber,
      billNumber: selectedBill.invoiceNumber,
      lines: payload.map(l => ({
        productName: l.productName, mainUnit: l.mainUnitName,
        unitName: l.unit.id ? l.unit.name : null, factor: l.unit.factor,
        good: l.check.good ?? 0, damaged: l.check.damaged ?? 0, noCredit: l.check.noCredit ?? 0,
        enteredGood: l.entered.good, enteredDamaged: l.entered.damaged, enteredNoCredit: l.entered.noCredit,
      })),
    };
    if (!returnKeyRef.current) returnKeyRef.current = crypto.randomUUID();
    const res = await api.claims.recordReturn(
      selectedOrder.id,
      payload.map(l => ({
        invoiceLineId: l.invoiceLineId,
        goodQty: l.entered.good,
        damagedQty: l.entered.damaged,
        noCreditQty: l.entered.noCredit,
        unitId: l.unit.id,
        unitFactorSeen: l.unit.id ? l.unit.factor : null,
      })),
      reason,
      undefined,
      returnKeyRef.current,
    );
    savingRef.current = false;
    setSubmitting(false);
    if (res) {
      returnKeyRef.current = null;
      if (selectedBillId) forgetInvoiceLines(selectedBillId);
      if (res.creditNoteNumber) {
        toast.success(`Return recorded — credit note ${res.creditNoteNumber}`, {
          description: `${formatCurrency(res.grandTotal)} credited${res.restocked ? " · good stock returned to the warehouse" : ""}`,
        });
      } else {
        toast.success("Return recorded", { description: "No credit given, so no credit note was made." });
      }
      setResult({ ...res, ...sent });
      setStep(3);
    }
  };

  /** Back to picking a bill; keeps the dealer's name in the search, clears everything else. */
  const startAnother = () => {
    const dealer = result?.dealerName ?? "";
    setResult(null);
    setSelectedOrder(null);
    setGood({}); setDamaged({}); setNoCredit({}); setUnitPick({}); setReason("");
    setSearch(dealer);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose(); }}>
      {/* Full screen on phones — the return form was too cramped in a small box */}
      <DialogContent className="max-w-lg overflow-y-auto max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-h-[85vh]">
        {step === 3 && result ? (
          <SavedReturnView result={result} onAnother={startAnother} onClose={resetAndClose} />
        ) : step === 1 ? (
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

              <div className="space-y-2">
                <Label className="text-xs">How much is coming back?</Label>
                {linesLoading && returnLines.length === 0 && (
                  <div className="rounded-lg border border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Loading the items on this bill…
                  </div>
                )}
                {returnLines.map(line => {
                  const id = line.invoiceLineId;
                  const field = (label: string, value: number, set: typeof setGood) => (
                    <label className="space-y-1">
                      <span className="block text-[11px] text-muted-foreground">{label}</span>
                      <NumberInput
                        allowEmpty={false}
                        allowDecimal={line.unit.factor !== 1}
                        min={0}
                        value={value}
                        onValueChange={v => set(prev => ({ ...prev, [id]: v ?? 0 }))}
                        className="h-9 w-full text-sm text-right"
                      />
                    </label>
                  );
                  return (
                    <div key={id} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{line.productName}</p>
                          <p className="text-[11px] text-muted-foreground num">
                            {line.billedQty} {line.mainUnitName} billed
                            {line.returnedQty > 0 && ` · ${formatQty(line.returnedQty)} already returned`}
                            {` · ${formatQty(Math.max(0, line.remainingQty - line.check.totalMain))} left`}
                          </p>
                        </div>
                        {line.unitOptions.length > 1 ? (
                          <select
                            aria-label={`Unit for ${line.productName}`}
                            value={line.unit.id ?? ""}
                            onChange={e => setUnitPick(prev => ({ ...prev, [id]: e.target.value }))}
                            className="h-9 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            {line.unitOptions.map(u => (
                              <option key={u.id ?? ""} value={u.id ?? ""}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="shrink-0 text-xs text-muted-foreground">Unit: {line.mainUnitName}</span>
                        )}
                      </div>
                      {line.productId && (
                        <QuickAddUnit productId={line.productId} mainUnit={line.mainUnitName} onAdded={() => setUnitsReload(n => n + 1)} />
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {field("Good", line.entered.good, setGood)}
                        {field("Damaged, credit", line.entered.damaged, setDamaged)}
                        {field("Damaged, no credit", line.entered.noCredit, setNoCredit)}
                      </div>
                      {line.unit.id && !line.check.partUnit && line.check.totalMain > 0 && (
                        <p className="text-[11px] text-muted-foreground">= {line.check.totalMain} {line.mainUnitName}</p>
                      )}
                      {line.check.partUnit && (
                        <p className="text-[11px] text-destructive">
                          Not a whole {line.mainUnitName}. Enter a multiple of {formatQty(line.unit.factor)} {line.unit.name}.
                        </p>
                      )}
                      {line.check.overLimit && (
                        <p className="text-[11px] text-destructive">Only {formatQty(line.remainingQty)} {line.mainUnitName} left to return.</p>
                      )}
                    </div>
                  );
                })}
                <p className="text-[11px] text-muted-foreground">
                  Good goes back into the warehouse and is credited. Damaged with credit is credited but stays out of stock.
                  Damaged without credit is only recorded.
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
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !alreadyReturned || returnLines.some(l => l.check.partUnit || l.check.overLimit)}>
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
            label="Open returns"
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
            <TabsTrigger value="resolved">Closed</TabsTrigger>
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
