import { cn } from "@/lib/utils";

type StatusType = "paid" | "partial" | "pending" | "dispatched" | "delivered";

const statusStyles: Record<StatusType, string> = {
  paid: "status-paid",
  partial: "status-partial",
  pending: "status-pending",
  dispatched: "status-dispatched",
  delivered: "status-delivered",
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
        "inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
