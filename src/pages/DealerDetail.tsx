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
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareDealerOnWhatsApp } from "@/utils/shareWhatsApp";
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
import { DealerStatementPdf } from "@/components/pdf/DealerStatementPdf";
import { buildScorecard, churnRiskConfig } from "@/utils/dealerScorecard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
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
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">{dealer.name}</h1>
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
                const textColor = limit === 0 ? "" : pct >= 100 ? "text-red-600 dark:text-red-400" : pct >= 70 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
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
                  {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
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
                <span className={`text-xs font-semibold ${sc.paymentTimeliness >= 60 ? "text-emerald-600 dark:text-emerald-400" : sc.paymentTimeliness >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
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
              const statusColor = mainPct > 100 ? "text-emerald-600 dark:text-emerald-400" : mainPct >= 70 ? "text-blue-600 dark:text-blue-400" : mainPct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
              const barColor = mainPct > 100 ? "[&>div]:bg-emerald-500" : mainPct >= 70 ? "[&>div]:bg-blue-500" : mainPct >= 40 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500";
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

      {/* Secondary Sale Modal */}
      <Dialog open={ssOpen} onOpenChange={setSsOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
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
                <Input type="number" min={1} value={ssForm.quantity} onChange={(e) => setSsForm({ ...ssForm, quantity: parseInt(e.target.value) || 1 })} className="h-10 rounded-lg" />
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
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
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
