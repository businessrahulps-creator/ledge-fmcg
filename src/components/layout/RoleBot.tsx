import { useEffect, useState } from "react";
import { BotAvatar } from "bot-avatars";

type BotType = "square" | "circle" | "triangle" | "drop" | "pebble";

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** Calm role bot: no idle jumps, small head turn, no pointer play, still for reduce-motion users. */
export default function RoleBot({ type, size, sleeping, seed }: { type: BotType; size: number; sleeping?: boolean; seed?: number }) {
  const reduced = useReducedMotion();
  return (
    <BotAvatar
      type={type}
      size={size}
      state={sleeping ? "sleeping" : "default"}
      jumpEvery={0}
      turn={0.5}
      interactive={false}
      paused={reduced}
      seed={seed}
    />
  );
}
