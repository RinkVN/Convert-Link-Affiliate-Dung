import type { HistoryItem } from "@/types";

const LOCAL_SUBID_KEY = "shopee_aff_subId";
const LOCAL_HISTORY_KEY = "shopee_aff_history";

export function loadLocalSubId(): string {
  try {
    return localStorage.getItem(LOCAL_SUBID_KEY) || "";
  } catch {
    return "";
  }
}

export function saveLocalSubId(subId: string) {
  try {
    if (subId) {
      localStorage.setItem(LOCAL_SUBID_KEY, subId);
    } else {
      localStorage.removeItem(LOCAL_SUBID_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalHistory(history: HistoryItem[]) {
  try {
    localStorage.setItem(
      LOCAL_HISTORY_KEY,
      JSON.stringify(history.slice(0, 10))
    );
  } catch {
    // ignore
  }
}
