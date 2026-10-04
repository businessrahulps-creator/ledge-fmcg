import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cacheData, getCachedData } from "@/lib/offline-store";

export type NotificationType =
  | "order_placed" | "order_cancelled" | "order_failed" | "money_in" | "money_out" | "credit_note"
  | "stock_alert" | "stock_low" | "team_update" | "credit_risk" | "order_pending" | "general";

const notificationTypes = new Set<NotificationType>([
  "order_placed",
  "order_cancelled",
  "order_failed",
  "money_in",
  "money_out",
  "credit_note",
  "stock_alert",
  "stock_low",
  "team_update",
  "credit_risk",
  "order_pending",
  "general",
]);

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link: string;
  groupKey: string;
  important: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, title: string, description: string) => void;
  markAsRead: (id: string) => void;
  markManyAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  company_id: string;
  user_id: string;
  link?: string;
  group_key?: string;
  priority?: string;
}

function mapDbToNotif(row: DbNotification): Notification {
  return {
    id: row.id,
    type: notificationTypes.has(row.type as NotificationType) ? (row.type as NotificationType) : "general",
    title: row.title,
    description: row.message,
    timestamp: new Date(row.created_at),
    read: row.read,
    link: row.link || "",
    groupKey: row.group_key || "",
    important: row.priority !== "normal",
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, companyId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read && n.important).length;

  // Fetch on mount / when companyId changes, with offline cache fallback
  // Realtime: pause when offline, resume when online
  useEffect(() => {
    if (!companyId || !user?.id) {
      setNotifications([]);
      return;
    }
    const userId = user.id;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Ignore replies that arrive after the account/business changed.
    let alive = true;
    setNotifications([]);

    const load = async () => {
      try {
        // Important alerts load on their own, so lots of everyday activity can't push
        // an unread important alert out of the list (and off the badge).
        const [imp, all] = await Promise.all([
          supabase.from("notifications").select("*").eq("priority", "important")
            .order("created_at", { ascending: false }).limit(100),
          supabase.from("notifications").select("*")
            .order("created_at", { ascending: false }).limit(200),
        ]);
        if (!alive) return;
        if (imp.error && all.error) throw imp.error;
        const byId = new Map<string, Notification>();
        [...(imp.data ?? []), ...(all.data ?? [])].forEach((r) => byId.set(r.id, mapDbToNotif(r as DbNotification)));
        // Keep anything that arrived live while this request was running.
        setNotifications((prev) => {
          prev.forEach((n) => { if (!byId.has(n.id)) byId.set(n.id, n); });
          const merged = Array.from(byId.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          cacheData(companyId, "notifications", merged);
          return merged;
        });
      } catch {
        // Offline — load from cache
        if (!navigator.onLine) {
          const cached = await getCachedData<Notification[]>(companyId, "notifications");
          if (cached && alive) setNotifications(cached);
        }
      }
    };

    const subscribe = () => {
      if (!navigator.onLine) return;
      channel = supabase
        .channel(`notifications-realtime-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as DbNotification;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === row.id)) return prev;
              return [mapDbToNotif(row), ...prev];
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as DbNotification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === row.id ? mapDbToNotif(row) : n))
            );
          }
        )
        .subscribe();
    };

    const handleOffline = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const handleOnline = () => {
      load();
      subscribe();
    };

    load();
    subscribe();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      alive = false;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (channel) supabase.removeChannel(channel);
    };
  }, [companyId, user?.id]);

  const addNotification = useCallback(
    async (type: NotificationType, title: string, description: string) => {
      if (!companyId || !user) return;
      await supabase.from("notifications").insert({
        company_id: companyId,
        user_id: user.id,
        type,
        title,
        message: description,
      });
    },
    [companyId, user]
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);

  const markManyAsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const set = new Set(ids);
    setNotifications((prev) => prev.map((n) => (set.has(n.id) ? { ...n, read: true } : n)));
    for (let i = 0; i < ids.length; i += 200) {
      await supabase.from("notifications").update({ read: true }).in("id", ids.slice(i, i + 200));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!companyId) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("company_id", companyId)
      .eq("read", false);
  }, [companyId]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markManyAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
