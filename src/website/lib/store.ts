// localStorage contract shared with the user panel and admin (same origin via multi-zones).
// Keys and record shapes must stay identical to the old static site: the admin reads them as-is.

export const LEADS_KEY = "bt-leads";
export const USERS_KEY = "bt-users";
/** Signed-up trader's own profile; the user panel reads it as the current user. */
export const PROFILE_KEY = "bt-profile";
/** Set by the panel after its first-run tour; cleared on signup so a new account sees the tour. */
export const TOUR_DONE_KEY = "bt-tour-done";

// Contact topics that belong in the admin's Partnership inbox rather than Contact.
export const PARTNER_TOPICS = ["partners", "whitelabel", "ib"];

export type LeadType = "join" | "contact" | "partnership";

export interface LeadInput {
  type: LeadType;
  name: string;
  email: string;
  phone: string;
  country: string;
  topic: string;
  message: string;
}

export interface Lead extends LeadInput {
  id: string;
  /** Old site stored the file name ("contact.html"); kept in that form so the admin's "page" column still reads the same. */
  page: string;
  at: string;
  status: "new";
}

export function readList<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Route path (e.g. "/contact/") → the old page file name the admin expects ("contact.html"). */
export function pageName(pathname: string): string {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return (slug || "index") + ".html";
}

export function saveLead(input: LeadInput): void {
  try {
    const leads = readList<Lead>(LEADS_KEY);
    leads.unshift({
      ...input,
      id: "ld-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      page: pageName(location.pathname),
      at: new Date().toISOString(),
      status: "new",
    });
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch {
    // Storage blocked or full: the visitor still sees the confirmation, the lead is just not kept.
  }
}
