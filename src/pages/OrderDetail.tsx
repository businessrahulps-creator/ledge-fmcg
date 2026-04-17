import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, RotateCcw, PackageX, Trash2, FileText, Plus, X } from "lucide-react";
import { EntityHistory } from "@/components/layout/EntityHistory";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareOrderOnWhatsApp } from "@/utils/shareWhatsApp";
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
import { OrderInvoicePdf } from "@/components/pdf/OrderInvoicePdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, type Order, type OrderLine } from "@/data/mock-data";
import { computeOrderPricing, serializeAppliedSchemes } from "@/lib/order-pricing";
import { useApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import type { Claim, ClaimLine } from "@/context/DataContext";
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
import { formatIndianDate } from "@/utils/formatDate";

const statusColors: Record<string, string> = {
  paid: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  partial: "border-amber-500 bg-amber-500/10 text-amber-600",
  pending: "border-red-500 bg-red-500/10 text-red-600",
  dispatched: "border-blue-500 bg-blue-500/10 text-blue-600",
  delivered: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
};

const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
];

const paymentStatuses = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

const deliveryStatuses = [
  { value: "pending", label: "Pending" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

interface EditLineState {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  quantityStr: string;
  unitPrice: number;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const { userRole } = useAuth();
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
  const [editPayment, setEditPayment] = useState("");
  const [editDelivery, setEditDelivery] = useState("");
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

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimType, setClaimType] = useState<"return" | "damage">("return");
  const [claimReason, setClaimReason] = useState("");
  const [claimQuantities, setClaimQuantities] = useState<Record<number, number>>({});
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const order = orders.find(o => o.id === id);

  const prevOrderId = useRef<string | undefined>();

  // Sync status/dispatch fields when they change
  useEffect(() => {
    if (order) {
      setEditPaymentMode(order.paymentMode);
      setEditPayment(order.paymentStatus);
      setEditDelivery(order.deliveryStatus);
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
        quantityStr: String(l.quantity),
        unitPrice: l.unitPrice,
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  const orderDocs = invoices.filter(inv => inv.sourceOrderId === id);

  // Line editing helpers
  const addLine = () => {
    setEditLines(prev => [...prev, { id: crypto.randomUUID(), productId: "", productName: "", quantity: 1, quantityStr: "1", unitPrice: 0 }]);
  };

  const removeLine = (lineId: string) => {
    if (editLines.length <= 1) return;
    setEditLines(prev => prev.filter(l => l.id !== lineId));
  };

  const updateLine = (lineId: string, field: keyof EditLineState, value: string | number) => {
    setEditLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      if (field === "quantity") {
        const raw = String(value).replace(/[^0-9]/g, "");
        const num = raw === "" ? 0 : parseInt(raw, 10);
        return { ...l, quantity: num, quantityStr: raw };
      }
      const updated = { ...l, [field]: value };
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

  const handleQuantityBlur = (lineId: string) => {
    setEditLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      return { ...l, quantityStr: String(l.quantity || 0) };
    }));
  };

  const editTotal = editLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  // Scheme auto-apply (centralized pricing engine)
  const pricing = useMemo(
    () => computeOrderPricing(editLines, allSchemes, editDealerId),
    [allSchemes, editDealerId, editLines],
  );
  const appliedSchemes = pricing.appliedSchemes;
  const totalSchemeSavings = pricing.totalSchemeSavings;

  const executeSaveOrder = async () => {
    if (!order) return;
    if ((editDelivery === "dispatched" || editDelivery === "delivered") && !editGodown) {
      toast.error("Warehouse required", { description: "Please select a source warehouse for dispatch." });
      return;
    }

    const validLines = editLines.filter(l => l.productId && l.quantity > 0);
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

    const newLines: OrderLine[] = validLines.map(l => ({
      productId: l.productId,
      productName: l.productName || products.find(p => p.id === l.productId)?.name || "",
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.quantity * l.unitPrice,
    }));

    const newTotal = newLines.reduce((sum, l) => sum + l.lineTotal, 0);

    await updateOrder(order.id, {
      paymentMode: editPaymentMode as Order["paymentMode"],
      paymentStatus: editPayment as Order["paymentStatus"],
      deliveryStatus: editDelivery as Order["deliveryStatus"],
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

  const saveOrder = () => {
    if (!order) return;
    const dealer = distributors.find(d => d.id === editDealerId);
    if (!dealer || dealer.creditLimit <= 0) { executeSaveOrder(); return; }
    const wasUnpaid = order.paymentStatus === "pending" || order.paymentStatus === "partial";
    const willBeUnpaid = editPayment === "pending" || editPayment === "partial";
    if (willBeUnpaid) {
      const currentContribution = wasUnpaid ? order.total : 0;
      const newTotal = editLines.filter(l => l.productId && l.quantity > 0).reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const projected = dealer.outstandingAmount - currentContribution + newTotal;
      if (projected > dealer.creditLimit) {
        if (userRole === "super_admin") {
          setCreditOverrideOpen(true);
          return;
        }
        toast.error("Credit limit exceeded", {
          description: `${dealer.name}'s outstanding would exceed their credit limit. Contact a Super Admin.`,
        });
        return;
      }
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

  const openClaimModal = useCallback(() => {
    if (!order) return;
    const qtys: Record<number, number> = {};
    order.lines.forEach((_, i) => { qtys[i] = order.lines[i].quantity; });
    setClaimQuantities(qtys);
    setClaimType("return");
    setClaimReason("");
    setClaimModalOpen(true);
  }, [order]);

  const handleSubmitClaim = useCallback(async () => {
    if (!order) return;
    setClaimSubmitting(true);
    const claimLines: ClaimLine[] = order.lines
      .map((line, i) => ({
        productId: line.productId,
        productName: line.productName,
        quantity: claimQuantities[i] || 0,
        unitPrice: line.unitPrice,
        lineTotal: (claimQuantities[i] || 0) * line.unitPrice,
      }))
      .filter(l => l.quantity > 0);

    if (claimLines.length === 0) {
      toast.error("Select at least one product with quantity > 0");
      setClaimSubmitting(false);
      return;
    }

    const totalClaimValue = claimLines.reduce((s, l) => s + l.lineTotal, 0);
    const claim: Claim = {
      id: "",
      orderId: order.id,
      orderNumber: order.orderNumber,
      distributorId: order.distributorId,
      distributorName: order.distributorName,
      claimType,
      status: "open",
      reason: claimReason,
      resolutionNotes: "",
      restoreStock: claimType === "return",
      totalClaimValue,
      lines: claimLines,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    const ok = await api.claims.create(claim);
    setClaimSubmitting(false);
    if (ok) {
      toast.success(claimType === "return" ? "Return recorded — stock restored" : "Damage claim recorded", {
        description: `${formatCurrency(totalClaimValue)} claim for ${order.orderNumber}`,
      });
      setClaimModalOpen(false);
    }
  }, [order, claimQuantities, claimType, claimReason, api.claims]);

  if (!order) {
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

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6 pb-4 md:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">{order.orderNumber}</h1>
              <p className="text-xs text-muted-foreground md:text-sm">{formatIndianDate(order.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-13 sm:ml-0">
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={order.deliveryStatus} />
          </div>
        </div>

        {/* Editable Dealer & Salesperson */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          <div className="glass-card p-3 md:p-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dealer</Label>
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
            <Label className="text-xs text-muted-foreground">Sales Person</Label>
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

        {/* Total & Payment Mode summary */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="glass-card p-3 md:p-4">
            <span className="text-xs text-muted-foreground">{totalSchemeSavings > 0 ? "Effective Total" : "Total"}</span>
            {totalSchemeSavings > 0 && (
              <p className="mt-0.5 text-[10px] text-muted-foreground line-through">{formatCurrency(editTotal)}</p>
            )}
            <p className="text-sm font-semibold md:text-base">{formatCurrency(editTotal - totalSchemeSavings)}</p>
          </div>
          <div className="glass-card p-3 md:p-4">
            <span className="text-xs text-muted-foreground">Payment Mode</span>
            <p className="mt-0.5 text-sm font-medium md:text-base capitalize">{editPaymentMode.replace("_", " ")}</p>
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
              <div key={line.id} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
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
                <div className="w-20">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={line.quantityStr}
                    onChange={e => updateLine(line.id, "quantity", e.target.value)}
                    onBlur={() => handleQuantityBlur(line.id)}
                    placeholder="Qty"
                    className="h-9 text-xs text-right"
                  />
                </div>
                <div className="w-24 text-right">
                  <Input
                    type="number"
                    value={line.unitPrice}
                    onChange={e => updateLine(line.id, "unitPrice", Number(e.target.value))}
                    placeholder="Price"
                    className="h-9 text-xs text-right"
                  />
                </div>
                <div className="w-20 flex items-center justify-end gap-1">
                  <span className="text-xs font-medium">{formatCurrency(line.quantity * line.unitPrice)}</span>
                  {editLines.length > 1 && (
                    <button onClick={() => removeLine(line.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
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
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Schemes Applied</span>
            </div>
            <div className="space-y-1.5">
              {appliedSchemes.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">{a.scheme.name}</span>
                    {a.label && <span className="text-emerald-600/70 dark:text-emerald-400/70 ml-1">({a.label})</span>}
                  </div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">-{formatCurrency(a.savings)}</span>
                </div>
              ))}
            </div>
            {totalSchemeSavings > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-700 dark:text-emerald-300">Total Savings</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">-{formatCurrency(totalSchemeSavings)}</span>
              </div>
            )}
          </div>
        )}

        {/* Billing Documents */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold md:text-base">Documents</h2>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => navigate(`/billing?order=${order.id}`)}
            >
              <FileText className="h-3.5 w-3.5" />
              Generate Invoice
            </Button>
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
                          doc.status === "final" ? "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
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
            <Label className="text-xs md:text-sm">Payment Status</Label>
            <div className="flex gap-2">
              {paymentStatuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setEditPayment(s.value)}
                  className={`flex-1 rounded-lg border px-3 py-3 text-xs font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                    editPayment === s.value
                      ? statusColors[s.value] || "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs md:text-sm">Delivery Status</Label>
            <div className="flex gap-2">
              {deliveryStatuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setEditDelivery(s.value)}
                  className={`flex-1 rounded-lg border px-3 py-3 text-xs font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                    editDelivery === s.value
                      ? statusColors[s.value] || "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs md:text-sm">Source Warehouse {(editDelivery === "dispatched" || editDelivery === "delivered") ? "*" : ""}</Label>
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
                onClick={() => {
                  const dealer = distributors.find(d => d.id === order.distributorId);
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
                className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
                onClick={() => shareOrderOnWhatsApp(order, companyInfo)}
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              {(order.deliveryStatus === "dispatched" || order.deliveryStatus === "delivered") && (
                <Button size="sm" variant="outline" onClick={openClaimModal}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Return / Claim</span>
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

      {/* Claim / Return Modal */}
      <Dialog open={claimModalOpen} onOpenChange={setClaimModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Record Return / Claim</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {order.orderNumber} · {order.distributorName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">What happened?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setClaimType("return")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
                    claimType === "return" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Goods Returned</div>
                    <div className="text-[10px] opacity-70">Stock will be restored</div>
                  </div>
                </button>
                <button
                  onClick={() => setClaimType("damage")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
                    claimType === "damage" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  <PackageX className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Damaged / Claim Only</div>
                    <div className="text-[10px] opacity-70">No stock change</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Select products & quantities to claim</Label>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-right font-medium">Ordered</th>
                      <th className="px-3 py-2 text-right font-medium">Claim Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lines.map((line, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-3 py-2 font-medium">{line.productName}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{line.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={line.quantity}
                            value={claimQuantities[i] ?? 0}
                            onChange={e => setClaimQuantities(prev => ({ ...prev, [i]: Math.min(line.quantity, Math.max(0, parseInt(e.target.value) || 0)) }))}
                            className="h-8 w-16 text-right text-xs ml-auto"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reason</Label>
              <Input value={claimReason} onChange={e => setClaimReason(e.target.value)} placeholder="e.g. Damaged packaging, wrong items, expired goods…" className="h-10" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setClaimModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitClaim} disabled={claimSubmitting}>
              {claimSubmitting ? "Submitting…" : claimType === "return" ? "Record Return & Restore Stock" : "Record Damage Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
