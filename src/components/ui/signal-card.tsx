import * as React from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignalTier = "success" | "warning" | "destructive" | "neutral";

const tierStyles: Record<SignalTier, { border: string; bg: string; bgHover: string; text: string; textSoft: string; fill: string }> = {
  success: {
    border: "border-success",
    bg: "bg-success/[0.04]",
    bgHover: "hover:bg-success/[0.08]",
    text: "text-success",
    textSoft: "text-success/90",
    fill: "hsl(var(--success) / 0.15)",
  },
  warning: {
    border: "border-warning",
    bg: "bg-warning/[0.04]",
    bgHover: "hover:bg-warning/[0.08]",
    text: "text-warning",
    textSoft: "text-warning/90",
    fill: "hsl(var(--warning) / 0.15)",
  },
  destructive: {
    border: "border-destructive",
    bg: "bg-destructive/[0.03]",
    bgHover: "hover:bg-destructive/[0.07]",
    text: "text-destructive",
    textSoft: "text-destructive/90",
    fill: "hsl(var(--destructive) / 0.15)",
  },
  neutral: {
    border: "border-muted-foreground/40",
    bg: "bg-muted/30",
    bgHover: "hover:bg-muted/50",
    text: "text-foreground",
    textSoft: "text-muted-foreground",
    fill: "hsl(var(--muted-foreground) / 0.15)",
  },
};

export interface SignalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tier: SignalTier;
  icon?: LucideIcon;
  label: string;        // ALL-CAPS short label, e.g. "AT RISK"
  caption: string;      // human sentence
  subCaption?: React.ReactNode; // optional secondary line (e.g. ₹ amount)
  value: React.ReactNode;       // the hero number
  valueSuffix?: string;          // e.g. "Dealers"
  interactive?: boolean;
}

/**
 * Promoted "risk surface" — left rule + signal icon + 32px Playfair number.
 * Mirrors Dashboard's "Credit at Risk" pattern. Use sparingly: max 1–2 per page.
 */
export const SignalCard = React.forwardRef<HTMLDivElement, SignalCardProps>(
  (
    { tier, icon: Icon = AlertTriangle, label, caption, subCaption, value, valueSuffix, interactive = false, className, ...props },
    ref,
  ) => {
    const s = tierStyles[tier];
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-stretch gap-3 border-l-[3px] rounded-r-md px-4 py-4 transition-colors",
          s.border,
          s.bg,
          interactive && s.bgHover,
          className,
        )}
        {...props}
      >
        <div className="flex items-center">
          <Icon className={cn("icon-signal", s.text)} fill={s.fill} />
        </div>
        <div className="flex-1 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={cn("text-[10px] uppercase tracking-[0.18em] font-semibold", s.textSoft)}>{label}</p>
            <p className="text-sm text-foreground mt-0.5">{caption}</p>
            {subCaption && <p className="text-[11px] text-muted-foreground mt-0.5 num">{subCaption}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className={cn("font-heading text-[32px] num leading-none", s.text)}>{value}</p>
            {valueSuffix && (
              <p className={cn("text-[10px] uppercase tracking-[0.16em] mt-1.5", s.textSoft)}>{valueSuffix}</p>
            )}
          </div>
        </div>
      </div>
    );
  },
);
SignalCard.displayName = "SignalCard";
