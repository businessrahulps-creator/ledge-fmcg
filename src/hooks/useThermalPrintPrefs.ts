import { useCallback, useState } from "react";

export interface ThermalPrefs { width: 80 | 58; showBank: boolean; footer: string; copies: 1 | 2 | 3 }
const KEY = "ledge:thermal:prefs:v1";
const DEFAULTS: ThermalPrefs = { width: 80, showBank: true, footer: "Thank you", copies: 1 };

export function loadThermalPrefs(): ThermalPrefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      width: p.width === 58 ? 58 : 80,
      showBank: p.showBank !== false,
      footer: typeof p.footer === "string" ? p.footer.slice(0, 80) : DEFAULTS.footer,
      copies: [1, 2, 3].includes(p.copies) ? p.copies : 1,
    };
  } catch { return DEFAULTS; }
}

export function useThermalPrintPrefs() {
  const [prefs, setPrefs] = useState(loadThermalPrefs);
  const update = useCallback((next: Partial<ThermalPrefs>) => {
    setPrefs(prev => {
      const merged = { ...prev, ...next };
      try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch { /* ignore */ }
      return merged;
    });
  }, []);
  return { prefs, update };
}
