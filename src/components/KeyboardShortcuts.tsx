import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCan } from "@/hooks/useCan";

const NAV_SHORTCUTS: { keys: string; label: string; to: string }[] = [
  { keys: "g d", label: "Go to Dashboard", to: "/dashboard" },
  { keys: "g o", label: "Go to Orders", to: "/orders" },
  { keys: "g b", label: "Go to Billing", to: "/billing" },
  { keys: "g s", label: "Go to Stock", to: "/stock" },
  { keys: "g e", label: "Go to Dealers", to: "/distributors" },
  { keys: "g t", label: "Go to Sales Team", to: "/salespersons" },
  { keys: "g r", label: "Go to Reports", to: "/reports" },
  { keys: "g p", label: "Go to Performance", to: "/performance" },
];

const GLOBAL_SHORTCUTS = [
  { keys: "n", label: "New order" },
  { keys: "⌘K · Ctrl+K · /", label: "Open command palette" },
  { keys: "?", label: "Show this overlay" },
];

const TARGET_TO_PATH: Record<string, string> = {
  d: "/dashboard",
  o: "/orders",
  b: "/billing",
  s: "/stock",
  e: "/distributors",
  t: "/salespersons",
  r: "/reports",
  p: "/performance",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Global keyboard map:
 *   ?        → open overlay
 *   n        → /orders/new
 *   g + key  → navigate (two-key chord, 1.2s window)
 *
 * Skips when the user is typing in an input, or when a modifier key is held.
 */
export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const canPlaceOrders = useCan("place_orders");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let pendingG: number | null = null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      // "?" → overlay
      if (e.key === "?") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      // "Esc" closes overlay handled by Dialog.

      const key = e.key.toLowerCase();

      // Chord: g then X
      if (pendingG !== null) {
        const path = TARGET_TO_PATH[key];
        window.clearTimeout(pendingG);
        pendingG = null;
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        return;
      }

      if (key === "g") {
        pendingG = window.setTimeout(() => {
          pendingG = null;
        }, 1200);
        return;
      }

      // Single-key shortcuts
      if (key === "n") {
        if (!canPlaceOrders) return;
        e.preventDefault();
        navigate("/orders/new");
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (pendingG !== null) window.clearTimeout(pendingG);
    };
  }, [navigate, canPlaceOrders]);

  const sections = useMemo(
    () => [
      { title: "Navigate", items: NAV_SHORTCUTS.map(({ keys, label }) => ({ keys, label })) },
      {
        title: "Global",
        items: GLOBAL_SHORTCUTS.filter((s) => s.keys !== "n" || canPlaceOrders),
      },
    ],
    [canPlaceOrders]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-md">
        <DialogHeader>
          <DialogTitle className="text-base">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          {sections.map((s) => (
            <div key={s.title}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">
                {s.title}
              </p>
              <ul className="space-y-1.5">
                {s.items.map((it) => (
                  <li key={it.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground/85">{it.label}</span>
                    <Kbd>{it.keys}</Kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/70 pt-1">
            Tip: shortcuts pause while you're typing in a field.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-foreground/80">
      {children}
    </kbd>
  );
}
