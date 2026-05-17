import { Bell, Package, AlertTriangle, Users, Info, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, NotificationType } from "@/hooks/use-notifications";
import { SmartTime } from "@/components/ui/smart-time";

const typeConfig: Record<NotificationType, { icon: typeof Bell; colorClass: string }> = {
  order_placed: { icon: Package, colorClass: "border-l-success" },
  stock_alert: { icon: AlertTriangle, colorClass: "border-l-warning" },
  team_update: { icon: Users, colorClass: "border-l-primary" },
  general: { icon: Info, colorClass: "border-l-muted-foreground" },
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted">
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
      <PopoverContent
        align="end"
        className="w-[calc(100vw-2rem)] max-w-[340px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Bell className="h-8 w-8" strokeWidth={1} />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const config = typeConfig[notif.type];
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${config.colorClass} ${!notif.read ? "bg-muted/30" : ""}`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm leading-tight ${!notif.read ? "font-semibold" : "font-medium"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notif.description}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        <SmartTime date={notif.timestamp} />
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
