import { useEffect, RefObject } from "react";

/**
 * Tracks pointer position over an element and writes it as CSS vars
 * (--mx, --my in pixels) on the element itself. Throttled with rAF.
 * Used by premium card/button glow effects.
 */
export function useCursorVars<T extends HTMLElement>(ref: RefObject<T>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia?.("(hover: none)").matches) return;

    let rafId = 0;
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      el.style.setProperty("--mx", `${lastX}px`);
      el.style.setProperty("--my", `${lastY}px`);
      rafId = 0;
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      if (!rafId) rafId = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      const rect = el.getBoundingClientRect();
      lastX = rect.width / 2;
      lastY = rect.height / 2;
      if (!rafId) rafId = requestAnimationFrame(apply);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref]);
}
