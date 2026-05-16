import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "offline";

export interface UseAutosaveOptions<T> {
  /** The value to save (must be stable-ish — wrap in useMemo if computed). */
  value: T;
  /** Persist function. Throwing or returning a rejected promise sets status="error". */
  onSave: (value: T) => Promise<void> | void;
  /** Debounce window in ms. Default 800. */
  debounceMs?: number;
  /** Skip the first save (avoid persisting a freshly loaded value). Default true. */
  skipInitial?: boolean;
}

export interface AutosaveState {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  /** Force a flush now (e.g. on blur, on unload). */
  saveNow: () => Promise<void>;
}

/**
 * Microsoft-style autosave with explicit state.
 *
 * Watches `value`. After `debounceMs` of stillness, calls `onSave` and exposes
 * a tiny state machine (idle → dirty → saving → saved / error / offline) you
 * can pipe into `<SaveIndicator>`.
 */
export function useAutosave<T>({
  value,
  onSave,
  debounceMs = 800,
  skipInitial = true,
}: UseAutosaveOptions<T>): AutosaveState {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  const saving = useRef(false);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  const flush = useCallback(async () => {
    if (saving.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      return;
    }
    saving.current = true;
    setStatus("saving");
    try {
      await onSave(latest.current);
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      saving.current = false;
    }
  }, [onSave]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (skipInitial) return;
    }
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounceMs, flush]);

  // Flush on tab hide so users never lose the last edit on a quick switch.
  useEffect(() => {
    const onHide = () => {
      if (status === "dirty") void flush();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [status, flush]);

  return { status, lastSavedAt, saveNow: flush };
}
