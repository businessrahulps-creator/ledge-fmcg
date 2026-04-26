import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface Props {
  children: ReactNode;
  className?: string;
  /** Maximum pixels the element can be pulled toward the cursor */
  strength?: number;
  /** Pixel radius beyond the element's box where pull begins */
  radius?: number;
}

/**
 * Apple-grade magnetic hover. Subtle pull (max 8px) using spring physics.
 * No-ops on touch devices and when reduced-motion is set.
 */
export function MagneticWrapper({
  children,
  className,
  strength = 8,
  radius = 80,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 18, mass: 0.4 });

  const isTouch =
    typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches;
  const disabled = reduce || isTouch;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const maxDist = Math.max(rect.width, rect.height) / 2 + radius;
    if (dist > maxDist) {
      x.set(0);
      y.set(0);
      return;
    }
    const falloff = 1 - dist / maxDist;
    x.set((dx / maxDist) * strength * falloff * 2);
    y.set((dy / maxDist) * strength * falloff * 2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={disabled ? undefined : { x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
