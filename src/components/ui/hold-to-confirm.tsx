import * as React from "react";
import { cn } from "@/lib/utils";

interface HoldToConfirmProps {
  children: React.ReactNode;
  onConfirm: () => void;
  /** How long to hold, in ms. */
  duration?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Press and hold to confirm a serious action. A bar fills while held;
 * letting go early cancels. Keyboard: hold Enter or Space.
 */
export function HoldToConfirm({ children, onConfirm, duration = 1200, disabled, className }: HoldToConfirmProps) {
  const [holding, setHolding] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  const start = () => {
    if (disabled) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, duration);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); }
      }}
      onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") stop(); }}
      aria-label={typeof children === "string" ? `${children} (press and hold)` : undefined}
      className={cn(
        "relative inline-flex h-10 select-none items-center justify-center overflow-hidden rounded-md border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50 touch-none",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-destructive/15"
        style={{
          width: holding ? "100%" : "0%",
          transition: holding ? `width ${duration}ms linear` : "width 150ms ease-out",
        }}
      />
      <span className="relative">{holding ? "Keep holding…" : children}</span>
    </button>
  );
}
