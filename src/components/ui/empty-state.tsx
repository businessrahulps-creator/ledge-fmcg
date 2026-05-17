import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/ui/empty-card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** When true, renders inside a Cream EmptyCard surface (use on standalone pages). */
  card?: boolean;
  className?: string;
}

/**
 * Standardized empty state for list pages.
 * - When `card` is true, delegates to <EmptyCard /> for unified Cream surface.
 * - When `card` is false, renders the legacy inline soft icon + text layout.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  card = false,
  className,
}: EmptyStateProps) {
  if (card) {
    return (
      <EmptyCard
        icon={icon}
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={onAction}
        className={className}
      />
    );
  }
  const Icon = icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16",
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
