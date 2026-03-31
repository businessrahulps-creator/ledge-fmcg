import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { orders, distributors, products, formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function DistributorReport() {
  const data = distributors.map((d) => {
    const dOrders = orders.filter((o) => o.distributorId === d.id);
    const total = dOrders.reduce((s, o) => s + o.total, 0);
    return { ...d, orderCount: dOrders.length, revenue: total };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-6 py-3 font-medium">Distributor</th>
            <th className="px-6 py-3 font-medium">Location</th>
            <th className="px-6 py-3 font-medium text-right">Orders</th>
            <th className="px-6 py-3 font-medium text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4 font-medium">{d.name}</td>
              <td className="px-6 py-4 text-muted-foreground">{d.location}</td>
              <td className="px-6 py-4 text-right">{d.orderCount}</td>
              <td className="px-6 py-4 text-right font-medium">{formatCurrency(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductReport() {
  const data = products.map((p) => {
    let qty = 0;
    let rev = 0;
    orders.forEach((o) => {
      o.lines.forEach((l) => {
        if (l.productId === p.id) {
          qty += l.quantity;
          rev += l.lineTotal;
        }
      });
    });
    return { ...p, qtySold: qty, revenue: rev };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-6 py-3 font-medium">Product</th>
            <th className="px-6 py-3 font-medium">SKU</th>
            <th className="px-6 py-3 font-medium text-right">Qty Sold</th>
            <th className="px-6 py-3 font-medium text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4 font-medium">{p.name}</td>
              <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.sku}</td>
              <td className="px-6 py-4 text-right">{formatNumber(p.qtySold)}</td>
              <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentReport() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.paymentStatus === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-12 w-48 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatCurrency(filtered.reduce((s, o) => s + o.total, 0))}</span></span>
          <span className="text-muted-foreground">{filtered.length} orders</span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Distributor</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3 font-medium">Payment</th>
              <th className="px-6 py-3 font-medium">Mode</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                <td className="px-6 py-4">{o.distributorName}</td>
                <td className="px-6 py-4 text-muted-foreground">{o.date}</td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(o.total)}</td>
                <td className="px-6 py-4"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-6 py-4 text-muted-foreground capitalize">{o.paymentMode.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DispatchReport() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.deliveryStatus === filter);

  return (
    <div className="space-y-4">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="h-12 w-48 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="dispatched">Dispatched</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
        </SelectContent>
      </Select>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Distributor</th>
              <th className="px-6 py-3 font-medium">Dispatch Date</th>
              <th className="px-6 py-3 font-medium">Vehicle</th>
              <th className="px-6 py-3 font-medium">Driver</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                <td className="px-6 py-4">{o.distributorName}</td>
                <td className="px-6 py-4 text-muted-foreground">{o.dispatchDate || "—"}</td>
                <td className="px-6 py-4 text-muted-foreground">{o.vehicle || "—"}</td>
                <td className="px-6 py-4 text-muted-foreground">{o.driverName || "—"}</td>
                <td className="px-6 py-4"><StatusBadge status={o.deliveryStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze your business performance
          </p>
        </div>

        <Tabs defaultValue="distributors" className="space-y-6">
          <TabsList className="h-12 rounded-lg bg-muted/50 p-1">
            <TabsTrigger value="distributors" className="rounded-md px-4 py-2 text-sm">Distributors</TabsTrigger>
            <TabsTrigger value="products" className="rounded-md px-4 py-2 text-sm">Products</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-md px-4 py-2 text-sm">Payments</TabsTrigger>
            <TabsTrigger value="dispatch" className="rounded-md px-4 py-2 text-sm">Dispatch</TabsTrigger>
          </TabsList>

          <TabsContent value="distributors">
            <DistributorReport />
          </TabsContent>
          <TabsContent value="products">
            <ProductReport />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentReport />
          </TabsContent>
          <TabsContent value="dispatch">
            <DispatchReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
