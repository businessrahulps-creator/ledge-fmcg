import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ChapterCard, type Chapter } from "./ChapterCard";
import { ProgressRibbon } from "./ProgressRibbon";
import { LedgeSealMoment } from "./LedgeSealMoment";

const FOUNDER_LINES: Record<string, { title: string; why: string; cta: string }> = {
  company: {
    title: "Tell us about your business",
    why: "Your GSTIN and logo show up on every invoice you'll ever send.",
    cta: "Add company details",
  },
  logo: {
    title: "Make it look like yours",
    why: "Upload your logo — dealers should know who's billing them.",
    cta: "Upload logo",
  },
  dealer: {
    title: "Meet your first dealer",
    why: "Without a dealer, Ledge can't show you who owes you money.",
    cta: "Add a dealer",
  },
  product: {
    title: "Add what you sell",
    why: "One product is enough to start. You can bulk-import later.",
    cta: "Add a product",
  },
  salesperson: {
    title: "Bring your team on",
    why: "Assign orders to your reps so accountability is built in from day one.",
    cta: "Add a salesperson",
  },
  order: {
    title: "Create your first order",
    why: "This is the moment Ledge stops being software and starts being your ledger.",
    cta: "Create an order",
  },
};

const SEAL_KEY = "ledge_first_week_sealed";

interface CelebrationState {
  chapterId: string;
  /** epoch ms when the celebration began */
  startedAt: number;
}

/**
 * The reimagined onboarding card — replaces SetupChecklist on the dashboard.
 * Chapters surface one active step at a time, others dimmed but visible.
 * On completion: card flips + ribbon advances + Terracotta pulse, in one beat.
 */
export function FirstWeek() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { steps, completedCount, totalSteps, isComplete } = useOnboarding();

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("ledge_first_week_dismissed") === "1"; } catch { return false; }
  });
  const [sealed, setSealed] = useState(() => {
    try { return localStorage.getItem(SEAL_KEY) === "1"; } catch { return false; }
  });
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  // Detect a fresh chapter completion to fire the synchronized celebration
  const prevCompletedIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentCompleted = new Set(steps.filter((s) => s.isComplete).map((s) => s.id));
    if (prevCompletedIds.current.size === 0) {
      // First render — seed without firing
      prevCompletedIds.current = currentCompleted;
      return;
    }
    for (const id of currentCompleted) {
      if (!prevCompletedIds.current.has(id)) {
        setCelebration({ chapterId: id, startedAt: Date.now() });
        const t = setTimeout(() => setCelebration(null), 1200);
        prevCompletedIds.current = currentCompleted;
        return () => clearTimeout(t);
      }
    }
    prevCompletedIds.current = currentCompleted;
  }, [steps]);

  // Auto-fire the seal moment once on 100% (and remember it)
  useEffect(() => {
    if (isComplete && !sealed) {
      // small delay so the final card flip lands first
      const t = setTimeout(() => {
        try { localStorage.setItem(SEAL_KEY, "1"); } catch {}
        setSealed(true);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [isComplete, sealed]);

  const dismiss = () => {
    try { localStorage.setItem("ledge_first_week_dismissed", "1"); } catch {}
    setDismissed(true);
  };

  // Map onboarding steps → narrative chapters
  const chapters: Chapter[] = useMemo(() =>
    steps.map((s) => ({
      id: s.id,
      title: FOUNDER_LINES[s.id]?.title ?? s.label,
      why: FOUNDER_LINES[s.id]?.why ?? s.description,
      cta: FOUNDER_LINES[s.id]?.cta ?? "Open",
      icon: s.icon as Chapter["icon"],
      isComplete: s.isComplete,
    })),
    [steps]
  );

  // The "active" chapter is the first incomplete one
  const activeIdx = chapters.findIndex((c) => !c.isComplete);

  // Don't show if dismissed, or if sealed and complete (the moment did its job)
  if (dismissed) return null;
  if (isComplete && sealed) {
    // Show a sealed-state moment was already dismissed — surface nothing.
    return null;
  }
  if (chapters.length === 0) return null;

  // Time-to-value ticker — rough; assumes each chapter ~3 min remaining
  const remainingMinutes = Math.max(2, (totalSteps - completedCount) * 2);

  return (
    <>
      <AnimatePresence>
        <motion.section
          aria-label="Your First Week with Ledge"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.45, ease: [0.1, 0.9, 0.2, 1] }}
          className="relative rounded-md border border-border bg-card shadow-depth-2 overflow-hidden"
        >
          {/* Striped-mark watermark — paper-feel anchor */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-md opacity-[0.04]"
            style={{
              background: "repeating-linear-gradient(135deg, hsl(var(--foreground)) 0 6px, transparent 6px 12px)",
            }}
          />

          {/* Header */}
          <div className="relative px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-[22px] sm:text-2xl leading-tight text-foreground">
                  Your first week with Ledge
                </h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {completedCount === 0
                    ? `~${remainingMinutes} minutes to your first invoice.`
                    : completedCount === totalSteps
                    ? "You're ready. Nice work."
                    : `You're ${completedCount * 2} min in. ~${remainingMinutes} min to go.`}
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors duration-normal"
                aria-label="Dismiss first week guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <ProgressRibbon
                completed={completedCount}
                total={totalSteps}
                celebrating={celebration !== null}
              />
            </div>
          </div>

          {/* Chapter stack */}
          <div className="relative px-3 pb-3 pt-3 sm:px-4 sm:pb-4 space-y-2">
            {chapters.map((ch, idx) => {
              const state: "active" | "dim" | "complete" =
                ch.isComplete ? "complete" : idx === activeIdx ? "active" : "dim";
              return (
                <ChapterCard
                  key={ch.id}
                  chapter={ch}
                  state={state}
                  celebrating={celebration?.chapterId === ch.id}
                  index={idx}
                  onClick={() => {
                    const path = steps.find((s) => s.id === ch.id)?.path ?? "/dashboard";
                    navigate(path);
                  }}
                />
              );
            })}
          </div>
        </motion.section>
      </AnimatePresence>

      <LedgeSealMoment open={isComplete && !sealed ? false : false /* fired imperatively */} onDismiss={() => {}} />
      {/* The actual seal moment is mounted conditionally below to control timing */}
      <SealMomentMount isComplete={isComplete} sealed={sealed} onDismiss={() => {
        try { localStorage.setItem(SEAL_KEY, "1"); } catch {}
        setSealed(true);
      }} />
    </>
  );
}

function SealMomentMount({ isComplete, sealed, onDismiss }: { isComplete: boolean; sealed: boolean; onDismiss: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isComplete && !sealed) {
      const t = setTimeout(() => setShow(true), 900);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [isComplete, sealed]);

  return (
    <AnimatePresence>
      {show && (
        <LedgeSealMoment
          open
          onDismiss={() => {
            setShow(false);
            onDismiss();
          }}
        />
      )}
    </AnimatePresence>
  );
}
