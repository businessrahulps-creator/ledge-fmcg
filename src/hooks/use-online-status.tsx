import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getQueue, replaySingleMutation } from "@/lib/offline-store";

/**
 * Walks the offline mutation queue and replays each entry against the
 * server. Called automatically on the `online` event, and exported so
 * the user-facing "Sync now" button can trigger it manually.
 *
 * Returns counts so the caller can decide what (if anything) to toast.
 * - `synced`: replays that succeeded (or were already idempotent).
 * - `failed`: replays that errored (left in the queue with attempts++).
 */
export async function flushPendingWrites(): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  // Replay in FIFO order so dependent mutations resolve in the order they were queued.
  for (const mutation of queue) {
    const res = await replaySingleMutation(mutation);
    if (res.ok) synced++;
    else failed++;
  }
  return { synced, failed };
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  // Guard against double-flush if the browser fires `online` rapidly.
  const flushingRef = useRef(false);

  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      toast.success("You're back online", { duration: 3000 });

      if (flushingRef.current) return;
      flushingRef.current = true;
      try {
        const { synced, failed } = await flushPendingWrites();
        if (synced > 0) {
          toast.success(`Synced ${synced} offline change${synced === 1 ? "" : "s"}`, {
            duration: 4000,
          });
        }
        if (failed > 0) {
          toast.error(`${failed} change${failed === 1 ? "" : "s"} failed to sync`, {
            description: "We'll keep retrying. Tap refresh if the issue persists.",
            duration: 6000,
          });
        }
      } finally {
        flushingRef.current = false;
      }
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
