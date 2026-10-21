// Storage + formatting helpers — same behaviour as the old BTPanel.readStore / readJSON / money / countdown.
// Browser-only: call from effects or event handlers, never during render.

export const PROFILE_KEY = "bt-profile";
export const TOUR_DONE_KEY = "bt-tour-done";
export const WALLET_KEY = "bt-wallet";
export const BLOCKED_KEY = "bt-admin-blocked";

export function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStore(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage blocked: state lasts for this page only
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const value: unknown = JSON.parse(readStore(key) || "null");
    return value === null ? fallback : (value as T);
  } catch {
    return fallback; // corrupt value
  }
}

export function writeJSON(key: string, value: unknown): void {
  writeStore(key, JSON.stringify(value));
}

export const pad2 = (n: number): string => (n < 10 ? "0" : "") + n;

export const money = (n: number): string =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Next occurrence of `hour`:00 local time (today, or tomorrow if it has passed). */
export function nextAt(hour: number): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

/** "HH:MM:SS" until `target`, never negative. */
export function countdown(target: Date): string {
  const seconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  return pad2(Math.floor(seconds / 3600)) + ":" + pad2(Math.floor(seconds / 60) % 60) + ":" + pad2(seconds % 60);
}
