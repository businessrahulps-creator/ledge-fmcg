import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { LANDING_BOTS, type LandingBotKey } from "./bots";

const BotAvatar = lazy(() => import("bot-avatars").then((m) => ({ default: m.BotAvatar })));

/** A calm, colourful helper bot: loads only near the screen, no idle jumps, still for reduced motion. */
export function LandingBot({ id, size = 44, working }: { id: LandingBotKey; size?: number; working?: boolean }) {
  const spec = LANDING_BOTS[id] as { type: string; label: string; working?: boolean; sleeping?: boolean };
  const ref = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  const [reduced] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const isWorking = working ?? spec.working;
  const seed = (id.length * 0.137) % 1;
  return (
    <span ref={ref} className="lpx-bot" style={{ width: size, height: size }} aria-hidden>
      {show && (
        <Suspense fallback={null}>
          <BotAvatar
            type={spec.type as never}
            size={size}
            state={spec.sleeping ? "sleeping" : isWorking ? "working" : "default"}
            jumpEvery={0}
            turn={0.4}
            speed={0.55}
            paused={reduced}
            seed={seed}
          />
        </Suspense>
      )}
    </span>
  );
}
