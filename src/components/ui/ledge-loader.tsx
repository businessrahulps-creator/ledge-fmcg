import { useEffect, useMemo, useState } from "react";
import ledgeMark from "@/assets/ledge-mark.png";
import { useDelayedShow } from "@/hooks/use-delayed-show";

/**
 * "Ledge is thinking" — branded Suspense fallback for lazy routes.
 *
 * Stays silent for the first 250ms (most prefetched navigations land here),
 * then fades in a calm, breathing mark with a rotating one-liner underneath.
 * Inspired by Apple's loading moments: minimal, confident, almost silent.
 */

const LINES = [
  "Stacking the ledger…",
  "Counting cartons…",
  "Checking the godown…",
  "Reading the day…",
  "Tying up loose ends…",
  "Pulling the numbers…",
  "Almost there.",
];

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function LedgeLoader() {
  const show = useDelayedShow(250);
  const lines = useMemo(() => shuffle(LINES), []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!show) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % lines.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [show, lines.length]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 animate-[ledge-fade-in_200ms_ease-out]"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Soft halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -m-6 rounded-full opacity-50 blur-2xl animate-[ledge-halo_2.4s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.18), transparent 70%)" }}
        />
        <img
          src={ledgeMark}
          alt=""
          aria-hidden
          className="relative h-16 w-16 object-contain animate-[ledge-breathe_1.6s_ease-in-out_infinite]"
          draggable={false}
        />
      </div>
      <p
        key={idx}
        className="font-heading italic text-[15px] text-muted-foreground/80 tracking-tight animate-[ledge-line-in_360ms_ease-out]"
      >
        {lines[idx]}
      </p>
      <span className="sr-only">Loading the page…</span>
    </div>
  );
}
