import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDaysToKey, todayKey } from "@/utils/dateKey";
import { canonicalStart, periodWindow, type TargetPeriodType } from "@/lib/target-achievement";

const toDate = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const short = (k: string) => toDate(k).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function periodPickerLabel(type: TargetPeriodType, start: string, today = todayKey()): string {
  if (type === "daily") {
    const l = toDate(start).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    return start === today ? `Today (${l})` : l;
  }
  if (type === "weekly") {
    const { from, to } = periodWindow("weekly", start);
    const l = `${short(from)} – ${short(to)}`;
    return from === canonicalStart("weekly", today) ? `This week (${l})` : l;
  }
  return toDate(start).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function stepPeriod(type: TargetPeriodType, start: string, dir: 1 | -1): string {
  if (type === "daily") return addDaysToKey(start, dir);
  if (type === "weekly") return addDaysToKey(canonicalStart("weekly", start), 7 * dir);
  const d = toDate(canonicalStart("monthly", start));
  return toKey(new Date(d.getFullYear(), d.getMonth() + dir, 1));
}

/** Pick any day, Monday–Sunday week or month. Changing period only reads; it never saves. */
export function PeriodPicker({ periodType, value, onChange }: { periodType: TargetPeriodType; value: string; onChange: (start: string) => void }) {
  const [open, setOpen] = useState(false);
  const { from, to } = periodWindow(periodType, value);
  const go = (k: string) => onChange(canonicalStart(periodType, k));
  const noun = periodType === "daily" ? "day" : periodType === "weekly" ? "week" : "month";
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="touch-target h-10 w-10" aria-label={`Previous ${noun}`} onClick={() => go(stepPeriod(periodType, value, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 justify-start gap-2 text-sm font-normal sm:min-w-56" aria-label={`Pick ${noun}`}>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {periodPickerLabel(periodType, value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={toDate(from)}
            defaultMonth={toDate(from)}
            weekStartsOn={1}
            modifiers={periodType === "daily" ? undefined : { inPeriod: { from: toDate(from), to: toDate(to) } }}
            modifiersClassNames={{ inPeriod: "bg-primary/10" }}
            onSelect={(d) => { if (d) { go(toKey(d)); setOpen(false); } }}
            initialFocus
            className="pointer-events-auto p-3"
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" className="touch-target h-10 w-10" aria-label={`Next ${noun}`} onClick={() => go(stepPeriod(periodType, value, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
