import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Linear/Vercel-style 2px progress bar pinned to the top of the viewport.
 * Driven by an `active` prop (typically wired to a global "isRefreshing"
 * signal). Stays at ~70% indeterminate while active, then snaps to 100%
 * and fades out — gives the product the felt-speed of a refined web app
 * without ever blocking interaction.
 */
export function TopProgress({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let raf1: number | undefined;
    let raf2: number | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      setVisible(true);
      setWidth(0);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setWidth(70));
      });
    } else if (visible) {
      setWidth(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 220);
    }

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (timeout) clearTimeout(timeout);
    };
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] overflow-hidden"
    >
      <div
        className={cn(
          "h-full bg-primary/85 shadow-[0_0_8px_hsl(var(--primary)/0.45)]",
          "transition-[width,opacity] ease-[cubic-bezier(0.1,0.9,0.2,1)]",
          width === 100 ? "duration-200 opacity-0" : "duration-[1200ms] opacity-100",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
