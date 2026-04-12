import { useState, useMemo } from "react";
import React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, ShoppingCart, Plus, Pencil, Trash2, Download, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, ShieldAlert } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareDealerOnWhatsApp } from "@/utils/shareWhatsApp";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ReportPdf } from "@/components/pdf/ReportPdf";
import { DealerStatementPdf } from "@/components/pdf/DealerStatementPdf";
import { buildScorecard, churnRiskConfig } from "@/utils/dealerScorecard";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatNumber, type Distributor } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApi } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatIndianDate } from "@/utils/formatDate";

export default function Distributors() {
  const api = useApi();
  const items = api.dealers.list();
  const orders = api.orders.list();
  const addDistributor = api.dealers.create;
  const updateDistributor = api.dealers.update;
  const deleteDistributor = api.dealers.remove;
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Distributor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const isLoading = usePageLoading(api.loading);
  const debouncedSearch = useDebounce(search);

  const filtered = useMemo(() => items.filter(
    (d) =>
      d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      d.location.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [items, debouncedSearch]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length);
  const paginatedDealers = useMemo(() => filtered.slice(from, to), [filtered, from, to]);

  const selected = items.find((d) => d.id === selectedId);
  const selectedOrders = orders.filter((o) => o.distributorId === selectedId);
  const deleteDealer = deleteId ? items.find((d) => d.id === deleteId) : null;

  const openNew = () => {
    setEditItem({ id: `d${Date.now()}`, name: "", location: "", contact: "", totalOrders: 0, totalValue: 0, creditLimit: 0, outstandingAmount: 0 });
    setIsNew(true);
  };

  const openEdit = (d: Distributor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditItem({ ...d });
    setIsNew(false);
  };

  const save = () => {
    if (!editItem?.name.trim()) {
      toast.error("Name required", { description: "Please enter a dealer name." });
      return;
    }
    if (!editItem?.contact.trim()) {
      toast.error("Contact required", { description: "Please enter a contact number." });
      return;
    }
    if (isNew) {
      addDistributor(editItem);
      toast.success("Dealer added", { description: `${editItem.name} has been added.` });
    } else {
      updateDistributor(editItem);
      toast.success("Dealer updated", { description: `${editItem.name} has been updated.` });
    }
    setEditItem(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const d = items.find((i) => i.id === deleteId);
    deleteDistributor(deleteId);
    toast.success("Dealer removed", { description: `${d?.name} has been removed.` });
    setDeleteId(null);
  };

  if (isLoading) {
    return <AppLayout><ListPageSkeleton /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Dealers</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage your dealer network
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              onClick={() => setPdfOpen(true)}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              onClick={() => {
                exportCsv(
                  csvFilename("dealers"),
                  ["Name", "Location", "Contact", "Total Orders", "Total Value"],
                  filtered.map((d) => [
                    d.name,
                    d.location,
                    d.contact,
                    String(d.totalOrders),
                    formatCurrency(d.totalValue),
                  ])
                );
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={openNew} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Add Dealer
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dealers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-lg pl-10 md:max-w-md"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {paginatedDealers.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.3 }}
              onClick={() => setSelectedId(d.id)}
              className="cursor-pointer glass-card card-hover p-4 md:p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold md:text-base">{d.name}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                    {d.location}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                    <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                    {d.contact}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 active:scale-95" onClick={(e) => openEdit(d, e)} aria-label={`Edit ${d.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive active:scale-95" onClick={(e) => { e.stopPropagation(); setDeleteId(d.id); }} aria-label={`Delete ${d.name}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 md:mt-4 md:pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs md:text-sm">
                    <ShoppingCart className="h-3 w-3 text-muted-foreground md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                    <span>{d.totalOrders} {d.totalOrders === 1 ? "order" : "orders"}</span>
                  </div>
                  <span className="text-xs font-semibold md:text-sm">{formatCurrency(d.totalValue)}</span>
                </div>
                {/* Credit Health Badge */}
                {(() => {
                  const limit = d.creditLimit || 0;
                  const outstanding = d.outstandingAmount || 0;
                  if (limit === 0 && outstanding === 0) return null;
                  const pct = limit > 0 ? (outstanding / limit) * 100 : 0;
                  const color = limit === 0 ? "text-muted-foreground" : pct >= 100 ? "text-red-600 dark:text-red-400" : pct >= 70 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
                  const bgColor = limit === 0 ? "bg-muted/50" : pct >= 100 ? "bg-red-500/10" : pct >= 70 ? "bg-amber-500/10" : "bg-emerald-500/10";
                  return (
                    <div className={`flex items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium ${bgColor} ${color}`}>
                      <span>Outstanding</span>
                      <span>{formatCurrency(outstanding)} / {limit > 0 ? formatCurrency(limit) : "Unlimited"}</span>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">No dealers found</p>
            <p className="text-xs text-muted-foreground">Add your first dealer to get started</p>
            <Button size="sm" className="mt-3" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Add Dealer
            </Button>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNew ? "Add Dealer" : "Edit Dealer"}</DialogTitle>
              <DialogDescription className="sr-only">{isNew ? "Add a new dealer" : "Edit dealer details"}</DialogDescription>
            </DialogHeader>
            {editItem && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dealer Name *</Label>
                  <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Sharma Traders" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Location</Label>
                    <Input value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} placeholder="e.g. Kochi, Kerala" className="h-10 rounded-lg" />
                  </div>
                   <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Contact *</Label>
                    <Input value={editItem.contact} onChange={(e) => setEditItem({ ...editItem, contact: e.target.value })} placeholder="+91 98100 55555" className="h-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Credit Limit (₹)</Label>
                  <Input type="number" min={0} value={editItem.creditLimit || ""} onChange={(e) => setEditItem({ ...editItem, creditLimit: parseFloat(e.target.value) || 0 })} placeholder="0 = Unlimited" className="h-10 rounded-lg" />
                  <p className="text-[10px] text-muted-foreground">Set to 0 for unlimited credit</p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={save}>{isNew ? "Add Dealer" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Dealer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <span className="font-semibold text-foreground">{deleteDealer?.name}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dealer Profile Dialog */}
        <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-xl sm:max-w-2xl">
            {selected && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <DialogTitle className="text-base md:text-lg">{selected.name}</DialogTitle>
                    <DialogDescription className="sr-only">Dealer profile details</DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white"
                        onClick={() => shareDealerOnWhatsApp(selected)}
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={async () => {
                          const sc = buildScorecard(selectedOrders);
                          const doc = React.createElement(DealerStatementPdf, {
                            companyName: api.companyInfo.name,
                            companyAddress: api.companyInfo.address,
                            gstin: api.companyInfo.gstin,
                            logoUrl: api.companyInfo.logoUrl,
                            dealer: {
                              name: selected.name,
                              location: selected.location,
                              contact: selected.contact,
                              creditLimit: selected.creditLimit,
                              outstandingAmount: selected.outstandingAmount,
                            },
                            scorecard: sc,
                            orders: selectedOrders.map(o => ({
                              orderNumber: o.orderNumber,
                              date: o.date,
                              total: o.total,
                              paymentStatus: o.paymentStatus,
                              schemeSavings: o.schemeSavings || 0,
                            })),
                          });
                          await downloadPdf(pdfFilename("dealer-statement", selected.name.replace(/\s+/g, "-")), doc);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Statement PDF
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Location</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{selected.location}</p>
                     </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Contact</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{selected.contact}</p>
                     </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Total Orders</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{formatNumber(selected.totalOrders)}</p>
                     </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Total Value</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{formatCurrency(selected.totalValue)}</p>
                     </div>
                     {/* Outstanding / Credit Limit stat */}
                     {(() => {
                       const limit = selected.creditLimit || 0;
                       const outstanding = selected.outstandingAmount || 0;
                       const pct = limit > 0 ? (outstanding / limit) * 100 : 0;
                       const borderColor = limit === 0 ? "border-border" : pct >= 100 ? "border-red-500" : pct >= 70 ? "border-amber-500" : "border-emerald-500";
                       const textColor = limit === 0 ? "" : pct >= 100 ? "text-red-600 dark:text-red-400" : pct >= 70 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
                       return (
                         <div className={`col-span-2 rounded-lg border ${borderColor} bg-muted/30 p-3 md:p-4`}>
                           <span className="text-xs text-muted-foreground">Outstanding / Credit Limit</span>
                           <p className={`mt-0.5 text-xs font-semibold md:mt-1 md:text-sm ${textColor}`}>
                             {formatCurrency(outstanding)} / {limit > 0 ? formatCurrency(limit) : "Unlimited"}
                           </p>
                         </div>
                       );
                     })()}
                   </div>

                  {/* Performance Scorecard */}
                  {(() => {
                    const sc = buildScorecard(selectedOrders);
                    const risk = churnRiskConfig[sc.churnRisk];
                    const trend = sc.orders30d > sc.ordersPrev30d ? "up" : sc.orders30d < sc.ordersPrev30d ? "down" : "flat";
                    return (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold md:text-sm flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          Performance Scorecard
                        </h3>
                        {/* Churn Risk Badge */}
                        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${risk.bg}`}>
                          {sc.churnRisk === "high" ? (
                            <ShieldAlert className={`h-4 w-4 ${risk.color}`} />
                          ) : (
                            <Shield className={`h-4 w-4 ${risk.color}`} />
                          )}
                          <div className="flex-1">
                            <span className={`text-xs font-semibold ${risk.color}`}>{risk.label}</span>
                            <p className="text-[10px] text-muted-foreground">
                              {sc.daysSinceLastOrder !== null ? `Last order ${sc.daysSinceLastOrder} day${sc.daysSinceLastOrder !== 1 ? "s" : ""} ago` : "No orders yet"}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk.color} ${risk.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                            {sc.churnRisk.toUpperCase()}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                            <span className="text-[10px] text-muted-foreground">Orders (30d)</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm font-semibold">{sc.orders30d}</span>
                              {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                              {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                              {trend === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-[10px] text-muted-foreground">vs {sc.ordersPrev30d} prev</span>
                            </div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                            <span className="text-[10px] text-muted-foreground">Orders (90d)</span>
                            <p className="text-sm font-semibold mt-0.5">{sc.orders90d}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                            <span className="text-[10px] text-muted-foreground">Avg Order Value</span>
                            <p className="text-sm font-semibold mt-0.5">{formatCurrency(sc.avgOrderValue)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                            <span className="text-[10px] text-muted-foreground">Value (30d)</span>
                            <p className="text-sm font-semibold mt-0.5">{formatCurrency(sc.totalValue30d)}</p>
                          </div>
                        </div>

                        {/* Payment Timeliness */}
                        <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-muted-foreground">Payment Timeliness (On-time %)</span>
                            <span className={`text-xs font-semibold ${sc.paymentTimeliness >= 60 ? "text-emerald-600 dark:text-emerald-400" : sc.paymentTimeliness >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                              {sc.paymentTimeliness.toFixed(0)}%
                            </span>
                          </div>
                          <Progress
                            value={sc.paymentTimeliness}
                            className="h-2"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <h3 className="mb-2 text-xs font-semibold md:mb-3 md:text-sm">Order History</h3>
                    {selectedOrders.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
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
                            {selectedOrders.map((o) => (
                              <tr key={o.id} className="border-b border-border/50">
                                <td className="px-4 py-3 font-medium text-primary">{o.orderNumber}</td>
                                <td className="px-4 py-3 text-muted-foreground">{formatIndianDate(o.date)}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total - (o.schemeSavings || 0))}</td>
                                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="md:hidden">
                          {selectedOrders.map((o) => (
                            <div key={o.id} className="border-b border-border/50 px-3 py-2.5">
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
                      <p className="text-xs text-muted-foreground md:text-sm">No orders yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <ExportPdfModal
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          title="Export Dealers PDF"
          sections={[
            { id: "summary", label: "Summary (total dealers, orders, value)" },
            { id: "dealerList", label: "Dealer List" },
          ] satisfies PdfSection[]}
          onGenerate={async (sel) => {
            const rows: string[][] = [];
            if (sel.summary) {
              rows.push(["Total Dealers", String(filtered.length)]);
              rows.push(["Total Orders", String(filtered.reduce((s, d) => s + d.totalOrders, 0))]);
              rows.push(["Total Value", formatCurrency(filtered.reduce((s, d) => s + d.totalValue, 0))]);
              rows.push(["", ""]);
            }
            if (sel.dealerList) {
              filtered.forEach((d) => {
                rows.push([d.name, `${d.location} · ${d.contact} · ${d.totalOrders} orders · ${formatCurrency(d.totalValue)}`]);
              });
            }
            const columns = [
              { header: "Name", width: "35%" },
              { header: "Details", width: "65%" },
            ];
            downloadPdf(
              pdfFilename("dealers"),
              ReportPdf({ title: "Dealer Report", subtitle: `${filtered.length} dealers`, columns, rows, companyName: "" })
            );
          }}
        />
      </div>
    </AppLayout>
  );
}
