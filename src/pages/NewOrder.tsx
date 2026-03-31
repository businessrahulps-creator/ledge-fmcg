import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
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
    toast({
      title: "Order saved",
      description: "Your order has been created successfully.",
    });
    navigate("/orders");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new sales order
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Order Header */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold">Order Details</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Order Date</Label>
                  <Input type="date" defaultValue="2026-03-31" className="h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Distributor</Label>
                  <Select>
                    <SelectTrigger className="h-12 rounded-lg">
                      <SelectValue placeholder="Select distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Salesperson</Label>
                  <Input placeholder="Salesperson name" className="h-12 rounded-lg" />
                </div>
              </div>
            </section>

            {/* Order Lines */}
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Products</h2>
                <Button variant="ghost" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4" />
                  Add product
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {lines.map((line) => {
                    const product = products.find((p) => p.id === line.productId);
                    return (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3 rounded-lg border border-border/50 bg-muted/20 p-4 sm:grid-cols-12 sm:items-end"
                      >
                        <div className="space-y-1.5 sm:col-span-4">
                          <Label className="text-xs text-muted-foreground">Product</Label>
                          <Select
                            value={line.productId}
                            onValueChange={(v) => updateLine(line.id, "productId", v)}
                          >
                            <SelectTrigger className="h-12 rounded-lg">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs text-muted-foreground">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line.id, "quantity", parseInt(e.target.value) || 0)
                            }
                            className="h-12 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs text-muted-foreground">Unit Price (₹)</Label>
                          <Input
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) =>
                              updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            className="h-12 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-3">
                          <Label className="text-xs text-muted-foreground">Line Total</Label>
                          <div className="flex h-12 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm font-medium">
                            {formatCurrency(getLineTotal(line))}
                          </div>
                        </div>
                        <div className="sm:col-span-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="h-12 w-12 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="mt-6 flex justify-end border-t border-border pt-4">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Order Total</span>
                  <p className="text-xl font-bold">{formatCurrency(orderTotal)}</p>
                </div>
              </div>
            </section>

            {/* Dispatch Details */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold">Dispatch Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Dispatch Date</Label>
                  <Input type="date" className="h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Vehicle / Transporter</Label>
                  <Input placeholder="e.g. MH-01-AB-1234" className="h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Driver Name</Label>
                  <Input placeholder="Optional" className="h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Delivery Status</Label>
                  <div className="flex gap-2">
                    {deliveryStatuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setDeliveryStatus(s.value)}
                        className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
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
              <div className="mt-4 space-y-2">
                <Label className="text-sm">Dispatch Remarks</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  className="min-h-[80px] rounded-lg"
                />
              </div>
            </section>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            {/* Payment */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold">Payment</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Payment Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentModes.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMode(m.value)}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
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
                <div className="space-y-2">
                  <Label className="text-sm">Payment Status</Label>
                  <div className="flex gap-2">
                    {paymentStatuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setPaymentStatus(s.value)}
                        className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
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
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold">Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lines.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Qty</span>
                  <span>{lines.reduce((s, l) => s + l.quantity, 0)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order Total</span>
                    <span className="text-lg font-bold">{formatCurrency(orderTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Save button */}
            <Button className="w-full" size="lg" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Order
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
