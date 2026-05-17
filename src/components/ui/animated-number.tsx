import * as React from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Tween numeric values inside a formatted string (e.g. "₹2,40,000", "12", "+4.2%").
 * - 400ms easeOutCubic on value change after first mount
 * - Hard-replace on first mount, on reduced-motion, or when value is non-numeric
 * - Preserves prefix/suffix and decimal/comma pattern of the new target string
 */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const NUM_RE = /-?\d[\d,]*(\.\d+)?/;

const parseNumeric = (s: string) => {
  const m = s.match(NUM_RE);
  if (!m) return null;
  return { raw: m[0], num: parseFloat(m[0].replace(/,/g, "")) };
};

const swapNumeric = (template: string, value: number, sample: string) => {
  const decimals = sample.includes(".") ? (sample.split(".")[1]?.length ?? 0) : 0;
  const hasCommas = sample.includes(",");
  const fixed = value.toFixed(decimals);
  const formatted = hasCommas
    ? Number(fixed).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : fixed;
  return template.replace(NUM_RE, formatted);
};

export interface AnimatedNumberProps {
  value: React.ReactNode;
  duration?: number;
}

export function AnimatedNumber({ value, duration = 400 }: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState<React.ReactNode>(value);
  const prevRef = React.useRef<React.ReactNode>(value);
  const mountedRef = React.useRef(false);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = value;
      setShown(value);
      return;
    }

    const targetStr =
      typeof value === "string" || typeof value === "number" ? String(value) : null;
    const prev = prevRef.current;
    const prevStr =
      typeof prev === "string" || typeof prev === "number" ? String(prev) : null;

    if (reduce || targetStr === null || prevStr === null) {
      prevRef.current = value;
      setShown(value);
      return;
    }

    const from = parseNumeric(prevStr);
    const to = parseNumeric(targetStr);
    if (!from || !to || from.num === to.num) {
      prevRef.current = value;
      setShown(value);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const cur = from.num + (to.num - from.num) * easeOutCubic(t);
      setShown(swapNumeric(targetStr, cur, to.raw));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setShown(value);
        prevRef.current = value;
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, reduce]);

  return <>{shown}</>;
}
