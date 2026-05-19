import { useMemo, useState, useRef, useEffect, useId } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileSearchSheet } from "@/components/ui/mobile-search-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";


export interface EntityOption {
  value: string;
  label: string;
  /** Optional supporting line (SKU, city, etc) — shown muted under label. */
  hint?: string;
  /** Optional right-aligned chip (price, qty, status). */
  meta?: string;
  /** Disable selection (kept for "out of stock" / "already added" hints). */
  disabled?: boolean;
}

interface Props {
  value?: string | null;
  onChange: (value: string) => void;
  options: EntityOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyHint?: string;
  disabled?: boolean;
  /** Inline error/help text below the trigger. */
  helperText?: string;
  className?: string;
  id?: string;
  /** Cap visible rows — anything past this scrolls. Defaults to 8 rows × 44px. */
  maxHeight?: number;
}

/**
 * EntityPicker — the standard searchable dropdown for dealer/product/salesperson
 * lists. Replaces `<Select>` anywhere lists can exceed ~20 items.
 *
 * - Typeahead filter on label/hint/meta
 * - Keyboard nav (↑/↓/Enter/Esc)
 * - Virtualized window via overflow scroll (rows are uniform 44px)
 * - Bone-on-Midnight Fluent surface
 */
export function EntityPicker({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyHint = "No matches.",
  disabled,
  helperText,
  className,
  id,
  maxHeight = 352,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const inputId = id || reactId;

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      [o.label, o.hint, o.meta].some((s) => s && s.toLowerCase().includes(q)),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const commit = (opt: EntityOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) commit(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Keep active row in view as user arrows through long lists.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const isMobile = useIsMobile();

  const rows = (
    <>
      {filtered.length === 0 ? (
        <p className="px-3 py-10 text-center text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        filtered.map((opt, i) => {
          const isActive = i === active;
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-row-index={i}
              disabled={opt.disabled}
              onMouseEnter={() => setActive(i)}
              onClick={() => commit(opt)}
              className={cn(
                "flex w-full items-center gap-2 px-3 text-left text-sm transition-colors",
                isMobile ? "min-h-[52px] py-2.5 border-b border-border/40 last:border-b-0" : "min-h-[44px] py-2",
                isActive && !opt.disabled && "bg-muted/60",
                "active:bg-muted/70",
                isSelected && "text-foreground",
                !isSelected && "text-foreground/90",
                opt.disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-opacity",
                  isSelected ? "opacity-100 text-primary" : "opacity-0",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate", isMobile && "text-[15px]")}>{opt.label}</span>
                {opt.hint && (
                  <span className="block truncate text-[11px] text-muted-foreground">{opt.hint}</span>
                )}
              </span>
              {opt.meta && (
                <span className="ml-2 shrink-0 text-[11px] text-muted-foreground num">{opt.meta}</span>
              )}
            </button>
          );
        })
      )}
    </>
  );

  const trigger = (
    <Button
      id={inputId}
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      onClick={isMobile ? () => !disabled && setOpen(true) : undefined}
      className={cn(
        "w-full justify-between h-10 px-3 font-normal text-left",
        !selected && "text-muted-foreground/80",
      )}
    >
      <span className="truncate">{selected ? selected.label : placeholder}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const footer =
    filtered.length > 0 && options.length > filtered.length
      ? `Showing ${filtered.length} of ${options.length}`
      : null;

  return (
    <div className={cn("w-full", className)}>
      {isMobile ? (
        <>
          {trigger}
          <MobileSearchSheet
            open={open}
            onOpenChange={(o) => !disabled && setOpen(o)}
            query={query}
            onQueryChange={setQuery}
            placeholder={searchPlaceholder}
            title={placeholder}
            footer={footer}
          >
            <div ref={listRef} role="listbox" className="py-1">
              {rows}
            </div>
          </MobileSearchSheet>
        </>
      ) : (
        <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={4}
            className="p-0 w-[--radix-popover-trigger-width] min-w-[260px]"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              const target = e.currentTarget as HTMLElement | null;
              target?.querySelector<HTMLInputElement>("input")?.focus();
            }}
          >
            <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="h-7 border-0 shadow-none px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                autoComplete="off"
              />
            </div>
            <div
              ref={listRef}
              role="listbox"
              className="overflow-y-auto py-1"
              style={{ maxHeight }}
            >
              {rows}
            </div>
            {footer && (
              <div className="border-t border-border/60 px-2.5 py-1.5 text-[10.5px] text-muted-foreground/70">
                {footer}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
      {helperText && <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>}
    </div>
  );
}

