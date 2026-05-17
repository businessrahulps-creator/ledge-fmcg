import { cn } from "@/lib/utils";
import { useDelayedShow } from "@/hooks/use-delayed-show";

/**
 * Base skeleton. Hidden for the first 180ms after mount so that fast
 * loads (the common cached case) never flash a loader. All composed
 * skeletons in page-skeleton.tsx inherit this guard automatically.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const show = useDelayedShow(180);
  if (!show) return null;
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
