import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X, PartyPopper } from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";

function ProgressRing({ percentage, size = 56, strokeWidth = 5 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700"
      />
    </svg>
  );
}

export function SetupChecklist() {
  const navigate = useNavigate();
  const { steps, completedCount, totalSteps, percentage, isBrandNew, visible, dismiss, isComplete } = useOnboarding();

  const [celebrationDismissed, setCelebrationDismissed] = useState(() => {
    try { return localStorage.getItem("ledge_onboarding_celebration_dismissed") === "true"; } catch { return false; }
  });

  const dismissCelebration = useCallback(() => {
    setCelebrationDismissed(true);
    try { localStorage.setItem("ledge_onboarding_celebration_dismissed", "true"); } catch {}
  }, []);

  // Auto-hide celebration after 5 seconds
  useEffect(() => {
    if (isComplete && !celebrationDismissed) {
      const t = setTimeout(dismissCelebration, 5000);
      return () => clearTimeout(t);
    }
  }, [isComplete, celebrationDismissed, dismissCelebration]);

  if ((!visible && !isComplete) || celebrationDismissed) return null;

  if (isComplete) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }}
          className="glass-card rounded-2xl p-5 flex items-center gap-3 border border-primary/20"
        >
          <PartyPopper className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground flex-1">You're all set! Ledge is ready to go.</p>
          <button onClick={dismissCelebration} className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground transition-colors shrink-0" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card rounded-2xl border border-border/60 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5 pb-4">
        <div className="relative">
          <ProgressRing percentage={percentage} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
            {completedCount}/{totalSteps}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {isBrandNew ? (
            <>
              <h2 className="text-base font-bold tracking-tight text-foreground">Welcome to Ledge! 🎉</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Let's get your workspace ready in 5 minutes.</p>
            </>
          ) : (
            <>
              <h2 className="text-base font-bold tracking-tight text-foreground">Finish setting up</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{totalSteps - completedCount} steps left to unlock full value.</p>
            </>
          )}
        </div>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss setup checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Steps */}
      <div className="px-3 pb-3">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => !step.isComplete && navigate(step.path)}
            disabled={step.isComplete}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
              step.isComplete
                ? "opacity-60 cursor-default"
                : "hover:bg-muted/50 active:scale-[0.99] cursor-pointer"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
              step.isComplete
                ? "bg-primary/10 text-primary"
                : "bg-muted/60 text-muted-foreground"
            }`}>
              {step.isComplete ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <step.icon className="h-4 w-4" strokeWidth={1.8} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.isComplete ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {step.label}
              </p>
              <p className="text-[11px] text-muted-foreground/70 truncate">{step.description}</p>
            </div>
            {!step.isComplete && (
              <ArrowRight className="h-4 w-4 text-primary/60 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
