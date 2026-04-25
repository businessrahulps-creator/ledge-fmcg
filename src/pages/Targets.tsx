import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";

import { formatCurrency } from "@/data/mock-data";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, CheckCircle2, AlertTriangle, UserCheck, MapPin, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Target as TargetType } from "@/context/DataContext";

type PeriodType = "daily" | "weekly" | "monthly";

function getMonthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -2; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

function getDailyOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -7; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const isToday = i === 0;
    const label = isToday
      ? `Today (${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`
      : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    opts.push({ value, label });
  }
  return opts;
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getWeeklyOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  const thisMonday = getMonday(now);
  for (let i = -2; i <= 2; i++) {
    const monday = new Date(thisMonday);
    monday.setDate(monday.getDate() + i * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const value = monday.toISOString().split("T")[0];
    const isCurrent = i === 0;
    const label = isCurrent
      ? `This Week (${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`
      : `${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    opts.push({ value, label });
  }
  return opts;
}

function getPeriodEnd(periodType: PeriodType, periodStart: string) {
  const d = new Date(periodStart);
  if (periodType === "daily") return periodStart;
  if (periodType === "weekly") {
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return end.toISOString().split("T")[0];
  }
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}

function getDefaultPeriodStart(periodType: PeriodType) {
  const now = new Date();
  if (periodType === "daily") return now.toISOString().split("T")[0];
  if (periodType === "weekly") return getMonday(now).toISOString().split("T")[0];
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

type StatusKey = "exceeded" | "on_track" | "behind" | "needs_attention" | "no_target";

function getStatus(actual: number, target: number): StatusKey {
  if (target <= 0) return "no_target";
  const pct = (actual / target) * 100;
  if (pct > 100) return "exceeded";
  if (pct >= 70) return "on_track";
  if (pct >= 40) return "behind";
  return "needs_attention";
}

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; dot: string }> = {
  exceeded: { label: "Exceeded", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500" },
  on_track: { label: "On Track", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", dot: "bg-blue-500" },
  behind: { label: "Behind Target", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-amber-500" },
  needs_attention: { label: "Needs Attention", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", dot: "bg-red-500" },
  no_target: { label: "No Target Set", color: "text-muted-foreground", bg: "bg-muted/30", dot: "bg-muted-foreground" },
};

function getProgressColor(status: StatusKey) {
  switch (status) {
    case "exceeded": return "[&>div]:bg-emerald-500";
    case "on_track": return "[&>div]:bg-blue-500";
    case "behind": return "[&>div]:bg-amber-500";
    case "needs_attention": return "[&>div]:bg-red-500";
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
  existingTarget?: TargetType;
  periodStart: string;
  periodType: PeriodType;
  onSave: (target: TargetType) => void;
}

function InlineTargetRow({ entityId, entityName, entityType, subtitle, actualRevenue, actualOrders, existingTarget, periodStart, periodType, onSave }: InlineTargetRowProps) {
  const [revInput, setRevInput] = useState<number | null>(existingTarget?.targetRevenue ?? null);
  const [ordInput, setOrdInput] = useState<number | null>(existingTarget?.targetOrders ?? null);
  const [dirty, setDirty] = useState(false);

  const targetRev = revInput ?? 0;
  const targetOrd = ordInput ?? 0;
  const revStatus = getStatus(actualRevenue, targetRev);
  const ordStatus = getStatus(actualOrders, targetOrd);
  const revPct = targetRev > 0 ? Math.min((actualRevenue / targetRev) * 100, 120) : 0;
  const ordPct = targetOrd > 0 ? Math.min((actualOrders / targetOrd) * 100, 120) : 0;
  const overallStatus = targetRev > 0 ? revStatus : (targetOrd > 0 ? ordStatus : "no_target");
  const sc = STATUS_CONFIG[overallStatus];

  const handleSave = useCallback(() => {
    if (!dirty) return;
    onSave({
      id: existingTarget?.id || "",
      entityType,
      entityId,
      entityName,
      periodType,
      periodStart,
      targetRevenue: targetRev,
      targetOrders: targetOrd,
    });
    setDirty(false);
    toast.success("Target saved", { description: `${entityName}'s ${periodType} target updated` });
  }, [dirty, existingTarget, entityType, entityId, entityName, periodStart, periodType, targetRev, targetOrd, onSave]);

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{entityName}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sc.color} ${sc.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          {dirty && (
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground font-medium">Revenue Target (₹)</label>
          <NumberInput
            allowDecimal
            allowEmpty
            min={0}
            value={revInput}
            onValueChange={(v) => { setRevInput(v); setDirty(true); }}
            onBlur={handleSave}
            placeholder="e.g. 100000"
            className="h-8 text-xs rounded-lg"
          />
          {targetRev > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Actual: {formatCurrency(actualRevenue)}</span>
                <span className={sc.color}>{Math.round((actualRevenue / targetRev) * 100)}%</span>
              </div>
              <Progress value={Math.min(revPct, 100)} className={`h-1.5 ${getProgressColor(revStatus)}`} />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground font-medium">Orders Target</label>
          <Input
            type="text"
            inputMode="numeric"
            value={ordInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*$/.test(v)) { setOrdInput(v); setDirty(true); }
            }}
            onBlur={handleSave}
            placeholder="e.g. 20"
            className="h-8 text-xs rounded-lg"
          />
          {targetOrd > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Actual: {actualOrders}</span>
                <span className={STATUS_CONFIG[ordStatus].color}>{Math.round((actualOrders / targetOrd) * 100)}%</span>
              </div>
              <Progress value={Math.min(ordPct, 100)} className={`h-1.5 ${getProgressColor(ordStatus)}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function Targets() {
  const api = useApi();
  const isLoading = usePageLoading(api.loading);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [period, setPeriod] = useState(getDefaultPeriodStart("monthly"));
  const [search, setSearch] = useState("");

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const dailyOptions = useMemo(() => getDailyOptions(), []);
  const weeklyOptions = useMemo(() => getWeeklyOptions(), []);

  const handlePeriodTypeChange = useCallback((pt: PeriodType) => {
    setPeriodType(pt);
    setPeriod(getDefaultPeriodStart(pt));
  }, []);

  const orders = api.orders.list();
  const dealers = api.dealers.list();
  const salespersons = api.salespersons.list();
  const targets = api.targets.list();

  const periodEnd = getPeriodEnd(periodType, period);

  const periodOrders = useMemo(() =>
    orders.filter(o => o.date >= period && o.date <= periodEnd),
    [orders, period, periodEnd]
  );

  const spActuals = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    periodOrders.forEach(o => {
      const cur = map.get(o.salespersonId) || { revenue: 0, orders: 0 };
      cur.revenue += o.total - (o.schemeSavings || 0);
      cur.orders += 1;
      map.set(o.salespersonId, cur);
    });
    return map;
  }, [periodOrders]);

  const dealerActuals = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    periodOrders.forEach(o => {
      const cur = map.get(o.distributorId) || { revenue: 0, orders: 0 };
      cur.revenue += o.total - (o.schemeSavings || 0);
      cur.orders += 1;
      map.set(o.distributorId, cur);
    });
    return map;
  }, [periodOrders]);

  const getTarget = useCallback((entityType: string, entityId: string) => {
    return targets.find(t =>
      t.entityType === entityType && t.entityId === entityId &&
      t.periodType === periodType && t.periodStart === period
    );
  }, [targets, period, periodType]);

  const handleSave = useCallback(async (target: TargetType) => {
    if (target.id) {
      await api.targets.update(target);
    } else {
      await api.targets.create(target);
    }
  }, [api.targets]);

  // Blocking page skeleton removed — empty-state handles first-paint.

  const dateOptions = periodType === "daily" ? dailyOptions : periodType === "weekly" ? weeklyOptions : monthOptions;

  const periodLabel = periodType === "daily"
    ? new Date(period).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
    : periodType === "weekly"
    ? `Week of ${new Date(period).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : new Date(period).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
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
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:w-56"
            >
              {dateOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        {(() => {
          const periodTargets = targets.filter(t => t.periodType === periodType && t.periodStart === period);
          const spTargets = periodTargets.filter(t => t.entityType === "salesperson");
          const dlTargets = periodTargets.filter(t => t.entityType === "dealer");
          const totalTargetRev = periodTargets.reduce((s, t) => s + t.targetRevenue, 0);
          const totalActualRev = periodOrders.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
          const overallPct = totalTargetRev > 0 ? Math.round((totalActualRev / totalTargetRev) * 100) : 0;
          const overallStatus = getStatus(totalActualRev, totalTargetRev);

          return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass-card p-3 md:p-4">
                <span className="text-[10px] text-muted-foreground md:text-xs">{PERIOD_TYPE_LABELS[periodType]} Target</span>
                <p className="mt-0.5 text-sm font-semibold md:text-base">{formatCurrency(totalTargetRev)}</p>
              </div>
              <div className="glass-card p-3 md:p-4">
                <span className="text-[10px] text-muted-foreground md:text-xs">Actual Revenue</span>
                <p className="mt-0.5 text-sm font-semibold md:text-base">{formatCurrency(totalActualRev)}</p>
              </div>
              <div className="glass-card p-3 md:p-4">
                <span className="text-[10px] text-muted-foreground md:text-xs">Overall Progress</span>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className={`text-sm font-semibold md:text-base ${STATUS_CONFIG[overallStatus].color}`}>{overallPct}%</p>
                  {overallStatus === "exceeded" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {overallStatus === "needs_attention" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div className="glass-card p-3 md:p-4">
                <span className="text-[10px] text-muted-foreground md:text-xs">Targets Set</span>
                <p className="mt-0.5 text-sm font-semibold md:text-base">{spTargets.length + dlTargets.length} / {salespersons.length + dealers.length}</p>
              </div>
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
                const actual = spActuals.get(sp.id) || { revenue: 0, orders: 0 };
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
                    existingTarget={existingTarget}
                    periodStart={period}
                    periodType={periodType}
                    onSave={handleSave}
                  />
                );
              })
            ) : (
              <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">{q ? "No matching team members" : "No team members yet"}</p>
                <p className="text-xs text-muted-foreground">{q ? "Try a different search term" : "Add your sales team to start setting targets"}</p>
                {!q && (
                  <Link to="/salespersons">
                    <Button size="sm" className="mt-3">
                      <Plus className="h-4 w-4" />
                      Add Team Member
                    </Button>
                  </Link>
                )}
              </div>
            );
            })()}
          </TabsContent>

          <TabsContent value="dealers" className="space-y-3">
            {(() => {
              const q = search.toLowerCase();
              const filtered = q ? dealers.filter(d => d.name.toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q)) : dealers;
              return filtered.length > 0 ? (
              filtered.map(d => {
                const actual = dealerActuals.get(d.id) || { revenue: 0, orders: 0 };
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
                    existingTarget={existingTarget}
                    periodStart={period}
                    periodType={periodType}
                    onSave={handleSave}
                  />
                );
              })
            ) : (
              <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
                <MapPin className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">{q ? "No matching dealers" : "No dealers yet"}</p>
                <p className="text-xs text-muted-foreground">{q ? "Try a different search term" : "Add your dealer network to start setting targets"}</p>
                {!q && (
                  <Link to="/distributors">
                    <Button size="sm" className="mt-3">
                      <Plus className="h-4 w-4" />
                      Add Dealer
                    </Button>
                  </Link>
                )}
              </div>
            );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
