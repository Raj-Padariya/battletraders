// Seeded leaderboard results — port of the old leaderboards-data.js (window.BTLeaderboards).
// Archived tournaments + their final standings, and live standings for every BTTournaments event that is live now.
// The archive is anchored to today and reads BTTournaments (localStorage), so call these only from effects/handlers.
import { buildTraders, hashString, seededRandom } from "@panel/lib/data/sample";
import { BTTournaments, type TournamentType } from "@panel/lib/data/tournaments";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const START_BALANCE = 10000;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const AV_COLORS = ["#9333EA", "#0EA5E9", "#DB2777", "#16A34A", "#EA580C", "#4F46E5", "#0D9488", "#CA8A04"];

export interface ArchivedEvent {
  id: string;
  name: string;
  type: TournamentType;
  format: string;
  start: string;
  end: string;
  traders: number;
  prizePool: number;
  prizes: number[];
  sponsors: string[];
}

export interface StandingRow {
  handle: string;
  color: string;
  initials: string;
  pnl: number;
  equity: number;
  roi: number;
  lots: number;
  maxDD: number;
  trades: number;
  prize: number;
  rank: number;
}

export interface LiveEvent extends ArchivedEvent {
  rows: StandingRow[];
}

/* ---------- trader handles: the 20 sample traders + generated ones ---------- */
const PREFIX = ["apex", "bull", "pip", "fx", "delta", "swing", "scalp", "neon", "quant", "iron", "storm", "shadow", "turbo", "lunar", "volt", "hedge", "macro", "omega", "rogue", "zen", "blaze", "frost", "echo", "nova", "titan", "rapid", "crypto", "yen", "cable", "aussie"];
const SUFFIX = ["_trader", "_hawk", "_fox", "_rider", "_wolf", "_hunter", "_sniper", "_ace", "_lynx", "_bolt", "_pilot", "_shark", "_ninja", "_pro", "_max", "_bull", "_one", "_x"];
const POOL: { handle: string; color: string }[] = (() => {
  const rand = seededRandom(99);
  const seen = new Set<string>();
  const list = buildTraders().map((t) => {
    seen.add(t.handle);
    return { handle: t.handle, color: t.color };
  });
  while (list.length < 160) {
    let handle = PREFIX[Math.floor(rand() * PREFIX.length)] + SUFFIX[Math.floor(rand() * SUFFIX.length)];
    if (rand() < 0.3) handle += Math.floor(rand() * 90 + 10);
    if (seen.has(handle)) continue;
    seen.add(handle);
    list.push({ handle, color: AV_COLORS[hashString(handle) % AV_COLORS.length] });
  }
  return list;
})();

const initials = (handle: string): string => {
  const parts = String(handle).split(/[_\-.]+/).filter(Boolean);
  const text = parts.length > 1 ? parts[0].charAt(0) + parts[1].charAt(0) : String(handle).slice(0, 2);
  return text.toUpperCase();
};

/* ---------- archive ---------- */
type Format = "solo" | "team";
const CATALOG: [name: string, type: TournamentType, format: Format][] = [
  ["BattleTrader Racing Tournament", "main", "solo"],
  ["Cove Circuit Team Tournament Group 2", "circuit", "team"],
  ["Cove Circuit Team Tournament Group 1", "circuit", "team"],
  ["Winning Wave", "mini", "solo"],
  ["Spider-Wars Tournament", "mini", "solo"],
  ["Velocity Vanguard", "mini", "solo"],
  ["Ultimate Uprising", "mini", "solo"],
  ["Trend Titans", "circuit", "solo"],
  ["Signal Surge", "mini", "solo"],
  ["Quantum Quest", "mini", "solo"],
  ["Phantom Pulse", "mini", "team"],
  ["Neon Nexus", "mini", "solo"],
  ["Lunar Legacy", "mini", "solo"],
  ["Infinity Impact", "circuit", "solo"],
  ["Hyper Horizon", "mini", "solo"],
  ["Gravity Grid", "mini", "solo"],
  ["Fortune Frenzy", "mini", "team"],
  ["Omega Odyssey", "mini", "solo"],
  ["Eclipse Empire", "main", "solo"],
  ["Capital Clash", "mini", "solo"],
  ["Bullish Barrage", "mini", "solo"],
  ["Alpha Assault", "mini", "solo"],
  ["Zenith Zone", "mini", "solo"],
  ["Margin Mayhem", "circuit", "team"],
  ["Pip Pursuit", "mini", "solo"],
  ["Candle Crusade", "mini", "solo"],
  ["Risk Rally", "mini", "solo"],
  ["Breakout Blitz", "mini", "solo"],
  ["Delta Dash", "mini", "solo"],
];
const FORMAT: Record<Format, string> = { solo: "Individual - Single round", team: "Alliance - Single" };
const SPONSORS = ["TradesAI", "The Firm Capital", "AimsCap", "PipLabs", "ChartForge"];
const POOLS: Record<TournamentType, number[]> = { main: [10000, 15000], circuit: [2500, 5000], mini: [500, 750, 1000, 1500] };
const SPLITS: Record<TournamentType, number[]> = {
  main: [0.3, 0.18, 0.12, 0.08, 0.07, 0.06, 0.05, 0.05, 0.05, 0.04],
  circuit: [0.3, 0.2, 0.1, 0.06, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05],
  mini: [0.4, 0.25, 0.15, 0.1, 0.1],
};

function buildArchive(): ArchivedEvent[] {
  const rand = seededRandom(2026);
  // Anchor to the start of today (UTC) so the archive is stable through the day.
  const today = Math.floor(Date.now() / DAY) * DAY;
  let cursor = today - 14 * DAY;
  const list: ArchivedEvent[] = CATALOG.map(([name, type, format], i) => {
    if (i > 0) cursor -= (1 + Math.floor(rand() * 4)) * DAY;
    const startMs = cursor + (12 + Math.floor(rand() * 8)) * HOUR;
    const hours = type === "main" ? 6 : type === "circuit" ? 3 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3);
    const pools = POOLS[type];
    const pool = pools[Math.floor(rand() * pools.length)];
    const prizes = SPLITS[type].map((share) => Math.round(pool * share));
    const sponsorCount = type === "mini" ? 1 + Math.floor(rand() * 2) : 3;
    const offset = Math.floor(rand() * SPONSORS.length);
    const sponsors: string[] = [];
    for (let s = 0; s < sponsorCount; s++) sponsors.push(SPONSORS[(offset + s) % SPONSORS.length]);
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name, type, format: FORMAT[format],
      start: new Date(startMs).toISOString(), end: new Date(startMs + hours * HOUR).toISOString(),
      traders: 60 + Math.floor(rand() * 41), prizePool: prizes.reduce((a, b) => a + b, 0),
      prizes, sponsors,
    };
  });
  // Finished events from the shared tournament data join the archive.
  BTTournaments.list().filter((t) => BTTournaments.statusOf(t) === "completed").forEach((t) => {
    list.push({
      id: t.id, name: t.name, type: t.type, format: /multi/i.test(t.structure) ? "Individual - Multi round" : FORMAT.solo,
      start: t.start, end: t.end, traders: Math.min(100, Math.max(60, t.participants)), prizePool: t.prizePool,
      prizes: t.prizes.slice(), sponsors: t.sponsors.length ? t.sponsors.slice() : ["BattleTrader"],
    });
  });
  return list.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
}

let archiveCache: ArchivedEvent[] | null = null;
const archiveList = (): ArchivedEvent[] => {
  if (!archiveCache) archiveCache = buildArchive();
  return archiveCache;
};

/* ---------- standings ---------- */
const shuffled = (seed: number) => {
  const rand = seededRandom(seed);
  const list = POOL.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return { list, rand };
};

/** Sorts by P&L (best first), sets rank and prize. Mutates and returns rows. */
const rank = (rows: StandingRow[], prizes: number[]): StandingRow[] => {
  rows.sort((a, b) => b.pnl - a.pnl || a.handle.localeCompare(b.handle));
  rows.forEach((r, i) => {
    r.rank = i + 1;
    r.prize = prizes[i] || 0;
  });
  return rows;
};

/** spread: how far P&L can run (finished events run further than a live one an hour in). */
const buildRows = (seedKey: string, count: number, prizes: number[], spread: number): StandingRow[] => {
  const { list, rand } = shuffled(hashString(seedKey) || 1);
  const rows = list.slice(0, count).map((p): StandingRow => {
    const pnl = round2((Math.pow(rand(), 2.2) * 11000 - 2600) * spread);
    const trades = 3 + Math.floor(rand() * 150 * Math.max(0.3, spread));
    return {
      handle: p.handle, color: p.color, initials: initials(p.handle),
      pnl, equity: round2(START_BALANCE + pnl), roi: round2((pnl / START_BALANCE) * 100),
      lots: round2(0.5 + rand() * 80 * Math.max(0.3, spread)), maxDD: round2(1 + rand() * 34 * Math.max(0.4, spread)),
      trades, prize: 0, rank: 0,
    };
  });
  return rank(rows, prizes);
};

const getArchived = (id: string): ArchivedEvent | null => archiveList().find((t) => t.id === id) || null;

const resultCache: Record<string, StandingRow[]> = {};
const results = (id: string): StandingRow[] => {
  const t = getArchived(id);
  if (!t) return [];
  if (!resultCache[id]) resultCache[id] = buildRows("result:" + id, t.traders, t.prizes, 1);
  return resultCache[id].map((r) => ({ ...r }));
};

const live = (): LiveEvent[] =>
  BTTournaments.list().filter((t) => BTTournaments.statusOf(t) === "live").map((t) => ({
    id: t.id, name: t.name, type: t.type, format: /multi/i.test(t.structure) ? "Individual - Multi round" : FORMAT.solo,
    start: t.start, end: t.end, traders: t.participants, prizePool: t.prizePool, prizes: t.prizes.slice(),
    sponsors: t.sponsors.slice(), rows: buildRows("live:" + t.id, t.participants, t.prizes, 0.35),
  }));

/** Drop-in for the old `window.BTLeaderboards`. */
export const BTLeaderboards = {
  START_BALANCE,
  archive: (): ArchivedEvent[] => archiveList().slice(),
  get: getArchived,
  results,
  live,
  rank,
  initials,
};
