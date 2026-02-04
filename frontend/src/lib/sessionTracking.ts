const API_BASE = import.meta.env.VITE_API_URL || "";

export function sendSessionBeacon(durationSeconds: number, subId?: string) {
  const url = `${API_BASE.replace(/\/$/, "")}/api/events`;
  const body = JSON.stringify({
    type: "session",
    subId: subId || undefined,
    durationSeconds,
  });
  navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
}
