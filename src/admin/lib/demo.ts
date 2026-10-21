/* =====================================================================
   BattleTrader Admin — demo database. Port of admin/assets/js/admin-demo.js (window.BTAdminDemo).
   There is no backend yet, so the admin would only ever see the ONE account signed in on this browser.
   This builds a full, realistic account for each of the 20 sample traders (same handles as the
   leaderboards and alliances) plus website leads, so every admin screen can be built and reviewed
   with real-looking data. Each record uses the exact shapes the user panel writes (see admin-brief.md),
   so swapping this for API responses later needs no screen changes.
   Deterministic: the same seed gives the same data every time — keep the order of rand() calls
   (including object-literal property order) exactly as in the old file, or the data changes.
   Uses Date.now() by default, so call it only in effects / handlers.
   ===================================================================== */
import { hashString, seededRandom, type SampleTrader } from "./data/sample";
import type { Enrollment, PaidWith, Tournament, TournamentType, VoucherKind, Voucher } from "./data/tournaments";
import type {
  Affiliate, DemoAccount, DemoArena, Kyc, KycStatus, Lead, LeadType, Profile, Transaction, TransactionStatus, TransactionType,
} from "./store";

const DAY = 86400000;
const HOUR = 3600000;

const FIRST = ["Oliver", "Aarav", "Omar", "Wei", "Chidi", "Liam", "Mia", "Lukas", "Lucia", "Bilal", "Putri", "Youssef", "Paolo", "Amani", "Emre", "Sean", "Niran", "Kacper", "Chloe", "Min-jun"];
const LAST = ["Hughes", "Sharma", "Haddad", "Tan", "Okafor", "Martin", "Clarke", "Weber", "Garcia", "Khan", "Santoso", "Mansour", "Reyes", "Mwangi", "Yilmaz", "Byrne", "Chaiyaporn", "Nowak", "Laurent", "Park"];
type CountryInfo = readonly [code: string, name: string, timezone: string, dial: string];
const COUNTRIES: Record<string, CountryInfo> = {
  UK: ["GB", "United Kingdom", "Europe/London", "+44"], IN: ["IN", "India", "Asia/Kolkata", "+91"], AE: ["AE", "United Arab Emirates", "Asia/Dubai", "+971"],
  SG: ["SG", "Singapore", "Asia/Singapore", "+65"], NG: ["NG", "Nigeria", "Africa/Lagos", "+234"], CA: ["CA", "Canada", "America/Toronto", "+1"],
  AU: ["AU", "Australia", "Australia/Sydney", "+61"], DE: ["DE", "Germany", "Europe/Berlin", "+49"], ES: ["ES", "Spain", "Europe/Madrid", "+34"],
  PK: ["PK", "Pakistan", "Asia/Karachi", "+92"], ID: ["ID", "Indonesia", "Asia/Jakarta", "+62"], EG: ["EG", "Egypt", "Africa/Cairo", "+20"],
  PH: ["PH", "Philippines", "Asia/Manila", "+63"], KE: ["KE", "Kenya", "Africa/Nairobi", "+254"], TR: ["TR", "Turkey", "Europe/Istanbul", "+90"],
  IE: ["IE", "Ireland", "Europe/Dublin", "+353"], TH: ["TH", "Thailand", "Asia/Bangkok", "+66"], PL: ["PL", "Poland", "Europe/Warsaw", "+48"],
  FR: ["FR", "France", "Europe/Paris", "+33"], KR: ["KR", "South Korea", "Asia/Seoul", "+82"],
};
const ID_TYPES = ["Passport", "National ID", "Driving licence"];
const TOPUP_NOTES = ["Card top-up", "UPI top-up", "Bank transfer", "Crypto (USDT) top-up", "Apple Pay top-up"];
type LeadPerson = readonly [name: string, email: string, phone: string, country: string];
const LEAD_PEOPLE: readonly LeadPerson[] = [
  ["Priya Nair", "priya.nair@example.com", "+91 98200 11223", "India"], ["James Carter", "james.carter@example.com", "+44 7700 900123", "United Kingdom"],
  ["Fatima Al-Sayed", "fatima.s@example.com", "+971 50 123 4567", "United Arab Emirates"], ["Daniel Okoye", "d.okoye@example.com", "+234 803 555 0101", "Nigeria"],
  ["Sofia Rossi", "sofia.rossi@example.com", "+39 345 678 9012", "Italy"], ["Kenji Watanabe", "kenji.w@example.com", "+81 90 1234 5678", "Japan"],
  ["Ana Souza", "ana.souza@example.com", "+55 11 91234 5678", "Brazil"], ["Rahul Verma", "rahul.verma@example.com", "+91 99876 54321", "India"],
  ["Hannah Schmidt", "h.schmidt@example.com", "+49 151 2345 6789", "Germany"], ["Ali Raza", "ali.raza@example.com", "+92 300 1234567", "Pakistan"],
  ["Grace Kim", "grace.kim@example.com", "+82 10 1234 5678", "South Korea"], ["Tom Becker", "tom.becker@example.com", "+1 416 555 0144", "Canada"],
];
type Topic = readonly [topic: string, message: string];
const CONTACT_TOPICS: readonly Topic[] = [
  ["Account help", "I signed up yesterday but I can't see my battle history on the dashboard. Can you check my account?"],
  ["Payments", "My card top-up of $50 shows as pending for two days. When will it reach my wallet?"],
  ["Tournament rules", "Is hedging allowed in the Circuit battles, or does it count as one open position?"],
  ["Cash-out", "What documents do I need to verify before I can withdraw my prize money?"],
  ["Technical issue", "The arena chart freezes on mobile Safari after about ten minutes. Refreshing fixes it."],
  ["Feedback", "Love the new arena! Would be great to have a dark/light toggle and sound alerts on fills."],
];
const PARTNER_TOPICS: readonly Topic[] = [
  ["Partnerships", "We run a trading education community of 40k members in the Gulf and would like to host a branded monthly battle."],
  ["White label", "We're a regulated broker interested in a white-label version of BattleTrader for our clients. Who can we talk to?"],
  ["IB programme", "I manage around 300 active traders. What are the IB commission terms for referred players?"],
];
const ALL_TYPES: TournamentType[] = ["main", "circuit", "mini"];

type Rand = () => number;
const pick = <T,>(rand: Rand, list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const between = (rand: Rand, min: number, max: number): number => min + Math.floor(rand() * (max - min + 1));
const round2 = (n: number): number => Math.round(n * 100) / 100;
const newestFirst = (a: Transaction, b: Transaction): number => new Date(b.at).getTime() - new Date(a.at).getTime();

export interface DemoData {
  users: DemoAccount[];
  leads: Lead[];
}

/** traders: buildTraders(); tournaments: BTTournaments.list(); now: ms (defaults to Date.now()). */
export function generate(traders: SampleTrader[], tournaments?: Tournament[] | null, now?: number): DemoData {
  const nowMs = now || Date.now();
  const users: DemoAccount[] = [];
  const paidBattles = (tournaments || []).filter((t) => Number(t.entryFee) > 0);
  const freeBattles = (tournaments || []).filter((t) => !Number(t.entryFee));

  traders.forEach((tr, i) => {
    const rand = seededRandom(hashString("admin-demo:" + tr.handle));
    const cc = tr.city.split(", ")[1] || "UK";
    const country = COUNTRIES[cc] || COUNTRIES.UK;
    const first = FIRST[i % FIRST.length];
    const last = LAST[i % LAST.length];
    const joined = nowMs - between(rand, 20, 420) * DAY - between(rand, 0, 23) * HOUR;
    const lastActive = nowMs - between(rand, 0, 6) * DAY - between(rand, 0, 23) * HOUR;

    const profile: Profile = {
      username: tr.handle,
      fullName: first + " " + last,
      email: tr.handle.replace(/_/g, ".") + "@example.com",
      country: country[0],
      countryName: country[1],
      timezone: country[2],
      joined: new Date(joined).toISOString(),
      gender: pick(rand, ["Male", "Female", "Prefer not to say"]),
      phone: country[3] + " " + between(rand, 700, 999) + " " + between(rand, 100, 999) + " " + between(rand, 1000, 9999),
      phoneVerified: rand() > 0.25,
      discord: rand() > 0.4 ? tr.handle + "#" + between(rand, 1000, 9999) : "",
      telegram: rand() > 0.5 ? "@" + tr.handle : "",
    };

    /* ----- transactions (newest first) ----- */
    const txs: Transaction[] = [];
    const addTx = (type: TransactionType, amount: number, at: number, status: TransactionStatus, note: string) => {
      txs.push({ id: "tx-" + tr.handle + "-" + txs.length, type, amount: round2(amount), at: new Date(at).toISOString(), status, note });
    };
    const span = nowMs - joined;
    const topups = between(rand, 1, 6);
    for (let t = 0; t < topups; t++) {
      addTx("topup", pick(rand, [25, 50, 50, 100, 100, 200, 250, 500]), joined + rand() * span, rand() > 0.9 ? "failed" : "completed", pick(rand, TOPUP_NOTES));
    }
    const entries: Record<string, Enrollment> = {};
    const enrolCount = Math.min(paidBattles.length + freeBattles.length, between(rand, 1, 5));
    const pool = paidBattles.concat(freeBattles);
    for (let e = 0; e < enrolCount; e++) {
      const battle: Tournament | undefined = pool[(i + e * 3) % pool.length];
      if (!battle || entries[battle.id]) continue;
      let at = Math.min(nowMs - HOUR, new Date(battle.registrationCloses || battle.start).getTime() - between(rand, 1, 10) * DAY);
      if (at < joined) at = joined + HOUR;
      const fee = Number(battle.entryFee) || 0;
      const paidWith: PaidWith = fee ? pick<PaidWith>(rand, ["wallet", "wallet", "credits", "voucher"]) : "free";
      entries[battle.id] = { at: new Date(at).toISOString(), paidWith, amount: paidWith === "voucher" || paidWith === "credits" ? 0 : fee };
      if (fee && paidWith === "wallet") addTx("entry", fee, at, "completed", "Entry — " + battle.name);
    }
    if (tr.victories > 0) {
      const rewards = Math.min(3, tr.victories);
      for (let r = 0; r < rewards; r++) addTx("reward", between(rand, 2, 30) * 25, joined + rand() * span, "completed", "Prize — " + pick(rand, ["Daily Battle", "Weekend Clash", "Circuit Round"]) + " #" + between(rand, 1, 3));
    }
    if (rand() > 0.45) addTx("cashout", between(rand, 2, 16) * 25, nowMs - between(rand, 0, 4) * DAY - between(rand, 1, 20) * HOUR, rand() > 0.5 ? "pending" : "completed", "Cash-out to " + pick(rand, ["bank account", "UPI", "PayPal", "USDT wallet"]));
    if (rand() > 0.85) addTx("refund", 10, joined + rand() * span, "completed", "Refund — battle cancelled");
    txs.sort(newestFirst);

    // Balance = money in minus money out, never negative.
    let balance = txs.reduce((sum, x) => {
      if (x.status !== "completed" && !(x.type === "cashout" && x.status === "pending")) return sum;
      return sum + (x.type === "topup" || x.type === "reward" || x.type === "refund" ? x.amount : -x.amount);
    }, 0);
    if (balance < 0) {
      addTx("topup", Math.ceil(-balance / 25) * 25 + 25, joined + HOUR, "completed", "Card top-up");
      txs.sort(newestFirst);
      balance = Math.ceil(-balance / 25) * 25 + 25 + balance;
    }

    /* ----- KYC: a mix of every state, with several waiting for review ----- */
    const kycRoll = i % 5;
    const kycStatus: KycStatus = kycRoll === 0 || kycRoll === 3 ? "verified" : kycRoll === 1 ? "pending" : kycRoll === 2 ? "none" : rand() > 0.5 ? "rejected" : "draft";
    let kyc: Kyc = { status: kycStatus };
    if (kycStatus !== "none") {
      const submitted = nowMs - between(rand, 1, 60) * HOUR;
      kyc = {
        status: kycStatus,
        fullName: profile.fullName,
        dob: (1975 + between(rand, 0, 28)) + "-" + ("0" + between(rand, 1, 12)).slice(-2) + "-" + ("0" + between(rand, 1, 28)).slice(-2),
        country: country[0],
        idType: pick(rand, ID_TYPES),
        idNumber: country[0] + between(rand, 1000000, 9999999),
        address: between(rand, 1, 220) + " " + pick(rand, ["High Street", "Park Avenue", "Marina Road", "Station Road", "Market Lane"]) + ", " + tr.city.split(", ")[0],
        idFile: tr.handle + "-id.jpg",
        addressFile: tr.handle + "-address.pdf",
        submittedAt: kycStatus === "draft" ? "" : new Date(submitted).toISOString(),
      };
      if (kycStatus === "verified" || kycStatus === "rejected") kyc.reviewedAt = new Date(submitted + between(rand, 2, 30) * HOUR).toISOString();
      if (kycStatus === "rejected") kyc.reviewNote = pick(rand, ["The ID photo is blurry. Please upload a sharper picture.", "Address proof is older than 3 months.", "The name on the ID doesn't match your account name."]);
    }

    /* ----- vouchers, affiliate, arena ----- */
    const vouchers: Voucher[] = [];
    if (rand() > 0.5) {
      const added = nowMs - between(rand, 1, 25) * DAY;
      vouchers.push({ id: "v-" + tr.handle + "-1", code: pick(rand, ["WELCOME10", "BATTLE25", "FREEMINI"]), kind: pick<VoucherKind>(rand, ["percent", "amount", "free-entry"]), value: pick(rand, [10, 25, 5]), appliesTo: ALL_TYPES.slice(), usesLeft: rand() > 0.6 ? 0 : 1, usesTotal: 1, addedAt: new Date(added).toISOString(), expiresAt: new Date(added + 30 * DAY).toISOString() });
    }
    let affiliate: Affiliate | null = null;
    if (i % 3 !== 2) {
      const refs = between(rand, 0, 24);
      affiliate = { code: tr.handle.replace(/_/g, "").slice(0, 6).toUpperCase() + String(between(rand, 10, 99)), generatedAt: new Date(joined + between(rand, 1, 15) * DAY).toISOString(), referrals: refs, cash: refs * 5, credits: refs * 20, tickets: Math.floor(refs / 5) };
    }
    const arena: DemoArena = { battlesPlayed: tr.events, wins: tr.victories, podiums: tr.podiums, winRate: tr.winRate, bestStreak: between(rand, 1, 9), level: tr.level };

    users.push({
      username: tr.handle,
      source: "demo",
      status: i === 17 ? "blocked" : "active",
      lastActive: new Date(lastActive).toISOString(),
      profile,
      wallet: { balance: round2(balance), credits: between(rand, 0, 30) * 10, tickets: between(rand, 0, 4) },
      transactions: txs,
      enrollments: entries,
      vouchers,
      kyc,
      affiliate,
      arena,
      stats: { rank: tr.rank, points: tr.points, tier: tr.tier },
    });
  });

  /* ----- website leads ----- */
  const leads: Lead[] = [];
  const lr = seededRandom(hashString("admin-demo:leads"));
  LEAD_PEOPLE.forEach((p, i) => {
    const kind: LeadType = i % 4 === 3 ? "partnership" : i % 3 === 1 ? "join" : "contact";
    const topic: Topic = kind === "partnership" ? PARTNER_TOPICS[i % PARTNER_TOPICS.length] : kind === "join" ? ["Join request", ""] : CONTACT_TOPICS[i % CONTACT_TOPICS.length];
    leads.push({
      id: "ld-demo-" + i,
      type: kind,
      name: kind === "join" ? p[0].split(" ")[0].toLowerCase() + "_" + between(lr, 10, 99) : p[0],
      email: p[1],
      phone: kind === "contact" ? "" : p[2],
      country: kind === "contact" ? "" : p[3],
      topic: topic[0],
      message: topic[1],
      page: kind === "join" ? "index.html" : "contact.html",
      at: new Date(nowMs - (i * 7 + between(lr, 1, 6)) * HOUR).toISOString(),
      status: i < 5 ? "new" : i < 9 ? "contacted" : "closed",
    });
  });

  return { users, leads };
}

/** Drop-in for the old `window.BTAdminDemo`. */
export const BTAdminDemo = { generate };
