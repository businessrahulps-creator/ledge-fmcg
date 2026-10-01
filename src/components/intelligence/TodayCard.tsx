import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageCircle, ChevronDown, Check, Clock, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addDaysToKey } from "@/utils/dateKey";
import type { IntelCard, IntelAction } from "@/lib/intelligence";

const KIND_LABEL: Record<IntelCard["kind"], string> = {
  collect: "Collect money",
  order: "Send order",
  dealer: "Dealer buying less",
  stock: "Stock running out",
  slow: "Slow stock",
};

const digits = (p?: string) => (p || "").replace(/\D/g, "").replace(/^0+/, "");
const waNumber = (p?: string) => { const d = digits(p); return d.length === 10 ? "91" + d : d; };

export function TodayCard({
  card, today, companyName, showKind, onAct,
}: {
  card: IntelCard;
  today: string;
  companyName?: string;
  showKind?: boolean;
  onAct: (card: IntelCard, state: IntelAction["state"], untilDate?: string, amount?: number) => Promise<boolean>;
}) {
  const [why, setWhy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [promise, setPromise] = useState(false);
  const [promiseDate, setPromiseDate] = useState(addDaysToKey(today, 7));
  const phone = digits(card.phone);
  const due = Number(card.meta?.due || 0);
  const message = `Namaste ${card.title}, this is a friendly reminder from ${companyName || "us"}. Your unpaid amount is ₹${due.toLocaleString("en-IN")}. Please share when you can pay. Thank you.`;

  return (
    <article className="rounded-md border border-border bg-card p-4">
      {showKind && (
        <p className="text-[11px] font-medium text-muted-foreground mb-1">{KIND_LABEL[card.kind]}</p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={card.link} className="font-semibold text-foreground hover:underline underline-offset-4 break-words">
            {card.title}
          </Link>
          {card.salesperson && <p className="text-xs text-muted-foreground mt-0.5">{card.salesperson}'s dealer</p>}
          <p className="text-sm text-foreground/85 mt-1.5">{card.fact}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setWhy(v => !v)}
        aria-expanded={why}
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground min-h-[32px]"
      >
        Why am I seeing this?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${why ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {why && (
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
          {card.why.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {card.kind === "collect" && phone && (
          <>
            <Button asChild size="sm" variant="outline" className="h-10 sm:h-8">
              <a href={`tel:${phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
            </Button>
            <Button size="sm" variant="outline" className="h-10 sm:h-8" onClick={() => setPreview(true)}>
              <MessageCircle className="h-3.5 w-3.5" /> Send reminder
            </Button>
          </>
        )}
        {card.kind === "dealer" && phone && (
          <Button asChild size="sm" variant="outline" className="h-10 sm:h-8">
            <a href={`tel:${phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
          </Button>
        )}
        {card.kind === "collect" && (
          <Button size="sm" variant="outline" className="h-10 sm:h-8" onClick={() => setPromise(true)}>
            <HandCoins className="h-3.5 w-3.5" /> Promised to pay
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-10 sm:h-8" onClick={() => onAct(card, "snoozed", addDaysToKey(today, 1))}>
          <Clock className="h-3.5 w-3.5" /> Remind me tomorrow
        </Button>
        <Button size="sm" variant="ghost" className="h-10 sm:h-8" onClick={() => onAct(card, "done")}>
          <Check className="h-3.5 w-3.5" /> Done
        </Button>
      </div>

      <Sheet open={preview} onOpenChange={setPreview}>
        <SheetContent side="bottom" className="max-w-lg mx-auto">
          <SheetHeader><SheetTitle>Check the message before sending</SheetTitle></SheetHeader>
          <p className="mt-3 text-sm whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3">{message}</p>
          <p className="mt-2 text-xs text-muted-foreground">Sends to {card.phone}. WhatsApp opens so you can send it yourself.</p>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPreview(false)}>Close</Button>
            <Button asChild onClick={() => setPreview(false)}>
              <a href={`https://wa.me/${waNumber(card.phone)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
                Open WhatsApp
              </a>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={promise} onOpenChange={setPromise}>
        <SheetContent side="bottom" className="max-w-lg mx-auto">
          <SheetHeader><SheetTitle>When did they promise to pay?</SheetTitle></SheetHeader>
          <p className="mt-2 text-sm text-muted-foreground">We'll hide this dealer until that day, then remind you.</p>
          <Input type="date" className="mt-3" min={today} value={promiseDate} onChange={e => setPromiseDate(e.target.value)} />
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPromise(false)}>Close</Button>
            <Button
              disabled={!promiseDate || promiseDate < today}
              onClick={async () => { if (await onAct(card, "promised", promiseDate, due)) setPromise(false); }}
            >
              Save promise
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </article>
  );
}
