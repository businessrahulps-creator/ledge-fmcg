import { useState, useMemo } from "react";
import { RotateCcw, PackageX, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
import { toast } from "sonner";
import type { Claim } from "@/context/DataContext";

const claimTypeLabels: Record<string, { label: string; icon: typeof RotateCcw; color: string }> = {
  return: { label: "Goods Returned", icon: RotateCcw, color: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" },
  damage: { label: "Damaged / Claim Only", icon: PackageX, color: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", color: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300", icon: PackageX },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300", icon: XCircle },
};

export default function Claims() {
  const api = useApi();
  const claims = api.claims.list();
  const isLoading = usePageLoading(api.loading);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [tab, setTab] = useState("open");

  const filtered = useMemo(() => {
    if (tab === "all") return claims;
    return claims.filter(c => c.status === tab);
  }, [claims, tab]);

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

  if (isLoading) return <AppLayout><TablePageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Returns & Claims</h1>
            {openCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                {openCount} open
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Track returned goods and damage claims against orders
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <RotateCcw className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">No {tab === "all" ? "" : tab} claims</p>
                <p className="text-xs text-muted-foreground">
                  {tab === "open" ? "All clear! No pending returns or claims." : "Claims will appear here once recorded from Orders."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(claim => {
                  const typeInfo = claimTypeLabels[claim.claimType] || claimTypeLabels.return;
                  const statusInfo = statusConfig[claim.status] || statusConfig.open;
                  const TypeIcon = typeInfo.icon;
                  const isExpanded = expandedId === claim.id;

                  return (
                    <div key={claim.id} className="glass-card overflow-hidden">
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
                          {/* Claim lines */}
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
                                 <Button
                                   size="sm"
                                   onClick={() => handleResolve(claim.id)}
                                   disabled={resolvingId === claim.id}
                                 >
                                    {resolvingId === claim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    {resolvingId === claim.id ? "Saving…" : "Resolve"}
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleReject(claim.id)}
                                   disabled={resolvingId === claim.id}
                                 >
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
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
