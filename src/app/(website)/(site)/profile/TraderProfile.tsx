"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buildTraders, fmt, hashString, seededRandom, type Trader } from "../rankings/_data/season";

const EVENT_NAMES = ["Daily Battle", "Daily Battle", "Daily Battle", "Mini Tournament", "Mini Tournament", "Circuit Championship"];

type LedgerItem = { placement: number; event: string; when: string };

type ProfileData = {
  trader: Trader;
  id: string;
  followers: string;
  style: string;
  aggression: number;
  roi: number;
  ledger: LedgerItem[];
};

const timeAgo = (hours: number): string => {
  if (hours < 24) return "About " + Math.round(hours) + " hours ago";
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : days + " days ago";
  const months = Math.round(days / 30);
  return months === 1 ? "About 1 month ago" : "About " + months + " months ago";
};

// Same rand() call order as old pages.js renderProfile + buildLedger, so every trader's record is unchanged.
const buildProfile = (t: Trader): ProfileData => {
  const hash = hashString(t.handle);
  const rand = seededRandom(hash);
  const aggression = Math.round(15 + rand() * 80);
  const roi = Math.round(25 + rand() * 70);
  const followers = fmt(Math.round((rand() * 3000) / Math.sqrt(t.rank)));

  const ledger: LedgerItem[] = [];
  const bestPossible = t.victories > 0 ? 1 : t.podiums > 0 ? 2 : 4;
  let hours = 2 + rand() * 20;
  for (let i = 0; i < 10; i++) {
    const placement = Math.max(bestPossible, Math.round(1 + Math.pow(rand(), 2) * 40));
    const event = EVENT_NAMES[Math.floor(rand() * EVENT_NAMES.length)];
    ledger.push({ placement, event, when: timeAgo(hours) });
    hours += 6 + rand() * 300;
  }

  return {
    trader: t,
    id: ("000" + (hash & 0xffff).toString(16).toUpperCase()).slice(-4),
    followers,
    style: aggression >= 60 ? "Aggressive" : aggression >= 35 ? "Balanced" : "Conservative",
    aggression,
    roi,
    ledger,
  };
};

type Phase = { kind: "loading" } | { kind: "missing" } | { kind: "found"; data: ProfileData };

function ShareButton() {
  const [label, setLabel] = useState("Share");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const flashLabel = (text: string) => {
    setLabel(text);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setLabel("Share"), 2200);
  };

  const onShare = () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      // A rejected promise here means the user closed the share sheet; nothing to report.
      navigator.share({ title: document.title, url }).catch(() => {});
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      flashLabel("Copy the address bar link");
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => flashLabel("Link copied"),
      () => flashLabel("Copy the address bar link"),
    );
  };

  return (
    <button className="pf-share" id="pf-share" type="button" onClick={onShare}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></svg>
      <span>{label}</span>
    </button>
  );
}

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
);

// `handle` undefined = still waiting for the query string (Suspense fallback): stay on the loader forever.
function ProfileView({ handle }: { handle?: string | null }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [barsOn, setBarsOn] = useState(false);

  useEffect(() => {
    if (handle === undefined) return;
    const match = buildTraders().find((t) => t.handle === handle);
    const timer = setTimeout(() => {
      setPhase(match ? { kind: "found", data: buildProfile(match) } : { kind: "missing" });
    }, 500);
    return () => clearTimeout(timer);
  }, [handle]);

  useEffect(() => {
    if (phase.kind !== "found") return;
    document.title = phase.data.trader.handle + " — Trader profile — BattleTrader";
    const timer = setTimeout(() => setBarsOn(true), 30);
    return () => clearTimeout(timer);
  }, [phase]);

  const data = phase.kind === "found" ? phase.data : null;
  const t = data?.trader;
  const barWidth = (value: number): React.CSSProperties | undefined => (barsOn ? { width: value + "%" } : undefined);
  const aggressionBar = barWidth(data ? data.aggression : 0);
  const roiBar = barWidth(data ? data.roi : 0);
  const winRateBar = barWidth(t ? Math.min(100, t.winRate) : 0);
  const winRate = t ? t.winRate.toFixed(2) + "%" : "";

  return (
    <main className="pf-page">
      <div className="col pad">
        <div className="pf-top">
          <Link className="pf-back" href="/rankings/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Back</Link>
          <p className="pf-crumb">Member record / <span data-f="id">{data ? data.id : "—"}</span></p>
          <ShareButton />
        </div>

        <div className="bt-loader" id="pf-loader" role="status" hidden={phase.kind !== "loading"}>
          <div className="bt-spin" aria-hidden="true"><i className="arc"></i><i className="dot"></i><span>B</span></div>
          <p>Loading&hellip;</p>
        </div>
        <noscript><p className="lb-empty">Turn on JavaScript to see this trader profile.</p></noscript>

        <div className="pf-missing" id="pf-missing" hidden={phase.kind !== "missing"}>
          <h1>Trader not found</h1>
          <p>This handle isn&apos;t on the season board. Pick a trader from the rankings to open their record.</p>
          <Link className="btn b-ember" href="/rankings/">View rankings</Link>
        </div>

        <div className="pf" id="pf" hidden={!data}>
          <aside className="pf-card">
            <div className="pf-av-ring">
              <span className="pf-av" aria-hidden="true" data-f="initial" style={t ? ({ "--av": t.color } as React.CSSProperties) : undefined}>{t ? t.handle.charAt(0).toUpperCase() : ""}</span>
              <i className="pf-online" title="Active this season"></i>
            </div>
            <h1 className="pf-name" data-f="handle">{t?.handle}</h1>
            <div className="pf-badges">
              <span className={t ? "lb-tier t-" + t.tier.toLowerCase() : "lb-tier"} data-f="tier">{t?.tier}</span>
              <span className="pf-rank">Rank #<span data-f="rank">{t ? String(t.rank) : ""}</span></span>
            </div>
            <dl className="pf-facts">
              <div><dt>Season points</dt><dd className="pf-gold" data-f="points">{t ? fmt(t.points) : ""}</dd></div>
              <div><dt>Level</dt><dd data-f="level">{t ? String(t.level) : ""}</dd></div>
              <div><dt>Location</dt><dd data-f="city">{t?.city}</dd></div>
              <div><dt><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></svg>Community</dt><dd><span data-f="followers">{data?.followers}</span> followers</dd></div>
            </dl>
            <div className="pf-style">
              <p className="pf-style-h"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg><span data-f="style">{data?.style}</span></p>
              <div className="pf-metric"><span>Aggression</span><b data-f="aggression">{data ? data.aggression + "%" : ""}</b></div>
              <div className="pf-bar"><span data-bar="aggression" style={aggressionBar}></span></div>
              <div className="pf-metric"><span>ROI consistency</span><b data-f="roi">{data ? data.roi + "%" : ""}</b></div>
              <div className="pf-bar"><span data-bar="roi" style={roiBar}></span></div>
            </div>
            <div className="pf-status"><span>Profile status</span><b>Public</b></div>
          </aside>

          <div className="pf-main">
            <div className="pf-stats">
              <div className="pf-stat"><span>Tournaments</span><b data-f="events">{t ? String(t.events) : ""}</b></div>
              <div className="pf-stat"><span>Victories</span><b data-f="victories">{t ? String(t.victories) : ""}</b></div>
              <div className="pf-stat"><span>Podiums</span><b data-f="podiums">{t ? String(t.podiums) : ""}</b></div>
              <div className="pf-stat"><span>Win rate</span><b data-f="winRate">{winRate}</b></div>
            </div>

            <section className="pf-panel" aria-labelledby="pf-record-h">
              <div className="pf-panel-h">
                <h2 id="pf-record-h"><TrophyIcon />Tournament record</h2>
                <span className="pf-chip">Public record</span>
              </div>
              <div className="pf-record">
                <div className="pf-bars">
                  <div className="pf-metric"><span>ROI consistency</span><b data-f="roi">{data ? data.roi + "%" : ""}</b></div>
                  <div className="pf-bar"><span data-bar="roi" style={roiBar}></span></div>
                  <div className="pf-metric"><span>Tournament win rate</span><b data-f="winRate">{winRate}</b></div>
                  <div className="pf-bar"><span data-bar="winRate" style={winRateBar}></span></div>
                </div>
                <div className="pf-mini"><TrophyIcon /><b data-f="victories">{t ? String(t.victories) : ""}</b><span>1st place</span></div>
                <div className="pf-mini"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l-3 6h-4z" /><circle cx="12" cy="15" r="6" /><path d="m12 12 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 14.3l2-.3z" /></svg><b data-f="podiums">{t ? String(t.podiums) : ""}</b><span>Top three</span></div>
                <div className="pf-mini"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z" /></svg><b data-f="events">{t ? String(t.events) : ""}</b><span>Entered</span></div>
              </div>
            </section>

            <section className="pf-panel" aria-labelledby="pf-ledger-h">
              <div className="pf-panel-h">
                <h2 id="pf-ledger-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>Activity ledger</h2>
                <span className="pf-chip">Public</span>
              </div>
              <ul className="pf-ledger" id="pf-ledger">
                {data?.ledger.map((item, index) => (
                  <li key={index} className={item.placement <= 3 ? "top" : undefined}>
                    <i></i>
                    <span>
                      <b>{"Tournament placement: #" + item.placement}</b>
                      <small>{item.event}</small>
                    </span>
                    <time>{item.when}</time>
                  </li>
                ))}
              </ul>
            </section>
            <p className="pf-note">Sample profile &mdash; illustrative data until Season 1 opens.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TraderProfile() {
  const handle = useSearchParams().get("t");
  return <ProfileView handle={handle} />;
}

// Suspense fallback / static HTML: the same loader-only markup the old page showed before pages.js ran.
export function TraderProfileFallback() {
  return <ProfileView handle={undefined} />;
}
