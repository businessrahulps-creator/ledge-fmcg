import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Download, Trash2, Lock, Search, Filter, Link2, Unlink, ArrowRightLeft } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useApi } from "@/services/api";
import { GstInvoicePdf } from "@/components/pdf/GstInvoicePdf";
import type { InvoicePdfData } from "@/components/pdf/GstInvoicePdf";
import type { Invoice, InvoiceLine } from "@/context/DataContext";
import { numberToWords } from "@/utils/numberToWords";

type DocType = Invoice["docType"];

const docTypeLabels: Record<DocType, string> = {
  gst_invoice: "GST Invoice",
  invoice: "Invoice",
  estimate: "Estimate",
  proforma: "Proforma",
  credit_note: "Credit Note",
};

const docTypeBadgeColors: Record<DocType, string> = {
  gst_invoice: "bg-primary/10 text-primary",
  invoice: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  estimate: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  proforma: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
  credit_note: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const isDraftType = (dt: DocType) => dt === "gst_invoice" || dt === "credit_note";

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

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [saving, setSaving] = useState(false);

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
  const [lines, setLines] = useState<LineInput[]>([{ productName: "", hsnCode: "", quantity: 1, unit: "Pack", unitPrice: 0 }]);

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
    setLines([{ productName: "", hsnCode: "", quantity: 1, unit: "Pack", unitPrice: 0 }]);
  };

  const handlePullOrder = (orderId: string) => {
    setSourceOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const dealer = api.dealers.list().find(d => d.id === order.distributorId);
    setBuyerName(order.distributorName);
    setBuyerAddress(dealer?.location || "");
    setLines(order.lines.map(l => ({
      productName: l.productName,
      hsnCode: "",
      quantity: l.quantity,
      unit: "Pack",
      unitPrice: l.unitPrice,
    })));
  };

  // Calculations
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
    if (!buyerName.trim()) { toast.error("Buyer name is required"); return; }
    if (lines.length === 0 || lines.every(l => !l.productName.trim())) { toast.error("Add at least one line item"); return; }

    setSaving(true);
    const invoiceLines: InvoiceLine[] = lines.filter(l => l.productName.trim()).map(l => ({
      productName: l.productName,
      hsnCode: l.hsnCode,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      taxableValue: round2(l.quantity * l.unitPrice),
    }));

    const result = await api.invoices.create({
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
      status: isDraftType(docType) ? "draft" : "final",
      lines: invoiceLines,
    });

    setSaving(false);
    if (result) {
      const statusLabel = isDraftType(docType) ? "created as draft" : "created";
      toast.success("Document created", { description: `${docTypeLabels[docType]} ${result.invoiceNumber} ${statusLabel}.` });
      setShowCreate(false);
      resetForm();
    }
  };

  const handleFinalize = async (inv: Invoice) => {
    if (inv.status === "final") return;
    await api.invoices.update(inv.id, { status: "final" });
    toast.success("Document finalized", { description: `${inv.invoiceNumber} is now locked and immutable.` });
  };

  const handleDelete = async (inv: Invoice) => {
    if (inv.status === "final") { toast.error("Cannot delete a finalized document"); return; }
    await api.invoices.remove(inv.id);
    toast.success("Document deleted");
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

  const addLine = () => setLines(prev => [...prev, { productName: "", hsnCode: "", quantity: 1, unit: "Pack", unitPrice: 0 }]);
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));
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
    return list;
  }, [invoices, filterType, search]);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Billing</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Create and manage invoices, estimates, and credit notes
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
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="proforma">Proforma</SelectItem>
              <SelectItem value="credit_note">Credit Note</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Create your first invoice, estimate, or credit note</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Number</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Buyer</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(inv => (
                    <TableRow key={inv.id} className="row-hover">
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[inv.docType]}`}>
                          {docTypeLabels[inv.docType]}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.invoiceDate}</TableCell>
                      <TableCell className="text-sm">{inv.buyerName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₹{inv.grandTotal.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        {inv.status === "final" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <Lock className="h-2.5 w-2.5" /> Final
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(inv)} title="Download PDF">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {(inv.docType === "estimate" || inv.docType === "proforma") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleConvertToGst(inv)} title="Convert to GST Invoice">
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {inv.status === "draft" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFinalize(inv)} title="Finalize">
                                <Lock className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv)} title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
            <DialogDescription>Create an invoice, estimate, or credit note. GST documents start as drafts for review.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Document Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Document Type</Label>
                <Select value={docType} onValueChange={v => setDocType(v as DocType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pull from Order (optional)</Label>
                {sourceOrderId ? (
                  <div className="flex items-center gap-2 h-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <Link2 className="h-3 w-3" />
                      Linked to {orders.find(o => o.id === sourceOrderId)?.orderNumber}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSourceOrderId(""); setLines([{ productName: "", hsnCode: "", quantity: 1, unit: "Pack", unitPrice: 0 }]); setBuyerName(""); setBuyerAddress(""); }} title="Unlink order">
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Select value={sourceOrderId} onValueChange={handlePullOrder}>
                    <SelectTrigger><SelectValue placeholder="Select order..." /></SelectTrigger>
                    <SelectContent>
                      {orders.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {o.distributorName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Buyer Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Buyer Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name *</Label>
                  <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Buyer name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">GSTIN</Label>
                  <Input value={buyerGstin} onChange={e => setBuyerGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))} placeholder="22AAAAA0000A1Z5" className="font-mono" maxLength={15} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Address</Label>
                  <Input value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} placeholder="Address" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">State Code</Label>
                  <Input value={buyerStateCode} onChange={e => setBuyerStateCode(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="27" className="font-mono max-w-[100px]" maxLength={2} />
                </div>
              </div>
            </div>

            {/* GST Config (only for GST Invoice / Credit Note) */}
            {(docType === "gst_invoice" || docType === "credit_note") && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">GST Configuration</h3>
                <div className="grid grid-cols-2 gap-3">
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

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Line Items</h3>
                {!sourceOrderId && (
                  <Button variant="outline" size="sm" onClick={addLine} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Product</Label>}
                      <Input value={line.productName} onChange={e => updateLine(i, "productName", e.target.value)} placeholder="Product name" className="h-9 text-xs" readOnly={!!sourceOrderId} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">HSN</Label>}
                      <Input value={line.hsnCode} onChange={e => updateLine(i, "hsnCode", e.target.value)} placeholder="HSN" className="h-9 text-xs font-mono" />
                    </div>
                    <div className="col-span-1 space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                      <Input type="number" value={line.quantity} onChange={e => updateLine(i, "quantity", Number(e.target.value))} className="h-9 text-xs" min={1} readOnly={!!sourceOrderId} />
                    </div>
                    <div className="col-span-1 space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Unit</Label>}
                      <Input value={line.unit} onChange={e => updateLine(i, "unit", e.target.value)} className="h-9 text-xs" readOnly={!!sourceOrderId} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Rate (₹)</Label>}
                      <Input type="number" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", Number(e.target.value))} className="h-9 text-xs" min={0} readOnly={!!sourceOrderId} />
                    </div>
                    <div className="col-span-1 space-y-1 text-right">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Total</Label>}
                      <p className="h-9 flex items-center justify-end text-xs font-mono">₹{round2(line.quantity * line.unitPrice).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {!sourceOrderId && lines.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating…" : isDraftType(docType) ? "Create as Draft" : "Create Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
