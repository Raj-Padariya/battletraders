"use client";

/* Candlestick chart for the Personal Arena. History is a seeded random walk per symbol + timeframe,
   rescaled so it ends at the live simulated price; the last candle then follows the price feed.
   Remount it (key) when the symbol or timeframe changes. */
import { useEffect, useRef, useState } from "react";

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface Props {
  sym: string;
  tf: string;
  digits: number;
  vol: number;
  price: number;
}

const TF_MIN: Record<string, number> = { "1m": 1, "5m": 5, "15m": 15, "1H": 60, "4H": 240, "1D": 1440, "1W": 10080 };
const COUNT = 90;
const AXIS_W = 76;
const AXIS_H = 24;
const PAD_T = 34;
const PRICE_TICKS = 5;

const seeded = (key: string) => {
  let s = 0;
  for (let n = 0; n < key.length; n++) s = (Math.imul(s, 31) + key.charCodeAt(n)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildHistory = (sym: string, tf: string, vol: number, anchor: number, now: number): Candle[] => {
  const rand = seeded(sym + "|" + tf);
  const minutes = TF_MIN[tf] || 60;
  const step = Math.min(vol * Math.sqrt(minutes) * 3, 0.04);
  const frame = minutes * 60000;
  const start = Math.floor(now / frame) * frame;
  const raw: Candle[] = [];
  let px = 1;
  for (let n = 0; n < COUNT; n++) {
    const move = (rand() - 0.5) * 2 * step + Math.sin(n / 9) * step * 0.25;
    const o = px;
    const c = o * (1 + move);
    const h = Math.max(o, c) * (1 + rand() * step * 0.6);
    const l = Math.min(o, c) * (1 - rand() * step * 0.6);
    raw.push({ t: start - (COUNT - 1 - n) * frame, o, h, l, c });
    px = c;
  }
  const scale = anchor / px;
  return raw.map((r) => ({ t: r.t, o: r.o * scale, h: r.h * scale, l: r.l * scale, c: r.c * scale }));
};

const fmtTick = (t: number, tf: string): string => {
  const d = new Date(t);
  if ((TF_MIN[tf] || 60) >= 1440) return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

export default function ArenaChart({ sym, tf, digits, vol, price }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [history] = useState(() => buildHistory(sym, tf, vol, price, Date.now()));
  const [live, setLive] = useState({ h: price, l: price });
  if (price > live.h || price < live.l) setLive({ h: Math.max(live.h, price), l: Math.min(live.l, price) });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prev = history[history.length - 1];
  const candles: Candle[] = [...history.slice(0, -1), { ...prev, c: price, h: Math.max(prev.h, live.h), l: Math.min(prev.l, live.l) }];

  const { w, h } = size;
  const plotW = w - AXIS_W;
  const plotH = h - AXIS_H - PAD_T;
  const ready = plotW > 40 && plotH > 40;

  let hi = -Infinity;
  let lo = Infinity;
  candles.forEach((k) => {
    hi = Math.max(hi, k.h);
    lo = Math.min(lo, k.l);
  });
  const padY = (hi - lo) * 0.08 || price * 0.001;
  hi += padY;
  lo -= padY;
  const y = (v: number) => PAD_T + ((hi - v) / (hi - lo)) * plotH;
  const slot = plotW / candles.length;
  const bodyW = Math.max(1, slot * 0.62);
  const labelEvery = Math.max(1, Math.ceil(candles.length / Math.max(2, Math.floor(plotW / 110))));
  const last = candles[candles.length - 1];
  const lastUp = last.c >= last.o;
  const lastY = y(price);

  return (
    <div className="pa-cx" ref={boxRef}>
      {ready ? (
        <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} role="img" aria-label={sym + " " + tf + " candlestick chart, simulated prices"}>
          {Array.from({ length: PRICE_TICKS }, (_, n) => {
            const v = hi - ((hi - lo) * (n + 1)) / (PRICE_TICKS + 1);
            const ty = y(v);
            return (
              <g key={"p" + n}>
                <line className="pa-cx-grid" x1={0} x2={plotW} y1={ty} y2={ty} />
                <text className="pa-cx-txt" x={plotW + 10} y={ty + 4}>{v.toFixed(digits)}</text>
              </g>
            );
          })}
          {candles.map((k, n) =>
            n % labelEvery === 0 ? (
              <g key={"t" + n}>
                <line className="pa-cx-grid" x1={slot * n + slot / 2} x2={slot * n + slot / 2} y1={PAD_T} y2={PAD_T + plotH} />
                <text className="pa-cx-txt" x={slot * n + slot / 2} y={h - 8} textAnchor="middle">{fmtTick(k.t, tf)}</text>
              </g>
            ) : null,
          )}
          <line className="pa-cx-axis" x1={plotW} x2={plotW} y1={0} y2={h} />
          <line className="pa-cx-axis" x1={0} x2={w} y1={PAD_T + plotH} y2={PAD_T + plotH} />
          {candles.map((k, n) => {
            const cx = slot * n + slot / 2;
            const top = y(Math.max(k.o, k.c));
            const bottom = y(Math.min(k.o, k.c));
            return (
              <g key={k.t} className={k.c >= k.o ? "pa-cx-up" : "pa-cx-dn"}>
                <line x1={cx} x2={cx} y1={y(k.h)} y2={y(k.l)} />
                <rect x={cx - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} rx={1} />
              </g>
            );
          })}
          <g className={lastUp ? "pa-cx-up" : "pa-cx-dn"}>
            <line className="pa-cx-last" x1={0} x2={plotW} y1={lastY} y2={lastY} />
            <rect x={plotW + 4} y={lastY - 10} width={AXIS_W - 8} height={20} rx={5} />
          </g>
          <text className="pa-cx-tag" x={plotW + AXIS_W / 2} y={lastY + 4} textAnchor="middle">{price.toFixed(digits)}</text>
        </svg>
      ) : null}
    </div>
  );
}
