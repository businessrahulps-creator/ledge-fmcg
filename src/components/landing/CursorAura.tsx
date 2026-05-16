import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate, useReducedMotion } from "framer-motion";

interface Props {
  /** Tint color expressed as `hsl(var(--primary) / 0.12)` etc. */
  tint?: string;
  /** Ellipse radius in pixels. */
  size?: number;
  /** Optional class for positioning the absolutely-placed overlay. */
  className?: string;
}

/**
 * Motion v3 — one pointer-reactive ambient gradient per viewport.
 * Sits behind content, ignores pointer events, no-op on touch + reduced motion.
 * Cheaper than per-button magnetic effects; gives the page a single "alive" layer.
 */
export function CursorAura({
  tint = "hsl(var(--primary) / 0.10)",
  size = 520,
  className = "absolute inset-0 pointer-events-none",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isTouch =
    typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches;
  const disabled = reduce || isTouch;

  // Center-default so first paint isn't off-screen.
  const x = useMotionValue(50);
  const y = useMotionValue(40);
  // Soft spring — buttery follow, no snapping.
  const sx = useSpring(x, { stiffness: 80, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 80, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      x.set(Math.max(-20, Math.min(120, px)));
      y.set(Math.max(-20, Math.min(120, py)));
    };
    const parent = el.parentElement ?? el;
    parent.addEventListener("pointermove", onMove);
    return () => parent.removeEventListener("pointermove", onMove);
  }, [disabled, x, y]);

  const bg = useMotionTemplate`radial-gradient(ellipse ${size}px ${Math.round(
    size * 0.75
  )}px at ${sx}% ${sy}%, ${tint} 0%, transparent 65%)`;

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={className}
      style={{ background: disabled ? bg.get() : bg, willChange: disabled ? undefined : "background" }}
    />
  );
}
