import { motion, useReducedMotion } from "framer-motion";

interface Props {
  completed: number;
  total: number;
  /** When true, briefly pulse to celebrate a chapter completion */
  celebrating?: boolean;
}

/**
 * The horizontal ribbon used on the dashboard's "Your First Week" card.
 * Animates in lockstep with the chapter card celebration — same easing,
 * same duration as ChapterCard's flip.
 */
export function ProgressRibbon({ completed, total, celebrating }: Props) {
  const reduce = useReducedMotion();
  const pct = total > 0 ? completed / total : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
          Your First Week
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground font-medium">
          <span className="text-foreground font-semibold">{completed}</span> / {total} chapters
        </p>
      </div>
      <div className="relative h-[6px] rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          initial={false}
          animate={{
            width: `${pct * 100}%`,
            boxShadow: celebrating
              ? "0 0 16px hsl(19 56% 40% / 0.55)"
              : "0 0 0px hsl(19 56% 40% / 0)",
          }}
          transition={{ duration: reduce ? 0.15 : 0.6, ease: [0.1, 0.9, 0.2, 1] }}
        />
        {/* Terracotta pulse overlay during celebration */}
        {celebrating && !reduce && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-accent/40"
            initial={{ width: `${pct * 100}%`, opacity: 0.7 }}
            animate={{ width: `${pct * 100}%`, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
      </div>
    </div>
  );
}
