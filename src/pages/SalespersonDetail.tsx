import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, FileText, TrendingUp, TrendingDown, Activity, Zap, Target } from "lucide-react";
import { EntityHistory } from "@/components/layout/EntityHistory";
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
// SalespersonStatementPdf is dynamically imported on click to keep @react-pdf/renderer out of this route chunk
import { buildSalespersonScorecard, getPerformanceHealth, getPerformanceInsight, performanceHealthConfig } from "@/utils/salespersonScorecard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteSkeleton } from "@/components/ui/route-skeleton";
import { formatCurrency } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApi } from "@/services/api";
import { formatIndianDate } from "@/utils/formatDate";

export default function SalespersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();

  const items = api.salespersons.list();
  const orders = api.orders.list();

  const person = items.find(s => s.id === id);
  const personOrders = useMemo(() => orders.filter(o => o.salespersonId === id), [orders, id]);

  if (!person) {
    if (api.loading || items.length === 0) {
      return (
        <AppLayout>
          <RouteSkeleton />
        </AppLayout>
      );
    }
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Team member not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/salespersons")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sales Team
          </Button>
        </div>
      </AppLayout>
    );
  }

  const sc = buildSalespersonScorecard(personOrders);
  const health = getPerformanceHealth(personOrders);
  const hc = performanceHealthConfig[health];
  const insight = getPerformanceInsight(health, sc);
  const trend30 = sc.ordersPrev30d > 0 ? ((sc.orders30d - sc.ordersPrev30d) / sc.ordersPrev30d) * 100 : sc.orders30d > 0 ? 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigate("/salespersons")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative pl-3">
              {/* Brand placement (PR-C): Midnight rule — record of truth. */}
              <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary" />
              <h1 className="h1-display">{person.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground md:text-sm">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{person.region}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{person.phone}</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 ml-13 sm:ml-0"
            onClick={async () => {
              const { SalespersonStatementPdf } = await import("@/components/pdf/SalespersonStatementPdf");
              downloadPdf(
                pdfFilename("salesperson-statement", person.name.replace(/\s+/g, "-")),
                SalespersonStatementPdf({
                  companyName: "",
                  salesperson: { name: person.name, phone: person.phone, email: person.email, region: person.region },
                  scorecard: sc,
                  orders: personOrders.map(o => ({ orderNumber: o.orderNumber, date: o.date, distributorName: o.distributorName, total: o.total, paymentStatus: o.paymentStatus, schemeSavings: o.schemeSavings || 0 })),
                  health,
                })
              );
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Statement PDF
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="glass-card p-3 md:p-4">
            <span className="text-xs text-muted-foreground">Phone</span>
            <p className="mt-0.5 text-sm font-medium">{person.phone}</p>
          </div>
          <div className="glass-card p-3 md:p-4">
            <span className="text-xs text-muted-foreground">Email</span>
            <p className="mt-0.5 text-sm font-medium truncate">{person.email}</p>
          </div>
          <div className="glass-card p-3 md:p-4">
            <span className="text-xs text-muted-foreground">Region</span>
            <p className="mt-0.5 text-sm font-medium">{person.region}</p>
          </div>
          <div className="glass-card p-3 md:p-4">
            <span className="text-xs text-muted-foreground">Total Value</span>
            <p className="mt-0.5 text-sm font-medium">{formatCurrency(person.totalValue)}</p>
          </div>
        </div>

        {/* Performance Health */}
        <div className={`rounded-lg border border-border p-3 md:p-4 ${hc.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full ${hc.dot}`} />
            <span className={`text-xs font-semibold ${hc.color}`}>{hc.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{insight}</p>
        </div>

        {/* Scorecard Metrics */}
        <div>
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Performance Scorecard
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="glass-card p-3 md:p-4">
              <span className="text-xs text-muted-foreground">Orders (30d)</span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="text-sm font-semibold md:text-base">{sc.orders30d}</p>
                {trend30 !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${trend30 > 0 ? "text-success" : "text-destructive"}`}>
                    {trend30 > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(Math.round(trend30))}%
                  </span>
                )}
              </div>
            </div>
            <div className="glass-card p-3 md:p-4">
              <span className="text-xs text-muted-foreground">Orders (90d)</span>
              <p className="mt-0.5 text-sm font-semibold md:text-base">{sc.orders90d}</p>
            </div>
            <div className="glass-card p-3 md:p-4">
              <span className="text-xs text-muted-foreground">Avg Order Value</span>
              <p className="mt-0.5 text-sm font-semibold md:text-base">{formatCurrency(sc.avgOrderValue)}</p>
            </div>
            <div className="glass-card p-3 md:p-4">
              <span className="text-xs text-muted-foreground">Revenue (30d)</span>
              <p className="mt-0.5 text-sm font-semibold md:text-base">{formatCurrency(sc.totalRevenue30d)}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:gap-4">
            <div className="glass-card p-3 md:p-4">
              <span className="text-xs text-muted-foreground">Payment Collection</span>
              <p className="mt-0.5 text-sm font-semibold md:text-base">{sc.paymentCollectionEfficiency.toFixed(0)}%</p>
              <Progress value={sc.paymentCollectionEfficiency} className="mt-2 h-1.5" />
            </div>
            <div className="glass-card p-3 md:p-4">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Order Frequency</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold md:text-base">{sc.orderFrequency} / week</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {sc.daysSinceLastOrder !== null
                  ? sc.daysSinceLastOrder === 0 ? "Ordered today" : `${sc.daysSinceLastOrder} days since last order`
                  : "No orders yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Targets */}
        {(() => {
          const allTargets = api.targets.list();
          const now = new Date();
          const today = now.toISOString().split("T")[0];
          const dayOfWeek = now.getDay();
          const mondayOffset = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const weekStart = new Date(now.getFullYear(), now.getMonth(), mondayOffset).toISOString().split("T")[0];
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          const dailyTarget = allTargets.find(t => t.entityType === "salesperson" && t.entityId === id && t.periodType === "daily" && t.periodStart === today);
          const weeklyTarget = allTargets.find(t => t.entityType === "salesperson" && t.entityId === id && t.periodType === "weekly" && t.periodStart === weekStart);
          const monthlyTarget = allTargets.find(t => t.entityType === "salesperson" && t.entityId === id && t.periodType === "monthly" && t.periodStart === monthStart);
          const target = dailyTarget || weeklyTarget || monthlyTarget;
          if (!target || (target.targetRevenue <= 0 && target.targetOrders <= 0)) return null;
          const periodLabel = target.periodType === "daily" ? "Today" : target.periodType === "weekly" ? "This Week" : new Date(monthStart).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
          const periodEnd = target.periodType === "daily" ? today : target.periodType === "weekly" ? new Date(new Date(weekStart).getTime() + 6 * 86400000).toISOString().split("T")[0] : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
          const filteredOrders = personOrders.filter(o => o.date >= target.periodStart && o.date <= periodEnd);
          const actualRev = filteredOrders.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
          const actualOrd = filteredOrders.length;
          const revPct = target.targetRevenue > 0 ? Math.round((actualRev / target.targetRevenue) * 100) : 0;
          const ordPct = target.targetOrders > 0 ? Math.round((actualOrd / target.targetOrders) * 100) : 0;
          const mainPct = target.targetRevenue > 0 ? revPct : ordPct;
          const statusLabel = mainPct > 100 ? "Exceeded" : mainPct >= 70 ? "On Track" : mainPct >= 40 ? "Behind Target" : "Needs Attention";
          const statusColor = mainPct > 100 ? "text-success" : mainPct >= 70 ? "text-primary" : mainPct >= 40 ? "text-warning" : "text-destructive";
          const barColor = mainPct > 100 ? "[&>div]:bg-success" : mainPct >= 70 ? "[&>div]:bg-primary" : mainPct >= 40 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive";
          return (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold md:text-sm flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                Targets & Achievements
                <span className="text-[10px] font-normal text-muted-foreground">({periodLabel})</span>
              </h3>
              <div className="glass-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                  <span className={`text-lg font-bold ${statusColor}`}>{mainPct}%</span>
                </div>
                <Progress value={Math.min(mainPct, 100)} className={`h-2 mb-3 ${barColor}`} />
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {target.targetRevenue > 0 && (
                    <div>
                      <span className="text-muted-foreground">Revenue</span>
                      <p className="font-semibold">{formatCurrency(actualRev)} / {formatCurrency(target.targetRevenue)}</p>
                    </div>
                  )}
                  {target.targetOrders > 0 && (
                    <div>
                      <span className="text-muted-foreground">Orders</span>
                      <p className="font-semibold">{actualOrd} / {target.targetOrders}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Order History */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Order History</h3>
          {personOrders.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Order</th>
                    <th className="px-4 py-2.5 font-medium">Dealer</th>
                    <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {personOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td className="px-4 py-3 font-medium text-primary">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.distributorName}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total - (o.schemeSavings || 0))}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="md:hidden divide-y divide-border/50">
                {personOrders.map((o) => (
                  <div key={o.id} className="px-4 py-3 card-hover cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{o.orderNumber}</span>
                      <span className="text-xs font-medium">{formatCurrency(o.total - (o.schemeSavings || 0))}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{o.distributorName}</span>
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          )}
        </div>

        {/* Activity History */}
        <div className="glass-card p-4 md:p-6">
          <EntityHistory entityType="salesperson" entityId={id!} />
        </div>
      </div>
    </AppLayout>
  );
}
