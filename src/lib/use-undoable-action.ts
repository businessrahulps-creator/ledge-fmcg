import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Gmail-pattern "Deleted — Undo" toast.
 *
 * Instead of awaiting a destructive mutation, we *schedule* it. The user gets
 * an immediate 6-second toast with an Undo button. If they click Undo before
 * the timer fires, the mutation never runs and the world stays unchanged.
 * If the timer fires, we run the real mutation silently.
 *
 * Keeps flows fast (no confirm-dialog friction) while preserving safety.
 */
export interface UndoableOptions {
  /** Toast label shown immediately. Example: "Dealer removed". */
  label: string;
  /** Optional secondary line. Example: "Acme Traders". */
  description?: string;
  /** Window (ms) during which Undo aborts the action. Default 6000. */
  undoMs?: number;
  /** Called optimistically (e.g. hide the row from local state). */
  onOptimistic?: () => void;
  /** Called if user clicks Undo (e.g. restore the row). */
  onUndo?: () => void;
  /** The real mutation — runs only if the undo window elapses. */
  commit: () => Promise<void> | void;
  /** Called if commit throws (e.g. show error + restore). */
  onError?: (err: unknown) => void;
}

export function useUndoableAction() {
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  return useCallback((opts: UndoableOptions) => {
    const { label, description, undoMs = 6000, onOptimistic, onUndo, commit, onError } = opts;

    let undone = false;
    onOptimistic?.();

    const timer = setTimeout(async () => {
      timers.current.delete(timer);
      if (undone) return;
      try {
        await commit();
      } catch (err) {
        onError?.(err);
        onUndo?.(); // best-effort restore
        toast.error("Couldn't save change", { description: "Please try again." });
      }
    }, undoMs);

    timers.current.add(timer);

    toast(label, {
      description,
      duration: undoMs,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          clearTimeout(timer);
          timers.current.delete(timer);
          onUndo?.();
        },
      },
    });
  }, []);
}
