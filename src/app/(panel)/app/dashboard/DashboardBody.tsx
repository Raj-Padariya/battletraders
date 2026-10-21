"use client";

// Dashboard content — port of dashboard.js (everything except the first-run tour, see DashboardTour.tsx).
import Link from "next/link";
import { useEffect, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { BTSample } from "@panel/lib/data/sample";
import { joinedLabel, usePanel } from "@panel/lib/panel";
import { countdown, nextAt, pad2 } from "@panel/lib/storage";

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

/* Season leaderboard: top 4 from the shared sample season, with an equity sparkline (deterministic). */
const BOARD = BTSample.buildTraders().slice(0, 4).map((t) => {
  const rand = BTSample.seededRandom(BTSample.hashString(t.handle));
  let value = 20;
  const points: string[] = [];
  for (let k = 0; k < 16; k++) {
    value = Math.max(4, Math.min(36, value + (rand() - 0.42) * 8));
    points.push((k * 8).toFixed(0) + "," + (40 - value).toFixed(1));
  }
  return { trader: t, points };
});

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
        <div className="ah-floor" aria-hidden="true"></div>
        <div className="ah-txt">
          <p className="ah-tag"><i aria-hidden="true"></i>Season 1 &middot; Week 1</p>
          <h1 id="ah-title">Welcome to the arena, <span data-username="">{profile.username}</span></h1>
          <p>Your first battle is waiting. Win ranked finishes to earn points, climb the tiers and fight your way to the World Championship.</p>
          <div className="ah-btns">
            <Link className="btn b-ember" href="/app/browse-tournaments/">Enter today&apos;s battle</Link>
            <Link className="btn b-line" href="/app/arena/">Practice in the arena</Link>
          </div>
        </div>
        <div className="ah-emblem" aria-hidden="true">
          <div className="ah-emblem-3d">
            <span className="ah-hex h1"></span><span className="ah-hex h2"></span>
            <span className="ah-core"><Svg body={SWORDS} /></span>
          </div>
          <span className="ah-orbit o1"></span><span className="ah-orbit o2"></span>
        </div>
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
          <div className="ak k-cyan">
            <span className="ak-ico"><Svg body={TARGET} /></span>
            <span className="ak-lbl">Active battles</span>
            <b className="ak-val">0</b>
            <span className="ak-sub">Join one to start</span>
          </div>
          <div className="ak k-green">
            <span className="ak-ico"><Svg body={WALLET} /></span>
            <span className="ak-lbl">Total winnings</span>
            <b className="ak-val">$0</b>
            <span className="ak-sub">Paid out to wallet</span>
          </div>
          <div className="ak k-pink">
            <span className="ak-ico"><Svg body={PULSE} /></span>
            <span className="ak-lbl">Win rate</span>
            <b className="ak-val">0.0%</b>
            <span className="ak-sub">Across ranked events</span>
          </div>
          <div className="ak k-gold">
            <span className="ak-ico"><Svg body={TROPHY} /></span>
            <span className="ak-lbl">Season rank</span>
            <b className="ak-val">&mdash;</b>
            <span className="ak-sub">Unranked so far</span>
          </div>
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
            <li className="aq q-day">
              <span className="aq-ring" style={{ "--p": 0 } as React.CSSProperties}><Svg body={FLAME} /></span>
              <span className="aq-txt"><b>Daily</b><small>Trade in 1 Daily Battle</small></span>
              <span className="aq-n"><b>0/7</b><small>done</small></span>
            </li>
            <li className="aq q-week">
              <span className="aq-ring" style={{ "--p": 0 } as React.CSSProperties}><Svg body={TARGET} /></span>
              <span className="aq-txt"><b>Weekly</b><small>Finish top 50% twice</small></span>
              <span className="aq-n"><b>0/8</b><small>done</small></span>
            </li>
            <li className="aq q-month">
              <span className="aq-ring" style={{ "--p": 0 } as React.CSSProperties}><Svg body={STAR} /></span>
              <span className="aq-txt"><b>Monthly</b><small>Reach Silver tier</small></span>
              <span className="aq-n"><b>0/8</b><small>done</small></span>
            </li>
          </ul>
          <Link className="ab2" href="/app/arena/">Go to personal arena<Svg body={CHEV} /></Link>
        </section>

        <section className="ac ac-wallet" id="wallet" aria-labelledby="aw-h">
          <div className="ac-h"><h2 id="aw-h"><Svg body={WALLET} />Wallet</h2><a href="#wallet">History<Svg body={CHEV} /></a></div>
          <p className="aw-big">$0<span>.00</span></p>
          <p className="aw-sub">Available balance</p>
          <div className="aw-split">
            <div><span>Credits</span><b>$0</b></div>
            <div><span>Free tickets</span><b>0</b></div>
          </div>
          <p className="aw-empty"><Svg body={PULSE} />No recent activity</p>
        </section>

        <section className="ac ac-aff" id="invite" aria-labelledby="af-h">
          <div className="ac-h"><h2 id="af-h"><Svg body={GIFT} />Invite &amp; earn</h2></div>
          <p className="af-lead">Invite a friend &mdash; you both get a <b>free Mini Tournament ticket</b> when they finish their first battle.</p>
          <button className="af-code" id="af-code" type="button" aria-label={referralCode ? "Copy referral code " + referralCode : undefined} onClick={copyCode}>
            <span id="af-code-text">{codeFlash ?? referralCode ?? "\u2014"}</span>
            <Svg body='<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>' />
          </button>
          <dl className="af-stats">
            <div><dt>Referrals</dt><dd>0</dd></div>
            <div><dt>Credits</dt><dd>$0</dd></div>
            <div><dt>Tickets</dt><dd>0</dd></div>
          </dl>
        </section>

        <section className="ac ac-badges" id="tour-badges" aria-labelledby="ab-h">
          <div className="ac-h"><h2 id="ab-h"><Svg body={MEDAL} />Badges</h2><span className="ac-chip c-bronze">0 / 6</span></div>
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
          <ul className="ar" id="ar-list">
            {BOARD.map(({ trader: t, points }, i) => (
              <li className={i < 3 ? "r" + (i + 1) : undefined} key={t.handle}>
                <span className="ar-rk">{i + 1}</span>
                <Link className="ar-who" href={"/app/trader/?u=" + encodeURIComponent(t.handle)} style={{ color: "inherit", textDecoration: "none" }}>
                  <span className="ar-av" aria-hidden="true" style={{ "--av": t.color } as React.CSSProperties}>{t.handle.charAt(0).toUpperCase()}</span>
                  <span><b>{t.handle}</b><small>{t.tier + " · " + t.city}</small></span>
                </Link>
                <span className="ar-meta">Win rate<b>{t.winRate.toFixed(1) + "%"}</b></span>
                <span className="ar-pts"><b>{t.points.toLocaleString("en-US")}</b><small>{"▲ " + t.victories + " wins"}</small></span>
                <svg className="ar-spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
                  {i === 0 && (
                    <defs>
                      <linearGradient id="ar-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#22E39A" stopOpacity=".3" />
                        <stop offset="1" stopColor="#22E39A" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  )}
                  <path d={"M0,40 L" + points.join(" L") + " L120,40 Z"} />
                  <polyline points={points.join(" ")} />
                </svg>
              </li>
            ))}
          </ul>
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
