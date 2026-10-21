"use client";

// Dashboard content — port of dashboard.js (everything except the first-run tour, see DashboardTour.tsx).
import Link from "next/link";
import { useEffect, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { BTSample } from "@panel/lib/data/sample";
import { joinedLabel, usePanel } from "@panel/lib/panel";
import { countdown, nextAt, pad2 } from "@panel/lib/storage";
import LiveBattleChart from "./LiveBattleChart";

type BattleType = "daily" | "mini" | "circuit";

const BATTLE_ICONS: Record<BattleType, string> = {
  daily: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  mini: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5"/>',
  circuit: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
};

const BATTLES: { type: BattleType; name: string; meta: string; hour: number }[] = [
  { type: "daily", name: "Daily Battle · XAU/USD", meta: "Free entry · 128 fighters", hour: 14 },
  { type: "mini", name: "Mini Tournament · FX Majors", meta: "1 ticket · $1,500 prize pool", hour: 18 },
  { type: "circuit", name: "Circuit Qualifier · Asia", meta: "Ranked · Top 16 advance", hour: 21 },
];

interface BattleRow {
  type: BattleType;
  name: string;
  meta: string;
  time: string;
  day: string;
}

const CHEV = '<path d="m9 6 6 6-6 6"/>';
const SWORDS = '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>';
const SHIELD = '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/>';
const TROPHY = '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>';
const TARGET = '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>';
const WALLET = '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>';
const PULSE = '<path d="M3 12h4l3-8 4 16 3-8h4"/>';
const FLAME = '<path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 12 11 12c0-4 1-9 1-9z"/>';
const STAR = '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>';
const MEDAL = '<path d="M7 3h10l-3 6h-4z"/><circle cx="12" cy="15" r="6"/>';
const GIFT = '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S9 3 7 5s3 3 5 3zm0 0s3-5 5-3-3 3-5 3z"/>';

/* Season leaderboard: top 4 from the shared sample season, each with a deterministic 7-day points line.
   "Change" is the move across that line, so the pill colour always agrees with the sparkline direction. */
const BOARD = BTSample.buildTraders().slice(0, 4).map((t) => {
  const rand = BTSample.seededRandom(BTSample.hashString(t.handle));
  let value = 20;
  const values: number[] = [];
  for (let k = 0; k < 28; k++) {
    value = Math.max(4, Math.min(36, value + (rand() - 0.5) * 7));
    values.push(value);
  }
  const spark = values.map((v, k) => ((k * 120) / 27).toFixed(1) + "," + (40 - v).toFixed(1)).join(" ");
  const change = ((values[values.length - 1] - values[0]) / values[0]) * 10;
  return { trader: t, spark, change };
});

const QUESTS: { id: "day" | "week" | "month"; name: string; task: string; icon: string; done: number; total: number }[] = [
  { id: "day", name: "Daily", task: "Trade in 1 Daily Battle", icon: FLAME, done: 0, total: 7 },
  { id: "week", name: "Weekly", task: "Finish top 50% twice", icon: TARGET, done: 0, total: 8 },
  { id: "month", name: "Monthly", task: "Reach Silver tier", icon: STAR, done: 0, total: 8 },
];

/* Stat cells: deterministic sparkline per stat (120x40 viewBox; line in y 6-30, area fades to the bottom). */
const sparkFor = (seed: string, drift: number) => {
  const rand = BTSample.seededRandom(BTSample.hashString(seed));
  let value = 20;
  const values: number[] = [];
  for (let k = 0; k < 40; k++) {
    value += (rand() - 0.5) * 5 + drift;
    values.push(value);
  }
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const points = values.map((v, k) => ((k * 120) / 39).toFixed(1) + "," + (30 - ((v - low) / span) * 24).toFixed(1));
  return { line: points.join(" "), area: "M0,40 L" + points.join(" L") + " L120,40 Z" };
};

type StatTrend = "up" | "down" | "flat";

const STATS: { label: string; value: string; decimals?: string; delta: string; trend: StatTrend; note: string; icon: string; spark: { line: string; area: string } }[] = [
  { label: "Active battles", value: "0", delta: "Join one to start", trend: "flat", note: "Live and upcoming entries", icon: SWORDS, spark: sparkFor("stat-active", 0) },
  { label: "Total winnings", value: "$0", decimals: ".00", delta: "No payouts yet", trend: "flat", note: "Paid out to your wallet", icon: WALLET, spark: sparkFor("stat-winnings", 0.35) },
  { label: "Win rate", value: "0", decimals: ".0%", delta: "No ranked events yet", trend: "flat", note: "Across ranked events", icon: TARGET, spark: sparkFor("stat-winrate", -0.3) },
  { label: "Season rank", value: "—", delta: "Unranked so far", trend: "flat", note: "Top 16 reach the Circuit", icon: TROPHY, spark: sparkFor("stat-rank", 0.1) },
];

// Hero backdrop: a fan of soft silk ribbons sweeping from the top-right (decorative, 1200x400 viewBox).
const SILK = Array.from({ length: 11 }, (_, k) => ({
  d: `M${1260 - k * 34},-60 C${1010 - k * 30},${70 + k * 6} ${860 - k * 26},${250 + k * 4} ${640 - k * 22},470`,
  width: [1.2, 3, 1.6, 7, 2, 1.2, 10, 2.4, 1.4, 5, 1.8][k],
  soft: k % 3 === 0,
}));

const referralFor = (username: string): string =>
  "BT-" + (username.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "TRADER") + String((BTSample.hashString(username) % 900) + 100);

export default function DashboardBody() {
  const { ready, profile } = usePanel();
  const [questReset, setQuestReset] = useState("--:--");
  const [battles, setBattles] = useState<BattleRow[]>([]);
  const [codeFlash, setCodeFlash] = useState<string | null>(null);
  const [verifyPending, setVerifyPending] = useState(false);

  /* Quest reset clock (midnight local) */
  useEffect(() => {
    const tick = () => setQuestReset(countdown(nextAt(24)).slice(0, 5));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* Next battles (sample schedule relative to now) */
  useEffect(() => {
    const today = new Date().getDate();
    setBattles(
      BATTLES.map((battle) => {
        const start = nextAt(battle.hour);
        return { type: battle.type, name: battle.name, meta: battle.meta, time: pad2(start.getHours()) + ":00", day: start.getDate() === today ? "Today" : "Tomorrow" };
      }),
    );
  }, []);

  useEffect(() => {
    if (codeFlash === null) return;
    const timer = window.setTimeout(() => setCodeFlash(null), 1800);
    return () => window.clearTimeout(timer);
  }, [codeFlash]);

  const referralCode = ready ? referralFor(profile.username) : null;
  // Soonest upcoming battle: "Today" beats "Tomorrow", then earliest HH:00.
  const nextBattle = [...battles].sort((a, b) => (a.day === b.day ? a.time.localeCompare(b.time) : a.day === "Today" ? -1 : 1))[0];

  const copyCode = () => {
    if (!referralCode) return;
    if (!navigator.clipboard) {
      setCodeFlash("Select & copy");
      return;
    }
    navigator.clipboard.writeText(referralCode).then(() => setCodeFlash("Copied!"), () => setCodeFlash("Select & copy"));
  };

  return (
    <>
      <section className="ah" id="tour-welcome" aria-labelledby="ah-title">
        <svg className="ah-silk" viewBox="0 0 1200 400" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="ah-silk-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".35" stopColor="#fff" stopOpacity=".55" />
              <stop offset=".7" stopColor="#fff" stopOpacity=".18" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <filter id="ah-silk-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          <g className="ah-silk-fan">
            {SILK.map((ribbon, k) => (
              <path key={k} className={ribbon.soft ? "is-soft" : undefined} d={ribbon.d} style={{ strokeWidth: ribbon.width }} />
            ))}
          </g>
        </svg>
        <div className="ah-txt">
          <p className="ah-tag"><i aria-hidden="true"></i>Season 1 &middot; Week 1</p>
          <h1 id="ah-title">Welcome to the arena, <span data-username="">{profile.username}</span></h1>
          <p>Your first battle is waiting. Win ranked finishes to earn points, climb the tiers and fight your way to the World Championship.</p>
          <div className="ah-btns">
            <Link className="btn b-ember" href="/app/browse-tournaments/">Enter today&apos;s battle</Link>
            <Link className="btn b-line" href="/app/arena/">Practice in the arena</Link>
          </div>
          <ul className="ah-strip" aria-label="Season at a glance">
            <li>
              <small>Level 1</small>
              <b>0<em>/ 120 XP</em></b>
              <span className="ah-strip-bar" aria-hidden="true"><i style={{ width: "4%" }}></i></span>
            </li>
            <li>
              <small>Season rank</small>
              <b>&mdash;<em>unranked</em></b>
            </li>
            <li>
              <small>Next battle</small>
              <b>{nextBattle ? nextBattle.time : "--:--"}<em>{nextBattle ? nextBattle.day : ""}</em></b>
            </li>
          </ul>
        </div>
        <LiveBattleChart you={profile.username} />
      </section>

      <div className="as" id="as-status" role="status">
        <span className="as-ico"><Svg body={SHIELD} /></span>
        <p><b>Finish your account</b><span>Verify your phone to unlock prize payouts.</span></p>
        <ul className="as-steps">
          <li className="ok"><Svg body='<path d="m5 12.5 4.5 4.5L19 7.5"/>' />Email verified</li>
          <li className="wait"><Svg body='<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>' />Phone pending</li>
        </ul>
        <button className="as-btn" id="as-verify" type="button" disabled={verifyPending} onClick={() => setVerifyPending(true)}>
          {verifyPending ? "Coming soon" : <>Verify now<Svg body={CHEV} /></>}
        </button>
      </div>

      <div className="ag">
        <section className="ac ac-me" id="me" aria-label="Your trader card">
          <div className="am-head">
            <div className="am-av-wrap"><span className="am-av" data-initials="">{profile.initials}</span><span className="am-tier">Rookie</span></div>
            <div className="am-who">
              <b data-username="">{profile.username}</b>
              <small><span data-country="">{profile.countryName}</span> &middot; joined <span data-joined="">{ready ? joinedLabel(profile.joined) : "today"}</span></small>
            </div>
          </div>
          <div className="am-xp">
            <div className="am-xp-row"><span>Level 1</span><span><b>0</b> / 120 XP</span></div>
            <div className="am-xp-bar"><i style={{ width: "4%" }}></i></div>
            <p>Win your first battle to earn <b>+40 XP</b>.</p>
          </div>
          <dl className="am-stats">
            <div><dt>Login streak</dt><dd>1</dd></div>
            <div><dt>Battles</dt><dd>0</dd></div>
            <div><dt>Quests done</dt><dd>0</dd></div>
          </dl>
          <Link className="ab2" href="/app/trader/" id="am-profile"><Svg body='<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' />View my trader profile</Link>
        </section>

        <div className="ak-grid" id="tour-stats">
          {STATS.map((stat) => (
            <div className={"ak is-" + stat.trend} key={stat.label}>
              <span className="ak-lbl">{stat.label}</span>
              <b className="ak-val">{stat.value}{stat.decimals && <span>{stat.decimals}</span>}</b>
              <span className="ak-delta">{stat.delta}</span>
              <span className="ak-note">
                <i className="ak-coin" aria-hidden="true"><Svg body={stat.icon} /></i>
                <span>{stat.note}</span>
              </span>
              <svg className="ak-spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path className="ak-spark-area" d={stat.spark.area} />
                <polyline className="ak-spark-line" points={stat.spark.line} />
              </svg>
            </div>
          ))}
        </div>

        <section className="ac ac-next" aria-labelledby="an-h">
          <div className="ac-h"><h2 id="an-h"><Svg body='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' />Next battles</h2><Link href="/app/browse-tournaments/">All tournaments<Svg body={CHEV} /></Link></div>
          <ul className="an" id="an-list">
            {battles.map((battle) => (
              <li className={"t-" + battle.type} key={battle.type}>
                <span className="an-ico"><Svg body={BATTLE_ICONS[battle.type]} /></span>
                <span className="an-txt"><b>{battle.name}</b><small>{battle.meta}</small></span>
                <span className="an-when"><b>{battle.time}</b><small>{battle.day}</small></span>
                <a className="an-go" href="/schedule/">Join<Svg body={CHEV} /></a>
              </li>
            ))}
          </ul>
        </section>

        <section className="ac ac-quests" id="tour-quests" aria-labelledby="aq-h">
          <div className="ac-h"><h2 id="aq-h"><Svg body={STAR} />Personal arena quests</h2><span className="ac-chip">Resets in <b id="aq-reset">{questReset}</b></span></div>
          <ul className="aq-list">
            {QUESTS.map((quest) => (
              <li className={"aq q-" + quest.id} key={quest.id}>
                <div className="aq-top">
                  <span className="aq-ico"><Svg body={quest.icon} /></span>
                  <b className="aq-name">{quest.name}</b>
                  <span className="aq-state">{quest.done === 0 ? "Not started" : quest.done >= quest.total ? "Complete" : "In progress"}</span>
                </div>
                <p className="aq-task">{quest.task}</p>
                <dl className="aq-nums">
                  <div><dt>Done</dt><dd>{quest.done}</dd></div>
                  <div><dt>Total</dt><dd>{quest.total}</dd></div>
                </dl>
                <span className="aq-bar" aria-hidden="true"><i style={{ width: (quest.done / quest.total) * 100 + "%" }}></i></span>
              </li>
            ))}
          </ul>
          <Link className="ab2" href="/app/arena/">Go to personal arena<Svg body={CHEV} /></Link>
        </section>

        <section className="ac ac-wallet" id="wallet" aria-labelledby="aw-h">
          <div className="ac-h"><h2 id="aw-h"><Svg body={WALLET} />Wallet</h2><a href="#wallet">History<Svg body={CHEV} /></a></div>
          <div className="aw-card">
            <div className="aw-card-top"><span className="aw-chip" aria-hidden="true"></span><span className="aw-brand">BattleTrader</span></div>
            <p className="aw-sub">Available balance</p>
            <p className="aw-big">$0<span>.00</span></p>
            <p className="aw-holder"><span data-username="">{profile.username}</span><span>USD</span></p>
          </div>
          <div className="aw-split">
            <div><span>Credits</span><b>$0</b></div>
            <div><span>Free tickets</span><b>0</b></div>
          </div>
          <p className="aw-empty"><Svg body={PULSE} />No recent activity</p>
        </section>

        <section className="ac ac-aff" id="invite" aria-labelledby="af-h">
          <div className="ac-h"><h2 id="af-h"><Svg body={GIFT} />Invite &amp; earn</h2></div>
          <p className="af-lead">Invite a friend &mdash; you both get a <b>free Mini Tournament ticket</b> when they finish their first battle.</p>
          <div className="af-ticket">
            <div className="af-ticket-main">
              <span className="af-ticket-lbl">Your invite code</span>
              <button className="af-code" id="af-code" type="button" aria-label={referralCode ? "Copy referral code " + referralCode : undefined} onClick={copyCode}>
                <span id="af-code-text">{codeFlash ?? referralCode ?? "\u2014"}</span>
                <Svg body='<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>' />
              </button>
            </div>
            <span className="af-ticket-stub" aria-hidden="true"><b>1</b>Free ticket</span>
          </div>
          <dl className="af-stats">
            <div><dt>Referrals</dt><dd>0</dd></div>
            <div><dt>Credits</dt><dd>$0</dd></div>
            <div><dt>Tickets</dt><dd>0</dd></div>
          </dl>
        </section>

        <section className="ac ac-badges" id="tour-badges" aria-labelledby="ab-h">
          <div className="ac-h"><h2 id="ab-h"><Svg body={MEDAL} />Badges</h2><span className="ac-chip c-bronze">0 / 6</span></div>
          <span className="ab-prog" aria-hidden="true"><i style={{ width: "0%" }}></i></span>
          <ul className="ab-list" id="achievements">
            <li className="is-next"><span className="bd b-blood"><Svg body={SWORDS} /></span><b>First Blood</b><small>Finish a battle</small></li>
            <li><span className="bd b-flame"><Svg body={FLAME} /></span><b>On Fire</b><small>3-day streak</small></li>
            <li><span className="bd b-target"><Svg body={TARGET} /></span><b>Sniper</b><small>Top 10 finish</small></li>
            <li><span className="bd b-shield"><Svg body={SHIELD} /></span><b>Ally</b><small>Join an alliance</small></li>
            <li><span className="bd b-crown"><Svg body={TROPHY} /></span><b>Champion</b><small>Win a tournament</small></li>
            <li><span className="bd b-star"><Svg body={STAR} /></span><b>Rising Star</b><small>Reach Silver</small></li>
          </ul>
        </section>

        <section className="ac ac-board" aria-labelledby="ar-h">
          <div className="ac-h"><h2 id="ar-h"><Svg body={TROPHY} />Leaderboard</h2><Link href="/app/leaderboards/">Full rankings<Svg body={CHEV} /></Link></div>
          <div className="lb-scroll">
            <table className="lb">
              <thead>
                <tr>
                  <th scope="col" className="lb-rk">#</th>
                  <th scope="col">Trader</th>
                  <th scope="col" className="lb-num">Points</th>
                  <th scope="col" className="lb-num lb-opt">Win rate</th>
                  <th scope="col" className="lb-num lb-opt">Wins</th>
                  <th scope="col" className="lb-num">Change</th>
                  <th scope="col" className="lb-opt">Last 7 days</th>
                  <th scope="col" className="lb-act"><span className="lb-vh">Profile</span></th>
                </tr>
              </thead>
              <tbody>
                {BOARD.map(({ trader: t, spark, change }, i) => {
                  const trend = change >= 0 ? "up" : "down";
                  return (
                    <tr className={i < 3 ? "r" + (i + 1) : undefined} key={t.handle}>
                      <td className="lb-rk">{i + 1}</td>
                      <td>
                        <span className="lb-who">
                          <span className="ar-av" aria-hidden="true" style={{ "--av": t.color } as React.CSSProperties}>{t.handle.charAt(0).toUpperCase()}</span>
                          <span><b>{t.handle}</b><small>{t.tier + " · " + t.city}</small></span>
                        </span>
                      </td>
                      <td className="lb-num lb-pts">{t.points.toLocaleString("en-US")}</td>
                      <td className="lb-num lb-opt">{t.winRate.toFixed(1) + "%"}</td>
                      <td className="lb-num lb-opt">{t.victories}</td>
                      <td className="lb-num">
                        <span className={"lb-chg is-" + trend}>{(change >= 0 ? "+" : "") + change.toFixed(2) + "%"}</span>
                      </td>
                      <td className="lb-opt">
                        <svg className={"lb-spark is-" + trend} viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                          <polyline points={spark} />
                        </svg>
                      </td>
                      <td className="lb-act">
                        <Link className="lb-go" href={"/app/trader/?u=" + encodeURIComponent(t.handle)} aria-label={"View " + t.handle + "'s profile"}>
                          <Svg body={CHEV} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="ar-you"><span>You</span><b data-username="">{profile.username}</b><em>Unranked &middot; 0 pts</em></p>
        </section>
      </div>

      <footer className="ap-foot">
        <p>Preview panel &mdash; your profile is stored in this browser only until accounts go live. Balances and battles shown are sample data.</p>
        <button className="ap-replay" id="ap-replay" type="button"><Svg body='<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>' />Replay tour</button>
      </footer>
    </>
  );
}
