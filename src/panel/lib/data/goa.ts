// Goa Live Final: the ONE place its numbers live. The panel tournament data, the public event page and the checkout
// all read from here, and every derived amount (pool, winners, share of pool) is computed, never typed in by hand.

export const GOA_EVENT_ID = "goa-live-final-2026";

/** Prize per finishing place, 1st first. Top 5 are paid, so the pool is exactly $15,000. Nothing after the last entry. */
export const GOA_PRIZES: readonly number[] = [5000, 4000, 3000, 2000, 1000];

export const GOA_ENTRY_FEE = 500;
export const GOA_SEATS = 300;
/** Sample seats shown as already sold; passes bought in this browser are added on top. Set to 0 at launch. */
export const GOA_SEATS_DEMO_TAKEN = 37;

/** Default start, used until an admin saves a different one (see goaSchedule below). 17:00 IST = 11:30 UTC. */
export const GOA_STARTS_AT = "2026-11-23T11:30:00Z";
export const GOA_DURATION_HOURS = 24;
const HOUR_MS = 3600000;
export const GOA_ENDS_AT = new Date(Date.parse(GOA_STARTS_AT) + GOA_DURATION_HOURS * HOUR_MS).toISOString();
export const GOA_REGISTRATION_OPENS = "2026-10-22T04:30:00Z";
export const GOA_REGISTRATION_CLOSES = "2026-11-22T12:30:00Z"; // 18:00 IST

export const GOA_PRIZE_POOL = GOA_PRIZES.reduce((sum, amount) => sum + amount, 0);
export const GOA_WINNERS = GOA_PRIZES.length;

export interface GoaPrizeRow {
  place: number;
  label: string;
  amount: number;
  /** Share of the prize pool, rounded to one decimal. */
  share: number;
}

export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return n + "th";
  return n + (["th", "st", "nd", "rd"][n % 10] ?? "th");
}

export const goaPrizeRows = (): GoaPrizeRow[] =>
  GOA_PRIZES.map((amount, i) => ({
    place: i + 1,
    label: ordinal(i + 1),
    amount,
    share: Math.round((amount / GOA_PRIZE_POOL) * 1000) / 10,
  }));

export const usd = (n: number): string => "$" + n.toLocaleString("en-US");

/* Admin-editable start. The site is static, so the admin's choice is kept in localStorage like every other demo
   setting; GOA_STARTS_AT above is what ships in the build and what every visitor sees until it is changed. */
const SCHEDULE_KEY = "bt-goa-schedule";

export interface GoaSchedule {
  startsAt: string;
  endsAt: string;
}

const scheduleFrom = (startsAt: string): GoaSchedule => ({
  startsAt,
  endsAt: new Date(Date.parse(startsAt) + GOA_DURATION_HOURS * HOUR_MS).toISOString(),
});

export const GOA_DEFAULT_SCHEDULE = scheduleFrom(GOA_STARTS_AT);

export function goaSchedule(): GoaSchedule {
  if (typeof window === "undefined") return GOA_DEFAULT_SCHEDULE;
  const saved = window.localStorage.getItem(SCHEDULE_KEY);
  if (saved && !Number.isNaN(Date.parse(saved))) return scheduleFrom(saved);
  return GOA_DEFAULT_SCHEDULE;
}

/** Saves a new start (ISO string), or clears it with null to go back to the default. */
export function saveGoaStart(startsAt: string | null): void {
  if (startsAt === null) window.localStorage.removeItem(SCHEDULE_KEY);
  else window.localStorage.setItem(SCHEDULE_KEY, startsAt);
}

const IST = "Asia/Kolkata";
/** "23 Nov 2026" in India time. */
export const istDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });
/** "17:00" in India time. */
export const istTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: false });
/** "23 Nov" in India time. */
export const istDay = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: IST, day: "numeric", month: "short" });

/** Converts an India-time date ("2026-11-23") and time ("17:00") from the admin form into an ISO instant. */
export const istToIso = (date: string, time: string): string => new Date(date + "T" + time + ":00+05:30").toISOString();
/** The reverse, for filling the admin form: { date: "2026-11-23", time: "17:00" }. */
export function isoToIstParts(iso: string): { date: string; time: string } {
  const shifted = new Date(Date.parse(iso) + 5.5 * HOUR_MS).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}
