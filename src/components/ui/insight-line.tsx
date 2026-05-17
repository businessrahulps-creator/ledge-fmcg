import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";

export interface InsightLineProps {
  /** Numeric delta (positive = up). Null/undefined suppresses the comparator line and renders the fallback if provided. */
  delta?: number | null;
  /** Suffix for delta value, e.g. "%" or "pp". */
  suffix?: string;
  /** Comparator label, e.g. "Apr" or "last week". */
  comparator?: string;
  /** Direction in which "up" is good. Default "up" (up = success, down = destructive). Set "down" to invert (e.g. for outstanding balance). */
  goodWhen?: "up" | "down";
  /** Fallback content shown when delta is null/undefined (e.g. "Avg 14d outstanding"). */
  fallback?: React.ReactNode;
  /** Force a tone regardless of delta sign. */
  tone?: "up" | "down" | "flat";
  className?: string;
}

/**
 * Small 11px insight line under a KPI. Adds an arrow + comparator with auto-color.
 * Suppresses noise when delta is exactly 0 ("Flat") or null (renders fallback).
 */
function InsightLineImpl({ delta, suffix = "%", comparator, goodWhen = "up", fallback, tone, className }: InsightLineProps) {
  if (tone) {
    const cls = tone === "up" ? "insight-up" : tone === "down" ? "insight-down" : "insight-flat";
    const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;
    return (
      <span className={cn("insight-line", cls, className)}>
        <Icon className="icon-inline" />
        {fallback}
      </span>
    );
  }

  if (delta === null || delta === undefined) {
    if (!fallback) return null;
    return <span className={cn("insight-line insight-flat", className)}>{fallback}</span>;
  }

  if (delta === 0) {
    return (
      <span className={cn("insight-line insight-flat", className)}>
        <Minus className="icon-inline" />
        Flat{comparator ? ` vs ${comparator}` : ""}
      </span>
    );
  }

  const up = delta > 0;
  const good = goodWhen === "up" ? up : !up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("insight-line", good ? "insight-up" : "insight-down", className)}>
      <Icon className="icon-inline" />
      <AnimatedNumber value={`${up ? "+" : ""}${delta}${suffix}`} />
      {comparator ? ` vs ${comparator}` : ""}
    </span>
  );
}

export const InsightLine = React.memo(InsightLineImpl);
