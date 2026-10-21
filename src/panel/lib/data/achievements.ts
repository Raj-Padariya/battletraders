// Achievements catalogue for the user panel (sample data — no backend yet). Port of app/assets/js/achievements-data.js.

export type Rarity = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Legendary" | "Immortal";

export interface AchievementCategory {
  id: string;
  name: string;
  color: string;
  glyph: string;
  total: number;
}

export interface Achievement {
  id: string;
  category: string;
  name: string;
  description: string;
  metric: string;
  target: number;
  rarity: Rarity;
  xp: number;
  credits: number;
  playersPct: number;
  hidden: boolean;
}

export interface AchievementResult {
  value: number;
  target: number;
  pct: number;
  unlocked: boolean;
}

/** The profile fields that drive the Growth achievements (a subset of `bt-profile`). */
export interface AchievementProfile {
  phoneVerified?: boolean;
  avatar?: string;
  frame?: string;
}

type RarityCode = "B" | "S" | "G" | "P" | "D" | "L" | "I";
// [name, description, metric, target, rarity, xp, credits, % of players]
type Row = [string, string, string, number, RarityCode, number, number, number];
// [name, threshold, rarity, xp, credits, % of players]
type TierRow = [string, number, RarityCode, number, number, number];

const RARITY: Record<RarityCode, Rarity> = { B: "Bronze", S: "Silver", G: "Gold", P: "Platinum", D: "Diamond", L: "Legendary", I: "Immortal" };
export const rarities: Rarity[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Legendary", "Immortal"];

const CATEGORY_DEFS: Omit<AchievementCategory, "total">[] = [
  { id: "trade-volume", name: "Trade Volume I", color: "#33CCFF", glyph: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
  { id: "trade-quality", name: "Trade Quality I", color: "#22E39A", glyph: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>' },
  { id: "risk-management", name: "Risk Management I", color: "#FFC433", glyph: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>' },
  { id: "consistency", name: "Consistency I", color: "#5CDBFF", glyph: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15h2M14 15h2"/>' },
  { id: "social-tournament", name: "Social & Tournament I", color: "#FF5CFF", glyph: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>' },
  { id: "growth", name: "Growth I", color: "#C77DFF", glyph: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>' },
  { id: "financial", name: "Financial I", color: "#22E39A", glyph: '<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.8c0 4.8 10 2.6 10 7.6 0 2.2-2.2 3.6-5 3.6s-5-1.2-5-3.4"/>' },
  { id: "hidden", name: "Hidden", color: "#A64DFF", glyph: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.8M12 17h.01"/>' },
];

// Value formatting per metric: money in $, percentages, hours, plain counts.
const UNITS: Record<string, string> = { deposited: "$", cashedOut: "$", bestProfitPct: "%", worstLossPct: "%", winRate: "%", longestHoldH: "h" };

const usd = (v: number): string => "$" + v.toLocaleString("en-US");
const num = (v: number): string => v.toLocaleString("en-US");
const tiers = (rows: TierRow[], metric: string, describe: (threshold: number) => string): Row[] =>
  rows.map(([name, threshold, r, xp, cr, pct]) => [name, describe(threshold), metric, threshold, r, xp, cr, pct]);

const ROWS: Record<string, Row[]> = {
  "trade-volume": [
    ["First Blood", "Place your very first trade in the arena.", "trades", 1, "B", 25, 0, 86.4],
    ["Active Trader", "Complete 10 trades.", "trades", 10, "B", 50, 0, 72.1],
    ["Getting Serious", "Complete 100 trades.", "trades", 100, "S", 100, 0, 49.8],
    ["Market Regular", "Complete 500 trades.", "trades", 500, "S", 250, 5, 28.3],
    ["Four Figures", "Complete 1,000 trades.", "trades", 1000, "G", 500, 10, 17.6],
    ["Quarter Millennial", "Complete 2,500 trades.", "trades", 2500, "G", 750, 15, 9.4],
    ["5K Trader", "Complete 5,000 trades.", "trades", 5000, "P", 1000, 25, 5.1],
    ["Trade Machine", "Complete 10,000 trades.", "trades", 10000, "P", 2000, 40, 2.3],
    ["Elite Operator", "Complete 15,000 trades.", "trades", 15000, "D", 3000, 60, 1.2],
    ["Legendary Volume", "Complete 25,000 trades.", "trades", 25000, "L", 5000, 80, 0.6],
    ["The Grinder", "Complete 50,000 trades.", "trades", 50000, "L", 7500, 100, 0.2],
    ["The Immortal", "Complete 100,000 trades. Very few fighters ever get here.", "trades", 100000, "I", 10000, 150, 0.05],
  ],
  "trade-quality": [
    ["In the Green", "Close your first trade in profit.", "wins", 1, "B", 25, 0, 78.5],
    ["Double Win", "Win 2 trades in a row.", "winStreak", 2, "B", 40, 0, 61.2],
    ["Hat Trick", "Win 3 trades in a row.", "winStreak", 3, "B", 60, 0, 44.7],
    ["Precision Strike", "Win 5 trades in a row.", "winStreak", 5, "S", 120, 0, 24.9],
    ["Hot Streak", "Win 10 trades in a row.", "winStreak", 10, "G", 300, 5, 8.3],
    ["The Perfect Run", "Win 100 trades in a row.", "winStreak", 100, "D", 3000, 50, 0.3],
    ["Flawless", "Win 500 trades in a row.", "winStreak", 500, "L", 6000, 100, 0.04],
    ["The Impossible", "Win 1,000 trades in a row.", "winStreak", 1000, "I", 10000, 150, 0.01],
    ["Sharp Eye", "Make 15% profit on a single trade (min 1,000 lots).", "bestProfitPct", 15, "S", 100, 0, 21.4],
    ["Sniper", "Make 25% profit on a single trade (min 1,000 lots).", "bestProfitPct", 25, "S", 150, 0, 14.8],
    ["Sharpshooter", "Make 50% profit on a single trade (min 1,000 lots).", "bestProfitPct", 50, "G", 300, 5, 7.2],
    ["Double or Nothing", "Make 100% profit on a single trade (min 1,000 lots).", "bestProfitPct", 100, "P", 600, 10, 3.1],
    ["The Multiplier", "Make 200% profit on a single trade (min 1,000 lots).", "bestProfitPct", 200, "D", 1200, 25, 1.1],
    ["Moonshot", "Make 500% profit on a single trade (min 1,000 lots).", "bestProfitPct", 500, "L", 3000, 60, 0.3],
    ["To the Moon", "Make 1,000% profit on a single trade (min 1,000 lots).", "bestProfitPct", 1000, "I", 6000, 120, 0.06],
    ["Expensive Lesson", "Take a 15% loss on a single trade. Every fighter takes a hit.", "worstLossPct", 15, "B", 30, 0, 38.6],
    ["Margin of Error", "Take a 25% loss on a single trade.", "worstLossPct", 25, "B", 40, 0, 26.2],
    ["The Wipeout", "Take a 50% loss on a single trade.", "worstLossPct", 50, "S", 60, 0, 12.9],
    ["Back to Zero", "Take a 100% loss on a single trade.", "worstLossPct", 100, "G", 100, 0, 4.4],
    ["High Conviction", "Hold a single position for 24 hours.", "longestHoldH", 24, "S", 100, 0, 19.7],
    ["Diamond Hands", "Hold a single position for 72 hours.", "longestHoldH", 72, "G", 250, 5, 7.8],
    ["The Oracle", "Keep a 60% win rate over 50+ trades.", "winRate", 60, "P", 800, 15, 4.6],
    ["Perfectionist", "Keep an 80% win rate over 50+ trades.", "winRate", 80, "D", 2000, 40, 0.9],
    ["Breakeven Master", "Close 10 trades exactly at breakeven.", "breakevens", 10, "S", 80, 0, 11.3],
    ["First Loss", "Close your first losing trade. Shake it off.", "losses", 1, "B", 15, 0, 81.0],
    ["Shake It Off", "Lose 2 trades in a row.", "lossStreak", 2, "B", 20, 0, 63.5],
    ["Kept the Faith", "Lose 3 trades in a row and keep fighting.", "lossStreak", 3, "B", 30, 0, 47.1],
    ["Cold Streak", "Lose 5 trades in a row.", "lossStreak", 5, "S", 50, 0, 26.8],
    ["Never Quit", "Lose 10 trades in a row.", "lossStreak", 10, "G", 100, 0, 9.2],
    ["The Abyss", "Lose 100 trades in a row.", "lossStreak", 100, "P", 500, 10, 0.4],
    ["Eternal Optimist", "Lose 500 trades in a row.", "lossStreak", 500, "L", 1500, 30, 0.03],
    ["Undefeated by Defeat", "Lose 1,000 trades in a row.", "lossStreak", 1000, "I", 3000, 60, 0.01],
    ["The Comeback", "Follow a 5-loss streak with 5 straight wins.", "comebacks", 1, "G", 400, 10, 3.7],
  ],
  "risk-management": [
    ["Risk Aware", "Place a stop loss on 3 trades.", "slTrades", 3, "B", 40, 0, 52.4],
    ["Risk Manager", "Use a stop loss on 10 consecutive trades.", "slStreak", 10, "S", 120, 0, 23.6],
    ["Ironclad", "Use a stop loss on 50 consecutive trades.", "slStreak", 50, "G", 400, 10, 6.1],
    ["Take Profit Pro", "Close 5 trades on a take profit.", "tpCloses", 5, "B", 60, 0, 37.9],
    ["Disciplined Exit", "Set both a stop loss and a take profit on 20 trades.", "slTpTrades", 20, "S", 200, 5, 15.2],
    ["Calm Under Fire", "Hold to your stop loss 5 times without moving it.", "slHits", 5, "S", 150, 0, 18.4],
  ],
  consistency: [
    ["Day One", "Trade on 3 different days.", "tradingDays", 3, "B", 40, 0, 64.3],
    ["Consistent", "Trade 7 days in a row.", "dayStreak", 7, "B", 80, 0, 33.8],
    ["Two Weeks Strong", "Trade 14 days in a row.", "dayStreak", 14, "S", 150, 0, 18.9],
    ["Iron Discipline", "Trade 30 days in a row.", "dayStreak", 30, "G", 400, 10, 7.4],
    ["Market Obsessed", "Trade 60 days in a row.", "dayStreak", 60, "P", 800, 20, 2.9],
    ["Unbreakable", "Trade 100 days in a row.", "dayStreak", 100, "D", 1500, 35, 1.1],
    ["Full Year", "Trade 365 days in a row.", "dayStreak", 365, "L", 4000, 80, 0.15],
    ["Two Years Running", "Trade 730 days in a row.", "dayStreak", 730, "L", 7000, 120, 0.04],
    ["The Eternal Trader", "Trade 1,095 days in a row.", "dayStreak", 1095, "I", 10000, 150, 0.01],
    ["Weekend Warrior", "Trade crypto on 4 weekends.", "cryptoWeekends", 4, "S", 120, 0, 16.7],
    ["Monthly Loyal", "Trade on 18 days within a single month.", "monthDays", 18, "G", 300, 5, 9.8],
  ],
  "social-tournament": [
    ["Team Player", "Join an alliance.", "alliances", 1, "B", 50, 0, 41.2],
    ["Competitor", "Enter your first tournament.", "tournaments", 1, "B", 50, 0, 58.7],
    ["Serial Competitor", "Enter 5 tournaments.", "tournaments", 5, "S", 150, 0, 27.4],
    ["Tournament Finisher", "Fight a tournament through to the final bell.", "finishes", 1, "B", 60, 0, 49.3],
    ["Top Half", "Finish in the top 50% of a tournament.", "topHalf", 1, "B", 80, 0, 36.1],
    ["Consistent Contender", "Finish in the top 50% of 25 tournaments.", "topHalf", 25, "G", 500, 10, 6.8],
    ["Reliable Performer", "Finish in the top 50% of 50 tournaments.", "topHalf", 50, "P", 1000, 20, 3.2],
    ["Tournament Regular", "Finish in the top 50% of 100 tournaments.", "topHalf", 100, "D", 2000, 40, 1.3],
    ["The Marathon Runner", "Finish in the top 50% of 250 tournaments.", "topHalf", 250, "L", 5000, 90, 0.2],
    ["Podium Finish", "Finish in the top 10 of a tournament.", "top10", 1, "S", 150, 5, 14.6],
    ["Regular Podium", "Finish in the top 10 of 15 tournaments.", "top10", 15, "G", 600, 15, 3.9],
    ["Elite Finisher", "Finish in the top 10 of 50 tournaments.", "top10", 50, "P", 1500, 30, 1.0],
    ["The Specialist", "Finish in the top 10 of 75 tournaments.", "top10", 75, "D", 2500, 50, 0.5],
    ["The Untouchable", "Finish in the top 10 of 150 tournaments.", "top10", 150, "L", 6000, 100, 0.1],
    ["Top 3", "Finish in the top 3 of a tournament.", "top3", 1, "G", 300, 10, 6.2],
    ["Podium Hunter", "Finish in the top 3 of 10 tournaments.", "top3", 10, "P", 1000, 25, 1.4],
    ["The Silverware Collector", "Finish in the top 3 of 30 tournaments.", "top3", 30, "D", 2500, 50, 0.4],
    ["All-Time Great", "Finish in the top 3 of 50 tournaments.", "top3", 50, "L", 5000, 80, 0.15],
    ["Living Legend", "Finish in the top 3 of 100 tournaments.", "top3", 100, "I", 9000, 140, 0.03],
    ["Champion", "Win a tournament outright.", "titles", 1, "G", 500, 15, 2.8],
    ["Serial Champion", "Win 10 tournaments.", "titles", 10, "P", 2000, 40, 0.5],
    ["Dynasty Builder", "Win 30 tournaments.", "titles", 30, "D", 4000, 70, 0.1],
    ["The Conqueror", "Win 50 tournaments.", "titles", 50, "L", 7000, 110, 0.05],
    ["The G.O.A.T.", "Win 100 tournaments.", "titles", 100, "I", 10000, 150, 0.01],
    ["Dynasty", "Win a tournament in 3 different categories.", "titleTypes", 3, "P", 1500, 30, 0.7],
    ["Referral Rookie", "Refer your first friend to the arena.", "referrals", 1, "B", 50, 5, 12.5],
    ["Talent Scout", "Refer 5 friends to the arena.", "referrals", 5, "S", 200, 15, 3.4],
  ],
  growth: [
    ["Verified", "Verify your phone number.", "verified", 1, "B", 40, 0, 68.2],
    ["Profile Complete", "Upload a profile avatar.", "profileComplete", 1, "B", 40, 0, 54.9],
    ["Looking Good", "Equip a profile frame.", "frame", 1, "B", 30, 0, 33.6],
    ...tiers(
      [
        ["First Milestone", 10, "B", 100, 0, 47.3], ["Veteran", 20, "S", 200, 0, 31.5], ["Expert", 30, "S", 350, 5, 20.2],
        ["Expert Elite", 40, "G", 500, 10, 12.8], ["Elite", 50, "G", 750, 15, 8.1], ["Elite Master", 60, "P", 1000, 20, 4.9],
        ["Master", 70, "P", 1500, 30, 2.7], ["Grand Master Rising", 80, "D", 2000, 40, 1.4], ["Grand Master", 90, "D", 3000, 60, 0.6],
        ["Grand Master Elite", 95, "L", 5000, 90, 0.25], ["Legend", 100, "I", 10000, 150, 0.08],
      ],
      "level",
      (lv) => `Reach Level ${lv}.`,
    ),
    ...tiers(
      [
        ["Quest Completionist", 500, "G", 500, 10, 6.4], ["Quest Veteran", 1000, "P", 1000, 20, 2.8], ["Quest Master", 2500, "D", 2500, 50, 0.7],
        ["Quest Legend", 3500, "L", 5000, 80, 0.3], ["Quest Immortal", 5500, "I", 10000, 150, 0.05],
      ],
      "quests",
      (q) => `Complete ${num(q)} quests.`,
    ),
    ["Daily Devotion", "Complete every daily quest 7 days in a row.", "dailySweeps", 7, "S", 200, 5, 10.6],
    ["Monthly Master", "Complete a monthly quest.", "monthlyQuests", 1, "G", 400, 10, 8.9],
    ["Comeback Kid", "Come back and trade after 30 days away.", "returns", 1, "B", 60, 0, 15.3],
  ],
  financial: [
    ["First Deposit", "Make your first deposit.", "deposits", 1, "B", 50, 0, 62.4],
    ...tiers(
      [
        ["Skin in the Game", 100, "B", 60, 0, 48.7], ["Committed", 500, "S", 100, 0, 31.2], ["Four Figures", 1000, "S", 200, 5, 21.6],
        ["Serious Trader", 2500, "G", 400, 10, 11.4], ["High Roller", 5000, "G", 600, 15, 6.7], ["Five Figure Club", 10000, "P", 1000, 25, 3.5],
        ["Power Depositor", 25000, "P", 2000, 40, 1.4], ["Market Backer", 50000, "D", 3000, 60, 0.6], ["Six Figure Vision", 100000, "D", 5000, 80, 0.25],
        ["Quarter Million", 250000, "L", 7000, 100, 0.08], ["Half a Million", 500000, "L", 8500, 120, 0.03], ["The Million Mark", 1000000, "I", 10000, 150, 0.01],
      ],
      "deposited",
      (amt) => `Deposit a total of ${usd(amt)}.`,
    ),
    ["First Cashout", "Cash out your first winnings.", "cashouts", 1, "B", 60, 0, 29.8],
    ...tiers(
      [
        ["Taking Profits", 100, "B", 80, 0, 22.1], ["Pocket Money", 500, "S", 150, 0, 13.7], ["Four Figure Exit", 1000, "S", 250, 5, 9.3],
        ["Consistent Earner", 2500, "G", 450, 10, 5.6], ["Profit Machine", 5000, "G", 700, 15, 3.2], ["Ten Grand Out", 10000, "P", 1200, 25, 1.7],
        ["Wealth Builder", 25000, "P", 2200, 40, 0.7], ["Capital Extractor", 50000, "D", 3500, 60, 0.3], ["Six Figure Cashout", 100000, "D", 5500, 80, 0.12],
        ["Quarter Mil Out", 250000, "L", 7500, 100, 0.05], ["Half Mil Cashout", 500000, "L", 9000, 120, 0.02], ["The Millionaire", 1000000, "I", 10000, 150, 0.01],
      ],
      "cashedOut",
      (amt) => `Cash out a total of ${usd(amt)}.`,
    ),
  ],
  hidden: (
    [
      ["B", 100, 0, 9.4], ["B", 150, 0, 6.1], ["S", 200, 5, 4.2], ["S", 250, 5, 3.3], ["G", 400, 10, 2.1], ["G", 500, 10, 1.6],
      ["P", 800, 20, 0.9], ["P", 1000, 25, 0.6], ["D", 2000, 40, 0.3], ["D", 3000, 60, 0.15], ["L", 5000, 90, 0.05], ["I", 10000, 150, 0.01],
    ] as [RarityCode, number, number, number][]
  ).map(([r, xp, cr, pct]): Row => ["???", "Hidden achievement - keep trading to discover how to unlock this one.", "secret", 1, r, xp, cr, pct]),
};

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const categories: AchievementCategory[] = CATEGORY_DEFS.map((cat) => ({ ...cat, total: ROWS[cat.id].length }));

export const list: Achievement[] = categories.flatMap((cat) =>
  ROWS[cat.id].map(([name, description, metric, target, r, xp, credits, playersPct], i) => ({
    id: cat.id === "hidden" ? `hidden-${i + 1}` : `${cat.id}-${slug(name)}`,
    category: cat.id,
    name,
    description,
    metric,
    target,
    rarity: RARITY[r],
    xp,
    credits,
    playersPct,
    hidden: cat.id === "hidden",
  })),
);

export const level = { n: 1, title: "Rookie", nextXp: 120 };

/** Every metric starts at zero for a brand-new account; the user is level 1. */
export function baseProgress(): Record<string, number> {
  const progress: Record<string, number> = {};
  list.forEach((a) => {
    progress[a.metric] = 0;
  });
  progress.level = 1;
  return progress;
}

/** Profile-driven progress: phone verified, avatar uploaded, frame equipped. */
export function progressFor(profile: AchievementProfile | null | undefined): Record<string, number> {
  const progress = baseProgress();
  const prof = profile || {};
  progress.verified = prof.phoneVerified ? 1 : 0;
  progress.profileComplete = prof.avatar ? 1 : 0;
  progress.frame = prof.frame ? 1 : 0;
  return progress;
}

export function evaluate(a: Achievement, progress: Record<string, number>): AchievementResult {
  const value = Math.min(Math.max(Number(progress[a.metric]) || 0, 0), a.target);
  return { value, target: a.target, pct: Math.floor((value / a.target) * 100), unlocked: value >= a.target };
}

export function formatValue(metric: string, v: number): string {
  const unit = UNITS[metric];
  if (unit === "$") return usd(v);
  if (unit) return num(v) + unit;
  return num(v);
}

export const BTAchievements = { categories, rarities, list, level, baseProgress, progressFor, evaluate, formatValue };
