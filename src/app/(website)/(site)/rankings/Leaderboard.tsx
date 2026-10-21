"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildTraders, fmt, profileUrl, type Trader } from "./_data/season";

const TRADERS = buildTraders();

const Crown = () => (
  <svg className="pod-crown" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z" /></svg>
);

function PodiumCard({ t }: { t: Trader }) {
  return (
    <div className={"pod p" + t.rank}>
      {t.rank === 1 && <Crown />}
      <span className="pod-av" aria-hidden="true">{t.handle.charAt(0).toUpperCase()}</span>
      <span className="pod-rank">{"#" + t.rank}</span>
      <b><Link className="lb-link" href={profileUrl(t.handle)}>{t.handle}</Link></b>
      <span className="pod-pts">{fmt(t.points)}<small>pts</small></span>
      <span className="pod-meta">{t.tier + " · Lv " + t.level + " · " + t.victories + " wins"}</span>
    </div>
  );
}

function Row({ t }: { t: Trader }) {
  return (
    <div className={"lb-row" + (t.rank <= 3 ? " r" + t.rank : "")} role="row" style={{ animationDelay: Math.min(t.rank, 20) * 30 + "ms" }}>
      <span className="lb-rank" role="cell">
        {t.rank <= 3 ? <span className="medal">{String(t.rank)}</span> : String(t.rank)}
      </span>
      <span className="lb-trader" role="cell">
        <span className="avatar" aria-hidden="true" style={{ "--av": t.color } as React.CSSProperties}>{t.handle.charAt(0).toUpperCase()}</span>
        <span>
          <b><Link className="lb-link" href={profileUrl(t.handle)}>{t.handle}</Link></b>
          <small>{t.city}</small>
        </span>
      </span>
      <span className="lb-tier-col" role="cell">
        <span className="lb-lv">{"Lv " + t.level}</span>
        <span className={"lb-tier t-" + t.tier.toLowerCase()}>{t.tier}</span>
      </span>
      <span className="lb-pts" role="cell">{fmt(t.points)}<small>pts</small></span>
      <span className="lb-num lb-opt" role="cell">{String(t.events)}</span>
      <span className="lb-num lb-opt" role="cell">{t.winRate.toFixed(1) + "%"}</span>
    </div>
  );
}

// Old pages.js showed the loader for 700ms, then revealed the podium + board.
export default function Leaderboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="bt-loader" id="lb-loader" role="status" hidden={ready}>
        <div className="bt-spin" aria-hidden="true"><i className="arc"></i><i className="dot"></i><span>B</span></div>
        <p>Loading&hellip;</p>
      </div>
      <noscript><p className="lb-empty">Turn on JavaScript to see the leaderboard.</p></noscript>

      <div className="podium" id="podium" hidden={!ready}>
        {ready && [TRADERS[1], TRADERS[0], TRADERS[2]].map((t) => <PodiumCard key={t.handle} t={t} />)}
      </div>

      <div className="lb" id="lb" role="table" aria-label="Season leaderboard" hidden={!ready}>
        <div className="lb-head" role="row">
          <span role="columnheader">Rank</span>
          <span role="columnheader">Trader</span>
          <span className="lb-tier-col" role="columnheader">Level / Tier</span>
          <span className="lb-pts" role="columnheader">Points</span>
          <span className="lb-num lb-opt" role="columnheader">Events</span>
          <span className="lb-num lb-opt" role="columnheader">Win rate</span>
        </div>
        <div className={ready ? "lb-rows in" : "lb-rows"} id="lb-rows" role="rowgroup">
          {ready && TRADERS.map((t) => <Row key={t.handle} t={t} />)}
        </div>
      </div>
    </>
  );
}
