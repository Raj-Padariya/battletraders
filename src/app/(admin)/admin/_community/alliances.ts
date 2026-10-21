// Seeded sample alliances — copy of the panel's src/lib/data/alliances.ts (old app/assets/js/alliances-data.js),
// which the old admin alliances.html loaded as window.BTAlliances. Read-only here: the admin only lists alliances.
// Reads localStorage "bt-alliances-created", "bt-alliance-requests", "bt-alliance-joined" and "bt-profile",
// so call these only from effects / event handlers.
import { buildTraders, hashString, seededRandom } from "@admin/lib/data/sample";

export type AllianceTier = "Gold" | "Silver" | "Bronze";
export type JoinPolicy = "open" | "approval" | "invite";
export type MemberRole = "Leader" | "Officer" | "Recruit";

export interface AllianceMember {
  handle: string;
  role: MemberRole;
  avgTrades: number;
  /** Minutes since last seen. */
  lastOnline: number;
  style: string;
  points: number;
  you?: boolean;
}

export interface DominanceParts {
  season: number;
  win: number;
  momentum: number;
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  tier: AllianceTier;
  joinPolicy: JoinPolicy;
  description: string;
  founded: string;
  leader: string;
  members: AllianceMember[];
  seasonPoints: number;
  winRate: number | null;
  momentum: number;
  record: { w: number; l: number };
  daysIdle: number;
  streak: string;
  bestStreak: string;
  breakdown: { placements: number; participation: number; profit: number; matches: number };
  achievements: string[];
  created: boolean;
  dominanceParts: DominanceParts;
  dominance: number;
  level: number;
}

type AllianceBase = Omit<Alliance, "dominanceParts" | "dominance" | "level">;

const KEY_CREATED = "bt-alliances-created";
const KEY_REQUESTS = "bt-alliance-requests";
const KEY_JOINED = "bt-alliance-joined";
const PROFILE_KEY = "bt-profile";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

const me = (): string => readJSON<{ username?: string } | null>(PROFILE_KEY, null)?.username || "trader";

// name, tag, tier, policy, member count, description, leader (first ones lead with known sample traders)
type Seed = [name: string, tag: string, tier: AllianceTier, policy: JoinPolicy, count: number, description: string, leader: string | null];
const SEEDS: Seed[] = [
  ["Three Arrows Battle Desk", "3ABD", "Gold", "invite", 14, "Disciplined risk, ruthless entries. Top-10 finishers only.", "wolf_of_fx"],
  ["Tokyo Thunder", "TT", "Gold", "approval", 12, "Asian session specialists. We trade the open and sleep through London.", "bear_hunter"],
  ["Pip Syndicate", "PIPS", "Silver", "open", 11, "Every pip counts. Friendly crew, weekly strategy calls.", "pip_sniper"],
  ["Karachi Market Club", "KMC", "Silver", "approval", 9, "", "delta_force"],
  ["Delta Raiders", "DRT", "Silver", "open", 10, "Momentum hunters raiding the majors every Daily Battle.", "scalp_king"],
  ["Chameleon FX", "CHAM", "Bronze", "open", 8, "We adapt to any market. Scalpers and swing traders welcome.", "candle_queen"],
  ["Trend Force", "TF", "Bronze", "invite", 7, "Ride the trend, never fight it.", "trend_rider"],
  ["X-Trader Legion", "XTL", "Bronze", "open", 6, "", "fx_viper"],
  ["Golden Candles", "GC", "Bronze", "approval", 6, "Gold and indices only. XAU/USD is life.", "gold_rush"],
  ["Night Shift Capital", "NSC", "Bronze", "open", 5, "For traders who never sleep.", "night_owl"],
  ["Fibonacci Order", "FIBO", "Bronze", "approval", 5, "Retracements, extensions and patience.", "fib_master"],
  ["Breakout Brigade", "BRKB", "Bronze", "open", 4, "", "breakout_bob"],
  ["Iron Hands Guild", "IRON", "Bronze", "invite", 4, "Diamond conviction, iron discipline.", "iron_hands"],
  ["Alpha Wolves", "ALFA", "Bronze", "open", 4, "Hunting alpha as a pack.", null],
  ["Red Line Raiders", "RLR", "Bronze", "open", 3, "", null],
  ["Sigma Scalpers", "SIGS", "Bronze", "approval", 3, "One-minute charts and nerves of steel.", null],
  ["Moonshot Collective", "MOON", "Bronze", "open", 3, "New alliance, big ambitions. Join the climb.", null],
  ["Stop Hunters Union", "SHU", "Bronze", "invite", 2, "", null],
  ["Swing Society", "SWNG", "Bronze", "open", 2, "Hold overnight, sleep well.", null],
  ["Blue Chip Battalion", "BCB", "Bronze", "open", 2, "", null],
];
const FOUNDED = ["2025-11-04", "2025-12-12", "2026-01-08", "2026-01-21", "2026-02-02", "2026-02-17", "2026-03-03", "2026-03-19",
  "2026-04-06", "2026-04-22", "2026-05-09", "2026-05-27", "2026-06-11", "2026-06-30", "2026-07-14", "2026-08-01",
  "2026-08-19", "2026-09-05", "2026-09-22", "2026-10-03"];
const WORD_A = ["pip", "lunar", "neon", "rapid", "silent", "crimson", "atlas", "nova", "zen", "volt", "cobalt", "omega", "turbo", "echo", "frost", "solar"];
const WORD_B = ["falcon", "trader", "sniper", "raider", "fox", "lynx", "ronin", "hawk", "tiger", "viper", "wolf", "pilot", "shark", "titan", "monk", "spark"];
const STYLES = ["Scalper", "Swing", "Day trader"];
const TIER_BASE: Record<AllianceTier, number> = { Gold: 5200, Silver: 2600, Bronze: 600 };
const ROLE_ORDER: Record<MemberRole, number> = { Leader: 0, Officer: 1, Recruit: 2 };

const slug = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Dominance = 45% season points + 30% win rate + 25% momentum (each on a points scale). */
const dominanceParts = (a: AllianceBase): DominanceParts => ({
  season: Math.round(a.seasonPoints * 0.45),
  win: Math.round((a.winRate || 0) * 10 * 0.3),
  momentum: Math.round(a.momentum * 10 * 0.25),
});
const withDerived = (a: AllianceBase): Alliance => {
  const parts = dominanceParts(a);
  return { ...a, dominanceParts: parts, dominance: parts.season + parts.win + parts.momentum, level: 1 + Math.floor(a.seasonPoints / 2500) };
};

function buildSeeded(): Alliance[] {
  const usedHandles = new Set(buildTraders().map((t) => t.handle));
  const freshHandle = (rand: () => number): string => {
    for (let tries = 0; tries < 50; tries++) {
      const handle = WORD_A[Math.floor(rand() * WORD_A.length)] + "_" + WORD_B[Math.floor(rand() * WORD_B.length)] + (tries > 8 ? Math.floor(rand() * 90 + 10) : "");
      if (!usedHandles.has(handle)) {
        usedHandles.add(handle);
        return handle;
      }
    }
    return "trader_" + Math.floor(rand() * 1e6);
  };

  return SEEDS.map((seed, i) => {
    const [name, tag, tier, joinPolicy, count, description, leader] = seed;
    const rand = seededRandom(hashString(tag) + 31);
    const seasonPoints = Math.round(TIER_BASE[tier] * (0.7 + rand() * 0.6) * (1 - i * 0.02));
    let wins = Math.round(2 + rand() * (tier === "Bronze" ? 6 : 14));
    let losses = Math.round(rand() * 8);
    if (i >= 17) {
      wins = i === 17 ? 1 : 0;
      losses = 0;
    }
    const played = wins + losses;
    const members: AllianceMember[] = [];
    for (let m = 0; m < count; m++) {
      const handle = m === 0 && leader ? leader : freshHandle(rand);
      members.push({
        handle,
        role: m === 0 ? "Leader" : m <= Math.floor(count / 5) ? "Officer" : "Recruit",
        avgTrades: Math.round((4 + rand() * 30) * 10) / 10,
        lastOnline: m === 0 ? Math.round(rand() * 90) : Math.round(rand() * rand() * 7200),
        style: STYLES[Math.floor(rand() * STYLES.length)],
        points: Math.round((seasonPoints / count) * (0.4 + rand() * 1.2)),
      });
    }
    members.sort((x, y) => ROLE_ORDER[x.role] - ROLE_ORDER[y.role] || y.points - x.points);
    const placements = Math.round(seasonPoints * (0.35 + rand() * 0.1));
    const participation = Math.round(seasonPoints * (0.2 + rand() * 0.08));
    const profit = Math.round(seasonPoints * (0.12 + rand() * 0.08));
    const best = Math.max(1, Math.round(wins * (0.3 + rand() * 0.4)));
    return withDerived({
      id: slug(tag) + "-" + slug(name).split("-")[0],
      name,
      tag,
      tier,
      joinPolicy,
      description,
      founded: FOUNDED[i],
      leader: members[0].handle,
      members,
      seasonPoints,
      winRate: played ? Math.round((wins / played) * 1000) / 10 : null,
      momentum: Math.round(4 + rand() * (tier === "Bronze" ? 30 : 70)),
      record: { w: wins, l: losses },
      daysIdle: Math.floor(rand() * 4),
      streak: wins ? "W" + Math.max(1, Math.round(best * rand())) : "—",
      bestStreak: wins ? "W" + best : "—",
      breakdown: { placements, participation, profit, matches: seasonPoints - placements - participation - profit },
      achievements: [],
      created: false,
    });
  });
}

let seededCache: Alliance[] | null = null;
const seeded = (): Alliance[] => (seededCache ??= buildSeeded());

const createdList = (): Alliance[] => {
  const stored = readJSON<unknown>(KEY_CREATED, []);
  return Array.isArray(stored) ? (stored as Alliance[]) : [];
};
const joinedId = (): string | null => {
  const id = readJSON<unknown>(KEY_JOINED, null);
  return typeof id === "string" ? id : null;
};

/** Copy of an alliance with the signed-in user added as a Recruit when they joined it. */
const hydrate = (a: Alliance): Alliance => {
  const copy = JSON.parse(JSON.stringify(a)) as Alliance;
  const user = me();
  const inList = copy.members.some((m) => m.handle === user);
  if (!copy.created && joinedId() === copy.id && !inList) {
    copy.members.push({ handle: user, role: "Recruit", avgTrades: 0, lastOnline: 0, style: "Unrated", points: 0, you: true });
  }
  copy.members.forEach((m) => {
    if (m.handle === user) m.you = true;
  });
  return withDerived(copy);
};

const list = (): Alliance[] =>
  seeded().concat(createdList()).map(hydrate).sort((x, y) => y.dominance - x.dominance || x.name.localeCompare(y.name));

const get = (id: string | null): Alliance | null => {
  if (!id) return null;
  const found = seeded().find((a) => a.id === id) || createdList().find((a) => a.id === id);
  return found ? hydrate(found) : null;
};

/** The alliance the user belongs to (leads or joined), or null. */
const mine = (): Alliance | null => {
  const user = me();
  const own = createdList().find((a) => a.leader === user);
  if (own) return hydrate(own);
  return get(joinedId());
};

const requests = (): string[] => {
  const ids = readJSON<unknown>(KEY_REQUESTS, []);
  return Array.isArray(ids) ? (ids as string[]) : [];
};
const isRequested = (id: string): boolean => requests().includes(id);

const CREST_COLORS = ["#A64DFF", "#33CCFF", "#FF33FF", "#22E39A", "#FFC433", "#FF6B4D", "#5C7CFF", "#14B8A6", "#E879F9", "#F59E0B"];
const crestColor = (name: string): string => CREST_COLORS[hashString(String(name)) % CREST_COLORS.length];
const initials = (name: string): string => {
  const words = String(name).replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "AL";
  return (words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : words[0].slice(0, 2)).toUpperCase();
};

/** The subset of the old `window.BTAlliances` the admin uses. */
export const BTAlliances = { list, get, mine, requests, isRequested, crestColor, initials };
