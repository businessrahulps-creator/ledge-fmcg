import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Filter, Trash2, Download, FileText, Share2 } from "lucide-react";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { ReportPdf } from "@/components/pdf/ReportPdf";
import { OrderInvoicePdf } from "@/components/pdf/OrderInvoicePdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, type Order } from "@/data/mock-data";
import { useApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const statusColors: Record<string, string> = {
  paid: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  partial: "border-amber-500 bg-amber-500/10 text-amber-600",
  pending: "border-red-500 bg-red-500/10 text-red-600",
  dispatched: "border-blue-500 bg-blue-500/10 text-blue-600",
  delivered: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
};

const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
];

const paymentStatuses = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

const deliveryStatuses = [
  { value: "pending", label: "Pending" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

export default function Orders() {
  const api = useApi();
  const { companyInfo } = api;
  const orders = api.orders.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const updateOrder = (id: string, updates: Partial<import("@/data/mock-data").Order>) => api.orders.update(id, updates);
  const [searchParams, setSearchParams] = useSearchParams();
  const dealerParam = searchParams.get("dealer") || "";
  const [search, setSearch] = useState(dealerParam);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editDelivery, setEditDelivery] = useState("");
  const [editDispatchDate, setEditDispatchDate] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [editGodown, setEditGodown] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ordersPdfSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Orders table" },
  ];

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditPaymentMode(order.paymentMode);
    setEditPayment(order.paymentStatus);
    setEditDelivery(order.deliveryStatus);
    setEditDispatchDate(order.dispatchDate || "");
    setEditVehicle(order.vehicle || "");
    setEditDriver(order.driverName || "");
    setEditGodown(order.godownId || "");
  };

  const saveOrder = async () => {
    if (!selectedOrder) return;

    // Require godown if changing to dispatched/delivered
    if ((editDelivery === "dispatched" || editDelivery === "delivered") && !editGodown) {
      toast.error("Warehouse required", { description: "Please select a source warehouse for dispatch." });
      return;
    }

    setIsSaving(true);
    await updateOrder(selectedOrder.id, {
      paymentMode: editPaymentMode as Order["paymentMode"],
      paymentStatus: editPayment as Order["paymentStatus"],
      deliveryStatus: editDelivery as Order["deliveryStatus"],
      dispatchDate: editDispatchDate || null,
      vehicle: editVehicle,
      driverName: editDriver,
      godownId: editGodown || undefined,
    });
    setIsSaving(false);
    toast.success("Order updated", { description: `${selectedOrder.orderNumber} has been updated.` });
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const ok = await api.orders.delete(deleteTarget.id);
    setDeleteLoading(false);
    if (ok) {
      toast.success("Order deleted", { description: `${deleteTarget.orderNumber} has been deleted.` });
      setDeleteTarget(null);
      setDeleteConfirmText("");
      setSelectedOrder(null);
    }
  };

  const isLoading = usePageLoading(api.loading);
  const debouncedSearch = useDebounce(search);

  const filtered = useMemo(() => orders.filter((o) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.distributorName.toLowerCase().includes(q);
    const matchesPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
    const matchesDelivery = deliveryFilter === "all" || o.deliveryStatus === deliveryFilter;
    return matchesSearch && matchesPayment && matchesDelivery;
  }), [orders, debouncedSearch, paymentFilter, deliveryFilter]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length);
  const paginatedOrders = useMemo(() => filtered.slice(from, to), [filtered, from, to]);

  if (isLoading) {
    return <AppLayout><TablePageSkeleton /></AppLayout>;
  }

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
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              onClick={() => {
                const godownMap = Object.fromEntries(godowns.map(g => [g.id, g.name]));
                exportCsv(
                  csvFilename("orders"),
                  ["Order #", "Date", "Dealer", "Sales Person", "Amount", "Payment Mode", "Payment Status", "Delivery Status", "Dispatch Date", "Vehicle", "Driver", "Warehouse"],
                  filtered.map((o) => [
                    o.orderNumber,
                    formatIndianDate(o.date),
                    o.distributorName,
                    o.salesperson,
                    formatCurrency(o.total),
                    o.paymentMode.replace("_", " "),
                    o.paymentStatus,
                    o.deliveryStatus,
                    formatIndianDate(o.dispatchDate),
                    o.vehicle || "",
                    o.driverName || "",
                    o.godownId ? (godownMap[o.godownId] || "") : "",
                  ])
                );
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              onClick={() => setPdfModalOpen(true)}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Link to="/orders/new" className="flex-1 sm:flex-none">
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
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
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
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
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                 <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Order #</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Dealer</th>
                  <th className="px-6 py-3 font-semibold">Sales Person</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold">Payment</th>
                  <th className="px-6 py-3 font-semibold">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order)}
                    className="group border-b border-border/50 row-hover cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatIndianDate(order.date)}</td>
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

          <div className="divide-y divide-border/50 md:hidden">
            {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => openOrder(order)}
                  className="border-b border-border/50 px-4 py-3.5 card-hover cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{order.orderNumber}</span>
                    <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.distributorName} · {formatIndianDate(order.date)}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <StatusBadge status={order.paymentStatus} />
                    <StatusBadge status={order.deliveryStatus} />
                  </div>
                </div>
            ))}
          </div>

          <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Filter className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium">No orders found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filters
              </p>
              <Link to="/orders/new">
                <Button size="sm" className="mt-3">
                  <Plus className="h-4 w-4" />
                  Create your first order
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-2xl">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">{selectedOrder.orderNumber}</DialogTitle>
                  <DialogDescription className="sr-only">View and edit order details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 md:space-y-5">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                     <div className="rounded-lg border border-border bg-muted/30 p-3">
                       <span className="text-xs text-muted-foreground">Date</span>
                      <p className="mt-0.5 text-xs font-medium md:text-sm">{formatIndianDate(selectedOrder.date)}</p>
                    </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3">
                       <span className="text-xs text-muted-foreground">Dealer</span>
                      <p className="mt-0.5 text-xs font-medium md:text-sm">{selectedOrder.distributorName}</p>
                    </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3">
                       <span className="text-xs text-muted-foreground">Sales Person</span>
                      <p className="mt-0.5 text-xs font-medium md:text-sm">{selectedOrder.salesperson}</p>
                    </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3">
                       <span className="text-xs text-muted-foreground">Total</span>
                      <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatCurrency(selectedOrder.total)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold md:text-sm">Items</h3>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-xs md:text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted-foreground">
                            <th className="px-3 py-2 font-medium md:px-4">Product</th>
                            <th className="px-3 py-2 font-medium text-right md:px-4">Qty</th>
                            <th className="px-3 py-2 font-medium text-right md:px-4">Price</th>
                            <th className="px-3 py-2 font-medium text-right md:px-4">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.lines.map((line, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="px-3 py-2.5 font-medium md:px-4">{line.productName}</td>
                              <td className="px-3 py-2.5 text-right text-muted-foreground md:px-4">{line.quantity}</td>
                              <td className="px-3 py-2.5 text-right text-muted-foreground md:px-4">{formatCurrency(line.unitPrice)}</td>
                              <td className="px-3 py-2.5 text-right font-medium md:px-4">{formatCurrency(line.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm">Payment Mode</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentModes.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setEditPaymentMode(m.value)}
                            className={`rounded-lg border px-2 py-2.5 md:px-3 md:py-3 text-xs font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                              editPaymentMode === m.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-foreground/20"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm">Payment Status</Label>
                      <div className="flex gap-2">
                        {paymentStatuses.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setEditPayment(s.value)}
                            className={`flex-1 rounded-lg border px-2 py-2.5 md:px-3 md:py-3 text-xs font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                              editPayment === s.value
                                ? statusColors[s.value] || "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-foreground/20"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm">Delivery Status</Label>
                      <div className="flex gap-2">
                        {deliveryStatuses.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setEditDelivery(s.value)}
                            className={`flex-1 rounded-lg border px-2 py-2.5 md:px-3 md:py-3 text-xs font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                              editDelivery === s.value
                                ? statusColors[s.value] || "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-foreground/20"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs md:text-sm">Source Warehouse {(editDelivery === "dispatched" || editDelivery === "delivered") ? "*" : ""}</Label>
                      <Select value={editGodown} onValueChange={setEditGodown}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {godowns.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs md:text-sm">Dispatch Date</Label>
                        <Input
                          type="date"
                          value={editDispatchDate}
                          onChange={(e) => setEditDispatchDate(e.target.value)}
                          className="h-11 rounded-lg md:h-12"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs md:text-sm">Vehicle</Label>
                        <Input
                          value={editVehicle}
                          onChange={(e) => setEditVehicle(e.target.value)}
                          placeholder="e.g. MH-01-AB-1234"
                          className="h-11 rounded-lg md:h-12"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs md:text-sm">Driver</Label>
                        <Input
                          value={editDriver}
                          onChange={(e) => setEditDriver(e.target.value)}
                          placeholder="Driver name"
                          className="h-11 rounded-lg md:h-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex gap-2 sm:mr-auto">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedOrder.deliveryStatus === "delivered"}
                      onClick={() => { setDeleteTarget(selectedOrder); setDeleteConfirmText(""); }}
                      aria-label="Delete order"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span >{selectedOrder.deliveryStatus === "delivered" ? "Cannot delete" : "Delete"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Download invoice PDF"
                      onClick={() => {
                        downloadPdf(
                          pdfFilename("invoice", selectedOrder.orderNumber),
                          <OrderInvoicePdf order={selectedOrder} companyName={companyInfo.name} companyAddress={companyInfo.address} gstin={companyInfo.gstin} logoUrl={companyInfo.logoUrl} />
                        );
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span >Invoice</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Share via WhatsApp"
                      onClick={() => {
                        const order = selectedOrder;
                        const lines = order.lines.map(l => `${l.productName} x${l.quantity}`).join(", ");
                        const msg = `Invoice ${order.orderNumber}\nDealer: ${order.distributorName}\nTotal: ₹${order.total.toLocaleString("en-IN")}\nItems: ${lines}`;
                        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                        window.open(url, "_blank");
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span >Share</span>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                    <Button onClick={saveOrder}>Save Changes</Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <span className="font-semibold text-foreground">{deleteTarget?.orderNumber}</span> and restore any deducted stock. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              <Label className="text-xs text-muted-foreground">
                Type <span className="font-mono font-semibold text-foreground">{deleteTarget?.orderNumber}</span> to confirm
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget?.orderNumber || ""}
                className="h-11 rounded-lg font-mono"
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== deleteTarget?.orderNumber || deleteLoading}
                onClick={handleDeleteOrder}
              >
                {deleteLoading ? "Deleting…" : "Delete Order"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ExportPdfModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          sections={ordersPdfSections}
          onGenerate={(sel) => {
            const godownMap = Object.fromEntries(godowns.map(g => [g.id, g.name]));
            const totalAmount = filtered.reduce((s, o) => s + o.total, 0);
            downloadPdf(
              pdfFilename("orders"),
              <ReportPdf
                companyName={companyInfo.name}
                companyAddress={companyInfo.address}
                gstin={companyInfo.gstin}
                logoUrl={companyInfo.logoUrl}
                title="Orders Report"
                subtitle={`${filtered.length} orders`}
                showCompany={sel.company}
                showSummary={sel.summary}
                showTable={sel.table}
                summary={[
                  { label: "Total Orders", value: String(filtered.length) },
                  { label: "Total Amount", value: formatCurrencyPdf(totalAmount) },
                ]}
                columns={[
                  { header: "Order #", width: "12%" },
                  { header: "Date", width: "12%" },
                  { header: "Dealer", width: "20%" },
                  { header: "Sales Person", width: "16%" },
                  { header: "Amount", width: "14%", align: "right" },
                  { header: "Payment", width: "12%" },
                  { header: "Delivery", width: "14%" },
                ]}
                rows={filtered.map((o) => [
                  o.orderNumber,
                  formatIndianDate(o.date),
                  o.distributorName,
                  o.salesperson,
                  formatCurrencyPdf(o.total),
                  o.paymentStatus,
                  o.deliveryStatus,
                ])}
              />
            );
          }}
        />
      </div>
    </AppLayout>
  );
}
