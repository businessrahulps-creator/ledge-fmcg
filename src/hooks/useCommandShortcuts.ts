import { useEffect } from "react";

interface Handlers {
  onGoOverview: () => void;
  onGoPeople: () => void;
  onGoProducts: () => void;
  onGoReports: () => void;
  onPeriod: (period: "7d" | "30d" | "90d" | "ytd" | "custom") => void;
  onPrint: () => void;
  onPrintBrowser?: () => void;
  onToggleCheatSheet: () => void;
  onToggleDensity: () => void;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Keyboard shortcuts for /command. Inactive when focus is in an input.
 * Sequences supported: `g o`, `g p`, `g s`, `g r`.
 */
export function useCommandShortcuts(h: Handlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    let pendingG = false;
    let pendingTimer: number | null = null;

    const clearG = () => {
      pendingG = false;
      if (pendingTimer) {
        window.clearTimeout(pendingTimer);
        pendingTimer = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Two-key sequences: g + letter
      if (pendingG) {
        if (e.key === "o") { h.onGoOverview(); clearG(); e.preventDefault(); return; }
        if (e.key === "p") { h.onGoPeople(); clearG(); e.preventDefault(); return; }
        if (e.key === "s") { h.onGoProducts(); clearG(); e.preventDefault(); return; }
        if (e.key === "r") { h.onGoReports(); clearG(); e.preventDefault(); return; }
        clearG();
      }

      switch (e.key) {
        case "g":
          pendingG = true;
          pendingTimer = window.setTimeout(clearG, 900);
          e.preventDefault();
          return;
        case "1": h.onPeriod("7d"); e.preventDefault(); return;
        case "2": h.onPeriod("30d"); e.preventDefault(); return;
        case "3": h.onPeriod("90d"); e.preventDefault(); return;
        case "4": h.onPeriod("ytd"); e.preventDefault(); return;
        case "5": h.onPeriod("custom"); e.preventDefault(); return;
        case "p": h.onPrint(); e.preventDefault(); return;
        case "d": h.onToggleDensity(); e.preventDefault(); return;
        case "?": h.onToggleCheatSheet(); e.preventDefault(); return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearG();
    };
  }, [enabled, h]);
}
