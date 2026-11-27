import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SignalCard } from "@/components/ui/signal-card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { EmptyCard } from "@/components/ui/empty-card";
import { useApi } from "@/services/api";
import { useCan } from "@/hooks/useCan";
import { usePageLoading } from "@/hooks/use-loading";

import { formatCurrency } from "@/data/mock-data";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, CheckCircle2, AlertTriangle, UserCheck, MapPin, Plus, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Target as TargetType } from "@/context/DataContext";
import { EntityCard } from "@/components/ui/entity-card";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { todayKey } from "@/utils/dateKey";
import { statusFor, canonicalStart, findTarget, normalizeStoredStart, type TargetPeriodType, type TargetStatus } from "@/lib/target-achievement";
import { useTargetAchievement, pickRow } from "@/hooks/use-target-achievement";
import { PeriodPicker } from "@/components/targets/PeriodPicker";

type PeriodType = TargetPeriodType;
type StatusKey = TargetStatus;
const getStatus = statusFor;

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; dot: string }> = {
  // Brand placement (PR-B): "Exceeded" is the canonical Forest moment — money goal beaten.
  exceeded: { label: "Achieved", color: "text-success font-semibold", bg: "bg-success/12 ring-1 ring-success/20", dot: "bg-success" },
  on_track: { label: "On Track", color: "text-primary", bg: "bg-primary/5", dot: "bg-primary" },
  behind: { label: "Behind Target", color: "text-warning", bg: "bg-warning/5", dot: "bg-warning" },
  needs_attention: { label: "Needs Attention", color: "text-destructive", bg: "bg-destructive/5", dot: "bg-destructive" },
  no_target: { label: "No Target Set", color: "text-muted-foreground", bg: "bg-muted/30", dot: "bg-muted-foreground" },
};

function getProgressColor(status: StatusKey) {
  switch (status) {
    case "exceeded": return "[&>div]:bg-success";
    case "on_track": return "[&>div]:bg-primary";
    case "behind": return "[&>div]:bg-warning";
    case "needs_attention": return "[&>div]:bg-destructive";
    default: return "";
  }
}

interface InlineTargetRowProps {
  entityId: string;
  entityName: string;
  entityType: "salesperson" | "dealer";
  subtitle: string;
  actualRevenue: number;
  actualOrders: number;
  gross?: number | null;
  returnsDeducted?: number | null;
  fullyReturned?: number;
  existingTarget?: TargetType;
  periodStart: string;
  periodType: PeriodType;
  onSave: (target: TargetType) => Promise<boolean>;
  onClear: (id: string) => Promise<boolean>;
  readOnly?: boolean;
  canSeeMoney: boolean;
}

function InlineTargetRow({ entityId, entityName, entityType, subtitle, actualRevenue, actualOrders, gross, returnsDeducted, fullyReturned = 0, existingTarget, periodStart, periodType, onSave, onClear, readOnly = false, canSeeMoney }: InlineTargetRowProps) {
  const [revInput, setRevInput] = useState<number | null>(existingTarget?.targetRevenue ?? null);
  const [ordInput, setOrdInput] = useState<number | null>(existingTarget?.targetOrders ?? null);
  const [dirty, setDirty] = useState(false);

  const targetRev = revInput ?? 0;
  const targetOrd = ordInput ?? 0;
  const revStatus = getStatus(actualRevenue, targetRev);
  const ordStatus = getStatus(actualOrders, targetOrd);
  const revPct = targetRev > 0 ? Math.min((actualRevenue / targetRev) * 100, 120) : 0;
  const ordPct = targetOrd > 0 ? Math.min((actualOrders / targetOrd) * 100, 120) : 0;
  const overallStatus = canSeeMoney && targetRev > 0 ? revStatus : (targetOrd > 0 ? ordStatus : "no_target");
  const sc = STATUS_CONFIG[overallStatus];

  const handleSave = useCallback(async () => {
    if (!dirty || readOnly) return;
    // Both fields emptied means "remove this target" — never a silent zero.
    if ((canSeeMoney ? revInput === null : !existingTarget?.targetRevenue) && ordInput === null) {
      if (!existingTarget?.id) { setDirty(false); return; }
      const cleared = await onClear(existingTarget.id);
      if (!cleared) return;
      setDirty(false);
      toast.success("Target removed", { description: `${entityName} no longer has a ${periodType} target` });
      return;
    }
    const ok = await onSave({
      id: existingTarget?.id || "",
      entityType,
      entityId,
      entityName,
      periodType,
      periodStart: existingTarget?.periodStart ?? periodStart,
      targetRevenue: canSeeMoney ? targetRev : (existingTarget?.targetRevenue ?? 0),
      targetOrders: targetOrd,
    });
    if (!ok) return; // save failed — stay dirty so the user can retry
    setDirty(false);
    toast.success("Target saved", { description: `${entityName}'s ${periodType} target updated` });
  }, [dirty, readOnly, canSeeMoney, existingTarget, entityType, entityId, entityName, periodStart, periodType, targetRev, targetOrd, revInput, ordInput, onSave, onClear]);

  const tier: "success" | "warning" | "destructive" | "muted" =
    overallStatus === "exceeded" || overallStatus === "on_track" ? "success"
    : overallStatus === "behind" ? "warning"
    : overallStatus === "needs_attention" ? "destructive"
    : "muted";

  const hasAnyTarget = (canSeeMoney && targetRev > 0) || targetOrd > 0;
  const heroPct = canSeeMoney && targetRev > 0
    ? Math.round((actualRevenue / targetRev) * 100)
    : targetOrd > 0
      ? Math.round((actualOrders / targetOrd) * 100)
      : 0;

  return (
    <EntityCard
      tier={tier}
      avatar={<EntityAvatar name={entityName} size="md" />}
      title={entityName}
      subtitle={subtitle}
      statusChip={
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.color} ${sc.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          {dirty && !readOnly && (
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
          )}
        </div>
      }
      hero={hasAnyTarget ? {
        value: `${heroPct}%`,
        label: canSeeMoney && targetRev > 0 ? "Of revenue target" : "Of orders target",
      } : undefined}
    >
      <div className={`grid gap-3 ${canSeeMoney ? "grid-cols-2" : "grid-cols-1"}`}>
        {canSeeMoney && <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 font-semibold">Sales goal</label>
          <NumberInput
            allowDecimal
            allowEmpty
            min={0}
            value={revInput}
            disabled={readOnly}
            onValueChange={(v) => { setRevInput(v); setDirty(true); }}
            onBlur={handleSave}
            placeholder="e.g. 100000"
            className="h-8 text-xs rounded-lg"
          />
          {canSeeMoney && targetRev > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground num">{formatCurrency(actualRevenue)} / {formatCurrency(targetRev)}</span>
                <span className={`${sc.color} num`}>{Math.round((actualRevenue / targetRev) * 100)}%</span>
              </div>
              <Progress value={Math.min(revPct, 100)} className={`h-1.5 ${getProgressColor(revStatus)}`} />
              {gross != null && (
                <p className="text-[10px] text-muted-foreground num">Sales {formatCurrency(gross)} − returns {formatCurrency(returnsDeducted ?? 0)}</p>
              )}
            </div>
          )}
        </div>}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 font-semibold">Number of orders goal</label>
          <NumberInput
            allowEmpty
            min={0}
            value={ordInput}
            disabled={readOnly}
            onValueChange={(v) => { setOrdInput(v); setDirty(true); }}
            onBlur={handleSave}
            placeholder="e.g. 20"
            className="h-8 text-xs rounded-lg"
          />
          {targetOrd > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground num">{actualOrders} / {targetOrd}</span>
                <span className={`${STATUS_CONFIG[ordStatus].color} num`}>{Math.round((actualOrders / targetOrd) * 100)}%</span>
              </div>
              <Progress value={Math.min(ordPct, 100)} className={`h-1.5 ${getProgressColor(ordStatus)}`} />
            </div>
          )}
          {fullyReturned > 0 && (
            <p className="text-[10px] text-muted-foreground num">Delivered orders {actualOrders} · fully returned {fullyReturned}</p>
          )}
        </div>
      </div>
    </EntityCard>
  );
}

const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function Targets() {
  const navigate = useNavigate();
  const api = useApi();
  const canManageTargets = useCan("manage_schemes");
  const canSeeMoney = useCan("see_money");
  const isLoading = usePageLoading(api.loading);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [period, setPeriod] = useState(canonicalStart("monthly", todayKey()));
  const [search, setSearch] = useState("");

  const handlePeriodTypeChange = useCallback((pt: PeriodType) => {
    setPeriodType(pt);
    setPeriod(canonicalStart(pt, todayKey()));
  }, []);

  const dealers = api.dealers.list();
  const salespersons = api.salespersons.list();
  const targets = api.targets.list();

  // Achievement comes from the server summary (delivered orders by delivery
  // day, minus issued credit notes by note day). Money fields are empty for
  // people without money access. Reading never writes targets.
  const { data: achRows } = useTargetAchievement(periodType, period);
  const actualFor = useCallback((et: "salesperson" | "dealer", id: string) => {
    const r = pickRow(achRows, et, id);
    return { revenue: r?.net ?? 0, orders: r?.deliveredCount ?? 0, gross: r?.gross ?? null, returnsDeducted: r?.returnsDeducted ?? null, fullyReturned: r?.fullyReturnedCount ?? 0 };
  }, [achRows]);
  const companyRow = pickRow(achRows, "company", null);

  const getTarget = useCallback((entityType: string, entityId: string) =>
    findTarget(targets, periodType, period, entityType, entityId), [targets, period, periodType]);

  const handleSave = useCallback(async (target: TargetType) => {
    return target.id ? await api.targets.update(target) : await api.targets.create(target);
  }, [api.targets]);

  const handleClear = useCallback(async (id: string) => api.targets.remove(id), [api.targets]);

  // Blocking page skeleton removed — empty-state handles first-paint.

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="h1-display flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Targets & Achievements
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Set goals and track progress for your team and dealers
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period Type Toggle */}
            <div className="flex rounded-lg border border-input bg-background overflow-hidden">
              {(["daily", "weekly", "monthly"] as PeriodType[]).map(pt => (
                <button
                  key={pt}
                  onClick={() => handlePeriodTypeChange(pt)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    periodType === pt
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {PERIOD_TYPE_LABELS[pt]}
                </button>
              ))}
            </div>
            <PeriodPicker periodType={periodType} value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Summary Stats */}
        {(() => {
          const periodTargets = targets.filter(t => t.periodType === periodType && normalizeStoredStart(periodType, t.periodStart) === period);
          const spTargets = periodTargets.filter(t => t.entityType === "salesperson");
          const dlTargets = periodTargets.filter(t => t.entityType === "dealer");
          const totalTargetRev = periodTargets.reduce((s, t) => s + t.targetRevenue, 0);
          const totalActualRev = companyRow?.net ?? 0;
          const overallPct = totalTargetRev > 0 ? Math.round((totalActualRev / totalTargetRev) * 100) : 0;
          const overallStatus = getStatus(totalActualRev, totalTargetRev);

          // Behind-target lists (named, so the signal surface is actionable)
          const spBehind = spTargets
            .map(t => {
              const sp = salespersons.find(s => s.id === t.entityId);
              const actual = actualFor("salesperson", t.entityId).revenue;
              return { name: sp?.name || "Unknown", pct: t.targetRevenue > 0 ? (actual / t.targetRevenue) * 100 : 0 };
            })
            .filter(x => x.pct < 60)
            .sort((a, b) => a.pct - b.pct);
          const signalTier = overallStatus === "needs_attention" ? "destructive" : overallStatus === "behind" ? "warning" : null;

          return (
            <div className="space-y-4">
              {canSeeMoney && signalTier && (
                <SignalCard
                  tier={signalTier}
                  icon={AlertTriangle}
                  label={signalTier === "destructive" ? "NEEDS ATTENTION" : "BEHIND TARGET"}
                  caption={
                    spBehind.length > 0
                      ? `${spBehind.slice(0, 3).map(s => s.name).join(", ")}${spBehind.length > 3 ? ` +${spBehind.length - 3} more` : ""} are below 60% pace`
                      : `Period revenue tracking ${overallPct}% of ${PERIOD_TYPE_LABELS[periodType].toLowerCase()} target`
                  }
                  subCaption={`${formatCurrency(totalActualRev)} of ${formatCurrency(totalTargetRev)}`}
                  value={`${overallPct}%`}
                  valueSuffix="ACHIEVED"
                />
              )}
              <KpiStrip
                cells={[
                  ...(canSeeMoney ? [
                  { label: `${PERIOD_TYPE_LABELS[periodType]} target`, value: formatCurrency(totalTargetRev), zero: totalTargetRev === 0 },
                  { label: "Actual revenue", value: formatCurrency(totalActualRev), zero: totalActualRev === 0 },
                  { label: "Overall progress", value: `${overallPct}%`, zero: overallPct === 0 },
                  ] : []),
                  { label: "Targets set", value: `${spTargets.length + dlTargets.length}/${salespersons.length + dealers.length}`, zero: spTargets.length + dlTargets.length === 0 },
                ]}
              />
            </div>
          );
        })()}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, region, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Tabs defaultValue="salespersons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="salespersons">Sales Team ({salespersons.length})</TabsTrigger>
            <TabsTrigger value="dealers">Dealers ({dealers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="salespersons" className="space-y-3">
            {(() => {
              const q = search.toLowerCase();
              const filtered = q ? salespersons.filter(sp => sp.name.toLowerCase().includes(q) || (sp.region || "").toLowerCase().includes(q)) : salespersons;
              return filtered.length > 0 ? (
              filtered.map(sp => {
                const actual = actualFor("salesperson", sp.id);
                const existingTarget = getTarget("salesperson", sp.id);
                return (
                  <InlineTargetRow
                    key={`${sp.id}-${periodType}-${period}`}
                    entityId={sp.id}
                    entityName={sp.name}
                    entityType="salesperson"
                    subtitle={sp.region || "No region"}
                    actualRevenue={actual.revenue}
                    actualOrders={actual.orders}
                    gross={canSeeMoney ? actual.gross : null}
                    returnsDeducted={actual.returnsDeducted}
                    fullyReturned={actual.fullyReturned}
                    existingTarget={existingTarget}
                    periodStart={period}
                    periodType={periodType}
                    onSave={handleSave}
                    onClear={handleClear}
                    readOnly={!canManageTargets}
                    canSeeMoney={canSeeMoney}
                  />
                );
              })
            ) : (
              <EmptyCard
                icon={UserCheck}
                title={q ? "No matching team members." : "No team members yet."}
                description={q ? "Try a different search term." : "Add your sales team so you can set monthly targets for each person."}
                actionLabel={!q ? "Add team member" : undefined}
                onAction={!q ? () => navigate("/salespersons") : undefined}
              />
            );
            })()}
          </TabsContent>

          <TabsContent value="dealers" className="space-y-3">
            {(() => {
              const q = search.toLowerCase();
              const filtered = q ? dealers.filter(d => d.name.toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q)) : dealers;
              return filtered.length > 0 ? (
              filtered.map(d => {
                const actual = actualFor("dealer", d.id);
                const existingTarget = getTarget("dealer", d.id);
                return (
                  <InlineTargetRow
                    key={`${d.id}-${periodType}-${period}`}
                    entityId={d.id}
                    entityName={d.name}
                    entityType="dealer"
                    subtitle={d.location || "No location"}
                    actualRevenue={actual.revenue}
                    actualOrders={actual.orders}
                    gross={canSeeMoney ? actual.gross : null}
                    returnsDeducted={actual.returnsDeducted}
                    fullyReturned={actual.fullyReturned}
                    existingTarget={existingTarget}
                    periodStart={period}
                    periodType={periodType}
                    onSave={handleSave}
                    onClear={handleClear}
                    readOnly={!canManageTargets}
                    canSeeMoney={canSeeMoney}
                  />
                );
              })
            ) : (
              <EmptyCard
                icon={MapPin}
                title={q ? "No matching dealers." : "No dealers yet."}
                description={q ? "Try a different search term." : "Add your dealer network so you can set targets per dealer."}
                actionLabel={!q ? "Add dealer" : undefined}
                onAction={!q ? () => navigate("/distributors") : undefined}
              />
            );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
