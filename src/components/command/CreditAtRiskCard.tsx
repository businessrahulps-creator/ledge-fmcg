import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, MessageCircle } from "lucide-react";
import { formatCurrency, type Distributor } from "@/data/mock-data";
import { CommandEmptyState } from "./CommandEmptyState";
import { toast } from "sonner";

interface Props {
  distributors: Distributor[];
}

type Tier = "watch" | "warn" | "critical";

function tierFor(util: number): Tier {
  if (util >= 0.95) return "critical";
  if (util >= 0.85) return "warn";
  return "watch";
}

const barClass: Record<Tier, string> = {
  watch: "bg-success",
  warn: "bg-warning",
  critical: "bg-destructive",
};
const textClass: Record<Tier, string> = {
  watch: "text-success",
  warn: "text-warning",
  critical: "text-destructive",
};

function sanitisePhone(p: string): string {
  return (p || "").replace(/[^\d]/g, "");
}

function whatsappReminder(d: Distributor) {
  const phone = sanitisePhone(d.contact);
  const msg = [
    `Hi ${d.name},`,
    "",
    `A gentle reminder — outstanding balance with us is ${formatCurrency(d.outstandingAmount)} against a credit limit of ${formatCurrency(d.creditLimit)}.`,
    "",
    "Could you confirm a payment date? Happy to share the statement.",
    "",
    "Thanks,",
  ].join("\n");
  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  toast.success(phone ? "WhatsApp opened" : "WhatsApp opened — no number on file");
}

export function CreditAtRiskCard({ distributors }: Props) {
  const all = distributors
    .filter((d) => d.creditLimit > 0 && d.outstandingAmount / d.creditLimit >= 0.7)
    .map((d) => ({ ...d, util: d.outstandingAmount / d.creditLimit }))
    .sort((a, b) => b.util - a.util);

  const rows = all.slice(0, 5);
  const exposure = all.reduce((s, d) => s + (d.outstandingAmount || 0), 0);
  const criticalCount = all.filter((d) => d.util >= 0.95).length;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Credit at risk
        </h3>
        {all.length > 0 && (
          <Link to="/distributors?filter=overdue" className="flex items-center gap-1 text-xs text-primary hover:underline">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {all.length === 0 ? (
        <CommandEmptyState title="No dealers over 70% credit utilisation" hint="You're in the clear." />
      ) : (
        <>
          {/* Exposure header strip */}
          <div className="mb-3 flex items-end justify-between gap-3 rounded-md bg-destructive/[0.04] px-3 py-2 border-l-[3px] border-destructive">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">Total exposure</p>
              <p className="font-heading text-[22px] leading-tight num text-foreground">{formatCurrency(exposure)}</p>
            </div>
            <p className="text-[11px] text-muted-foreground text-right">
              {all.length} dealer{all.length === 1 ? "" : "s"}
              {criticalCount > 0 && (
                <>
                  {" · "}
                  <span className="text-destructive font-medium">{criticalCount} critical</span>
                </>
              )}
            </p>
          </div>

          <ul className="space-y-2.5">
            {rows.map((r) => {
              const pct = Math.min(100, Math.round(r.util * 100));
              const tier = tierFor(r.util);
              return (
                <li key={r.id} className="group rounded-md px-2 -mx-2 py-1.5 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/distributors/${r.id}`} className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline">
                      {r.name}
                    </Link>
                    <span className={`num text-xs font-medium ${textClass[tier]}`}>{pct}%</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span className="num truncate">
                      {formatCurrency(r.outstandingAmount)} of {formatCurrency(r.creditLimit)}
                    </span>
                    <button
                      type="button"
                      onClick={() => whatsappReminder(r)}
                      className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-success opacity-0 transition-opacity hover:bg-success/10 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-success"
                      aria-label={`Send WhatsApp reminder to ${r.name}`}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Remind
                    </button>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-[width] duration-[400ms] ease-out ${barClass[tier]} ${
                        tier === "critical" ? "animate-pulse" : ""
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
