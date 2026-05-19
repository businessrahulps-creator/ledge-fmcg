import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  type PrintMargin,
  type PrintPageSize,
  usePrintPreferences,
} from "@/hooks/usePrintPreferences";

const PAGE_SIZES: { value: PrintPageSize; label: string; hint: string }[] = [
  { value: "A4", label: "A4", hint: "210 × 297 mm" },
  { value: "Letter", label: "Letter", hint: "8.5 × 11 in" },
];

const MARGINS: { value: PrintMargin; label: string; hint: string }[] = [
  { value: "narrow", label: "Narrow", hint: "8 mm" },
  { value: "normal", label: "Normal", hint: "14 mm" },
  { value: "wide", label: "Wide", hint: "20 mm" },
];

export function PrintSettingsMenu() {
  const { pageSize, margin, setPageSize, setMargin } = usePrintPreferences();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Print page setup"
          title="Print page setup"
          className="command-no-print inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-3 text-xs">
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 font-medium text-foreground">Page size</div>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Page size">
              {PAGE_SIZES.map((opt) => {
                const active = pageSize === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPageSize(opt.value)}
                    className={`flex flex-col items-start rounded-md border px-2 py-1.5 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1.5 font-medium text-foreground">Margins</div>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Page margins">
              {MARGINS.map((opt) => {
                const active = margin === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMargin(opt.value)}
                    className={`flex flex-col items-start rounded-md border px-2 py-1.5 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] leading-snug text-muted-foreground">
            Applies to both the browser print dialog and the “Download PDF” export.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
