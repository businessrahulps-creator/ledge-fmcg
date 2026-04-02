import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { orders, formatCurrency } from "@/data/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  const filtered = orders.filter((o) => {
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
                  <th className="px-6 py-3 font-medium">Distributor</th>
                  <th className="px-6 py-3 font-medium">Salesperson</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="group border-b border-border/50 transition-colors hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-primary">{order.orderNumber}</td>
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
                className="border-b border-border/50 px-4 py-3 transition-colors active:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{order.orderNumber}</span>
                  <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
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
      </div>
    </AppLayout>
  );
}
