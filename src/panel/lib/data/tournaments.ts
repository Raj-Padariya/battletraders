// Sample tournament data + enrollment/voucher storage — port of the old tournaments-data.js (window.BTTournaments).
// ONE source for Browse, Details, My Tournaments, Dashboard and the enrollment dialog; the backend replaces it later.
// Dates are relative to "now" and everything reads localStorage, so call these ONLY in effects / handlers
// (never during render) — otherwise server HTML and the browser disagree and hydration fails.

const HOUR = 3600000;
const DAY = 24 * HOUR;

export type TournamentType = "main" | "circuit" | "mini";
export type TournamentStatus = "upcoming" | "registering" | "live" | "completed";

export interface Round {
  name: string;
  start: string;
  end: string;
  advance?: number;
  winners?: number;
  final?: boolean;
}

export interface BonusPrize {
  name: string;
  note: string;
  amount: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  featured: boolean;
  tagline: string;
  prizePool: number;
  entryFee: number;
  entryLabel?: string;
  start: string;
  end: string;
  registrationCloses: string;
  maxParticipants: number;
  participants: number;
  location: string;
  countryCode: string;
  online: boolean;
  structure: string;
  platform: string;
  instruments: string;
  rounds: Round[];
  prizes: number[];
  bonus: BonusPrize[];
  organizer: string;
  sponsors: string[];
  accent: string;
  /** Set by the admin when results are entered. */
  status?: "completed";
}

export type PaidWith = "wallet" | "credits" | "voucher" | "coupon" | "free";

export interface Enrollment {
  at: string;
  paidWith: PaidWith;
  amount: number;
}

export type VoucherKind = "percent" | "amount" | "free-entry";

export interface Voucher {
  id: string;
  code: string;
  kind: VoucherKind;
  value: number;
  appliesTo: TournamentType[];
  usesLeft: number;
  usesTotal: number;
  addedAt: string;
  expiresAt: string;
  usedAt?: string;
}

interface CodeSpec {
  code?: string;
  kind: VoucherKind;
  value: number;
  appliesTo: TournamentType[];
  days: number;
  active?: boolean;
}

export type RedeemResult = { ok: true; voucher: Voucher } | { ok: false; reason: "invalid" | "used" };

const PRIZES_MAIN = [5000, 2500, 1500, 1000, 750, 500, 500, 500, 500, 500];
const PRIZES_CIRCUIT = [1500, 1000, 500, 250, 250, 250, 250, 250, 250, 250];
const PRIZES_MINI = [1200, 800, 500, 200, 100, 50, 50, 50, 25, 25];

let baseCache: Tournament[] | null = null;

function buildBase(): Tournament[] {
  const now = Date.now();
  // Round to the minute so countdowns and "starts" labels stay stable across reloads within a minute.
  const at = (offsetMs: number) => new Date(Math.floor((now + offsetMs) / 60000) * 60000).toISOString();
  return [
    {
      id: "world-championship-2026", name: "BattleTrader World Championship 2026", type: "main", featured: true,
      tagline: "The season final — only qualified traders fight for the crown.",
      prizePool: 25000, entryFee: 0, entryLabel: "Qualified only",
      start: at(9 * DAY + 4 * HOUR), end: at(9 * DAY + 10 * HOUR), registrationCloses: at(8 * DAY),
      maxParticipants: 64, participants: 41, location: "Dubai, UAE", countryCode: "AE", online: false,
      structure: "Multi-Round", platform: "BattleTrader Play",
      instruments: "All instruments — Forex, Stocks, Crypto, Indices, Commodities and Energies.",
      rounds: [
        { name: "Round 1", start: at(9 * DAY + 4 * HOUR), end: at(9 * DAY + 5 * HOUR), advance: 32 },
        { name: "Round 2", start: at(9 * DAY + 5.5 * HOUR), end: at(9 * DAY + 6.5 * HOUR), advance: 16 },
        { name: "Final", start: at(9 * DAY + 8 * HOUR), end: at(9 * DAY + 10 * HOUR), winners: 10, final: true },
      ],
      prizes: PRIZES_MAIN.slice(), bonus: [{ name: "Most traded lots", note: "Highest total lot volume", amount: 1000 }, { name: "Least drawdown", note: "Smallest peak-to-trough decline", amount: 1000 }],
      organizer: "BattleTrader", sponsors: ["TradesAI", "The Firm Capital", "AimsCap"], accent: "gold",
    },
    {
      id: "circuit-asia-2026", name: "Circuit Asia 2026", type: "circuit", featured: false,
      tagline: "Regional qualifier — top 10 earn a World Championship seat.",
      prizePool: 5000, entryFee: 20,
      start: at(1 * DAY + 20 * HOUR), end: at(1 * DAY + 22.5 * HOUR), registrationCloses: at(1 * DAY + 20 * HOUR),
      maxParticipants: 100, participants: 93, location: "Jakarta, Indonesia", countryCode: "ID", online: false,
      structure: "Multi-Round", platform: "BattleTrader Play",
      instruments: "All instruments — Forex, Stocks, Crypto, Indices, Commodities and Energies.",
      rounds: [
        { name: "Round 1", start: at(1 * DAY + 20 * HOUR), end: at(1 * DAY + 21 * HOUR), advance: 10 },
        { name: "Round 2", start: at(1 * DAY + 21.5 * HOUR), end: at(1 * DAY + 22.5 * HOUR), winners: 10, final: true },
      ],
      prizes: PRIZES_CIRCUIT.slice(), bonus: [{ name: "Most traded lots", note: "Highest total lot volume", amount: 125 }, { name: "Least drawdown", note: "Smallest peak-to-trough decline", amount: 125 }],
      organizer: "BattleTrader", sponsors: ["TradesAI", "The Firm Capital", "AimsCap"], accent: "cyan",
    },
    {
      id: "circuit-europe-2026", name: "Circuit Europe 2026", type: "circuit", featured: false,
      tagline: "London's trading floor goes head to head.",
      prizePool: 5000, entryFee: 20,
      start: at(6 * DAY + 2 * HOUR), end: at(6 * DAY + 5 * HOUR), registrationCloses: at(6 * DAY + 2 * HOUR),
      maxParticipants: 100, participants: 58, location: "London, United Kingdom", countryCode: "GB", online: false,
      structure: "Multi-Round", platform: "BattleTrader Play",
      instruments: "Forex majors, Indices and Gold.",
      rounds: [
        { name: "Round 1", start: at(6 * DAY + 2 * HOUR), end: at(6 * DAY + 3 * HOUR), advance: 10 },
        { name: "Round 2", start: at(6 * DAY + 4 * HOUR), end: at(6 * DAY + 5 * HOUR), winners: 10, final: true },
      ],
      prizes: PRIZES_CIRCUIT.slice(), bonus: [],
      organizer: "BattleTrader", sponsors: ["TradesAI"], accent: "cyan",
    },
    {
      id: "trick-or-trade-2026", name: "Trick or Trade 2026", type: "mini", featured: false,
      tagline: "A spooky single-round sprint — highest return takes the pot.",
      prizePool: 3000, entryFee: 99,
      start: at(15 * DAY + 21 * HOUR), end: at(16 * DAY + 2 * HOUR), registrationCloses: at(15 * DAY + 21 * HOUR),
      maxParticipants: 100, participants: 37, location: "Online", countryCode: "", online: true,
      structure: "Single Round", platform: "BattleTrader Play",
      instruments: "Forex, Crypto and Gold.",
      rounds: [{ name: "Round 1", start: at(15 * DAY + 21 * HOUR), end: at(16 * DAY + 2 * HOUR), winners: 10, final: true }],
      prizes: PRIZES_MINI.slice(), bonus: [],
      organizer: "BattleTrader", sponsors: ["TradesAI"], accent: "pink",
    },
    {
      id: "fx-majors-sprint", name: "FX Majors Sprint", type: "mini", featured: false,
      tagline: "Two hours, seven majors, one winner.",
      prizePool: 500, entryFee: 0, entryLabel: "1 free ticket",
      start: at(-40 * 60000), end: at(80 * 60000), registrationCloses: at(-40 * 60000),
      maxParticipants: 50, participants: 50, location: "Online", countryCode: "", online: true,
      structure: "Single Round", platform: "BattleTrader Play",
      instruments: "EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD.",
      rounds: [{ name: "Round 1", start: at(-40 * 60000), end: at(80 * 60000), winners: 5, final: true }],
      prizes: [200, 125, 75, 50, 50], bonus: [],
      organizer: "BattleTrader", sponsors: [], accent: "purple",
    },
    {
      id: "gold-rush-weekly", name: "Gold Rush Weekly", type: "mini", featured: false,
      tagline: "XAU/USD only. Every Friday.",
      prizePool: 750, entryFee: 10,
      start: at(-6 * DAY), end: at(-6 * DAY + 3 * HOUR), registrationCloses: at(-6 * DAY),
      maxParticipants: 80, participants: 80, location: "Online", countryCode: "", online: true,
      structure: "Single Round", platform: "BattleTrader Play",
      instruments: "XAU/USD.",
      rounds: [{ name: "Round 1", start: at(-6 * DAY), end: at(-6 * DAY + 3 * HOUR), winners: 5, final: true }],
      prizes: [300, 200, 125, 75, 50], bonus: [],
      organizer: "BattleTrader", sponsors: [], accent: "gold",
    },
  ];
}

/** Built once per page load (old script evaluated `now` once at load, too). */
function base(): Tournament[] {
  if (!baseCache) baseCache = buildBase();
  return baseCache;
}

/* Admin layer: `bt-admin-tournaments` holds added or edited battles (same id = override, new id = added),
   `bt-admin-tournaments-deleted` holds ids to hide. Both are written only by the admin panel. */
const ADMIN_KEY = "bt-admin-tournaments";
const ADMIN_DELETED_KEY = "bt-admin-tournaments-deleted";

function readArray<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function mergedList(): Tournament[] {
  const builtIn = base();
  const edits = readArray<Tournament>(ADMIN_KEY);
  const deleted = readArray<string>(ADMIN_DELETED_KEY);
  const editsById: Record<string, Tournament> = {};
  edits.forEach((t) => { if (t && t.id) editsById[t.id] = t; });
  const merged = builtIn.map((t) => editsById[t.id] || t);
  edits.forEach((t) => {
    if (t && t.id && !builtIn.some((b) => b.id === t.id)) merged.push(t);
  });
  return merged.filter((t) => deleted.indexOf(t.id) === -1);
}

/** Computed from the dates, never stored. */
export function statusOf(t: Tournament, nowMs?: number): TournamentStatus {
  if (t.status === "completed") return "completed"; // admin entered results
  const time = nowMs || Date.now();
  if (time >= new Date(t.end).getTime()) return "completed";
  if (time >= new Date(t.start).getTime()) return "live";
  if (time < new Date(t.registrationCloses).getTime()) return "registering";
  return "upcoming";
}

/* Enrollments: { [tournamentId]: Enrollment } */
const KEY = "bt-enrollments";
function readEnrollments(): Record<string, Enrollment> {
  try {
    return (JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, Enrollment>) || {};
  } catch {
    return {};
  }
}
function writeEnrollments(value: Record<string, Enrollment>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage blocked: enrollment lasts for this page only
  }
}

/* Vouchers: shared store `bt-vouchers` (Redeem page adds, enroll dialog applies). Every account starts with WELCOME_GIFT. */
const VOUCHER_KEY = "bt-vouchers";
const DAY_MS = 24 * 3600000;
function welcomeGift(): Voucher {
  return {
    id: "welcome-gift", code: "WELCOME_GIFT", kind: "percent", value: 5, appliesTo: ["circuit", "mini"],
    usesLeft: 1, usesTotal: 1, addedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * DAY_MS).toISOString(),
  };
}
function writeVouchers(list: Voucher[]): void {
  try {
    localStorage.setItem(VOUCHER_KEY, JSON.stringify(list));
  } catch {
    // storage blocked: vouchers last for this page only
  }
}
function readVouchers(): Voucher[] {
  let stored: unknown = null;
  try {
    stored = JSON.parse(localStorage.getItem(VOUCHER_KEY) || "null");
  } catch {
    stored = null;
  }
  if (Array.isArray(stored)) return stored as Voucher[];
  const seeded = [welcomeGift()];
  writeVouchers(seeded);
  return seeded;
}
const isUsable = (v: Voucher) => v.usesLeft > 0 && new Date(v.expiresAt).getTime() > Date.now();

/* Codes the Redeem page accepts (sample). Redeeming one adds a voucher; each code works once per account. */
const REDEEMABLE: Record<string, CodeSpec> = {
  ARENA20: { kind: "amount", value: 20, appliesTo: ["main", "circuit", "mini"], days: 30 },
  BATTLE50: { kind: "amount", value: 50, appliesTo: ["circuit"], days: 14 },
  FREEMINI: { kind: "free-entry", value: 0, appliesTo: ["mini"], days: 7 },
  SEASON10: { kind: "percent", value: 10, appliesTo: ["main", "circuit", "mini"], days: 60 },
};
/* Coupon codes typed straight into the enroll dialog (one-off discount, not stored). */
const COUPONS: Record<string, number> = { ARENA20: 20, BATTLE50: 50 };

const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

/** Drop-in for the old `window.BTTournaments` — same method names and return shapes. */
export const BTTournaments = {
  list: (): Tournament[] => mergedList(),
  get: (id: string): Tournament | null => mergedList().find((t) => t.id === id) || null,
  /** Built-in sample battles before admin changes — the admin uses it to offer "restore". */
  baseList: (): Tournament[] => base().slice(),
  statusOf,
  isEnrolled: (id: string): boolean => has(readEnrollments(), id),
  enrollments: readEnrollments,
  enroll(id: string, details?: { paidWith?: PaidWith; amount?: number }): void {
    const all = readEnrollments();
    all[id] = { at: new Date().toISOString(), paidWith: details?.paidWith || "free", amount: details?.amount || 0 };
    writeEnrollments(all);
  },
  withdraw(id: string): void {
    const all = readEnrollments();
    delete all[id];
    writeEnrollments(all);
  },
  /** Usable vouchers (uses left, not expired). Pass a tournament type to keep only ones that apply to it. */
  vouchers: (type?: TournamentType): Voucher[] =>
    readVouchers().filter((v) => isUsable(v) && (!type || v.appliesTo.indexOf(type) !== -1)),
  /** Every voucher ever added, including used/expired — for the Redeem page's History tab. */
  allVouchers: (): Voucher[] => readVouchers(),
  /** Dollar discount a voucher gives on a given entry fee. */
  voucherDiscount(v: Voucher, entryFee: number): number {
    if (v.kind === "free-entry") return entryFee;
    if (v.kind === "percent") return Math.round(entryFee * v.value) / 100;
    return Math.min(entryFee, v.value);
  },
  useVoucher(id: string): void {
    const list = readVouchers();
    list.forEach((v) => {
      if (v.id === id && v.usesLeft > 0) {
        v.usesLeft -= 1;
        v.usedAt = new Date().toISOString();
      }
    });
    writeVouchers(list);
  },
  /** Redeem a code from the Redeem page. */
  redeemCode(code: string): RedeemResult {
    const key = String(code || "").trim().toUpperCase();
    // Codes created in the admin panel (`bt-admin-codes`): {code, kind, value, appliesTo, days, active}.
    const spec = has(REDEEMABLE, key)
      ? REDEEMABLE[key]
      : readArray<CodeSpec>("bt-admin-codes").find((c) => c && c.code === key && c.active !== false) || null;
    if (!spec) return { ok: false, reason: "invalid" };
    const list = readVouchers();
    if (list.some((v) => v.code === key)) return { ok: false, reason: "used" };
    const voucher: Voucher = {
      id: key.toLowerCase() + "-" + Date.now().toString(36), code: key, kind: spec.kind, value: spec.value,
      appliesTo: spec.appliesTo.slice(), usesLeft: 1, usesTotal: 1,
      addedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + spec.days * DAY_MS).toISOString(),
    };
    list.unshift(voucher);
    writeVouchers(list);
    return { ok: true, voucher };
  },
  /** Discount in dollars for a coupon code, or null if the code is not valid. */
  couponValue(code: string): number | null {
    const key = String(code || "").trim().toUpperCase();
    return has(COUPONS, key) ? COUPONS[key] : null;
  },
  typeLabel: (type: string): string => ({ main: "Main Event", circuit: "Circuit", mini: "Mini" } as Record<string, string>)[type] || type,
};
