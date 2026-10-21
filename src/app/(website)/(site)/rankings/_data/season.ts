// Deterministic sample season shared by /rankings/ and /profile/ (old pages.js 33-112).
// Seeded, so it renders identically on the server and in the browser.

export type Tier = "Elite" | "Platinum" | "Gold" | "Silver" | "Bronze";

export type Trader = {
  rank: number;
  handle: string;
  city: string;
  points: number;
  tier: Tier;
  level: number;
  events: number;
  victories: number;
  podiums: number;
  winRate: number;
  color: string;
};

const HANDLES: ReadonlyArray<readonly [string, string]> = [
  ["wolf_of_fx", "London, UK"], ["bear_hunter", "Mumbai, IN"], ["pip_sniper", "Dubai, AE"],
  ["gold_rush", "Singapore, SG"], ["scalp_king", "Lagos, NG"], ["trend_rider", "Toronto, CA"],
  ["night_owl", "Sydney, AU"], ["fib_master", "Berlin, DE"], ["candle_queen", "Madrid, ES"],
  ["delta_force", "Karachi, PK"], ["moon_trader", "Jakarta, ID"], ["red_candle", "Cairo, EG"],
  ["swing_lord", "Manila, PH"], ["fx_viper", "Nairobi, KE"], ["blue_chip", "Istanbul, TR"],
  ["breakout_bob", "Dublin, IE"], ["chart_ninja", "Bangkok, TH"], ["iron_hands", "Warsaw, PL"],
  ["alpha_wave", "Paris, FR"], ["stop_hunter", "Seoul, KR"], ["green_pips", "Delhi, IN"],
  ["bull_rush", "Johannesburg, ZA"], ["lot_size", "Milan, IT"], ["market_maven", "Austin, US"],
  ["quick_draw", "Lisbon, PT"], ["zen_trader", "Kyoto, JP"], ["risk_reward", "Zurich, CH"],
  ["sigma_fx", "Riyadh, SA"], ["volatility_v", "Bogota, CO"], ["spread_eagle", "Chicago, US"],
  ["hedge_hog", "Oslo, NO"], ["fast_fingers", "Hanoi, VN"], ["royal_flush", "Doha, QA"],
  ["pivot_point", "Prague, CZ"], ["silver_fox", "Vienna, AT"], ["sharp_shooter", "Kuala Lumpur, MY"],
  ["dip_buyer", "Lima, PE"], ["trade_titan", "Accra, GH"], ["margin_call", "Athens, GR"],
  ["rsi_rebel", "Dhaka, BD"], ["golden_cross", "Santiago, CL"], ["long_shot", "Helsinki, FI"],
  ["short_squeeze", "Brussels, BE"], ["pip_pirate", "Auckland, NZ"], ["the_closer", "Mexico City, MX"],
  ["equity_edge", "Budapest, HU"], ["neon_bull", "Taipei, TW"], ["calm_capital", "Stockholm, SE"],
  ["vwap_wizard", "Colombo, LK"], ["last_stand", "Amsterdam, NL"],
];

const AV_COLORS = ["#9333EA", "#0EA5E9", "#DB2777", "#16A34A", "#EA580C", "#4F46E5", "#0D9488", "#CA8A04"];

export const tierFor = (points: number): Tier => {
  if (points >= 8000) return "Elite";
  if (points >= 4000) return "Platinum";
  if (points >= 1500) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
};

// Seeded so the sample data is identical on every visit and on every page.
export const seededRandom = (seed: number): (() => number) => {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
};

export const hashString = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const buildTraders = (): Trader[] => {
  const rand = seededRandom(7);
  let points = 9420;
  return HANDLES.map(([handle, city], i) => {
    if (i > 0) points -= Math.round(i < 10 ? 60 + rand() * 500 : 30 + rand() * 120);
    const events = Math.max(8, Math.round(60 - i * 0.8 - rand() * 6));
    const victories = Math.max(0, Math.round(events * (0.14 - i * 0.0025) * (0.6 + rand() * 0.8)));
    const podiums = victories + Math.max(0, Math.round(events * (0.12 - i * 0.0018) * (0.6 + rand() * 0.8)));
    return {
      rank: i + 1,
      handle,
      city,
      points,
      tier: tierFor(points),
      level: Math.max(1, Math.floor(Math.sqrt(points / 9))),
      events,
      victories,
      podiums,
      winRate: (victories / events) * 100,
      color: AV_COLORS[i % AV_COLORS.length],
    };
  });
};

export const fmt = (n: number): string => n.toLocaleString("en-US");

export const profileUrl = (handle: string): string => "/profile/?t=" + encodeURIComponent(handle);
