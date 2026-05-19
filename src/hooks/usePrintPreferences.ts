import { useCallback, useEffect, useState } from "react";

export type PrintPageSize = "A4" | "Letter";
export type PrintMargin = "narrow" | "normal" | "wide";

export interface PrintPreferences {
  pageSize: PrintPageSize;
  margin: PrintMargin;
}

const STORAGE_KEY = "ledge:print:prefs:v1";
const DEFAULTS: PrintPreferences = { pageSize: "A4", margin: "normal" };

/** CSS @page margin (mm) per preset. */
export const MARGIN_MM: Record<PrintMargin, number> = {
  narrow: 8,
  normal: 14,
  wide: 20,
};

/** react-pdf Page padding (pt — 1pt ≈ 0.353mm). */
export const MARGIN_PT: Record<PrintMargin, number> = {
  narrow: 24,
  normal: 40,
  wide: 56,
};

/** react-pdf Page `size` prop value. */
export const PDF_PAGE_SIZE: Record<PrintPageSize, "A4" | "LETTER"> = {
  A4: "A4",
  Letter: "LETTER",
};

function load(): PrintPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PrintPreferences>;
    return {
      pageSize: parsed.pageSize === "Letter" ? "Letter" : "A4",
      margin: parsed.margin === "narrow" || parsed.margin === "wide" ? parsed.margin : "normal",
    };
  } catch {
    return DEFAULTS;
  }
}

const EVENT = "ledge:print-prefs-changed";

export function usePrintPreferences() {
  const [prefs, setPrefs] = useState<PrintPreferences>(() => load());

  useEffect(() => {
    const onChange = () => setPrefs(load());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((next: Partial<PrintPreferences>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore quota */
      }
      window.dispatchEvent(new Event(EVENT));
      return merged;
    });
  }, []);

  const setPageSize = useCallback((pageSize: PrintPageSize) => update({ pageSize }), [update]);
  const setMargin = useCallback((margin: PrintMargin) => update({ margin }), [update]);

  return { ...prefs, setPageSize, setMargin };
}
