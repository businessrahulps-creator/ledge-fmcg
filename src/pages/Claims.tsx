import { useState, useMemo } from "react";
import { RotateCcw, PackageX, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2, Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
import { toast } from "sonner";
import type { Claim, ClaimLine } from "@/context/DataContext";
import type { Order } from "@/data/mock-data";

const claimTypeLabels: Record<string, { label: string; icon: typeof RotateCcw; color: string }> = {
  return: { label: "Goods Returned", icon: RotateCcw, color: "bg-blue-50/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  damage: { label: "Damaged / Claim Only", icon: PackageX, color: "bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", color: "bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", icon: PackageX },
  resolved: { label: "Resolved", color: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-50/80 text-red-700 dark:bg-red-500/20 dark:text-red-300", icon: XCircle },
};

function ClaimCard({
  claim, expandedId, setExpandedId, resolveNotes, setResolveNotes, resolvingId, onResolve, onReject,
}: {
  claim: Claim;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  resolveNotes: string;
  setResolveNotes: (v: string) => void;
  resolvingId: string | null;
  onResolve: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const typeInfo = claimTypeLabels[claim.claimType] || claimTypeLabels.return;
  const statusInfo = statusConfig[claim.status] || statusConfig.open;
  const TypeIcon = typeInfo.icon;
  const isExpanded = expandedId === claim.id;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpandedId(isExpanded ? null : claim.id)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{claim.orderNumber}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeInfo.color}`}>
                <TypeIcon className="h-3 w-3" />
                {typeInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {claim.distributorName} · {formatIndianDate(claim.createdAt)}
            </p>
            {claim.reason && (
              <p className="mt-1 text-xs text-muted-foreground truncate max-w-md">
                Reason: {claim.reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold">{formatCurrency(claim.totalClaimValue)}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {claim.lines.map((line, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium">{line.productName}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{line.quantity}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Stock impact:</span>
            <span className={`font-medium ${claim.restoreStock ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {claim.restoreStock ? "✓ Stock was restored to warehouse" : "No stock change (damage claim only)"}
            </span>
          </div>

          {claim.resolutionNotes && (
            <div className="text-xs">
              <span className="text-muted-foreground">Resolution notes: </span>
              <span>{claim.resolutionNotes}</span>
            </div>
          )}

          {claim.status === "open" && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Textarea
                placeholder="Add resolution notes (optional)…"
                value={expandedId === claim.id ? resolveNotes : ""}
                onChange={e => setResolveNotes(e.target.value)}
                className="min-h-[60px] text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onResolve(claim.id)} disabled={resolvingId === claim.id}>
                  {resolvingId === claim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {resolvingId === claim.id ? "Saving…" : "Resolve"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(claim.id)} disabled={resolvingId === claim.id}>
                  {resolvingId === claim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewClaimDialog({
  open, onOpenChange, orders, api,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orders: Order[];
  api: ReturnType<typeof useApi>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [claimType, setClaimType] = useState<"return" | "damage">("return");
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const eligibleOrders = useMemo(() =>
    orders.filter(o => o.deliveryStatus === "dispatched" || o.deliveryStatus === "delivered"),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return eligibleOrders;
    const q = search.toLowerCase();
    return eligibleOrders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.distributorName.toLowerCase().includes(q)
    );
  }, [eligibleOrders, search]);

  const resetAndClose = () => {
    setStep(1);
    setSearch("");
    setSelectedOrder(null);
    setClaimType("return");
    setReason("");
    setQuantities({});
    onOpenChange(false);
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    const qtys: Record<number, number> = {};
    order.lines.forEach((_, i) => { qtys[i] = order.lines[i].quantity; });
    setQuantities(qtys);
    setClaimType("return");
    setReason("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);

    const claimLines: ClaimLine[] = selectedOrder.lines
      .map((line, i) => ({
        productId: line.productId,
        productName: line.productName,
        quantity: quantities[i] || 0,
        unitPrice: line.unitPrice,
        lineTotal: (quantities[i] || 0) * line.unitPrice,
      }))
      .filter(l => l.quantity > 0);

    if (claimLines.length === 0) {
      toast.error("Select at least one product with quantity > 0");
      setSubmitting(false);
      return;
    }

    const totalClaimValue = claimLines.reduce((s, l) => s + l.lineTotal, 0);
    const claim: Claim = {
      id: "",
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.orderNumber,
      distributorId: selectedOrder.distributorId,
      distributorName: selectedOrder.distributorName,
      claimType,
      status: "open",
      reason,
      resolutionNotes: "",
      restoreStock: claimType === "return",
      totalClaimValue,
      lines: claimLines,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    const ok = await api.claims.create(claim);
    setSubmitting(false);
    if (ok) {
      toast.success(claimType === "return" ? "Return recorded — stock restored" : "Damage claim recorded", {
        description: `${formatCurrency(totalClaimValue)} claim for ${selectedOrder.orderNumber}`,
      });
      resetAndClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>New Claim</DialogTitle>
              <DialogDescription>Select an order to file a return or damage claim against.</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or dealer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="max-h-[45vh] overflow-y-auto space-y-1.5">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <PackageX className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="mt-2 text-sm font-medium">No eligible orders</p>
                  <p className="text-xs text-muted-foreground">Only dispatched or delivered orders can have claims.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{order.orderNumber}</span>
                        <p className="text-xs text-muted-foreground truncate">{order.distributorName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                        <p className="text-xs text-muted-foreground">{formatIndianDate(order.date)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Claim for {selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>{selectedOrder?.distributorName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Claim Type</Label>
                <Select value={claimType} onValueChange={v => setClaimType(v as "return" | "damage")}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="return">
                      <span className="flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Goods Returned</span>
                    </SelectItem>
                    <SelectItem value="damage">
                      <span className="flex items-center gap-1.5"><PackageX className="h-3.5 w-3.5" /> Damaged / Claim Only</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reason (optional)</Label>
                <Textarea
                  placeholder="Why is this being returned or claimed?"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Products & Quantities</Label>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium text-right w-20">Ordered</th>
                        <th className="px-3 py-2 font-medium text-right w-24">Claim Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.lines.map((line, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-2 font-medium">{line.productName}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{line.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={line.quantity}
                              value={quantities[i] ?? 0}
                              onChange={e => {
                                const val = Math.min(Math.max(0, Number(e.target.value) || 0), line.quantity);
                                setQuantities(prev => ({ ...prev, [i]: val }));
                              }}
                              className="h-7 w-20 text-xs text-right ml-auto"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={submitting}>
                Back
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                {submitting ? "Saving…" : "Submit Claim"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Claims() {
  const api = useApi();
  const claims = api.claims.list();
  const orders = api.orders.list();
  const isLoading = usePageLoading(api.loading);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [tab, setTab] = useState("open");
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = tab === "all" ? claims : claims.filter(c => c.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.orderNumber.toLowerCase().includes(q) ||
        c.distributorName.toLowerCase().includes(q) ||
        c.claimType.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q)
      );
    }
    return list;
  }, [claims, tab, search]);

  const openCount = claims.filter(c => c.status === "open").length;

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    await api.claims.update(id, { status: "resolved", resolutionNotes: resolveNotes });
    setResolvingId(null);
    setResolveNotes("");
    setExpandedId(null);
    toast.success("Claim resolved");
  };

  const handleReject = async (id: string) => {
    setResolvingId(id);
    await api.claims.update(id, { status: "rejected", resolutionNotes: resolveNotes });
    setResolvingId(null);
    setResolveNotes("");
    setExpandedId(null);
    toast.success("Claim rejected");
  };

  // Blocking page skeleton removed — empty-state handles first-paint.

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">Returns & Claims</h1>
              {openCount > 0 && (
                <Badge variant="secondary" className="bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  {openCount} open
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Track returned goods and damage claims against orders
            </p>
          </div>
          <Button size="sm" onClick={() => setNewClaimOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Claim
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order, dealer, type, reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={RotateCcw}
                title={`No ${tab === "all" ? "" : tab} claims`}
                description={tab === "open" ? "All clear! No pending returns or claims." : "Claims will appear here once recorded."}
                actionLabel={tab === "open" ? "New Claim" : undefined}
                onAction={tab === "open" ? () => setNewClaimOpen(true) : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filtered.map(claim => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    resolveNotes={resolveNotes}
                    setResolveNotes={setResolveNotes}
                    resolvingId={resolvingId}
                    onResolve={handleResolve}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewClaimDialog
        open={newClaimOpen}
        onOpenChange={setNewClaimOpen}
        orders={orders}
        api={api}
      />
    </AppLayout>
  );
}
