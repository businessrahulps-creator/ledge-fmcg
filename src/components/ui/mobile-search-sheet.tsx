import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface MobileSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Controlled search query (optional). */
  query?: string;
  onQueryChange?: (q: string) => void;
  placeholder?: string;
  /** Hidden a11y title. */
  title?: string;
  /** Sticky footer (e.g. "Showing N of M"). */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Optional leading slot replacing the default back button. */
  leading?: React.ReactNode;
  /** Replace the entire search input area (still keeps back button + sticky styling). */
  headerSlot?: React.ReactNode;
}


/**
 * Full-height mobile search sheet — slides down from the top, pins to 100dvh,
 * sticky search header, scrollable results region that shrinks above the
 * on-screen keyboard. Use for any search/picker surface on phones.
 */
export function MobileSearchSheet({
  open,
  onOpenChange,
  query,
  onQueryChange,
  placeholder = "Search…",
  title = "Search",
  footer,
  children,
  leading,
  headerSlot,
}: MobileSearchSheetProps) {

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus after the slide animation completes — iOS-safe.
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 140);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:!duration-[120ms]"
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-background outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:duration-[220ms] data-[state=closed]:duration-[160ms]",
            "motion-reduce:!animate-none",
          )}
          style={{ height: "100dvh" }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-background/95 px-2 backdrop-blur"
            style={{ paddingTop: "max(env(safe-area-inset-top), 8px)", paddingBottom: 8 }}
          >
            {leading ?? (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground active:bg-muted/60"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {headerSlot ?? (
              <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query ?? ""}
                  onChange={(e) => onQueryChange?.(e.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="h-10 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => onQueryChange?.("")}
                    aria-label="Clear search"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted/60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            )}

          </div>

          {/* Body */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            style={{ touchAction: "pan-y", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {children}
          </div>

          {footer ? (
            <div
              className="border-t border-border/60 bg-background/95 px-3 py-2 text-[11px] text-muted-foreground/80 backdrop-blur"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
            >
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
