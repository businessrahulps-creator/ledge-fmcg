import { useState } from "react";
import { Check, MoreHorizontal, UserPlus, Clock, X, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTeammates, type SignalAck } from "@/lib/command-acks";

interface Props {
  signalKey: string;
  ack: SignalAck | undefined;
  onSnooze: (days: number) => void;
  onAssign: (userId: string, userName: string) => void;
  onResolve: () => void;
  onClear: () => void;
}

export function SignalActions({ signalKey, ack, onSnooze, onAssign, onResolve, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const teammates = useTeammates();

  const hasAck = !!ack && (ack.snoozed_until || ack.assigned_to || ack.resolved_at);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Signal actions"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            hasAck && "text-primary",
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-1"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!assignOpen ? (
          <div className="flex flex-col">
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Actions
            </p>
            <button
              type="button"
              onClick={() => { onSnooze(7); setOpen(false); }}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Snooze for 7 days
            </button>
            <button
              type="button"
              onClick={() => { onSnooze(1); setOpen(false); }}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Snooze for 1 day
            </button>
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              disabled={teammates.length === 0}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
              {teammates.length === 0 ? "No teammates to assign" : "Assign to teammate"}
            </button>
            <button
              type="button"
              onClick={() => { onResolve(); setOpen(false); }}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <Check className="h-3.5 w-3.5 text-success" />
              Mark resolved
            </button>
            {hasAck && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => { onClear(); setOpen(false); }}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Re-surface signal
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Assign to
              </p>
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Back"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {teammates.map((t) => (
                <button
                  key={t.user_id}
                  type="button"
                  onClick={() => { onAssign(t.user_id, t.full_name); setOpen(false); setAssignOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold uppercase text-primary">
                    {t.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{t.full_name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{t.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
