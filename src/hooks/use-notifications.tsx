import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type NotificationType = "order_placed" | "stock_alert" | "team_update" | "general";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, title: string, description: string) => void;
  markAsRead: (id: string) => void;
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
}

function mapDbToNotif(row: DbNotification): Notification {
  return {
    id: row.id,
    type: (row.type as NotificationType) || "general",
    title: row.title,
    description: row.message,
    timestamp: new Date(row.created_at),
    read: row.read,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, companyId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch on mount / when companyId changes
  useEffect(() => {
    if (!companyId) {
      setNotifications([]);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data.map(mapDbToNotif));
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
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
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as DbNotification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === row.id ? mapDbToNotif(row) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

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
      // Realtime subscription will add it to local state
    },
    [companyId, user]
  );

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
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
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
