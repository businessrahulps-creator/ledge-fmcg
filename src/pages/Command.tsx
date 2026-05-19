import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/services/api";
import { PeriodSelector } from "@/components/command/PeriodSelector";
import { SignalBar } from "@/components/command/SignalBar";
import { CommandMemoryStrip } from "@/components/command/CommandMemoryStrip";
import { OverviewTab } from "@/components/command/tabs/OverviewTab";
import { PeopleTab } from "@/components/command/tabs/PeopleTab";
import { ProductsTab } from "@/components/command/tabs/ProductsTab";
import { DrillDownTab } from "@/components/command/tabs/DrillDownTab";
import { WhatsAppBlastSheet } from "@/components/command/WhatsAppBlastSheet";
import { SavedViewsMenu, PinnedViewChips } from "@/components/command/SavedViewsMenu";
import { PrintButton } from "@/components/command/PrintButton";
import { KeyboardCheatSheet } from "@/components/command/KeyboardCheatSheet";
import { useCommandShortcuts } from "@/hooks/useCommandShortcuts";
import { useDensityPreference } from "@/hooks/useDensityPreference";
import { useSignalAcks, useTeammates, activeAcksMap, shouldHideSignal } from "@/lib/command-acks";
import {
  deriveSignals,
  dispatchedRevenue,
  getPeriodRange,
  ordersInPeriod,
  type CommandPeriod,
} from "@/lib/command-signals";
import "@/styles/command-print.css";

type TabId = "overview" | "people" | "products" | "drill";

const VALID_TABS: TabId[] = ["overview", "people", "products", "drill"];
const VALID_PERIODS: CommandPeriod[] = ["today", "7d", "30d", "90d", "ytd", "custom"];

export default function Command() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const api = useApi();

  // Salespeople bounce to dashboard — Command is owner/manager surface.
  if (userRole === "salesperson") return <Navigate to="/dashboard" replace />;

  // URL state
  const rawTab = (search.get("tab") as TabId) || "overview";
  const tab: TabId = VALID_TABS.includes(rawTab) ? rawTab : "overview";
  const rawPeriod = (search.get("period") as CommandPeriod) || "30d";
  const period: CommandPeriod = VALID_PERIODS.includes(rawPeriod) ? rawPeriod : "30d";
  const customFrom = search.get("from") || undefined;
  const customTo = search.get("to") || undefined;

  // Accountant: hide People + Products, force tab to allowed set
  const isAccountant = userRole === "accountant";
  const allowedTabs: TabId[] = isAccountant ? ["overview", "drill"] : VALID_TABS;
  const safeTab: TabId = allowedTabs.includes(tab) ? tab : "overview";

  const range = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);

  // Last-updated timestamp — bumps each time DataContext finishes a load.
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!api.loading) setLastUpdated(new Date());
  }, [api.loading]);

  // Signals (recomputed on period + data changes)
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const salespersons = api.salespersons.list();
  const targets = api.targets.list();
  const allSignals = useMemo(
    () => deriveSignals({ orders, distributors, salespersons, targets, range }),
    [orders, distributors, salespersons, targets, range],
  );

  // Acknowledgements (snooze / assign / resolve) + filter hidden signals
  const { acks, snooze, assign, resolve, clear } = useSignalAcks();
  const teammates = useTeammates();
  const acksMap = useMemo(() => activeAcksMap(acks), [acks]);
  const teammateLookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teammates) m.set(t.user_id, t.full_name);
    return m;
  }, [teammates]);
  const signals = useMemo(
    () => allSignals.filter((s) => !shouldHideSignal(acksMap.get(s.id))),
    [allSignals, acksMap],
  );

  const revenue = useMemo(() => dispatchedRevenue(orders, range), [orders, range]);

  // WhatsApp blast — which signals support it + the dealer set per blast
  const blastableIds = useMemo(() => new Set(["dormant-owing", "dormant", "credit-risk"]), []);
  const [blastSignalId, setBlastSignalId] = useState<string | null>(null);
  const blastPayload = useMemo(() => {
    if (!blastSignalId) return null;
    const periodOrders = ordersInPeriod(orders, range);
    const lastByDealer = new Map<string, Date>();
    for (const o of orders) {
      const d = new Date(o.date);
      const cur = lastByDealer.get(o.distributorId);
      if (!cur || d > cur) lastByDealer.set(o.distributorId, d);
    }
    if (blastSignalId === "dormant") {
      const dealers = distributors.filter((d) => {
        if (d.totalOrders === 0) return false;
        const last = lastByDealer.get(d.id);
        return !last || last < range.from;
      });
      return {
        title: "Re-engage dormant dealers",
        description: `Message ${dealers.length} dealer${dealers.length === 1 ? "" : "s"} who stopped ordering this period.`,
        dealers,
        defaultTemplate:
          "Hi {dealer_name}, we noticed your last order was on {last_order_date}. Anything we can do to help you restock? Reply to this message and we'll arrange it.",
      };
    }
    if (blastSignalId === "dormant-owing") {
      const dealers = distributors.filter((d) => {
        if ((d.outstandingAmount || 0) <= 0) return false;
        if (d.totalOrders === 0) return false;
        const last = lastByDealer.get(d.id);
        return !last || last < range.from;
      });
      return {
        title: "Chase silent & owing dealers",
        description: `${dealers.length} dealer${dealers.length === 1 ? "" : "s"} have outstanding balance and stopped ordering.`,
        dealers,
        defaultTemplate:
          "Hi {dealer_name}, a friendly reminder — outstanding balance is {outstanding}. Your last order was on {last_order_date}. Please share a settlement date so we can resume supply.",
      };
    }
    if (blastSignalId === "credit-risk") {
      const dealers = distributors.filter(
        (d) => d.creditLimit > 0 && d.outstandingAmount / d.creditLimit >= 0.9,
      );
      return {
        title: "Notify credit-blocked dealers",
        description: `${dealers.length} dealer${dealers.length === 1 ? "" : "s"} are at 90%+ of credit limit.`,
        dealers,
        defaultTemplate:
          "Hi {dealer_name}, you're nearing your credit limit (outstanding {outstanding}). Please clear part of the balance to keep orders flowing.",
      };
    }
    return null;
  }, [blastSignalId, orders, distributors, range]);

  const updateParam = useCallback((next: Partial<{ tab: TabId; period: CommandPeriod; from?: string; to?: string }>) => {
    const params = new URLSearchParams(search);
    if (next.tab !== undefined) params.set("tab", next.tab);
    if (next.period !== undefined) {
      params.set("period", next.period);
      if (next.period !== "custom") {
        params.delete("from");
        params.delete("to");
      }
    }
    if (next.from !== undefined) {
      if (next.from) params.set("from", next.from); else params.delete("from");
    }
    if (next.to !== undefined) {
      if (next.to) params.set("to", next.to); else params.delete("to");
    }
    setSearch(params, { replace: false });
  }, [search, setSearch]);

  const companyName = api.companyInfo?.name?.trim() || "My Business";

  // Density + shortcuts + cheat sheet
  const { density, toggle: toggleDensity } = useDensityPreference();
  const [cheatOpen, setCheatOpen] = useState(false);

  useCommandShortcuts({
    onGoOverview: () => updateParam({ tab: "overview" }),
    onGoPeople: () => !isAccountant && updateParam({ tab: "people" }),
    onGoProducts: () => !isAccountant && updateParam({ tab: "products" }),
    onGoReports: () => updateParam({ tab: "drill" }),
    onPeriod: (p) => updateParam({ period: p as CommandPeriod }),
    onPrint: () => window.print(),
    onToggleCheatSheet: () => setCheatOpen((v) => !v),
    onToggleDensity: toggleDensity,
  });

  const currentParams = { period, from: customFrom, to: customTo, tab: safeTab };
  const currentParamString = new URLSearchParams(
    Object.entries(currentParams).filter(([, v]) => v != null) as [string, string][],
  ).toString();

  // Keep last non-null blast payload so the Sheet has data to render during its
  // close animation. Unmounting Radix's Sheet while it's still open leaks
  // `body { pointer-events: none }` and breaks page scrolling.
  const lastBlastPayloadRef = useRef(blastPayload);
  if (blastPayload) lastBlastPayloadRef.current = blastPayload;
  const renderedBlast = blastPayload ?? lastBlastPayloadRef.current;

  return (
    <AppLayout>
      <section
        data-command-root
        data-density={density}
        className="w-full min-w-0 space-y-4 overflow-x-hidden md:space-y-6"
        aria-label="My Business"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="h1-display">{companyName}</h1>
            <p data-print-only className="mt-1 text-xs text-muted-foreground">
              Period: {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()} · Generated {new Date().toLocaleString()}
            </p>
          </div>
          <div className="command-no-print flex flex-wrap items-end gap-2" aria-label="View controls">
            <SavedViewsMenu currentParams={currentParams} />
            <button
              type="button"
              onClick={toggleDensity}
              aria-label={density === "dense" ? "Switch to comfortable density" : "Switch to compact density"}
              title="Toggle density (D)"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {density === "dense" ? "Compact" : "Comfortable"}
            </button>
            <PrintButton />
            <nav aria-label="Period" className="contents">
              <PeriodSelector
                period={period}
                customFrom={customFrom}
                customTo={customTo}
                range={range}
                onChange={(p, f, t) => updateParam({ period: p, from: f, to: t })}
              />
            </nav>
          </div>
        </div>

        <PinnedViewChips currentParamString={currentParamString} />

        {safeTab === "overview" && (
          <CommandMemoryStrip
            period={period}
            revenue={revenue}
            signalCount={signals.length}
            ready={!api.loading}
          />
        )}

        <SignalBar
          signals={signals}
          lastUpdated={lastUpdated}
          acks={acksMap}
          teammateLookup={teammateLookup}
          onSnooze={(id, days) => snooze(id, days)}
          onAssign={(id, uid, uname) => assign(id, uid, uname)}
          onResolve={(id) => resolve(id)}
          onClear={(id) => clear(id)}
          blastableIds={blastableIds}
          onBlast={(id) => setBlastSignalId(id)}
        />

        {renderedBlast && (
          <WhatsAppBlastSheet
            open={!!blastSignalId}
            onClose={() => setBlastSignalId(null)}
            title={renderedBlast.title}
            description={renderedBlast.description}
            dealers={renderedBlast.dealers}
            orders={orders}
            defaultTemplate={renderedBlast.defaultTemplate}
          />
        )}

        <Tabs value={safeTab} onValueChange={(v) => updateParam({ tab: v as TabId })} className="w-full min-w-0 space-y-4 md:space-y-6">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide">
            <TabsList className="inline-flex h-10 min-w-max justify-start rounded-lg bg-muted/50 p-1 md:h-11">
              <TabsTrigger value="overview" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:px-4 md:py-2 md:text-sm">
                Overview
              </TabsTrigger>
              {!isAccountant && (
                <TabsTrigger value="people" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:px-4 md:py-2 md:text-sm">
                  People
                </TabsTrigger>
              )}
              {!isAccountant && (
                <TabsTrigger value="products" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:px-4 md:py-2 md:text-sm">
                  Products
                </TabsTrigger>
              )}
              <TabsTrigger value="drill" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:px-4 md:py-2 md:text-sm">
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview"><OverviewTab range={range} period={period} /></TabsContent>
          {!isAccountant && <TabsContent value="people"><PeopleTab range={range} /></TabsContent>}
          {!isAccountant && <TabsContent value="products"><ProductsTab range={range} /></TabsContent>}
          <TabsContent value="drill"><DrillDownTab /></TabsContent>
        </Tabs>
      </main>
      <KeyboardCheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />
    </AppLayout>
  );
}
