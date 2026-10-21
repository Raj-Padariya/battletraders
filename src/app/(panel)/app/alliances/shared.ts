// Shared by
import { BTAlliances as A, type Alliance } from "@panel/lib/data/alliances";
import type { PanelApi } from "@panel/lib/panel";

export const AL_ICONS = {
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  medal: '<path d="M7 3h10l-3 6h-4z"/><circle cx="12" cy="15" r="6"/>',
  replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
} as const;

export const num = (n: number): string => Number(n).toLocaleString("en-US");
export const winText = (a: Alliance): string => (a.winRate === null ? "N/A" : a.winRate.toFixed(1) + "%");
export const POLICY_LABEL = { open: "Open", approval: "Approval", invite: "Invite only" } as const;

/** Join / request from either page. Returns true when state changed. */
export function attemptJoin(a: Alliance, toast: PanelApi["toast"]): boolean {
  if (a.joinPolicy === "approval") {
    const r = A.request(a.id);
    if (!r.ok) {
      toast("Can't send request", r.reason === "already" ? "You're already in " + r.alliance.name + "." : "This alliance doesn't take requests.", "error");
      return false;
    }
    toast("Request sent", "The leaders of " + a.name + " will review your request.");
    return true;
  }
  const res = A.join(a.id);
  if (!res.ok) {
    const why = res.reason === "already" ? "You're already in " + res.alliance.name + ". One alliance per fighter."
      : res.reason === "full" ? "This alliance is full." : "This alliance is invite-only.";
    toast("Can't join", why, "error");
    return false;
  }
  toast("Welcome to " + a.name, "You joined [" + a.tag + "]. Battle together this season.");
  return true;
}
