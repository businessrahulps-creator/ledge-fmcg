import { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Mail, FileText, TrendingUp, TrendingDown, Minus, Shield, ShieldAlert, Store, ChevronDown, ChevronUp, Plus, Trash2, Target } from "lucide-react";
import { EntityHistory } from "@/components/layout/EntityHistory";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareDealerOnWhatsApp } from "@/utils/shareWhatsApp";
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
import { DealerStatementPdf } from "@/components/pdf/DealerStatementPdf";
import { buildScorecard, churnRiskConfig } from "@/utils/dealerScorecard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteSkeleton } from "@/components/ui/route-skeleton";
import { formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApi } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatIndianDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import {
  outstandingOrdersForDealer, BUCKET_LABEL, BUCKET_SHORT, BUCKET_TONE,
} from "@/lib/aging";

export default function DealerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();

  const items = api.dealers.list();
  const orders = api.orders.list();
  const allProducts = api.products.list();
  const allSecondarySales = api.secondarySales.list();

  const dealer = items.find(d => d.id === id);
  const dealerOrders = useMemo(() => orders.filter(o => o.distributorId === id), [orders, id]);
  const dealerSS = useMemo(() => allSecondarySales.filter(s => s.distributorId === id), [allSecondarySales, id]);

  const [ssOpen, setSsOpen] = useState(false);
  const [ssExpanded, setSsExpanded] = useState(false);
  const [deleteSecondarySaleId, setDeleteSecondarySaleId] = useState<string | null>(null);
  const [ssForm, setSsForm] = useState({ retailerName: "", productId: "", quantity: 1, date: new Date().toISOString().split("T")[0], remarks: "" });

  if (!dealer) {
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
          <p className="text-sm text-muted-foreground">Dealer not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/distributors")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dealers
          </Button>
        </div>
      </AppLayout>
    );
  }

  const sc = buildScorecard(dealerOrders);
  const risk = churnRiskConfig[sc.churnRisk];
  const trend = sc.orders30d > sc.ordersPrev30d ? "up" : sc.orders30d < sc.ordersPrev30d ? "down" : "flat";
  const totalSSQty = dealerSS.reduce((s, r) => s + r.quantity, 0);
  const recentSS = dealerSS.slice(0, 10);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigate("/distributors")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="h1-display">{dealer.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground md:text-sm">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{dealer.location}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{dealer.contact}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 ml-13 sm:ml-0">
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white"
              onClick={() => shareDealerOnWhatsApp(dealer)}
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={async () => {
                const doc = React.createElement(DealerStatementPdf, {
                  companyName: api.companyInfo.name,
                  companyAddress: api.companyInfo.address,
                  gstin: api.companyInfo.gstin,
                  logoUrl: api.companyInfo.logoUrl,
                  dealer: {
                    name: dealer.name,
                    location: dealer.location,
                    contact: dealer.contact,
                    creditLimit: dealer.creditLimit,
                    outstandingAmount: dealer.outstandingAmount,
                  },
                  scorecard: sc,
                  orders: dealerOrders.map(o => ({
                    orderNumber: o.orderNumber,
                    date: o.date,
                    total: o.total,
                    paymentStatus: o.paymentStatus,
                    schemeSavings: o.schemeSavings || 0,
                  })),
                });
                await downloadPdf(pdfFilename("dealer-statement", dealer.name.replace(/\s+/g, "-")), doc);
              }}
            >
              <FileText className="h-3.5 w-3.5" />
              Statement PDF
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders ({dealerOrders.length})</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="secondary">Secondary Sales</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="glass-card p-3 md:p-4">
                <span className="text-xs text-muted-foreground">Total Orders</span>
                <p className="mt-0.5 text-sm font-semibold md:text-base">{formatNumber(dealer.totalOrders)}</p>
              </div>
              <div className="glass-card p-3 md:p-4">
                <span className="text-xs text-muted-foreground">Total Value</span>
                <p className="mt-0.5 text-sm font-semibold md:text-base">{formatCurrency(dealer.totalValue)}</p>
              </div>
              {(() => {
                const limit = dealer.creditLimit || 0;
                const outstanding = dealer.outstandingAmount || 0;
                const pct = limit > 0 ? (outstanding / limit) * 100 : 0;
                const borderColor = limit === 0 ? "border-border" : pct >= 100 ? "border-red-500" : pct >= 70 ? "border-amber-500" : "border-emerald-500";
                const textColor = limit === 0 ? "" : pct >= 100 ? "text-destructive" : pct >= 70 ? "text-warning" : "text-success";
                return (
                  <div className={`col-span-2 glass-card ${borderColor} p-3 md:p-4`}>
                    <span className="text-xs text-muted-foreground">Outstanding / Credit Limit</span>
                    <p className={`mt-0.5 text-sm font-semibold md:text-base ${textColor}`}>
                      {formatCurrency(outstanding)} / {limit > 0 ? formatCurrency(limit) : "Unlimited"}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Outstanding & Aging */}
            {(() => {
              const outRows = outstandingOrdersForDealer(orders, id || "");
              const totalOut = outRows.reduce((s, r) => s + r.outstanding, 0);
              if (totalOut <= 0) return null;
              const buckets = {
                b0: outRows.filter(r => r.bucket === "b0").reduce((s, r) => s + r.outstanding, 0),
                b31: outRows.filter(r => r.bucket === "b31").reduce((s, r) => s + r.outstanding, 0),
                b61: outRows.filter(r => r.bucket === "b61").reduce((s, r) => s + r.outstanding, 0),
                b90: outRows.filter(r => r.bucket === "b90").reduce((s, r) => s + r.outstanding, 0),
              };
              const limit = dealer.creditLimit || 0;
              const util = limit > 0 ? (totalOut / limit) * 100 : null;
              const utilTone = util === null
                ? "text-muted-foreground"
                : util >= 100 ? "text-destructive" : util >= 70 ? "text-warning" : "text-success";
              const order: Array<keyof typeof buckets> = ["b0", "b31", "b61", "b90"];
              return (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold md:text-sm">Outstanding & Aging</h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <div className="glass-card p-3">
                      <span className="text-[10px] text-muted-foreground">Total Outstanding</span>
                      <p className="mt-0.5 text-sm font-semibold num">{formatCurrency(totalOut)}</p>
                    </div>
                    <div className="glass-card p-3">
                      <span className="text-[10px] text-muted-foreground">Credit Limit</span>
                      <p className="mt-0.5 text-sm font-semibold num">{limit > 0 ? formatCurrency(limit) : "No limit set"}</p>
                    </div>
                    <div className="glass-card p-3">
                      <span className="text-[10px] text-muted-foreground">Utilization</span>
                      <p className={cn("mt-0.5 text-sm font-semibold num", utilTone)}>
                        {util === null ? "—" : `${util.toFixed(0)}%`}
                      </p>
                    </div>
                  </div>

                  {/* Segmented bucket bar */}
                  <div className="glass-card p-3">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
                      {order.map((k) => {
                        const pct = totalOut > 0 ? (buckets[k] / totalOut) * 100 : 0;
                        if (pct <= 0) return null;
                        return (
                          <div
                            key={k}
                            className={cn("h-full", BUCKET_TONE[k].segBg)}
                            style={{ width: `${pct}%` }}
                            title={`${BUCKET_LABEL[k]} · ${formatCurrency(buckets[k])}`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                      {order.map((k) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", BUCKET_TONE[k].segBg)} />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{BUCKET_SHORT[k]} days</p>
                            <p className={cn("text-xs font-semibold num", buckets[k] > 0 ? BUCKET_TONE[k].text : "text-muted-foreground/60")}>
                              {formatCurrency(buckets[k])}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outstanding orders table */}
                  <div className="glass-card overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-4 py-2.5 font-medium">Order</th>
                          <th className="px-4 py-2.5 font-medium">Date</th>
                          <th className="px-4 py-2.5 font-medium text-right">Total</th>
                          <th className="px-4 py-2.5 font-medium text-right">Outstanding</th>
                          <th className="px-4 py-2.5 font-medium">Age</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outRows.map((r) => {
                          const tone = BUCKET_TONE[r.bucket];
                          return (
                            <tr
                              key={r.orderId}
                              className="border-b border-border/50 row-hover cursor-pointer"
                              onClick={() => navigate(`/orders/${r.orderId}`)}
                            >
                              <td className="px-4 py-3 font-medium text-primary">{r.orderNumber}</td>
                              <td className="px-4 py-3 text-muted-foreground">{formatIndianDate(r.date)}</td>
                              <td className="px-4 py-3 text-right num">{formatCurrency(r.total)}</td>
                              <td className="px-4 py-3 text-right font-semibold num">{formatCurrency(r.outstanding)}</td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone.badge)}>
                                  {r.ageDays}d · {BUCKET_SHORT[r.bucket]}
                                </span>
                              </td>
                              <td className="px-4 py-3"><StatusBadge status={r.paymentStatus} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Churn Risk */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${risk.bg}`}>
              {sc.churnRisk === "high" ? <ShieldAlert className={`h-4 w-4 ${risk.color}`} /> : <Shield className={`h-4 w-4 ${risk.color}`} />}
              <div className="flex-1">
                <span className={`text-xs font-semibold ${risk.color}`}>{risk.label}</span>
                <p className="text-[10px] text-muted-foreground">
                  {sc.daysSinceLastOrder !== null ? (sc.daysSinceLastOrder === 0 ? "Ordered today" : `Last order ${sc.daysSinceLastOrder} day${sc.daysSinceLastOrder !== 1 ? "s" : ""} ago`) : "No orders yet"}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk.color} ${risk.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                {sc.churnRisk.toUpperCase()}
              </span>
            </div>

            {/* Scorecard Metrics */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground">Orders (30d)</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-semibold">{sc.orders30d}</span>
                  {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                  {trend === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground">vs {sc.ordersPrev30d} prev</span>
                </div>
              </div>
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground">Orders (90d)</span>
                <p className="text-sm font-semibold mt-0.5">{sc.orders90d}</p>
              </div>
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground">Avg Order Value</span>
                <p className="text-sm font-semibold mt-0.5">{formatCurrency(sc.avgOrderValue)}</p>
              </div>
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground">Value (30d)</span>
                <p className="text-sm font-semibold mt-0.5">{formatCurrency(sc.totalValue30d)}</p>
              </div>
            </div>

            {/* Payment Timeliness */}
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground">Payment Timeliness (On-time %)</span>
                <span className={`text-xs font-semibold ${sc.paymentTimeliness >= 60 ? "text-success" : sc.paymentTimeliness >= 30 ? "text-warning" : "text-destructive"}`}>
                  {sc.paymentTimeliness.toFixed(0)}%
                </span>
              </div>
              <Progress value={sc.paymentTimeliness} className="h-2" />
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
              const dailyTarget = allTargets.find(t => t.entityType === "dealer" && t.entityId === id && t.periodType === "daily" && t.periodStart === today);
              const weeklyTarget = allTargets.find(t => t.entityType === "dealer" && t.entityId === id && t.periodType === "weekly" && t.periodStart === weekStart);
              const monthlyTarget = allTargets.find(t => t.entityType === "dealer" && t.entityId === id && t.periodType === "monthly" && t.periodStart === monthStart);
              const target = dailyTarget || weeklyTarget || monthlyTarget;
              if (!target || (target.targetRevenue <= 0 && target.targetOrders <= 0)) return null;
              const periodLabel = target.periodType === "daily" ? "Today" : target.periodType === "weekly" ? "This Week" : new Date(monthStart).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
              const periodEnd = target.periodType === "daily" ? today : target.periodType === "weekly" ? new Date(new Date(weekStart).getTime() + 6 * 86400000).toISOString().split("T")[0] : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
              const filteredOrders = dealerOrders.filter(o => o.date >= target.periodStart && o.date <= periodEnd);
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
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {dealerOrders.length > 0 ? (
              <div className="glass-card overflow-hidden">
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Order</th>
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                      <th className="px-4 py-2.5 font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealerOrders.map((o) => (
                      <tr key={o.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                        <td className="px-4 py-3 font-medium text-primary">{o.orderNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatIndianDate(o.date)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total - (o.schemeSavings || 0))}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="md:hidden divide-y divide-border/50">
                  {dealerOrders.map((o) => (
                    <div key={o.id} className="px-4 py-3 card-hover cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">{o.orderNumber}</span>
                        <span className="text-xs font-medium">{formatCurrency(o.total - (o.schemeSavings || 0))}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatIndianDate(o.date)}</span>
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
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-4">
            {(() => {
              type LedgerEntry = { date: string; particulars: string; debit: number; credit: number; balance: number; orderId?: string };
              const entries: Omit<LedgerEntry, "balance">[] = [];
              dealerOrders.forEach(o => {
                const net = o.total - (o.schemeSavings || 0);
                entries.push({ date: o.date, particulars: o.orderNumber, debit: net, credit: 0, orderId: o.id });
                if (o.paymentStatus === "paid") {
                  entries.push({ date: o.date, particulars: `Payment — ${o.orderNumber}`, debit: 0, credit: net });
                } else if (o.paymentStatus === "partial") {
                  entries.push({ date: o.date, particulars: `Part Payment — ${o.orderNumber}`, debit: 0, credit: Math.round(net * 0.5) });
                }
              });
              entries.sort((a, b) => a.date.localeCompare(b.date));
              let running = 0;
              const ledger: LedgerEntry[] = entries.map(e => {
                running += e.debit - e.credit;
                return { ...e, balance: running };
              });
              const totalDebit = ledger.reduce((s, e) => s + e.debit, 0);
              const totalCredit = ledger.reduce((s, e) => s + e.credit, 0);
              const closing = totalDebit - totalCredit;

              if (ledger.length === 0) {
                return (
                  <div className="py-12 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">No ledger entries yet</p>
                  </div>
                );
              }

              return (
                <>
                  {/* Desktop table */}
                  <div className="glass-card overflow-hidden hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-4 py-2.5 font-medium">Date</th>
                          <th className="px-4 py-2.5 font-medium">Particulars</th>
                          <th className="px-4 py-2.5 font-medium text-right">Debit (₹)</th>
                          <th className="px-4 py-2.5 font-medium text-right">Credit (₹)</th>
                          <th className="px-4 py-2.5 font-medium text-right">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((e, i) => (
                          <tr
                            key={i}
                            className={`border-b border-border/50 ${e.orderId ? "row-hover cursor-pointer" : ""}`}
                            onClick={e.orderId ? () => navigate(`/orders/${e.orderId}`) : undefined}
                          >
                            <td className="px-4 py-3 text-muted-foreground">{formatIndianDate(e.date)}</td>
                            <td className="px-4 py-3 font-medium">{e.particulars}</td>
                            <td className="px-4 py-3 text-right font-medium">{e.debit > 0 ? formatCurrency(e.debit) : "—"}</td>
                            <td className="px-4 py-3 text-right font-medium text-success">{e.credit > 0 ? formatCurrency(e.credit) : "—"}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(e.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30">
                          <td className="px-4 py-2.5" colSpan={2}><span className="text-xs font-semibold">Totals</span></td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold">{formatCurrency(totalDebit)}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold text-success">{formatCurrency(totalCredit)}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-bold">{formatCurrency(closing)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-2">
                    <div className="glass-card p-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Outstanding</span>
                      <span className="text-sm font-bold">{formatCurrency(closing)}</span>
                    </div>
                    <div className="glass-card overflow-hidden divide-y divide-border/50">
                      {ledger.map((e, i) => (
                        <div
                          key={i}
                          className={`px-4 py-3 ${e.orderId ? "card-hover cursor-pointer" : ""}`}
                          onClick={e.orderId ? () => navigate(`/orders/${e.orderId}`) : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{e.particulars}</span>
                            {e.debit > 0 ? (
                              <span className="text-xs font-medium">+{formatCurrency(e.debit)}</span>
                            ) : (
                              <span className="text-xs font-medium text-success">−{formatCurrency(e.credit)}</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{formatIndianDate(e.date)}</span>
                            <span className="text-[10px] text-muted-foreground">Bal: {formatCurrency(e.balance)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Secondary Sales Tab */}
          <TabsContent value="secondary" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-2 flex-1 mr-3">
                <div className="glass-card p-2.5">
                  <span className="text-[10px] text-muted-foreground">Total Records</span>
                  <p className="text-sm font-semibold mt-0.5">{dealerSS.length}</p>
                </div>
                <div className="glass-card p-2.5">
                  <span className="text-[10px] text-muted-foreground">Total Qty Sold</span>
                  <p className="text-sm font-semibold mt-0.5">{totalSSQty} units</p>
                </div>
              </div>
              <Button
                size="sm"
                className="h-9 gap-1.5 shrink-0"
                onClick={() => {
                  setSsForm({ retailerName: "", productId: "", quantity: 1, date: new Date().toISOString().split("T")[0], remarks: "" });
                  setSsOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Record Sale
              </Button>
            </div>

            {dealerSS.length > 0 ? (
              <div className="glass-card overflow-hidden divide-y divide-border/50">
                {recentSS.map(ss => (
                  <div key={ss.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{ss.retailerName || "—"}</span>
                        <span className="text-[10px] text-muted-foreground">{formatIndianDate(ss.date)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {ss.productName} × {ss.quantity}
                        {ss.remarks ? ` · ${ss.remarks}` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setDeleteSecondarySaleId(ss.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Store className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">No secondary sales recorded yet</p>
                <p className="text-xs text-muted-foreground">Track what this dealer sells to retailers</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

        {/* Activity History */}
        <div className="glass-card p-4 md:p-6">
          <EntityHistory entityType="dealer" entityId={id!} />
        </div>

      {/* Secondary Sale Modal */}
      <Dialog open={ssOpen} onOpenChange={setSsOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Record Secondary Sale</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Track what {dealer.name} sold to a retailer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Retailer Name</Label>
              <Input value={ssForm.retailerName} onChange={(e) => setSsForm({ ...ssForm, retailerName: e.target.value })} placeholder="e.g. Ganesh Kirana Store" className="h-10 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Product *</Label>
              <select
                value={ssForm.productId}
                onChange={(e) => setSsForm({ ...ssForm, productId: e.target.value })}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select product</option>
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs md:text-sm">Quantity *</Label>
                <NumberInput allowEmpty={false} min={1} value={ssForm.quantity} onValueChange={(v) => setSsForm({ ...ssForm, quantity: v ?? 1 })} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs md:text-sm">Date</Label>
                <Input type="date" value={ssForm.date} onChange={(e) => setSsForm({ ...ssForm, date: e.target.value })} className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Remarks (optional)</Label>
              <Input value={ssForm.remarks} onChange={(e) => setSsForm({ ...ssForm, remarks: e.target.value })} placeholder="Any notes..." className="h-10 rounded-lg" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSsOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!ssForm.productId) { toast.error("Product required"); return; }
              if (ssForm.quantity < 1) { toast.error("Invalid quantity"); return; }
              const product = allProducts.find(p => p.id === ssForm.productId);
              api.secondarySales.create({
                id: "",
                distributorId: id || "",
                productId: ssForm.productId,
                productName: product?.name || "",
                retailerName: ssForm.retailerName.trim(),
                quantity: ssForm.quantity,
                date: ssForm.date,
                remarks: ssForm.remarks.trim(),
              });
              setSsOpen(false);
              toast.success("Secondary sale recorded");
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSecondarySaleId} onOpenChange={() => setDeleteSecondarySaleId(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Secondary Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this secondary sale record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={() => { if (deleteSecondarySaleId) { api.secondarySales.remove(deleteSecondarySaleId); setDeleteSecondarySaleId(null); toast.success("Secondary sale removed"); } }}>Remove</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
