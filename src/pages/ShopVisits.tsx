import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Phone, Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "sonner";
import { useApi } from "@/services/api";
import { useCan } from "@/hooks/useCan";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
import { todayKey } from "@/utils/dateKey";
import { cn } from "@/lib/utils";
import { OUTCOME_LABEL, STAGE_LABEL, useShopVisits, type ProspectStage, type ShopVisit } from "@/hooks/useShopVisits";
import { AddShopDialog, AddVisitDialog } from "@/components/visits/VisitDialogs";

type Tab = "visits" | "promises" | "new";
const dayGap = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000);

function ago(days: number | null, none: string) {
  if (days == null) return none;
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function ShopVisits() {
  const api = useApi();
  const navigate = useNavigate();
  const canSeeMoney = useCan("see_money");
  const dealers = api.dealers.list();
  const orders = api.orders.list();
  const v = useShopVisits();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "visits";
  const setTab = (t: string) => setParams(t === "visits" ? {} : { tab: t }, { replace: true });
  const [q, setQ] = useState("");
  const [visitFor, setVisitFor] = useState<{ id: string; name: string } | null>(null);
  const [addShop, setAddShop] = useState(false);
  const [stageFilter, setStageFilter] = useState<"open" | "converted" | "not_interested">("open");
  const today = todayKey();

  const dealerName = useMemo(() => new Map(dealers.map(d => [d.id, d.name])), [dealers]);

  // One row per dealer: when they last ordered and when someone last visited.
  const rows = useMemo(() => {
    const lastOrder = new Map<string, string>();
    for (const o of orders) {
      if (o.cancelledAt) continue;
      const prev = lastOrder.get(o.distributorId);
      if (!prev || o.date > prev) lastOrder.set(o.distributorId, o.date);
    }
    const lastVisit = new Map<string, ShopVisit>();
    for (const x of v.visits) if (!lastVisit.has(x.distributorId)) lastVisit.set(x.distributorId, x);
    const term = q.trim().toLowerCase();
    return dealers
      .filter(d => !term || d.name.toLowerCase().includes(term) || (d.location || "").toLowerCase().includes(term))
      .map(d => {
        const lo = lastOrder.get(d.id) ?? null;
        const lv = lastVisit.get(d.id) ?? null;
        return {
          d, lastOrderDays: lo ? dayGap(lo, today) : null,
          lastVisit: lv, lastVisitDays: lv ? dayGap(lv.createdAt.slice(0, 10), today) : null,
        };
      })
      // Shops that have gone quiet the longest come first.
      .sort((a, b) => (b.lastOrderDays ?? 9999) - (a.lastOrderDays ?? 9999) || a.d.name.localeCompare(b.d.name));
  }, [dealers, orders, v.visits, q, today]);

  const visitedToday = useMemo(() => new Set(v.visits.filter(x => x.createdAt.slice(0, 10) === today).map(x => x.distributorId)).size, [v.visits, today]);
  const quiet = rows.filter(r => r.lastOrderDays == null || r.lastOrderDays >= 30).length;

  const promises = useMemo(() => {
    const open = v.visits.filter(x => x.promiseStatus === "open" && x.promiseDate);
    const term = q.trim().toLowerCase();
    const list = open.filter(x => !term || (dealerName.get(x.distributorId) || "").toLowerCase().includes(term));
    const sorted = list.sort((a, b) => a.promiseDate!.localeCompare(b.promiseDate!));
    return {
      late: sorted.filter(x => x.promiseDate! < today),
      due: sorted.filter(x => x.promiseDate === today),
      later: sorted.filter(x => x.promiseDate! > today),
    };
  }, [v.visits, q, today, dealerName]);
  const promiseCount = promises.late.length + promises.due.length + promises.later.length;

  const shops = useMemo(() => {
    const term = q.trim().toLowerCase();
    return v.prospects
      .filter(p => stageFilter === "open" ? (p.stage === "found" || p.stage === "talked") : p.stage === stageFilter)
      .filter(p => !term || [p.name, p.area, p.ownerName, p.shopType].some(s => s.toLowerCase().includes(term)));
  }, [v.prospects, q, stageFilter]);

  const convert = async (id: string, name: string) => {
    const dealerId = await v.convert(id);
    if (dealerId) {
      toast.success(`${name} is now a dealer`);
      navigate(`/orders/new?dealer=${dealerId}`);
    }
  };

  const PromiseRow = ({ x }: { x: ShopVisit }) => {
    const late = x.promiseDate! < today;
    return (
      <div className="rounded-md border border-border bg-card p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/distributors/${x.distributorId}`} className="font-medium text-foreground hover:underline">
              {dealerName.get(x.distributorId) || "Dealer"}
            </Link>
            <p className="text-sm text-muted-foreground">
              {x.outcome === "promised_payment" ? `Will pay ${formatCurrency(x.promiseAmount || 0)}` : "Will place an order"}
              {" · "}<span className={cn(late && "text-destructive font-medium")}>
                {x.promiseDate === today ? "today" : late ? `was due ${formatIndianDate(x.promiseDate)}` : formatIndianDate(x.promiseDate)}
              </span>
            </p>
            {x.note && <p className="text-sm text-foreground mt-1">“{x.note}”</p>}
            <p className="text-xs text-muted-foreground mt-1">Noted by {x.createdByName || "someone"} on {formatIndianDate(x.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={async () => { if (await v.setPromiseStatus(x.id, "kept")) toast.success("Marked as kept"); }}>They kept it</Button>
          <Button size="sm" variant="outline" onClick={async () => { if (await v.setPromiseStatus(x.id, "broken")) toast.success("Marked as not kept"); }}>Didn't happen</Button>
          {x.outcome === "promised_order" && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/orders/new?dealer=${x.distributorId}`)}>Take order</Button>
          )}
        </div>
      </div>
    );
  };

  const Group = ({ title, list }: { title: string; list: ShopVisit[] }) => list.length === 0 ? null : (
    <section className="space-y-2" aria-label={title}>
      <h2 className="text-sm font-semibold text-foreground">{title} <span className="font-normal text-muted-foreground">({list.length})</span></h2>
      <div className="grid gap-3 md:grid-cols-2">{list.map(x => <PromiseRow key={x.id} x={x} />)}</div>
    </section>
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <PageHeader
          title="Shop visits"
          subtitle="Who to visit, what they promised, and new shops to win."
          actions={<Button onClick={() => setAddShop(true)}><Plus className="h-4 w-4" /> Add new shop</Button>}
        />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Visited today", value: visitedToday },
            { label: "Promises waiting", value: promiseCount },
            { label: "No order in 30+ days", value: quiet },
          ].map(k => (
            <div key={k.label} className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{v.loading && !v.loaded ? "–" : k.value}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="promises">Promises{promiseCount ? ` (${promiseCount})` : ""}</TabsTrigger>
              <TabsTrigger value="new">New shops</TabsTrigger>
            </TabsList>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search shop or area" className="pl-9" aria-label="Search shop or area" />
            </div>
          </div>

          <TabsContent value="visits" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">Shops that haven't ordered for the longest time are at the top.</p>
            {dealers.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                No dealers yet. Add a dealer first, or add a new shop with the button above.
              </p>
            ) : rows.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">No shop matches “{q}”.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {rows.slice(0, 200).map(({ d, lastOrderDays, lastVisit, lastVisitDays }) => (
                  <div key={d.id} className="rounded-md border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/distributors/${d.id}`} className="font-medium text-foreground hover:underline">{d.name}</Link>
                        {d.location && <p className="text-xs text-muted-foreground truncate">{d.location}</p>}
                      </div>
                      {canSeeMoney && d.outstandingAmount > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Unpaid</p>
                          <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(d.outstandingAmount)}</p>
                        </div>
                      )}
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Last order</dt>
                        <dd className={cn("text-foreground", (lastOrderDays == null || lastOrderDays >= 30) && "font-medium text-destructive")}>
                          {ago(lastOrderDays, "Never ordered")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Last visit</dt>
                        <dd className="text-foreground">
                          {lastVisit ? <>{ago(lastVisitDays, "")} · <span className="text-muted-foreground">{OUTCOME_LABEL[lastVisit.outcome]}</span></> : "Not visited yet"}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setVisitFor({ id: d.id, name: d.name })}>Add visit</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/orders/new?dealer=${d.id}`)}>Take order</Button>
                      {d.contact && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`tel:${d.contact.replace(/\s/g, "")}`} aria-label={`Call ${d.name}`}><Phone className="h-4 w-4" /> Call</a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rows.length > 200 && <p className="text-xs text-muted-foreground">Showing 200 of {rows.length}. Search to find a shop.</p>}
          </TabsContent>

          <TabsContent value="promises" className="space-y-5 mt-4">
            {promiseCount === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                No promises waiting. When a shop says “I'll pay on Friday”, tap Add visit → Promised to pay. It will show here and in Today's work on that day.
              </p>
            ) : (
              <>
                <Group title="Late" list={promises.late} />
                <Group title="Due today" list={promises.due} />
                <Group title="Coming up" list={promises.later} />
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-3 mt-4">
            <SegmentedControl
              label="Show shops"
              value={stageFilter}
              onChange={setStageFilter}
              options={[
                { value: "open", label: "Working on" },
                { value: "converted", label: "Became dealers" },
                { value: "not_interested", label: "Not interested" },
              ]}
            />
            {shops.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                {stageFilter === "open" ? "No new shops yet. Found a shop that doesn't buy from you? Tap Add new shop." : "Nothing here yet."}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {shops.map(p => (
                  <div key={p.id} className="rounded-md border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.shopType, p.area, p.ownerName].filter(Boolean).join(" · ") || "No details"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-foreground">{STAGE_LABEL[p.stage as ProspectStage]}</span>
                    </div>
                    {p.note && <p className="text-sm text-foreground">“{p.note}”</p>}
                    <p className="text-xs text-muted-foreground">Added by {p.createdByName || "someone"} on {formatIndianDate(p.createdAt)}</p>
                    <div className="flex flex-wrap gap-2">
                      {(p.stage === "found" || p.stage === "talked") && (
                        <>
                          <Button size="sm" onClick={() => convert(p.id, p.name)}>Make dealer</Button>
                          {p.stage === "found" && (
                            <Button size="sm" variant="outline" onClick={async () => { if (await v.setStage(p.id, "talked")) toast.success("Moved to Talked to them"); }}>Talked to them</Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={async () => { if (await v.setStage(p.id, "not_interested")) toast.success("Moved to Not interested"); }}>Not interested</Button>
                        </>
                      )}
                      {p.stage === "not_interested" && (
                        <Button size="sm" variant="outline" onClick={async () => { if (await v.setStage(p.id, "found")) toast.success("Moved back to Working on"); }}>Try again</Button>
                      )}
                      {p.stage === "converted" && p.convertedDistributorId && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/distributors/${p.convertedDistributorId}`)}>Open dealer</Button>
                      )}
                      {p.phone && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`tel:${p.phone.replace(/\s/g, "")}`} aria-label={`Call ${p.name}`}><Phone className="h-4 w-4" /> Call</a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddVisitDialog open={!!visitFor} onOpenChange={o => !o && setVisitFor(null)} dealerId={visitFor?.id ?? null} dealerName={visitFor?.name ?? ""} />
      <AddShopDialog open={addShop} onOpenChange={setAddShop} />
    </AppLayout>
  );
}
