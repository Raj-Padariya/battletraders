"use client";

import { useEffect, useRef, useState } from "react";

// Auth battle card: illustrative duel — scores drift, health bars follow the gap, hits pop and shake.
const AB_POINTS = 32;
const AB_W = 240;
const AB_H = 66;
const AB_TARGETS = [3, 1.5];
const AB_NAMES = ["wolf_of_fx", "bear_hunter"];
const AB_INITIAL_SECONDS = 42 * 60 + 17;

interface Pop {
  id: number;
  delta: number;
}

interface FeedEntry {
  seq: number;
  fighter: number;
  delta: number;
}

const abPct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
const pad = (n: number) => (n < 10 ? "0" + n : String(n));

function buildLines(): number[][] {
  const lines: number[][] = [[], []];
  [4.82, -1.17].forEach((finalScore, p) => {
    let v = finalScore;
    for (let k = AB_POINTS - 1; k >= 0; k--) {
      lines[p][k] = v;
      v -= (Math.random() - (p === 0 ? 0.35 : 0.55)) * 0.5;
    }
  });
  return lines;
}

export default function BattleScene({ chip }: { chip: React.ReactNode }) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const fighterRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const linesRef = useRef<number[][] | null>(null);

  const [lines, setLines] = useState<number[][] | null>(null);
  const [pops, setPops] = useState<Pop[][]>([[], []]);
  const [feed, setFeed] = useState<FeedEntry | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AB_INITIAL_SECONDS);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const initial = buildLines();
    linesRef.current = initial;
    setLines(initial);

    if (reducedMotion) {
      setFeed({ seq: 0, fighter: 0, delta: 0.21 });
      return;
    }

    let popId = 0;
    let ticks = 0;
    const tick = () => {
      const current = linesRef.current;
      if (document.hidden || !current) return;
      const deltas = [0, 0];
      const next = current.map((line, p) => {
        const last = line[AB_POINTS - 1];
        const value = last + (Math.random() - 0.5) * 0.5 - (last - AB_TARGETS[p]) * 0.04;
        deltas[p] = value - last;
        return [...line.slice(1), value];
      });
      linesRef.current = next;
      setLines(next);

      const mover = Math.abs(deltas[0]) >= Math.abs(deltas[1]) ? 0 : 1;
      const delta = deltas[mover];
      popId++;
      const pop = { id: popId, delta };
      setPops((all) => all.map((list, p) => (p === mover ? [...list, pop] : list)));
      const fighter = fighterRefs.current[mover];
      if (delta < 0 && fighter) {
        fighter.classList.remove("hit");
        void fighter.offsetWidth; // restart the shake animation
        fighter.classList.add("hit");
      }
      ticks++;
      if (ticks % 3 === 1) setFeed({ seq: ticks, fighter: mover, delta });
    };
    const tickTimer = window.setInterval(tick, 1400);
    const clockTimer = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 60 * 60));
    }, 1000);

    const tilt = tiltRef.current;
    const stage = tilt ? tilt.closest<HTMLElement>(".auth-hero") : null;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onLeave: (() => void) | null = null;
    if (tilt && stage && window.matchMedia("(pointer: fine)").matches) {
      onMove = (e: PointerEvent) => {
        const box = stage.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width - 0.5;
        const y = (e.clientY - box.top) / box.height - 0.5;
        tilt.style.setProperty("--ry", (x * 26).toFixed(2) + "deg");
        tilt.style.setProperty("--rx", (-y * 18).toFixed(2) + "deg");
      };
      onLeave = () => {
        tilt.style.removeProperty("--ry");
        tilt.style.removeProperty("--rx");
      };
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
    }

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(clockTimer);
      if (stage && onMove) stage.removeEventListener("pointermove", onMove);
      if (stage && onLeave) stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Restart the feed slide-in each time a new trade is announced.
  useEffect(() => {
    const el = feedRef.current;
    if (!feed || !el) return;
    el.classList.toggle("loss", feed.delta < 0);
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  }, [feed]);

  const removePop = (fighter: number, id: number) => {
    setPops((all) => all.map((list, p) => (p === fighter ? list.filter((pop) => pop.id !== id) : list)));
  };

  let scores: number[] = [4.82, -1.17];
  let polylinePoints = ["", ""];
  let dotStyles: (React.CSSProperties | undefined)[] = [undefined, undefined];
  let healthStyles: (React.CSSProperties | undefined)[] = [undefined, undefined];
  if (lines) {
    const all = lines[0].concat(lines[1]);
    const min = Math.min(...all) - 0.3;
    const max = Math.max(...all) + 0.3;
    scores = [lines[0][AB_POINTS - 1], lines[1][AB_POINTS - 1]];
    polylinePoints = lines.map((line) =>
      line
        .map((v, i) => ((i * AB_W) / (AB_POINTS - 1)).toFixed(1) + "," + (AB_H - 4 - ((v - min) / (max - min)) * (AB_H - 8)).toFixed(1))
        .join(" "),
    );
    dotStyles = scores.map((s) => ({
      top: (100 - (4 / AB_H) * 100 - (((s - min) / (max - min)) * (AB_H - 8)) / AB_H * 100).toFixed(1) + "%",
    }));
    healthStyles = scores.map((s, p) => ({ width: Math.max(12, Math.min(95, 55 + (s - scores[1 - p]) * 4)) + "%" }));
  }
  const lead = scores[0] >= scores[1] ? "1" : "2";
  const clockParts = [Math.floor(secondsLeft / 3600), Math.floor(secondsLeft / 60) % 60, secondsLeft % 60];

  const renderPops = (fighter: number) =>
    pops[fighter].map((pop) => (
      <span
        key={pop.id}
        className={"ab-pop " + (pop.delta >= 0 ? "up" : "dn")}
        onAnimationEnd={() => removePop(fighter, pop.id)}
      >
        {abPct(pop.delta)}
      </span>
    ));

  return (
    <div className="ab-scene" aria-hidden="true">
      <div className="ab-tilt" ref={tiltRef}>
        <div className="ab-card" id="ab-card" data-lead={lead}>
          <div className="ab-top">
            <span className="ab-live">
              <i></i>Live
            </span>
            <span>Daily Battle · XAU/USD</span>
            <span className="ab-round">
              Round <b>3</b>/5
            </span>
          </div>
          <div className="ab-hud">
            <div className="ab-bar p1">
              <i className="lag" style={healthStyles[0]}></i>
              <i className="fill" style={healthStyles[0]}></i>
            </div>
            <span className="ab-timer" id="ab-clock">
              {clockParts.map(pad).join(":")}
            </span>
            <div className="ab-bar p2">
              <i className="lag" style={healthStyles[1]}></i>
              <i className="fill" style={healthStyles[1]}></i>
            </div>
          </div>
          <div className="ab-fight">
            <div className="ab-f p1" ref={(el) => { fighterRefs.current[0] = el; }}>
              <svg className="ab-crown" viewBox="0 0 24 24">
                <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z" />
              </svg>
              <span className="ab-av">
                <span>W</span>
              </span>
              <b>wolf_of_fx</b>
              <small>Lv 32 · Elite</small>
              <em className={scores[0] < 0 ? "dn" : undefined}>{abPct(scores[0])}</em>
              {renderPops(0)}
            </div>
            <div className="ab-clash">
              <span className="ab-x">VS</span>
              <i className="ab-spark" style={{ "--dx": "-26px", "--dy": "-22px" } as React.CSSProperties}></i>
              <i className="ab-spark" style={{ "--dx": "24px", "--dy": "-26px", animationDelay: ".3s" } as React.CSSProperties}></i>
              <i className="ab-spark" style={{ "--dx": "-20px", "--dy": "24px", animationDelay: ".6s" } as React.CSSProperties}></i>
              <i className="ab-spark" style={{ "--dx": "28px", "--dy": "20px", animationDelay: ".9s" } as React.CSSProperties}></i>
            </div>
            <div className="ab-f p2" ref={(el) => { fighterRefs.current[1] = el; }}>
              <svg className="ab-crown" viewBox="0 0 24 24">
                <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z" />
              </svg>
              <span className="ab-av">
                <span>B</span>
              </span>
              <b>bear_hunter</b>
              <small>Lv 29 · Platinum</small>
              <em className={scores[1] < 0 ? "dn" : undefined}>{abPct(scores[1])}</em>
              {renderPops(1)}
            </div>
          </div>
          <div className="ab-chart-wrap">
            <svg className="ab-chart" viewBox="0 0 240 66" preserveAspectRatio="none">
              <polyline className="l1" points={polylinePoints[0]} />
              <polyline className="l2" points={polylinePoints[1]} />
            </svg>
            <i className="ab-dot d1" style={dotStyles[0]}></i>
            <i className="ab-dot d2" style={dotStyles[1]}></i>
          </div>
          <ul className="ab-stats">
            <li>
              <span>Prize pool</span>
              <b className="gold">$2,500</b>
            </li>
            <li>
              <span>Fighters</span>
              <b>128</b>
            </li>
            <li>
              <span>Entry</span>
              <b>Free</b>
            </li>
          </ul>
        </div>
        {chip}
        <div className="ab-feed" id="ab-feed" ref={feedRef}>
          {feed && (
            <>
              <b>{AB_NAMES[feed.fighter]}</b>
              {(feed.delta >= 0 ? " closed BUY" : " closed SELL") + " XAU/USD "}
              <span className={feed.delta >= 0 ? "up" : "dn"}>{abPct(feed.delta)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
