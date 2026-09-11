import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, RotateCcw, PackageX, Trash2, FileText, Plus, X, AlertTriangle } from "lucide-react";
import { HeroBand } from "@/components/ui/hero-band";
import { JourneyTrack, type JourneyStep } from "@/components/ui/journey-track";
import { EntityHistory } from "@/components/layout/EntityHistory";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareOrderOnWhatsApp } from "@/utils/shareWhatsApp";
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
// OrderInvoicePdf is dynamically imported on click to keep @react-pdf/renderer
// out of the OrderDetail initial bundle and to avoid a static+dynamic chunking conflict.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteSkeleton } from "@/components/ui/route-skeleton";
import { formatCurrency, type Order, type OrderLine } from "@/data/mock-data";
import { computeOrderPricing, serializeAppliedSchemes } from "@/lib/order-pricing";
import { useApi } from "@/services/api";
import { PaymentsPanel } from "@/components/orders/PaymentsPanel";
import { useCan } from "@/hooks/useCan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatIndianDate } from "@/utils/formatDate";

const statusColors: Record<string, string> = {
  paid: "border-success/40 bg-success/10 text-success",
  partial: "border-warning/40 bg-warning/10 text-warning",
  pending: "border-destructive/40 bg-destructive/10 text-destructive",
  dispatched: "border-primary/30 bg-primary/10 text-primary",
  delivered: "border-success/40 bg-success/10 text-success",
};

const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
];

interface EditLineState {
  id: string;
  productId: string;
  productName: string;
  quantity: number | null;
  unitPrice: number;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const canManageStock = useCan("manage_stock");
  const canOverrideCredit = useCan("override_credit_limit");
  const canSeeMoney = useCan("see_money");
  const { companyInfo } = api;

  const orders = api.orders.list();
  const invoices = api.invoices.list();
  const distributors = api.dealers.list();
  const salespersons = api.salespersons.list();
  const products = api.products.list();
  const allSchemes = api.schemes.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const updateOrder = (oid: string, updates: Partial<Order>) => api.orders.update(oid, updates);

  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [editDispatchDate, setEditDispatchDate] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [editGodown, setEditGodown] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Editable dealer, salesperson, lines
  const [editDealerId, setEditDealerId] = useState("");
  const [editSalespersonId, setEditSalespersonId] = useState("");
  const [editLines, setEditLines] = useState<EditLineState[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [creditOverrideOpen, setCreditOverrideOpen] = useState(false);
  const [creditDispatchOpen, setCreditDispatchOpen] = useState(false);

  const [money, setMoney] = useState({ received: 0, balance: 0 });
  const handleMoneyTotals = useCallback((t: { received: number; balance: number }) => setMoney(t), []);

  type DispatchImpactRow = { product_id: string; product_name: string; required_qty: number; current_qty: number; after_qty: number; will_go_negative: boolean };
  const [dispatchPreview, setDispatchPreview] = useState<{ open: boolean; rows: DispatchImpactRow[]; loading: boolean }>({ open: false, rows: [], loading: false });


  const order = orders.find(o => o.id === id);

  const prevOrderId = useRef<string | undefined>();

  // Sync status/dispatch fields when they change
  useEffect(() => {
    if (order) {
      setEditPaymentMode(order.paymentMode);
      setEditDispatchDate(order.dispatchDate || "");
      setEditVehicle(order.vehicle || "");
      setEditDriver(order.driverName || "");
      setEditGodown(order.godownId || "");
      setEditDealerId(order.distributorId);
      setEditSalespersonId(order.salespersonId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.paymentStatus, order?.deliveryStatus, order?.distributorId, order?.salespersonId]);

  // Sync line items only when order ID changes (avoids regenerating UUIDs on status updates)
  useEffect(() => {
    if (order && order.id !== prevOrderId.current) {
      prevOrderId.current = order.id;
      setEditLines(order.lines.map(l => ({
        id: crypto.randomUUID(),
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  const orderDocs = invoices.filter(inv => inv.sourceOrderId === id);
  const finalInvoice = orderDocs.find(doc => doc.docType === "gst_invoice");

  // Line editing helpers
  const addLine = () => {
    setEditLines(prev => [...prev, { id: crypto.randomUUID(), productId: "", productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLine = (lineId: string) => {
    if (editLines.length <= 1) return;
    setEditLines(prev => prev.filter(l => l.id !== lineId));
  };

  const updateLine = (lineId: string, field: keyof EditLineState, value: string | number | null) => {
    setEditLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      if (field === "quantity") {
        return { ...l, quantity: value as number | null };
      }
      const updated = { ...l, [field]: value } as EditLineState;
      if (field === "productId") {
        const product = products.find(p => p.id === value);
        if (product) {
          updated.unitPrice = product.basePrice;
          updated.productName = product.name;
        }
      }
      return updated;
    }));
  };

  const editTotal = editLines.reduce((sum, l) => sum + (l.quantity ?? 0) * l.unitPrice, 0);

  // Scheme auto-apply (centralized pricing engine)
  const pricing = useMemo(
    () => computeOrderPricing(editLines, allSchemes, editDealerId),
    [allSchemes, editDealerId, editLines],
  );
  const appliedSchemes = pricing.appliedSchemes;
  const totalSchemeSavings = pricing.totalSchemeSavings;

  const executeSaveOrder = async () => {
    if (!order) return;
    const validLines = editLines.filter(l => l.productId && (l.quantity ?? 0) > 0);
    if (validLines.length === 0) {
      toast.error("Products required", { description: "Add at least one product with quantity > 0." });
      return;
    }

    const dealer = distributors.find(d => d.id === editDealerId);
    const sp = salespersons.find(s => s.id === editSalespersonId);

    if (!editDealerId || !dealer) {
      toast.error("Dealer required", { description: "Please select a dealer." });
      return;
    }
    if (!editSalespersonId || !sp) {
      toast.error("Sales person required", { description: "Please select a sales person." });
      return;
    }

    setIsSaving(true);

    const newLines: OrderLine[] = validLines.map(l => {
      const qty = l.quantity ?? 0;
      return {
        productId: l.productId,
        productName: l.productName || products.find(p => p.id === l.productId)?.name || "",
        quantity: qty,
        unitPrice: l.unitPrice,
        lineTotal: qty * l.unitPrice,
      };
    });

    const newTotal = newLines.reduce((sum, l) => sum + l.lineTotal, 0);

    await updateOrder(order.id, {
      paymentMode: editPaymentMode as Order["paymentMode"],

      dispatchDate: editDispatchDate || null,
      vehicle: editVehicle,
      driverName: editDriver,
      godownId: editGodown || undefined,
      distributorId: editDealerId,
      distributorName: dealer.name,
      salespersonId: editSalespersonId,
      salesperson: sp.name,
      lines: newLines,
      total: newTotal,
      schemeSavings: totalSchemeSavings,
      appliedSchemes: serializeAppliedSchemes(appliedSchemes),
    });
    setIsSaving(false);
    toast.success("Order updated", { description: `${order.orderNumber} has been updated.` });
  };

  /** Opens the stock preview before goods leave the warehouse. */
  const startDispatch = () => {
    if (!order) return;
    if (!editGodown) {
      toast.error("Warehouse required", { description: "Choose the warehouse the goods leave from." });
      return;
    }
    setDispatchPreview({ open: true, rows: [], loading: true });
    supabase.rpc("preview_dispatch_impact" as any, { p_order_id: order.id }).then(({ data, error }) => {
      if (error) {
        setDispatchPreview({ open: false, rows: [], loading: false });
        handleSupabaseError(error, { source: "rpc:preview_dispatch_impact", title: "Couldn't load stock preview", context: { orderId: order.id } });
        return;
      }
      setDispatchPreview({ open: true, rows: (data as DispatchImpactRow[]) || [], loading: false });
    });
  };

  const handleMarkDelivered = async () => {
    if (!order) return;
    setIsSaving(true);
    const ok = await api.orders.markDelivered(order.id);
    setIsSaving(false);
    if (ok) toast.success(`${order.orderNumber} marked delivered.`);
  };

  /** One step: stock out + final GST bill + order marked dispatched. */
  const confirmDispatch = async (overrideCredit = false) => {
    if (!order) return;
    setDispatchPreview(p => ({ ...p, open: false }));
    setIsSaving(true);
    const res = await api.orders.dispatchAndBill(order.id, {
      godownId: editGodown || null,
      dispatchDate: editDispatchDate || null,
      vehicle: editVehicle,
      driverName: editDriver,
      overrideCredit,
    });
    setIsSaving(false);
    if (!res.success) {
      if (!overrideCredit && canOverrideCredit && /credit limit/i.test(res.error || "")) {
        setCreditDispatchOpen(true);
      }
      return;
    }
    const negatives = dispatchPreview.rows.filter(r => r.will_go_negative).length;
    toast.success(
      res.alreadyDone
        ? "This order was already dispatched and billed."
        : `Dispatched. Bill ${res.invoiceNumber} created and stock updated.`,
      negatives > 0 ? { description: `${negatives} product${negatives === 1 ? "" : "s"} went below zero — please reconcile stock.` } : undefined,
    );
  };



  const saveOrder = () => {
    if (!order) return;
    const dealer = distributors.find(d => d.id === editDealerId);
    if (!dealer || dealer.creditLimit <= 0) { executeSaveOrder(); return; }
    const alreadyCounted = order.paymentStatus === "paid" ? 0 : order.total;
    const newTotal = editLines.filter(l => l.productId && (l.quantity ?? 0) > 0).reduce((s2, l) => s2 + (l.quantity ?? 0) * l.unitPrice, 0);
    const projected = dealer.outstandingAmount - alreadyCounted + newTotal;
    if (projected > dealer.creditLimit) {
      if (canOverrideCredit) { setCreditOverrideOpen(true); return; }
      toast.error("Credit limit crossed", {
        description: `${dealer.name} would owe more than their limit. Ask someone who can approve it.`,
      });
      return;
    }
    executeSaveOrder();
  };

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const ok = await api.orders.delete(deleteTarget.id);
    setDeleteLoading(false);
    if (ok) {
      toast.success("Order deleted", { description: `${deleteTarget.orderNumber} has been deleted.` });
      navigate("/orders");
    }
  };

  if (!order) {
    // While data is still loading (cold start, two-phase fetch, or a
    // transient empty-orders render) show a skeleton instead of flashing
    // the "not found" empty state. Only show the real empty state once
    // we're sure the order genuinely doesn't exist.
    if (api.loading || orders.length === 0) {
      return (
        <AppLayout>
          <RouteSkeleton />
        </AppLayout>
      );
    }
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Order not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
          </Button>
        </div>
      </AppLayout>
    );
  }

  const netTotal = editTotal - totalSchemeSavings;
  const hasBill = !!finalInvoice;
  const moneyTarget = hasBill ? finalInvoice.grandTotal : netTotal;
  const received = money.received;
  const balance = Math.max(0, Math.round((moneyTarget - received) * 100) / 100);
  const dispatched = order.deliveryStatus === "dispatched" || order.deliveryStatus === "delivered";
  const delivered = order.deliveryStatus === "delivered";
  const settled = balance <= 0 && received > 0;
  /* Money chip comes from real receipts, so chip, balance and journey always agree.
     Receipts can be taken from the moment the order is booked. */
  const moneyStatus: "paid" | "partial" | "pending" =
    settled ? "paid" : received > 0 ? "partial" : "pending";

  const journey: JourneyStep[] = [
    { label: "Booked", detail: formatIndianDate(order.date), state: "done" },
    {
      label: "Dispatched",
      detail: dispatched ? formatIndianDate(order.dispatchDate) : undefined,
      state: dispatched ? "done" : "current",
    },
    { label: "Billed", detail: finalInvoice?.invoiceNumber, state: hasBill ? "done" : "todo" },
    { label: "Delivered", state: delivered ? "done" : dispatched ? "current" : "todo" },
    {
      label: "Paid",
      detail: settled ? "Fully received" : received > 0 ? `${formatCurrency(received)} received` : undefined,
      state: settled ? "done" : received > 0 ? "current" : "todo",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6 pb-4 md:pb-6">
        <Button variant="ghost" size="sm" className="-ml-2 h-9 text-muted-foreground" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Button>

        {/* The one loud block: the money on this order */}
        <HeroBand
          eyebrow="Order"
          title={order.orderNumber}
          subtitle={`${order.distributorName} · ${formatIndianDate(order.date)}`}
          aside={
            <>
              {moneyStatus && <StatusBadge status={moneyStatus} />}
              <StatusBadge status={order.deliveryStatus} kind="delivery" />
            </>
          }
          figures={[
            {
              label: totalSchemeSavings > 0 ? "Order total (after schemes)" : "Order total",
              value: formatCurrency(netTotal),
              primary: true,
              note: totalSchemeSavings > 0 ? `Saved ${formatCurrency(totalSchemeSavings)} on schemes` : undefined,
            },
            {
              label: "Money received",
              value: formatCurrency(received),
              tone: received > 0 ? "good" : "default",
              note: hasBill ? `Against bill ${finalInvoice?.invoiceNumber}` : "Advance received on this order",
            },
            {
              label: "Balance to collect",
              value: formatCurrency(balance),
              tone: balance > 0 ? "attention" : "good",
              note: balance > 0 ? "Still to be collected" : "Nothing pending",
            },
          ]}
        />

        {/* Where this order stands */}
        <JourneyTrack steps={journey} />

        {/* Plain facts — read, don't hunt */}
        <div className="fact-strip">
          <div className="min-w-0">
            <p className="fact-label">Dealer</p>
            <p className="fact-value truncate">{order.distributorName}</p>
          </div>
          <div className="min-w-0">
            <p className="fact-label">Sales person</p>
            <p className="fact-value truncate">{order.salesperson}</p>
          </div>
          <div>
            <p className="fact-label">Payment mode</p>
            <p className="fact-value capitalize">{editPaymentMode.replace("_", " ")}</p>
          </div>
          <div>
            <p className="fact-label">Items</p>
            <p className="fact-value">{editLines.length}</p>
          </div>
          <div>
            <p className="fact-label">Order date</p>
            <p className="fact-value">{formatIndianDate(order.date)}</p>
          </div>
        </div>

        {/* Editable Dealer & Salesperson */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          <div className="glass-card p-3 md:p-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Change dealer</Label>
            <Select value={editDealerId} onValueChange={setEditDealerId}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue placeholder="Select dealer" />
              </SelectTrigger>
              <SelectContent>
                {distributors.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="glass-card p-3 md:p-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Change sales person</Label>
            <Select value={editSalespersonId} onValueChange={setEditSalespersonId}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue placeholder="Select sales person" />
              </SelectTrigger>
              <SelectContent>
                {salespersons.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* Editable Items */}
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold md:text-base">Items</h2>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addLine}>
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          </div>
          <div className="p-3 space-y-3">
            {editLines.map((line, i) => (
              <div key={line.id} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                {/* On a phone the product name gets the full width so it is never cut off. */}
                <div className="min-w-0 sm:flex-1">
                  <Select value={line.productId} onValueChange={(v) => updateLine(line.id, "productId", v)}>
                    <SelectTrigger className="h-9 rounded-lg text-xs">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.basePrice)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-2 sm:contents">
                <div className="w-20 shrink-0">
                  <NumberInput
                    allowEmpty
                    min={1}
                    value={line.quantity}
                    onValueChange={v => updateLine(line.id, "quantity", v)}
                    placeholder="Qty"
                    className="h-9 text-xs text-right"
                  />
                </div>
                <div className="w-24 shrink-0 text-right">
                  <NumberInput
                    allowDecimal
                    allowEmpty={false}
                    min={0}
                    value={line.unitPrice}
                    onValueChange={v => updateLine(line.id, "unitPrice", v ?? 0)}
                    placeholder="Price"
                    className="h-9 text-xs text-right"
                  />
                </div>
                <div className="flex w-20 flex-1 items-center justify-end gap-1 sm:flex-none">
                  <span className="text-xs font-medium">{formatCurrency((line.quantity ?? 0) * line.unitPrice)}</span>
                  {editLines.length > 1 && (
                    <button onClick={() => removeLine(line.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Subtotal</span>
            <span className="text-sm font-semibold">{formatCurrency(editTotal)}</span>
          </div>
        </div>

        {/* Schemes Applied */}
        {appliedSchemes.length > 0 && (
          <div className="rounded-md border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-success">Schemes Applied</span>
            </div>
            <div className="space-y-1.5">
              {appliedSchemes.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-success">{a.scheme.name}</span>
                    {a.label && <span className="text-success/70 ml-1">({a.label})</span>}
                  </div>
                  <span className="font-semibold text-success">-{formatCurrency(a.savings)}</span>
                </div>
              ))}
            </div>
            {totalSchemeSavings > 0 && (
              <div className="mt-2 pt-2 border-t border-success/20 flex items-center justify-between text-xs">
                <span className="font-medium text-success">Total Savings</span>
                <span className="font-bold text-success">-{formatCurrency(totalSchemeSavings)}</span>
              </div>
            )}
          </div>
        )}

        {/* Billing Documents */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold md:text-base">Documents</h2>
            <p className="text-right text-xs text-muted-foreground">
              The GST bill is created automatically when you dispatch this order.
            </p>
          </div>
          {orderDocs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Type</th>
                    <th className="px-4 py-2.5 text-left font-medium">Number</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDocs.map(doc => (
                    <tr key={doc.id} className="border-b border-border/50">
                      <td className="px-4 py-3 capitalize">{doc.docType.replace("_", " ")}</td>
                      <td className="px-4 py-3 font-mono font-medium">{doc.invoiceNumber}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCurrency(doc.grandTotal)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          doc.status === "final" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}>{doc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-6 text-xs text-muted-foreground/60 text-center">No billing documents yet for this order.</p>
          )}
        </div>

        <Separator />
        <PaymentsPanel
          invoiceId={finalInvoice?.id ?? null}
          orderId={finalInvoice ? null : order.id}
          docLabel={finalInvoice?.invoiceNumber ?? order.orderNumber}
          docTotal={finalInvoice?.grandTotal ?? netTotal}
          canRecord={canSeeMoney && !order.cancelledAt}
          onTotals={handleMoneyTotals}
          onChanged={() => api.refreshAll()}
        />

        <Separator />


        {/* Status & Dispatch — Editable */}
        <div className="glass-card p-4 md:p-6 space-y-4 md:space-y-5">
          <h2 className="text-sm font-semibold md:text-base">Status & Dispatch</h2>

          <div className="space-y-1.5">
            <Label className="text-xs md:text-sm">Payment Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentModes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setEditPaymentMode(m.value)}
                  className={`rounded-lg border px-3 py-3 text-xs font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                    editPaymentMode === m.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs md:text-sm">Delivery</Label>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize md:text-sm ${statusColors[order.deliveryStatus] || "border-border text-muted-foreground"}`}>
                {order.deliveryStatus === "pending" ? "Not sent yet" : order.deliveryStatus}
              </span>
              {order.deliveryStatus === "pending" && (
                <Button size="sm" disabled={isSaving} onClick={startDispatch}>
                  Dispatch &amp; bill
                </Button>
              )}
              {order.deliveryStatus === "dispatched" && (
                <Button size="sm" variant="outline" disabled={isSaving} onClick={handleMarkDelivered}>
                  Mark delivered
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Goods leave the warehouse only through Dispatch &amp; bill. Money received is recorded above.
            </p>
          </div>


          <div className="space-y-1.5">
            <Label className="text-xs md:text-sm">Source Warehouse *</Label>
            <Select value={editGodown} onValueChange={setEditGodown}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {godowns.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Dispatch Date</Label>
              <Input type="date" value={editDispatchDate} onChange={(e) => setEditDispatchDate(e.target.value)} className="h-11 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Vehicle</Label>
              <Input value={editVehicle} onChange={(e) => setEditVehicle(e.target.value)} placeholder="e.g. MH-01-AB-1234" className="h-11 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Driver</Label>
              <Input value={editDriver} onChange={(e) => setEditDriver(e.target.value)} placeholder="Driver name" className="h-11 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="rounded-xl border border-border bg-background/80 backdrop-blur-xl px-4 py-3 shadow-sm md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:shadow-none">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mr-auto min-w-0 flex-shrink">
              <Button
                variant="destructive"
                size="sm"
                disabled={order.deliveryStatus === "delivered"}
                onClick={() => { setDeleteTarget(order); setDeleteConfirmText(""); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{order.deliveryStatus === "delivered" ? "Cannot delete" : "Delete"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const dealer = distributors.find(d => d.id === order.distributorId);
                  const { OrderInvoicePdf } = await import("@/components/pdf/OrderInvoicePdf");
                  downloadPdf(
                    pdfFilename("invoice", order.orderNumber),
                    <OrderInvoicePdf
                      order={order}
                      companyName={companyInfo.name}
                      companyAddress={companyInfo.address}
                      gstin={companyInfo.gstin}
                      logoUrl={companyInfo.logoUrl}
                      companyPhone={companyInfo.phone}
                      companyEmail={companyInfo.email}
                      companyPan={companyInfo.pan}
                      companyStateCode={companyInfo.stateCode}
                      bankName={companyInfo.bankName}
                      bankAccountName={companyInfo.bankAccountName}
                      bankAccount={companyInfo.bankAccount}
                      bankIfsc={companyInfo.bankIfsc}
                      distributorAddress={dealer?.address}
                      distributorGstin={dealer?.gstin}
                      distributorStateCode={dealer?.stateCode}
                    />
                  );
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Invoice</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-[#128C4B] hover:text-[#128C4B]"
                onClick={() => shareOrderOnWhatsApp(order, companyInfo)}
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              {(order.deliveryStatus === "dispatched" || order.deliveryStatus === "delivered") && (
                <Button size="sm" variant="outline" onClick={() => navigate("/claims")}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Record return</span>
                </Button>
              )}
            </div>
            <Button onClick={saveOrder} disabled={isSaving} size="sm">
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Activity History */}
        <div className="glass-card p-4 md:p-6">
          <EntityHistory entityType="order" entityId={order.id} />
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">{deleteTarget?.orderNumber}</span> and restore any deducted stock. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{deleteTarget?.orderNumber}</span> to confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteTarget?.orderNumber || ""}
              className="h-11 rounded-lg font-mono"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== deleteTarget?.orderNumber || deleteLoading}
              onClick={handleDeleteOrder}
            >
              {deleteLoading ? "Deleting…" : "Delete Order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit Override */}
      <AlertDialog open={creditOverrideOpen} onOpenChange={setCreditOverrideOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Credit Limit Override</AlertDialogTitle>
            <AlertDialogDescription>
              Changing payment status will push this dealer's outstanding above their credit limit. Do you want to proceed as Super Admin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={() => { setCreditOverrideOpen(false); executeSaveOrder(); }}>Override & Save</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit limit reached while dispatching & billing */}
      <AlertDialog open={creditDispatchOpen} onOpenChange={setCreditDispatchOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>This bill crosses their credit limit</AlertDialogTitle>
            <AlertDialogDescription>
              {order?.distributorName} will owe more than the limit you set for them. You can approve it and send the goods anyway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              disabled={isSaving}
              onClick={() => { setCreditDispatchOpen(false); confirmDispatch(true); }}
            >
              {isSaving ? "Working…" : "Approve & dispatch"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>




      {/* Dispatch preview & confirm */}
      <Dialog open={dispatchPreview.open} onOpenChange={(o) => setDispatchPreview(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispatch &amp; bill this order</DialogTitle>
            <DialogDescription>
              In one step: stock leaves the chosen warehouse and the final GST bill is created. Rows in red will go below zero — dispatch is still allowed.
            </DialogDescription>
          </DialogHeader>
          {dispatchPreview.loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading stock impact…</div>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-right font-medium">Need</th>
                    <th className="px-3 py-2 text-right font-medium">In stock</th>
                    <th className="px-3 py-2 text-right font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchPreview.rows.map((r) => (
                    <tr key={r.product_id} className={cn("border-t border-border", r.will_go_negative && "bg-destructive/5")}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {r.will_go_negative && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          <span className={cn(r.will_go_negative && "text-destructive font-medium")}>{r.product_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.required_qty}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.current_qty}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.will_go_negative && "text-destructive font-medium")}>{r.after_qty}</td>
                    </tr>
                  ))}
                  {dispatchPreview.rows.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No line items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {dispatchPreview.rows.some(r => r.will_go_negative) && (
            <p className="text-xs text-destructive">
              ⚠️ One or more products will go below zero after this dispatch. Please reconcile inventory afterwards.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchPreview(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button onClick={() => confirmDispatch()} disabled={dispatchPreview.loading || dispatchPreview.rows.length === 0 || isSaving}>
              {isSaving ? "Working…" : "Dispatch & bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
