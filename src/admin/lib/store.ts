/* =====================================================================
   BattleTrader Admin — data layer. Port of admin/assets/js/admin-store.js (window.BTAdmin).
   Every admin screen reads and writes through this file only.

   BROWSER-ONLY: every function here touches localStorage / sessionStorage, Date.now() or document
   (downloads). Call them ONLY in useEffect or event handlers, never during render — otherwise the
   server HTML and the browser disagree and hydration fails.

   Accounts come from three places, all returned in ONE shape (an "account record"):
   - live:       the account signed in on this browser (bt-profile, bt-wallet, bt-transactions, …)
   - registered: other sign-ups in this browser (bt-users) — profile only, no activity stored
   - demo:       generated accounts (bt-admin-demo, see demo.ts) so every screen has real-looking data
   When a backend exists, replace accounts()/saveAccount()/leads() with API calls; screens don't change.
   Storage contract: .tenaxcode/notes/admin-brief.md
   ===================================================================== */
import { BTAdminConfig } from "./config";
import { generate } from "./demo";
import { buildTraders, type Tier } from "./data/sample";
import {
  BTTournaments as T,
  type Enrollment, type PaidWith, type Tournament, type TournamentStatus, type TournamentType, type Voucher, type VoucherKind,
} from "./data/tournaments";

/* ---------- Record types (the storage contract) ---------- */

/** `bt-profile` (current user) — also the profile of every account record. bt-users rows have the first six fields only. */
export interface Profile {
  username: string;
  fullName: string;
  email: string;
  country: string;
  countryName: string;
  joined: string;
  timezone?: string;
  gender?: string;
  phone?: string;
  phoneVerified?: boolean;
  avatar?: string;
  discord?: string;
  telegram?: string;
  frame?: string;
}

/** `bt-users` row. */
export interface RegisteredUser {
  username: string;
  fullName: string;
  email: string;
  country: string;
  countryName: string;
  joined: string;
}

/** `bt-wallet`. */
export interface Wallet {
  balance: number;
  credits: number;
  tickets: number;
}

export type TransactionType = "topup" | "entry" | "cashout" | "refund" | "reward";
export type TransactionStatus = "completed" | "pending" | "failed";

/** `bt-transactions` row (newest first). */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  at: string;
  status: TransactionStatus;
  note: string;
}

export type KycStatus = "none" | "draft" | "pending" | "verified" | "rejected";

/** `bt-kyc`. The admin writes only status, reviewedAt and reviewNote. */
export interface Kyc {
  status: KycStatus;
  fullName?: string;
  dob?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  idFile?: string;
  addressFile?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/** `bt-affiliate`. */
export interface Affiliate {
  code: string;
  generatedAt: string;
  referrals: number;
  cash: number;
  credits: number;
  tickets: number;
}

/** Arena summary stored on demo accounts. The live `bt-arena` is owned by the Arena page and kept as-is. */
export interface DemoArena {
  battlesPlayed: number;
  wins: number;
  podiums: number;
  winRate: number;
  bestStreak: number;
  level: number;
}
export type ArenaState = DemoArena | Record<string, unknown>;

export interface AccountStats {
  rank: number;
  points: number;
  tier: Tier | string;
}

export type AccountSource = "registered" | "demo";

interface AccountBase {
  username: string;
  source: AccountSource;
  /** Only demo accounts carry this; the live blocked list is `bt-admin-blocked`. */
  status?: "active" | "blocked";
  lastActive: string;
  profile: Profile;
  wallet: Wallet | null;
  transactions: Transaction[];
  enrollments: Record<string, Enrollment>;
  vouchers: Voucher[];
  kyc: Kyc;
  affiliate: Affiliate | null;
  arena: ArenaState | null;
  stats: AccountStats | null;
}

/** The one shape accounts() returns, whatever the source. */
export interface AccountRecord extends AccountBase {
  live: boolean;
  hasData: boolean;
}

/** A demo account as stored in `bt-admin-demo` (no live / hasData). */
export type DemoAccount = AccountBase;

export type LeadType = "contact" | "join" | "partnership";
export type LeadStatus = "new" | "contacted" | "closed";

/** `bt-leads` row (newest first). */
export interface Lead {
  id: string;
  type: LeadType;
  name: string;
  email: string;
  phone: string;
  country: string;
  topic: string;
  message: string;
  page: string;
  at: string;
  status: LeadStatus;
}
/** leads() row: demo leads are flagged. */
export interface LeadRow extends Lead {
  demo?: boolean;
}

/** `bt-admin-demo`. */
export interface DemoDb {
  enabled: boolean;
  seededAt?: string;
  users: DemoAccount[];
  leads: Lead[];
}

export interface TournamentResult {
  rank: number;
  handle: string;
  points: number;
  prize: number;
}
/** `bt-admin-tournaments` item: a full tournament plus optional results. */
export interface AdminTournament extends Tournament {
  results?: TournamentResult[];
}
/** saveTournament() input — no id means "add". */
export type TournamentInput = Omit<AdminTournament, "id"> & { id?: string };

/** `bt-admin-codes` row. */
export interface AdminCode {
  code: string;
  kind: VoucherKind;
  value: number;
  appliesTo: TournamentType[];
  days: number;
  active: boolean;
  createdAt: string;
}
export interface VoucherSpec {
  code: string;
  kind: VoucherKind;
  value: number | string;
  appliesTo: TournamentType[];
  days: number | string;
}

/** `bt-admin-log` row (newest first, capped at 500). */
export interface AuditEntry {
  at: string;
  action: string;
  detail: string;
}

/** `bt-admin-config` — optional override of the default login in config.ts. */
export interface AdminConfigOverride {
  email: string;
  passwordHash: string;
}
/** sessionStorage `bt-admin-session`. */
export interface AdminSession {
  email: string;
  expiresAt: number;
}
/** sessionStorage `bt-admin-attempts`. */
export interface LoginAttempts {
  count: number;
  lockedUntil: number;
}

/* ---------- Row / view types returned by BTAdmin ---------- */
export interface UserRow {
  username: string;
  fullName: string;
  email: string;
  country: string;
  countryName: string;
  joined: string;
  source: AccountSource;
  live: boolean;
  hasData: boolean;
  blocked: boolean;
  balance: number | null;
  kycStatus: KycStatus;
  lastActive: string;
  rank: number | null;
  points: number | null;
  tier: string;
}
export interface EnrollmentRow {
  id: string;
  name: string;
  at: string;
  paidWith: PaidWith;
  amount: number;
}
export interface UserDetail {
  user: UserRow;
  kind: "live" | AccountSource;
  isCurrent: boolean;
  profile: Profile;
  kyc: Kyc | null;
  wallet: Wallet | null;
  transactions: Transaction[];
  enrollments: EnrollmentRow[];
  vouchers: Voucher[];
  alliance: AllianceInfo | null;
  arena: ArenaState | null;
  affiliate: Affiliate | null;
}
export interface TransactionRow extends Transaction {
  username: string;
  demo: boolean;
}
export interface WalletAccountRow {
  username: string;
  fullName: string;
  balance: number;
  live: boolean;
  demo: boolean;
}
export type AdjustWalletResult = null | { error: string } | { tx: Transaction; wallet: Wallet };
export interface VoucherRow extends Voucher {
  username: string;
}
export type CreateVoucherResult = { ok: true; code: AdminCode } | { ok: false; error: string };
export interface KycRow {
  username: string;
  fullName: string;
  live: boolean;
  demo: boolean;
  kyc: Kyc;
}
export type ReviewKycResult = { ok: true; kyc: Kyc } | { ok: false; error: string };
export interface AffiliateRow {
  username: string;
  code: string;
  generatedAt: string;
  demo: boolean;
  referrals: number;
  cash: number;
  credits: number;
  tickets: number;
}
export interface AchievementRow {
  id: string;
  name: string;
  category: string;
  rarity: string;
  description: string;
  xp: number;
  credits: number;
  playersPct: number;
  hidden: boolean;
  pct: number;
  unlocked: boolean;
}
export interface AdminStats {
  users: number;
  demoUsers: number;
  blocked: number;
  leadsNew: number;
  leadsTotal: number;
  battlesLive: number;
  battlesUpcoming: number;
  battlesTotal: number;
  topupTotal: number;
  topupCount: number;
  kycPending: number;
  cashoutPending: number;
  balanceHeld: number;
}
export interface ActivityItem {
  at: string;
  kind: "user" | "tx" | "kyc" | "lead";
  title: string;
  sub: string;
  href: string;
}
/** [key or getter, header] — one CSV column. */
export type CsvColumn<R> = readonly [keyof R | ((row: R) => unknown), string];

/* ---------- Optional data modules ----------
   The old store used window.BTAlliances / window.BTAchievements only when the page had loaded them,
   and fell back to []/null otherwise. The admin app has no copy of those modules yet, so a page that
   has them registers them here; until then the same fallbacks apply. */
export interface AllianceInfo {
  id: string;
  name: string;
  leader: string;
  members?: { handle: string }[];
}
export interface AllianceProvider {
  list(): AllianceInfo[];
  mine(): AllianceInfo | null;
}
export interface AchievementInfo {
  id: string;
  name: string;
  category: string;
  rarity: string | { name: string };
  description: string;
  xp: number;
  credits: number;
  playersPct: number;
  hidden: boolean;
}
export interface AchievementProvider {
  list: readonly AchievementInfo[];
  progressFor(profile: object): Record<string, number>;
  evaluate(a: AchievementInfo, progress: Record<string, number>): { pct: number; unlocked: boolean };
}
let alliancesModule: AllianceProvider | null = null;
let achievementsModule: AchievementProvider | null = null;
export function registerAdminModules(mods: { alliances?: AllianceProvider; achievements?: AchievementProvider }): void {
  if (mods.alliances) alliancesModule = mods.alliances;
  if (mods.achievements) achievementsModule = mods.achievements;
}

/* ---------- Storage helpers ---------- */
const DAY_MS = 86400000;
const LOG_CAP = 500;
const DEMO_KEY = "bt-admin-demo";

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const read = (key: string, fallback: unknown = null): unknown => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "null");
    return value === null ? fallback : value;
  } catch {
    return fallback; // missing or corrupt
  }
};
const write = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // storage full or blocked
  }
};
/** Array of records; non-object items (corrupt data) are dropped. */
const readArray = <R extends object>(key: string): R[] => {
  const value = read(key, []);
  return Array.isArray(value) ? value.filter((x: unknown): x is R => isRecord(x)) : [];
};
const readStrings = (key: string): string[] => {
  const value = read(key, []);
  return Array.isArray(value) ? value.filter((x: unknown): x is string => typeof x === "string") : [];
};
const readObject = <R extends object>(key: string): R | null => {
  const value = read(key, null);
  return isRecord(value) ? (value as R) : null;
};
const clone = <V,>(value: V): V => JSON.parse(JSON.stringify(value)) as V;
const uid = (prefix: string): string => prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const round2 = (n: number): number => Math.round(n * 100) / 100;
const time = (iso: string | undefined | null): number => new Date(iso || 0).getTime();

/* ---------- Audit log ---------- */
const log = (action: string, detail?: string): void => {
  const entries = readArray<AuditEntry>("bt-admin-log");
  entries.unshift({ at: new Date().toISOString(), action, detail: detail || "" });
  write("bt-admin-log", entries.slice(0, LOG_CAP));
};

const blockedList = (): string[] => readStrings("bt-admin-blocked");

/* ---------- Demo database ---------- */
const seedDemo = (enabled?: boolean): DemoDb => {
  const gen = generate(buildTraders(), T.list());
  const db: DemoDb = { enabled: enabled !== false, seededAt: new Date().toISOString(), users: gen.users, leads: gen.leads };
  write(DEMO_KEY, db);
  const blocked = blockedList();
  gen.users.forEach((u) => {
    if (u.status === "blocked" && blocked.indexOf(u.username) === -1) blocked.push(u.username);
  });
  write("bt-admin-blocked", blocked);
  return db;
};
/** The demo db; created (switched on) the first time an admin data page opens. */
const demoDb = (): DemoDb => {
  const db = read(DEMO_KEY, null);
  if (isRecord(db) && Array.isArray(db.users)) {
    return {
      enabled: db.enabled !== false,
      seededAt: typeof db.seededAt === "string" ? db.seededAt : undefined,
      users: db.users.filter((u: unknown): u is DemoAccount => isRecord(u)),
      leads: Array.isArray(db.leads) ? db.leads.filter((l: unknown): l is Lead => isRecord(l)) : [],
    };
  }
  return seedDemo(true);
};
const demoEnabled = (): boolean => demoDb().enabled !== false;
const setDemoEnabled = (enabled: boolean): void => {
  const db = demoDb();
  if (enabled && !db.users.length) {
    seedDemo(true);
  } else {
    db.enabled = !!enabled;
    write(DEMO_KEY, db);
  }
  log(enabled ? "Showed demo data" : "Hid demo data", "");
};
const regenerateDemo = (): void => {
  const old = demoDb();
  const oldNames = (old.users || []).map((u) => u.username);
  write("bt-admin-blocked", blockedList().filter((name) => oldNames.indexOf(name) === -1));
  seedDemo(true);
  log("Regenerated demo data", "");
};

/* ---------- Accounts ---------- */
const normaliseKyc = (k: unknown): Kyc => (isRecord(k) && k.status ? (k as unknown as Kyc) : { status: "none" });
const normaliseWallet = (w: unknown): Wallet => {
  const src = isRecord(w) ? w : {};
  return { balance: Number(src.balance) || 0, credits: Number(src.credits) || 0, tickets: Number(src.tickets) || 0 };
};
const sampleStats = (username: string): AccountStats | null => {
  const t = buildTraders().filter((x) => x.handle === username)[0];
  return t ? { rank: t.rank, points: t.points, tier: t.tier } : null;
};

const liveAccount = (): AccountRecord | null => {
  const p = readObject<Profile>("bt-profile");
  if (!p || !p.username) return null;
  return {
    username: p.username, source: "registered", live: true, hasData: true, lastActive: "",
    profile: p,
    wallet: normaliseWallet(read("bt-wallet", null)),
    transactions: readArray<Transaction>("bt-transactions"),
    enrollments: readObject<Record<string, Enrollment>>("bt-enrollments") || {},
    vouchers: readArray<Voucher>("bt-vouchers"),
    kyc: normaliseKyc(read("bt-kyc", null)),
    affiliate: readObject<Affiliate>("bt-affiliate"),
    arena: readObject<Record<string, unknown>>("bt-arena"),
    stats: sampleStats(p.username),
  };
};

/** Every account, newest sign-up first. opts.demo === false leaves the demo accounts out. */
const accounts = (opts?: { demo?: boolean }): AccountRecord[] => {
  const list: AccountRecord[] = [];
  const seen: Record<string, boolean> = {};
  const push = (rec: AccountRecord | null) => {
    if (!rec || !rec.username || seen[rec.username]) return;
    seen[rec.username] = true;
    list.push(rec);
  };
  push(liveAccount());
  readArray<RegisteredUser>("bt-users").forEach((u) => {
    push({
      username: u.username, source: "registered", live: false, hasData: false, lastActive: "",
      profile: u, wallet: null, transactions: [], enrollments: {}, vouchers: [],
      kyc: { status: "none" }, affiliate: null, arena: null, stats: sampleStats(u.username),
    });
  });
  if (!opts || opts.demo !== false) {
    const db = demoDb();
    if (db.enabled !== false) {
      db.users.forEach((u) => {
        const copy = clone(u);
        push({ ...copy, source: "demo", live: false, hasData: true, kyc: normaliseKyc(copy.kyc), wallet: normaliseWallet(copy.wallet) });
      });
    }
  }
  return list.sort((a, b) => time(b.profile.joined) - time(a.profile.joined));
};
const account = (username: string): AccountRecord | null => accounts().filter((a) => a.username === username)[0] || null;
/** Persists a changed account record back to wherever it lives. */
const saveAccount = (rec: AccountRecord): boolean => {
  if (rec.live) {
    return write("bt-wallet", rec.wallet) && write("bt-transactions", rec.transactions) && write("bt-kyc", rec.kyc);
  }
  if (rec.source === "demo") {
    const db = demoDb();
    db.users = db.users.map((u) => {
      if (u.username !== rec.username) return u;
      // live / hasData are derived on read, never stored.
      const { live: _live, hasData: _hasData, ...copy } = clone(rec);
      return copy;
    });
    return write(DEMO_KEY, db);
  }
  return false; // registered-only accounts have no stored activity yet
};

/* ---------- Users ---------- */
const toRow = (rec: AccountRecord, blocked: string[]): UserRow => {
  const p: Partial<Profile> = rec.profile || {};
  return {
    username: rec.username, fullName: p.fullName || "", email: p.email || "",
    country: p.country || "", countryName: p.countryName || "", joined: p.joined || "",
    source: rec.source, live: rec.live, hasData: rec.hasData,
    blocked: blocked.indexOf(rec.username) !== -1,
    balance: rec.wallet ? rec.wallet.balance : null,
    kycStatus: rec.kyc ? rec.kyc.status : "none",
    lastActive: rec.lastActive || "",
    rank: rec.stats ? rec.stats.rank : null, points: rec.stats ? rec.stats.points : null, tier: rec.stats ? rec.stats.tier : "",
  };
};
const users = (opts?: { demo?: boolean }): UserRow[] => {
  const blocked = blockedList();
  return accounts(opts).map((rec) => toRow(rec, blocked));
};
const user = (username: string): UserRow | null => users().filter((u) => u.username === username)[0] || null;
const allianceOf = (rec: AccountRecord): AllianceInfo | null => {
  const B = alliancesModule;
  if (!B) return null;
  if (rec.live) return B.mine();
  return B.list().filter((a) => a.leader === rec.username || (a.members || []).some((m) => m.handle === rec.username))[0] || null;
};
const enrollmentList = (map: Record<string, Enrollment> | null | undefined): EnrollmentRow[] => {
  const all = map || {};
  return Object.keys(all).map((id) => {
    const t = T.get(id);
    return { id, name: t ? t.name : id, at: all[id].at, paidWith: all[id].paidWith, amount: all[id].amount };
  }).sort((a, b) => time(b.at) - time(a.at));
};
/** Everything about one account, for the user detail page. */
const userDetail = (username: string): UserDetail | null => {
  const rec = account(username);
  if (!rec) return null;
  return {
    user: toRow(rec, blockedList()),
    kind: rec.live ? "live" : rec.source,
    isCurrent: rec.hasData,
    profile: rec.profile,
    kyc: rec.hasData ? rec.kyc : null,
    wallet: rec.hasData ? rec.wallet : null,
    transactions: rec.transactions || [],
    enrollments: enrollmentList(rec.enrollments),
    vouchers: rec.vouchers || [],
    alliance: allianceOf(rec),
    arena: rec.arena,
    affiliate: rec.affiliate,
  };
};
const block = (username: string): void => {
  const list = blockedList();
  if (list.indexOf(username) === -1) list.push(username);
  write("bt-admin-blocked", list);
  log("Blocked user", "@" + username);
};
const unblock = (username: string): void => {
  write("bt-admin-blocked", blockedList().filter((u) => u !== username));
  log("Unblocked user", "@" + username);
};

/* ---------- Leads (website forms + demo) ---------- */
const leads = (): LeadRow[] => {
  const live: LeadRow[] = readArray<Lead>("bt-leads");
  const db = demoDb();
  const demo: LeadRow[] = db.enabled !== false ? (db.leads || []).map((l) => ({ ...clone(l), demo: true })) : [];
  return live.concat(demo).sort((a, b) => time(b.at) - time(a.at));
};
/** Runs fn(list, lead) on whichever store holds the lead id and saves it. */
const withLead = (id: string, fn: (list: Lead[], lead: Lead) => Lead[] | void): Lead | null => {
  const live = readArray<Lead>("bt-leads");
  let hit = live.filter((l) => l.id === id)[0];
  if (hit) { const r = fn(live, hit); write("bt-leads", r || live); return hit; }
  const db = demoDb();
  hit = (db.leads || []).filter((l) => l.id === id)[0];
  if (hit) { const d = fn(db.leads, hit); db.leads = d || db.leads; write(DEMO_KEY, db); return hit; }
  return null;
};
const setLeadStatus = (id: string, status: LeadStatus): boolean => {
  const lead = withLead(id, (list, l) => { l.status = status; });
  if (lead) log("Lead marked " + status, lead.name + " <" + lead.email + ">");
  return !!lead;
};
const deleteLead = (id: string): void => {
  const lead = withLead(id, (list) => list.filter((l) => l.id !== id));
  if (lead) log("Deleted lead", lead.name + " <" + lead.email + ">");
};

/* ---------- Battles (tournaments) ---------- */
const tournaments = (): AdminTournament[] => T.list();
const isBuiltIn = (id: string): boolean => T.baseList().some((t) => t.id === id);
const slugify = (s: string): string =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "battle";
/** Adds (no id / unknown id) or replaces a battle. Returns the saved battle. */
const saveTournament = (data: TournamentInput): AdminTournament => {
  let edits = readArray<AdminTournament>("bt-admin-tournaments");
  const draft = clone(data);
  const isNew = !draft.id;
  let id = draft.id || "";
  if (isNew) {
    const base = slugify(draft.name);
    id = base;
    let n = 2;
    const taken = (candidate: string) => tournaments().some((t) => t.id === candidate);
    while (taken(id)) id = base + "-" + n++;
  }
  const battle: AdminTournament = { ...draft, id };
  edits = edits.filter((t) => t.id !== battle.id);
  edits.push(battle);
  write("bt-admin-tournaments", edits);
  // Re-adding an id that was deleted earlier should make it visible again.
  write("bt-admin-tournaments-deleted", readStrings("bt-admin-tournaments-deleted").filter((x) => x !== battle.id));
  log(isNew ? "Added battle" : "Edited battle", battle.name);
  return battle;
};
const deleteTournament = (id: string): void => {
  const t = T.get(id);
  write("bt-admin-tournaments", readArray<AdminTournament>("bt-admin-tournaments").filter((x) => x.id !== id));
  if (isBuiltIn(id)) {
    const deleted = readStrings("bt-admin-tournaments-deleted");
    if (deleted.indexOf(id) === -1) deleted.push(id);
    write("bt-admin-tournaments-deleted", deleted);
  }
  log("Deleted battle", t ? t.name : id);
};
/** Results: [{rank, handle, points, prize}] sorted by rank; marks the battle completed. */
const setResults = (id: string, results: TournamentResult[]): AdminTournament | null => {
  const t = T.get(id);
  if (!t) return null;
  const updated: AdminTournament = clone(t);
  updated.results = results.slice().sort((a, b) => a.rank - b.rank);
  if (updated.results.length) updated.status = "completed";
  else delete updated.status;
  const edits = readArray<AdminTournament>("bt-admin-tournaments").filter((x) => x.id !== id);
  edits.push(updated);
  write("bt-admin-tournaments", edits);
  log(updated.results.length ? "Published results" : "Cleared results", t.name);
  return updated;
};
const statusOf = (t: Tournament): TournamentStatus => T.statusOf(t);
/** How many accounts entered each battle: {battleId: count}. */
const entryCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  accounts().forEach((rec) => {
    Object.keys(rec.enrollments || {}).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
  });
  return counts;
};

/* ---------- Wallet & transactions (all accounts) ---------- */
const wallet = (username: string): Wallet | null => {
  const rec = account(username);
  return rec && rec.wallet ? rec.wallet : null;
};
/** Every transaction of every account, newest first, with its username. */
const transactions = (): TransactionRow[] => {
  const list: TransactionRow[] = [];
  accounts().forEach((rec) => {
    (rec.transactions || []).forEach((t) => {
      list.push({ ...clone(t), username: rec.username, demo: rec.source === "demo" });
    });
  });
  return list.sort((a, b) => time(b.at) - time(a.at));
};
/** Accounts that have a wallet (can be adjusted). */
const walletAccounts = (): WalletAccountRow[] => {
  const rows: WalletAccountRow[] = [];
  accounts().forEach((rec) => {
    if (!rec.hasData || !rec.wallet) return;
    rows.push({ username: rec.username, fullName: rec.profile.fullName || "", balance: rec.wallet.balance, live: rec.live, demo: rec.source === "demo" });
  });
  return rows;
};
/** Positive amount credits (reward row), negative debits (refund row with an admin note). */
const adjustWallet = (username: string, amount: number | string, note?: string): AdjustWalletResult => {
  const value = round2(Number(amount));
  if (!value) return null;
  const rec = account(username);
  if (!rec || !rec.wallet) return { error: "This user has no wallet yet." };
  if (rec.wallet.balance + value < 0) return { error: "Balance can't go below $0." };
  rec.wallet.balance = round2(rec.wallet.balance + value);
  const tx: Transaction = {
    id: uid("tx"), type: value > 0 ? "reward" : "refund", amount: Math.abs(value),
    at: new Date().toISOString(), status: "completed",
    note: (value > 0 ? "Admin credit" : "Admin debit") + (note ? " — " + note : ""),
  };
  rec.transactions.unshift(tx);
  if (!saveAccount(rec)) return { error: "Couldn't save — browser storage is full." };
  log(value > 0 ? "Credited wallet" : "Debited wallet", "@" + username + " $" + Math.abs(value).toFixed(2) + (note ? " — " + note : ""));
  return { tx, wallet: rec.wallet };
};
const setTransactionStatus = (id: string, status: TransactionStatus): boolean => {
  const rec = accounts().filter((a) => (a.transactions || []).some((t) => t.id === id))[0];
  if (!rec) return false;
  const tx = rec.transactions.filter((t) => t.id === id)[0];
  tx.status = status;
  saveAccount(rec);
  log("Transaction " + status, "@" + rec.username + " " + tx.type + " $" + Number(tx.amount).toFixed(2));
  return true;
};

/* ---------- Vouchers & redeem codes ---------- */
/** Vouchers held by every account, with the username. */
const vouchers = (): VoucherRow[] => {
  const list: VoucherRow[] = [];
  accounts().forEach((rec) => {
    (rec.vouchers || []).forEach((v) => {
      list.push({ ...clone(v), username: rec.username });
    });
  });
  return list.sort((a, b) => time(b.addedAt) - time(a.addedAt));
};
const adminCodes = (): AdminCode[] => readArray<AdminCode>("bt-admin-codes");
/** Creates a redeem code users can enter on the Redeem page. Returns {ok, code} or {ok:false, error}. */
const createVoucher = (spec: VoucherSpec): CreateVoucherResult => {
  const code = String(spec.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{4,16}$/.test(code)) return { ok: false, error: "Use 4–16 letters or numbers." };
  if (adminCodes().some((c) => c.code === code)) return { ok: false, error: "That code already exists." };
  const entry: AdminCode = {
    code, kind: spec.kind, value: Number(spec.value) || 0, appliesTo: spec.appliesTo.slice(),
    days: Math.max(1, Math.round(Number(spec.days) || 30)), active: true, createdAt: new Date().toISOString(),
  };
  const list = adminCodes();
  list.unshift(entry);
  write("bt-admin-codes", list);
  log("Created code", code);
  return { ok: true, code: entry };
};
const setCodeActive = (code: string, active: boolean): void => {
  const list = adminCodes();
  const entry = list.filter((c) => c.code === code)[0];
  if (!entry) return;
  entry.active = active;
  write("bt-admin-codes", list);
  log(active ? "Enabled code" : "Disabled code", code);
};
const deleteCode = (code: string): void => {
  write("bt-admin-codes", adminCodes().filter((c) => c.code !== code));
  log("Deleted code", code);
};

/* ---------- KYC (all accounts) ---------- */
const kyc = (username: string): Kyc => {
  const rec = account(username);
  return rec ? rec.kyc : { status: "none" };
};
/** Every account that has started KYC: [{username, fullName, live, demo, kyc}], submissions newest first. */
const kycList = (): KycRow[] => {
  return accounts().filter((rec) => rec.kyc && rec.kyc.status !== "none").map((rec) => ({
    username: rec.username, fullName: rec.kyc.fullName || rec.profile.fullName || "", live: rec.live, demo: rec.source === "demo", kyc: rec.kyc,
  })).sort((a, b) => time(b.kyc.submittedAt) - time(a.kyc.submittedAt));
};
/** decision: "verified" | "rejected". Rejection requires a note the user will see. */
const reviewKyc = (username: string, decision: "verified" | "rejected", note?: string): ReviewKycResult => {
  const rec = account(username);
  if (!rec || rec.kyc.status !== "pending") return { ok: false, error: "There is no submission waiting for review." };
  if (decision === "rejected" && !String(note || "").trim()) return { ok: false, error: "Add a note so the user knows what to fix." };
  rec.kyc.status = decision;
  rec.kyc.reviewedAt = new Date().toISOString();
  rec.kyc.reviewNote = decision === "rejected" ? String(note).trim().slice(0, 300) : "";
  if (!saveAccount(rec)) return { ok: false, error: "Couldn't save — browser storage is full." };
  log(decision === "verified" ? "Approved KYC" : "Rejected KYC", "@" + username + (rec.kyc.fullName ? " — " + rec.kyc.fullName : ""));
  return { ok: true, kyc: rec.kyc };
};

/* ---------- Community ---------- */
const alliances = (): AllianceInfo[] => (alliancesModule ? alliancesModule.list() : []);
const myAlliance = (): AllianceInfo | null => (alliancesModule ? alliancesModule.mine() : null);
const allianceRequests = (): string[] => readStrings("bt-alliance-requests");
/** Every account with a referral code. */
const affiliates = (): AffiliateRow[] => {
  const rows: AffiliateRow[] = [];
  accounts().forEach((rec) => {
    const a = rec.affiliate;
    if (!a || !a.code) return;
    rows.push({
      username: rec.username, code: a.code, generatedAt: a.generatedAt, demo: rec.source === "demo",
      referrals: Number(a.referrals) || 0, cash: Number(a.cash) || 0, credits: Number(a.credits) || 0, tickets: Number(a.tickets) || 0,
    });
  });
  return rows.sort((a, b) => b.referrals - a.referrals);
};
const achievements = (): AchievementRow[] => {
  const A = achievementsModule;
  if (!A) return [];
  const progress = A.progressFor(readObject<Profile>("bt-profile") || {});
  return A.list.map((a) => {
    const state = A.evaluate(a, progress);
    const rarity = typeof a.rarity === "object" && a.rarity && a.rarity.name ? a.rarity.name : String(a.rarity || "");
    return {
      id: a.id, name: a.name, category: a.category, rarity,
      description: a.description, xp: a.xp, credits: a.credits, playersPct: a.playersPct,
      hidden: a.hidden, pct: state.pct, unlocked: state.unlocked,
    };
  });
};

/* ---------- Dashboard ---------- */
const stats = (): AdminStats => {
  const all = tournaments();
  const statuses = all.map(statusOf);
  const accs = accounts();
  const txs = transactions();
  const topups = txs.filter((t) => t.type === "topup" && t.status === "completed");
  const allLeads = leads();
  return {
    users: accs.length,
    demoUsers: accs.filter((a) => a.source === "demo").length,
    blocked: blockedList().filter((name) => accs.some((a) => a.username === name)).length,
    leadsNew: allLeads.filter((l) => l.status === "new").length,
    leadsTotal: allLeads.length,
    battlesLive: statuses.filter((s) => s === "live").length,
    battlesUpcoming: statuses.filter((s) => s === "upcoming" || s === "registering").length,
    battlesTotal: all.length,
    topupTotal: round2(topups.reduce((sum, t) => sum + Number(t.amount || 0), 0)),
    topupCount: topups.length,
    kycPending: accs.filter((a) => a.kyc && a.kyc.status === "pending").length,
    cashoutPending: txs.filter((t) => t.type === "cashout" && t.status === "pending").length,
    balanceHeld: round2(accs.reduce((sum, a) => sum + (a.wallet ? a.wallet.balance : 0), 0)),
  };
};
/** Latest signups, leads, transactions and KYC submissions, merged and newest first.
    hrefs are full /admin routes for next/link — the old file pointed at foo.html. */
const activity = (limit?: number): ActivityItem[] => {
  const items: ActivityItem[] = [];
  accounts().forEach((rec) => {
    const p: Partial<Profile> = rec.profile || {};
    const href = "/admin/user/?u=" + encodeURIComponent(rec.username);
    if (p.joined) items.push({ at: p.joined, kind: "user", title: "@" + rec.username + " signed up", sub: p.countryName || p.email || "", href });
    (rec.transactions || []).forEach((t) => {
      items.push({ at: t.at, kind: "tx", title: t.type.charAt(0).toUpperCase() + t.type.slice(1) + " $" + Number(t.amount).toFixed(2) + " · @" + rec.username, sub: t.note || t.status, href: "/admin/transactions/?u=" + encodeURIComponent(rec.username) });
    });
    if (rec.kyc && rec.kyc.submittedAt) items.push({ at: rec.kyc.submittedAt, kind: "kyc", title: "KYC submitted by @" + rec.username, sub: rec.kyc.status, href: "/admin/kyc/?u=" + encodeURIComponent(rec.username) });
  });
  leads().forEach((l) => {
    items.push({ at: l.at, kind: "lead", title: "New " + l.type + " lead from " + (l.name || "someone"), sub: l.topic || l.email, href: "/admin/leads/?id=" + encodeURIComponent(l.id) });
  });
  items.sort((a, b) => time(b.at) - time(a.at));
  return items.slice(0, limit || 12);
};

/* ---------- Export & reset ---------- */
const csvCell = (value: unknown): string => {
  let s = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formulas (CSV injection) and quote every cell.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
const download = (filename: string, text: string, type: string): void => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
};
/** rows: array of plain objects; columns: [[key|fn, header]]. Triggers a download. */
const exportCSV = <R extends object>(filename: string, columns: readonly CsvColumn<R>[], rows: readonly R[]): void => {
  const lines = [columns.map((c) => csvCell(c[1])).join(",")];
  rows.forEach((row) => {
    lines.push(columns.map((c) => {
      const getter = c[0];
      return csvCell(typeof getter === "function" ? getter(row) : row[getter]);
    }).join(","));
  });
  download(filename, "\uFEFF" + lines.join("\r\n"), "text/csv;charset=utf-8");
  log("Exported CSV", filename);
};
const allKeys = (): string[] => {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("bt-") === 0) keys.push(k);
    }
  } catch {
    // storage blocked
  }
  return keys.sort();
};
const exportAll = (): void => {
  const data: Record<string, unknown> = {};
  allKeys().forEach((k) => { data[k] = read(k, null); });
  download("battletrader-data-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(data, null, 2), "application/json");
  log("Exported all data", allKeys().length + " keys");
};
/** Clears every bt-* key except the admin's own login config and audit log. Demo data is rebuilt on next load. */
const resetDemo = (): void => {
  const keep = ["bt-admin-config", "bt-admin-log"];
  allKeys().forEach((k) => {
    if (keep.indexOf(k) === -1) {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    }
  });
  log("Reset all data", "");
};
/** Approximate bytes used by bt-* keys (UTF-16: 2 bytes per char). */
const storageUsed = (): number => {
  let total = 0;
  allKeys().forEach((k) => {
    try { total += (k.length + (localStorage.getItem(k) || "").length) * 2; } catch { /* ignore */ }
  });
  return total;
};
const auditLog = (): AuditEntry[] => readArray<AuditEntry>("bt-admin-log");

/** Drop-in for the old `window.BTAdmin` — same method names, arguments and return shapes. */
export const BTAdmin = {
  read, write, log, auditLog, DAY_MS,
  demoEnabled, setDemoEnabled, regenerateDemo,
  accounts, users, user, userDetail, block, unblock, blockedList,
  leads, setLeadStatus, deleteLead,
  tournaments, saveTournament, deleteTournament,
  setResults, statusOf, isBuiltIn, entryCounts,
  wallet, walletAccounts, transactions, adjustWallet, setTransactionStatus,
  vouchers, adminCodes, createVoucher, setCodeActive, deleteCode,
  kyc, kycList, reviewKyc,
  alliances, myAlliance, allianceRequests, affiliates, achievements,
  stats, activity,
  exportCSV, exportAll, resetDemo, storageUsed,
};

/* ---------- Admin login & session ----------
   In the old app these lived in admin.js (window.BTUI: config/hash/session/startSession/endSession)
   and login.js (attempts lockout). Kept separate from BTAdmin so BTAdmin's surface stays identical. */
const SESSION_KEY = "bt-admin-session";
const ATTEMPTS_KEY = "bt-admin-attempts";

/** Login in effect: the Settings override in `bt-admin-config` wins over config.ts. */
const authConfig = (): AdminConfigOverride => {
  const saved = readObject<Partial<AdminConfigOverride>>("bt-admin-config");
  return {
    email: (saved && saved.email) || BTAdminConfig.email,
    passwordHash: (saved && saved.passwordHash) || BTAdminConfig.passwordHash,
  };
};
/** SHA-256 hex of "bt-admin:" + password. Rejects with Error("no-crypto") where SubtleCrypto is missing (non-secure context). */
const hash = (password: string): Promise<string> => {
  if (!window.crypto || !window.crypto.subtle) return Promise.reject(new Error("no-crypto"));
  const bytes = new TextEncoder().encode("bt-admin:" + password);
  return window.crypto.subtle.digest("SHA-256", bytes).then((buf) =>
    Array.prototype.map.call(new Uint8Array(buf), (b: number) => ("0" + b.toString(16)).slice(-2)).join(""),
  );
};
/** The current session, or null when missing / expired / corrupt. */
const session = (): AdminSession | null => {
  try {
    const s: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return isRecord(s) && typeof s.expiresAt === "number" && s.expiresAt > Date.now() ? (s as unknown as AdminSession) : null;
  } catch {
    return null;
  }
};
const startSession = (email: string): void => {
  const value: AdminSession = { email, expiresAt: Date.now() + (BTAdminConfig.sessionHours || 8) * 3600000 };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
};
const endSession = (): void => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
};
const attempts = (): LoginAttempts => {
  try {
    const a: unknown = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) || "null");
    if (isRecord(a)) return { count: Number(a.count) || 0, lockedUntil: Number(a.lockedUntil) || 0 };
  } catch {
    // corrupt: start over
  }
  return { count: 0, lockedUntil: 0 };
};
const saveAttempts = (a: LoginAttempts): void => {
  try { sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a)); } catch { /* ignore */ }
};

export const BTAdminAuth = {
  SESSION_KEY, ATTEMPTS_KEY,
  maxAttempts: BTAdminConfig.maxAttempts || 5,
  lockMs: (BTAdminConfig.lockMinutes || 5) * 60000,
  config: authConfig, hash, session, startSession, endSession, attempts, saveAttempts,
};
