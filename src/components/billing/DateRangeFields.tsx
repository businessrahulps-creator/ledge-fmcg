import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatIndianDate } from "@/utils/formatDate";
import { toDateKey } from "@/utils/dateKey";

const keyDate = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };

function DayPick({ label, value, onPick, disabled }: {
  label: string; value: string; onPick: (k: string) => void; disabled: (d: Date) => boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 justify-start font-normal" aria-label={`${label} date`}>
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-muted-foreground mr-1">{label}</span>
          {formatIndianDate(keyDate(value))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={keyDate(value)}
          defaultMonth={keyDate(value)}
          onSelect={d => d && onPick(toDateKey(d))}
          disabled={disabled}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

/** From/To day pickers; From can't go after To and To can't go before From. */
export function DateRangeFields({ from, to, onFrom, onTo }: {
  from: string; to: string; onFrom: (k: string) => void; onTo: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <DayPick label="From" value={from} onPick={onFrom} disabled={d => toDateKey(d) > to} />
      <DayPick label="To" value={to} onPick={onTo} disabled={d => toDateKey(d) < from} />
    </div>
  );
}
