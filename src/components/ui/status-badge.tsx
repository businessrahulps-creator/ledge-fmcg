import { memo, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleDashed, Clock, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "paid" | "partial" | "pending" | "dispatched" | "delivered";

// V2: status colors mapped to semantic tokens (Forest/Terracotta/Destructive/Midnight).
const statusStyles: Record<StatusType, string> = {
  paid: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning border-l-2 border-warning rounded-l-[2px]",
  pending: "bg-destructive/10 text-destructive border-l-2 border-destructive rounded-l-[2px]",
  dispatched: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
};

const statusLabels: Record<StatusType, string> = {
  paid: "Paid",
  partial: "Part paid",
  pending: "Not paid yet",
  dispatched: "On the way",
  delivered: "Delivered",
};

const statusIcons: Record<StatusType, LucideIcon> = {
  paid: Check,
  partial: CircleDashed,
  pending: Clock,
  dispatched: Truck,
  delivered: Check,
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

function StatusBadgeImpl({ status, className }: StatusBadgeProps) {
  const Icon = statusIcons[status];
  const reduce = useReducedMotion();
  const prevRef = useRef(status);
  const mountedRef = useRef(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = status;
      return;
    }
    if (prevRef.current !== status) {
      prevRef.current = status;
      if (!reduce) setPulseKey((k) => k + 1);
    }
  }, [status, reduce]);

  return (
    <motion.span
      key={pulseKey}
      initial={false}
      animate={pulseKey > 0 && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], times: [0, 0.4, 1] }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] leading-[1.4] origin-center",
        statusStyles[status],
        className,
      )}
    >
      <Icon className="h-[10px] w-[10px] shrink-0" strokeWidth={2.4} aria-hidden />
      {statusLabels[status]}
    </motion.span>
  );
}

export const StatusBadge = memo(StatusBadgeImpl);
