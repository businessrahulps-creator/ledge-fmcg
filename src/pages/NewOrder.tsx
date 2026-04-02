import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Save, CheckCircle2, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { products, distributors, salespersons, formatCurrency } from "@/data/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface OrderLineState {
  id: string;
  productId: string;
  quantity: number;
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

let lineCounter = 0;

export default function NewOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lines, setLines] = useState<OrderLineState[]>([
    { id: `line-${lineCounter++}`, productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [deliveryStatus, setDeliveryStatus] = useState("pending");

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: `line-${lineCounter++}`, productId: "", quantity: 1, unitPrice: 0 },
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
        const updated = { ...l, [field]: value };
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) updated.unitPrice = product.basePrice;
        }
        return updated;
      })
    );
  };

  const getLineTotal = (line: OrderLineState) => line.quantity * line.unitPrice;
  const orderTotal = lines.reduce((sum, l) => sum + getLineTotal(l), 0);

  const handleSave = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
    });
    toast({
      title: "Order saved ✓",
      description: "Your order has been created successfully.",
    });
    setTimeout(() => navigate("/orders"), 1500);
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
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">New Order</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Create a new sales order
            </p>
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
                  <Input type="date" defaultValue="2026-03-31" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dealer</Label>
                  <Select>
                    <SelectTrigger className="h-11 rounded-lg md:h-12">
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
                  <Label className="text-xs md:text-sm">Sales Person</Label>
                  <Select>
                    <SelectTrigger className="h-11 rounded-lg md:h-12">
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
                          <Label className="text-[10px] text-muted-foreground md:text-xs">Product</Label>
                          <Select
                            value={line.productId}
                            onValueChange={(v) => updateLine(line.id, "productId", v)}
                          >
                            <SelectTrigger className="h-11 rounded-lg md:h-12">
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
                            <Label className="text-[10px] text-muted-foreground md:text-xs">Qty</Label>
                            <Input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) => updateLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                              className="h-11 rounded-lg md:h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground md:text-xs">Price (₹)</Label>
                            <Input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-11 rounded-lg md:h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground md:text-xs">Total</Label>
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
                  <Label className="text-xs md:text-sm">Dispatch Date</Label>
                  <Input type="date" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Vehicle / Transporter</Label>
                  <Input placeholder="e.g. MH-01-AB-1234" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Driver Name</Label>
                  <Input placeholder="Optional" className="h-11 rounded-lg md:h-12" />
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
                            ? "border-primary bg-primary/10 text-primary"
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
                <Textarea placeholder="Any additional notes..." className="min-h-[80px] rounded-lg" />
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
                            ? "border-primary bg-primary/10 text-primary"
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

            {/* Save button - sticky on mobile */}
            <div className="sticky bottom-24 z-10 md:static">
              <Button className="w-full shadow-lg md:shadow-none" size="lg" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Save Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
