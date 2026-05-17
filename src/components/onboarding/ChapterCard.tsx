import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Chapter {
  id: string;
  title: string;
  why: string;          // founder-voice "why this matters"
  cta: string;          // e.g. "Add your first dealer"
  icon: LucideIcon;
  isComplete: boolean;
}

interface Props {
  chapter: Chapter;
  state: "active" | "dim" | "complete";
  /** True only during the brief celebration window after completion */
  celebrating?: boolean;
  onClick?: () => void;
  index: number;
}

/**
 * One chapter in the "Your First Week" stack. When it transitions from
 * active → complete, the card flips (rotateY 180) to reveal the Forest seal.
 * Reduced-motion: opacity cross-fade only.
 */
export function ChapterCard({ chapter, state, celebrating, onClick, index }: Props) {
  const reduce = useReducedMotion();
  const Icon = chapter.icon;
  const isComplete = chapter.isComplete || state === "complete";

  // Card visual states
  const dim = state === "dim";
  const interactive = !isComplete && !dim;

  return (
    <motion.button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dim ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.1, 0.9, 0.2, 1] }}
      whileHover={interactive && !reduce ? { y: -2 } : undefined}
      whileTap={interactive && !reduce ? { y: 0, scale: 0.995 } : undefined}
      className={[
        "group relative w-full overflow-hidden rounded-md border bg-card px-4 py-4 text-left",
        "transition-shadow duration-normal ease-fluent",
        interactive ? "border-border/80 shadow-depth-2 hover:shadow-depth-8 cursor-pointer" : "border-border/60 shadow-depth-2",
        !interactive ? "cursor-default" : "",
        // Brand placement (PR-A): Terracotta left-bar marks the active chapter.
        state === "active" ? "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-warning" : "",
      ].join(" ")}
      style={{ perspective: 1000 }}
      aria-current={state === "active" ? "step" : undefined}
    >
      <motion.div
        className="relative"
        animate={reduce ? undefined : { rotateY: isComplete ? 180 : 0 }}
        transition={reduce ? undefined : { duration: 0.6, ease: [0.1, 0.9, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div
          className="flex items-center gap-3.5"
          style={reduce ? undefined : { backfaceVisibility: "hidden" }}
        >
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors duration-normal",
              state === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
            ].join(" ")}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {chapter.title}
            </p>
            <p className="text-[12px] text-muted-foreground truncate mt-0.5">
              {chapter.why}
            </p>
          </div>
          {state === "active" && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium text-accent shrink-0">
              {chapter.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-normal group-hover:translate-x-0.5" strokeWidth={2} />
            </span>
          )}
        </div>

        {/* BACK (revealed after flip) */}
        {!reduce && (
          <div
            className="absolute inset-0 flex items-center gap-3.5"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-success/10 text-success transition-shadow duration-normal",
                celebrating ? "shadow-[0_0_24px_hsl(19_56%_40%/0.45)]" : "",
              ].join(" ")}
            >
              <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {chapter.title}
              </p>
              <p className="text-[12px] text-success truncate mt-0.5">Chapter complete.</p>
            </div>
          </div>
        )}

        {/* Reduced-motion: simple inline checkmark */}
        {reduce && isComplete && (
          <div className="absolute inset-0 flex items-center justify-end pr-1 bg-card">
            <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
          </div>
        )}
      </motion.div>
    </motion.button>
  );
}
