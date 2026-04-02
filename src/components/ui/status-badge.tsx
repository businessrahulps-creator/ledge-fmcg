import { cn } from "@/lib/utils";

type StatusType = "paid" | "partial" | "pending" | "dispatched" | "delivered";

const statusStyles: Record<StatusType, string> = {
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  pending: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  dispatched: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
