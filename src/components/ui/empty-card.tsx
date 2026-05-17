import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

/**
 * Cream-tinted empty state card. Used everywhere a list/table has no rows.
 * Warm, not broken. One primary CTA, optional secondary ghost.
 *
 * - bg: bone-tinted (secondary token), Midnight text via foreground
 * - rounded-md + depth-2 matches Fluent 2 surface language
 * - respects prefers-reduced-motion (opacity-only fade)
 */
export function EmptyCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyCardProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[480px] rounded-md bg-secondary/60 shadow-depth-2",
        "flex flex-col items-center justify-center text-center",
        "px-6 py-12 md:py-14",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
        className,
      )}
    >
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-background/70"
        />
        <Icon
          className="relative h-7 w-7 text-foreground/70"
          strokeWidth={1.5}
        />
      </div>
      <p className="text-base font-semibold text-foreground tracking-[-0.01em]">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-foreground/65">
          {description}
        </p>
      )}
      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button size="sm" variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
