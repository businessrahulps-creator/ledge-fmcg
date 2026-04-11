import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/data/mock-data";
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
import { trackFirstOrderCreated } from "@/hooks/use-install-prompt";

interface OrderLineState {
  id: string;
  productId: string;
  quantity: number;
  quantityStr: string;
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
  paid: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  partial: "border-amber-500 bg-amber-500/10 text-amber-600",
  pending: "border-red-500 bg-red-500/10 text-red-600",
  dispatched: "border-blue-500 bg-blue-500/10 text-blue-600",
  delivered: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
};

export default function NewOrder() {
  const navigate = useNavigate();
  const api = useApi();
  const products = api.products.list();
  const distributors = api.dealers.list();
  const salespersons = api.salespersons.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const addOrder = api.orders.create;
  const { addNotification } = useNotifications();

  const firstProductRef = useRef<HTMLButtonElement>(null);

  const [lines, setLines] = useState<OrderLineState[]>([
    { id: crypto.randomUUID(), productId: "", quantity: 1, quantityStr: "1", unitPrice: 0 },
  ]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [deliveryStatus, setDeliveryStatus] = useState("pending");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGodown, setSelectedGodown] = useState("");

  // Controlled form fields
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [driverName, setDriverName] = useState("");
  const [remarks, setRemarks] = useState("");

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
      { id: crypto.randomUUID(), productId: "", quantity: 1, quantityStr: "1", unitPrice: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof OrderLineState, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "quantity") {
          const raw = String(value).replace(/[^0-9]/g, "");
          const num = raw === "" ? 0 : parseInt(raw, 10);
          return { ...l, quantity: num, quantityStr: raw };
        }
        const updated = { ...l, [field]: value };
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) updated.unitPrice = product.basePrice;
        }
        return updated;
      })
    );
  };

  const handleQuantityBlur = (id: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const qty = l.quantity || 0;
        return { ...l, quantity: qty, quantityStr: String(qty) };
      })
    );
  };

  const getLineTotal = (line: OrderLineState) => line.quantity * line.unitPrice;
  const orderTotal = lines.reduce((sum, l) => sum + getLineTotal(l), 0);

  const handleSave = async () => {
    // Validation
    if (!selectedDealer) {
      toast.error("Dealer required", { description: "Please select a dealer for this order." });
      return;
    }

    if (!selectedSalesperson) {
      toast.error("Sales person required", { description: "Please select a sales person for this order." });
      return;
    }

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Products required", { description: "Add at least one product with quantity > 0." });
      return;
    }

    // Require godown if dispatching/delivering
    if ((deliveryStatus === "dispatched" || deliveryStatus === "delivered") && !selectedGodown) {
      toast.error("Warehouse required", { description: "Please select a source warehouse for dispatch." });
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
        return {
          productId: l.productId,
          productName: product?.name || "",
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.quantity * l.unitPrice,
        };
      }),
      total: validLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
      paymentMode: paymentMode as "cash" | "bank_transfer" | "cheque" | "upi",
      paymentStatus: paymentStatus as "paid" | "partial" | "pending",
      dispatchDate: dispatchDate || null,
      vehicle,
      driverName,
      deliveryStatus: deliveryStatus as "pending" | "dispatched" | "delivered",
      dispatchRemarks: remarks,
      godownId: selectedGodown || undefined,
    };

    const result = await addOrder(order);
    setIsSaving(false);

    if (result.success) {
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors });
      }, 300);
      setTimeout(() => {
        confetti({ particleCount: 50, spread: 90, origin: { y: 0.5 }, colors });
      }, 700);

      trackFirstOrderCreated();
      addNotification("order_placed", "New Order Created", `${result.orderNumber} for ${dealer?.name} has been placed.`);
      toast.success(`Order #${result.orderNumber} created successfully!`);

      setTimeout(() => navigate("/orders"), 2000);
    }
    // If !result.success, toast was already shown by DataContext
  };

  return (
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
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">New Order</h1>
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
              <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Order Date</Label>
                  <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="h-10 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dealer *</Label>
                   <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                     <SelectTrigger className="h-10 rounded-lg md:h-12">
                      <SelectValue placeholder="Select dealer" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Sales Person *</Label>
                  <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                    <SelectTrigger className="h-10 rounded-lg md:h-12">
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      {salespersons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Order Lines */}
            <section className="glass-card p-4 md:p-6">
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
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
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
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:col-span-7 sm:grid-cols-3 sm:gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Qty</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={line.quantityStr}
                              onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                              onBlur={() => handleQuantityBlur(line.id)}
                              className="h-10 rounded-lg md:h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                            <Input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-10 rounded-lg md:h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Total</Label>
                            <div className="flex h-11 items-center rounded-lg border border-border bg-muted/30 px-3 text-xs font-medium md:h-12 md:text-sm">
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

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
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Source Warehouse {(deliveryStatus === "dispatched" || deliveryStatus === "delivered") ? "*" : ""}</Label>
                  <Select value={selectedGodown} onValueChange={setSelectedGodown}>
                    <SelectTrigger className="h-10 rounded-lg md:h-12">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {godowns.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dispatch Date</Label>
                  <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} className="h-10 rounded-lg md:h-12" />
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
          <div className="space-y-4 pb-28 md:space-y-6 md:pb-0">
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
                  <span>{lines.reduce((s, l) => s + l.quantity, 0)}</span>
                </div>
                <div className="border-t border-border pt-2 md:pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium md:text-sm">Order Total</span>
                    <span className="text-base font-bold md:text-lg">{formatCurrency(orderTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Save button */}
            <div className="sticky bottom-24 z-10 md:static">
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
  );
}
