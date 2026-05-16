import { cn } from "@/lib/utils";

type StatusType = "paid" | "partial" | "pending" | "dispatched" | "delivered";

// V2: status colors mapped to semantic tokens (Forest/Terracotta/Destructive/Midnight).
const statusStyles: Record<StatusType, string> = {
  paid: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  pending: "bg-destructive/10 text-destructive",
  dispatched: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
};

const dotColors: Record<StatusType, string> = {
  paid: "bg-success",
  partial: "bg-warning",
  pending: "bg-destructive",
  dispatched: "bg-primary",
  delivered: "bg-success",
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
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] leading-[1.4]",
        statusStyles[status],
        className,
      )}
    >
      <span className={cn("inline-block h-[5px] w-[5px] rounded-full translate-y-[-0.5px]", dotColors[status])} />
      {statusLabels[status]}
    </span>
  );
}
