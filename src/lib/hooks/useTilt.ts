import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * 3D tilt-on-pointer for premium hero / feature cards.
 * Uses RAF-throttled CSS variables — no React state, no rerenders.
 * Set max=0 or rely on prefers-reduced-motion to disable.
 */
export function useTilt(
  ref: RefObject<HTMLElement>,
  opts: { max?: number; scale?: number; perspective?: number } = {}
) {
  const { max = 6, scale = 1.012, perspective = 1200 } = opts;
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || max === 0) return;

    let raf = 0;
    let targetX = 0, targetY = 0, currX = 0, currY = 0, hover = false;

    el.style.transformStyle = "preserve-3d";
    el.style.willChange = "transform";
    el.style.transition = "transform 600ms cubic-bezier(0.1, 0.9, 0.2, 1)";

    const tick = () => {
      currX += (targetX - currX) * 0.18;
      currY += (targetY - currY) * 0.18;
      const s = hover ? scale : 1;
      el.style.transform = `perspective(${perspective}px) rotateX(${currX.toFixed(2)}deg) rotateY(${currY.toFixed(2)}deg) scale(${s})`;
      if (hover || Math.abs(targetX - currX) > 0.05 || Math.abs(targetY - currY) > 0.05) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;
      targetY = (px - 0.5) * max * 2;              // rotateY
      targetX = -(py - 0.5) * max * 2;             // rotateX (invert)
      el.style.transition = "none";
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onEnter = () => { hover = true; };
    const onLeave = () => {
      hover = false;
      targetX = 0; targetY = 0;
      el.style.transition = "transform 600ms cubic-bezier(0.1, 0.9, 0.2, 1)";
      if (!raf) raf = requestAnimationFrame(tick);
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      el.style.transform = "";
      el.style.transition = "";
      el.style.willChange = "";
    };
  }, [ref, max, scale, perspective, reduce]);
}
