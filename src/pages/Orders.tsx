import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { orders as initialOrders, formatCurrency, type Order } from "@/data/mock-data";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

export default function Orders() {
  const [ordersData, setOrdersData] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Editable fields for dialog
  const [editPayment, setEditPayment] = useState("");
  const [editDelivery, setEditDelivery] = useState("");
  const [editDispatchDate, setEditDispatchDate] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editDriver, setEditDriver] = useState("");

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditPayment(order.paymentStatus);
    setEditDelivery(order.deliveryStatus);
    setEditDispatchDate(order.dispatchDate || "");
    setEditVehicle(order.vehicle || "");
    setEditDriver(order.driverName || "");
  };

  const saveOrder = () => {
    if (!selectedOrder) return;
    setOrdersData((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              paymentStatus: editPayment as Order["paymentStatus"],
              deliveryStatus: editDelivery as Order["deliveryStatus"],
              dispatchDate: editDispatchDate || null,
              vehicle: editVehicle,
              driverName: editDriver,
            }
          : o
      )
    );
    toast.success("Order updated", { description: `${selectedOrder.orderNumber} has been updated.` });
    setSelectedOrder(null);
  };

  const filtered = ordersData.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.distributorName.toLowerCase().includes(search.toLowerCase());
    const matchesPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
    const matchesDelivery = deliveryFilter === "all" || o.deliveryStatus === deliveryFilter;
    return matchesSearch && matchesPayment && matchesDelivery;
  });

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Orders</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage and track all sales orders
            </p>
          </div>
          <Link to="/orders/new">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-lg pl-10 md:h-12"
            />
          </div>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-11 w-full rounded-lg sm:w-44 md:h-12">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
            <SelectTrigger className="h-11 w-full rounded-lg sm:w-44 md:h-12">
              <SelectValue placeholder="Delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Delivery</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Dealer</th>
                  <th className="px-6 py-3 font-medium">Sales Person</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order)}
                    className="group border-b border-border/50 row-hover cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                    <td className="px-6 py-4">{order.distributorName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{order.salesperson}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-6 py-4"><StatusBadge status={order.deliveryStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="space-y-0 md:hidden">
            {filtered.map((order) => (
              <div
                key={order.id}
                onClick={() => openOrder(order)}
                className="border-b border-border/50 px-4 py-2.5 card-hover cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{order.orderNumber}</span>
                  <span className="text-xs font-medium">{formatCurrency(order.total)}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {order.distributorName} · {order.date}
                </p>
                <div className="mt-1.5 flex gap-1.5">
                  <StatusBadge status={order.paymentStatus} />
                  <StatusBadge status={order.deliveryStatus} />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Filter className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium">No orders found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-2xl">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">{selectedOrder.orderNumber}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 md:space-y-5">
                  {/* Read-only info */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Date</span>
                      <p className="mt-0.5 text-xs font-medium md:text-sm">{selectedOrder.date}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Dealer</span>
                      <p className="mt-0.5 text-xs font-medium md:text-sm">{selectedOrder.distributorName}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Sales Person</span>
                      <p className="mt-0.5 text-xs font-medium md:text-sm">{selectedOrder.salesperson}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Total</span>
                      <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatCurrency(selectedOrder.total)}</p>
                    </div>
                  </div>

                  {/* Line items */}
                  <div>
                    <h3 className="mb-2 text-xs font-semibold md:text-sm">Items</h3>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-xs md:text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-[10px] text-muted-foreground md:text-xs">
                            <th className="px-3 py-2 font-medium md:px-4">Product</th>
                            <th className="px-3 py-2 font-medium text-right md:px-4">Qty</th>
                            <th className="px-3 py-2 font-medium text-right md:px-4">Price</th>
                            <th className="px-3 py-2 font-medium text-right md:px-4">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.lines.map((line, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="px-3 py-2.5 font-medium md:px-4">{line.productName}</td>
                              <td className="px-3 py-2.5 text-right text-muted-foreground md:px-4">{line.quantity}</td>
                              <td className="px-3 py-2.5 text-right text-muted-foreground md:px-4">{formatCurrency(line.unitPrice)}</td>
                              <td className="px-3 py-2.5 text-right font-medium md:px-4">{formatCurrency(line.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Editable statuses */}
                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm">Payment Status</Label>
                      <div className="flex gap-2">
                        {paymentStatuses.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setEditPayment(s.value)}
                            className={`flex-1 rounded-lg border px-2 py-2.5 md:px-3 md:py-3 text-xs font-medium transition-all md:text-sm ${
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
                            className={`flex-1 rounded-lg border px-2 py-2.5 md:px-3 md:py-3 text-xs font-medium transition-all md:text-sm ${
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs md:text-sm">Dispatch Date</Label>
                        <Input
                          type="date"
                          value={editDispatchDate}
                          onChange={(e) => setEditDispatchDate(e.target.value)}
                          className="h-11 rounded-lg md:h-12"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs md:text-sm">Vehicle</Label>
                        <Input
                          value={editVehicle}
                          onChange={(e) => setEditVehicle(e.target.value)}
                          placeholder="e.g. MH-01-AB-1234"
                          className="h-11 rounded-lg md:h-12"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs md:text-sm">Driver</Label>
                        <Input
                          value={editDriver}
                          onChange={(e) => setEditDriver(e.target.value)}
                          placeholder="Driver name"
                          className="h-11 rounded-lg md:h-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                  <Button onClick={saveOrder}>Save Changes</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
