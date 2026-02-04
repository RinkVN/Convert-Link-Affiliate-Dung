import { useEffect, useRef } from "react";
import { loadLocalSubId } from "@/lib/storage";
import { sendSessionBeacon } from "@/lib/sessionTracking";

export function useSessionTracking() {
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const start = startRef.current;

    const handleUnload = () => {
      const durationSeconds = Math.round((Date.now() - start) / 1000);
      const subId = loadLocalSubId();
      sendSessionBeacon(durationSeconds, subId || undefined);
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);
}
