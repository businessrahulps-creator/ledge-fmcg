import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JourneyStep {
  /** Plain-English step name, e.g. "Dispatched". */
  label: string;
  /** Date or short line under the step, when known. */
  detail?: string;
  state: "done" | "current" | "todo";
}

interface JourneyTrackProps {
  steps: JourneyStep[];
  className?: string;
  /** Accessible name for the track. */
  ariaLabel?: string;
}

/**
 * The order's journey on one line: what has happened, what is happening now,
 * and what is still to come. Every state carries a word, never colour alone.
 */
export function JourneyTrack({ steps, className, ariaLabel = "Order progress" }: JourneyTrackProps) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn(
        "-mx-1 flex items-stretch gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {steps.map((s, i) => (
        <li
          key={s.label}
          aria-current={s.state === "current" ? "step" : undefined}
          className={cn("journey-step", `journey-step-${s.state}`, i === 0 && "journey-step-first")}
        >
          <span className="journey-step-marker" aria-hidden>
            {s.state === "done" ? <Check className="h-3 w-3" /> : <span className="journey-dot" />}
          </span>
          <span className="min-w-0">
            <span className="journey-step-label">{s.label}</span>
            <span className="journey-step-detail">
              {s.detail || (s.state === "todo" ? "Not yet" : s.state === "current" ? "Now" : "Done")}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
