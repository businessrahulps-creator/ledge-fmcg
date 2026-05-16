import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2, AlertTriangle, Gift } from "lucide-react";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/data/mock-data";
import { computeOrderPricing, serializeAppliedSchemes } from "@/lib/order-pricing";
import { useApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { trackFirstOrderCreated } from "@/hooks/use-install-prompt";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface OrderLineState {
  id: string;
  productId: string;
  quantity: number | null;
  unitPrice: number;
}

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

const statusColors: Record<string, string> = {
  paid: "border-success/40 bg-success/10 text-success",
  partial: "border-warning/40 bg-warning/10 text-warning",
  pending: "border-destructive/40 bg-destructive/10 text-destructive",
  dispatched: "border-primary/30 bg-primary/10 text-primary",
  delivered: "border-success/40 bg-success/10 text-success",
};

export default function NewOrder() {
  const navigate = useNavigate();
  const api = useApi();
  const products = api.products.list();
  const distributors = api.dealers.list();
  const salespersons = api.salespersons.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const allSchemes = api.schemes.list();
  const addOrder = api.orders.create;
  const existingOrders = api.orders.list();
  const { addNotification } = useNotifications();
  const { userRole } = useAuth();
  const [creditOverrideOpen, setCreditOverrideOpen] = useState(false);

  const firstProductRef = useRef<HTMLButtonElement>(null);

  const [lines, setLines] = useState<OrderLineState[]>([
    { id: crypto.randomUUID(), productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [deliveryStatus, setDeliveryStatus] = useState("pending");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGodown, setSelectedGodown] = useState("");
  const [attemptedSave, setAttemptedSave] = useState(false);

  // Refs for scroll-to-first-error
  const dealerFieldRef = useRef<HTMLDivElement>(null);
  const salespersonFieldRef = useRef<HTMLDivElement>(null);
  const warehouseFieldRef = useRef<HTMLDivElement>(null);
  const dispatchDateFieldRef = useRef<HTMLDivElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  // Controlled form fields
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [driverName, setDriverName] = useState("");
  const [remarks, setRemarks] = useState("");

  // Warn on tab close while form is dirty (in-app nav not blocked by design).
  const isDirty = selectedDealer !== "" || lines.some(l => l.productId !== "");
  useUnsavedChangesGuard(isDirty && !isSaving);


  // Auto-select godown if only one exists
  useEffect(() => {
    if (godowns.length === 1 && !selectedGodown) {
      setSelectedGodown(godowns[0].id);
    }
  }, [godowns, selectedGodown]);

  // Auto-focus first product select when dealer is chosen
  useEffect(() => {
    if (selectedDealer) {
      setTimeout(() => firstProductRef.current?.focus(), 100);
    }
  }, [selectedDealer]);


  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof OrderLineState, value: string | number | null) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "quantity") {
          return { ...l, quantity: value as number | null };
        }
        const updated = { ...l, [field]: value } as OrderLineState;
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) updated.unitPrice = product.basePrice;
        }
        return updated;
      })
    );
  };

  const getLineTotal = (line: OrderLineState) => (line.quantity ?? 0) * line.unitPrice;
  const orderTotal = lines.reduce((sum, l) => sum + getLineTotal(l), 0);

  const selectedDealerObj = distributors.find(d => d.id === selectedDealer);
  const isUnpaidOrder = paymentStatus === "pending" || paymentStatus === "partial";
  const isSuperAdmin = userRole === "super_admin";

  // --- Scheme auto-apply (centralized pricing engine) ---
  const pricing = useMemo(
    () => computeOrderPricing(lines, allSchemes, selectedDealer),
    [allSchemes, selectedDealer, lines],
  );
  const appliedSchemes = pricing.appliedSchemes;
  const totalSchemeSavings = pricing.totalSchemeSavings;

  // Credit guard (uses net total after scheme savings)
  const netOrderTotal = Math.max(0, orderTotal - totalSchemeSavings);
  const projectedOutstanding = (selectedDealerObj?.outstandingAmount || 0) + (isUnpaidOrder ? netOrderTotal : 0);
  const creditLimit = selectedDealerObj?.creditLimit || 0;
  const exceedsCreditLimit = creditLimit > 0 && projectedOutstanding > creditLimit;

  // --- Derived validation state (used for inline errors) ---
  const validLines = lines.filter((l) => l.productId && (l.quantity ?? 0) > 0);
  const dispatchDateRequired = deliveryStatus === "dispatched" || deliveryStatus === "delivered";
  const errors = {
    dealer: !selectedDealer,
    salesperson: !selectedSalesperson,
    products: validLines.length === 0,
    invalidPriceLine: validLines.find((l) => l.unitPrice <= 0),
    warehouse: !selectedGodown,
    dispatchDate: dispatchDateRequired && !dispatchDate,
  };

  // Stock availability per line (warning only, not blocking)
  const stockItems = api.stock.items.list();
  const selectedGodownObj = godowns.find(g => g.id === selectedGodown);
  const stockWarnings = useMemo(() => {
    if (!selectedGodown) return new Map<string, string>();
    const warnings = new Map<string, string>();
    for (const line of lines) {
      const qty = line.quantity ?? 0;
      if (!line.productId || qty <= 0) continue;
      const stock = stockItems.find(
        s => s.productId === line.productId && s.godownId === selectedGodown,
      );
      const available = stock?.quantity ?? 0;
      if (qty > available) {
        warnings.set(
          line.id,
          `Only ${available} ${stock?.unit || "units"} available at ${selectedGodownObj?.name ?? "this warehouse"}`,
        );
      }
    }
    return warnings;
  }, [lines, stockItems, selectedGodown, selectedGodownObj?.name]);

  const scrollToFirstError = () => {
    let target: HTMLElement | null = null;
    if (errors.dealer) target = dealerFieldRef.current;
    else if (errors.salesperson) target = salespersonFieldRef.current;
    else if (errors.products || errors.invalidPriceLine) target = productsSectionRef.current;
    else if (errors.warehouse) target = warehouseFieldRef.current;
    else if (errors.dispatchDate) target = dispatchDateFieldRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const executeSave = async () => {
    setAttemptedSave(true);

    // Validation
    if (errors.dealer) {
      toast.error("Dealer required", { description: "Please select a dealer for this order." });
      scrollToFirstError();
      return;
    }

    if (errors.salesperson) {
      toast.error("Sales person required", { description: "Please select a sales person for this order." });
      scrollToFirstError();
      return;
    }

    if (errors.products) {
      toast.error("Products required", { description: "Add at least one product with quantity > 0." });
      scrollToFirstError();
      return;
    }

    // Guard against zero/negative unit prices — prevents accidental ₹0 invoices
    if (errors.invalidPriceLine) {
      const product = products.find((p) => p.id === errors.invalidPriceLine!.productId);
      toast.error("Invalid price", {
        description: `${product?.name || "A product"} has a price of ₹${errors.invalidPriceLine.unitPrice}. Set a price greater than 0.`,
      });
      scrollToFirstError();
      return;
    }

    // Warehouse is now ALWAYS required (not just for dispatched/delivered)
    if (errors.warehouse) {
      toast.error("Warehouse required", { description: "Please select a source warehouse for this order." });
      scrollToFirstError();
      return;
    }

    // Dispatch date required when delivery status is dispatched or delivered
    if (errors.dispatchDate) {
      toast.error("Dispatch date required", { description: "Please select a dispatch date for dispatched/delivered orders." });
      scrollToFirstError();
      return;
    }

    setIsSaving(true);

    const dealer = distributors.find((d) => d.id === selectedDealer);
    const sp = salespersons.find((s) => s.id === selectedSalesperson);

    const order = {
      id: `o${Date.now()}`,
      orderNumber: "", // Will be set by addOrder via RPC
      date: orderDate,
      distributorId: selectedDealer,
      distributorName: dealer?.name || "",
      salespersonId: selectedSalesperson,
      salesperson: sp?.name || "",
      lines: validLines.map((l) => {
        const product = products.find((p) => p.id === l.productId);
        const qty = l.quantity ?? 0;
        return {
          productId: l.productId,
          productName: product?.name || "",
          quantity: qty,
          unitPrice: l.unitPrice,
          lineTotal: qty * l.unitPrice,
        };
      }),
      total: validLines.reduce((sum, l) => sum + (l.quantity ?? 0) * l.unitPrice, 0),
      paymentMode: paymentMode as "cash" | "bank_transfer" | "cheque" | "upi",
      paymentStatus: paymentStatus as "paid" | "partial" | "pending",
      dispatchDate: dispatchDate || null,
      vehicle,
      driverName,
      deliveryStatus: deliveryStatus as "pending" | "dispatched" | "delivered",
      dispatchRemarks: remarks,
      godownId: selectedGodown || undefined,
      schemeSavings: totalSchemeSavings,
      appliedSchemes: serializeAppliedSchemes(appliedSchemes),
    };

    const isFirstEverOrder = existingOrders.length === 0;
    const result = await addOrder(order);
    setIsSaving(false);

    if (result.success) {
      trackFirstOrderCreated();
      addNotification("order_placed", "New Order Created", `${result.orderNumber} for ${dealer?.name} — ${formatCurrency(netOrderTotal)}`);

      if (isFirstEverOrder) {
        // Milestone: first order ever in this workspace
        try {
          const fire = (originX: number) =>
            confetti({
              particleCount: 60,
              spread: 70,
              ticks: 200,
              gravity: 0.9,
              startVelocity: 45,
              origin: { x: originX, y: 0.7 },
              // Ledge brand-moment palette: purple → coral gradient
              colors: ["#7C3AED", "#9D5BF5", "#C46FB6", "#FF8A3D", "#FFA800"],
            });
          fire(0.3);
          setTimeout(() => fire(0.7), 180);
        } catch {
          // canvas-confetti failure must never block navigation
        }
        toast.success("Your first order is in! 🎉", {
          description: `#${result.orderNumber} for ${dealer?.name} — ${formatCurrency(netOrderTotal)}`,
          duration: 4500,
        });
        setTimeout(() => navigate("/orders"), 1800);
      } else {
        toast.success(`Order #${result.orderNumber} created successfully!`);
        setTimeout(() => navigate("/orders"), 800);
      }
    }
    // If !result.success, toast was already shown by DataContext
  };

  const handleSave = () => {
    setAttemptedSave(true);

    // Run base validation first so missing fields are surfaced before the credit-limit gate
    const hasBlockingError =
      errors.dealer || errors.salesperson || errors.products ||
      !!errors.invalidPriceLine || errors.warehouse || errors.dispatchDate;
    if (hasBlockingError) {
      executeSave();
      return;
    }

    if (exceedsCreditLimit) {
      if (isSuperAdmin) {
        setCreditOverrideOpen(true);
        return;
      }
      toast.error("Credit limit exceeded", {
        description: `${selectedDealerObj?.name}'s outstanding (${formatCurrency(projectedOutstanding)}) would exceed their credit limit (${formatCurrency(creditLimit)}). Contact a Super Admin to override.`,
      });
      return;
    }
    executeSave();
  };

  return (
    <>
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="h1-display">New Order</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Create a new sales order
            </p>
          </div>
          <div className="glass-card px-3 py-1.5 rounded-lg shrink-0">
            <span className="text-xs text-muted-foreground font-mono">
              {api.orders.previewNumber()}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            {/* Order Header */}
            <section className="glass-card p-4 md:p-6">
              <h2 className="mb-3 text-sm font-semibold md:mb-4 md:text-base">Order Details</h2>
              <div className="grid gap-3 md:grid-cols-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Order Date</Label>
                  <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} min={new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0]} max={new Date().toISOString().split("T")[0]} className="h-10 rounded-lg md:h-12" />
                </div>
                <div ref={dealerFieldRef} className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dealer *</Label>
                   <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                     <SelectTrigger className={`h-10 rounded-lg md:h-12 ${attemptedSave && errors.dealer ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Select dealer" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attemptedSave && errors.dealer && (
                    <p className="text-xs text-destructive">Please select a dealer.</p>
                  )}
                </div>
                <div ref={salespersonFieldRef} className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Sales Person *</Label>
                  <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                    <SelectTrigger className={`h-10 rounded-lg md:h-12 ${attemptedSave && errors.salesperson ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      {salespersons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attemptedSave && errors.salesperson && (
                    <p className="text-xs text-destructive">Please select a sales person.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Credit Limit Warning */}
            {selectedDealer && exceedsCreditLimit && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Credit limit will be exceeded</p>
                  <p className="mt-0.5">
                    {selectedDealerObj?.name}'s projected outstanding: {formatCurrency(projectedOutstanding)} / Limit: {formatCurrency(creditLimit)}
                    {isSuperAdmin && " — You can override as Super Admin."}
                  </p>
                </div>
              </div>
            )}

            {/* Order Lines */}
            <section ref={productsSectionRef} className="glass-card p-4 md:p-6">
              <div className="mb-3 flex items-center justify-between md:mb-4">
                <h2 className="text-sm font-semibold md:text-base">Products</h2>
                <Button variant="ghost" size="sm" onClick={addLine} className="h-9">
                  <Plus className="h-4 w-4" />
                  Add product
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {lines.map((line) => (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="rounded-lg border border-border/50 bg-muted/20 p-3 md:p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
                        <div className="space-y-1 sm:col-span-4">
                          <Label className="text-xs text-muted-foreground">Product</Label>
                          <Select
                            value={line.productId}
                            onValueChange={(v) => updateLine(line.id, "productId", v)}
                          >
                            <SelectTrigger ref={line === lines[0] ? firstProductRef : undefined} className="h-10 rounded-lg md:h-12">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products
                                .filter((p) => p.id === line.productId || !lines.some((l) => l.id !== line.id && l.productId === p.id))
                                .map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:col-span-7 sm:grid-cols-3 sm:gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Qty</Label>
                            <NumberInput
                              allowEmpty
                              min={1}
                              value={line.quantity}
                              onValueChange={(v) => updateLine(line.id, "quantity", v)}
                              className="h-10 rounded-lg md:h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                            <NumberInput
                              allowDecimal
                              allowEmpty={false}
                              min={0}
                              value={line.unitPrice}
                              onValueChange={(v) => updateLine(line.id, "unitPrice", v ?? 0)}
                              className="h-10 rounded-lg md:h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Total</Label>
                            <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-xs font-medium md:h-12 md:text-sm">
                              {formatCurrency(getLineTotal(line))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end sm:col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {stockWarnings.has(line.id) && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{stockWarnings.get(line.id)}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {attemptedSave && errors.products && (
                <p className="mt-2 text-xs text-destructive">Add at least one product with quantity greater than 0.</p>
              )}

              <div className="mt-4 flex justify-end border-t border-border pt-3 md:mt-6 md:pt-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground md:text-sm">Order Total</span>
                  <p className="text-lg font-bold md:text-xl">{formatCurrency(orderTotal)}</p>
                </div>
              </div>
            </section>

            {/* Dispatch Details */}
            <section className="glass-card p-4 md:p-6">
              <h2 className="mb-3 text-sm font-semibold md:mb-4 md:text-base">Dispatch Details</h2>
              <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
                <div ref={warehouseFieldRef} className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Source Warehouse *</Label>
                  <Select value={selectedGodown} onValueChange={setSelectedGodown}>
                    <SelectTrigger className={`h-10 rounded-lg md:h-12 ${attemptedSave && errors.warehouse ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {godowns.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attemptedSave && errors.warehouse && (
                    <p className="text-xs text-destructive">Warehouse is required for every order.</p>
                  )}
                </div>
                <div ref={dispatchDateFieldRef} className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dispatch Date {dispatchDateRequired ? "*" : ""}</Label>
                  <Input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className={`h-10 rounded-lg md:h-12 ${attemptedSave && errors.dispatchDate ? "border-destructive" : ""}`}
                  />
                  {attemptedSave && errors.dispatchDate && (
                    <p className="text-xs text-destructive">Dispatch date is required when delivery is set to Dispatched or Delivered.</p>
                  )}
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Vehicle / Transporter</Label>
                  <Input placeholder="e.g. MH-01-AB-1234" value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="h-10 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Driver Name</Label>
                  <Input placeholder="Optional" value={driverName} onChange={(e) => setDriverName(e.target.value)} className="h-10 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Delivery Status</Label>
                  <div className="flex gap-2">
                    {deliveryStatuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setDeliveryStatus(s.value)}
                        className={`flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-all md:px-3 md:py-3 md:text-sm ${
                          deliveryStatus === s.value
                            ? statusColors[s.value] || "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-foreground/20"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 md:mt-4 md:space-y-2">
                <Label className="text-xs md:text-sm">Dispatch Remarks</Label>
                <Textarea placeholder="Any additional notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} className="min-h-[80px] rounded-lg" />
              </div>
            </section>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-4 pb-32 md:space-y-6 md:pb-0">
            {/* Payment */}
            <section className="glass-card p-4 md:p-6">
              <h2 className="mb-3 text-sm font-semibold md:mb-4 md:text-base">Payment</h2>
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Payment Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentModes.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMode(m.value)}
                        className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all md:px-3 md:py-3 md:text-sm ${
                          paymentMode === m.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-foreground/20"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Payment Status</Label>
                  <div className="flex gap-2">
                    {paymentStatuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setPaymentStatus(s.value)}
                        className={`flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-all md:px-3 md:py-3 md:text-sm ${
                          paymentStatus === s.value
                            ? statusColors[s.value] || "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-foreground/20"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className="glass-card p-4 md:p-6">
              <h2 className="mb-3 text-sm font-semibold md:mb-4 md:text-base">Summary</h2>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lines.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Total Qty</span>
                  <span>{lines.reduce((s, l) => s + (l.quantity ?? 0), 0)}</span>
                </div>
                <div className="border-t border-border pt-2 md:pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium md:text-sm">{appliedSchemes.length > 0 ? "Gross Total" : "Order Total"}</span>
                    <span className="text-base font-bold md:text-lg">{formatCurrency(orderTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Schemes Applied */}
            {appliedSchemes.length > 0 && (
              <section className="rounded-md border border-success/30 bg-success/5 p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Gift className="h-4 w-4 text-success" />
                  <h2 className="text-sm font-semibold text-success">
                    Schemes Applied
                  </h2>
                </div>
                <div className="space-y-2">
                  {appliedSchemes.map(({ scheme, savings, label }) => (
                    <div key={scheme.id} className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-success truncate">{scheme.name}</p>
                        <p className="text-success/70">{label}</p>
                      </div>
                      <span className="font-semibold text-success shrink-0 ml-2">
                        -{formatCurrency(savings)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 border-t border-success/20 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-success">Total Savings</span>
                    <span className="text-sm font-bold text-success">
                      -{formatCurrency(totalSchemeSavings)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-success/70">Effective Total</span>
                    <span className="text-sm font-bold text-success">
                      {formatCurrency(Math.max(0, orderTotal - totalSchemeSavings))}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Save button */}
            <div className="pt-2 pb-4 md:pb-0">
              <Button
                className="w-full shadow-lg md:shadow-none"
                size="lg"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Order</>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>

    {/* Credit Override Confirmation (Super Admin only) */}
    <AlertDialog open={creditOverrideOpen} onOpenChange={setCreditOverrideOpen}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Credit Limit Override</AlertDialogTitle>
          <AlertDialogDescription>
            This order will push {selectedDealerObj?.name}'s outstanding to {formatCurrency(projectedOutstanding)}, exceeding their credit limit of {formatCurrency(creditLimit)}. Do you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setCreditOverrideOpen(false); executeSave(); }}>
            Override & Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  </>
  );
}
