import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["G", "O"], label: "Go to Overview" },
  { keys: ["G", "P"], label: "Go to People" },
  { keys: ["G", "S"], label: "Go to Products" },
  { keys: ["G", "R"], label: "Go to Reports" },
  { keys: ["1"], label: "Period: Last 7 days" },
  { keys: ["2"], label: "Period: Last 30 days" },
  { keys: ["3"], label: "Period: Last 90 days" },
  { keys: ["4"], label: "Period: Year to date" },
  { keys: ["5"], label: "Period: Custom" },
  { keys: ["P"], label: "Download PDF snapshot" },
  { keys: ["Shift", "P"], label: "Open print preview" },
  { keys: ["D"], label: "Toggle compact density" },
  { keys: ["?"], label: "Show this cheat-sheet" },
];

export function KeyboardCheatSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription>
            Press <Kbd>?</Kbd> any time to reopen. Shortcuts are inactive while typing in a field.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
            >
              <span className="text-foreground/85">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-[10px] text-muted-foreground">then</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}
