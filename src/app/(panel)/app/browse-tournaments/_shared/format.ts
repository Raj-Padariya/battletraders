// Formatting + state helpers from the old tournaments.js, shared by Browse, Details and the enroll dialog.
// Every function that needs "now" or stored enrollments takes them as arguments so render stays pure.
import { BTTournaments, statusOf, type Enrollment, type Tournament, type TournamentStatus } from "@panel/lib/data/tournaments";
import { money, pad2, readJSON, writeJSON } from "@panel/lib/storage";

export const PATHS = {
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  dollar: '<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.8c0 4.8 10 2.6 10 7.6 0 2.2-2.2 3.6-5 3.6s-5-1.2-5-3.4"/>',
} as const;
export type PathName = keyof typeof PATHS;

export const round2 = (n: number): number => Math.round(n * 100) / 100;
export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const fmtShort = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const fmtTime = (iso: string): string => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (iso: string): string => fmtDate(iso) + ", " + fmtTime(iso);
export function fmtRange(t: Tournament): string {
  const sameDay = new Date(t.start).toDateString() === new Date(t.end).toDateString();
  return fmtShort(t.start) + ", " + fmtTime(t.start) + " \u2013 " + (sameDay ? "" : fmtShort(t.end) + ", ") + fmtTime(t.end);
}
export function duration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (days > 0) return days + "d " + hours + "h " + mins + "m";
  if (hours > 0) return hours + "h " + pad2(mins) + "m " + pad2(secs) + "s";
  return mins + "m " + pad2(secs) + "s";
}
export function ordinal(n: number): string {
  const rem = n % 100;
  if (rem >= 11 && rem <= 13) return n + "th";
  return n + (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] || "th");
}
export function flagOf(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code || "")) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

export const STATUS_LABEL: Record<TournamentStatus, string> = { registering: "Registering", upcoming: "Upcoming", live: "Live", completed: "Completed" };
export const TYPE_SHORT: Record<string, string> = { main: "Main", circuit: "Circuit", mini: "Mini" };
export const detailUrl = (t: Tournament): string => "/app/tournament/?id=" + encodeURIComponent(t.id);
export const entryText = (t: Tournament): string => (t.entryFee > 0 ? money(t.entryFee) : t.entryLabel || "Free");

export function cdText(t: Tournament, now: number): string {
  const status = statusOf(t, now);
  if (status === "completed") return "Finished " + fmtShort(t.end);
  if (status === "live") return "Ends in " + duration(new Date(t.end).getTime() - now);
  return "Starts in " + duration(new Date(t.start).getTime() - now);
}

export type EntryState = "open" | "enrolled" | "live" | "full" | "closed" | "completed";
export function entryState(t: Tournament, now: number, enrolled: Record<string, Enrollment>): EntryState {
  const status = statusOf(t, now);
  if (status === "completed") return "completed";
  if (Object.prototype.hasOwnProperty.call(enrolled, t.id)) return "enrolled";
  if (status === "live") return "live";
  if (t.participants >= t.maxParticipants) return "full";
  if (status === "upcoming") return "closed";
  return "open";
}

/** Browser-only snapshot used by the pages after mount. */
export const loadEnrollments = (): Record<string, Enrollment> => BTTournaments.enrollments();

/** Old addTx: prepends a record to `bt-transactions` (shape shared with the Wallet page). */
export interface StoredTx {
  id: string;
  type: string;
  amount: number;
  at: string;
  status: string;
  note: string;
}
export function addTx(type: string, amount: number, note: string): void {
  let list = readJSON<StoredTx[]>("bt-transactions", []);
  if (!Array.isArray(list)) list = [];
  list.unshift({
    id: "tx-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type, amount: round2(amount), at: new Date().toISOString(), status: "completed", note,
  });
  writeJSON("bt-transactions", list);
}
