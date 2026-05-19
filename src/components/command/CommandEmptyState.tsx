import { Inbox, LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  hint?: string;
}

export function CommandEmptyState({ icon: Icon = Inbox, title, hint }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/10 px-4 py-8 text-center">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
