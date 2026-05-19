import { useState } from "react";
import { Bookmark, BookmarkPlus, Pin, PinOff, Trash2, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSavedViews, paramsToSearchString, type SavedViewParams } from "@/lib/saved-views";

interface Props {
  /** Current URL params snapshot, used when the user saves "current view". */
  currentParams: SavedViewParams;
}

export function SavedViewsMenu({ currentParams }: Props) {
  const { views, save, togglePin, remove, defaults } = useSavedViews();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");

  const goTo = (params: SavedViewParams) => {
    navigate({ pathname: location.pathname, search: `?${paramsToSearchString(params)}` });
    setOpen(false);
  };

  const handleSave = async () => {
    const v = await save(name, currentParams);
    if (v) {
      setName("");
      setSaveOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Saved views"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Views
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-1">
          {views.length > 0 && (
            <>
              <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Your views
              </p>
              <div className="max-h-64 overflow-y-auto">
                {views.map((v) => (
                  <div
                    key={v.id}
                    className="group flex items-center gap-1 rounded-sm pr-1 hover:bg-muted"
                  >
                    <button
                      type="button"
                      onClick={() => goTo(v.params as SavedViewParams)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
                    >
                      {v.is_pinned ? (
                        <Pin className="h-3 w-3 shrink-0 text-primary" />
                      ) : (
                        <Bookmark className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-sm text-foreground">{v.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePin(v); }}
                      aria-label={v.is_pinned ? "Unpin view" : "Pin view"}
                      className="hidden h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground group-hover:inline-flex"
                    >
                      {v.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); remove(v); }}
                      aria-label="Delete view"
                      className="hidden h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-destructive group-hover:inline-flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="my-1 h-px bg-border" />
            </>
          )}

          <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Quick views
          </p>
          {defaults.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => goTo(d.params)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <Bookmark className="h-3 w-3 text-muted-foreground" />
              {d.name}
            </button>
          ))}

          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => { setSaveOpen(true); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-primary hover:bg-muted"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Save current view…
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this view</DialogTitle>
            <DialogDescription>
              Captures the current period and tab so you can jump back in one click.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="e.g. End-of-month review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Save view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PinnedChipsProps {
  currentParamString: string;
}

export function PinnedViewChips({ currentParamString }: PinnedChipsProps) {
  const { views } = useSavedViews();
  const navigate = useNavigate();
  const location = useLocation();
  const pinned = views.filter((v) => v.is_pinned).slice(0, 4);
  if (pinned.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Pinned
      </span>
      {pinned.map((v) => {
        const target = paramsToSearchString(v.params as SavedViewParams);
        const active = target === currentParamString;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => navigate({ pathname: location.pathname, search: `?${target}` })}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-card text-foreground/80 hover:bg-muted",
            )}
          >
            <Pin className="h-2.5 w-2.5" />
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
