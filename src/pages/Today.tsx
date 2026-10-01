import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NumberInput } from "@/components/ui/number-input";
import { useTodaysWork } from "@/hooks/useTodaysWork";
import { useCan } from "@/hooks/useCan";
import { useApi } from "@/services/api";
import { TodayCard } from "@/components/intelligence/TodayCard";
import type { IntelCard, IntelSettings } from "@/lib/intelligence";

function Section({ title, hint, cards, empty, render, limit = 5 }: {
  title: string; hint: string; cards: IntelCard[]; empty: string;
  render: (c: IntelCard) => JSX.Element; limit?: number;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? cards : cards.slice(0, limit);
  return (
    <section className="space-y-3" aria-label={title}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title} <span className="text-muted-foreground font-normal">({cards.length})</span></h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border p-4">{empty}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{shown.map(render)}</div>
      )}
      {cards.length > limit && (
        <Button variant="ghost" size="sm" onClick={() => setAll(v => !v)}>
          {all ? "Show fewer" : `See all ${cards.length}`}
        </Button>
      )}
    </section>
  );
}

function minutesAgo(d: Date) {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  return m <= 0 ? "just now" : `${m} minute${m === 1 ? "" : "s"} ago`;
}

export default function Today() {
  const w = useTodaysWork();
  const api = useApi();
  const companyName = (api.companyInfo as any)?.name as string | undefined;
  const canEdit = useCan("manage_team");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<IntelSettings>(w.settings);
  const [, tick] = useState(0);
  useEffect(() => setDraft(w.settings), [w.settings]);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 60000); return () => clearInterval(t); }, []);

  const card = (showKind = false) => (c: IntelCard) => (
    <TodayCard key={c.subjectId} card={c} today={w.today} companyName={companyName} showKind={showKind} onAct={w.act} />
  );
  const ready = w.orders.filter(c => c.meta?.ready);
  const summary = `Today: ${w.collect.length} dealer${w.collect.length === 1 ? "" : "s"} to collect from, ${ready.length} order${ready.length === 1 ? "" : "s"} ready to send, ${w.low.length} product${w.low.length === 1 ? "" : "s"} running out.`;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 space-y-8">
        <PageHeader
          title="Today's work"
          subtitle={w.loading ? "Working out today's list…" : `${summary} Updated ${minutesAgo(w.updatedAt)}.`}
          actions={canEdit ? (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Settings2 className="h-4 w-4" /> Settings</Button>
          ) : undefined}
        />

        <Section
          title="Do these first"
          hint="The 3 things with the most money at stake right now."
          cards={w.top}
          empty="Nothing urgent today. Nice work."
          render={card(true)}
          limit={3}
        />
        <Section
          title="Collect money"
          hint="Dealers with old unpaid bills come first, not just the biggest amounts."
          cards={w.collect}
          empty="No dealer owes you money right now."
          render={card()}
        />
        <Section
          title="Orders waiting to be sent"
          hint={`Orders not sent after ${w.settings.lateDays} days. Ready ones come first.`}
          cards={w.orders}
          empty="No order is waiting too long."
          render={card()}
        />
        <Section
          title="Dealers buying less"
          hint="Compared with each dealer's own usual buying. Needs at least 4 orders over 2 months."
          cards={w.dealers}
          empty="No dealer is buying much less than usual. Or there isn't enough history yet."
          render={card()}
        />
        <Section
          title="Stock running out"
          hint={`Products that will last under ${w.settings.runwayDays} days at the last 30 days' speed. This is an estimate.`}
          cards={w.low}
          empty="No product is about to run out."
          render={card()}
        />
        <Section
          title="Slow stock"
          hint="In stock, but not sent to any dealer for 60 days or more."
          cards={w.slow}
          empty="Everything in stock has sold in the last 60 days."
          render={card()}
          limit={4}
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Today's work settings</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            {([
              ["lateDays", "Order is late after (days)", 1, 60],
              ["runwayDays", "Warn when stock lasts under (days)", 1, 90],
              ["dropPct", "Dealer is slowing down if sales drop by (%)", 10, 90],
            ] as const).map(([k, label, min, max]) => (
              <label key={k} className="block space-y-1.5">
                <span className="text-sm font-medium">{label}</span>
                <NumberInput value={draft[k]} min={min} max={max} onChange={(v: number) => setDraft(d => ({ ...d, [k]: v }))} />
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
              <Button onClick={async () => { if (await w.saveSettings(draft)) setOpen(false); }}>Save settings</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
