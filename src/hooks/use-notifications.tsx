import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

let idCounter = 0;
const genId = () => `notif-${++idCounter}-${Date.now()}`;

const seedNotifications: Notification[] = [
  {
    id: "seed-1",
    type: "order_placed",
    title: "New Order Received",
    description: "Order #1042 from Sharma Traders has been placed.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: "seed-2",
    type: "stock_alert",
    title: "Low Stock Alert",
    description: "Premium Cement (50kg) is running low — only 12 bags left.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: "seed-3",
    type: "team_update",
    title: "Team Member Added",
    description: "Ravi Kumar joined as Sales Manager.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((type: NotificationType, title: string, description: string) => {
    setNotifications((prev) => [
      { id: genId(), type, title, description, timestamp: new Date(), read: false },
      ...prev,
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

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
