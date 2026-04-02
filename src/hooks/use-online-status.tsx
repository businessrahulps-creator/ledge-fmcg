import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      toast.success("You're back online", { duration: 3000 });
    };
    const goOffline = () => {
      setOnline(false);
      toast("You're offline", {
        description: "Showing cached data. Changes will sync when reconnected.",
        duration: 5000,
      });
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
