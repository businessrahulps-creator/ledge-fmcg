import { useEffect, useMemo, useState } from "react";
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
import {
  deriveSignals,
  dispatchedRevenue,
  getPeriodRange,
  type CommandPeriod,
} from "@/lib/command-signals";

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
  const signals = useMemo(
    () => deriveSignals({ orders, distributors, salespersons, targets, range }),
    [orders, distributors, salespersons, targets, range],
  );

  const revenue = useMemo(() => dispatchedRevenue(orders, range), [orders, range]);

  const updateParam = (next: Partial<{ tab: TabId; period: CommandPeriod; from?: string; to?: string }>) => {
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
      if (next.from) params.set("from", next.from);
      else params.delete("from");
    }
    if (next.to !== undefined) {
      if (next.to) params.set("to", next.to);
      else params.delete("to");
    }
    setSearch(params, { replace: false });
  };

  const companyName = api.companyInfo?.name?.trim() || "My Business";

  return (
    <AppLayout>
      <div className="w-full min-w-0 space-y-4 overflow-x-hidden md:space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="h1-display">{companyName}</h1>
          </div>
          <PeriodSelector
            period={period}
            customFrom={customFrom}
            customTo={customTo}
            range={range}
            onChange={(p, f, t) => updateParam({ period: p, from: f, to: t })}
          />
        </div>

        {safeTab === "overview" && (
          <CommandMemoryStrip
            period={period}
            revenue={revenue}
            signalCount={signals.length}
            ready={!api.loading}
          />
        )}

        <SignalBar signals={signals} lastUpdated={lastUpdated} />

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

          <TabsContent value="overview"><OverviewTab range={range} /></TabsContent>
          {!isAccountant && <TabsContent value="people"><PeopleTab range={range} /></TabsContent>}
          {!isAccountant && <TabsContent value="products"><ProductsTab range={range} /></TabsContent>}
          <TabsContent value="drill"><DrillDownTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
