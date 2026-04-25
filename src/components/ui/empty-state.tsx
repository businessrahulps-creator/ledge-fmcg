import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** When true, renders inside a glass-card with padding (use on standalone pages). */
  card?: boolean;
  className?: string;
}

/**
 * Standardized empty state for list pages.
 * - Soft icon, friendly title, optional description, single primary CTA.
 * - Use `card` prop when not already inside a card container.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  card = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        card ? "glass-card rounded-xl py-12 px-6" : "py-16",
        className,
      )}
    >
      <div className="relative">
        <div
          aria-hidden
          className="brand-gradient-soft-bg pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        />
        <Icon className="relative h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
