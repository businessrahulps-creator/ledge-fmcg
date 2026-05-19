import { useMemo } from "react";
import { MARGIN_MM, usePrintPreferences } from "@/hooks/usePrintPreferences";

/**
 * Injects a runtime <style> tag that overrides @page in command-print.css
 * so users can flip between A4/Letter and margin presets. Render once at
 * the page root.
 */
export function PrintSettingsStyle() {
  const { pageSize, margin } = usePrintPreferences();

  const css = useMemo(() => {
    const sizeRule = pageSize === "Letter" ? "letter portrait" : "A4 portrait";
    const mm = MARGIN_MM[margin];
    // Use a slightly tighter horizontal margin on narrow to claw back width.
    const horiz = margin === "narrow" ? Math.max(mm - 2, 6) : mm;
    return `@media print { @page { size: ${sizeRule}; margin: ${mm}mm ${horiz}mm; } }`;
  }, [pageSize, margin]);

  return <style data-print-overrides>{css}</style>;
}
