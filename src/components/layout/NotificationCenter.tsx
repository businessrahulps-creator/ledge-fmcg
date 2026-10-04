import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Package, AlertTriangle, Users, Info, CheckCheck, Wallet, Clock3,
  ArrowDownLeft, ArrowUpRight, XCircle, Ban, ReceiptText, History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, NotificationType, type Notification } from "@/hooks/use-notifications";
import { SmartTime } from "@/components/ui/smart-time";
import { useCan } from "@/hooks/useCan";

const typeConfig: Record<NotificationType, { icon: typeof Bell; colorClass: string; many: string }> = {
  order_placed: { icon: Package, colorClass: "border-l-success", many: "new orders" },
  order_cancelled: { icon: Ban, colorClass: "border-l-warning", many: "orders cancelled" },
  order_failed: { icon: XCircle, colorClass: "border-l-destructive", many: "things failed" },
  money_in: { icon: ArrowDownLeft, colorClass: "border-l-success", many: "payments received" },
  money_out: { icon: ArrowUpRight, colorClass: "border-l-warning", many: "payments made" },
  credit_note: { icon: ReceiptText, colorClass: "border-l-warning", many: "credit notes" },
  stock_alert: { icon: AlertTriangle, colorClass: "border-l-warning", many: "stock alerts" },
  stock_low: { icon: AlertTriangle, colorClass: "border-l-warning", many: "stock alerts" },
  team_update: { icon: Users, colorClass: "border-l-primary", many: "team changes" },
  credit_risk: { icon: Wallet, colorClass: "border-l-warning", many: "credit alerts" },
  order_pending: { icon: Clock3, colorClass: "border-l-primary", many: "pending orders" },
  general: { icon: Info, colorClass: "border-l-muted-foreground", many: "updates" },
};

type Group = { key: string; items: Notification[] };

/** Bundles repeats of the same kind by the same person on the same day. */
export function groupNotifications(list: Notification[]): Group[] {
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  for (const n of list) {
    if (!n.groupKey) { groups.push({ key: n.id, items: [n] }); continue; }
    const g = byKey.get(n.groupKey);
    if (g) g.items.push(n);
    else { const ng = { key: n.groupKey, items: [n] }; byKey.set(n.groupKey, ng); groups.push(ng); }
  }
  return groups;
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<"important" | "all">("important");
  const navigate = useNavigate();
  // Matches the Activity page's own access rule (money access).
  const canSeeActivity = useCan("see_money") === true;
  const allCount = notifications.filter(n => !n.important && !n.read).length;
  const groups = useMemo(
    () => groupNotifications(notifications.filter(n => (tab === "important" ? n.important : !n.important))),
    [notifications, tab],
  );

  const openOne = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.link) { setOpen(false); navigate(n.link); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="touch-target relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        >
          <Bell className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.5} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-[360px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {(unreadCount > 0 || allCount > 0) && (
            <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        {canSeeActivity && (
          <div role="tablist" className="flex gap-1 border-b px-3 py-2">
            {([["important", "Important"], ["all", "All activity"]] as const).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => { setTab(k); setExpanded(null); }}
                className={`touch-target rounded-md px-3 py-1 text-xs font-medium transition-colors ${tab === k ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
                {k === "important" && unreadCount > 0 && ` (${unreadCount})`}
                {k === "all" && allCount > 0 && ` (${allCount > 99 ? "99+" : allCount})`}
              </button>
            ))}
          </div>
        )}
        <ScrollArea className="max-h-[420px]">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Bell className="h-8 w-8" strokeWidth={1} />
              <p className="text-sm">{tab === "all" ? "Nothing has happened yet" : "No notifications yet"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {groups.map(g => {
                const first = g.items[0];
                const config = typeConfig[first.type] ?? typeConfig.general;
                const Icon = config.icon;
                const unread = g.items.some(n => !n.read);
                const isGroup = g.items.length > 1;
                const isOpen = expanded === g.key;
                return (
                  <div key={g.key}>
                    <button
                      onClick={() => {
                        if (isGroup) { setExpanded(isOpen ? null : g.key); g.items.forEach(n => !n.read && markAsRead(n.id)); }
                        else openOne(first);
                      }}
                      className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${config.colorClass} ${unread ? "bg-muted/30" : ""}`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-tight ${unread ? "font-semibold" : "font-medium"}`}>
                            {isGroup ? (first.important ? `${g.items.length} ${config.many}` : `${g.items.length}× ${first.title}`) : first.title}
                          </p>
                          {unread && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {isGroup ? `Latest: ${first.description}` : first.description}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          <SmartTime date={first.timestamp} />{isGroup && (isOpen ? " · tap to close" : " · tap to see all")}
                        </p>
                      </div>
                    </button>
                    {isGroup && isOpen && (
                      <div className="bg-muted/20">
                        {g.items.map(n => (
                          <button key={n.id} onClick={() => openOne(n)} className="block w-full px-4 py-2 pl-14 text-left text-xs hover:bg-muted/50">
                            <span className="text-foreground">{n.description}</span>
                            <span className="ml-1 text-muted-foreground/70">· <SmartTime date={n.timestamp} /></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {canSeeActivity && (
          <button
            onClick={() => { setOpen(false); navigate("/activity"); }}
            className="flex w-full items-center justify-center gap-1.5 border-t px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" /> See all activity
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
