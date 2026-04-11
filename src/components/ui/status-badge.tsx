import { cn } from "@/lib/utils";

type StatusType = "paid" | "partial" | "pending" | "dispatched" | "delivered";

const statusStyles: Record<StatusType, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  pending: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  dispatched: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
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
