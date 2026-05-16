import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ledgeMark from "@/assets/ledge-mark.webp";

interface Props {
  open: boolean;
  onDismiss: () => void;
}

/**
 * Full-screen "Your ledger is open." moment — fires once on 100% completion.
 * Click-anywhere to dismiss. Persists in localStorage so it never re-fires.
 */
export function LedgeSealMoment({ open, onDismiss }: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <motion.div
      role="dialog"
      aria-label="Your ledger is open"
      onClick={onDismiss}
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-md cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="relative"
        initial={reduce ? { opacity: 0 } : { scale: 0.7, opacity: 0, rotate: -8 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: reduce ? 0.3 : 0.9, ease: [0.1, 0.9, 0.2, 1] }}
      >
        {/* Terracotta halo */}
        <div
          aria-hidden
          className="absolute inset-0 -m-20 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(19 56% 40% / 0.55), transparent 70%)" }}
        />
        <img src={ledgeMark} alt="" className="relative h-28 w-28" />
      </motion.div>

      <motion.div
        className="relative text-center max-w-md px-6"
        initial={reduce ? { opacity: 0 } : { y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.1, 0.9, 0.2, 1] }}
      >
        <h2 className="font-heading text-4xl leading-tight text-foreground">
          Your ledger is <span className="italic text-accent">open.</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Every order, every dealer, every rupee — from here on, in one place.
        </p>
        <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
          Click anywhere to continue
        </p>
      </motion.div>
    </motion.div>
  );
}
