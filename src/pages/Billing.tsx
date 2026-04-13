import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Download, Trash2, Lock, Search, Filter, Link2, ArrowRightLeft, Pencil, ArrowLeft, Truck, CalendarDays } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareInvoiceOnWhatsApp } from "@/utils/shareWhatsApp";
import { pdf } from "@react-pdf/renderer";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useApi } from "@/services/api";
import { GstInvoicePdf } from "@/components/pdf/GstInvoicePdf";
import type { InvoicePdfData } from "@/components/pdf/GstInvoicePdf";
import type { Invoice, InvoiceLine } from "@/context/DataContext";
import { numberToWords } from "@/utils/numberToWords";
import { useSearchParams } from "react-router-dom";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { filterByTimePeriod, type TimePeriod } from "@/components/reports/TimePeriodFilter";

type DocType = Invoice["docType"];

const docTypeLabels: Record<DocType, string> = {
  gst_invoice: "GST Invoice",
  estimate: "Estimate",
  proforma: "Proforma",
  credit_note: "Credit Note",
};

const docTypeBadgeColors: Record<DocType, string> = {
  gst_invoice: "bg-primary/10 text-primary",
  estimate: "bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  proforma: "bg-purple-50/80 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  credit_note: "bg-red-50/80 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const isDraftType = (dt: DocType) => dt === "gst_invoice" || dt === "credit_note";

const isEditable = (inv: Invoice) => {
  if (inv.docType === "estimate" || inv.docType === "proforma") return true;
  return inv.status === "draft";
};

interface LineInput {
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export default function Billing() {
  const api = useApi();
  const invoices = api.invoices.list();
  const orders = api.orders.list();
  const company = api.companyInfo;
  const [searchParams] = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [timePeriod, setTimePeriod] = useState<TimePeriod | "all">("all");

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState<Invoice | null>(null);

  // Form state
  const [docType, setDocType] = useState<DocType>("gst_invoice");
  const [sourceOrderId, setSourceOrderId] = useState<string>("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerGstin, setBuyerGstin] = useState("");
  const [buyerStateCode, setBuyerStateCode] = useState("");
  const [supplyType, setSupplyType] = useState<"intra_state" | "inter_state">("intra_state");
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineInput[]>([]);
  const [vehicle, setVehicle] = useState("");
  const [driverName, setDriverName] = useState("");

  const resetForm = () => {
    setDocType("gst_invoice");
    setSourceOrderId("");
    setBuyerName("");
    setBuyerAddress("");
    setBuyerGstin("");
    setBuyerStateCode("");
    setSupplyType("intra_state");
    setGstRate(18);
    setNotes("");
    setLines([]);
    setVehicle("");
    setDriverName("");
    setEditingInvoice(null);
    setStep(1);
    setOrderSearch("");
  };

  // Auto-open dialog if coming from Orders page with ?order=<id>
  useEffect(() => {
    const orderId = searchParams.get("order");
    if (orderId) {
      handleSelectOrder(orderId);
      setStep(2);
      setShowCreate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectOrder(orderId: string) {
    setSourceOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const dealer = api.dealers.list().find(d => d.id === order.distributorId);
    setBuyerName(order.distributorName);
    setBuyerAddress(dealer?.address || dealer?.location || "");
    setVehicle(order.vehicle || "");
    setDriverName(order.driverName || "");

    // Build invoice lines from order lines, adjusting for scheme savings
    // Trade discounts are applied proportionally across lines so GST is computed on the net amount
    const grossTotal = order.lines.reduce((s, l) => s + l.lineTotal, 0);
    const savings = order.schemeSavings || 0;
    const discountRatio = grossTotal > 0 && savings > 0 ? savings / grossTotal : 0;

    setLines(order.lines.map(l => {
      const catalogProduct = products.find(p => p.id === l.productId);
      return {
      productName: l.productName,
      hsnCode: catalogProduct?.hsnCode || "",
      quantity: l.quantity,
      unit: catalogProduct?.unit || "Pack",
      unitPrice: discountRatio > 0 ? Math.round((l.unitPrice * (1 - discountRatio)) * 100) / 100 : l.unitPrice,
    };
    }));
    setStep(2);
  }

  const handleEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setDocType(inv.docType);
    setSourceOrderId(inv.sourceOrderId || "");
    setBuyerName(inv.buyerName);
    setBuyerAddress(inv.buyerAddress);
    setBuyerGstin(inv.buyerGstin);
    setBuyerStateCode(inv.buyerStateCode);
    setSupplyType(inv.supplyType as "intra_state" | "inter_state");
    setGstRate(inv.gstRate);
    setNotes(inv.notes || "");
    setVehicle(inv.vehicle || "");
    setDriverName(inv.driverName || "");
    setLines(inv.lines.map(l => ({
      productName: l.productName,
      hsnCode: l.hsnCode || "",
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
    })));
    setStep(2);
    setShowCreate(true);
  };

  const calculated = useMemo(() => {
    const subtotal = round2(lines.reduce((sum, l) => sum + round2(l.quantity * l.unitPrice), 0));
    const isGst = docType === "gst_invoice" || docType === "credit_note";
    let cgst = 0, sgst = 0, igst = 0;
    if (isGst) {
      if (supplyType === "intra_state") {
        cgst = round2(subtotal * gstRate / 200);
        sgst = round2(subtotal * gstRate / 200);
      } else {
        igst = round2(subtotal * gstRate / 100);
      }
    }
    const totalTax = round2(cgst + sgst + igst);
    const preRound = round2(subtotal + totalTax);
    const grandTotal = Math.round(preRound);
    const roundOff = round2(grandTotal - preRound);
    return { subtotal, cgst, sgst, igst, totalTax, grandTotal, roundOff };
  }, [lines, docType, supplyType, gstRate]);

  const handleCreate = async () => {
    if (!sourceOrderId && !editingInvoice) {
      toast.error("Please select an order first");
      return;
    }
    if (!buyerName.trim()) { toast.error("Buyer name is required"); return; }
    if (lines.length === 0 || lines.every(l => !l.productName.trim())) { toast.error("No line items"); return; }
    if (docType === "gst_invoice" && (!vehicle.trim() || !driverName.trim())) {
      toast.error("Vehicle & driver details required", { description: "Fill in dispatch details on the order first, then generate the GST invoice." });
      return;
    }

    setSaving(true);
    const invoiceLines: InvoiceLine[] = lines.filter(l => l.productName.trim()).map(l => ({
      productName: l.productName,
      hsnCode: l.hsnCode,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      taxableValue: round2(l.quantity * l.unitPrice),
    }));

    const commonData = {
      docType,
      invoiceDate: new Date().toISOString().split("T")[0],
      sourceOrderId: sourceOrderId || undefined,
      buyerName: buyerName.trim(),
      buyerAddress,
      buyerGstin,
      buyerStateCode,
      sellerName: company.name,
      sellerAddress: company.address,
      sellerGstin: company.gstin,
      sellerPan: company.pan,
      sellerStateCode: company.stateCode,
      sellerPhone: company.phone,
      sellerEmail: company.email,
      sellerBankName: company.bankName,
      sellerBankAccountName: company.bankAccountName,
      sellerBankAccount: company.bankAccount,
      sellerBankIfsc: company.bankIfsc,
      sellerLogoUrl: company.logoUrl,
      supplyType,
      gstRate,
      subtotal: calculated.subtotal,
      cgstAmount: calculated.cgst,
      sgstAmount: calculated.sgst,
      igstAmount: calculated.igst,
      totalTax: calculated.totalTax,
      grandTotal: calculated.grandTotal,
      roundOff: calculated.roundOff,
      amountInWords: numberToWords(calculated.grandTotal),
      notes,
      vehicle,
      driverName,
      lines: invoiceLines,
    };

    if (editingInvoice) {
      await api.invoices.update(editingInvoice.id, {
        ...commonData,
        status: editingInvoice.status,
      });
      setSaving(false);
      toast.success("Document updated", { description: `${editingInvoice.invoiceNumber} saved.` });
      setShowCreate(false);
      resetForm();
    } else {
      const result = await api.invoices.create({
        ...commonData,
        status: isDraftType(docType) ? "draft" : "final",
      });
      setSaving(false);
      if (result) {
        const statusLabel = isDraftType(docType) ? "created as draft" : "created";
        toast.success("Document created", { description: `${docTypeLabels[docType]} ${result.invoiceNumber} ${statusLabel}.` });
        setShowCreate(false);
        resetForm();
      }
    }
  };

  const handleFinalize = async (inv: Invoice) => {
    if (inv.status === "final") return;
    await api.invoices.update(inv.id, { status: "final" });
    toast.success("Document finalized", { description: `${inv.invoiceNumber} is now locked and immutable.` });
    setConfirmFinalize(null);
  };

  const handleDelete = async (inv: Invoice) => {
    await api.invoices.remove(inv.id);
    toast.success("Document deleted");
    setConfirmDelete(null);
  };

  const handleConvertToGst = (inv: Invoice) => {
    resetForm();
    setDocType("gst_invoice");
    setBuyerName(inv.buyerName);
    setBuyerAddress(inv.buyerAddress);
    setBuyerGstin(inv.buyerGstin);
    setBuyerStateCode(inv.buyerStateCode);
    setSupplyType(inv.supplyType as "intra_state" | "inter_state");
    setGstRate(inv.gstRate);
    setNotes(inv.notes || `Converted from ${docTypeLabels[inv.docType]} ${inv.invoiceNumber}`);
    setVehicle(inv.vehicle || "");
    setDriverName(inv.driverName || "");
    if (inv.sourceOrderId) setSourceOrderId(inv.sourceOrderId);
    setLines(inv.lines.map(l => ({
      productName: l.productName,
      hsnCode: l.hsnCode || "",
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
    })));
    setShowCreate(true);
  };

  const handleDownloadPdf = useCallback(async (inv: Invoice) => {
    const pdfData: InvoicePdfData = {
      docType: inv.docType,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      buyerName: inv.buyerName,
      buyerAddress: inv.buyerAddress,
      buyerGstin: inv.buyerGstin,
      buyerStateCode: inv.buyerStateCode,
      sellerName: inv.sellerName,
      sellerAddress: inv.sellerAddress,
      sellerGstin: inv.sellerGstin,
      sellerPan: inv.sellerPan,
      sellerStateCode: inv.sellerStateCode,
      sellerPhone: inv.sellerPhone,
      sellerEmail: inv.sellerEmail,
      sellerBankName: inv.sellerBankName,
      sellerBankAccountName: inv.sellerBankAccountName,
      sellerBankAccount: inv.sellerBankAccount,
      sellerBankIfsc: inv.sellerBankIfsc,
      supplyType: inv.supplyType,
      gstRate: inv.gstRate,
      lines: inv.lines,
      subtotal: inv.subtotal,
      cgstAmount: inv.cgstAmount,
      sgstAmount: inv.sgstAmount,
      igstAmount: inv.igstAmount,
      totalTax: inv.totalTax,
      grandTotal: inv.grandTotal,
      roundOff: inv.roundOff,
      amountInWords: inv.amountInWords,
      notes: inv.notes,
      vehicle: inv.vehicle || "",
      driverName: inv.driverName || "",
    };

    try {
      const blob = await pdf(<GstInvoicePdf data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  }, []);

  const updateLine = (i: number, field: keyof LineInput, value: string | number) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const filtered = useMemo(() => {
    let list = invoices;
    if (filterType !== "all") list = list.filter(i => i.docType === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.buyerName.toLowerCase().includes(q));
    }
    if (timePeriod !== "all") {
      list = filterByTimePeriod(list.map(i => ({ ...i, date: i.invoiceDate })), timePeriod).map(({ date, ...rest }) => rest as typeof list[number]);
    }
    return list;
  }, [invoices, filterType, search, timePeriod]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length, 15);
  const paginatedList = useMemo(() => filtered.slice(from, to), [filtered, from, to]);

  // Get linked documents for each order
  const getOrderDocuments = useCallback((orderId: string) => {
    return invoices.filter(inv => inv.sourceOrderId === orderId);
  }, [invoices]);

  // Sorted/grouped orders for the picker: needs-invoice first, then has-documents, recent first
  const sortedOrders = useMemo(() => {
    const withDocs = orders.map(o => ({
      order: o,
      docs: invoices.filter(inv => inv.sourceOrderId === o.id),
    }));
    const needsInvoice = withDocs.filter(x => x.docs.length === 0).sort((a, b) => new Date(b.order.date).getTime() - new Date(a.order.date).getTime());
    const hasDocs = withDocs.filter(x => x.docs.length > 0).sort((a, b) => new Date(b.order.date).getTime() - new Date(a.order.date).getTime());
    return { needsInvoice, hasDocs };
  }, [orders, invoices]);

  // Filtered orders for step-1 picker
  const filteredPickerOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim();
    const filterFn = (items: typeof sortedOrders.needsInvoice) =>
      q ? items.filter(x => x.order.orderNumber.toLowerCase().includes(q) || x.order.distributorName.toLowerCase().includes(q)) : items;
    return { needsInvoice: filterFn(sortedOrders.needsInvoice), hasDocs: filterFn(sortedOrders.hasDocs) };
  }, [sortedOrders, orderSearch]);

  const isEditMode = !!editingInvoice;
  const selectedOrder = orders.find(o => o.id === sourceOrderId);
  const dialogTitle = isEditMode ? `Edit ${docTypeLabels[docType]}` : step === 1 ? "Select Order" : "New Document";
  const dialogDesc = isEditMode
    ? `Editing ${editingInvoice?.invoiceNumber}. Changes will be saved immediately.`
    : step === 1 ? "Pick an order to create a billing document from." : "Fill in document details.";

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Billing</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Generate invoices, estimates, and credit notes from orders
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or buyer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] h-10">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="gst_invoice">GST Invoice</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="proforma">Proforma</SelectItem>
              <SelectItem value="credit_note">Credit Note</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timePeriod} onValueChange={v => setTimePeriod(v as TimePeriod | "all")}>
            <SelectTrigger className="w-[160px] h-10">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly">Last 30 Days</SelectItem>
              <SelectItem value="yearly">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 26, stiffness: 200 }} className="glass-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Create your first billing document from an order</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Number</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Buyer</TableHead>
                      <TableHead className="text-xs">Order</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map(inv => {
                      const linkedOrder = inv.sourceOrderId ? orders.find(o => o.id === inv.sourceOrderId) : null;
                      return (
                        <TableRow key={inv.id} className="row-hover">
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[inv.docType] || 'bg-muted text-muted-foreground'}`}>
                              {docTypeLabels[inv.docType] || inv.docType}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{inv.invoiceDate}</TableCell>
                          <TableCell className="text-sm">{inv.buyerName}</TableCell>
                          <TableCell className="text-xs">
                            {linkedOrder ? (
                              <span className="inline-flex items-center gap-1 text-primary font-medium">
                                <Link2 className="h-3 w-3" />
                                {linkedOrder.orderNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50 text-[10px]">Legacy</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">₹{inv.grandTotal.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            {inv.status === "final" && isDraftType(inv.docType) ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                                <Lock className="h-2.5 w-2.5" /> Final
                              </span>
                            ) : inv.status === "draft" ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                Draft
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(inv)} title="Download PDF">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" onClick={() => shareInvoiceOnWhatsApp(inv)} title="Share on WhatsApp">
                                <WhatsAppIcon className="h-3.5 w-3.5" />
                              </Button>
                              {isEditable(inv) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(inv)} title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(inv.docType === "estimate" || inv.docType === "proforma") && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleConvertToGst(inv)} title="Convert to GST Invoice">
                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isDraftType(inv.docType) && inv.status === "draft" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmFinalize(inv)} title="Finalize">
                                  <Lock className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isEditable(inv) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setConfirmDelete(inv)} title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-3 md:hidden">
                {paginatedList.map(inv => (
                  <div key={inv.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[inv.docType] || 'bg-muted text-muted-foreground'}`}>
                        {docTypeLabels[inv.docType] || inv.docType}
                      </span>
                      {inv.status === "final" && isDraftType(inv.docType) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <Lock className="h-2.5 w-2.5" /> Final
                        </span>
                      ) : inv.status === "draft" ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                      <span className="text-sm font-bold">₹{inv.grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{inv.buyerName} · {inv.invoiceDate}</p>
                    <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(inv)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" onClick={() => shareInvoiceOnWhatsApp(inv)}>
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                      </Button>
                      {isEditable(inv) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(inv)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(inv.docType === "estimate" || inv.docType === "proforma") && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleConvertToGst(inv)} title="Convert to GST Invoice">
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isDraftType(inv.docType) && inv.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmFinalize(inv)} title="Finalize">
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isEditable(inv) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-auto" onClick={() => setConfirmDelete(inv)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Create / Edit Document Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } else { setShowCreate(true); } }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDesc}</DialogDescription>
          </DialogHeader>

          {/* Step 1: Order Picker (only for new documents) */}
          {!isEditMode && step === 1 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or dealer name..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="pl-9 h-10"
                  autoFocus
                />
              </div>

              <div className="max-h-[45vh] overflow-y-auto space-y-1 pr-1">
                {filteredPickerOrders.needsInvoice.length === 0 && filteredPickerOrders.hasDocs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">No orders found</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Try a different search term</p>
                  </div>
                )}

                {filteredPickerOrders.needsInvoice.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-2 pb-1">Needs Invoice</p>
                    {filteredPickerOrders.needsInvoice.map(({ order: o }) => (
                      <button
                        key={o.id}
                        onClick={() => handleSelectOrder(o.id)}
                        className="w-full text-left rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-sm font-medium">{o.orderNumber}</span>
                            <span className="text-xs text-muted-foreground ml-2">{o.distributorName}</span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">₹{(o.total - (o.schemeSavings || 0)).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {o.salesperson}
                        </p>
                      </button>
                    ))}
                  </>
                )}

                {filteredPickerOrders.hasDocs.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-3 pb-1">Has Documents</p>
                    {filteredPickerOrders.hasDocs.map(({ order: o, docs }) => (
                      <button
                        key={o.id}
                        onClick={() => handleSelectOrder(o.id)}
                        className="w-full text-left rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-sm font-medium">{o.orderNumber}</span>
                            <span className="text-xs text-muted-foreground ml-2">{o.distributorName}</span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">₹{(o.total - (o.schemeSavings || 0)).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {docs.map(d => (
                            <span key={d.id} className={`inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-medium ${docTypeBadgeColors[d.docType] || 'bg-muted text-muted-foreground'}`}>
                              {docTypeLabels[d.docType]}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: Document Form (after order selected or in edit mode) */}
          {(isEditMode || step === 2) && (
            <div className="space-y-5">
              {/* Selected order summary (new mode only) */}
              {!isEditMode && selectedOrder && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{selectedOrder.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">· {selectedOrder.distributorName}</span>
                      <span className="text-xs font-mono text-muted-foreground">₹{(selectedOrder.total - (selectedOrder.schemeSavings || 0)).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  {(() => {
                    const existingDocs = getOrderDocuments(sourceOrderId);
                    if (existingDocs.length === 0) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-primary/20">
                        <p className="text-[10px] text-muted-foreground mb-1">Existing documents for this order:</p>
                        <div className="flex flex-wrap gap-1">
                          {existingDocs.map(doc => (
                            <span key={doc.id} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[doc.docType]}`}>
                              {docTypeLabels[doc.docType]} · {doc.invoiceNumber} ({doc.status})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Document Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Document Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(docTypeLabels) as [DocType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => !isEditMode && setDocType(key)}
                      disabled={isEditMode}
                      className={`rounded-lg border px-2 py-2.5 text-[11px] font-medium whitespace-nowrap transition-all ${
                        docType === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground/20"
                      } ${isEditMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buyer Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Buyer Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={buyerName} readOnly className="bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">GSTIN</Label>
                    <Input value={buyerGstin} onChange={e => setBuyerGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))} placeholder="22AAAAA0000A1Z5" className="font-mono" maxLength={15} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Address</Label>
                    <Input value={buyerAddress} readOnly className="bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">State Code</Label>
                    <Input value={buyerStateCode} onChange={e => setBuyerStateCode(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="27" className="font-mono max-w-[100px]" maxLength={2} />
                  </div>
                </div>
              </div>

              {/* GST Config */}
              {(docType === "gst_invoice" || docType === "credit_note") && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">GST Configuration</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Supply Type</Label>
                      <Select value={supplyType} onValueChange={v => setSupplyType(v as "intra_state" | "inter_state")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="intra_state">Intra-State (CGST+SGST)</SelectItem>
                          <SelectItem value="inter_state">Inter-State (IGST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">GST Rate (%)</Label>
                      <Input type="number" value={gstRate} onChange={e => setGstRate(Number(e.target.value))} className="max-w-[100px]" min={0} max={28} />
                    </div>
                  </div>
                </div>
              )}

              {/* Transport Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Transport Details</h3>
                  {docType === "gst_invoice" && (
                    <span className="text-[10px] text-destructive font-medium">Required for GST</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vehicle Number</Label>
                    <Input value={vehicle} onChange={e => setVehicle(e.target.value.toUpperCase())} placeholder="MH-01-AB-1234" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Driver Name</Label>
                    <Input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Line Items</h3>
                  <span className="text-[10px] text-muted-foreground">Auto-populated from order · Only HSN is editable</span>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                      <div className="col-span-2 sm:col-span-4 space-y-1">
                        {i === 0 && <Label className="text-[10px] text-muted-foreground">Product</Label>}
                        <Input value={line.productName} readOnly className="h-9 text-xs bg-muted/30" />
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1">
                        {i === 0 && <Label className="text-[10px] text-muted-foreground">HSN</Label>}
                        <Input value={line.hsnCode} onChange={e => updateLine(i, "hsnCode", e.target.value)} placeholder="HSN" className="h-9 text-xs font-mono" />
                      </div>
                      <div className="col-span-1 sm:col-span-1 space-y-1">
                        {i === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                        <Input type="number" value={line.quantity} readOnly className="h-9 text-xs bg-muted/30" />
                      </div>
                      <div className="col-span-1 sm:col-span-1 space-y-1">
                        {i === 0 && <Label className="text-[10px] text-muted-foreground">Unit</Label>}
                        <Input value={line.unit} readOnly className="h-9 text-xs bg-muted/30" />
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1">
                        {i === 0 && <Label className="text-[10px] text-muted-foreground">Rate (₹)</Label>}
                        <Input type="number" value={line.unitPrice} readOnly className="h-9 text-xs bg-muted/30" />
                      </div>
                      <div className="hidden sm:block sm:col-span-2 space-y-1 text-right">
                        {i === 0 && <Label className="text-[10px] text-muted-foreground">Total</Label>}
                        <p className="h-9 flex items-center justify-end text-xs font-mono">₹{round2(line.quantity * line.unitPrice).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-lg border border-border/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">₹{calculated.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {(docType === "gst_invoice" || docType === "credit_note") && supplyType === "intra_state" && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>CGST @ {gstRate / 2}%</span>
                      <span className="font-mono">₹{calculated.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>SGST @ {gstRate / 2}%</span>
                      <span className="font-mono">₹{calculated.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {(docType === "gst_invoice" || docType === "credit_note") && supplyType === "inter_state" && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>IGST @ {gstRate}%</span>
                    <span className="font-mono">₹{calculated.igst.toFixed(2)}</span>
                  </div>
                )}
                {calculated.roundOff !== 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Round Off</span>
                    <span className="font-mono">{calculated.roundOff > 0 ? "+" : ""}₹{calculated.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span className="font-mono">₹{calculated.grandTotal.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">{numberToWords(calculated.grandTotal)}</p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, delivery instructions..." className="min-h-[60px]" />
              </div>

              <DialogFooter>
                {!isEditMode && (
                  <Button variant="outline" onClick={() => { setStep(1); setSourceOrderId(""); setLines([]); setBuyerName(""); setBuyerAddress(""); setOrderSearch(""); }} className="gap-1.5 mr-auto">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving
                    ? isEditMode ? "Saving…" : "Creating…"
                    : isEditMode
                      ? "Save Changes"
                      : isDraftType(docType) ? "Create as Draft" : "Create Document"
                  }
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{confirmDelete?.invoiceNumber}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize Confirmation */}
      <AlertDialog open={!!confirmFinalize} onOpenChange={(open) => { if (!open) setConfirmFinalize(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize document?</AlertDialogTitle>
            <AlertDialogDescription>
              Once finalized, <span className="font-medium">{confirmFinalize?.invoiceNumber}</span> will be locked and cannot be edited or deleted. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmFinalize && handleFinalize(confirmFinalize)}>
              Finalize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
