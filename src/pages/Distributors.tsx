import { useState, useMemo } from "react";
import React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, ShoppingCart, Plus, Pencil, Trash2, Download, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, ShieldAlert, Store, ChevronDown, ChevronUp, Package, Target } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareDealerOnWhatsApp } from "@/utils/shareWhatsApp";
import type { SecondarySale } from "@/context/DataContext";
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
  const [ssOpen, setSsOpen] = useState(false);
  const [ssExpanded, setSsExpanded] = useState(false);
  const [ssForm, setSsForm] = useState({ retailerName: "", productId: "", quantity: 1, date: new Date().toISOString().split("T")[0], remarks: "" });
  const allProducts = api.products.list();
  const allSecondarySales = api.secondarySales.list();

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
    setEditItem({ id: `d${Date.now()}`, name: "", location: "", contact: "", email: "", address: "", gstin: "", pan: "", stateCode: "", bankName: "", bankAccountName: "", bankAccount: "", bankIfsc: "", totalOrders: 0, totalValue: 0, creditLimit: 0, outstandingAmount: 0 });
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
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNew ? "Add Dealer" : "Edit Dealer"}</DialogTitle>
              <DialogDescription className="sr-only">{isNew ? "Add a new dealer" : "Edit dealer details"}</DialogDescription>
            </DialogHeader>
            {editItem && (
              <div className="space-y-4 md:space-y-5">
                {/* Basic Info */}
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
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Email</Label>
                      <Input type="email" value={editItem.email} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="dealer@example.com" className="h-10 rounded-lg" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Credit Limit (₹)</Label>
                      <Input type="number" min={0} value={editItem.creditLimit || ""} onChange={(e) => setEditItem({ ...editItem, creditLimit: parseFloat(e.target.value) || 0 })} placeholder="0 = Unlimited" className="h-10 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-border/50 pt-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Address</Label>
                    <textarea
                      value={editItem.address}
                      onChange={(e) => setEditItem({ ...editItem, address: e.target.value })}
                      placeholder="Full business address"
                      className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>

                {/* Tax Details */}
                <div className="border-t border-border/50 pt-4">
                  <h3 className="text-sm font-semibold mb-3">Tax Details</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">GSTIN</Label>
                      <Input
                        value={editItem.gstin}
                        onChange={(e) => setEditItem({ ...editItem, gstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15) })}
                        maxLength={15}
                        className="h-10 rounded-lg max-w-[300px] font-mono"
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <p className="text-[10px] text-muted-foreground md:text-xs">15-digit GST Identification Number</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">PAN</Label>
                        <Input
                          value={editItem.pan}
                          onChange={(e) => setEditItem({ ...editItem, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })}
                          maxLength={10}
                          className="h-10 rounded-lg font-mono"
                          placeholder="ABCDE1234F"
                        />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">State Code</Label>
                        <Input
                          value={editItem.stateCode}
                          onChange={(e) => setEditItem({ ...editItem, stateCode: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                          maxLength={2}
                          className="h-10 rounded-lg max-w-[100px] font-mono"
                          placeholder="27"
                        />
                        <p className="text-[10px] text-muted-foreground md:text-xs">2-digit GST state code</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="border-t border-border/50 pt-4">
                  <h3 className="text-sm font-semibold mb-3">Bank Details</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Bank Name</Label>
                      <Input value={editItem.bankName} onChange={(e) => setEditItem({ ...editItem, bankName: e.target.value })} className="h-10 rounded-lg" placeholder="State Bank of India" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Account Holder Name</Label>
                      <Input value={editItem.bankAccountName} onChange={(e) => setEditItem({ ...editItem, bankAccountName: e.target.value })} className="h-10 rounded-lg" placeholder="Sharma Traders Pvt Ltd" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">Account Number</Label>
                        <Input value={editItem.bankAccount} onChange={(e) => setEditItem({ ...editItem, bankAccount: e.target.value.replace(/\D/g, "") })} className="h-10 rounded-lg font-mono" placeholder="1234567890" />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">IFSC Code</Label>
                        <Input value={editItem.bankIfsc} onChange={(e) => setEditItem({ ...editItem, bankIfsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })} maxLength={11} className="h-10 rounded-lg font-mono" placeholder="SBIN0001234" />
                      </div>
                    </div>
                  </div>
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
                              {sc.daysSinceLastOrder !== null ? (sc.daysSinceLastOrder === 0 ? "Ordered today" : `Last order ${sc.daysSinceLastOrder} day${sc.daysSinceLastOrder !== 1 ? "s" : ""} ago`) : "No orders yet"}
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

                  {/* Targets & Achievements */}
                  {(() => {
                    const allTargets = api.targets.list();
                    const now = new Date();
                    const today = now.toISOString().split("T")[0];
                    const dayOfWeek = now.getDay();
                    const mondayOffset = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    const weekStart = new Date(now.getFullYear(), now.getMonth(), mondayOffset).toISOString().split("T")[0];
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

                    const dailyTarget = allTargets.find(t => t.entityType === "dealer" && t.entityId === selectedId && t.periodType === "daily" && t.periodStart === today);
                    const weeklyTarget = allTargets.find(t => t.entityType === "dealer" && t.entityId === selectedId && t.periodType === "weekly" && t.periodStart === weekStart);
                    const monthlyTarget = allTargets.find(t => t.entityType === "dealer" && t.entityId === selectedId && t.periodType === "monthly" && t.periodStart === monthStart);

                    const target = dailyTarget || weeklyTarget || monthlyTarget;
                    if (!target || (target.targetRevenue <= 0 && target.targetOrders <= 0)) return null;

                    const periodLabel = target.periodType === "daily" ? "Today" : target.periodType === "weekly" ? "This Week" : new Date(monthStart).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
                    const periodEnd = target.periodType === "daily" ? today
                      : target.periodType === "weekly" ? new Date(new Date(weekStart).getTime() + 6 * 86400000).toISOString().split("T")[0]
                      : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

                    const filteredOrders = selectedOrders.filter(o => o.date >= target.periodStart && o.date <= periodEnd);
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
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
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


                  {(() => {
                    const dealerSS = allSecondarySales.filter(s => s.distributorId === selectedId);
                    const totalQty = dealerSS.reduce((s, r) => s + r.quantity, 0);
                    const recentSS = dealerSS.slice(0, 10);
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold md:text-sm flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-primary" />
                            Secondary Sales
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
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
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                                <span className="text-[10px] text-muted-foreground">Total Records</span>
                                <p className="text-sm font-semibold mt-0.5">{dealerSS.length}</p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                                <span className="text-[10px] text-muted-foreground">Total Qty Sold</span>
                                <p className="text-sm font-semibold mt-0.5">{totalQty} units</p>
                              </div>
                            </div>

                            <button
                              onClick={() => setSsExpanded(!ssExpanded)}
                              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                            >
                              {ssExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {ssExpanded ? "Hide" : "Show"} recent records ({recentSS.length})
                            </button>

                            {ssExpanded && (
                              <div className="rounded-lg border border-border overflow-hidden">
                                <div className="divide-y divide-border/50">
                                  {recentSS.map(ss => (
                                    <div key={ss.id} className="flex items-center justify-between px-3 py-2">
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
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive shrink-0"
                                        onClick={() => api.secondarySales.remove(ss.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No secondary sales recorded yet. Track what this dealer sells to retailers.</p>
                        )}
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

        {/* Secondary Sale Modal */}
        <Dialog open={ssOpen} onOpenChange={setSsOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Record Secondary Sale</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Track what {selected?.name || "this dealer"} sold to a retailer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs md:text-sm">Retailer Name</Label>
                <Input
                  value={ssForm.retailerName}
                  onChange={(e) => setSsForm({ ...ssForm, retailerName: e.target.value })}
                  placeholder="e.g. Ganesh Kirana Store"
                  className="h-10 rounded-lg"
                />
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
                  <Input
                    type="number"
                    min={1}
                    value={ssForm.quantity}
                    onChange={(e) => setSsForm({ ...ssForm, quantity: parseInt(e.target.value) || 1 })}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Date</Label>
                  <Input
                    type="date"
                    value={ssForm.date}
                    onChange={(e) => setSsForm({ ...ssForm, date: e.target.value })}
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs md:text-sm">Remarks (optional)</Label>
                <Input
                  value={ssForm.remarks}
                  onChange={(e) => setSsForm({ ...ssForm, remarks: e.target.value })}
                  placeholder="Any notes..."
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSsOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!ssForm.productId) {
                  toast.error("Product required", { description: "Please select a product." });
                  return;
                }
                if (ssForm.quantity < 1) {
                  toast.error("Invalid quantity", { description: "Quantity must be at least 1." });
                  return;
                }
                const product = allProducts.find(p => p.id === ssForm.productId);
                api.secondarySales.create({
                  id: "",
                  distributorId: selectedId || "",
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
      </div>
    </AppLayout>
  );
}
