import * as React from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type EntityCardTier = "success" | "warning" | "destructive" | "muted";

const tierBar: Record<EntityCardTier, string> = {
  success: "before:bg-success",
  warning: "before:bg-warning",
  destructive: "before:bg-destructive",
  muted: "before:bg-border",
};

export interface EntityCardCell {
  label: string;
  /** Primary value (right-aligned tabular num). */
  value: React.ReactNode;
  /** Optional small slot under the value (progress bar, chip, etc). */
  hint?: React.ReactNode;
  /** Dim when zero/empty. */
  zero?: boolean;
}

export interface EntityCardMenuItem {
  label: string;
  onSelect: () => void;
  icon?: LucideIcon;
  destructive?: boolean;
  /** Insert a separator above this item. */
  separator?: boolean;
}

export interface EntityCardProps {
  tier?: EntityCardTier;
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tertiary?: React.ReactNode;
  /** Optional status chip rendered top-right above the menu. */
  statusChip?: React.ReactNode;

  /** Hero KPI. */
  hero?: {
    value: React.ReactNode;
    label: React.ReactNode;
    insight?: React.ReactNode;
  };

  /** Footer KpiStrip-style cells (max 3). */
  cells?: EntityCardCell[];

  /** Quiet footer chip (e.g. "Remind on WhatsApp"). Rendered above cells when present. */
  primaryAction?: React.ReactNode;

  /** Overflow menu items. Renders a ··· trigger top-right. */
  menu?: EntityCardMenuItem[];

  onClick?: () => void;
  className?: string;
  /** Compact density (sm tiles in lists). */
  compact?: boolean;
}

/**
 * Editorial KPI card for list surfaces (Dealers, Sales Team, Targets).
 * Composes Card depth + 3px brand left-bar + Playfair hero + KpiStrip footer.
 * One visual family across all entity lists.
 */
function EntityCardImpl({
  tier = "muted",
  avatar,
  title,
  subtitle,
  tertiary,
  statusChip,
  hero,
  cells,
  primaryAction,
  menu,
  onClick,
  className,
  compact,
}: EntityCardProps) {
  const interactive = !!onClick;
  const trimmedCells = cells?.slice(0, 3) ?? [];

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-start gap-3">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground md:text-[15px]">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
          {tertiary && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{tertiary}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {statusChip}
          {menu && menu.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
                className="min-w-[10rem]"
              >
                {menu.map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <React.Fragment key={`${m.label}-${i}`}>
                      {m.separator && i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          m.onSelect();
                        }}
                        className={cn(m.destructive && "text-destructive focus:text-destructive")}
                      >
                        {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                        {m.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Hero */}
      {hero && (
        <div className={cn("mt-3", compact && "mt-2")}>
          <div className="flex items-baseline justify-between gap-3">
            <p
              className={cn(
                "font-heading tracking-[-0.015em] leading-none num tabular-nums text-foreground whitespace-nowrap truncate",
                compact ? "text-[22px]" : "text-[24px] md:text-[28px]",
              )}
            >
              {hero.value}
            </p>
            {hero.insight && <div className="shrink-0">{hero.insight}</div>}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground/80">
            {hero.label}
          </p>
        </div>
      )}

      {/* Action chip */}
      {primaryAction && <div className="mt-3 flex">{primaryAction}</div>}

      {/* KpiStrip footer */}
      {trimmedCells.length > 0 && (
        <div
          className={cn(
            "mt-3 grid border-t border-border/60 divide-x divide-border/60 pt-3",
            trimmedCells.length === 1 && "grid-cols-1",
            trimmedCells.length === 2 && "grid-cols-2",
            trimmedCells.length === 3 && "grid-cols-3",
          )}
        >
          {trimmedCells.map((c, i) => (
            <div
              key={`${c.label}-${i}`}
              className={cn(
                "min-w-0 px-2 first:pl-0 last:pr-0",
                i === 0 && "pl-0",
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/80 truncate">
                {c.label}
              </p>
              <p
                className={cn(
                  "num tabular-nums mt-1 text-[13px] font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis",
                  c.zero && "text-muted-foreground/40",
                )}
              >
                {c.value}
              </p>
              {c.hint && <div className="mt-1">{c.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const baseClass = cn(
    // Card base — Fluent depth + 6px radius (matches glass-card token)
    "glass-card relative w-full text-left",
    compact ? "p-3.5" : "p-4 md:p-5",
    // 3px brand left bar via ::before so it stays inside the rounded corners
    "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-sm",
    tierBar[tier],
    interactive && "card-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        <div className="pl-2">{inner}</div>
      </button>
    );
  }
  return (
    <div className={baseClass}>
      <div className="pl-2">{inner}</div>
    </div>
  );
}

export const EntityCard = React.memo(EntityCardImpl);
