"use client";

import { useEffect, useState } from "react";
import { BTSample } from "@panel/lib/data/sample";

/* Live 1v1 practice battle for the dashboard hero: you vs one rival, both racing on P&L %.
   Chart is a sliding window in a 300x110 viewBox (lines in y 12-96); the right edge is "now".
   The first render uses seeded data so server and client markup match; live ticks start after mount. */
const WINDOW = 90;
const END_X = 262; // leaves room on the right edge for the two P&L pills
const TICK_MS = 700;
const ROUND_SECONDS = 15 * 60;
const ROUND_ELAPSED_AT_LOAD = 268; // open mid-round so the timer reads like a battle already under way
const INSTRUMENT = "EUR/USD";
const FEED_MIN_MOVE = 0.06; // only moves this big (in %) make it into the trade feed

const RIVAL = BTSample.buildTraders()[2];

type Side = "you" | "rival";

interface Runner {
  level: number;
  velocity: number;
}

interface Battle {
  you: number[];
  rival: number[];
  youRun: Runner;
  rivalRun: Runner;
  anchor: number;
  leader: Side;
  swaps: number; // lead changes so far; also keys the lead-change flash so it replays
  event: { id: number; who: Side; move: number };
}

// Momentum + pull toward a shared, slowly wandering anchor: both traders swing in waves and keep crossing.
function stepRunner(run: Runner, anchor: number, rand: () => number): Runner {
  const velocity = run.velocity * 0.8 + (rand() - 0.5) * 0.16 + (anchor - run.level) * 0.05;
  return { level: run.level + velocity, velocity };
}

function advance(battle: Battle, rand: () => number): Battle {
  const anchor = battle.anchor + (rand() - 0.47) * 0.06;
  const youRun = stepRunner(battle.youRun, anchor + 0.12, rand);
  const rivalRun = stepRunner(battle.rivalRun, anchor, rand);
  const leader: Side = youRun.level >= rivalRun.level ? "you" : "rival";
  const youMove = youRun.level - battle.youRun.level;
  const rivalMove = rivalRun.level - battle.rivalRun.level;
  const who: Side = Math.abs(youMove) >= Math.abs(rivalMove) ? "you" : "rival";
  const move = who === "you" ? youMove : rivalMove;
  return {
    you: [...battle.you.slice(1), youRun.level],
    rival: [...battle.rival.slice(1), rivalRun.level],
    youRun,
    rivalRun,
    anchor,
    leader,
    swaps: battle.swaps + (leader !== battle.leader ? 1 : 0),
    event: Math.abs(move) >= FEED_MIN_MOVE ? { id: battle.event.id + 1, who, move } : battle.event,
  };
}

const SEEDED: Battle = (() => {
  const rand = BTSample.seededRandom(BTSample.hashString("practice-1v1"));
  let battle: Battle = {
    you: Array<number>(WINDOW).fill(0),
    rival: Array<number>(WINDOW).fill(0),
    youRun: { level: 0, velocity: 0 },
    rivalRun: { level: 0, velocity: 0 },
    anchor: 0,
    leader: "you",
    swaps: 0,
    event: { id: 0, who: "you", move: 0 },
  };
  for (let k = 0; k < WINDOW; k++) battle = advance(battle, rand);
  // lead changes during the seeded warm-up are history, not news: no flash on first paint
  return { ...battle, swaps: 0 };
})();

const chartX = (k: number) => (k * END_X) / (WINDOW - 1);
const NOW_LEFT = ((END_X / 300) * 100).toFixed(1) + "%";
const fmtPct = (value: number) => (value >= 0 ? "+" : "-") + Math.abs(value).toFixed(2) + "%";
const initial = (name: string) => (name || "?").charAt(0).toUpperCase();

const roundClock = (tick: number) => {
  const elapsed = ROUND_ELAPSED_AT_LOAD + Math.floor((tick * TICK_MS) / 1000);
  const left = ROUND_SECONDS - (elapsed % ROUND_SECONDS);
  return String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
};

// Keep the two right-edge pills from overlapping when the lines run close together (values are % of plot height).
const PILL_GAP = 13;
function separate(youBottom: number, rivalBottom: number): [number, number] {
  if (Math.abs(youBottom - rivalBottom) >= PILL_GAP) return [youBottom, rivalBottom];
  const mid = (youBottom + rivalBottom) / 2;
  return youBottom >= rivalBottom ? [mid + PILL_GAP / 2, mid - PILL_GAP / 2] : [mid - PILL_GAP / 2, mid + PILL_GAP / 2];
}

export default function LiveBattleChart({ you }: { you: string }) {
  const [battle, setBattle] = useState<Battle>(SEEDED);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setBattle((prev) => advance(prev, Math.random));
      setTick((count) => count + 1);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const youNow = battle.you[WINDOW - 1];
  const rivalNow = battle.rival[WINDOW - 1];
  const { leader, swaps, event } = battle;

  // Scale to whatever is on screen (always including the 0% start line), snapped to 0.25% so it doesn't twitch every tick.
  const values = [...battle.you, ...battle.rival, 0];
  const low = Math.floor((Math.min(...values) - 0.1) * 4) / 4;
  const high = Math.ceil((Math.max(...values) + 0.1) * 4) / 4;
  const chartY = (value: number) => 96 - ((value - low) / (high - low)) * 84;
  const toPoints = (series: number[]) => series.map((value, k) => chartX(k).toFixed(1) + "," + chartY(value).toFixed(1));
  const youPoints = toPoints(battle.you);
  const rivalPoints = toPoints(battle.rival);
  // area between the two lines: the gap the leader has opened up
  const spread = "M" + youPoints.join(" L") + " L" + [...rivalPoints].reverse().join(" L") + " Z";
  const zeroY = chartY(0).toFixed(1);

  // The SVG fills its plot box exactly, so viewBox units map straight onto CSS percentages of that box.
  const toBottom = (value: number) => ((110 - chartY(value)) / 110) * 100;
  const youTip = toBottom(youNow);
  const rivalTip = toBottom(rivalNow);
  const [youPill, rivalPill] = separate(youTip, rivalTip);

  // Tug-of-war: 50/50 when level, the leader pulls the bar their way (clamped so neither side vanishes).
  const youShare = Math.min(90, Math.max(10, 50 + (youNow - rivalNow) * 40));

  const eventName = event.who === "you" ? "You" : RIVAL.handle;

  return (
    <figure className="ah-chart bt" aria-label={"Live practice battle on " + INSTRUMENT + ": you " + fmtPct(youNow) + ", " + RIVAL.handle + " " + fmtPct(rivalNow)}>
      <figcaption className="ah-chart-h">
        <span className="ah-chart-meta">
          <span className="ah-chart-lbl">1v1 battle &middot; {INSTRUMENT}</span>
          <span className="ah-chart-live">
            <i aria-hidden="true"></i>Live<b>{roundClock(tick)}</b>
          </span>
        </span>
        <span className="bt-swaps">{swaps} lead {swaps === 1 ? "change" : "changes"}</span>
      </figcaption>

      <div className="bt-vs">
        <div className={"bt-side is-you" + (leader === "you" ? " is-lead" : "")}>
          <span className="bt-av" aria-hidden="true">{initial(you)}</span>
          <span className="bt-who"><small>You</small><b>{you}</b></span>
          <strong className={youNow >= 0 ? "is-up" : "is-down"}>{fmtPct(youNow)}</strong>
        </div>
        <span className="bt-vs-mid" aria-hidden="true">VS</span>
        <div className={"bt-side is-rival" + (leader === "rival" ? " is-lead" : "")}>
          <strong className={rivalNow >= 0 ? "is-up" : "is-down"}>{fmtPct(rivalNow)}</strong>
          <span className="bt-who"><small>{RIVAL.tier}</small><b>{RIVAL.handle}</b></span>
          <span className="bt-av" aria-hidden="true" style={{ "--av": RIVAL.color } as React.CSSProperties}>{initial(RIVAL.handle)}</span>
        </div>
      </div>
      <div className="bt-tug" aria-hidden="true">
        <i style={{ width: youShare + "%" }}></i>
      </div>

      <div className="ah-chart-plot" aria-hidden="true">
        <svg className="ah-chart-svg" viewBox="0 0 300 110" preserveAspectRatio="none">
          <path className={"bt-spread is-" + leader} d={spread} />
          <path className="bt-zero" d={"M0," + zeroY + " H300"} />
          <polyline className="bt-line is-rival" points={rivalPoints.join(" ")} />
          <polyline className="bt-line is-you" points={youPoints.join(" ")} />
        </svg>
        <span className="ah-chart-now" style={{ left: NOW_LEFT }}></span>
        <span className="bt-tip is-rival" style={{ left: NOW_LEFT, bottom: rivalTip + "%" }}></span>
        <span className="bt-tip is-you" style={{ left: NOW_LEFT, bottom: youTip + "%" }}></span>
        <span className="bt-pill is-rival" style={{ bottom: rivalPill + "%" }}>{fmtPct(rivalNow)}</span>
        <span className="bt-pill is-you" style={{ bottom: youPill + "%" }}>{fmtPct(youNow)}</span>
        {swaps > 0 && (
          <span className={"bt-flash is-" + leader} key={swaps}>
            {leader === "you" ? "You take the lead" : RIVAL.handle + " takes the lead"}
          </span>
        )}
      </div>

      {event.id > 0 && (
        <p className="bt-feed" key={event.id}>
          <i className={"is-" + event.who} aria-hidden="true"></i>
          <b>{eventName}</b>
          <span className={event.move >= 0 ? "is-up" : "is-down"}>{fmtPct(event.move)}</span>
          <span>on {INSTRUMENT}</span>
        </p>
      )}
    </figure>
  );
}
