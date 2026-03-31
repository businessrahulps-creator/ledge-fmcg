import { motion } from "framer-motion";
import {
  IndianRupee,
  ShoppingCart,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { orders, distributors, products, formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";

const kpis = [
  {
    label: "Today's Sales",
    value: formatCurrency(40500),
    change: "+12%",
    up: true,
    icon: IndianRupee,
  },
  {
    label: "Total Orders",
    value: formatNumber(orders.length),
    change: "+8%",
    up: true,
    icon: ShoppingCart,
  },
  {
    label: "Pending Payments",
    value: formatCurrency(115000),
    change: "-5%",
    up: false,
    icon: Clock,
  },
  {
    label: "Weekly Revenue",
    value: formatCurrency(368500),
    change: "+18%",
    up: true,
    icon: TrendingUp,
  },
];

const topDistributors = distributors
  .sort((a, b) => b.totalValue - a.totalValue)
  .slice(0, 5);

const topProducts = products
  .sort((a, b) => b.totalSold - a.totalSold)
  .slice(0, 5);

const recentOrders = orders.slice(0, 8);

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your business performance
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="glass-card rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-xl font-bold">{kpi.value}</span>
                <span
                  className={`flex items-center text-xs font-medium ${
                    kpi.up ? "text-success" : "text-destructive"
                  }`}
                >
                  {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Distributors */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-base font-semibold">Top Distributors</h2>
            <p className="text-xs text-muted-foreground">By total order value</p>
            <div className="mt-4 space-y-3">
              {topDistributors.map((d, i) => {
                const maxVal = topDistributors[0].totalValue;
                const pct = (d.totalValue / maxVal) * 100;
                return (
                  <div key={d.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(d.totalValue)}</span>
                    </div>
                    <div className="h-2 w-full rounded-pill bg-muted">
                      <motion.div
                        className="h-2 rounded-pill bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-base font-semibold">Top Products</h2>
            <p className="text-xs text-muted-foreground">By quantity sold</p>
            <div className="mt-4 space-y-3">
              {topProducts.map((p, i) => {
                const maxVal = topProducts[0].totalSold;
                const pct = (p.totalSold / maxVal) * 100;
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">{formatNumber(p.totalSold)} {p.unit}s</span>
                    </div>
                    <div className="h-2 w-full rounded-pill bg-muted">
                      <motion.div
                        className="h-2 rounded-pill bg-success"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between border-b border-border p-6 pb-4">
            <div>
              <h2 className="text-base font-semibold">Recent Orders</h2>
              <p className="text-xs text-muted-foreground">Latest activity</p>
            </div>
            <Link
              to="/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Distributor</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4">{order.distributorName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.deliveryStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
