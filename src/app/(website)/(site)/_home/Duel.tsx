"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Hero glass battle terminal (illustrative data) — port of the old main.js #duel block.
const GX_POINTS = 48;
const GX_VIEW_W = 600;
const GX_VIEW_H = 220;
const GX_NAMES = ["wolf_of_fx", "bear_hunter", "pip_sniper"];
const GX_INITIAL_SCORES = [4.82, 3.17, 2.4];
const GX_TARGETS = [4.6, 3.5, 2.6];
const GX_TIMEFRAMES = [1, 5, 15, 30];
const GX_INITIAL_SECONDS = 42 * 60 + 17;

interface Model {
  scores: number[];
  lines: number[][];
  ticks: number;
}

interface Range {
  min: number;
  max: number;
}

const pct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
const pad = (n: number) => (n < 10 ? "0" + n : String(n));
const timeLabel = (minutesAgo: number) => {
  const date = new Date(Date.now() - minutesAgo * 60000);
  return pad(date.getHours()) + ":" + pad(date.getMinutes());
};
const dnClass = (v: number) => (v < 0 ? "dn" : undefined);

// Walk backwards from the live score so every timeframe ends exactly on the current value.
function buildHistory(scores: number[], minutes: number): number[][] {
  const noise = 0.16 * Math.sqrt(minutes);
  const lines: number[][] = [[], []];
  for (let p = 0; p < 2; p++) {
    let value = scores[p];
    const trend = (scores[p] * 0.85) / GX_POINTS;
    for (let k = GX_POINTS - 1; k >= 0; k--) {
      lines[p][k] = value;
      value -= trend + (Math.random() - 0.5) * noise;
    }
  }
  return lines;
}

function buildXLabels(minutes: number): string[] {
  const spanMinutes = (GX_POINTS - 1) * minutes;
  return [0, 1, 2, 3, 4].map((t) => timeLabel(spanMinutes - (spanMinutes * t) / 4));
}

function getRange(lines: number[][]): Range {
  const all = lines[0].concat(lines[1]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const padding = (max - min) * 0.14 || 0.5;
  return { min: min - padding, max: max + padding };
}

const xPercent = (i: number) => (i / (GX_POINTS - 1)) * 100;
const yPercent = (v: number, range: Range) => (1 - (v - range.min) / (range.max - range.min)) * 100;

function tickModel(m: Model): Model {
  const scores = m.scores.map((s, p) => s + (Math.random() - 0.5) * 0.24 - (s - GX_TARGETS[p]) * 0.05);
  const ticks = m.ticks + 1;
  // The last point is the forming candle; every fourth tick it closes and a new one opens.
  const closeCandle = ticks % 4 === 0;
  const lines = m.lines.map((line, q) => {
    if (closeCandle) return [...line.slice(1), scores[q]];
    const next = line.slice();
    next[GX_POINTS - 1] = scores[q];
    return next;
  });
  return { scores, lines, ticks };
}

export default function Duel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const duelRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(true);

  const [model, setModel] = useState<Model | null>(null);
  const [minutes, setMinutes] = useState(5);
  const [xLabels, setXLabels] = useState<string[]>([]);
  const [hover, setHover] = useState(-1);
  const [secondsLeft, setSecondsLeft] = useState(GX_INITIAL_SECONDS);
  const [drawKey, setDrawKey] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reducedMotion;
    setModel({ scores: GX_INITIAL_SCORES.slice(), lines: buildHistory(GX_INITIAL_SCORES, 5), ticks: 0 });
    setXLabels(buildXLabels(5));
    setDrawKey(1);

    if (reducedMotion) return;
    const tickTimer = window.setInterval(() => {
      if (document.hidden) return;
      setModel((m) => (m ? tickModel(m) : m));
    }, 1400);
    const clockTimer = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 60 * 60));
    }, 1000);

    const stage = stageRef.current;
    const duel = duelRef.current;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onLeave: (() => void) | null = null;
    if (stage && duel && window.matchMedia("(pointer: fine)").matches) {
      onMove = (e: PointerEvent) => {
        const box = stage.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width - 0.5;
        const y = (e.clientY - box.top) / box.height - 0.5;
        duel.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        duel.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
      };
      onLeave = () => {
        duel.style.removeProperty("--ry");
        duel.style.removeProperty("--rx");
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

  // Restart the line reveal animation after the chart has re-rendered.
  useEffect(() => {
    const plot = plotRef.current;
    if (!drawKey || !plot || reducedRef.current) return;
    plot.classList.remove("draw");
    void plot.offsetWidth;
    plot.classList.add("draw");
  }, [drawKey]);

  const range = model ? getRange(model.lines) : null;
  const markerIndex = hover >= 0 ? hover : GX_POINTS - 1;

  // Sit beside the point (right of it on the left half, left of it on the right half) and clamp inside the plot.
  useEffect(() => {
    const plot = plotRef.current;
    const tip = tipRef.current;
    if (!model || !range || !plot || !tip) return;
    const x = xPercent(markerIndex);
    const y0 = yPercent(model.lines[0][markerIndex], range);
    const plotWidth = plot.clientWidth;
    const plotHeight = plot.clientHeight;
    const tipWidth = tip.offsetWidth;
    const tipHeight = tip.offsetHeight;
    const pointX = (x / 100) * plotWidth;
    const pointY = (y0 / 100) * plotHeight;
    const tipLeft = x > 50 ? pointX - tipWidth - 16 : pointX + 16;
    let tipTop = pointY + 12;
    if (tipTop + tipHeight > plotHeight) tipTop = pointY - tipHeight - 12;
    tip.style.left = Math.max(0, Math.min(plotWidth - tipWidth, tipLeft)) + "px";
    tip.style.top = Math.max(0, Math.min(plotHeight - tipHeight, tipTop)) + "px";
  });

  const selectTimeframe = (tf: number) => {
    setMinutes(tf);
    setModel((m) => (m ? { ...m, lines: buildHistory(m.scores, tf) } : m));
    setXLabels(buildXLabels(tf));
    setDrawKey((k) => k + 1);
  };

  const onPlotMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
    setHover(Math.round(ratio * (GX_POINTS - 1)));
  };

  const scores = model ? model.scores : GX_INITIAL_SCORES;
  const lead = scores[0] >= scores[1] ? "1" : "2";
  const tugStyle = model ? { width: Math.max(12, Math.min(88, 50 + (scores[0] - scores[1]) * 10)) + "%" } : undefined;

  const svgPoints =
    model && range
      ? model.lines.map((line) =>
          line.map((v, i) => ((xPercent(i) * GX_VIEW_W) / 100).toFixed(1) + "," + ((yPercent(v, range) * GX_VIEW_H) / 100).toFixed(1)),
        )
      : null;
  const polyPoints = (p: number) => (svgPoints ? svgPoints[p].join(" ") : "");
  const areaPath = (p: number) =>
    svgPoints ? "M0," + GX_VIEW_H + " L" + svgPoints[p].join(" L") + " L" + GX_VIEW_W + "," + GX_VIEW_H + " Z" : "";

  const markerX = xPercent(markerIndex);
  const markerYs = model && range ? [yPercent(model.lines[0][markerIndex], range), yPercent(model.lines[1][markerIndex], range)] : null;
  const dotStyle = (p: number) => (markerYs ? { left: markerX + "%", top: markerYs[p] + "%" } : undefined);
  const tipValues = model ? [model.lines[0][markerIndex], model.lines[1][markerIndex]] : [GX_INITIAL_SCORES[0], GX_INITIAL_SCORES[1]];
  const tipTime = !model || markerIndex === GX_POINTS - 1 ? "Live now" : timeLabel((GX_POINTS - 1 - markerIndex) * minutes);

  const clockParts = [Math.floor(secondsLeft / 3600), Math.floor(secondsLeft / 60) % 60, secondsLeft % 60];
  const boardOrder = [0, 1, 2].sort((a, b) => scores[b] - scores[a]);

  return (
    <div className="gx-stage" ref={stageRef}>
      <span className="gx-orb o1" aria-hidden="true"></span>
      <span className="gx-orb o2" aria-hidden="true"></span>
      <div className="gx" id="duel" data-lead={lead} role="region" aria-label="Example live battle" ref={duelRef}>
        <div className="gx-in">
          <div className="gx-head">
            <span className="gx-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2" />
              </svg>
            </span>
            <div className="gx-title">
              <span>Daily Battle</span>
              <b>XAU/USD</b>
            </div>
            <span className="gx-live">
              <i aria-hidden="true"></i>Live
            </span>
            <span className="gx-clock" id="duel-clock">
              {clockParts.map(pad).join(":")}
            </span>
          </div>

          <div className="gx-vs">
            <div className="gx-f p1">
              <span className="gx-av" aria-hidden="true">W</span>
              <span className="gx-who">
                <b>wolf_of_fx</b>
                <em id="duel-a" className={dnClass(scores[0])}>{pct(scores[0])}</em>
              </span>
            </div>
            <span className="gx-vsx" aria-hidden="true">VS</span>
            <div className="gx-f p2">
              <span className="gx-who">
                <b>bear_hunter</b>
                <em id="duel-b" className={dnClass(scores[1])}>{pct(scores[1])}</em>
              </span>
              <span className="gx-av" aria-hidden="true">B</span>
            </div>
            <div className="gx-tug" aria-hidden="true">
              <span id="duel-tug" style={tugStyle}></span>
            </div>
          </div>

          <div className="gx-tf" role="group" aria-label="Chart timeframe">
            {GX_TIMEFRAMES.map((tf) => (
              <button key={tf} type="button" data-tf={tf} aria-pressed={minutes === tf ? "true" : "false"} onClick={() => selectTimeframe(tf)}>
                {tf}m
              </button>
            ))}
          </div>

          <div className="gx-chart" aria-hidden="true">
            <div className="gx-y" id="gx-y">
              {range &&
                [0, 1, 2, 3, 4].map((t) => {
                  const value = range.max - ((range.max - range.min) * t) / 4;
                  return (
                    <span key={t} style={{ top: t * 25 + "%" }}>
                      {(value >= 0 ? "+" : "") + value.toFixed(1) + "%"}
                    </span>
                  );
                })}
            </div>
            <div
              className="gx-plot"
              id="gx-plot"
              ref={plotRef}
              onPointerMove={onPlotMove}
              onPointerLeave={() => setHover(-1)}
            >
              <svg viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gx-fa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#33CCFF" stopOpacity=".34" />
                    <stop offset="1" stopColor="#33CCFF" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gx-fb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FF33FF" stopOpacity=".2" />
                    <stop offset="1" stopColor="#FF33FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="gx-area a2" d={areaPath(1)} />
                <path className="gx-area a1" d={areaPath(0)} />
                <polyline className="gx-line l2" points={polyPoints(1)} />
                <polyline className="gx-line l1" points={polyPoints(0)} />
              </svg>
              <i className="gx-cx" id="gx-cx" style={markerYs ? { left: markerX + "%" } : undefined}></i>
              <i className="gx-cy" id="gx-cy" style={markerYs ? { top: markerYs[0] + "%", width: markerX + "%" } : undefined}></i>
              <i className="gx-dot d2" id="gx-d2" style={dotStyle(1)}></i>
              <i className="gx-dot d1" id="gx-d1" style={dotStyle(0)}></i>
              <div className="gx-tip" id="gx-tip" ref={tipRef}>
                <div className="gx-tip-a">
                  <b id="gx-tip-a" className={dnClass(tipValues[0])}>{pct(tipValues[0])}</b>
                  <span>wolf_of_fx</span>
                </div>
                <div className="gx-tip-b">
                  <span>bear_hunter</span>
                  <b id="gx-tip-b" className={dnClass(tipValues[1])}>{pct(tipValues[1])}</b>
                </div>
                <time id="gx-tip-t">{tipTime}</time>
              </div>
            </div>
            <div className="gx-xaxis" id="gx-x">
              {xLabels.map((label, t) => (
                <span key={t}>{label}</span>
              ))}
            </div>
          </div>

          <ol className="gx-board" id="gx-board" aria-label="Battle leaderboard">
            {model &&
              boardOrder.map((p, rank) => (
                <li key={GX_NAMES[p]} className={rank === 0 ? "top" : undefined}>
                  <span>{pad(rank + 1)}</span>
                  <span>{GX_NAMES[p]}</span>
                  <b className={dnClass(scores[p])}>{pct(scores[p])}</b>
                </li>
              ))}
          </ol>
          <p className="gx-note">Example battle — illustrative data, not real accounts.</p>
        </div>
      </div>
    </div>
  );
}
