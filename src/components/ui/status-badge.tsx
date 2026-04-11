import { cn } from "@/lib/utils";

type StatusType = "paid" | "partial" | "pending" | "dispatched" | "delivered";

const statusStyles: Record<StatusType, string> = {
  paid: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  partial: "bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  pending: "bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  dispatched: "bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  delivered: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
};

const dotColors: Record<StatusType, string> = {
  paid: "bg-emerald-500",
  partial: "bg-amber-500",
  pending: "bg-red-500",
  dispatched: "bg-blue-500",
  delivered: "bg-emerald-500",
};

const statusLabels: Record<StatusType, string> = {
  paid: "Paid",
  partial: "Partial",
  pending: "Pending",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[status])} />
      {statusLabels[status]}
    </span>
  );
}
