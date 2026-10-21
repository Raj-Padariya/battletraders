// Formatting + filtering helpers — port of the old window.BTUI (admin.js) non-DOM parts.
// money/num/date/cap are pure; `ago` and `textOn` depend on the clock / DOM, so call them after mount.

export const money = (n: unknown): string => {
  const value = Number(n) || 0;
  return (value < 0 ? "-$" : "$") +
    Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 });
};

export const num = (n: unknown): string => (Number(n) || 0).toLocaleString("en-US");

export function date(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }
  return d.toLocaleString("en-GB", opts);
}

export function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return "";
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + " h ago";
  const days = Math.round(hours / 24);
  return days < 30 ? days + " d ago" : date(iso);
}

export const cap = (s: unknown): string => {
  const text = String(s || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Case-insensitive match of `q` against any of the given fields (keys or getters). */
export function matches<T>(item: T, q: string, fields: (keyof T | ((item: T) => unknown))[]): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((field) => {
    const value = typeof field === "function" ? field(item) : item[field];
    return value !== undefined && value !== null && String(value).toLowerCase().indexOf(needle) !== -1;
  });
}

export type Tone = "ok" | "warn" | "bad" | "info" | "muted";

export const STATUS_TONE: Record<string, Tone> = {
  new: "info", contacted: "warn", closed: "muted",
  live: "bad", registering: "ok", upcoming: "info", completed: "muted",
  completed_tx: "ok", pending: "warn", failed: "bad",
  verified: "ok", rejected: "bad", draft: "muted", none: "muted",
  active: "ok", blocked: "bad", sample: "muted", registered: "info",
};

/** "#111" or "#fff" — whichever has more contrast on the given colour (hex, rgb() or hsl()). Browser only. */
export function textOn(color: string): string {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const parts = getComputedStyle(probe).color.match(/[\d.]+/g) || ["0", "0", "0"];
  probe.remove();
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * lin(+parts[0]) + 0.7152 * lin(+parts[1]) + 0.0722 * lin(+parts[2]);
  return (luminance + 0.05) / 0.0611 > 1.05 / (luminance + 0.05) ? "#111" : "#fff";
}

/* Theme: the pre-paint script in layout.tsx sets data-theme before first paint. */
export const THEME_KEY = "bt-admin-theme";
export type Theme = "light" | "dark";

export const currentTheme = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

export function setTheme(value: Theme): void {
  document.documentElement.setAttribute("data-theme", value);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = value === "light" ? "#F3F1FA" : "#07070C";
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // storage blocked: theme still applies for this page
  }
}

/** Inline <head> script — identical to the old admin pages, so the theme never flashes. */
export const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem("${THEME_KEY}");}catch(e){}if(t!=="light"&&t!=="dark")t=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==="light"?"#F3F1FA":"#07070C";})();`;

/** URL prefix of the admin area (routes live under app/(admin)/admin). Every in-admin href and asset path needs it. */
export const BASE_PATH = "/admin";
export const asset = (path: string): string => BASE_PATH + path;
