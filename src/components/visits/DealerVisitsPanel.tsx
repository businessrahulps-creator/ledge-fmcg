import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
import { OUTCOME_LABEL, useShopVisits } from "@/hooks/useShopVisits";
import { AddVisitDialog } from "./VisitDialogs";

const PROMISE_WORD = { none: "", open: "Waiting", kept: "Kept", broken: "Didn't happen" } as const;

/** "Visits & promises" history on a dealer's page. */
export function DealerVisitsPanel({ dealerId, dealerName }: { dealerId: string; dealerName: string }) {
  const { visits, loaded } = useShopVisits();
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const mine = visits.filter(v => v.distributorId === dealerId);
  const shown = all ? mine : mine.slice(0, 5);

  return (
    <section className="rounded-md border border-border bg-card p-4 space-y-3" aria-label="Visits and promises">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Visits & promises</h2>
        <Button size="sm" onClick={() => setOpen(true)}>Add visit</Button>
      </div>
      {!loaded ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">No visits noted yet. After you visit or call this shop, tap Add visit.</p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map(v => (
            <li key={v.id} className="py-2 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-foreground">
                  {OUTCOME_LABEL[v.outcome]}
                  {v.outcome === "promised_payment" && v.promiseAmount ? ` · ${formatCurrency(v.promiseAmount)}` : ""}
                  {v.promiseDate ? ` · by ${formatIndianDate(v.promiseDate)}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">{formatIndianDate(v.createdAt)} · {v.createdByName || "someone"}</span>
              </div>
              {v.promiseStatus !== "none" && <p className="text-xs text-muted-foreground">Promise: {PROMISE_WORD[v.promiseStatus]}</p>}
              {v.note && <p className="text-foreground mt-0.5">“{v.note}”</p>}
            </li>
          ))}
        </ul>
      )}
      {mine.length > 5 && (
        <Button variant="ghost" size="sm" onClick={() => setAll(a => !a)}>{all ? "Show fewer" : `See all ${mine.length}`}</Button>
      )}
      <AddVisitDialog open={open} onOpenChange={setOpen} dealerId={dealerId} dealerName={dealerName} />
    </section>
  );
}
